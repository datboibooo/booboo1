import { getLLMProvider, LLMMessage } from "@/lib/providers/llm";
import { SearchResult } from "@/lib/providers/search";
import {
  CandidateExtractionResultSchema,
  CandidateExtractionResult,
  CandidateCompany,
} from "@/lib/schemas";
import { normalizeDomain, chunkArray } from "@/lib/utils";

const CANDIDATE_EXTRACTOR_SYSTEM_PROMPT = `You are an expert at extracting company information from search results. Your job is to identify companies mentioned in search result snippets.

CRITICAL RULES:
1. ONLY extract companies if you can clearly identify their domain
2. Do NOT guess or fabricate domains - only use domains explicitly visible in URLs or snippets
3. If a company is mentioned but domain is unclear, do not include it
4. Extract the company name exactly as it appears
5. Confidence should be:
   - 0.9-1.0: Domain clearly visible in URL or explicitly mentioned
   - 0.7-0.8: Domain can be reasonably inferred from context
   - 0.5-0.6: Domain requires some assumption
   - Below 0.5: Do not include
6. Exclude:
   - News/media sites (nytimes.com, techcrunch.com, etc.)
   - Job boards (linkedin.com, indeed.com, glassdoor.com)
   - Social media (twitter.com, facebook.com)
   - Aggregators and directories
7. Focus on the SUBJECT companies mentioned in the content, not the publishers

OUTPUT: Return a CandidateExtractionResult with candidates array and totalResultsProcessed count.`;

const CHUNK_SIZE = 20; // Process search results in chunks

export async function extractCandidates(
  searchResults: SearchResult[],
  options?: {
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<CandidateCompany[]> {
  const llm = getLLMProvider();
  const chunks = chunkArray(searchResults, CHUNK_SIZE);
  const allCandidates: CandidateCompany[] = [];

  let completed = 0;
  for (const chunk of chunks) {
    const result = await extractCandidatesFromChunk(llm, chunk);
    allCandidates.push(...result.candidates);

    completed += chunk.length;
    options?.onProgress?.(completed, searchResults.length);
  }

  // Deduplicate by domain
  return deduplicateCandidates(allCandidates);
}

async function extractCandidatesFromChunk(
  llm: ReturnType<typeof getLLMProvider>,
  results: SearchResult[]
): Promise<CandidateExtractionResult> {
  const formattedResults = results
    .map((r, i) => `[${i + 1}] URL: ${r.url}\n    Title: ${r.title}\n    Snippet: ${r.snippet}`)
    .join("\n\n");

  const messages: LLMMessage[] = [
    { role: "system", content: CANDIDATE_EXTRACTOR_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Extract company candidates from these search results. Only include companies where you can clearly identify the domain.

SEARCH RESULTS:
${formattedResults}

Return a CandidateExtractionResult JSON with:
- candidates: Array of companies with companyName, domain, sourceUrl, snippet, confidence
- totalResultsProcessed: ${results.length}`,
    },
  ];

  try {
    const extraction = await llm.completeStructured(
      messages,
      {
        schema: CandidateExtractionResultSchema,
        schemaName: "CandidateExtractionResult",
        maxRetries: 2,
      },
      { temperature: 0.3 }
    );

    // Filter out low confidence and normalize domains
    const filtered = extraction.candidates
      .filter((c) => c.confidence >= 0.6)
      .map((c) => ({
        ...c,
        domain: normalizeDomain(c.domain),
      }))
      .filter((c) => isValidCompanyDomain(c.domain));

    return {
      candidates: filtered,
      totalResultsProcessed: extraction.totalResultsProcessed,
    };
  } catch (error) {
    console.error("Candidate extraction failed:", error);
    return {
      candidates: [],
      totalResultsProcessed: results.length,
    };
  }
}

function deduplicateCandidates(candidates: CandidateCompany[]): CandidateCompany[] {
  const seen = new Map<string, CandidateCompany>();

  for (const candidate of candidates) {
    const domain = normalizeDomain(candidate.domain);
    const existing = seen.get(domain);

    // Keep the one with higher confidence
    if (!existing || candidate.confidence > existing.confidence) {
      seen.set(domain, candidate);
    }
  }

  return Array.from(seen.values());
}

const EXCLUDED_DOMAINS = new Set([
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "nytimes.com",
  "techcrunch.com",
  "crunchbase.com",
  "bloomberg.com",
  "reuters.com",
  "wsj.com",
  "forbes.com",
  "businessinsider.com",
  "cnbc.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "wikipedia.org",
  "github.com",
  "medium.com",
  "reddit.com",
]);

function isValidCompanyDomain(domain: string): boolean {
  const normalized = normalizeDomain(domain);

  // Check excluded list
  for (const excluded of EXCLUDED_DOMAINS) {
    if (normalized === excluded || normalized.endsWith(`.${excluded}`)) {
      return false;
    }
  }

  // Basic domain validation
  const parts = normalized.split(".");
  return parts.length >= 2 && parts[parts.length - 1].length >= 2;
}
