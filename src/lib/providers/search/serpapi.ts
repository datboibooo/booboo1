import { SearchProvider, SearchOptions, SearchResponse, SearchResult } from "./types";
import { retryWithBackoff } from "@/lib/utils";

interface SerpApiOrganicResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  source?: string;
}

interface SerpApiResponse {
  organic_results: SerpApiOrganicResult[];
  search_information?: {
    total_results?: number;
  };
}

export class SerpApiProvider implements SearchProvider {
  name = "serpapi";
  private apiKey: string;
  private baseUrl = "https://serpapi.com/search.json";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SERPAPI_KEY || "";
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    if (!this.apiKey) {
      throw new Error("SerpAPI key not configured");
    }

    const params = new URLSearchParams({
      api_key: this.apiKey,
      q: query,
      engine: "google",
      num: String(options?.maxResults || 10),
    });

    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${this.baseUrl}?${params.toString()}`);

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`SerpAPI search failed: ${res.status} - ${error}`);
      }

      return res.json() as Promise<SerpApiResponse>;
    });

    const results: SearchResult[] = (response.organic_results || []).map((r) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
      publishedDate: r.date,
      source: r.source,
    }));

    return {
      results,
      query,
      totalResults: response.search_information?.total_results,
    };
  }
}
