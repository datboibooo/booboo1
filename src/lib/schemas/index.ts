import { z } from "zod";

// ============================================
// Signal Definitions
// ============================================

export const SignalPrioritySchema = z.enum(["low", "medium", "high"]);
export type SignalPriority = z.infer<typeof SignalPrioritySchema>;

export const SignalCategorySchema = z.enum([
  "funding_corporate",
  "leadership_org",
  "product_strategy",
  "hiring_team",
  "expansion_partnerships",
  "technology_adoption",
  "risk_compliance",
  "disqualifier",
]);
export type SignalCategory = z.infer<typeof SignalCategorySchema>;

export const EvidenceSourceTypeSchema = z.enum([
  "news",
  "press_release",
  "company_site",
  "job_post",
  "sec_filing",
  "blog",
  "social",
  "review",
  "directory",
  "other",
]);
export type EvidenceSourceType = z.infer<typeof EvidenceSourceTypeSchema>;

export const SignalDefinitionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  question: z.string().min(1), // e.g., "Does {account} show signs of expanding into Europe?"
  category: SignalCategorySchema,
  priority: SignalPrioritySchema,
  weight: z.number().min(0).max(10),
  queryTemplates: z.array(z.string()), // Keywords/phrases for search
  acceptedSources: z.array(EvidenceSourceTypeSchema),
  isDisqualifier: z.boolean().default(false),
  enabled: z.boolean().default(true),
});
export type SignalDefinition = z.infer<typeof SignalDefinitionSchema>;

// ============================================
// ICP (Ideal Customer Profile)
// ============================================

export const CompanySizeRangeSchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
});
export type CompanySizeRange = z.infer<typeof CompanySizeRangeSchema>;

export const ICPSchema = z.object({
  industries: z.array(z.string()),
  excludeIndustries: z.array(z.string()).default([]),
  geos: z.array(z.string()),
  excludeGeos: z.array(z.string()).default([]),
  companySizeRange: CompanySizeRangeSchema.nullable(),
  targetRoles: z.array(z.string()),
  excludeRoles: z.array(z.string()).default([]),
});
export type ICP = z.infer<typeof ICPSchema>;

// ============================================
// User Configuration
// ============================================

export const ModeConfigSchema = z.object({
  huntEnabled: z.boolean().default(true),
  huntDailyLimit: z.number().default(50),
  watchEnabled: z.boolean().default(false),
});
export type ModeConfig = z.infer<typeof ModeConfigSchema>;

export const ScheduleConfigSchema = z.object({
  timezone: z.string().default("America/New_York"),
  dailyRunHour: z.number().min(0).max(23).default(8), // 8 AM
});
export type ScheduleConfig = z.infer<typeof ScheduleConfigSchema>;

export const UserConfigSchema = z.object({
  version: z.number().default(1),
  offer: z.string(), // What you sell
  icp: ICPSchema,
  signals: z.array(SignalDefinitionSchema),
  modes: ModeConfigSchema,
  schedule: ScheduleConfigSchema,
  onboardingComplete: z.boolean().default(false),
});
export type UserConfig = z.infer<typeof UserConfigSchema>;

// ============================================
// LLM Contract: Query Plan
// ============================================

export const SearchQuerySchema = z.object({
  query: z.string(),
  targetSignals: z.array(z.string()), // Signal IDs this query is designed to find
  expectedSourceTypes: z.array(EvidenceSourceTypeSchema),
  rationale: z.string(), // Brief explanation of why this query
});
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const QueryPlanSchema = z.object({
  queries: z.array(SearchQuerySchema).min(1).max(50),
  icpSummary: z.string(), // Summary of ICP used
  signalsSummary: z.string(), // Summary of signals being searched
});
export type QueryPlan = z.infer<typeof QueryPlanSchema>;

// ============================================
// LLM Contract: Candidate Company
// ============================================

export const CandidateCompanySchema = z.object({
  companyName: z.string(),
  domain: z.string(),
  sourceUrl: z.string().url(),
  snippet: z.string(),
  confidence: z.number().min(0).max(1), // How confident the extraction is
});
export type CandidateCompany = z.infer<typeof CandidateCompanySchema>;

export const CandidateExtractionResultSchema = z.object({
  candidates: z.array(CandidateCompanySchema),
  totalResultsProcessed: z.number(),
});
export type CandidateExtractionResult = z.infer<typeof CandidateExtractionResultSchema>;

// ============================================
// Evidence
// ============================================

export const EvidenceChunkSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  snippet: z.string(),
  sourceType: EvidenceSourceTypeSchema,
  fetchedAt: z.string().datetime(),
  hash: z.string(), // For deduplication
});
export type EvidenceChunk = z.infer<typeof EvidenceChunkSchema>;

// ============================================
// LLM Contract: Signal Match Report
// ============================================

export const SignalMatchSchema = z.object({
  signalId: z.string(),
  signalName: z.string(),
  result: z.enum(["yes", "no", "unknown"]),
  confidence: z.number().min(0).max(1),
  evidenceUrls: z.array(z.string().url()),
  evidenceSnippets: z.array(z.string()),
  reasoning: z.string(),
});
export type SignalMatch = z.infer<typeof SignalMatchSchema>;

export const SignalMatchReportSchema = z.object({
  domain: z.string(),
  companyName: z.string(),
  matches: z.array(SignalMatchSchema),
  overallConfidence: z.number().min(0).max(1),
  disqualified: z.boolean(),
  disqualifierReason: z.string().nullable(),
});
export type SignalMatchReport = z.infer<typeof SignalMatchReportSchema>;

// ============================================
// Lead Record
// ============================================

export const LeadStatusSchema = z.enum(["new", "saved", "contacted", "skip"]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const LeadRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(), // YYYY-MM-DD
  domain: z.string(),
  companyName: z.string(),
  industry: z.string().nullable(),
  geo: z.string().nullable(),
  score: z.number().min(0).max(100),
  whyNow: z.string(),
  triggeredSignals: z.array(
    z.object({
      signalId: z.string(),
      signalName: z.string(),
      category: SignalCategorySchema,
      priority: SignalPrioritySchema,
    })
  ),
  evidenceUrls: z.array(z.string().url()),
  evidenceSnippets: z.array(z.string()),
  linkedinSearchUrl: z.string(),
  linkedinSearchQuery: z.string(),
  targetTitles: z.array(z.string()),
  openerShort: z.string(),
  openerMedium: z.string(),
  status: LeadStatusSchema,
  personName: z.string().nullable(), // Only if found in evidence
  angles: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      evidenceUrl: z.string().url(),
    })
  ),
  narrative: z.array(z.string()), // 5-8 bullets with citations
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type LeadRecord = z.infer<typeof LeadRecordSchema>;

// ============================================
// Config Patch (for chat-based modifications)
// ============================================

export const ConfigPatchOperationSchema = z.object({
  op: z.enum(["add", "remove", "replace"]),
  path: z.string(), // JSON pointer
  value: z.unknown().optional(),
});
export type ConfigPatchOperation = z.infer<typeof ConfigPatchOperationSchema>;

export const ConfigPatchSchema = z.object({
  operations: z.array(ConfigPatchOperationSchema),
  summary: z.string(), // Human-readable summary of changes
  affectedSections: z.array(z.string()),
});
export type ConfigPatch = z.infer<typeof ConfigPatchSchema>;

// ============================================
// Lists
// ============================================

export const ListTypeSchema = z.enum(["hunt", "watch"]);
export type ListType = z.infer<typeof ListTypeSchema>;

export const ListSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  type: ListTypeSchema,
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archived: z.boolean().default(false),
});
export type List = z.infer<typeof ListSchema>;

export const ListAccountSchema = z.object({
  id: z.string(),
  listId: z.string(),
  domain: z.string(),
  companyName: z.string().nullable(),
  status: z.enum(["active", "paused", "archived"]),
  currentScore: z.number().nullable(),
  lastScoredAt: z.string().datetime().nullable(),
  addedAt: z.string().datetime(),
});
export type ListAccount = z.infer<typeof ListAccountSchema>;

// ============================================
// Signal Run (Pipeline Execution)
// ============================================

export const SignalRunStatsSchema = z.object({
  queriesExecuted: z.number(),
  candidatesFound: z.number(),
  candidatesAfterDedup: z.number(),
  evidenceChunksFetched: z.number(),
  signalEvaluations: z.number(),
  leadsGenerated: z.number(),
  leadsPassedGate: z.number(),
  insufficientEvidence: z.number(),
  disqualified: z.number(),
  duplicatesSkipped: z.number(),
});
export type SignalRunStats = z.infer<typeof SignalRunStatsSchema>;

export const SignalRunSchema = z.object({
  id: z.string(),
  userId: z.string(),
  mode: z.enum(["hunt", "watch"]),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  status: z.enum(["running", "completed", "failed"]),
  stats: SignalRunStatsSchema.nullable(),
  error: z.string().nullable(),
});
export type SignalRun = z.infer<typeof SignalRunSchema>;

// ============================================
// Do Not Contact
// ============================================

export const DoNotContactSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["company", "domain", "person"]),
  value: z.string(),
  reason: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type DoNotContact = z.infer<typeof DoNotContactSchema>;

// ============================================
// API Request/Response Schemas
// ============================================

export const GenerateLeadsRequestSchema = z.object({
  mode: z.enum(["hunt", "watch"]).default("hunt"),
  limit: z.number().min(1).max(100).default(50),
  listId: z.string().optional(), // For watch mode
});
export type GenerateLeadsRequest = z.infer<typeof GenerateLeadsRequestSchema>;

export const UpdateLeadStatusRequestSchema = z.object({
  status: LeadStatusSchema,
});
export type UpdateLeadStatusRequest = z.infer<typeof UpdateLeadStatusRequestSchema>;

export const ImportWatchListRequestSchema = z.object({
  listId: z.string(),
  domains: z.array(z.string()),
});
export type ImportWatchListRequest = z.infer<typeof ImportWatchListRequestSchema>;

export const TestSignalRequestSchema = z.object({
  signal: SignalDefinitionSchema,
  testDomains: z.array(z.string()).optional(),
  sampleSize: z.number().min(1).max(10).default(3),
});
export type TestSignalRequest = z.infer<typeof TestSignalRequestSchema>;

export const TestSignalResultSchema = z.object({
  queriesExecuted: z.array(z.string()),
  matchesFound: z.number(),
  evidenceExtracted: z.array(EvidenceChunkSchema),
  scoreImpact: z.number(),
  qualityChecklist: z.object({
    isSpecific: z.boolean(),
    isObservable: z.boolean(),
    hasQualifiers: z.boolean(),
    lowAmbiguity: z.boolean(),
  }),
});
export type TestSignalResult = z.infer<typeof TestSignalResultSchema>;
