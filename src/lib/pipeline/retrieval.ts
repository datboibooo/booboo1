import { getSearchProvider, SearchResult, SearchOptions } from "@/lib/providers/search";
import { SearchQuery } from "@/lib/schemas";
import { sleep, chunkArray } from "@/lib/utils";

export interface RetrievalResult {
  query: SearchQuery;
  results: SearchResult[];
  error?: string;
}

export interface RetrievalStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  totalResults: number;
}

const RATE_LIMIT_DELAY_MS = 200; // Delay between requests
const CONCURRENT_REQUESTS = 3; // Max concurrent requests
const RESULTS_PER_QUERY = 10;

export async function executeSearchQueries(
  queries: SearchQuery[],
  options?: {
    excludeDomains?: string[];
    maxResultsPerQuery?: number;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<{ results: RetrievalResult[]; stats: RetrievalStats }> {
  const search = getSearchProvider();
  const results: RetrievalResult[] = [];
  const stats: RetrievalStats = {
    totalQueries: queries.length,
    successfulQueries: 0,
    failedQueries: 0,
    totalResults: 0,
  };

  const searchOptions: SearchOptions = {
    maxResults: options?.maxResultsPerQuery || RESULTS_PER_QUERY,
    excludeDomains: options?.excludeDomains || [],
  };

  // Process in batches for rate limiting
  const batches = chunkArray(queries, CONCURRENT_REQUESTS);

  let completed = 0;
  for (const batch of batches) {
    const batchPromises = batch.map(async (query) => {
      try {
        const response = await search.search(query.query, searchOptions);
        stats.successfulQueries++;
        stats.totalResults += response.results.length;
        return {
          query,
          results: response.results,
        };
      } catch (error) {
        stats.failedQueries++;
        return {
          query,
          results: [],
          error: error instanceof Error ? error.message : "Search failed",
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    completed += batch.length;
    options?.onProgress?.(completed, queries.length);

    // Rate limiting between batches
    if (completed < queries.length) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  return { results, stats };
}

export function deduplicateResults(results: RetrievalResult[]): SearchResult[] {
  const seen = new Set<string>();
  const unique: SearchResult[] = [];

  for (const r of results) {
    for (const result of r.results) {
      // Use URL as dedup key
      const key = normalizeUrl(result.url);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }
  }

  return unique;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash and query params for dedup
    return `${parsed.hostname}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return url.toLowerCase();
  }
}
