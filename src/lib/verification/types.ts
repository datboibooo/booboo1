import { z } from "zod";

// ============================================
// Claim Types
// ============================================

export const ClaimTypeSchema = z.enum([
  "funding_raised",
  "funding_amount",
  "acquisition_announced",
  "acquisition_target",
  "acquisition_acquirer",
  "ipo_announced",
  "ipo_valuation",
  "leadership_hire",
  "leadership_departure",
  "expansion_geographic",
  "expansion_office",
  "product_launch",
  "partnership_announced",
  "partnership_partner",
  "hiring_initiative",
  "hiring_role",
  "layoff_announced",
  "revenue_milestone",
  "other",
]);
export type ClaimType = z.infer<typeof ClaimTypeSchema>;

// ============================================
// Evidence Types
// ============================================

export const EvidenceSourceTypeSchema = z.enum([
  "rss_article",
  "company_press",
  "company_newsroom",
  "company_careers",
  "company_about",
  "third_party_news",
  "sec_filing",
  "jobs_board",
  "crunchbase",
  "pitchbook",
  "registry",
  "social_official",
  "other",
]);
export type EvidenceSourceType = z.infer<typeof EvidenceSourceTypeSchema>;

export const EvidenceSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  canonicalUrl: z.string().url(),
  title: z.string(),
  snippet: z.string().max(1000),
  fullText: z.string().optional(),
  sourceType: EvidenceSourceTypeSchema,
  publisher: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
  fetchedAt: z.string().datetime(),
  contentHash: z.string(), // For deduplication
  reliabilityScore: z.number().min(0).max(1).optional(),
  isOfficial: z.boolean().default(false),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

// ============================================
// Claim Structure
// ============================================

export const ClaimSchema = z.object({
  id: z.string(),
  type: ClaimTypeSchema,
  statement: z.string(), // e.g., "Company X raised $50M Series B"
  entities: z.object({
    company: z.string().optional(),
    amount: z.string().optional(),
    date: z.string().optional(),
    person: z.string().optional(),
    partner: z.string().optional(),
    location: z.string().optional(),
  }),
  verificationRequirements: z.array(z.string()), // Hard gates
  extractedFrom: z.string(), // Source claim came from
});
export type Claim = z.infer<typeof ClaimSchema>;

// ============================================
// Claim Verification Status
// ============================================

export const ClaimStatusSchema = z.enum([
  "verified",
  "partially_verified",
  "contradicted",
  "insufficient_evidence",
  "unknown",
]);
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

export const ClaimVerificationSchema = z.object({
  claimId: z.string(),
  claim: ClaimSchema,
  status: ClaimStatusSchema,
  confidence: z.number().min(0).max(1),
  supportingEvidence: z.array(
    z.object({
      evidenceId: z.string(),
      url: z.string().url(),
      snippet: z.string(),
      relevanceScore: z.number().min(0).max(1),
      sourceType: EvidenceSourceTypeSchema,
    })
  ),
  contradictingEvidence: z.array(
    z.object({
      evidenceId: z.string(),
      url: z.string().url(),
      snippet: z.string(),
      contradictionType: z.string(),
      sourceType: EvidenceSourceTypeSchema,
    })
  ),
  gatesPassed: z.array(z.string()),
  gatesFailed: z.array(z.string()),
  reasoning: z.string(),
});
export type ClaimVerification = z.infer<typeof ClaimVerificationSchema>;

// ============================================
// Company Identity
// ============================================

export const CompanyIdentitySchema = z.object({
  canonicalName: z.string(),
  domain: z.string().optional(),
  domainConfidence: z.enum(["high", "medium", "low", "unknown"]),
  aliases: z.array(z.string()),
  industry: z.string().optional(),
  headquarters: z.string().optional(),
  identifiedFrom: z.array(z.string()), // Evidence IDs used
});
export type CompanyIdentity = z.infer<typeof CompanyIdentitySchema>;

// ============================================
// Verification Result
// ============================================

export const OverallStatusSchema = z.enum([
  "verified",
  "watchlist",
  "discard",
]);
export type OverallStatus = z.infer<typeof OverallStatusSchema>;

export const ConfidenceBandSchema = z.enum([
  "high",    // 0.8-1.0
  "medium",  // 0.5-0.8
  "low",     // 0.2-0.5
  "unknown", // 0-0.2
]);
export type ConfidenceBand = z.infer<typeof ConfidenceBandSchema>;

export const VerificationMetadataSchema = z.object({
  verifierVersion: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  durationMs: z.number(),
  cacheStats: z.object({
    urlHits: z.number(),
    urlMisses: z.number(),
    claimHits: z.number(),
    claimMisses: z.number(),
  }),
  rateLimitStats: z.object({
    exaRequestsMade: z.number().optional(),
    firecrawlRequestsMade: z.number().optional(),
    fallbackFetchesMade: z.number(),
  }),
  evidenceSourcesQueried: z.number(),
  llmCallsMade: z.number(),
});
export type VerificationMetadata = z.infer<typeof VerificationMetadataSchema>;

export const VerificationResultSchema = z.object({
  // Input echo
  inputCompany: z.string(),
  inputDomain: z.string().optional(),
  inputSignalType: z.string(),
  rssItemUrl: z.string().url(),

  // Company identity
  companyIdentity: CompanyIdentitySchema,

  // Claims
  claims: z.array(ClaimSchema),
  claimVerifications: z.array(ClaimVerificationSchema),

  // Overall assessment
  overallStatus: OverallStatusSchema,
  overallConfidence: z.number().min(0).max(1),
  confidenceBand: ConfidenceBandSchema,
  statusReason: z.string(),

  // Top evidence
  topSupportingEvidence: z.array(
    z.object({
      url: z.string().url(),
      title: z.string(),
      snippet: z.string(),
      sourceType: EvidenceSourceTypeSchema,
      relevanceScore: z.number(),
    })
  ).max(5),
  topContradictingEvidence: z.array(
    z.object({
      url: z.string().url(),
      title: z.string(),
      snippet: z.string(),
      contradictionType: z.string(),
    })
  ).max(3),

  // All evidence collected
  allEvidence: z.array(EvidenceSchema),

  // Metadata
  metadata: VerificationMetadataSchema,
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

// ============================================
// Verification Input
// ============================================

export const VerifySignalInputSchema = z.object({
  company: z.string().min(1),
  domain: z.string().optional(),
  rawSignal: z.object({
    type: z.string(),
    details: z.string(),
    relevanceScore: z.number().optional(),
  }),
  rssItem: z.object({
    title: z.string(),
    link: z.string().url(),
    content: z.string(),
    contentSnippet: z.string(),
    pubDate: z.string(),
    sourceName: z.string(),
  }),
});
export type VerifySignalInput = z.infer<typeof VerifySignalInputSchema>;

// ============================================
// Reliability Weights (loaded from config)
// ============================================

export const SourceWeightsSchema = z.record(
  EvidenceSourceTypeSchema,
  z.number().min(0).max(1)
);
export type SourceWeights = z.infer<typeof SourceWeightsSchema>;

export const ReliabilityConfigSchema = z.object({
  version: z.string(),
  sourceTypeWeights: SourceWeightsSchema,
  publisherAllowlist: z.record(z.string(), z.number().min(0).max(1)),
  recencyDecay: z.object({
    halfLifeDays: z.number(),
    minWeight: z.number().min(0).max(1),
  }),
  specificityFactors: z.object({
    hasExactNumbers: z.number(),
    hasNamedPeople: z.number(),
    hasSpecificDates: z.number(),
    hasQuotes: z.number(),
  }),
  duplicationPenalty: z.number().min(0).max(1),
  confidenceThresholds: z.object({
    verified: z.number(),
    watchlist: z.number(),
    discard: z.number(),
  }),
  hardGates: z.record(ClaimTypeSchema, z.array(z.string())),
});
export type ReliabilityConfig = z.infer<typeof ReliabilityConfigSchema>;
