import Parser from "rss-parser";
import { RSS_SOURCES, RSSSource, SIGNAL_KEYWORDS } from "./rss-sources";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "LeadDrip/1.0 (https://leaddrip.com)",
  },
});

export interface RSSItem {
  sourceId: string;
  sourceName: string;
  sourceCategory: string;
  title: string;
  link: string;
  content: string;
  contentSnippet: string;
  pubDate: string;
  publishedAt: Date;
  potentialSignals: string[];
}

// Detect potential signals from title and content
function detectSignals(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const signals: string[] = [];

  for (const [signalType, keywords] of Object.entries(SIGNAL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        signals.push(signalType);
        break; // Only add each signal type once
      }
    }
  }

  return signals;
}

// Fetch items from a single RSS source
async function fetchSource(source: RSSSource): Promise<RSSItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const items: RSSItem[] = [];

    for (const item of feed.items.slice(0, 20)) {
      // Only last 20 items
      const pubDate = item.pubDate || item.isoDate || new Date().toISOString();
      const publishedAt = new Date(pubDate);

      // Skip items older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (publishedAt < sevenDaysAgo) continue;

      const title = item.title || "";
      const content = item.content || item.contentSnippet || "";
      const potentialSignals = detectSignals(title, content);

      // Only include items with potential signals
      if (potentialSignals.length === 0) continue;

      items.push({
        sourceId: source.id,
        sourceName: source.name,
        sourceCategory: source.category,
        title,
        link: item.link || "",
        content: content.slice(0, 2000), // Limit content length
        contentSnippet: (item.contentSnippet || content).slice(0, 500),
        pubDate,
        publishedAt,
        potentialSignals,
      });
    }

    return items;
  } catch (error) {
    console.error(`Failed to fetch RSS source ${source.name}:`, error);
    return [];
  }
}

// Fetch from all sources
export async function fetchAllSources(): Promise<RSSItem[]> {
  const results = await Promise.allSettled(
    RSS_SOURCES.map((source) => fetchSource(source))
  );

  const allItems: RSSItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  // Sort by publication date (newest first)
  allItems.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const deduped: RSSItem[] = [];
  for (const item of allItems) {
    const normalizedTitle = item.title.toLowerCase().slice(0, 50);
    if (!seen.has(normalizedTitle)) {
      seen.add(normalizedTitle);
      deduped.push(item);
    }
  }

  return deduped;
}

// Fetch from specific categories
export async function fetchByCategory(
  category: RSSSource["category"]
): Promise<RSSItem[]> {
  const sources = RSS_SOURCES.filter((s) => s.category === category);
  const results = await Promise.allSettled(
    sources.map((source) => fetchSource(source))
  );

  const items: RSSItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    }
  }

  return items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

// Quick test function
export async function testRSSFeeds(): Promise<{
  success: number;
  failed: number;
  totalItems: number;
  sources: { name: string; status: string; itemCount: number }[];
}> {
  const results: { name: string; status: string; itemCount: number }[] = [];
  let success = 0;
  let failed = 0;
  let totalItems = 0;

  for (const source of RSS_SOURCES) {
    try {
      const items = await fetchSource(source);
      results.push({
        name: source.name,
        status: "ok",
        itemCount: items.length,
      });
      success++;
      totalItems += items.length;
    } catch {
      results.push({
        name: source.name,
        status: "failed",
        itemCount: 0,
      });
      failed++;
    }
  }

  return { success, failed, totalItems, sources: results };
}
