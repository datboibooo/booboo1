import { createId } from "@paralleldrive/cuid2";
import {
  RawSignal,
  AggregatedSignal,
  SignalType,
  ResearchResult,
  AgentConfig,
} from "./types";
import { searchExa } from "./sources/exa-search";
import { crawlCompanies } from "./sources/company-crawler";
import { aggregateNewsSignals } from "./sources/news-aggregator";

// Default agent configurations
const DEFAULT_AGENTS: AgentConfig[] = [
  {
    name: "funding-hunter",
    signalTypes: ["funding", "acquisition"],
    sources: ["rss", "news_search"],
    searchQueries: [
      "startup funding round announcement",
      "company raises series funding",
    ],
    keywords: ["raises", "funding", "series", "investment", "acquired"],
    maxResults: 30,
    freshnessHours: 48,
  },
  {
    name: "growth-detector",
    signalTypes: ["hiring", "expansion"],
    sources: ["rss", "news_search", "company_site"],
    searchQueries: [
      "company hiring expansion",
      "startup team growth",
    ],
    keywords: ["hiring", "growing", "expansion", "new office"],
    maxResults: 30,
    freshnessHours: 72,
  },
  {
    name: "product-watcher",
    signalTypes: ["product_launch", "tech_adoption"],
    sources: ["rss", "news_search"],
    searchQueries: [
      "company launches new product feature",
      "startup product announcement",
    ],
    keywords: ["launch", "announces", "introducing", "new feature"],
    maxResults: 30,
    freshnessHours: 48,
  },
  {
    name: "leadership-tracker",
    signalTypes: ["leadership_change"],
    sources: ["rss", "news_search"],
    searchQueries: [
      "company appoints new CEO CTO executive",
      "startup hires new leadership",
    ],
    keywords: ["appoints", "hires", "joins as", "new CEO", "new CTO"],
    maxResults: 20,
    freshnessHours: 72,
  },
  {
    name: "partnership-monitor",
    signalTypes: ["partnership"],
    sources: ["rss", "news_search"],
    searchQueries: [
      "strategic partnership announcement",
      "company integration partnership",
    ],
    keywords: ["partners with", "partnership", "integration", "collaboration"],
    maxResults: 20,
    freshnessHours: 72,
  },
];

// Run a single research agent
async function runAgent(config: AgentConfig): Promise<ResearchResult> {
  const startTime = Date.now();
  const rawSignals: RawSignal[] = [];
  const errors: string[] = [];
  let sourcesQueried = 0;

  // 1. Aggregate news from RSS feeds
  if (config.sources.includes("rss")) {
    try {
      const rssSignals = await aggregateNewsSignals(
        config.signalTypes,
        Math.floor(config.maxResults / 2)
      );
      rawSignals.push(...rssSignals);
      sourcesQueried++;
    } catch (error) {
      errors.push(`RSS aggregation failed: ${error}`);
    }
  }

  // 2. Search with Exa
  if (config.sources.includes("news_search")) {
    for (const signalType of config.signalTypes) {
      try {
        const exaSignals = await searchExa(signalType, {
          maxResults: Math.floor(config.maxResults / config.signalTypes.length),
          freshnessHours: config.freshnessHours,
          customQueries: config.searchQueries,
        });
        rawSignals.push(...exaSignals);
        sourcesQueried++;
      } catch (error) {
        errors.push(`Exa search failed for ${signalType}: ${error}`);
      }
    }
  }

  return {
    agentName: config.name,
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    rawSignals,
    errors,
    stats: {
      sourcesQueried,
      rawSignalsFound: rawSignals.length,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

// Deduplicate signals by company + signal type
function deduplicateSignals(signals: RawSignal[]): RawSignal[] {
  const seen = new Map<string, RawSignal>();

  for (const signal of signals) {
    const key = `${signal.companyName.toLowerCase()}-${signal.signalType}`;

    if (!seen.has(key)) {
      seen.set(key, signal);
    } else {
      // Keep the one with higher confidence or more recent
      const existing = seen.get(key)!;
      if (signal.confidence > existing.confidence) {
        seen.set(key, signal);
      }
    }
  }

  return Array.from(seen.values());
}

// Aggregate raw signals into enriched signals
function aggregateSignals(rawSignals: RawSignal[]): AggregatedSignal[] {
  // Group by company + signal type
  const groups = new Map<string, RawSignal[]>();

  for (const signal of rawSignals) {
    const key = `${signal.companyName.toLowerCase()}-${signal.signalType}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(signal);
  }

  const aggregated: AggregatedSignal[] = [];

  for (const [, signals] of groups) {
    if (signals.length === 0) continue;

    // Use the highest confidence signal as the primary
    signals.sort((a, b) => b.confidence - a.confidence);
    const primary = signals[0];

    // Merge entities from all signals
    const mergedEntities = {
      amount: signals.find((s) => s.amount)?.amount,
      investors: [...new Set(signals.flatMap((s) => s.investors || []))],
      roles: [...new Set(signals.flatMap((s) => s.roles || []))],
      people: [...new Set(signals.flatMap((s) => s.people || []))],
      locations: [...new Set(signals.flatMap((s) => s.locations || []))],
    };

    // Calculate aggregate confidence
    const avgConfidence =
      signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    const sourceBonus = Math.min(signals.length * 0.05, 0.2); // Up to 20% bonus for multiple sources

    // Calculate freshness (hours since oldest signal)
    const oldestDate = signals
      .filter((s) => s.publishedAt)
      .map((s) => new Date(s.publishedAt!).getTime())
      .sort()[0];
    const freshness = oldestDate
      ? (Date.now() - oldestDate) / (1000 * 60 * 60)
      : 72;

    const aggregatedSignal: AggregatedSignal = {
      id: createId(),
      signalType: primary.signalType,
      companyName: primary.companyName,
      domain: primary.domain || "",
      sources: signals.map((s) => ({
        type: s.source,
        url: s.sourceUrl,
        snippet: s.snippet,
        publishedAt: s.publishedAt,
      })),
      headline: primary.headline,
      summary: primary.snippet,
      entities: mergedEntities,
      sourceCount: signals.length,
      confidence: Math.min(avgConfidence + sourceBonus, 1),
      freshness,
      discoveredAt: new Date().toISOString(),
    };

    aggregated.push(aggregatedSignal);
  }

  // Sort by confidence * recency
  aggregated.sort((a, b) => {
    const scoreA = a.confidence * (1 / Math.max(a.freshness, 1));
    const scoreB = b.confidence * (1 / Math.max(b.freshness, 1));
    return scoreB - scoreA;
  });

  return aggregated;
}

// Enrich signals with company domain using LLM
async function enrichWithDomain(
  signals: AggregatedSignal[]
): Promise<AggregatedSignal[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    console.warn("No LLM API key for domain enrichment");
    return signals;
  }

  // Only enrich signals without domains
  const needsEnrichment = signals.filter((s) => !s.domain);
  if (needsEnrichment.length === 0) return signals;

  const companyNames = needsEnrichment.map((s) => s.companyName).slice(0, 20);

  try {
    const prompt = `For each company name, provide the most likely company website domain (just the domain, no https://). If you're not confident, respond with "unknown".

Companies:
${companyNames.map((name, i) => `${i + 1}. ${name}`).join("\n")}

Respond as JSON array of objects: [{"company": "name", "domain": "domain.com"}]`;

    let response;
    if (openaiKey) {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
        }),
      });
    } else {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
    }

    if (response.ok) {
      const data = await response.json();
      const content = openaiKey
        ? data.choices[0]?.message?.content
        : data.content[0]?.text;

      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const enrichments = JSON.parse(jsonMatch[0]) as Array<{
          company: string;
          domain: string;
        }>;

        // Apply enrichments
        for (const signal of signals) {
          if (!signal.domain) {
            const enrichment = enrichments.find(
              (e) => e.company.toLowerCase() === signal.companyName.toLowerCase()
            );
            if (enrichment && enrichment.domain !== "unknown") {
              signal.domain = enrichment.domain;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Domain enrichment failed:", error);
  }

  return signals;
}

// Main orchestration function
export async function runResearch(options: {
  agents?: AgentConfig[];
  signalTypes?: SignalType[];
  maxResults?: number;
  enrichDomains?: boolean;
} = {}): Promise<{
  signals: AggregatedSignal[];
  stats: {
    agentsRun: number;
    totalRawSignals: number;
    uniqueSignals: number;
    processingTimeMs: number;
  };
  errors: string[];
}> {
  const startTime = Date.now();
  const {
    agents = DEFAULT_AGENTS,
    signalTypes,
    maxResults = 100,
    enrichDomains = true,
  } = options;

  // Filter agents by signal types if specified
  const activeAgents = signalTypes
    ? agents.filter((a) => a.signalTypes.some((st) => signalTypes.includes(st)))
    : agents;

  // Run all agents in parallel
  const results = await Promise.all(activeAgents.map((agent) => runAgent(agent)));

  // Collect all raw signals and errors
  const allRawSignals = results.flatMap((r) => r.rawSignals);
  const allErrors = results.flatMap((r) => r.errors);

  // Deduplicate and aggregate
  const deduplicated = deduplicateSignals(allRawSignals);
  let aggregated = aggregateSignals(deduplicated);

  // Enrich with domains
  if (enrichDomains) {
    aggregated = await enrichWithDomain(aggregated);
  }

  // Limit results
  aggregated = aggregated.slice(0, maxResults);

  return {
    signals: aggregated,
    stats: {
      agentsRun: activeAgents.length,
      totalRawSignals: allRawSignals.length,
      uniqueSignals: aggregated.length,
      processingTimeMs: Date.now() - startTime,
    },
    errors: allErrors,
  };
}

// Export for targeted research on specific companies
export async function researchCompanies(
  companies: Array<{ domain: string; companyName: string }>,
  signalTypes?: SignalType[]
): Promise<AggregatedSignal[]> {
  const rawSignals = await crawlCompanies(companies, signalTypes);
  const aggregated = aggregateSignals(rawSignals);
  return aggregated;
}
