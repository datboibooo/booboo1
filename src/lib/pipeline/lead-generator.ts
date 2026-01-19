import { getLLMProvider, LLMMessage } from "@/lib/providers/llm";
import {
  LeadRecord,
  UserConfig,
  SignalMatchReport,
} from "@/lib/schemas";
import { ScoredCandidate } from "./scorer";
import {
  generateLinkedInSearchUrl,
  generateLinkedInSearchQuery,
} from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const LeadContentSchema = z.object({
  whyNow: z.string(),
  narrative: z.array(z.string()),
  angles: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      evidenceUrl: z.string(),
    })
  ),
  openerShort: z.string(),
  openerMedium: z.string(),
  personName: z.string().nullable(),
  industry: z.string().nullable(),
  geo: z.string().nullable(),
});

type LeadContent = z.infer<typeof LeadContentSchema>;

const LEAD_GENERATOR_SYSTEM_PROMPT = `You are an expert B2B sales copywriter. Your job is to create compelling, evidence-backed outreach content.

CRITICAL RULES:
1. Every claim in whyNow and narrative MUST be supported by evidence URLs
2. NEVER invent facts - only use information from provided evidence
3. NEVER invent person names - if no name in evidence, set personName to null
4. Do NOT guess industry or geo - only set if clearly indicated in evidence
5. Angles must tie directly to evidence
6. Openers must be professional, concise, and reference specific evidence
7. Cite evidence URLs in narrative bullets using [Source](url) format

OUTPUT FORMAT:
- whyNow: One compelling sentence summarizing why now is the right time (cite evidence)
- narrative: 5-8 bullets summarizing the situation with [Source](url) citations
- angles: 3 outreach angles, each tied to specific evidence
- openerShort: 2-3 sentence opener (under 50 words)
- openerMedium: 4-5 sentence opener (under 100 words)
- personName: Name of person found in evidence, or null
- industry: Industry if clearly indicated, or null
- geo: Geographic location if clearly indicated, or null`;

export async function generateLeadContent(
  candidate: ScoredCandidate,
  config: UserConfig
): Promise<LeadContent> {
  const llm = getLLMProvider();

  const evidenceText = candidate.evidence.chunks
    .map(
      (chunk, i) =>
        `[Evidence ${i + 1}] ${chunk.url}
Type: ${chunk.sourceType}
Content: ${chunk.snippet}`
    )
    .join("\n\n");

  const signalMatchText = candidate.report.matches
    .filter((m) => m.result === "yes")
    .map(
      (m) =>
        `- ${m.signalName}: ${m.reasoning}
  Evidence: ${m.evidenceUrls.join(", ")}`
    )
    .join("\n");

  const messages: LLMMessage[] = [
    { role: "system", content: LEAD_GENERATOR_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Generate lead content for ${candidate.report.companyName} (${candidate.report.domain})

WHAT WE SELL:
${config.offer}

TARGET ROLES:
${config.icp.targetRoles.join(", ")}

TRIGGERED SIGNALS:
${signalMatchText}

EVIDENCE:
${evidenceText}

Create content that:
1. Summarizes why now is the right time based on the signals
2. Builds a narrative from the evidence (5-8 bullets with citations)
3. Suggests 3 outreach angles tied to evidence
4. Writes two opener variants (short and medium)
5. Extracts person name ONLY if found in evidence
6. Determines industry and geo ONLY if clear from evidence

Return a JSON object matching the LeadContent schema.`,
    },
  ];

  try {
    const content = await llm.completeStructured(
      messages,
      {
        schema: LeadContentSchema,
        schemaName: "LeadContent",
        maxRetries: 2,
      },
      { temperature: 0.5 }
    );

    return content;
  } catch (error) {
    console.error(
      `Lead content generation failed for ${candidate.report.domain}:`,
      error
    );

    // Return minimal content on failure
    return {
      whyNow: `${candidate.report.companyName} shows recent activity matching your target signals.`,
      narrative: candidate.report.matches
        .filter((m) => m.result === "yes")
        .slice(0, 5)
        .map((m) => `${m.signalName}: ${m.reasoning}`),
      angles: [],
      openerShort: `I noticed some recent developments at ${candidate.report.companyName} that might be relevant.`,
      openerMedium: `I noticed some recent developments at ${candidate.report.companyName} that align with what we help companies with. Would love to learn more about your current priorities.`,
      personName: null,
      industry: null,
      geo: null,
    };
  }
}

export async function generateLeadRecords(
  candidates: ScoredCandidate[],
  config: UserConfig,
  userId: string,
  date: string,
  options?: {
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<LeadRecord[]> {
  const leads: LeadRecord[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];

    const content = await generateLeadContent(candidate, config);

    const targetTitles = config.icp.targetRoles;
    const linkedinSearchUrl = generateLinkedInSearchUrl(
      candidate.report.companyName,
      candidate.report.domain,
      targetTitles
    );
    const linkedinSearchQuery = generateLinkedInSearchQuery(
      candidate.report.companyName,
      targetTitles
    );

    const triggeredSignals = candidate.report.matches
      .filter((m) => m.result === "yes")
      .map((m) => {
        const signal = config.signals.find((s) => s.id === m.signalId);
        return {
          signalId: m.signalId,
          signalName: m.signalName,
          category: signal?.category || "product_strategy",
          priority: signal?.priority || "medium",
        };
      });

    const evidenceUrls = Array.from(
      new Set(
        candidate.report.matches
          .filter((m) => m.result === "yes")
          .flatMap((m) => m.evidenceUrls)
      )
    );

    const evidenceSnippets = candidate.evidence.chunks
      .slice(0, 5)
      .map((c) => c.snippet);

    const lead: LeadRecord = {
      id: uuidv4(),
      userId,
      date,
      domain: candidate.report.domain,
      companyName: candidate.report.companyName,
      industry: content.industry,
      geo: content.geo,
      score: candidate.score,
      whyNow: content.whyNow,
      triggeredSignals,
      evidenceUrls,
      evidenceSnippets,
      linkedinSearchUrl,
      linkedinSearchQuery,
      targetTitles,
      openerShort: content.openerShort,
      openerMedium: content.openerMedium,
      status: "new",
      personName: content.personName,
      angles: content.angles,
      narrative: content.narrative,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leads.push(lead);

    options?.onProgress?.(i + 1, candidates.length);
  }

  return leads;
}
