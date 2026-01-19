import { createId } from "@paralleldrive/cuid2";
import { RawSignal, SignalType, SourceType } from "../types";
import Parser from "rss-parser";

// Curated RSS feeds by signal type
const SIGNAL_FEEDS: Record<SignalType, string[]> = {
  funding: [
    "https://techcrunch.com/category/fundings-exits/feed/",
    "https://news.crunchbase.com/feed/",
    "https://www.prnewswire.com/rss/financial-services-latest-news.rss",
    "https://feeds.feedburner.com/venturebeat/SZYF", // VentureBeat
  ],
  hiring: [
    // Job-focused RSS is limited, we rely more on company crawling
    "https://www.techjobs.com/rss/latest",
  ],
  product_launch: [
    "https://www.producthunt.com/feed",
    "https://techcrunch.com/category/startups/feed/",
    "https://feeds.feedburner.com/TheNextWeb",
  ],
  leadership_change: [
    "https://www.businesswire.com/portal/site/home/news/executive/",
    "https://www.prnewswire.com/rss/management-changes-latest-news.rss",
  ],
  expansion: [
    "https://www.prnewswire.com/rss/business-expansion-latest-news.rss",
  ],
  partnership: [
    "https://www.prnewswire.com/rss/strategic-alliances-latest-news.rss",
    "https://techcrunch.com/category/enterprise/feed/",
  ],
  acquisition: [
    "https://techcrunch.com/category/fundings-exits/feed/",
    "https://www.prnewswire.com/rss/mergers-and-acquisitions-latest-news.rss",
  ],
  tech_adoption: [
    "https://techcrunch.com/category/enterprise/feed/",
    "https://feeds.feedburner.com/venturebeat/SZYF",
  ],
};

// Keywords to detect signal type from content
const SIGNAL_PATTERNS: Record<SignalType, RegExp[]> = {
  funding: [
    /raises?\s+\$[\d.]+\s*(?:million|billion|M|B)/i,
    /series\s+[A-Z]\s+(?:funding|round)/i,
    /seed\s+(?:funding|round|investment)/i,
    /secured?\s+(?:funding|investment)/i,
  ],
  hiring: [
    /hiring\s+(?:spree|wave|expansion)/i,
    /(?:adding|growing)\s+\d+\s+(?:employees|engineers)/i,
    /open(?:ing|s)?\s+\d+\s+(?:new\s+)?(?:positions|roles)/i,
  ],
  product_launch: [
    /launch(?:es|ed|ing)?\s+(?:new\s+)?(?:product|feature|platform)/i,
    /announc(?:es|ed|ing)\s+(?:new\s+)?(?:product|feature|platform)/i,
    /introduc(?:es|ed|ing)\s+(?:new\s+)?/i,
    /now\s+available/i,
  ],
  leadership_change: [
    /appoint(?:s|ed)?\s+(?:new\s+)?(?:CEO|CTO|CFO|COO|VP|Director)/i,
    /hire(?:s|d)?\s+(?:new\s+)?(?:CEO|CTO|CFO|COO|VP|Director)/i,
    /joins?\s+as\s+(?:CEO|CTO|CFO|COO|VP|Director)/i,
    /names?\s+(?:new\s+)?(?:CEO|CTO|CFO|COO|VP|Director)/i,
  ],
  expansion: [
    /expand(?:s|ed|ing)?\s+(?:to|into)\s+(?:new\s+)?(?:market|region|country)/i,
    /open(?:s|ed|ing)?\s+(?:new\s+)?(?:office|headquarters)/i,
    /enter(?:s|ed|ing)?\s+(?:the\s+)?(?:\w+\s+)?market/i,
  ],
  partnership: [
    /partner(?:s|ed|ing)?\s+with/i,
    /strategic\s+(?:partnership|alliance)/i,
    /integrat(?:es|ed|ing)\s+with/i,
    /collaborat(?:es|ed|ing)\s+with/i,
  ],
  acquisition: [
    /acquir(?:es|ed|ing)/i,
    /acquisition\s+of/i,
    /merg(?:es|ed|ing)\s+with/i,
    /(?:has\s+been|gets?)\s+acquired/i,
  ],
  tech_adoption: [
    /adopt(?:s|ed|ing)\s+(?:new\s+)?(?:technology|platform|tool)/i,
    /migrat(?:es|ed|ing)\s+to/i,
    /implement(?:s|ed|ing)\s+(?:new\s+)?/i,
    /powered\s+by/i,
  ],
};

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; LeadDripBot/1.0)",
  },
});

interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
}

function detectSignalType(title: string, content: string): SignalType | null {
  const text = `${title} ${content}`.toLowerCase();

  for (const [signalType, patterns] of Object.entries(SIGNAL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return signalType as SignalType;
      }
    }
  }

  return null;
}

function extractCompanyName(title: string, content: string): string | null {
  // Common patterns: "CompanyName raises $X", "CompanyName launches product"
  const patterns = [
    /^([A-Z][A-Za-z0-9\s&.]+?)\s+(?:raises?|launches?|announces?|appoints?|expands?|partners?|acquires?|hires?)/i,
    /^([A-Z][A-Za-z0-9\s&.]+?),?\s+(?:a|the|an)\s+/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1].length < 50) {
      return match[1].trim();
    }
  }

  return null;
}

function extractEntities(signalType: SignalType, text: string): Partial<RawSignal> {
  const entities: Partial<RawSignal> = {};

  if (signalType === "funding") {
    const amountMatch = text.match(/\$[\d.]+\s*(?:million|billion|M|B|mn|bn)/i);
    if (amountMatch) entities.amount = amountMatch[0];

    const investorMatch = text.match(/(?:led by|from)\s+([A-Z][A-Za-z\s&]+?(?:Capital|Ventures|Partners))/i);
    if (investorMatch) entities.investors = [investorMatch[1].trim()];
  }

  if (signalType === "leadership_change") {
    const personMatch = text.match(/(?:appoints?|hires?|names?|welcomes?)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    if (personMatch) entities.people = [personMatch[1]];
  }

  return entities;
}

export async function fetchSignalFeed(
  feedUrl: string,
  targetSignalTypes?: SignalType[]
): Promise<RawSignal[]> {
  const signals: RawSignal[] = [];

  try {
    const feed = await parser.parseURL(feedUrl);

    for (const item of feed.items.slice(0, 20)) {
      const title = item.title || "";
      const content = item.contentSnippet || item.content || "";

      // Detect signal type
      const signalType = detectSignalType(title, content);
      if (!signalType) continue;

      // Filter by target signals if specified
      if (targetSignalTypes && !targetSignalTypes.includes(signalType)) {
        continue;
      }

      // Extract company name
      const companyName = extractCompanyName(title, content);
      if (!companyName) continue;

      const signal: RawSignal = {
        id: createId(),
        signalType,
        source: "rss" as SourceType,
        sourceUrl: item.link || feedUrl,
        companyName,
        headline: title,
        snippet: content.slice(0, 500),
        rawContent: content,
        publishedAt: item.pubDate,
        discoveredAt: new Date().toISOString(),
        confidence: 0.75,
        ...extractEntities(signalType, title + " " + content),
      };

      signals.push(signal);
    }
  } catch (error) {
    console.error(`Failed to fetch feed ${feedUrl}:`, error);
  }

  return signals;
}

export async function aggregateNewsSignals(
  targetSignalTypes?: SignalType[],
  maxPerType: number = 20
): Promise<RawSignal[]> {
  const allSignals: RawSignal[] = [];
  const signalTypes = targetSignalTypes || (Object.keys(SIGNAL_FEEDS) as SignalType[]);

  for (const signalType of signalTypes) {
    const feeds = SIGNAL_FEEDS[signalType] || [];
    const typeSignals: RawSignal[] = [];

    // Fetch all feeds for this signal type in parallel
    const results = await Promise.all(
      feeds.slice(0, 3).map((feedUrl) => fetchSignalFeed(feedUrl, [signalType]))
    );

    typeSignals.push(...results.flat());

    // Take top signals by recency
    typeSignals.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    allSignals.push(...typeSignals.slice(0, maxPerType));
  }

  return allSignals;
}
