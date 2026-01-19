import { EvidenceChunk, EvidenceSourceTypeSchema } from "@/lib/schemas";
import { SearchResult } from "@/lib/providers/search";
import { CandidateCompany } from "@/lib/schemas";
import { hashString, sleep, chunkArray, retryWithBackoff } from "@/lib/utils";

const FETCH_TIMEOUT_MS = 10000;
const CONCURRENT_FETCHES = 5;
const MAX_CONTENT_LENGTH = 50000;

export interface FetchedEvidence {
  domain: string;
  chunks: EvidenceChunk[];
}

export async function fetchEvidenceForCandidates(
  candidates: CandidateCompany[],
  searchResults: SearchResult[],
  options?: {
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<FetchedEvidence[]> {
  // Group search results by domain
  const resultsByDomain = new Map<string, SearchResult[]>();

  for (const candidate of candidates) {
    resultsByDomain.set(candidate.domain, []);
  }

  for (const result of searchResults) {
    const domain = extractDomainFromUrl(result.url);
    if (resultsByDomain.has(domain)) {
      resultsByDomain.get(domain)!.push(result);
    }
  }

  // Also add the source URLs from candidates
  for (const candidate of candidates) {
    const existing = resultsByDomain.get(candidate.domain) || [];
    const hasCandidateSource = existing.some((r) => r.url === candidate.sourceUrl);
    if (!hasCandidateSource) {
      existing.push({
        url: candidate.sourceUrl,
        title: candidate.companyName,
        snippet: candidate.snippet,
      });
      resultsByDomain.set(candidate.domain, existing);
    }
  }

  const results: FetchedEvidence[] = [];
  const entries = Array.from(resultsByDomain.entries());
  const batches = chunkArray(entries, CONCURRENT_FETCHES);

  let completed = 0;
  for (const batch of batches) {
    const batchPromises = batch.map(async ([domain, domainResults]) => {
      const chunks = await fetchEvidenceChunks(domain, domainResults);
      return { domain, chunks };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    completed += batch.length;
    options?.onProgress?.(completed, entries.length);

    if (completed < entries.length) {
      await sleep(100);
    }
  }

  return results;
}

async function fetchEvidenceChunks(
  domain: string,
  results: SearchResult[]
): Promise<EvidenceChunk[]> {
  const chunks: EvidenceChunk[] = [];
  const seenHashes = new Set<string>();

  for (const result of results.slice(0, 5)) {
    // Limit to 5 URLs per domain
    try {
      const evidenceChunks = await extractEvidenceFromResult(result);

      for (const chunk of evidenceChunks) {
        if (!seenHashes.has(chunk.hash)) {
          seenHashes.add(chunk.hash);
          chunks.push(chunk);
        }
      }
    } catch (error) {
      // Log but continue
      console.warn(`Failed to fetch evidence from ${result.url}:`, error);
    }
  }

  return chunks;
}

async function extractEvidenceFromResult(
  result: SearchResult
): Promise<EvidenceChunk[]> {
  const chunks: EvidenceChunk[] = [];
  const sourceType = detectSourceType(result.url, result.title);

  // First, use the snippet from search results (always available)
  if (result.snippet && result.snippet.length > 20) {
    chunks.push({
      url: result.url,
      title: result.title || "",
      snippet: result.snippet,
      sourceType,
      fetchedAt: new Date().toISOString(),
      hash: hashString(`${result.url}:${result.snippet}`),
    });
  }

  // Optionally fetch the page for more context (lightweight)
  try {
    const pageContent = await fetchPageContent(result.url);
    if (pageContent) {
      const extractedSnippets = extractRelevantSnippets(pageContent);
      for (const snippet of extractedSnippets) {
        const hash = hashString(`${result.url}:${snippet}`);
        if (!chunks.some((c) => c.hash === hash)) {
          chunks.push({
            url: result.url,
            title: result.title || "",
            snippet,
            sourceType,
            fetchedAt: new Date().toISOString(),
            hash,
          });
        }
      }
    }
  } catch {
    // Silently skip page fetch failures
  }

  return chunks;
}

async function fetchPageContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await retryWithBackoff(
      async () => {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; LeadDrip/1.0; +https://leaddrip.com)",
            Accept: "text/html,application/xhtml+xml",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        return res;
      },
      2,
      500
    );

    clearTimeout(timeout);

    const text = await response.text();
    return text.slice(0, MAX_CONTENT_LENGTH);
  } catch {
    return null;
  }
}

function extractRelevantSnippets(html: string): string[] {
  const snippets: string[] = [];

  // Remove scripts, styles, and HTML tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Extract meaningful paragraphs (sentences between 50-500 chars)
  const sentences = text.split(/[.!?]+/).filter((s) => {
    const trimmed = s.trim();
    return trimmed.length >= 50 && trimmed.length <= 500;
  });

  // Take first 3 meaningful sentences
  for (const sentence of sentences.slice(0, 3)) {
    snippets.push(sentence.trim() + ".");
  }

  return snippets;
}

function detectSourceType(
  url: string,
  title: string
): EvidenceChunk["sourceType"] {
  const urlLower = url.toLowerCase();
  const titleLower = (title || "").toLowerCase();

  // Job posts
  if (
    urlLower.includes("/jobs") ||
    urlLower.includes("/careers") ||
    urlLower.includes("greenhouse.io") ||
    urlLower.includes("lever.co") ||
    urlLower.includes("workday.com") ||
    titleLower.includes("job") ||
    titleLower.includes("hiring") ||
    titleLower.includes("career")
  ) {
    return "job_post";
  }

  // Press releases
  if (
    urlLower.includes("prnewswire") ||
    urlLower.includes("businesswire") ||
    urlLower.includes("globenewswire") ||
    urlLower.includes("/press") ||
    urlLower.includes("/news") ||
    titleLower.includes("announces") ||
    titleLower.includes("press release")
  ) {
    return "press_release";
  }

  // SEC filings
  if (
    urlLower.includes("sec.gov") ||
    urlLower.includes("edgar") ||
    titleLower.includes("sec filing") ||
    titleLower.includes("10-k") ||
    titleLower.includes("10-q")
  ) {
    return "sec_filing";
  }

  // Blog
  if (
    urlLower.includes("/blog") ||
    urlLower.includes("medium.com") ||
    urlLower.includes("substack")
  ) {
    return "blog";
  }

  // News
  if (
    urlLower.includes("techcrunch") ||
    urlLower.includes("reuters") ||
    urlLower.includes("bloomberg") ||
    urlLower.includes("venturebeat") ||
    urlLower.includes("forbes")
  ) {
    return "news";
  }

  // Company site (if domain matches candidate)
  if (
    urlLower.includes("/about") ||
    urlLower.includes("/team") ||
    urlLower.includes("/company")
  ) {
    return "company_site";
  }

  return "other";
}

function extractDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
