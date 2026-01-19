import { Evidence, EvidenceSourceType } from "./types";
import { getCachedURL, setCachedURL, hashContent } from "./cache";
import { createId } from "@paralleldrive/cuid2";

// ============================================
// Configuration
// ============================================

const EXA_API_KEY = process.env.EXA_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

const FETCH_TIMEOUT_MS = 10000;
const MAX_CONTENT_LENGTH = 10000;

// Rate limit tracking
interface RateLimitStats {
  exaRequestsMade: number;
  firecrawlRequestsMade: number;
  fallbackFetchesMade: number;
}

// ============================================
// Source Type Detection
// ============================================

function detectSourceType(url: string, publisher?: string): EvidenceSourceType {
  const urlLower = url.toLowerCase();
  const domain = extractDomain(url);

  // SEC filings
  if (domain.includes("sec.gov")) return "sec_filing";

  // Company official pages
  if (urlLower.includes("/press") || urlLower.includes("/news")) {
    return publisher ? "third_party_news" : "company_press";
  }
  if (urlLower.includes("/newsroom")) return "company_newsroom";
  if (urlLower.includes("/careers") || urlLower.includes("/jobs")) {
    return "company_careers";
  }
  if (urlLower.includes("/about")) return "company_about";

  // Job boards
  const jobBoards = [
    "linkedin.com/jobs",
    "indeed.com",
    "glassdoor.com",
    "lever.co",
    "greenhouse.io",
    "workday.com",
    "jobs.ashbyhq.com",
  ];
  if (jobBoards.some((jb) => urlLower.includes(jb))) return "jobs_board";

  // Data providers
  if (domain.includes("crunchbase.com")) return "crunchbase";
  if (domain.includes("pitchbook.com")) return "pitchbook";

  // Registries
  const registries = [
    "opencorporates.com",
    "dnb.com",
    "companieshouse.gov.uk",
  ];
  if (registries.some((r) => urlLower.includes(r))) return "registry";

  // Social (official accounts)
  if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) {
    return "social_official";
  }

  // News sources
  const newsSources = [
    "techcrunch.com",
    "reuters.com",
    "bloomberg.com",
    "wsj.com",
    "forbes.com",
    "venturebeat.com",
    "businesswire.com",
    "prnewswire.com",
    "globenewswire.com",
  ];
  if (newsSources.some((ns) => domain.includes(ns))) return "third_party_news";

  return "other";
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace("www.", "");
  } catch {
    return "";
  }
}

function extractPublisher(url: string): string | undefined {
  const domain = extractDomain(url);
  const publishers: Record<string, string> = {
    "techcrunch.com": "TechCrunch",
    "crunchbase.com": "Crunchbase",
    "reuters.com": "Reuters",
    "bloomberg.com": "Bloomberg",
    "wsj.com": "Wall Street Journal",
    "forbes.com": "Forbes",
    "venturebeat.com": "VentureBeat",
    "businesswire.com": "Business Wire",
    "prnewswire.com": "PR Newswire",
    "globenewswire.com": "GlobeNewswire",
  };
  return publishers[domain];
}

// ============================================
// Exa.ai Search (free tier: 1000 searches/month)
// ============================================

interface ExaSearchResult {
  url: string;
  title: string;
  text: string;
  publishedDate?: string;
  author?: string;
}

async function searchWithExa(
  query: string,
  options: { numResults?: number; includeDomains?: string[] } = {}
): Promise<ExaSearchResult[]> {
  if (!EXA_API_KEY) return [];

  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": EXA_API_KEY,
      },
      body: JSON.stringify({
        query,
        numResults: options.numResults || 5,
        includeDomains: options.includeDomains,
        type: "neural",
        useAutoprompt: true,
        contents: {
          text: { maxCharacters: MAX_CONTENT_LENGTH },
        },
      }),
    });

    if (!response.ok) {
      console.warn(`Exa search failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.warn("Exa search error:", error);
    return [];
  }
}

// ============================================
// Firecrawl Scrape (free tier: 500 pages/month)
// ============================================

interface FirecrawlResult {
  url: string;
  title: string;
  markdown: string;
  metadata?: {
    publishedTime?: string;
    author?: string;
  };
}

async function scrapeWithFirecrawl(url: string): Promise<FirecrawlResult | null> {
  if (!FIRECRAWL_API_KEY) return null;

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      console.warn(`Firecrawl scrape failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.data) return null;

    return {
      url: data.data.url || url,
      title: data.data.metadata?.title || "",
      markdown: data.data.markdown?.slice(0, MAX_CONTENT_LENGTH) || "",
      metadata: data.data.metadata,
    };
  } catch (error) {
    console.warn("Firecrawl scrape error:", error);
    return null;
  }
}

// ============================================
// Simple Fetch Fallback
// ============================================

interface FetchResult {
  url: string;
  title: string;
  content: string;
  statusCode: number;
}

async function fetchWithFallback(url: string): Promise<FetchResult | null> {
  // Check cache first
  const cached = getCachedURL(url);
  if (cached) {
    return {
      url: cached.url,
      title: cached.title,
      content: cached.content,
      statusCode: cached.statusCode,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LeadDrip/1.0; +https://leaddrip.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const title = extractTitleFromHTML(html);
    const content = extractTextFromHTML(html);

    const result = {
      url: response.url || url,
      title,
      content: content.slice(0, MAX_CONTENT_LENGTH),
      statusCode: response.status,
    };

    // Cache the result
    setCachedURL(url, {
      ...result,
      fetchedAt: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    console.warn(`Fetch fallback failed for ${url}:`, error);
    return null;
  }
}

function extractTitleFromHTML(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : "";
}

function extractTextFromHTML(html: string): string {
  // Remove scripts, styles, and HTML tags
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================
// Link Extraction from HTML
// ============================================

function extractLinksFromHTML(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const linkRegex = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const href = match[1];
      // Skip anchors, javascript, mailto
      if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) {
        continue;
      }
      // Resolve relative URLs
      const absoluteUrl = new URL(href, baseUrl).toString();
      links.push(absoluteUrl);
    } catch {
      // Invalid URL, skip
    }
  }

  return [...new Set(links)]; // Dedupe
}

// ============================================
// Company Site Discovery
// ============================================

async function discoverCompanyPages(
  domain: string
): Promise<{ url: string; type: EvidenceSourceType }[]> {
  const pages: { url: string; type: EvidenceSourceType }[] = [];
  const baseUrl = `https://${domain}`;

  // Common paths for company pages
  const paths = [
    { path: "/press", type: "company_press" as const },
    { path: "/news", type: "company_newsroom" as const },
    { path: "/newsroom", type: "company_newsroom" as const },
    { path: "/about", type: "company_about" as const },
    { path: "/about-us", type: "company_about" as const },
    { path: "/careers", type: "company_careers" as const },
    { path: "/jobs", type: "company_careers" as const },
  ];

  // Try each path
  await Promise.all(
    paths.map(async ({ path, type }) => {
      try {
        const url = `${baseUrl}${path}`;
        const response = await fetch(url, {
          method: "HEAD",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; LeadDrip/1.0; +https://leaddrip.com)",
          },
        });
        if (response.ok) {
          pages.push({ url, type });
        }
      } catch {
        // Page doesn't exist
      }
    })
  );

  return pages;
}

// ============================================
// Main Evidence Collection
// ============================================

export interface CollectEvidenceOptions {
  company: string;
  domain?: string;
  signalType: string;
  rssArticleUrl: string;
  rssArticleContent?: string;
  maxThirdPartySources?: number;
}

export interface CollectEvidenceResult {
  evidence: Evidence[];
  stats: RateLimitStats;
  errors: string[];
}

export async function collectEvidence(
  options: CollectEvidenceOptions
): Promise<CollectEvidenceResult> {
  const {
    company,
    domain,
    signalType,
    rssArticleUrl,
    rssArticleContent,
    maxThirdPartySources = 3,
  } = options;

  const evidence: Evidence[] = [];
  const errors: string[] = [];
  const stats: RateLimitStats = {
    exaRequestsMade: 0,
    firecrawlRequestsMade: 0,
    fallbackFetchesMade: 0,
  };

  const seenContentHashes = new Set<string>();

  function addEvidence(e: Evidence): boolean {
    // Check for near-duplicate content
    if (seenContentHashes.has(e.contentHash)) {
      return false;
    }
    seenContentHashes.add(e.contentHash);
    evidence.push(e);
    return true;
  }

  // 1. Fetch the originating RSS article
  const rssResult = await fetchWithFallback(rssArticleUrl);
  stats.fallbackFetchesMade++;

  if (rssResult) {
    const content = rssArticleContent || rssResult.content;
    addEvidence({
      id: createId(),
      url: rssArticleUrl,
      canonicalUrl: rssResult.url,
      title: rssResult.title,
      snippet: content.slice(0, 500),
      fullText: content,
      sourceType: "rss_article",
      publisher: extractPublisher(rssArticleUrl),
      fetchedAt: new Date().toISOString(),
      contentHash: hashContent(content),
      isOfficial: false,
    });

    // Extract outbound links from RSS article
    const outboundLinks = extractLinksFromHTML(
      rssResult.content,
      rssArticleUrl
    ).filter((link) => {
      // Filter to relevant links
      const linkDomain = extractDomain(link);
      return (
        !linkDomain.includes("facebook.com") &&
        !linkDomain.includes("twitter.com") &&
        !linkDomain.includes("instagram.com") &&
        link !== rssArticleUrl
      );
    });

    // Fetch top outbound links
    const linkPromises = outboundLinks.slice(0, 3).map(async (link) => {
      const result = await fetchWithFallback(link);
      stats.fallbackFetchesMade++;
      if (result) {
        addEvidence({
          id: createId(),
          url: link,
          canonicalUrl: result.url,
          title: result.title,
          snippet: result.content.slice(0, 500),
          fullText: result.content,
          sourceType: detectSourceType(link),
          publisher: extractPublisher(link),
          fetchedAt: new Date().toISOString(),
          contentHash: hashContent(result.content),
          isOfficial: false,
        });
      }
    });
    await Promise.all(linkPromises);
  }

  // 2. Fetch company official pages (if domain known)
  if (domain) {
    const companyPages = await discoverCompanyPages(domain);

    const pagePromises = companyPages.map(async ({ url, type }) => {
      const result = await fetchWithFallback(url);
      stats.fallbackFetchesMade++;
      if (result) {
        addEvidence({
          id: createId(),
          url,
          canonicalUrl: result.url,
          title: result.title,
          snippet: result.content.slice(0, 500),
          fullText: result.content,
          sourceType: type,
          fetchedAt: new Date().toISOString(),
          contentHash: hashContent(result.content),
          isOfficial: true,
        });
      }
    });
    await Promise.all(pagePromises);
  }

  // 3. Search for third-party corroboration
  // Build search query based on signal type
  const searchQuery = buildSearchQuery(company, signalType);

  // Try Exa first
  if (EXA_API_KEY) {
    const exaResults = await searchWithExa(searchQuery, {
      numResults: maxThirdPartySources,
    });
    stats.exaRequestsMade++;

    for (const result of exaResults) {
      // Skip if it's the same as RSS article
      if (result.url === rssArticleUrl) continue;

      addEvidence({
        id: createId(),
        url: result.url,
        canonicalUrl: result.url,
        title: result.title,
        snippet: result.text.slice(0, 500),
        fullText: result.text,
        sourceType: detectSourceType(result.url),
        publisher: extractPublisher(result.url),
        publishedAt: result.publishedDate,
        fetchedAt: new Date().toISOString(),
        contentHash: hashContent(result.text),
        isOfficial: false,
      });
    }
  }

  // For hiring signals, check job boards
  if (signalType.includes("hiring") && domain) {
    const jobSearchQuery = `${company} jobs site:lever.co OR site:greenhouse.io OR site:jobs.ashbyhq.com`;

    if (EXA_API_KEY) {
      const jobResults = await searchWithExa(jobSearchQuery, { numResults: 2 });
      stats.exaRequestsMade++;

      for (const result of jobResults) {
        addEvidence({
          id: createId(),
          url: result.url,
          canonicalUrl: result.url,
          title: result.title,
          snippet: result.text.slice(0, 500),
          fullText: result.text,
          sourceType: "jobs_board",
          fetchedAt: new Date().toISOString(),
          contentHash: hashContent(result.text),
          isOfficial: false,
        });
      }
    }
  }

  // Use Firecrawl for any URLs we couldn't fetch with simple fetch
  // (e.g., JavaScript-heavy sites)
  if (FIRECRAWL_API_KEY && evidence.length < 3) {
    const firecrawlResult = await scrapeWithFirecrawl(rssArticleUrl);
    stats.firecrawlRequestsMade++;

    if (firecrawlResult && !seenContentHashes.has(hashContent(firecrawlResult.markdown))) {
      addEvidence({
        id: createId(),
        url: firecrawlResult.url,
        canonicalUrl: firecrawlResult.url,
        title: firecrawlResult.title,
        snippet: firecrawlResult.markdown.slice(0, 500),
        fullText: firecrawlResult.markdown,
        sourceType: "rss_article",
        publishedAt: firecrawlResult.metadata?.publishedTime,
        fetchedAt: new Date().toISOString(),
        contentHash: hashContent(firecrawlResult.markdown),
        isOfficial: false,
      });
    }
  }

  return { evidence, stats, errors };
}

// ============================================
// Search Query Builder
// ============================================

function buildSearchQuery(company: string, signalType: string): string {
  const queryTemplates: Record<string, string> = {
    funding_round: `"${company}" funding OR raised OR series`,
    funding_raised: `"${company}" raised funding announcement`,
    funding_amount: `"${company}" funding amount million`,
    acquisition_announced: `"${company}" acquisition OR acquired OR acquires`,
    ipo_announced: `"${company}" IPO OR "initial public offering"`,
    leadership_hire: `"${company}" hired OR appoints OR names new`,
    leadership_change: `"${company}" CEO OR executive OR leadership change`,
    expansion_geographic: `"${company}" expansion OR expands OR new office`,
    product_launch: `"${company}" launches OR announces new product`,
    partnership_announced: `"${company}" partnership OR partners with`,
    hiring_initiative: `"${company}" hiring OR jobs OR careers growth`,
    layoff_announced: `"${company}" layoffs OR layoff OR workforce reduction`,
  };

  return queryTemplates[signalType] || `"${company}" ${signalType}`;
}

// ============================================
// Normalize Timestamps
// ============================================

export function normalizeTimestamp(
  dateStr: string | undefined
): string | undefined {
  if (!dateStr) return undefined;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return undefined;
    return date.toISOString();
  } catch {
    return undefined;
  }
}
