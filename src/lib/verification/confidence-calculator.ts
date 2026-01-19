import {
  Evidence,
  ClaimVerification,
  OverallStatus,
  ConfidenceBand,
  EvidenceSourceType,
  ReliabilityConfig,
} from "./types";
import weightsConfigJson from "./weights.json";

// Load and validate weights config
const weightsConfig = weightsConfigJson as unknown as ReliabilityConfig;

// ============================================
// Logistic Function
// ============================================

/**
 * Logistic function to map raw scores to [0, 1] range
 * Creates an S-curve centered at midpoint with given steepness
 */
function logistic(x: number, midpoint: number = 0.5, steepness: number = 10): number {
  return 1 / (1 + Math.exp(-steepness * (x - midpoint)));
}

/**
 * Inverse logistic to convert from [0,1] to raw score
 */
function inverseLogistic(y: number, midpoint: number = 0.5, steepness: number = 10): number {
  // Clamp y to avoid infinity
  const clampedY = Math.max(0.001, Math.min(0.999, y));
  return midpoint - Math.log(1 / clampedY - 1) / steepness;
}

// ============================================
// Evidence Reliability Scoring
// ============================================

export interface EvidenceReliabilityScore {
  evidenceId: string;
  rawWeight: number;
  sourceTypeWeight: number;
  publisherWeight: number;
  recencyWeight: number;
  specificityBonus: number;
  duplicationPenalty: number;
  finalWeight: number;
}

export function calculateEvidenceReliability(
  evidence: Evidence,
  allEvidence: Evidence[]
): EvidenceReliabilityScore {
  const sourceTypeWeights = weightsConfig.sourceTypeWeights as Record<string, number>;
  const publisherAllowlist = weightsConfig.publisherAllowlist as Record<string, number>;

  // 1. Source type weight
  const sourceTypeWeight = sourceTypeWeights[evidence.sourceType] || 0.4;

  // 2. Publisher weight
  let publisherWeight = 1.0;
  if (evidence.publisher) {
    const publisherDomain = extractDomainFromUrl(evidence.url);
    publisherWeight = publisherAllowlist[publisherDomain] || 0.6;

    // LinkedIn has 0 weight - skip it entirely
    if (publisherWeight === 0) {
      return {
        evidenceId: evidence.id,
        rawWeight: 0,
        sourceTypeWeight,
        publisherWeight: 0,
        recencyWeight: 0,
        specificityBonus: 0,
        duplicationPenalty: 0,
        finalWeight: 0,
      };
    }
  }

  // 3. Recency decay
  const recencyWeight = calculateRecencyWeight(evidence.publishedAt || evidence.fetchedAt);

  // 4. Specificity bonus
  const specificityBonus = calculateSpecificityBonus(evidence.snippet || "");

  // 5. Duplication penalty - check if this content is similar to other evidence
  const duplicationPenalty = calculateDuplicationPenalty(evidence, allEvidence);

  // Calculate raw weight
  const rawWeight =
    sourceTypeWeight *
    publisherWeight *
    recencyWeight *
    (1 + specificityBonus) *
    (1 - duplicationPenalty);

  // Apply logistic function to normalize to [0, 1]
  const finalWeight = logistic(rawWeight, 0.5, 6);

  return {
    evidenceId: evidence.id,
    rawWeight,
    sourceTypeWeight,
    publisherWeight,
    recencyWeight,
    specificityBonus,
    duplicationPenalty,
    finalWeight,
  };
}

function extractDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace("www.", "");
  } catch {
    return "";
  }
}

function calculateRecencyWeight(dateStr: string): number {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const daysSince = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    // Exponential decay with half-life
    const halfLife = weightsConfig.recencyDecay.halfLifeDays;
    const minWeight = weightsConfig.recencyDecay.minWeight;

    const decay = Math.pow(0.5, daysSince / halfLife);
    return Math.max(minWeight, decay);
  } catch {
    return 0.5; // Default for unparseable dates
  }
}

function calculateSpecificityBonus(text: string): number {
  const factors = weightsConfig.specificityFactors;
  let bonus = 0;

  // Check for exact numbers (dollar amounts, percentages)
  if (/\$[\d,.]+[MBK]?|\d+%|\d+(?:,\d{3})+/.test(text)) {
    bonus += factors.hasExactNumbers;
  }

  // Check for named people (Title Case names)
  if (/(?:Mr\.|Ms\.|Dr\.|CEO|CFO|CTO)?\s*[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text)) {
    bonus += factors.hasNamedPeople;
  }

  // Check for specific dates
  if (/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}/.test(text)) {
    bonus += factors.hasSpecificDates;
  }

  // Check for quotes
  if (/"[^"]{10,}"/.test(text)) {
    bonus += factors.hasQuotes;
  }

  return bonus;
}

function calculateDuplicationPenalty(evidence: Evidence, allEvidence: Evidence[]): number {
  // Count similar content hashes (excluding self)
  const duplicateCount = allEvidence.filter(
    (e) => e.id !== evidence.id && e.contentHash === evidence.contentHash
  ).length;

  if (duplicateCount === 0) return 0;

  // Apply penalty that increases with more duplicates
  return Math.min(
    weightsConfig.duplicationPenalty,
    duplicateCount * (weightsConfig.duplicationPenalty / 3)
  );
}

// ============================================
// Overall Confidence Calculation
// ============================================

export interface ConfidenceCalculationResult {
  overallConfidence: number;
  confidenceBand: ConfidenceBand;
  overallStatus: OverallStatus;
  statusReason: string;
  supportScore: number;
  contradictionScore: number;
  evidenceScores: EvidenceReliabilityScore[];
  gatePenalty: number;
}

export function calculateOverallConfidence(
  claimVerifications: ClaimVerification[],
  allEvidence: Evidence[]
): ConfidenceCalculationResult {
  // Calculate reliability scores for all evidence
  const evidenceScores = allEvidence.map((e) =>
    calculateEvidenceReliability(e, allEvidence)
  );
  const evidenceWeightMap = new Map(evidenceScores.map((s) => [s.evidenceId, s.finalWeight]));

  // Aggregate support and contradiction scores across all claims
  let totalSupport = 0;
  let totalContradiction = 0;
  let totalGatesPassed = 0;
  let totalGatesFailed = 0;

  for (const verification of claimVerifications) {
    // Support score: weighted sum of supporting evidence
    for (const support of verification.supportingEvidence) {
      const weight = evidenceWeightMap.get(support.evidenceId) || 0.5;
      totalSupport += support.relevanceScore * weight;
    }

    // Contradiction score: weighted sum of contradicting evidence
    for (const contra of verification.contradictingEvidence) {
      const weight = evidenceWeightMap.get(contra.evidenceId) || 0.5;
      // Contradictions from official sources are more damaging
      const contraMultiplier = isOfficialSourceType(contra.sourceType) ? 1.5 : 1.0;
      totalContradiction += weight * contraMultiplier;
    }

    totalGatesPassed += verification.gatesPassed.length;
    totalGatesFailed += verification.gatesFailed.length;
  }

  // Normalize scores
  const claimCount = claimVerifications.length || 1;
  const normalizedSupport = totalSupport / claimCount;
  const normalizedContradiction = totalContradiction / claimCount;

  // Calculate gate penalty
  const totalGates = totalGatesPassed + totalGatesFailed;
  const gatePenalty = totalGates > 0 ? totalGatesFailed / totalGates : 0;

  // Calculate raw confidence
  // support - contradiction penalty - gate penalty
  const rawConfidence =
    normalizedSupport - normalizedContradiction * 0.7 - gatePenalty * 0.3;

  // Apply logistic function for calibration
  // This creates an S-curve that:
  // - Compresses very low scores toward 0
  // - Compresses very high scores toward 1
  // - Has maximum sensitivity around the midpoint
  let calibratedConfidence = logistic(rawConfidence, 0.5, 8);

  // Apply caps based on gate failures
  if (totalGatesFailed > 0) {
    calibratedConfidence = Math.min(
      calibratedConfidence,
      weightsConfig.confidenceThresholds.watchlist + 0.1
    );
  }

  // Check for any "contradicted" claims - cap confidence
  const hasContradictedClaim = claimVerifications.some(
    (v) => v.status === "contradicted"
  );
  if (hasContradictedClaim) {
    calibratedConfidence = Math.min(calibratedConfidence, 0.3);
  }

  // Determine confidence band
  const confidenceBand = getConfidenceBand(calibratedConfidence);

  // Determine overall status
  const { status, reason } = determineOverallStatus(
    calibratedConfidence,
    claimVerifications,
    totalGatesFailed
  );

  return {
    overallConfidence: calibratedConfidence,
    confidenceBand,
    overallStatus: status,
    statusReason: reason,
    supportScore: normalizedSupport,
    contradictionScore: normalizedContradiction,
    evidenceScores,
    gatePenalty,
  };
}

function isOfficialSourceType(sourceType: EvidenceSourceType): boolean {
  return [
    "company_press",
    "company_newsroom",
    "company_careers",
    "company_about",
    "sec_filing",
  ].includes(sourceType);
}

function getConfidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  if (confidence >= 0.2) return "low";
  return "unknown";
}

function determineOverallStatus(
  confidence: number,
  verifications: ClaimVerification[],
  gatesFailed: number
): { status: OverallStatus; reason: string } {
  const thresholds = weightsConfig.confidenceThresholds;

  // Check for contradictions first
  const contradictedCount = verifications.filter(
    (v) => v.status === "contradicted"
  ).length;
  if (contradictedCount > 0) {
    return {
      status: "discard",
      reason: `${contradictedCount} claim(s) contradicted by evidence`,
    };
  }

  // Check for insufficient evidence
  const insufficientCount = verifications.filter(
    (v) => v.status === "insufficient_evidence" || v.status === "unknown"
  ).length;
  if (insufficientCount === verifications.length) {
    return {
      status: "discard",
      reason: "Insufficient evidence to verify any claims",
    };
  }

  // Check confidence thresholds
  if (confidence >= thresholds.verified && gatesFailed === 0) {
    const verifiedCount = verifications.filter(
      (v) => v.status === "verified"
    ).length;
    return {
      status: "verified",
      reason: `High confidence (${(confidence * 100).toFixed(0)}%), ${verifiedCount} claim(s) verified`,
    };
  }

  if (confidence >= thresholds.watchlist) {
    return {
      status: "watchlist",
      reason: `Moderate confidence (${(confidence * 100).toFixed(0)}%), needs additional verification`,
    };
  }

  return {
    status: "discard",
    reason: `Low confidence (${(confidence * 100).toFixed(0)}%), insufficient evidence`,
  };
}

// ============================================
// Confidence Explanation
// ============================================

export interface ConfidenceExplanation {
  summary: string;
  factors: {
    name: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }[];
}

export function explainConfidence(
  result: ConfidenceCalculationResult,
  claimVerifications: ClaimVerification[]
): ConfidenceExplanation {
  const factors: ConfidenceExplanation["factors"] = [];

  // Support score
  if (result.supportScore > 0.7) {
    factors.push({
      name: "Strong support",
      impact: "positive",
      description: `Multiple high-quality sources support the claims`,
    });
  } else if (result.supportScore > 0.4) {
    factors.push({
      name: "Moderate support",
      impact: "neutral",
      description: `Some supporting evidence found`,
    });
  } else {
    factors.push({
      name: "Weak support",
      impact: "negative",
      description: `Limited supporting evidence`,
    });
  }

  // Contradiction score
  if (result.contradictionScore > 0.3) {
    factors.push({
      name: "Contradictions found",
      impact: "negative",
      description: `Evidence contradicts some claims`,
    });
  }

  // Gate penalty
  if (result.gatePenalty > 0) {
    factors.push({
      name: "Verification gates failed",
      impact: "negative",
      description: `Some required verification checks did not pass`,
    });
  }

  // Evidence quality
  const avgWeight =
    result.evidenceScores.reduce((sum, s) => sum + s.finalWeight, 0) /
    (result.evidenceScores.length || 1);
  if (avgWeight > 0.7) {
    factors.push({
      name: "High-quality sources",
      impact: "positive",
      description: `Evidence from reputable, recent sources`,
    });
  } else if (avgWeight < 0.4) {
    factors.push({
      name: "Lower-quality sources",
      impact: "negative",
      description: `Evidence from less authoritative or older sources`,
    });
  }

  // Build summary
  const summary =
    `Confidence: ${(result.overallConfidence * 100).toFixed(0)}% (${result.confidenceBand}). ` +
    `${result.statusReason}`;

  return { summary, factors };
}
