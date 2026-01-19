import { createId } from "@paralleldrive/cuid2";
import { RawSignal, SignalType, SourceType } from "../types";

// Pages to check on company websites
const COMPANY_PAGES = [
  { path: "/careers", signals: ["hiring"] as SignalType[] },
  { path: "/jobs", signals: ["hiring"] as SignalType[] },
  { path: "/about/careers", signals: ["hiring"] as SignalType[] },
  { path: "/news", signals: ["funding", "product_launch", "partnership", "expansion"] as SignalType[] },
  { path: "/press", signals: ["funding", "product_launch", "partnership", "expansion"] as SignalType[] },
  { path: "/newsroom", signals: ["funding", "product_launch", "partnership", "expansion"] as SignalType[] },
  { path: "/blog", signals: ["product_launch", "tech_adoption"] as SignalType[] },
  { path: "/about", signals: ["expansion", "leadership_change"] as SignalType[] },
  { path: "/team", signals: ["leadership_change", "hiring"] as SignalType[] },
  { path: "/leadership", signals: ["leadership_change"] as SignalType[] },
];

// Keywords that indicate specific signals
const SIGNAL_KEYWORDS: Record<SignalType, string[]> = {
  funding: ["raised", "funding", "series", "investment", "investors", "capital", "million", "billion"],
  hiring: ["hiring", "join us", "open positions", "careers", "we're growing", "job opening", "apply now"],
  product_launch: ["introducing", "announcing", "new feature", "launch", "now available", "release"],
  leadership_change: ["joins as", "appointed", "new ceo", "new cto", "welcomes", "promoted to"],
  expansion: ["expanding", "new office", "new market", "international", "global expansion"],
  partnership: ["partner", "integration", "collaboration", "alliance", "teams up"],
  acquisition: ["acquired", "acquisition", "merger", "acquires"],
  tech_adoption: ["migrating", "adopting", "implementing", "powered by", "built on"],
};

interface CrawlResult {
  url: string;
  title: string;
  content: string;
  links: string[];
}

async function fetchPage(url: string): Promise<CrawlResult | null> {
  try {
    // Try firecrawl first if available
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    if (firecrawlKey) {
      const response = await fetch("https://api.firecrawl.dev/v0/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({
          url,
          pageOptions: { onlyMainContent: true },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          url,
          title: data.data?.metadata?.title || "",
          content: data.data?.markdown || data.data?.content || "",
          links: data.data?.links || [],
        };
      }
    }

    // Fallback to direct fetch
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LeadDripBot/1.0; +https://leaddrip.com)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Basic HTML parsing
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1] || "";

    // Strip HTML tags for content
    const content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000);

    // Extract links
    const linkMatches = html.matchAll(/href=["']([^"']+)["']/gi);
    const links = [...linkMatches].map((m) => m[1]).filter((l) => l.startsWith("http"));

    return { url, title, content, links };
  } catch (error) {
    console.error(`Failed to crawl ${url}:`, error);
    return null;
  }
}

function detectSignals(content: string, pageSignalTypes: SignalType[]): SignalType[] {
  const detected: SignalType[] = [];
  const lowerContent = content.toLowerCase();

  for (const signalType of pageSignalTypes) {
    const keywords = SIGNAL_KEYWORDS[signalType];
    const matchCount = keywords.filter((kw) => lowerContent.includes(kw)).length;

    // Require at least 2 keyword matches
    if (matchCount >= 2) {
      detected.push(signalType);
    }
  }

  return detected;
}

function extractSnippet(content: string, signalType: SignalType): string {
  const keywords = SIGNAL_KEYWORDS[signalType];
  const lowerContent = content.toLowerCase();

  // Find the first keyword and extract surrounding context
  for (const keyword of keywords) {
    const idx = lowerContent.indexOf(keyword);
    if (idx !== -1) {
      const start = Math.max(0, idx - 100);
      const end = Math.min(content.length, idx + 200);
      return content.slice(start, end).trim();
    }
  }

  return content.slice(0, 300);
}

export async function crawlCompany(
  domain: string,
  companyName: string,
  targetSignals?: SignalType[]
): Promise<RawSignal[]> {
  const signals: RawSignal[] = [];
  const baseUrl = `https://${domain}`;

  // Determine which pages to crawl
  const pagesToCrawl = COMPANY_PAGES.filter((page) => {
    if (!targetSignals) return true;
    return page.signals.some((s) => targetSignals.includes(s));
  });

  for (const page of pagesToCrawl) {
    const url = `${baseUrl}${page.path}`;
    const result = await fetchPage(url);

    if (!result || !result.content) continue;

    // Detect signals from content
    const detectedSignals = detectSignals(result.content, page.signals);

    for (const signalType of detectedSignals) {
      const signal: RawSignal = {
        id: createId(),
        signalType,
        source: "company_site" as SourceType,
        sourceUrl: url,
        companyName,
        domain,
        headline: result.title || `${companyName} - ${page.path.replace("/", "")}`,
        snippet: extractSnippet(result.content, signalType),
        rawContent: result.content.slice(0, 2000),
        discoveredAt: new Date().toISOString(),
        confidence: 0.85, // Higher confidence for direct company sources
      };

      // Extract hiring-specific data
      if (signalType === "hiring") {
        const jobMatches = result.content.match(/(?:hiring|open[^.]*position)[^.]*(?:engineer|developer|designer|manager|director|vp|lead)/gi);
        if (jobMatches) {
          signal.roles = [...new Set(jobMatches.map((m) => m.replace(/hiring|open.*position/gi, "").trim()))];
        }
      }

      signals.push(signal);
    }
  }

  return signals;
}

// Crawl multiple companies in parallel
export async function crawlCompanies(
  companies: Array<{ domain: string; companyName: string }>,
  targetSignals?: SignalType[],
  concurrency: number = 3
): Promise<RawSignal[]> {
  const allSignals: RawSignal[] = [];

  // Process in batches
  for (let i = 0; i < companies.length; i += concurrency) {
    const batch = companies.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((c) => crawlCompany(c.domain, c.companyName, targetSignals))
    );
    allSignals.push(...results.flat());

    // Small delay between batches to be polite
    if (i + concurrency < companies.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return allSignals;
}
