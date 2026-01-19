import { z } from "zod";
import { getLLMProvider } from "@/lib/providers/llm";
import { RSSItem } from "./rss-fetcher";
import { SIGNAL_PRIORITIES } from "./rss-sources";
import { SignalCategory, SignalPriority } from "@/lib/schemas";

// Schema for extracted signal
export const ExtractedSignalSchema = z.object({
  companyName: z.string().describe("The company name mentioned in the article"),
  domain: z.string().optional().describe("Company website domain if mentioned"),
  signalType: z.enum([
    "funding_round",
    "acquisition",
    "ipo",
    "leadership_change",
    "expansion",
    "product_launch",
    "partnership",
    "hiring",
    "other",
  ]),
  signalDetails: z.string().describe("Specific details about the signal (e.g., '$50M Series B led by Sequoia')"),
  industry: z.string().optional().describe("Industry or sector of the company"),
  location: z.string().optional().describe("Geographic location if mentioned"),
  keyPeople: z.array(z.string()).optional().describe("Names of key people mentioned (CEOs, founders, etc.)"),
  relevanceScore: z.number().min(1).max(10).describe("How relevant is this for B2B sales outreach (1-10)"),
  whyNow: z.string().describe("One sentence explaining why this is a good time to reach out"),
});

export type ExtractedSignal = z.infer<typeof ExtractedSignalSchema>;

// Schema for batch extraction
const BatchExtractionSchema = z.object({
  signals: z.array(ExtractedSignalSchema),
});

// Extract signals from a single RSS item
export async function extractSignalFromItem(item: RSSItem): Promise<ExtractedSignal | null> {
  const llm = getLLMProvider();

  const prompt = `Analyze this news article and extract B2B sales intelligence signals.

Title: ${item.title}

Content: ${item.contentSnippet}

Source: ${item.sourceName}
Published: ${item.pubDate}

Extract information about any company mentioned that could be a potential B2B sales prospect.
Focus on signals like: funding rounds, acquisitions, new executives, expansion, product launches, partnerships.

If this article doesn't contain actionable B2B sales intelligence, return null for companyName.`;

  try {
    const result = await llm.completeStructured(
      [{ role: "user", content: prompt }],
      {
        schema: ExtractedSignalSchema,
        schemaName: "ExtractedSignal",
        maxRetries: 2,
      },
      { temperature: 0.2 }
    );

    // Skip if no company identified
    if (!result.companyName || result.companyName === "null") {
      return null;
    }

    return result;
  } catch (error) {
    console.error("Failed to extract signal:", error);
    return null;
  }
}

// Batch extract signals from multiple items (more efficient)
export async function extractSignalsFromItems(
  items: RSSItem[],
  maxItems: number = 10
): Promise<ExtractedSignal[]> {
  const llm = getLLMProvider();
  const batch = items.slice(0, maxItems);

  const articlesText = batch
    .map(
      (item, i) =>
        `[Article ${i + 1}]
Title: ${item.title}
Content: ${item.contentSnippet}
Source: ${item.sourceName}
URL: ${item.link}
Published: ${item.pubDate}
`
    )
    .join("\n---\n");

  const prompt = `Analyze these news articles and extract B2B sales intelligence signals.

${articlesText}

For each article that contains actionable B2B sales intelligence, extract:
- Company name and domain
- Signal type (funding, acquisition, expansion, etc.)
- Specific details
- Why this is a good time for sales outreach

Skip articles that don't contain useful B2B sales signals.
Return an array of extracted signals.`;

  try {
    const result = await llm.completeStructured(
      [{ role: "user", content: prompt }],
      {
        schema: BatchExtractionSchema,
        schemaName: "BatchExtraction",
        maxRetries: 2,
      },
      { temperature: 0.2, maxTokens: 4000 }
    );

    // Filter out invalid results
    return result.signals.filter(
      (s) => s.companyName && s.companyName !== "null" && s.relevanceScore >= 5
    );
  } catch (error) {
    console.error("Failed to batch extract signals:", error);
    return [];
  }
}

// Convert extracted signal to lead format
export function signalToLead(
  signal: ExtractedSignal,
  sourceItem: RSSItem
): {
  companyName: string;
  domain: string;
  industry: string | null;
  geo: string | null;
  score: number;
  whyNow: string;
  triggeredSignals: {
    signalId: string;
    signalName: string;
    category: SignalCategory;
    priority: SignalPriority;
  }[];
  evidenceUrls: string[];
  evidenceSnippets: string[];
  targetTitles: string[];
} {
  const priority = SIGNAL_PRIORITIES[signal.signalType] || "medium";
  const baseScore =
    priority === "high" ? 80 : priority === "medium" ? 60 : 40;
  const score = Math.min(
    100,
    baseScore + signal.relevanceScore * 2
  );

  return {
    companyName: signal.companyName,
    domain: signal.domain || guessDomainFromName(signal.companyName),
    industry: signal.industry || null,
    geo: signal.location || null,
    score,
    whyNow: signal.whyNow,
    triggeredSignals: [
      {
        signalId: `sig_${signal.signalType}`,
        signalName: formatSignalName(signal.signalType),
        category: getSignalCategory(signal.signalType) as SignalCategory,
        priority,
      },
    ],
    evidenceUrls: [sourceItem.link],
    evidenceSnippets: [signal.signalDetails],
    targetTitles: getTargetTitles(signal.signalType),
  };
}

// Helper functions
function guessDomainFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) + ".com";
}

function formatSignalName(signalType: string): string {
  const names: Record<string, string> = {
    funding_round: "Recent Funding",
    acquisition: "M&A Activity",
    ipo: "IPO Activity",
    leadership_change: "New Executive",
    expansion: "Geographic Expansion",
    product_launch: "Product Launch",
    partnership: "New Partnership",
    hiring: "Aggressive Hiring",
    other: "Company News",
  };
  return names[signalType] || signalType;
}

function getSignalCategory(signalType: string): SignalCategory {
  const categories: Record<string, SignalCategory> = {
    funding_round: "funding_corporate",
    acquisition: "funding_corporate",
    ipo: "funding_corporate",
    leadership_change: "leadership_org",
    expansion: "expansion_partnerships",
    product_launch: "product_strategy",
    partnership: "expansion_partnerships",
    hiring: "hiring_team",
    other: "funding_corporate", // Default to funding_corporate
  };
  return categories[signalType] || "funding_corporate";
}

function getTargetTitles(signalType: string): string[] {
  const titles: Record<string, string[]> = {
    funding_round: ["VP of Sales", "CRO", "Head of Growth"],
    acquisition: ["VP of Operations", "CTO", "CEO"],
    leadership_change: ["New Executive", "CEO", "CRO"],
    expansion: ["VP of Sales", "Head of International", "CRO"],
    product_launch: ["VP of Marketing", "CPO", "Head of Product"],
    partnership: ["VP of BD", "Head of Partnerships", "CRO"],
    hiring: ["VP of HR", "Head of Talent", "CHRO"],
    other: ["VP of Sales", "Head of Growth"],
  };
  return titles[signalType] || ["VP of Sales", "Head of Growth"];
}
