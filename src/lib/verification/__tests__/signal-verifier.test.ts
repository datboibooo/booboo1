import { describe, it, expect, beforeEach } from "vitest";
import {
  hashClaim,
  hashContent,
  getCacheStats,
  cleanupExpiredCache,
} from "../cache";
import {
  calculateEvidenceReliability,
  calculateOverallConfidence,
} from "../confidence-calculator";
import { mergeSimilarClaims } from "../claim-extractor";
import {
  fundingEvidence,
  fundingClaims,
  hiringEvidence,
  hiringClaims,
  partnershipEvidence,
  partnershipClaims,
  contradictedEvidence,
} from "./fixtures";
import { ClaimVerification, Evidence, Claim } from "../types";

// ============================================
// Cache Tests
// ============================================

describe("Cache", () => {
  describe("hashClaim", () => {
    it("should produce consistent hashes for same claim", () => {
      const claim1 = {
        type: "funding_raised",
        statement: "Acme Corp raised $50M",
        entities: { company: "Acme Corp", amount: "$50M" },
      };
      const claim2 = {
        type: "funding_raised",
        statement: "Acme Corp raised $50M",
        entities: { company: "Acme Corp", amount: "$50M" },
      };

      expect(hashClaim(claim1)).toBe(hashClaim(claim2));
    });

    it("should produce different hashes for different claims", () => {
      const claim1 = {
        type: "funding_raised",
        statement: "Acme Corp raised $50M",
        entities: { company: "Acme Corp", amount: "$50M" },
      };
      const claim2 = {
        type: "funding_raised",
        statement: "Acme Corp raised $100M",
        entities: { company: "Acme Corp", amount: "$100M" },
      };

      expect(hashClaim(claim1)).not.toBe(hashClaim(claim2));
    });

    it("should normalize case and whitespace", () => {
      const claim1 = {
        type: "funding_raised",
        statement: "Acme Corp Raised $50M",
        entities: { company: "ACME CORP" },
      };
      const claim2 = {
        type: "funding_raised",
        statement: "acme corp raised $50m",
        entities: { company: "acme corp" },
      };

      expect(hashClaim(claim1)).toBe(hashClaim(claim2));
    });
  });

  describe("hashContent", () => {
    it("should produce consistent hashes for similar content", () => {
      const content1 = "Acme Corp raised $50 million in funding";
      const content2 = "Acme Corp raised $50 million in funding.";

      expect(hashContent(content1)).toBe(hashContent(content2));
    });

    it("should detect near-duplicate content", () => {
      const content1 =
        "Acme Corp, the enterprise AI platform company, announced today...";
      const content2 =
        "Acme Corp, the enterprise AI platform company, announced today that...";

      // These should produce the same hash because they're similar enough
      // (first 500 chars normalized)
      expect(hashContent(content1)).toBe(hashContent(content2));
    });
  });

  describe("getCacheStats", () => {
    it("should return cache statistics", () => {
      const stats = getCacheStats();

      expect(stats).toHaveProperty("url");
      expect(stats).toHaveProperty("claim");
      expect(stats.url).toHaveProperty("hits");
      expect(stats.url).toHaveProperty("misses");
      expect(stats.url).toHaveProperty("size");
    });
  });
});

// ============================================
// Confidence Calculator Tests
// ============================================

describe("Confidence Calculator", () => {
  describe("calculateEvidenceReliability", () => {
    it("should give higher weight to official sources", () => {
      const officialEvidence = fundingEvidence.find(
        (e) => e.sourceType === "company_press"
      )!;
      const rssEvidence = fundingEvidence.find(
        (e) => e.sourceType === "rss_article"
      )!;

      const officialScore = calculateEvidenceReliability(
        officialEvidence,
        fundingEvidence
      );
      const rssScore = calculateEvidenceReliability(rssEvidence, fundingEvidence);

      expect(officialScore.sourceTypeWeight).toBeGreaterThan(
        rssScore.sourceTypeWeight
      );
    });

    it("should apply recency decay to older content", () => {
      const recentEvidence: Evidence = {
        ...fundingEvidence[0],
        id: "recent",
        publishedAt: new Date().toISOString(),
      };

      const oldEvidence: Evidence = {
        ...fundingEvidence[0],
        id: "old",
        publishedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      };

      const recentScore = calculateEvidenceReliability(recentEvidence, [
        recentEvidence,
      ]);
      const oldScore = calculateEvidenceReliability(oldEvidence, [oldEvidence]);

      expect(recentScore.recencyWeight).toBeGreaterThan(oldScore.recencyWeight);
    });

    it("should apply duplication penalty for duplicate content", () => {
      const duplicatedEvidence: Evidence[] = [
        { ...fundingEvidence[0], id: "dup1", contentHash: "same_hash" },
        { ...fundingEvidence[0], id: "dup2", contentHash: "same_hash" },
        { ...fundingEvidence[0], id: "dup3", contentHash: "same_hash" },
      ];

      const score = calculateEvidenceReliability(
        duplicatedEvidence[0],
        duplicatedEvidence
      );

      expect(score.duplicationPenalty).toBeGreaterThan(0);
    });

    it("should give 0 weight to LinkedIn sources", () => {
      const linkedInEvidence: Evidence = {
        ...fundingEvidence[0],
        id: "linkedin",
        url: "https://linkedin.com/company/acme",
        canonicalUrl: "https://linkedin.com/company/acme",
        publisher: "LinkedIn",
      };

      const score = calculateEvidenceReliability(linkedInEvidence, [
        linkedInEvidence,
      ]);

      expect(score.finalWeight).toBe(0);
    });
  });

  describe("calculateOverallConfidence", () => {
    it("should return high confidence for well-supported claims", () => {
      const verifications: ClaimVerification[] = [
        {
          claimId: "claim_1",
          claim: fundingClaims[0],
          status: "verified",
          confidence: 0.9,
          supportingEvidence: [
            {
              evidenceId: "ev_1",
              url: fundingEvidence[0].url,
              snippet: fundingEvidence[0].snippet,
              relevanceScore: 0.9,
              sourceType: fundingEvidence[0].sourceType,
            },
            {
              evidenceId: "ev_2",
              url: fundingEvidence[1].url,
              snippet: fundingEvidence[1].snippet,
              relevanceScore: 0.95,
              sourceType: fundingEvidence[1].sourceType,
            },
          ],
          contradictingEvidence: [],
          gatesPassed: [
            "official_announcement_or_2_reputable_sources",
            "amount_consistent_across_sources",
          ],
          gatesFailed: [],
          reasoning: "Multiple high-quality sources confirm the funding",
        },
      ];

      const result = calculateOverallConfidence(verifications, fundingEvidence);

      expect(result.overallConfidence).toBeGreaterThan(0.7);
      expect(result.overallStatus).toBe("verified");
    });

    it("should return low confidence for contradicted claims", () => {
      const verifications: ClaimVerification[] = [
        {
          claimId: "claim_c1",
          claim: {
            id: "claim_c1",
            type: "funding_raised",
            statement: "FailCorp raised $100M",
            entities: { company: "FailCorp", amount: "$100M" },
            verificationRequirements: [],
            extractedFrom: "RSS",
          },
          status: "contradicted",
          confidence: 0.1,
          supportingEvidence: [
            {
              evidenceId: "ev_c1",
              url: contradictedEvidence[0].url,
              snippet: contradictedEvidence[0].snippet,
              relevanceScore: 0.5,
              sourceType: contradictedEvidence[0].sourceType,
            },
          ],
          contradictingEvidence: [
            {
              evidenceId: "ev_c2",
              url: contradictedEvidence[1].url,
              snippet: contradictedEvidence[1].snippet,
              contradictionType: "denial",
              sourceType: contradictedEvidence[1].sourceType,
            },
          ],
          gatesPassed: [],
          gatesFailed: ["official_announcement_or_2_reputable_sources"],
          reasoning: "Official denial contradicts the claim",
        },
      ];

      const result = calculateOverallConfidence(
        verifications,
        contradictedEvidence
      );

      expect(result.overallConfidence).toBeLessThan(0.4);
      expect(result.overallStatus).toBe("discard");
    });

    it("should cap confidence when gates fail", () => {
      const verifications: ClaimVerification[] = [
        {
          claimId: "claim_1",
          claim: fundingClaims[0],
          status: "partially_verified",
          confidence: 0.6,
          supportingEvidence: [
            {
              evidenceId: "ev_1",
              url: fundingEvidence[0].url,
              snippet: fundingEvidence[0].snippet,
              relevanceScore: 0.8,
              sourceType: "other",
            },
          ],
          contradictingEvidence: [],
          gatesPassed: [],
          gatesFailed: ["official_announcement_or_2_reputable_sources"],
          reasoning: "No official source found",
        },
      ];

      const result = calculateOverallConfidence(verifications, [fundingEvidence[0]]);

      // Should be capped below verified threshold
      expect(result.overallConfidence).toBeLessThan(0.75);
      expect(result.overallStatus).not.toBe("verified");
    });
  });
});

// ============================================
// Claim Merger Tests
// ============================================

describe("Claim Merger", () => {
  describe("mergeSimilarClaims", () => {
    it("should merge claims of the same type", () => {
      const claims: Claim[] = [
        {
          id: "c1",
          type: "funding_raised",
          statement: "Company raised $50M",
          entities: { company: "Test", amount: "$50M" },
          verificationRequirements: [],
          extractedFrom: "source1",
        },
        {
          id: "c2",
          type: "funding_raised",
          statement: "Company raised money led by Sequoia",
          entities: { company: "Test", partner: "Sequoia" },
          verificationRequirements: [],
          extractedFrom: "source2",
        },
      ];

      const merged = mergeSimilarClaims(claims);

      // Should keep one claim but merge entities
      expect(merged.length).toBe(1);
      expect(merged[0].entities.amount).toBe("$50M");
      expect(merged[0].entities.partner).toBe("Sequoia");
    });

    it("should keep separate claims of different types", () => {
      const claims: Claim[] = [
        {
          id: "c1",
          type: "funding_raised",
          statement: "Company raised $50M",
          entities: { company: "Test" },
          verificationRequirements: [],
          extractedFrom: "source1",
        },
        {
          id: "c2",
          type: "hiring_initiative",
          statement: "Company is hiring",
          entities: { company: "Test" },
          verificationRequirements: [],
          extractedFrom: "source2",
        },
      ];

      const merged = mergeSimilarClaims(claims);

      expect(merged.length).toBe(2);
    });

    it("should keep the most specific claim when merging", () => {
      const claims: Claim[] = [
        {
          id: "c1",
          type: "funding_raised",
          statement: "Company raised money",
          entities: { company: "Test" },
          verificationRequirements: [],
          extractedFrom: "source1",
        },
        {
          id: "c2",
          type: "funding_raised",
          statement: "Company raised $50M Series B led by Sequoia on Jan 15",
          entities: {
            company: "Test",
            amount: "$50M",
            partner: "Sequoia",
            date: "Jan 15",
          },
          verificationRequirements: [],
          extractedFrom: "source2",
        },
      ];

      const merged = mergeSimilarClaims(claims);

      expect(merged.length).toBe(1);
      expect(merged[0].entities.amount).toBe("$50M");
      expect(merged[0].entities.partner).toBe("Sequoia");
      expect(merged[0].entities.date).toBe("Jan 15");
    });
  });
});

// ============================================
// Signal Type Specific Tests
// ============================================

describe("Signal Type Verification", () => {
  describe("Funding Signals", () => {
    it("should require official announcement or 2 reputable sources", () => {
      const claim = fundingClaims[0];

      expect(claim.verificationRequirements).toContain(
        "official_announcement_or_2_reputable_sources"
      );
    });

    it("should require amount consistency", () => {
      const claim = fundingClaims[0];

      expect(claim.verificationRequirements).toContain(
        "amount_consistent_across_sources"
      );
    });
  });

  describe("Hiring Signals", () => {
    it("should require careers page or job listings", () => {
      const claim = hiringClaims[0];

      expect(claim.verificationRequirements).toContain(
        "official_careers_page_or_job_listings"
      );
    });

    it("should be verifiable via official careers page", () => {
      const careersEvidence = hiringEvidence.find(
        (e) => e.sourceType === "company_careers"
      );

      expect(careersEvidence).toBeDefined();
      expect(careersEvidence?.isOfficial).toBe(true);
    });
  });

  describe("Partnership Signals", () => {
    it("should require confirmation from at least one official party", () => {
      const claim = partnershipClaims[0];

      expect(claim.verificationRequirements).toContain(
        "confirmation_from_at_least_one_official_party"
      );
    });

    it("should be verifiable via official press release", () => {
      const pressEvidence = partnershipEvidence.find(
        (e) => e.sourceType === "company_press"
      );

      expect(pressEvidence).toBeDefined();
      expect(pressEvidence?.isOfficial).toBe(true);
    });
  });
});

// ============================================
// Integration Test (requires mocking LLM)
// ============================================

describe("Integration", () => {
  it("should handle missing evidence gracefully", async () => {
    // This tests that the system doesn't crash with empty evidence
    const result = calculateOverallConfidence([], []);

    expect(result.overallStatus).toBe("discard");
    expect(result.statusReason).toContain("Insufficient");
  });

  it("should handle empty claims gracefully", async () => {
    const result = calculateOverallConfidence([], fundingEvidence);

    expect(result.overallStatus).toBe("discard");
  });
});
