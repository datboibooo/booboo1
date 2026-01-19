import { SearchProvider, SearchOptions, SearchResponse, SearchResult } from "./types";
import { retryWithBackoff } from "@/lib/utils";

interface BingWebPage {
  name: string;
  url: string;
  snippet: string;
  dateLastCrawled?: string;
  displayUrl?: string;
}

interface BingResponse {
  webPages?: {
    value: BingWebPage[];
    totalEstimatedMatches?: number;
  };
}

export class BingProvider implements SearchProvider {
  name = "bing";
  private apiKey: string;
  private baseUrl = "https://api.bing.microsoft.com/v7.0/search";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BING_SEARCH_KEY || "";
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    if (!this.apiKey) {
      throw new Error("Bing Search API key not configured");
    }

    const params = new URLSearchParams({
      q: query,
      count: String(options?.maxResults || 10),
      responseFilter: "Webpages",
      textFormat: "Raw",
    });

    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${this.baseUrl}?${params.toString()}`, {
        headers: {
          "Ocp-Apim-Subscription-Key": this.apiKey,
        },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Bing search failed: ${res.status} - ${error}`);
      }

      return res.json() as Promise<BingResponse>;
    });

    const results: SearchResult[] = (response.webPages?.value || []).map((r) => ({
      title: r.name,
      url: r.url,
      snippet: r.snippet,
      publishedDate: r.dateLastCrawled,
    }));

    return {
      results,
      query,
      totalResults: response.webPages?.totalEstimatedMatches,
    };
  }
}
