import { SupabaseClient } from "@supabase/supabase-js";
import {
  UserConfig,
  LeadRecord,
  SignalRunStats,
  CandidateCompany,
} from "@/lib/schemas";
import { planQueries } from "./query-planner";
import { executeSearchQueries, deduplicateResults } from "./retrieval";
import { extractCandidates } from "./candidate-extractor";
import { fetchEvidenceForCandidates, FetchedEvidence } from "./evidence-fetcher";
import { evaluateBatch } from "./signal-evaluator";
import { scoreAndGateCandidates, selectTopCandidates } from "./scorer";
import { generateLeadRecords } from "./lead-generator";
import {
  createSignalRun,
  updateSignalRun,
  saveLeads,
  wasDomainSeenRecently,
  markDomainSeen,
  isDNC,
} from "@/lib/db/queries";
import { normalizeDomain } from "@/lib/utils";

export * from "./query-planner";
export * from "./retrieval";
export * from "./candidate-extractor";
export * from "./evidence-fetcher";
export * from "./signal-evaluator";
export * from "./scorer";
export * from "./lead-generator";

export interface PipelineOptions {
  mode: "hunt" | "watch";
  limit?: number;
  listId?: string;
  domains?: string[]; // For watch mode
  onProgress?: (stage: string, progress: number, total: number) => void;
}

export interface PipelineResult {
  runId: string;
  leads: LeadRecord[];
  stats: SignalRunStats;
  errors: string[];
}

export async function runPipeline(
  supabase: SupabaseClient,
  userId: string,
  config: UserConfig,
  options: PipelineOptions
): Promise<PipelineResult> {
  const errors: string[] = [];
  const limit = options.limit || 50;

  // Create signal run record
  const run = await createSignalRun(
    supabase,
    userId,
    options.mode,
    options.listId
  );

  const stats: SignalRunStats = {
    queriesExecuted: 0,
    candidatesFound: 0,
    candidatesAfterDedup: 0,
    evidenceChunksFetched: 0,
    signalEvaluations: 0,
    leadsGenerated: 0,
    leadsPassedGate: 0,
    insufficientEvidence: 0,
    disqualified: 0,
    duplicatesSkipped: 0,
  };

  try {
    let candidates: CandidateCompany[];

    if (options.mode === "watch" && options.domains) {
      // Watch mode: use provided domains
      candidates = options.domains.map((domain) => ({
        companyName: domain.split(".")[0],
        domain: normalizeDomain(domain),
        sourceUrl: `https://${domain}`,
        snippet: "",
        confidence: 1,
      }));
      stats.candidatesFound = candidates.length;
      stats.candidatesAfterDedup = candidates.length;
    } else {
      // Hunt mode: discover candidates
      options.onProgress?.("Planning queries", 0, 1);

      // Get recent domains to exclude
      const recentDomains: string[] = [];
      // Note: In production, you'd query domain_history for recent domains

      const queryPlan = await planQueries(config, recentDomains);
      stats.queriesExecuted = queryPlan.queries.length;

      options.onProgress?.("Executing searches", 0, queryPlan.queries.length);

      const { results: retrievalResults, stats: retrievalStats } =
        await executeSearchQueries(queryPlan.queries, {
          onProgress: (completed, total) =>
            options.onProgress?.("Executing searches", completed, total),
        });

      const deduplicatedResults = deduplicateResults(retrievalResults);

      options.onProgress?.("Extracting candidates", 0, 1);

      candidates = await extractCandidates(deduplicatedResults, {
        onProgress: (completed, total) =>
          options.onProgress?.("Extracting candidates", completed, total),
      });

      stats.candidatesFound = candidates.length;

      // Filter out DNC and recent domains
      const filteredCandidates: CandidateCompany[] = [];
      for (const candidate of candidates) {
        const domain = normalizeDomain(candidate.domain);

        // Check DNC
        if (await isDNC(supabase, userId, domain)) {
          stats.duplicatesSkipped++;
          continue;
        }

        // Check recent history
        if (await wasDomainSeenRecently(supabase, userId, domain)) {
          stats.duplicatesSkipped++;
          continue;
        }

        filteredCandidates.push(candidate);
      }

      candidates = filteredCandidates;
      stats.candidatesAfterDedup = candidates.length;

      // Store the deduplicated search results for evidence fetching
      options.onProgress?.("Fetching evidence", 0, candidates.length);

      const evidence = await fetchEvidenceForCandidates(
        candidates,
        deduplicatedResults,
        {
          onProgress: (completed, total) =>
            options.onProgress?.("Fetching evidence", completed, total),
        }
      );

      const evidenceMap = new Map<string, FetchedEvidence>();
      for (const e of evidence) {
        evidenceMap.set(e.domain, e);
        stats.evidenceChunksFetched += e.chunks.length;
      }

      options.onProgress?.("Evaluating signals", 0, candidates.length);

      const candidatesWithEvidence = candidates.map((c) => ({
        candidate: c,
        evidence: evidenceMap.get(c.domain) || { domain: c.domain, chunks: [] },
      }));

      const reports = await evaluateBatch(
        candidatesWithEvidence,
        config.signals,
        {
          onProgress: (completed, total) =>
            options.onProgress?.("Evaluating signals", completed, total),
        }
      );

      stats.signalEvaluations = reports.length;

      options.onProgress?.("Scoring candidates", 0, 1);

      const { scored, stats: scoringStats } = scoreAndGateCandidates(
        reports,
        evidenceMap,
        config
      );

      stats.leadsPassedGate = scoringStats.passedGate;
      stats.insufficientEvidence = scoringStats.insufficientEvidence;
      stats.disqualified = scoringStats.disqualified;

      const topCandidates = selectTopCandidates(scored, limit);

      options.onProgress?.("Generating leads", 0, topCandidates.length);

      const today = new Date().toISOString().split("T")[0];
      const leads = await generateLeadRecords(
        topCandidates,
        config,
        userId,
        today,
        {
          onProgress: (completed, total) =>
            options.onProgress?.("Generating leads", completed, total),
        }
      );

      stats.leadsGenerated = leads.length;

      // Save leads to database
      await saveLeads(supabase, leads);

      // Mark domains as seen
      for (const lead of leads) {
        await markDomainSeen(supabase, userId, lead.domain);
      }

      // Update run status
      await updateSignalRun(supabase, run.id, {
        status: "completed",
        stats,
        finished_at: new Date().toISOString(),
      });

      return {
        runId: run.id,
        leads,
        stats,
        errors,
      };
    }

    // Handle watch mode (similar flow but with predefined domains)
    const evidenceMap = new Map<string, FetchedEvidence>();

    options.onProgress?.("Fetching evidence", 0, candidates.length);

    const evidence = await fetchEvidenceForCandidates(candidates, [], {
      onProgress: (completed, total) =>
        options.onProgress?.("Fetching evidence", completed, total),
    });

    for (const e of evidence) {
      evidenceMap.set(e.domain, e);
      stats.evidenceChunksFetched += e.chunks.length;
    }

    options.onProgress?.("Evaluating signals", 0, candidates.length);

    const candidatesWithEvidence = candidates.map((c) => ({
      candidate: c,
      evidence: evidenceMap.get(c.domain) || { domain: c.domain, chunks: [] },
    }));

    const reports = await evaluateBatch(candidatesWithEvidence, config.signals, {
      onProgress: (completed, total) =>
        options.onProgress?.("Evaluating signals", completed, total),
    });

    stats.signalEvaluations = reports.length;

    const { scored, stats: scoringStats } = scoreAndGateCandidates(
      reports,
      evidenceMap,
      config
    );

    stats.leadsPassedGate = scoringStats.passedGate;
    stats.insufficientEvidence = scoringStats.insufficientEvidence;
    stats.disqualified = scoringStats.disqualified;

    const topCandidates = selectTopCandidates(scored, limit);

    options.onProgress?.("Generating leads", 0, topCandidates.length);

    const today = new Date().toISOString().split("T")[0];
    const leads = await generateLeadRecords(topCandidates, config, userId, today, {
      onProgress: (completed, total) =>
        options.onProgress?.("Generating leads", completed, total),
    });

    stats.leadsGenerated = leads.length;

    await saveLeads(supabase, leads);

    await updateSignalRun(supabase, run.id, {
      status: "completed",
      stats,
      finished_at: new Date().toISOString(),
    });

    return {
      runId: run.id,
      leads,
      stats,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    errors.push(errorMessage);

    await updateSignalRun(supabase, run.id, {
      status: "failed",
      error: errorMessage,
      finished_at: new Date().toISOString(),
    });

    return {
      runId: run.id,
      leads: [],
      stats,
      errors,
    };
  }
}
