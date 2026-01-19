import { SearchProvider, SearchOptions, SearchResponse, SearchResult } from "./types";
import { retryWithBackoff } from "@/lib/utils";

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  query: string;
}

export class TavilyProvider implements SearchProvider {
  name = "tavily";
  private apiKey: string;
  private baseUrl = "https://api.tavily.com";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TAVILY_API_KEY || "";
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    if (!this.apiKey) {
      throw new Error("Tavily API key not configured");
    }

    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          search_depth: options?.searchDepth || "basic",
          max_results: options?.maxResults || 10,
          include_domains: options?.includeDomains || [],
          exclude_domains: options?.excludeDomains || [],
          include_answer: false,
          include_raw_content: false,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Tavily search failed: ${res.status} - ${error}`);
      }

      return res.json() as Promise<TavilyResponse>;
    });

    const results: SearchResult[] = response.results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      publishedDate: r.published_date,
    }));

    return {
      results,
      query,
      totalResults: results.length,
    };
  }
}
