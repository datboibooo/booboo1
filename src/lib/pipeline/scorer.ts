import {
  SignalMatchReport,
  SignalDefinition,
  UserConfig,
  EvidenceChunk,
} from "@/lib/schemas";
import { FetchedEvidence } from "./evidence-fetcher";

export interface ScoredCandidate {
  report: SignalMatchReport;
  evidence: FetchedEvidence;
  score: number;
  passesGate: boolean;
  gateFailureReason?: string;
  penalties: Penalty[];
}

export interface Penalty {
  type: string;
  description: string;
  amount: number;
}

export interface ScoringStats {
  total: number;
  passedGate: number;
  failedGate: number;
  disqualified: number;
  insufficientEvidence: number;
}

// Evidence gate requirements
const MIN_EVIDENCE_URLS = 2;
const MIN_PRIMARY_EVIDENCE = 1; // company_site, job_post, press_release, sec_filing
const PRIMARY_SOURCE_TYPES = new Set([
  "company_site",
  "job_post",
  "press_release",
  "sec_filing",
]);

export function scoreAndGateCandidates(
  reports: SignalMatchReport[],
  evidenceMap: Map<string, FetchedEvidence>,
  config: UserConfig
): { scored: ScoredCandidate[]; stats: ScoringStats } {
  const signalMap = new Map(config.signals.map((s) => [s.id, s]));
  const scored: ScoredCandidate[] = [];

  const stats: ScoringStats = {
    total: reports.length,
    passedGate: 0,
    failedGate: 0,
    disqualified: 0,
    insufficientEvidence: 0,
  };

  for (const report of reports) {
    const evidence = evidenceMap.get(report.domain) || {
      domain: report.domain,
      chunks: [],
    };

    const result = scoreCandidate(report, evidence, signalMap, config);
    scored.push(result);

    if (result.passesGate) {
      stats.passedGate++;
    } else {
      stats.failedGate++;
      if (report.disqualified) {
        stats.disqualified++;
      } else {
        stats.insufficientEvidence++;
      }
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return { scored, stats };
}

function scoreCandidate(
  report: SignalMatchReport,
  evidence: FetchedEvidence,
  signalMap: Map<string, SignalDefinition>,
  config: UserConfig
): ScoredCandidate {
  const penalties: Penalty[] = [];
  let baseScore = 0;

  // Check disqualification first
  if (report.disqualified) {
    return {
      report,
      evidence,
      score: 0,
      passesGate: false,
      gateFailureReason: `Disqualified: ${report.disqualifierReason}`,
      penalties: [
        {
          type: "disqualifier",
          description: report.disqualifierReason || "Disqualifier triggered",
          amount: 100,
        },
      ],
    };
  }

  // Calculate base score from signal weights
  const positiveMatches = report.matches.filter((m) => m.result === "yes");

  for (const match of positiveMatches) {
    const signal = signalMap.get(match.signalId);
    if (signal) {
      // Weight * confidence
      const signalScore = signal.weight * match.confidence * 10;
      baseScore += signalScore;
    }
  }

  // Apply ICP fit bonus (if we could determine industry/geo match)
  // For now, use overall confidence as proxy
  const icpBonus = report.overallConfidence * 10;
  baseScore += icpBonus;

  // Evidence gate check
  const gateResult = checkEvidenceGate(evidence, positiveMatches, signalMap);

  if (!gateResult.passes) {
    penalties.push({
      type: "evidence_gate",
      description: gateResult.reason,
      amount: baseScore, // Zero out score
    });

    return {
      report,
      evidence,
      score: 0,
      passesGate: false,
      gateFailureReason: gateResult.reason,
      penalties,
    };
  }

  // Normalize score to 0-100
  const maxPossibleScore = config.signals
    .filter((s) => s.enabled && !s.isDisqualifier)
    .reduce((sum, s) => sum + s.weight * 10, 0);

  const normalizedScore = Math.min(
    100,
    Math.round((baseScore / Math.max(maxPossibleScore, 1)) * 100)
  );

  return {
    report,
    evidence,
    score: normalizedScore,
    passesGate: true,
    penalties,
  };
}

function checkEvidenceGate(
  evidence: FetchedEvidence,
  positiveMatches: SignalMatchReport["matches"],
  signalMap: Map<string, SignalDefinition>
): { passes: boolean; reason: string } {
  // Collect all evidence URLs from positive matches
  const allEvidenceUrls = new Set<string>();
  for (const match of positiveMatches) {
    for (const url of match.evidenceUrls) {
      allEvidenceUrls.add(url);
    }
  }

  // Check evidence URL count
  if (allEvidenceUrls.size < MIN_EVIDENCE_URLS) {
    // Check if we have at least one primary evidence source
    const primaryEvidence = evidence.chunks.filter((c) =>
      PRIMARY_SOURCE_TYPES.has(c.sourceType)
    );

    if (primaryEvidence.length < MIN_PRIMARY_EVIDENCE) {
      return {
        passes: false,
        reason: `Insufficient evidence: ${allEvidenceUrls.size} URLs (need ${MIN_EVIDENCE_URLS} or ${MIN_PRIMARY_EVIDENCE} primary source)`,
      };
    }
  }

  // Check signal requirements
  const highPriorityMatches = positiveMatches.filter((m) => {
    const signal = signalMap.get(m.signalId);
    return signal?.priority === "high";
  });

  const mediumPriorityMatches = positiveMatches.filter((m) => {
    const signal = signalMap.get(m.signalId);
    return signal?.priority === "medium";
  });

  // Gate: at least 1 high-priority OR 2 medium-priority signals
  if (highPriorityMatches.length < 1 && mediumPriorityMatches.length < 2) {
    return {
      passes: false,
      reason: `Insufficient signals: ${highPriorityMatches.length} high, ${mediumPriorityMatches.length} medium (need 1 high or 2 medium)`,
    };
  }

  return { passes: true, reason: "" };
}

export function selectTopCandidates(
  scored: ScoredCandidate[],
  limit: number
): ScoredCandidate[] {
  return scored.filter((c) => c.passesGate).slice(0, limit);
}
