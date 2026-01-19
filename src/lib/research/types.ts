import { z } from "zod";

// Signal types we're hunting for
export const SignalType = z.enum([
  "funding",           // Raised money, acquired funding
  "hiring",            // Actively hiring, team expansion
  "product_launch",    // New product, feature release
  "leadership_change", // New C-level, key hires
  "expansion",         // New market, office, geography
  "partnership",       // Strategic partnerships, integrations
  "acquisition",       // M&A activity
  "tech_adoption",     // New tech stack, tools
]);
export type SignalType = z.infer<typeof SignalType>;

// Data source types
export const SourceType = z.enum([
  "rss",           // RSS feeds
  "news_search",   // Exa/Serper news search
  "company_site",  // Direct company website crawl
  "job_board",     // Job posting aggregators
  "product_hunt",  // Product Hunt
  "press_release", // PR Newswire, Business Wire
  "social",        // Twitter, LinkedIn (limited)
  "sec_filing",    // SEC EDGAR filings
]);
export type SourceType = z.infer<typeof SourceType>;

// Raw signal discovery from a source
export const RawSignal = z.object({
  id: z.string(),
  signalType: SignalType,
  source: SourceType,
  sourceUrl: z.string(),

  // Company info (may be incomplete)
  companyName: z.string(),
  domain: z.string().optional(),

  // Signal details
  headline: z.string(),
  snippet: z.string(),
  rawContent: z.string().optional(),

  // Extracted entities
  amount: z.string().optional(),         // For funding: "$10M Series A"
  investors: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(), // For hiring: ["Senior Engineer", "PM"]
  people: z.array(z.string()).optional(), // Named individuals
  locations: z.array(z.string()).optional(),

  // Metadata
  publishedAt: z.string().optional(),
  discoveredAt: z.string(),
  confidence: z.number().min(0).max(1),
});
export type RawSignal = z.infer<typeof RawSignal>;

// Aggregated signal (after dedup + enrichment)
export const AggregatedSignal = z.object({
  id: z.string(),
  signalType: SignalType,

  // Company (enriched)
  companyName: z.string(),
  domain: z.string(),
  industry: z.string().optional(),

  // Aggregated evidence
  sources: z.array(z.object({
    type: SourceType,
    url: z.string(),
    snippet: z.string(),
    publishedAt: z.string().optional(),
  })),

  // Merged signal details
  headline: z.string(),
  summary: z.string(),
  entities: z.object({
    amount: z.string().optional(),
    investors: z.array(z.string()).optional(),
    roles: z.array(z.string()).optional(),
    people: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
  }),

  // Quality metrics
  sourceCount: z.number(),
  confidence: z.number(),
  freshness: z.number(), // Hours since first seen

  discoveredAt: z.string(),
});
export type AggregatedSignal = z.infer<typeof AggregatedSignal>;

// Research agent configuration
export const AgentConfig = z.object({
  name: z.string(),
  signalTypes: z.array(SignalType),
  sources: z.array(SourceType),
  searchQueries: z.array(z.string()),
  keywords: z.array(z.string()),
  excludeKeywords: z.array(z.string()).optional(),
  maxResults: z.number().default(50),
  freshnessHours: z.number().default(72), // Only signals from last N hours
});
export type AgentConfig = z.infer<typeof AgentConfig>;

// Research run result
export const ResearchResult = z.object({
  agentName: z.string(),
  startedAt: z.string(),
  completedAt: z.string(),
  rawSignals: z.array(RawSignal),
  errors: z.array(z.string()),
  stats: z.object({
    sourcesQueried: z.number(),
    rawSignalsFound: z.number(),
    processingTimeMs: z.number(),
  }),
});
export type ResearchResult = z.infer<typeof ResearchResult>;
