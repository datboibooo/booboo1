import { getLLMProvider, LLMMessage } from "@/lib/providers/llm";
import {
  SignalMatchReportSchema,
  SignalMatchReport,
  SignalDefinition,
  EvidenceChunk,
  CandidateCompany,
} from "@/lib/schemas";
import { FetchedEvidence } from "./evidence-fetcher";

const SIGNAL_EVALUATOR_SYSTEM_PROMPT = `You are an expert B2B signal evaluator. Your job is to evaluate whether a company exhibits specific buying signals based ONLY on the provided evidence.

CRITICAL ANTI-HALLUCINATION RULES:
1. You may ONLY assert a signal match if the evidence chunks EXPLICITLY support it
2. If uncertain, mark the signal as "unknown" - do NOT guess
3. NEVER invent or assume facts not present in evidence
4. NEVER fabricate funding amounts, headcount, or other numbers unless explicitly in evidence
5. NEVER invent person names - only use names if they appear in the evidence
6. Every "yes" result MUST cite the exact evidence URL and snippet that supports it
7. If multiple evidence pieces support a signal, cite all of them
8. Disqualifier signals should be evaluated strictly - if ANY evidence suggests a disqualifier, mark it

CONFIDENCE SCORING:
- 0.9-1.0: Evidence explicitly states the signal condition
- 0.7-0.8: Evidence strongly implies the signal
- 0.5-0.6: Evidence somewhat suggests the signal (border case)
- Below 0.5: Not enough evidence, mark as "unknown"

OUTPUT: Return a SignalMatchReport JSON with all signals evaluated.`;

export async function evaluateSignals(
  candidate: CandidateCompany,
  evidence: FetchedEvidence,
  signals: SignalDefinition[]
): Promise<SignalMatchReport> {
  const llm = getLLMProvider();

  const enabledSignals = signals.filter((s) => s.enabled);
  const disqualifiers = enabledSignals.filter((s) => s.isDisqualifier);
  const regularSignals = enabledSignals.filter((s) => !s.isDisqualifier);

  const formattedEvidence = evidence.chunks
    .map(
      (chunk, i) =>
        `[Evidence ${i + 1}]
URL: ${chunk.url}
Source Type: ${chunk.sourceType}
Date: ${chunk.fetchedAt}
Content: ${chunk.snippet}`
    )
    .join("\n\n");

  const formattedSignals = [...regularSignals, ...disqualifiers]
    .map(
      (s, i) =>
        `${i + 1}. [${s.id}] ${s.name} (${s.priority}${s.isDisqualifier ? ", DISQUALIFIER" : ""})
   Question: ${s.question.replace("{account}", candidate.companyName)}
   Look for: ${s.queryTemplates.join(", ")}`
    )
    .join("\n\n");

  const messages: LLMMessage[] = [
    { role: "system", content: SIGNAL_EVALUATOR_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Evaluate signals for ${candidate.companyName} (${candidate.domain}) based on the evidence provided.

COMPANY:
Name: ${candidate.companyName}
Domain: ${candidate.domain}

EVIDENCE (${evidence.chunks.length} chunks):
${formattedEvidence || "No evidence chunks available - mark all signals as unknown."}

SIGNALS TO EVALUATE:
${formattedSignals}

For each signal:
1. Determine if evidence supports "yes", contradicts "no", or is insufficient "unknown"
2. If "yes", cite the exact evidence URLs and relevant snippets
3. Include your reasoning
4. Set confidence based on evidence strength

CRITICAL: Do NOT claim "yes" without explicit evidence support. When in doubt, use "unknown".

Return a SignalMatchReport JSON with:
- domain: "${candidate.domain}"
- companyName: "${candidate.companyName}"
- matches: Array of SignalMatch objects for each signal
- overallConfidence: Average confidence across positive matches
- disqualified: true if any disqualifier signal matched
- disqualifierReason: Explanation if disqualified`,
    },
  ];

  try {
    const report = await llm.completeStructured(
      messages,
      {
        schema: SignalMatchReportSchema,
        schemaName: "SignalMatchReport",
        maxRetries: 3,
      },
      { temperature: 0.2 }
    );

    // Post-process to ensure evidence integrity
    return validateReport(report, evidence);
  } catch (error) {
    console.error(`Signal evaluation failed for ${candidate.domain}:`, error);

    // Return empty report on failure
    return {
      domain: candidate.domain,
      companyName: candidate.companyName,
      matches: signals.map((s) => ({
        signalId: s.id,
        signalName: s.name,
        result: "unknown" as const,
        confidence: 0,
        evidenceUrls: [],
        evidenceSnippets: [],
        reasoning: "Evaluation failed",
      })),
      overallConfidence: 0,
      disqualified: false,
      disqualifierReason: null,
    };
  }
}

function validateReport(
  report: SignalMatchReport,
  evidence: FetchedEvidence
): SignalMatchReport {
  const validEvidenceUrls = new Set(evidence.chunks.map((c) => c.url));

  // Validate that cited evidence actually exists
  const validatedMatches = report.matches.map((match) => {
    if (match.result === "yes") {
      // Filter to only valid evidence URLs
      const validUrls = match.evidenceUrls.filter((url) =>
        validEvidenceUrls.has(url)
      );

      // If no valid evidence, demote to unknown
      if (validUrls.length === 0) {
        return {
          ...match,
          result: "unknown" as const,
          confidence: 0,
          evidenceUrls: [],
          evidenceSnippets: [],
          reasoning: `${match.reasoning} [DEMOTED: No valid evidence found]`,
        };
      }

      return {
        ...match,
        evidenceUrls: validUrls,
      };
    }

    return match;
  });

  // Recalculate overall confidence
  const positiveMatches = validatedMatches.filter((m) => m.result === "yes");
  const overallConfidence =
    positiveMatches.length > 0
      ? positiveMatches.reduce((sum, m) => sum + m.confidence, 0) /
        positiveMatches.length
      : 0;

  return {
    ...report,
    matches: validatedMatches,
    overallConfidence,
  };
}

export async function evaluateBatch(
  candidates: Array<{ candidate: CandidateCompany; evidence: FetchedEvidence }>,
  signals: SignalDefinition[],
  options?: {
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<SignalMatchReport[]> {
  const reports: SignalMatchReport[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const { candidate, evidence } = candidates[i];
    const report = await evaluateSignals(candidate, evidence, signals);
    reports.push(report);

    options?.onProgress?.(i + 1, candidates.length);
  }

  return reports;
}
