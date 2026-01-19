import { z } from "zod";
import { Claim, ClaimType, ClaimTypeSchema } from "./types";
import { getLLMProvider } from "@/lib/providers/llm";
import { createId } from "@paralleldrive/cuid2";

// ============================================
// LLM Schema for Claim Extraction
// ============================================

const ExtractedClaimSchema = z.object({
  type: ClaimTypeSchema,
  statement: z.string().describe("The specific claim being made"),
  entities: z.object({
    company: z.string().optional().describe("Company name if mentioned"),
    amount: z.string().optional().describe("Dollar amount if mentioned (e.g., '$50M')"),
    date: z.string().optional().describe("Date if mentioned (e.g., 'January 2025')"),
    person: z.string().optional().describe("Person name if mentioned"),
    partner: z.string().optional().describe("Partner company if mentioned"),
    location: z.string().optional().describe("Location if mentioned"),
  }),
  confidence: z.number().min(0).max(1).describe("How confident the claim is stated (1 = explicit, 0.5 = implied)"),
});

const ClaimExtractionResultSchema = z.object({
  claims: z.array(ExtractedClaimSchema),
  companyCanonicalName: z.string().describe("The canonical/official company name"),
  companyDomain: z.string().optional().describe("Company domain if can be determined with high confidence"),
  domainConfidence: z.enum(["high", "medium", "low"]).describe("Confidence in the domain"),
});

type ClaimExtractionResult = z.infer<typeof ClaimExtractionResultSchema>;

// ============================================
// Verification Requirements by Claim Type
// ============================================

const VERIFICATION_REQUIREMENTS: Record<ClaimType, string[]> = {
  funding_raised: [
    "official_announcement_or_2_reputable_sources",
    "amount_consistent_across_sources",
  ],
  funding_amount: [
    "official_announcement_or_2_reputable_sources",
    "amount_not_contradicted",
  ],
  acquisition_announced: [
    "official_from_either_party_or_2_reputable",
    "no_denial_found",
  ],
  acquisition_target: ["company_name_confirmed"],
  acquisition_acquirer: ["company_name_confirmed"],
  ipo_announced: [
    "sec_filing_or_official_announcement",
    "no_postponement_notice",
  ],
  ipo_valuation: ["official_source_or_sec_filing"],
  leadership_hire: [
    "official_announcement_or_company_page",
    "person_exists_verification",
  ],
  leadership_departure: ["official_announcement_or_2_reputable", "no_retraction"],
  expansion_geographic: ["official_announcement_or_job_postings"],
  expansion_office: ["official_announcement_or_verifiable_address"],
  product_launch: ["official_product_page_or_announcement"],
  partnership_announced: ["confirmation_from_at_least_one_official_party"],
  partnership_partner: ["partner_name_verified"],
  hiring_initiative: ["official_careers_page_or_job_listings"],
  hiring_role: ["active_job_posting_found"],
  layoff_announced: ["official_statement_or_2_reputable_sources", "no_retraction"],
  revenue_milestone: ["official_announcement_or_sec_filing"],
  other: [],
};

// ============================================
// Claim Extraction
// ============================================

export interface ExtractClaimsInput {
  company: string;
  domain?: string;
  signalType: string;
  signalDetails: string;
  rssTitle: string;
  rssContent: string;
  rssSource: string;
}

export interface ExtractClaimsResult {
  claims: Claim[];
  companyIdentity: {
    canonicalName: string;
    domain?: string;
    domainConfidence: "high" | "medium" | "low" | "unknown";
  };
  llmCalls: number;
}

export async function extractClaims(
  input: ExtractClaimsInput
): Promise<ExtractClaimsResult> {
  const llm = getLLMProvider();
  let llmCalls = 0;
  let retries = 0;
  const maxRetries = 2;

  const prompt = `Analyze this news article and extract specific, verifiable claims.

Company: ${input.company}
${input.domain ? `Domain: ${input.domain}` : ""}

Signal Type: ${input.signalType}
Signal Details: ${input.signalDetails}

RSS Article:
Title: ${input.rssTitle}
Source: ${input.rssSource}
Content: ${input.rssContent}

Instructions:
1. Extract each distinct, factual claim from the article about this company
2. For each claim, identify:
   - The type of claim (funding, acquisition, hiring, etc.)
   - The exact statement being made
   - Any specific entities mentioned (amounts, people, dates, partners)
   - How explicitly the claim is stated (1.0 = directly stated, 0.5 = implied/rumored)

3. Determine the canonical company name (official name, not abbreviation)
4. If you can determine the company's website domain with HIGH confidence from the article, include it

Focus on claims that are:
- Specific and verifiable (not vague statements)
- Related to the signal type
- About the target company (not other companies mentioned tangentially)

Do NOT fabricate any information. Only extract what is explicitly stated or clearly implied.`;

  while (retries <= maxRetries) {
    try {
      const result = await llm.completeStructured(
        [{ role: "user", content: prompt }],
        {
          schema: ClaimExtractionResultSchema,
          schemaName: "ClaimExtraction",
          maxRetries: 1,
        },
        { temperature: 0.1, maxTokens: 2000 }
      );
      llmCalls++;

      // Convert to Claim[] with IDs and verification requirements
      const claims: Claim[] = result.claims.map((c) => ({
        id: createId(),
        type: c.type,
        statement: c.statement,
        entities: c.entities,
        verificationRequirements: VERIFICATION_REQUIREMENTS[c.type] || [],
        extractedFrom: `RSS: ${input.rssTitle}`,
      }));

      return {
        claims,
        companyIdentity: {
          canonicalName: result.companyCanonicalName || input.company,
          domain: result.companyDomain || input.domain,
          domainConfidence: result.domainConfidence || "unknown",
        },
        llmCalls,
      };
    } catch (error) {
      retries++;
      llmCalls++;
      console.warn(`Claim extraction attempt ${retries} failed:`, error);

      if (retries > maxRetries) {
        // Return a single basic claim on failure
        return {
          claims: [
            {
              id: createId(),
              type: mapSignalTypeToClaim(input.signalType),
              statement: input.signalDetails,
              entities: { company: input.company },
              verificationRequirements:
                VERIFICATION_REQUIREMENTS[mapSignalTypeToClaim(input.signalType)] || [],
              extractedFrom: `RSS: ${input.rssTitle}`,
            },
          ],
          companyIdentity: {
            canonicalName: input.company,
            domain: input.domain,
            domainConfidence: input.domain ? "medium" : "unknown",
          },
          llmCalls,
        };
      }
    }
  }

  // Should not reach here, but TypeScript needs a return
  return {
    claims: [],
    companyIdentity: {
      canonicalName: input.company,
      domain: input.domain,
      domainConfidence: "unknown",
    },
    llmCalls,
  };
}

// ============================================
// Helper Functions
// ============================================

function mapSignalTypeToClaim(signalType: string): ClaimType {
  const mapping: Record<string, ClaimType> = {
    funding_round: "funding_raised",
    acquisition: "acquisition_announced",
    ipo: "ipo_announced",
    leadership_change: "leadership_hire",
    expansion: "expansion_geographic",
    product_launch: "product_launch",
    partnership: "partnership_announced",
    hiring: "hiring_initiative",
    layoff: "layoff_announced",
  };
  return mapping[signalType] || "other";
}

// ============================================
// Claim Merging (for near-duplicate claims)
// ============================================

export function mergeSimilarClaims(claims: Claim[]): Claim[] {
  // Group claims by type
  const byType = new Map<ClaimType, Claim[]>();
  for (const claim of claims) {
    const existing = byType.get(claim.type) || [];
    existing.push(claim);
    byType.set(claim.type, existing);
  }

  const merged: Claim[] = [];

  for (const [type, typeClaims] of byType) {
    if (typeClaims.length === 1) {
      merged.push(typeClaims[0]);
      continue;
    }

    // For multiple claims of same type, keep the most specific one
    const sorted = typeClaims.sort((a, b) => {
      const aSpecificity = countEntities(a.entities);
      const bSpecificity = countEntities(b.entities);
      return bSpecificity - aSpecificity;
    });

    // Keep the most specific claim
    merged.push(sorted[0]);

    // Merge any unique entities from other claims
    for (let i = 1; i < sorted.length; i++) {
      for (const [key, value] of Object.entries(sorted[i].entities)) {
        if (value && !sorted[0].entities[key as keyof typeof sorted[0]["entities"]]) {
          (sorted[0].entities as Record<string, string | undefined>)[key] = value;
        }
      }
    }
  }

  return merged;
}

function countEntities(entities: Record<string, string | undefined>): number {
  return Object.values(entities).filter((v) => v !== undefined && v !== "").length;
}
