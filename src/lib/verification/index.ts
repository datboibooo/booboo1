// Main entry point
export { verifySignal, getVerificationLogs, clearVerificationLogs } from "./signal-verifier";

// Types
export type {
  VerifySignalInput,
  VerificationResult,
  Claim,
  ClaimType,
  ClaimStatus,
  ClaimVerification,
  Evidence,
  EvidenceSourceType,
  CompanyIdentity,
  OverallStatus,
  ConfidenceBand,
  ReliabilityConfig,
  VerificationMetadata,
} from "./types";

// Schemas for validation
export {
  VerifySignalInputSchema,
  VerificationResultSchema,
  ClaimSchema,
  ClaimTypeSchema,
  EvidenceSchema,
  EvidenceSourceTypeSchema,
  ReliabilityConfigSchema,
} from "./types";

// Cache utilities
export {
  getCacheStats,
  cleanupExpiredCache,
  hashClaim,
  hashContent,
} from "./cache";

// Evidence collection (for testing)
export { collectEvidence } from "./evidence-collector";

// Claim extraction (for testing)
export { extractClaims, mergeSimilarClaims } from "./claim-extractor";

// Claim verification (for testing)
export { verifyClaim, verifyAllClaims } from "./claim-verifier";

// Confidence calculation (for testing)
export {
  calculateEvidenceReliability,
  calculateOverallConfidence,
  explainConfidence,
} from "./confidence-calculator";
