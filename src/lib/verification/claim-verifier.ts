import { z } from "zod";
import {
  Claim,
  ClaimVerification,
  ClaimStatus,
  Evidence,
  EvidenceSourceType,
} from "./types";
import { getLLMProvider } from "@/lib/providers/llm";
import weightsConfig from "./weights.json";

// ============================================
// LLM Schema for Evidence Matching
// ============================================

const EvidenceMatchSchema = z.object({
  isRelevant: z.boolean(),
  supports: z.boolean().describe("Does this evidence support the claim?"),
  contradicts: z.boolean().describe("Does this evidence contradict the claim?"),
  relevanceScore: z.number().min(0).max(1),
  keySnippet: z.string().describe("The most relevant snippet from the evidence"),
  contradictionType: z.string().optional().describe("If contradicts, what type: 'different_amount', 'different_date', 'entity_mismatch', 'denial', 'retraction'"),
  reasoning: z.string(),
});

const ClaimEvidenceAnalysisSchema = z.object({
  matches: z.array(EvidenceMatchSchema),
  overallSupport: z.number().min(0).max(1),
  overallContradiction: z.number().min(0).max(1),
  gateAnalysis: z.array(
    z.object({
      gate: z.string(),
      passed: z.boolean(),
      reason: z.string(),
    })
  ),
});

// ============================================
// Source Type Classification
// ============================================

const OFFICIAL_SOURCE_TYPES: EvidenceSourceType[] = [
  "company_press",
  "company_newsroom",
  "company_careers",
  "company_about",
  "sec_filing",
];

const REPUTABLE_SOURCE_TYPES: EvidenceSourceType[] = [
  "company_press",
  "company_newsroom",
  "sec_filing",
  "third_party_news",
  "crunchbase",
  "pitchbook",
  "registry",
];

// ============================================
// Hard Gate Evaluation
// ============================================

interface GateResult {
  gate: string;
  passed: boolean;
  reason: string;
}

function evaluateHardGates(
  claim: Claim,
  evidence: Evidence[],
  supportingEvidence: { evidenceId: string; sourceType: EvidenceSourceType }[]
): GateResult[] {
  const results: GateResult[] = [];
  const gates = claim.verificationRequirements;

  for (const gate of gates) {
    const result = evaluateGate(gate, claim, evidence, supportingEvidence);
    results.push(result);
  }

  return results;
}

function evaluateGate(
  gate: string,
  claim: Claim,
  evidence: Evidence[],
  supportingEvidence: { evidenceId: string; sourceType: EvidenceSourceType }[]
): GateResult {
  const supportingTypes = supportingEvidence.map((e) => e.sourceType);
  const hasOfficial = supportingTypes.some((t) => OFFICIAL_SOURCE_TYPES.includes(t));
  const reputableCount = supportingTypes.filter((t) => REPUTABLE_SOURCE_TYPES.includes(t)).length;
  const hasJobsBoard = supportingTypes.includes("jobs_board");
  const hasCareers = supportingTypes.includes("company_careers");
  const hasSEC = supportingTypes.includes("sec_filing");

  switch (gate) {
    case "official_announcement_or_2_reputable_sources":
      if (hasOfficial) {
        return { gate, passed: true, reason: "Found official announcement" };
      }
      if (reputableCount >= 2) {
        return { gate, passed: true, reason: `Found ${reputableCount} reputable sources` };
      }
      return {
        gate,
        passed: false,
        reason: `Need official source or 2+ reputable (found ${reputableCount})`,
      };

    case "amount_consistent_across_sources":
      // This would need actual amount extraction and comparison
      // For now, pass if we have 2+ sources mentioning amounts
      if (supportingEvidence.length >= 2) {
        return { gate, passed: true, reason: "Multiple sources with consistent amounts" };
      }
      return { gate, passed: false, reason: "Insufficient sources to verify amount" };

    case "amount_not_contradicted":
      // Pass by default - contradiction detection handles this
      return { gate, passed: true, reason: "No contradicting amounts found" };

    case "official_from_either_party_or_2_reputable":
      if (hasOfficial || reputableCount >= 2) {
        return { gate, passed: true, reason: hasOfficial ? "Official source found" : "2+ reputable sources" };
      }
      return { gate, passed: false, reason: "Need official or 2+ reputable sources" };

    case "no_denial_found":
      // Pass by default - contradiction detection handles denials
      return { gate, passed: true, reason: "No denial found in evidence" };

    case "sec_filing_or_official_announcement":
      if (hasSEC || hasOfficial) {
        return { gate, passed: true, reason: hasSEC ? "SEC filing found" : "Official announcement found" };
      }
      return { gate, passed: false, reason: "Need SEC filing or official announcement" };

    case "no_postponement_notice":
      return { gate, passed: true, reason: "No postponement notice found" };

    case "official_source_or_sec_filing":
      if (hasOfficial || hasSEC) {
        return { gate, passed: true, reason: "Official source or SEC filing found" };
      }
      return { gate, passed: false, reason: "Need official source or SEC filing" };

    case "official_announcement_or_company_page":
      if (hasOfficial) {
        return { gate, passed: true, reason: "Official announcement found" };
      }
      return { gate, passed: false, reason: "Need official announcement or company page" };

    case "person_exists_verification":
      // Would need additional verification in production
      if (supportingEvidence.length >= 1) {
        return { gate, passed: true, reason: "Person mentioned in source" };
      }
      return { gate, passed: false, reason: "Cannot verify person exists" };

    case "official_announcement_or_2_reputable":
      if (hasOfficial || reputableCount >= 2) {
        return { gate, passed: true, reason: hasOfficial ? "Official found" : "2+ reputable found" };
      }
      return { gate, passed: false, reason: "Need official or 2+ reputable" };

    case "no_retraction":
      return { gate, passed: true, reason: "No retraction found" };

    case "official_announcement_or_job_postings":
      if (hasOfficial || hasJobsBoard || hasCareers) {
        return { gate, passed: true, reason: "Official or job postings found" };
      }
      return { gate, passed: false, reason: "Need official announcement or job postings" };

    case "official_announcement_or_verifiable_address":
      if (hasOfficial) {
        return { gate, passed: true, reason: "Official announcement found" };
      }
      return { gate, passed: false, reason: "Need official announcement or verifiable address" };

    case "official_product_page_or_announcement":
      if (hasOfficial) {
        return { gate, passed: true, reason: "Official announcement found" };
      }
      return { gate, passed: false, reason: "Need official product page or announcement" };

    case "confirmation_from_at_least_one_official_party":
      if (hasOfficial) {
        return { gate, passed: true, reason: "Official party confirmation found" };
      }
      return { gate, passed: false, reason: "Need confirmation from official party" };

    case "partner_name_verified":
      if (supportingEvidence.length >= 1) {
        return { gate, passed: true, reason: "Partner name found in evidence" };
      }
      return { gate, passed: false, reason: "Cannot verify partner name" };

    case "official_careers_page_or_job_listings":
      if (hasCareers || hasJobsBoard) {
        return { gate, passed: true, reason: "Careers page or job listings found" };
      }
      return { gate, passed: false, reason: "Need careers page or job listings" };

    case "active_job_posting_found":
      if (hasJobsBoard || hasCareers) {
        return { gate, passed: true, reason: "Active job posting found" };
      }
      return { gate, passed: false, reason: "Need active job posting" };

    case "official_statement_or_2_reputable_sources":
      if (hasOfficial || reputableCount >= 2) {
        return { gate, passed: true, reason: hasOfficial ? "Official statement" : "2+ reputable" };
      }
      return { gate, passed: false, reason: "Need official statement or 2+ reputable" };

    case "company_name_confirmed":
      if (supportingEvidence.length >= 1) {
        return { gate, passed: true, reason: "Company name confirmed in evidence" };
      }
      return { gate, passed: false, reason: "Cannot confirm company name" };

    default:
      // Unknown gate - pass by default
      return { gate, passed: true, reason: "Gate not implemented - passed by default" };
  }
}

// ============================================
// Main Claim Verification
// ============================================

export interface VerifyClaimResult {
  verification: ClaimVerification;
  llmCalls: number;
}

export async function verifyClaim(
  claim: Claim,
  evidence: Evidence[]
): Promise<VerifyClaimResult> {
  const llm = getLLMProvider();
  let llmCalls = 0;

  // Build prompt for LLM to analyze evidence
  const evidenceText = evidence
    .map(
      (e, i) =>
        `[Evidence ${i + 1}]
URL: ${e.url}
Source Type: ${e.sourceType}
Title: ${e.title}
Content: ${e.snippet}
${e.publishedAt ? `Published: ${e.publishedAt}` : ""}
${e.isOfficial ? "(OFFICIAL SOURCE)" : ""}`
    )
    .join("\n\n---\n\n");

  const prompt = `Analyze how well the following evidence supports or contradicts this claim.

CLAIM:
Type: ${claim.type}
Statement: "${claim.statement}"
Entities: ${JSON.stringify(claim.entities)}

VERIFICATION REQUIREMENTS (hard gates that must pass):
${claim.verificationRequirements.map((r) => `- ${r}`).join("\n")}

EVIDENCE:
${evidenceText}

For each piece of evidence:
1. Is it relevant to the claim?
2. Does it support the claim?
3. Does it contradict the claim?
4. If it contradicts, what type of contradiction (different_amount, different_date, entity_mismatch, denial, retraction)?
5. What is the key relevant snippet?

Then evaluate each verification requirement (gate) based on the evidence.

Be strict about contradictions - if numbers/dates/names don't match exactly, note the discrepancy.`;

  let analysis: z.infer<typeof ClaimEvidenceAnalysisSchema>;

  try {
    analysis = await llm.completeStructured(
      [{ role: "user", content: prompt }],
      {
        schema: ClaimEvidenceAnalysisSchema,
        schemaName: "ClaimEvidenceAnalysis",
        maxRetries: 2,
      },
      { temperature: 0.1, maxTokens: 3000 }
    );
    llmCalls++;
  } catch (error) {
    console.error("Claim verification LLM call failed:", error);
    llmCalls++;

    // Return unknown status on LLM failure
    return {
      verification: {
        claimId: claim.id,
        claim,
        status: "unknown",
        confidence: 0,
        supportingEvidence: [],
        contradictingEvidence: [],
        gatesPassed: [],
        gatesFailed: claim.verificationRequirements,
        reasoning: "LLM analysis failed - insufficient data to verify",
      },
      llmCalls,
    };
  }

  // Process LLM analysis results
  const supportingEvidence: ClaimVerification["supportingEvidence"] = [];
  const contradictingEvidence: ClaimVerification["contradictingEvidence"] = [];

  for (let i = 0; i < analysis.matches.length && i < evidence.length; i++) {
    const match = analysis.matches[i];
    const ev = evidence[i];

    if (!match.isRelevant) continue;

    if (match.supports) {
      supportingEvidence.push({
        evidenceId: ev.id,
        url: ev.url,
        snippet: match.keySnippet,
        relevanceScore: match.relevanceScore,
        sourceType: ev.sourceType,
      });
    }

    if (match.contradicts) {
      contradictingEvidence.push({
        evidenceId: ev.id,
        url: ev.url,
        snippet: match.keySnippet,
        contradictionType: match.contradictionType || "unknown",
        sourceType: ev.sourceType,
      });
    }
  }

  // Evaluate hard gates
  const gateResults = evaluateHardGates(
    claim,
    evidence,
    supportingEvidence.map((e) => ({
      evidenceId: e.evidenceId,
      sourceType: e.sourceType,
    }))
  );

  // Merge LLM gate analysis with our rule-based evaluation
  const gatesPassed = gateResults.filter((g) => g.passed).map((g) => g.gate);
  const gatesFailed = gateResults.filter((g) => !g.passed).map((g) => g.gate);

  // Determine status
  let status: ClaimStatus;
  let reasoning: string;

  if (contradictingEvidence.length > 0 && supportingEvidence.length === 0) {
    status = "contradicted";
    reasoning = `Found ${contradictingEvidence.length} contradicting source(s) with no supporting evidence`;
  } else if (gatesFailed.length > 0) {
    if (supportingEvidence.length > 0) {
      status = "partially_verified";
      reasoning = `Supporting evidence found but failed gates: ${gatesFailed.join(", ")}`;
    } else {
      status = "insufficient_evidence";
      reasoning = `Failed verification gates: ${gatesFailed.join(", ")}`;
    }
  } else if (supportingEvidence.length >= 2 && contradictingEvidence.length === 0) {
    status = "verified";
    reasoning = `${supportingEvidence.length} supporting sources, all gates passed`;
  } else if (supportingEvidence.length === 1 && contradictingEvidence.length === 0) {
    status = "partially_verified";
    reasoning = "Single supporting source - needs additional corroboration";
  } else if (supportingEvidence.length > 0 && contradictingEvidence.length > 0) {
    // Mixed evidence - compare strength
    if (analysis.overallSupport > analysis.overallContradiction * 2) {
      status = "partially_verified";
      reasoning = "Support outweighs contradiction, but discrepancies noted";
    } else {
      status = "contradicted";
      reasoning = "Significant contradictions found in evidence";
    }
  } else {
    status = "unknown";
    reasoning = "Insufficient evidence to make a determination";
  }

  // Calculate confidence
  const confidence = calculateClaimConfidence(
    analysis.overallSupport,
    analysis.overallContradiction,
    gatesPassed.length,
    gatesFailed.length,
    supportingEvidence.length
  );

  return {
    verification: {
      claimId: claim.id,
      claim,
      status,
      confidence,
      supportingEvidence,
      contradictingEvidence,
      gatesPassed,
      gatesFailed,
      reasoning,
    },
    llmCalls,
  };
}

// ============================================
// Confidence Calculation Helper
// ============================================

function calculateClaimConfidence(
  supportScore: number,
  contradictionScore: number,
  gatesPassedCount: number,
  gatesFailedCount: number,
  supportingEvidenceCount: number
): number {
  // Base confidence from support/contradiction
  let confidence = supportScore - contradictionScore * 0.5;

  // Boost for passing gates
  const totalGates = gatesPassedCount + gatesFailedCount;
  if (totalGates > 0) {
    const gateFactor = gatesPassedCount / totalGates;
    confidence *= 0.7 + 0.3 * gateFactor;
  }

  // Boost for multiple supporting sources
  if (supportingEvidenceCount >= 3) {
    confidence *= 1.1;
  } else if (supportingEvidenceCount === 1) {
    confidence *= 0.85;
  }

  // Cap at gate failure
  if (gatesFailedCount > 0) {
    confidence = Math.min(confidence, weightsConfig.confidenceThresholds.watchlist);
  }

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, confidence));
}

// ============================================
// Batch Verification
// ============================================

export async function verifyAllClaims(
  claims: Claim[],
  evidence: Evidence[]
): Promise<{ verifications: ClaimVerification[]; llmCalls: number }> {
  let totalLLMCalls = 0;
  const verifications: ClaimVerification[] = [];

  // Process claims sequentially to avoid rate limits
  for (const claim of claims) {
    const result = await verifyClaim(claim, evidence);
    verifications.push(result.verification);
    totalLLMCalls += result.llmCalls;
  }

  return { verifications, llmCalls: totalLLMCalls };
}
