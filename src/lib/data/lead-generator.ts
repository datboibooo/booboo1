import { v4 as uuidv4 } from "uuid";
import { LeadRecord } from "@/lib/schemas";
import { fetchAllSources, RSSItem } from "./rss-fetcher";
import { extractSignalsFromItems, signalToLead, ExtractedSignal } from "./signal-extractor";
import { getLLMProvider } from "@/lib/providers/llm";
import { z } from "zod";
import { verifySignal, VerificationResult } from "@/lib/verification";

// Schema for opener generation
const OpenerSchema = z.object({
  short: z.string().describe("A brief 1-2 sentence opener for cold outreach"),
  medium: z.string().describe("A 2-3 sentence opener with more context"),
});

// Generate personalized openers for a lead
async function generateOpeners(
  companyName: string,
  signalDetails: string,
  whyNow: string
): Promise<{ short: string; medium: string }> {
  const llm = getLLMProvider();

  const prompt = `Generate cold outreach openers for a B2B sales email.

Company: ${companyName}
Recent Signal: ${signalDetails}
Why Now: ${whyNow}

Write two versions:
1. Short (1-2 sentences): A quick, punchy opener that references the signal
2. Medium (2-3 sentences): Slightly more detailed with context

Be conversational, not salesy. Reference the specific signal. Don't mention your product.`;

  try {
    const result = await llm.completeStructured(
      [{ role: "user", content: prompt }],
      {
        schema: OpenerSchema,
        schemaName: "Opener",
        maxRetries: 2,
      },
      { temperature: 0.7 }
    );
    return result;
  } catch {
    // Fallback openers
    return {
      short: `Hi, I noticed ${companyName}'s recent ${signalDetails.slice(0, 50)}. Would love to connect.`,
      medium: `Hi, I came across news about ${companyName}. ${whyNow} I'd be curious to hear how you're thinking about growth during this time.`,
    };
  }
}

// Extended lead with verification data
export interface VerifiedLead extends LeadRecord {
  verification?: {
    status: "verified" | "watchlist" | "discard";
    confidence: number;
    confidenceBand: "high" | "medium" | "low" | "unknown";
    topEvidence: { url: string; snippet: string }[];
    claimsVerified: number;
    claimsContradicted: number;
  };
}

// Main function to generate leads from RSS feeds
export async function generateLeadsFromRSS(options?: {
  maxItems?: number;
  skipOpeners?: boolean;
  enableVerification?: boolean;
  verificationMinConfidence?: number;
}): Promise<{
  leads: VerifiedLead[];
  stats: {
    rssItemsFetched: number;
    signalsExtracted: number;
    leadsGenerated: number;
    leadsVerified?: number;
    leadsDiscarded?: number;
    processingTimeMs: number;
  };
}> {
  const startTime = Date.now();
  const maxItems = options?.maxItems || 20;
  const enableVerification = options?.enableVerification ?? false;
  const minConfidence = options?.verificationMinConfidence ?? 0.45;

  // Step 1: Fetch RSS items
  console.log("Fetching RSS feeds...");
  const rssItems = await fetchAllSources();
  console.log(`Fetched ${rssItems.length} RSS items with potential signals`);

  if (rssItems.length === 0) {
    return {
      leads: [],
      stats: {
        rssItemsFetched: 0,
        signalsExtracted: 0,
        leadsGenerated: 0,
        ...(enableVerification && { leadsVerified: 0, leadsDiscarded: 0 }),
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  // Step 2: Extract signals using LLM
  console.log("Extracting signals with LLM...");
  const signals = await extractSignalsFromItems(rssItems, maxItems);
  console.log(`Extracted ${signals.length} valid signals`);

  // Step 3: Convert signals to leads
  const leads: VerifiedLead[] = [];
  const today = new Date().toISOString().split("T")[0];
  let leadsVerified = 0;
  let leadsDiscarded = 0;

  for (let i = 0; i < signals.length; i++) {
    const signal = signals[i];
    // Find the matching RSS item (approximate match by checking if title contains company name)
    const matchingItem = rssItems.find((item) =>
      item.title.toLowerCase().includes(signal.companyName.toLowerCase().split(" ")[0])
    ) || rssItems[i];

    if (!matchingItem) continue;

    const leadData = signalToLead(signal, matchingItem);

    // Step 3a: Verify signal if enabled
    let verification: VerifiedLead["verification"] | undefined;
    if (enableVerification) {
      console.log(`Verifying signal for ${signal.companyName}...`);
      try {
        const verificationResult = await verifySignal({
          company: signal.companyName,
          domain: signal.domain,
          rawSignal: {
            type: signal.signalType,
            details: signal.signalDetails,
            relevanceScore: signal.relevanceScore,
          },
          rssItem: {
            title: matchingItem.title,
            link: matchingItem.link,
            content: matchingItem.content,
            contentSnippet: matchingItem.contentSnippet,
            pubDate: matchingItem.pubDate,
            sourceName: matchingItem.sourceName,
          },
        });

        verification = {
          status: verificationResult.overallStatus,
          confidence: verificationResult.overallConfidence,
          confidenceBand: verificationResult.confidenceBand,
          topEvidence: verificationResult.topSupportingEvidence.slice(0, 3).map((e) => ({
            url: e.url,
            snippet: e.snippet,
          })),
          claimsVerified: verificationResult.claimVerifications.filter(
            (c) => c.status === "verified"
          ).length,
          claimsContradicted: verificationResult.claimVerifications.filter(
            (c) => c.status === "contradicted"
          ).length,
        };

        // Skip leads that fail verification
        if (verificationResult.overallStatus === "discard") {
          leadsDiscarded++;
          console.log(`Discarding ${signal.companyName}: ${verificationResult.statusReason}`);
          continue;
        }

        // Skip leads below minimum confidence
        if (verificationResult.overallConfidence < minConfidence) {
          leadsDiscarded++;
          console.log(
            `Discarding ${signal.companyName}: confidence ${(verificationResult.overallConfidence * 100).toFixed(0)}% below threshold`
          );
          continue;
        }

        leadsVerified++;

        // Adjust score based on verification confidence
        leadData.score = Math.round(
          leadData.score * (0.7 + verificationResult.overallConfidence * 0.3)
        );

        // Add verified evidence URLs
        if (verificationResult.topSupportingEvidence.length > 0) {
          leadData.evidenceUrls = verificationResult.topSupportingEvidence.map((e) => e.url);
          leadData.evidenceSnippets = verificationResult.topSupportingEvidence.map((e) => e.snippet);
        }
      } catch (error) {
        console.error(`Verification failed for ${signal.companyName}:`, error);
        // Continue without verification data on error
      }
    }

    // Generate openers (can be skipped for faster processing)
    let openers = { short: "", medium: "" };
    if (!options?.skipOpeners) {
      openers = await generateOpeners(
        signal.companyName,
        signal.signalDetails,
        signal.whyNow
      );
    } else {
      openers = {
        short: `Hi, I noticed ${signal.companyName}'s recent news. Would love to connect.`,
        medium: `Hi, I came across ${signal.companyName}'s recent ${signal.signalDetails.slice(0, 100)}. ${signal.whyNow}`,
      };
    }

    const lead: VerifiedLead = {
      id: uuidv4(),
      userId: "system",
      date: today,
      domain: leadData.domain,
      companyName: leadData.companyName,
      industry: leadData.industry,
      geo: leadData.geo,
      score: leadData.score,
      whyNow: leadData.whyNow,
      triggeredSignals: leadData.triggeredSignals,
      evidenceUrls: leadData.evidenceUrls,
      evidenceSnippets: leadData.evidenceSnippets,
      linkedinSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(signal.companyName + " " + leadData.targetTitles[0])}`,
      linkedinSearchQuery: `"${signal.companyName}" "${leadData.targetTitles[0]}"`,
      targetTitles: leadData.targetTitles,
      openerShort: openers.short,
      openerMedium: openers.medium,
      status: "new",
      personName: signal.keyPeople?.[0] || null,
      angles: [
        {
          title: formatSignalName(signal.signalType) + " Angle",
          description: signal.signalDetails,
          evidenceUrl: matchingItem.link,
        },
      ],
      narrative: [
        `${signal.companyName} recently ${signal.signalDetails.toLowerCase()}. [Source](${matchingItem.link})`,
        signal.industry ? `The company operates in the ${signal.industry} space.` : "",
        signal.location ? `Based in ${signal.location}.` : "",
        signal.whyNow,
        verification?.confidence && verification.confidence > 0.7
          ? `✓ Signal verified with ${(verification.confidence * 100).toFixed(0)}% confidence`
          : "",
      ].filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verification,
    };

    leads.push(lead);
  }

  // Sort by score (verified leads with higher confidence ranked higher)
  leads.sort((a, b) => {
    // Verified leads first
    if (a.verification && !b.verification) return -1;
    if (!a.verification && b.verification) return 1;
    // Then by score
    return b.score - a.score;
  });

  return {
    leads,
    stats: {
      rssItemsFetched: rssItems.length,
      signalsExtracted: signals.length,
      leadsGenerated: leads.length,
      ...(enableVerification && { leadsVerified, leadsDiscarded }),
      processingTimeMs: Date.now() - startTime,
    },
  };
}

function formatSignalName(signalType: string): string {
  const names: Record<string, string> = {
    funding_round: "Funding",
    acquisition: "M&A",
    ipo: "IPO",
    leadership_change: "Leadership",
    expansion: "Expansion",
    product_launch: "Product Launch",
    partnership: "Partnership",
    hiring: "Hiring",
    other: "News",
  };
  return names[signalType] || signalType;
}

// Quick test function
export async function testLeadGeneration(): Promise<{
  success: boolean;
  message: string;
  sampleLead?: LeadRecord;
}> {
  try {
    const result = await generateLeadsFromRSS({ maxItems: 3, skipOpeners: true });
    return {
      success: true,
      message: `Generated ${result.leads.length} leads in ${result.stats.processingTimeMs}ms`,
      sampleLead: result.leads[0],
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed: ${error}`,
    };
  }
}
