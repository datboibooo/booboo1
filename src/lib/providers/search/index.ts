import { SearchProvider } from "./types";
import { TavilyProvider } from "./tavily";
import { SerpApiProvider } from "./serpapi";
import { BingProvider } from "./bing";

export * from "./types";
export { TavilyProvider } from "./tavily";
export { SerpApiProvider } from "./serpapi";
export { BingProvider } from "./bing";

export type SearchProviderType = "tavily" | "serpapi" | "bing";

let cachedProvider: SearchProvider | null = null;

export function getSearchProvider(type?: SearchProviderType): SearchProvider {
  const providerType = type || (process.env.SEARCH_PROVIDER as SearchProviderType) || "tavily";

  // Return cached if same type
  if (cachedProvider && cachedProvider.name === providerType) {
    return cachedProvider;
  }

  switch (providerType) {
    case "tavily":
      cachedProvider = new TavilyProvider();
      break;
    case "serpapi":
      cachedProvider = new SerpApiProvider();
      break;
    case "bing":
      cachedProvider = new BingProvider();
      break;
    default:
      throw new Error(`Unknown search provider: ${providerType}`);
  }

  return cachedProvider;
}

export function isSearchConfigured(): boolean {
  const provider = process.env.SEARCH_PROVIDER || "tavily";

  switch (provider) {
    case "tavily":
      return !!process.env.TAVILY_API_KEY;
    case "serpapi":
      return !!process.env.SERPAPI_KEY;
    case "bing":
      return !!process.env.BING_SEARCH_KEY;
    default:
      return false;
  }
}
