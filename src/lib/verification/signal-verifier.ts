import {
  VerifySignalInput,
  VerifySignalInputSchema,
  VerificationResult,
  CompanyIdentity,
  ConfidenceBand,
} from "./types";
import { collectEvidence } from "./evidence-collector";
import { extractClaims, mergeSimilarClaims } from "./claim-extractor";
import { verifyAllClaims } from "./claim-verifier";
import {
  calculateOverallConfidence,
  explainConfidence,
} from "./confidence-calculator";
import { getVerificationCacheStats, hashClaim, getCachedClaim, setCachedClaim } from "./cache";

// ============================================
// Version
// ============================================

const VERIFIER_VERSION = "1.0.0";

// ============================================
// Structured Logging
// ============================================

interface VerificationLog {
  stage: string;
  durationMs: number;
  details: Record<string, unknown>;
}

const logs: VerificationLog[] = [];

function logStage(stage: string, startTime: number, details: Record<string, unknown> = {}) {
  logs.push({
    stage,
    durationMs: Date.now() - startTime,
    details,
  });
}

// ============================================
// Main Verification Function
// ============================================

export async function verifySignal(
  input: VerifySignalInput
): Promise<VerificationResult> {
  const startTime = Date.now();
  let llmCallsTotal = 0;

  // Validate input
  const validatedInput = VerifySignalInputSchema.parse(input);

  // Initialize metadata tracking
  const metadata = {
    verifierVersion: VERIFIER_VERSION,
    startedAt: new Date().toISOString(),
    completedAt: "",
    durationMs: 0,
    cacheStats: getVerificationCacheStats(),
    rateLimitStats: {
      exaRequestsMade: 0,
      firecrawlRequestsMade: 0,
      fallbackFetchesMade: 0,
    },
    evidenceSourcesQueried: 0,
    llmCallsMade: 0,
  };

  try {
    // ====================================
    // Stage 1: Evidence Collection
    // ====================================
    const evidenceStart = Date.now();

    const evidenceResult = await collectEvidence({
      company: validatedInput.company,
      domain: validatedInput.domain,
      signalType: validatedInput.rawSignal.type,
      rssArticleUrl: validatedInput.rssItem.link,
      rssArticleContent: validatedInput.rssItem.content,
    });

    metadata.rateLimitStats = evidenceResult.stats;
    metadata.evidenceSourcesQueried = evidenceResult.evidence.length;

    logStage("evidence_collection", evidenceStart, {
      evidenceCount: evidenceResult.evidence.length,
      errors: evidenceResult.errors.length,
    });

    // Check if we have any evidence
    if (evidenceResult.evidence.length === 0) {
      return createFailedResult(
        validatedInput,
        "discard",
        0,
        "No evidence could be collected",
        metadata,
        startTime
      );
    }

    // ====================================
    // Stage 2: Claim Extraction
    // ====================================
    const claimStart = Date.now();

    const extractionResult = await extractClaims({
      company: validatedInput.company,
      domain: validatedInput.domain,
      signalType: validatedInput.rawSignal.type,
      signalDetails: validatedInput.rawSignal.details,
      rssTitle: validatedInput.rssItem.title,
      rssContent: validatedInput.rssItem.contentSnippet,
      rssSource: validatedInput.rssItem.sourceName,
    });

    llmCallsTotal += extractionResult.llmCalls;
    const claims = mergeSimilarClaims(extractionResult.claims);

    logStage("claim_extraction", claimStart, {
      claimsExtracted: claims.length,
      llmCalls: extractionResult.llmCalls,
    });

    // Check if we have claims to verify
    if (claims.length === 0) {
      return createFailedResult(
        validatedInput,
        "discard",
        0,
        "No verifiable claims could be extracted",
        metadata,
        startTime
      );
    }

    // ====================================
    // Stage 3: Check Claim Cache
    // ====================================
    const cacheCheckStart = Date.now();
    const cachedResults = [];

    for (const claim of claims) {
      const claimHash = hashClaim({
        type: claim.type,
        statement: claim.statement,
        entities: claim.entities as Record<string, unknown>,
      });

      const cached = getCachedClaim(validatedInput.company, claimHash);
      if (cached) {
        cachedResults.push({ claim, cached });
      }
    }

    logStage("cache_check", cacheCheckStart, {
      cachedClaims: cachedResults.length,
      uncachedClaims: claims.length - cachedResults.length,
    });

    // ====================================
    // Stage 4: Claim Verification
    // ====================================
    const verifyStart = Date.now();

    const verificationResult = await verifyAllClaims(
      claims,
      evidenceResult.evidence
    );
    llmCallsTotal += verificationResult.llmCalls;

    logStage("claim_verification", verifyStart, {
      claimsVerified: verificationResult.verifications.length,
      llmCalls: verificationResult.llmCalls,
    });

    // Cache verified claims
    for (const verification of verificationResult.verifications) {
      const claimHash = hashClaim({
        type: verification.claim.type,
        statement: verification.claim.statement,
        entities: verification.claim.entities as Record<string, unknown>,
      });

      setCachedClaim(validatedInput.company, claimHash, {
        companyKey: validatedInput.company.toLowerCase(),
        claimHash,
        verificationResult: {
          status: verification.status,
          confidence: verification.confidence,
          topEvidence: verification.supportingEvidence.slice(0, 3).map((e) => ({
            url: e.url,
            snippet: e.snippet,
          })),
        },
        verifiedAt: new Date().toISOString(),
      });
    }

    // ====================================
    // Stage 5: Confidence Calculation
    // ====================================
    const confidenceStart = Date.now();

    const confidenceResult = calculateOverallConfidence(
      verificationResult.verifications,
      evidenceResult.evidence
    );

    const explanation = explainConfidence(
      confidenceResult,
      verificationResult.verifications
    );

    logStage("confidence_calculation", confidenceStart, {
      overallConfidence: confidenceResult.overallConfidence,
      status: confidenceResult.overallStatus,
    });

    // ====================================
    // Stage 6: Build Result
    // ====================================
    metadata.completedAt = new Date().toISOString();
    metadata.durationMs = Date.now() - startTime;
    metadata.llmCallsMade = llmCallsTotal;
    metadata.cacheStats = getVerificationCacheStats();

    // Build company identity
    const companyIdentity: CompanyIdentity = {
      canonicalName: extractionResult.companyIdentity.canonicalName,
      domain: extractionResult.companyIdentity.domain,
      domainConfidence: extractionResult.companyIdentity.domainConfidence,
      aliases: [validatedInput.company],
      identifiedFrom: evidenceResult.evidence.slice(0, 3).map((e) => e.id),
    };

    // Get top evidence
    const topSupportingEvidence = verificationResult.verifications
      .flatMap((v) => v.supportingEvidence)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5)
      .map((e) => {
        const fullEvidence = evidenceResult.evidence.find(
          (ev) => ev.id === e.evidenceId
        );
        return {
          url: e.url,
          title: fullEvidence?.title || "",
          snippet: e.snippet,
          sourceType: e.sourceType,
          relevanceScore: e.relevanceScore,
        };
      });

    const topContradictingEvidence = verificationResult.verifications
      .flatMap((v) => v.contradictingEvidence)
      .slice(0, 3)
      .map((e) => {
        const fullEvidence = evidenceResult.evidence.find(
          (ev) => ev.id === e.evidenceId
        );
        return {
          url: e.url,
          title: fullEvidence?.title || "",
          snippet: e.snippet,
          contradictionType: e.contradictionType,
        };
      });

    const result: VerificationResult = {
      inputCompany: validatedInput.company,
      inputDomain: validatedInput.domain,
      inputSignalType: validatedInput.rawSignal.type,
      rssItemUrl: validatedInput.rssItem.link,

      companyIdentity,

      claims,
      claimVerifications: verificationResult.verifications,

      overallStatus: confidenceResult.overallStatus,
      overallConfidence: confidenceResult.overallConfidence,
      confidenceBand: confidenceResult.confidenceBand,
      statusReason: explanation.summary,

      topSupportingEvidence,
      topContradictingEvidence,

      allEvidence: evidenceResult.evidence,

      metadata,
    };

    return result;
  } catch (error) {
    console.error("Signal verification failed:", error);

    return createFailedResult(
      validatedInput,
      "discard",
      0,
      `Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      metadata,
      startTime
    );
  }
}

// ============================================
// Helper Functions
// ============================================

function createFailedResult(
  input: VerifySignalInput,
  status: "discard" | "watchlist",
  confidence: number,
  reason: string,
  metadata: VerificationResult["metadata"],
  startTime: number
): VerificationResult {
  metadata.completedAt = new Date().toISOString();
  metadata.durationMs = Date.now() - startTime;

  return {
    inputCompany: input.company,
    inputDomain: input.domain,
    inputSignalType: input.rawSignal.type,
    rssItemUrl: input.rssItem.link,

    companyIdentity: {
      canonicalName: input.company,
      domain: input.domain,
      domainConfidence: input.domain ? "low" : "unknown",
      aliases: [],
      identifiedFrom: [],
    },

    claims: [],
    claimVerifications: [],

    overallStatus: status,
    overallConfidence: confidence,
    confidenceBand: "unknown" as ConfidenceBand,
    statusReason: reason,

    topSupportingEvidence: [],
    topContradictingEvidence: [],
    allEvidence: [],

    metadata,
  };
}

// ============================================
// Export Logs (for debugging)
// ============================================

export function getVerificationLogs(): VerificationLog[] {
  return [...logs];
}

export function clearVerificationLogs(): void {
  logs.length = 0;
}
