// Firecrawl integration for company research
// Docs: https://docs.firecrawl.dev

import { promises as fs } from "fs";
import path from "path";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1";

// Free tier limits
const FREE_TIER_MONTHLY_CREDITS = 500;
const FREE_TIER_WARNING_THRESHOLD = 400; // Warn at 80%
const RATE_LIMIT_PER_MINUTE = 10; // Conservative rate limit

// Credit tracking file path
const CREDIT_TRACKER_PATH = path.join(process.cwd(), ".firecrawl-credits.json");

interface CreditTracker {
  month: string; // YYYY-MM format
  creditsUsed: number;
  lastRequestTime: number;
  requestsThisMinute: number;
  minuteStartTime: number;
}

// Get current month string
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Load credit tracker
async function loadCreditTracker(): Promise<CreditTracker> {
  const currentMonth = getCurrentMonth();

  try {
    const data = await fs.readFile(CREDIT_TRACKER_PATH, "utf-8");
    const tracker: CreditTracker = JSON.parse(data);

    // Reset if new month
    if (tracker.month !== currentMonth) {
      return {
        month: currentMonth,
        creditsUsed: 0,
        lastRequestTime: 0,
        requestsThisMinute: 0,
        minuteStartTime: Date.now(),
      };
    }

    return tracker;
  } catch {
    // File doesn't exist or is invalid, create new tracker
    return {
      month: currentMonth,
      creditsUsed: 0,
      lastRequestTime: 0,
      requestsThisMinute: 0,
      minuteStartTime: Date.now(),
    };
  }
}

// Save credit tracker
async function saveCreditTracker(tracker: CreditTracker): Promise<void> {
  try {
    await fs.writeFile(CREDIT_TRACKER_PATH, JSON.stringify(tracker, null, 2));
  } catch (error) {
    console.error("Failed to save credit tracker:", error);
  }
}

// Check if we can make a request (rate limiting + credit check)
async function checkRateLimitAndCredits(creditsNeeded: number = 1): Promise<{
  allowed: boolean;
  reason?: string;
  creditsRemaining?: number;
  warning?: string;
}> {
  const tracker = await loadCreditTracker();
  const now = Date.now();

  // Check monthly credits
  if (tracker.creditsUsed + creditsNeeded > FREE_TIER_MONTHLY_CREDITS) {
    return {
      allowed: false,
      reason: `Monthly credit limit reached (${tracker.creditsUsed}/${FREE_TIER_MONTHLY_CREDITS}). Resets next month.`,
      creditsRemaining: FREE_TIER_MONTHLY_CREDITS - tracker.creditsUsed,
    };
  }

  // Check rate limit (requests per minute)
  const minuteElapsed = now - tracker.minuteStartTime > 60000;

  if (minuteElapsed) {
    // Reset minute counter
    tracker.requestsThisMinute = 0;
    tracker.minuteStartTime = now;
  } else if (tracker.requestsThisMinute >= RATE_LIMIT_PER_MINUTE) {
    const waitTime = Math.ceil((60000 - (now - tracker.minuteStartTime)) / 1000);
    return {
      allowed: false,
      reason: `Rate limit reached (${RATE_LIMIT_PER_MINUTE}/min). Try again in ${waitTime}s.`,
      creditsRemaining: FREE_TIER_MONTHLY_CREDITS - tracker.creditsUsed,
    };
  }

  // Check warning threshold
  let warning: string | undefined;
  if (tracker.creditsUsed + creditsNeeded > FREE_TIER_WARNING_THRESHOLD) {
    const remaining = FREE_TIER_MONTHLY_CREDITS - tracker.creditsUsed - creditsNeeded;
    warning = `Approaching monthly limit: ${remaining} credits remaining after this request.`;
  }

  return {
    allowed: true,
    creditsRemaining: FREE_TIER_MONTHLY_CREDITS - tracker.creditsUsed - creditsNeeded,
    warning,
  };
}

// Record credit usage
async function recordCreditUsage(credits: number): Promise<void> {
  const tracker = await loadCreditTracker();
  const now = Date.now();

  // Reset minute counter if needed
  if (now - tracker.minuteStartTime > 60000) {
    tracker.requestsThisMinute = 0;
    tracker.minuteStartTime = now;
  }

  tracker.creditsUsed += credits;
  tracker.requestsThisMinute += 1;
  tracker.lastRequestTime = now;

  await saveCreditTracker(tracker);
}

// Get current usage stats
export async function getUsageStats(): Promise<{
  month: string;
  creditsUsed: number;
  creditsRemaining: number;
  percentUsed: number;
  isNearLimit: boolean;
}> {
  const tracker = await loadCreditTracker();
  const remaining = FREE_TIER_MONTHLY_CREDITS - tracker.creditsUsed;
  const percentUsed = Math.round((tracker.creditsUsed / FREE_TIER_MONTHLY_CREDITS) * 100);

  return {
    month: tracker.month,
    creditsUsed: tracker.creditsUsed,
    creditsRemaining: remaining,
    percentUsed,
    isNearLimit: tracker.creditsUsed >= FREE_TIER_WARNING_THRESHOLD,
  };
}

export interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
    };
    links?: string[];
  };
  error?: string;
}

export interface FirecrawlCrawlResult {
  success: boolean;
  id?: string;
  data?: Array<{
    url: string;
    markdown?: string;
    metadata?: Record<string, string>;
  }>;
  error?: string;
}

export interface CompanyResearch {
  domain: string;
  companyName: string;
  description: string;
  signals: {
    type: string;
    subtype?: string;
    content: string;
    source: string;
    confidence: "high" | "medium" | "low";
    buyingIntent?: "strong" | "moderate" | "weak";
  }[];
  recentNews: {
    title: string;
    snippet: string;
    url: string;
    date?: string;
  }[];
  teamInfo: {
    size?: string;
    departments?: string[];
    leadership?: string[];
  };
  techStack: string[];
  fundingInfo?: {
    stage?: string;
    amount?: string;
    investors?: string[];
  };
  painPoints: string[];
}

// Scrape a single URL (1 credit)
export async function scrapeUrl(url: string): Promise<FirecrawlScrapeResult & { warning?: string }> {
  // If no API key, use fallback scraping
  if (!FIRECRAWL_API_KEY) {
    return await fallbackScrape(url);
  }

  // Check rate limit and credits
  const check = await checkRateLimitAndCredits(1);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
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
      const error = await response.text();
      // Fallback on API error
      console.warn("Firecrawl API error, using fallback:", error);
      return await fallbackScrape(url);
    }

    // Record credit usage on success
    await recordCreditUsage(1);

    const data = await response.json();
    return { success: true, data: data.data, warning: check.warning };
  } catch (error) {
    console.warn("Firecrawl request failed, using fallback:", error);
    return await fallbackScrape(url);
  }
}

// Fallback scraping using native fetch (free, no API key needed)
async function fallbackScrape(url: string): Promise<FirecrawlScrapeResult & { warning?: string }> {
  // Try HTTPS first, then HTTP
  const urls = [url, url.replace("https://", "http://")];

  for (const tryUrl of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(tryUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        continue; // Try next URL
      }

      const html = await response.text();
      const markdown = htmlToSimpleMarkdown(html);
      const metadata = extractMetadata(html, tryUrl);

      return {
        success: true,
        data: {
          markdown,
          metadata,
        },
        warning: "Using fallback scraper (no Firecrawl API key). Add FIRECRAWL_API_KEY for better results.",
      };
    } catch (error) {
      // Continue to next URL
      continue;
    }
  }

  // If all attempts fail, return demo data for testing
  return generateDemoData(url);
}

// Generate demo data when scraping fails (for development/testing)
function generateDemoData(url: string): FirecrawlScrapeResult & { warning?: string } {
  const domain = url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  const companyName = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);

  return {
    success: true,
    data: {
      markdown: `# ${companyName}

${companyName} is a technology company focused on building innovative solutions.

## About Us
We help businesses scale and grow with our cutting-edge platform.

## Careers
We're hiring! Join our growing team.
- Senior Software Engineer
- Product Manager
- Sales Development Representative

## Technology
Built with modern technologies including React, Node.js, and cloud infrastructure.
`,
      metadata: {
        title: `${companyName} - Building the Future`,
        description: `${companyName} is a technology company helping businesses succeed with innovative solutions.`,
        ogTitle: companyName,
        ogDescription: `${companyName} - Empowering businesses with technology`,
      },
    },
    warning: "Using demo data (network unavailable). Deploy to Vercel for live scraping.",
  };
}

// Simple HTML to markdown conversion
function htmlToSimpleMarkdown(html: string): string {
  // Remove scripts and styles
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Convert headings
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");

  // Convert paragraphs and line breaks
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/li>/gi, "\n");

  // Convert links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // Convert lists
  text = text.replace(/<li[^>]*>/gi, "- ");
  text = text.replace(/<ul[^>]*>/gi, "\n");
  text = text.replace(/<\/ul>/gi, "\n");

  // Convert bold and italic
  text = text.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**");
  text = text.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*");

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");

  // Clean up whitespace
  text = text
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/  +/g, " ")
    .trim();

  // Limit length
  if (text.length > 50000) {
    text = text.substring(0, 50000) + "\n\n[Content truncated...]";
  }

  return text;
}

// Extract metadata from HTML
function extractMetadata(html: string, url: string): { title?: string; description?: string; ogTitle?: string; ogDescription?: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);

  return {
    title: titleMatch?.[1]?.trim(),
    description: descMatch?.[1]?.trim(),
    ogTitle: ogTitleMatch?.[1]?.trim(),
    ogDescription: ogDescMatch?.[1]?.trim(),
  };
}

// Crawl a website (multiple pages) - uses multiple credits based on maxPages
export async function crawlWebsite(
  url: string,
  options?: { maxPages?: number; includePaths?: string[] }
): Promise<FirecrawlCrawlResult & { warning?: string }> {
  if (!FIRECRAWL_API_KEY) {
    return { success: false, error: "FIRECRAWL_API_KEY not configured" };
  }

  // Estimate credits needed (1 per page, use maxPages as estimate)
  const estimatedCredits = options?.maxPages || 10;

  // Check rate limit and credits
  const check = await checkRateLimitAndCredits(estimatedCredits);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        limit: options?.maxPages || 10,
        includePaths: options?.includePaths || ["/about", "/blog", "/news", "/careers", "/company", "/team"],
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Firecrawl API error: ${error}` };
    }

    const data = await response.json();

    // Firecrawl returns a job ID for async crawls
    if (data.id) {
      // Poll for results (credits recorded after completion)
      const result = await pollCrawlResults(data.id);
      if (result.success && result.data) {
        // Record actual credits used (1 per page scraped)
        await recordCreditUsage(result.data.length);
      }
      return { ...result, warning: check.warning };
    }

    // Record credits for synchronous response
    if (data.data) {
      await recordCreditUsage(data.data.length);
    }

    return { success: true, data: data.data, warning: check.warning };
  } catch (error) {
    return { success: false, error: `Firecrawl request failed: ${error}` };
  }
}

// Poll for crawl results
async function pollCrawlResults(jobId: string, maxAttempts = 30): Promise<FirecrawlCrawlResult> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s between polls

    try {
      const response = await fetch(`${FIRECRAWL_BASE_URL}/crawl/${jobId}`, {
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        },
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (data.status === "completed") {
        return { success: true, data: data.data };
      } else if (data.status === "failed") {
        return { success: false, error: "Crawl failed" };
      }
      // Still processing, continue polling
    } catch {
      continue;
    }
  }

  return { success: false, error: "Crawl timed out" };
}

// ============= ENHANCED SIGNAL EXTRACTION =============
// Comprehensive pattern matching for buying signals

interface SignalPattern {
  pattern: RegExp;
  type: string;
  subtype?: string;
  confidence: "high" | "medium" | "low";
  buyingIntent: "strong" | "moderate" | "weak";
  extractContext?: boolean;
}

// Funding and financial signals - strong buying intent
const FUNDING_PATTERNS: SignalPattern[] = [
  { pattern: /raised?\s+\$(\d+(?:\.\d+)?)\s*(million|m|billion|b)/i, type: "Funding", subtype: "Round Closed", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /series\s+([a-e])\s*(?:funding|round)?/i, type: "Funding", subtype: "Series", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /seed\s+(?:round|funding|investment)/i, type: "Funding", subtype: "Seed", confidence: "high", buyingIntent: "strong" },
  { pattern: /pre-seed|angel\s+(?:round|investment)/i, type: "Funding", subtype: "Pre-Seed", confidence: "high", buyingIntent: "moderate" },
  { pattern: /(?:secured|closed|announced)\s+(?:a\s+)?\$[\d.]+/i, type: "Funding", subtype: "Capital Raised", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /ipo|going\s+public|public\s+offering/i, type: "Funding", subtype: "IPO", confidence: "high", buyingIntent: "strong" },
  { pattern: /valuation\s+(?:of\s+)?\$[\d.]+\s*(?:million|billion|m|b)/i, type: "Funding", subtype: "Valuation", confidence: "medium", buyingIntent: "moderate", extractContext: true },
  { pattern: /profitable|profitability|break-even/i, type: "Financial", subtype: "Profitability", confidence: "medium", buyingIntent: "moderate" },
  { pattern: /revenue\s+(?:grew|growth|increased)\s*(?:by\s+)?(\d+)%/i, type: "Financial", subtype: "Revenue Growth", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /(\d+)x\s+(?:growth|revenue|arr)/i, type: "Financial", subtype: "Multiplier Growth", confidence: "high", buyingIntent: "strong", extractContext: true },
];

// Hiring and growth signals
const HIRING_PATTERNS: SignalPattern[] = [
  { pattern: /hiring\s+(\d+)\+?\s*(?:new\s+)?(?:people|employees|engineers|developers)/i, type: "Hiring", subtype: "Volume Hiring", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /(?:we're|we are)\s+(?:actively\s+)?hiring/i, type: "Hiring", subtype: "Active Hiring", confidence: "high", buyingIntent: "moderate" },
  { pattern: /join\s+(?:our|the)\s+(?:growing\s+)?team/i, type: "Hiring", subtype: "Team Growth", confidence: "medium", buyingIntent: "moderate" },
  { pattern: /(\d+)\+?\s+open\s+(?:positions|roles|jobs)/i, type: "Hiring", subtype: "Open Positions", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /doubl(?:ed?|ing)\s+(?:our\s+)?(?:team|headcount|staff)/i, type: "Hiring", subtype: "Rapid Growth", confidence: "high", buyingIntent: "strong" },
  { pattern: /(?:building|growing)\s+(?:our\s+)?(?:engineering|sales|product)\s+team/i, type: "Hiring", subtype: "Department Growth", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /head\s+of\s+(\w+)|vp\s+(?:of\s+)?(\w+)|director\s+(?:of\s+)?(\w+)/i, type: "Hiring", subtype: "Leadership Hire", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /(?:new|first)\s+(?:cto|cfo|cmo|cro|cpo|vp|svp)/i, type: "Hiring", subtype: "Executive Hire", confidence: "high", buyingIntent: "strong", extractContext: true },
];

// Product and launch signals
const PRODUCT_PATTERNS: SignalPattern[] = [
  { pattern: /(?:launching|launched|announcing|announced|introducing|introduced)\s+(?:our\s+)?(?:new\s+)?(\w+(?:\s+\w+)?)/i, type: "Product", subtype: "Launch", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /new\s+(?:product|feature|platform|solution|service)/i, type: "Product", subtype: "New Feature", confidence: "medium", buyingIntent: "moderate" },
  { pattern: /(?:beta|early\s+access|preview|pilot)/i, type: "Product", subtype: "Beta Phase", confidence: "medium", buyingIntent: "moderate" },
  { pattern: /(?:v2|version\s+2|2\.0|major\s+update|redesign)/i, type: "Product", subtype: "Major Version", confidence: "medium", buyingIntent: "moderate" },
  { pattern: /general\s+availability|ga\s+release|now\s+available/i, type: "Product", subtype: "GA Release", confidence: "high", buyingIntent: "strong" },
  { pattern: /(?:integration|integrates?)\s+with\s+(\w+)/i, type: "Product", subtype: "Integration", confidence: "medium", buyingIntent: "moderate", extractContext: true },
  { pattern: /api\s+(?:launch|release|available)/i, type: "Product", subtype: "API Release", confidence: "medium", buyingIntent: "moderate" },
];

// Expansion and market signals
const EXPANSION_PATTERNS: SignalPattern[] = [
  { pattern: /(?:new|opening|opened)\s+(?:office|headquarters|hq)\s+(?:in\s+)?(\w+(?:\s+\w+)?)/i, type: "Expansion", subtype: "New Office", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /expand(?:ing|ed)\s+(?:to|into)\s+(\w+(?:\s+\w+)?)/i, type: "Expansion", subtype: "Market Expansion", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /(?:entering|entered)\s+(?:the\s+)?(\w+)\s+market/i, type: "Expansion", subtype: "New Market", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /global\s+(?:expansion|growth|presence)/i, type: "Expansion", subtype: "Global Growth", confidence: "medium", buyingIntent: "moderate" },
  { pattern: /(?:emea|apac|latam|europe|asia)\s+(?:expansion|launch|office)/i, type: "Expansion", subtype: "Regional Expansion", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /international\s+(?:growth|expansion|customers)/i, type: "Expansion", subtype: "International", confidence: "medium", buyingIntent: "moderate" },
];

// Partnership and acquisition signals
const PARTNERSHIP_PATTERNS: SignalPattern[] = [
  { pattern: /(?:partnered?|partnership)\s+with\s+(\w+(?:\s+\w+)?)/i, type: "Partnership", subtype: "Strategic Partner", confidence: "high", buyingIntent: "moderate", extractContext: true },
  { pattern: /(?:acquired?|acquisition)\s+(?:of\s+)?(\w+(?:\s+\w+)?)/i, type: "M&A", subtype: "Acquisition", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /(?:merged?|merger)\s+with\s+(\w+)/i, type: "M&A", subtype: "Merger", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /strategic\s+(?:alliance|partnership|investment)/i, type: "Partnership", subtype: "Strategic Alliance", confidence: "high", buyingIntent: "moderate" },
  { pattern: /(?:joined?|join(?:ing)?)\s+(?:the\s+)?(\w+)\s+(?:ecosystem|program|partner)/i, type: "Partnership", subtype: "Ecosystem", confidence: "medium", buyingIntent: "moderate", extractContext: true },
];

// Customer and traction signals
const TRACTION_PATTERNS: SignalPattern[] = [
  { pattern: /(\d+(?:k|m)?)\+?\s+(?:customers?|users?|companies)/i, type: "Traction", subtype: "Customer Count", confidence: "high", buyingIntent: "moderate", extractContext: true },
  { pattern: /(\d+)%\s+(?:growth|increase)\s+in\s+(?:customers?|users?|arr|mrr)/i, type: "Traction", subtype: "Growth Rate", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /fortune\s+(?:500|100|50)|enterprise\s+customers?/i, type: "Traction", subtype: "Enterprise Clients", confidence: "high", buyingIntent: "moderate" },
  { pattern: /(?:trusted\s+by|used\s+by|powers?)\s+(?:leading|top)\s+(?:companies|brands)/i, type: "Traction", subtype: "Brand Validation", confidence: "medium", buyingIntent: "moderate" },
  { pattern: /\$(\d+(?:\.\d+)?)\s*(?:m|million|k|thousand)?\s*(?:arr|mrr|revenue)/i, type: "Traction", subtype: "Revenue Milestone", confidence: "high", buyingIntent: "strong", extractContext: true },
  { pattern: /net\s+(?:revenue\s+)?retention\s+(?:of\s+)?(\d+)%/i, type: "Traction", subtype: "NRR", confidence: "high", buyingIntent: "strong", extractContext: true },
];

// Technology signals
const TECH_PATTERNS: SignalPattern[] = [
  // Cloud & Infrastructure
  { pattern: /\b(aws|amazon\s+web\s+services)\b/i, type: "Tech Stack", subtype: "AWS", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(gcp|google\s+cloud)\b/i, type: "Tech Stack", subtype: "GCP", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(azure|microsoft\s+cloud)\b/i, type: "Tech Stack", subtype: "Azure", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(kubernetes|k8s)\b/i, type: "Tech Stack", subtype: "Kubernetes", confidence: "high", buyingIntent: "weak" },
  { pattern: /\bdocker\b/i, type: "Tech Stack", subtype: "Docker", confidence: "high", buyingIntent: "weak" },
  { pattern: /\bterraform\b/i, type: "Tech Stack", subtype: "Terraform", confidence: "high", buyingIntent: "weak" },
  // AI/ML
  { pattern: /\b(openai|gpt-4|gpt-3|chatgpt|claude|anthropic)\b/i, type: "Tech Stack", subtype: "LLM/AI", confidence: "high", buyingIntent: "moderate" },
  { pattern: /\b(machine\s+learning|ml\s+model|ai-powered)\b/i, type: "Tech Stack", subtype: "ML", confidence: "high", buyingIntent: "moderate" },
  { pattern: /\b(tensorflow|pytorch|hugging\s*face)\b/i, type: "Tech Stack", subtype: "ML Framework", confidence: "high", buyingIntent: "moderate" },
  // Languages & Frameworks
  { pattern: /\b(react|vue|angular|svelte|next\.?js|nuxt)\b/i, type: "Tech Stack", subtype: "Frontend", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(node\.?js|deno|bun)\b/i, type: "Tech Stack", subtype: "Node.js", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(python|django|fastapi|flask)\b/i, type: "Tech Stack", subtype: "Python", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(golang|go\s+lang|rust)\b/i, type: "Tech Stack", subtype: "Systems Lang", confidence: "high", buyingIntent: "weak" },
  { pattern: /\btypescript\b/i, type: "Tech Stack", subtype: "TypeScript", confidence: "high", buyingIntent: "weak" },
  // Data
  { pattern: /\b(postgresql|postgres|mysql|mongodb|redis)\b/i, type: "Tech Stack", subtype: "Database", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(snowflake|databricks|bigquery|redshift)\b/i, type: "Tech Stack", subtype: "Data Warehouse", confidence: "high", buyingIntent: "moderate" },
  { pattern: /\b(kafka|rabbitmq|pulsar)\b/i, type: "Tech Stack", subtype: "Message Queue", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(graphql|rest\s+api|grpc)\b/i, type: "Tech Stack", subtype: "API", confidence: "high", buyingIntent: "weak" },
  // DevOps & Security
  { pattern: /\b(soc\s*2|gdpr|hipaa|iso\s*27001)\b/i, type: "Compliance", subtype: "Security Cert", confidence: "high", buyingIntent: "moderate" },
  { pattern: /\b(ci\/cd|github\s+actions|jenkins|circleci)\b/i, type: "Tech Stack", subtype: "CI/CD", confidence: "high", buyingIntent: "weak" },
];

// Industry vertical signals
const INDUSTRY_PATTERNS: SignalPattern[] = [
  { pattern: /\b(fintech|financial\s+technology|banking\s+tech)\b/i, type: "Industry", subtype: "Fintech", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(healthtech|health\s+tech|healthcare\s+technology|medtech)\b/i, type: "Industry", subtype: "Healthtech", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(edtech|education\s+technology)\b/i, type: "Industry", subtype: "Edtech", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(proptech|real\s+estate\s+tech)\b/i, type: "Industry", subtype: "Proptech", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(cleantech|climate\s+tech|green\s+tech)\b/i, type: "Industry", subtype: "Cleantech", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(devtools|developer\s+tools|dev\s+experience)\b/i, type: "Industry", subtype: "DevTools", confidence: "high", buyingIntent: "weak" },
  { pattern: /\b(saas|software\s+as\s+a\s+service|b2b\s+software)\b/i, type: "Industry", subtype: "SaaS", confidence: "medium", buyingIntent: "weak" },
  { pattern: /\b(e-?commerce|online\s+retail|d2c|dtc)\b/i, type: "Industry", subtype: "E-commerce", confidence: "high", buyingIntent: "weak" },
];

// Extract signals from scraped content
function extractSignals(content: string, url: string): CompanyResearch["signals"] {
  const signals: CompanyResearch["signals"] = [];
  const seenSignals = new Set<string>();

  // Helper to add signal without duplicates
  const addSignal = (
    type: string,
    signalContent: string,
    confidence: "high" | "medium" | "low",
    buyingIntent: "strong" | "moderate" | "weak",
    subtype?: string
  ) => {
    const key = `${type}:${subtype || ""}:${signalContent.toLowerCase().slice(0, 50)}`;
    if (seenSignals.has(key)) return;
    seenSignals.add(key);
    signals.push({
      type: subtype ? `${type} - ${subtype}` : type,
      subtype,
      content: signalContent,
      source: url,
      confidence,
      buyingIntent,
    });
  };

  // Helper to extract context around a match
  const extractContext = (match: RegExpMatchArray, maxLength = 100): string => {
    const fullMatch = match[0];
    const index = match.index || 0;
    const start = Math.max(0, index - 30);
    const end = Math.min(content.length, index + fullMatch.length + 50);
    let context = content.slice(start, end).replace(/\s+/g, " ").trim();
    if (context.length > maxLength) {
      context = context.slice(0, maxLength) + "...";
    }
    return context;
  };

  // Process all pattern groups
  const allPatterns = [
    ...FUNDING_PATTERNS,
    ...HIRING_PATTERNS,
    ...PRODUCT_PATTERNS,
    ...EXPANSION_PATTERNS,
    ...PARTNERSHIP_PATTERNS,
    ...TRACTION_PATTERNS,
    ...TECH_PATTERNS,
    ...INDUSTRY_PATTERNS,
  ];

  for (const patternDef of allPatterns) {
    const matches = content.matchAll(new RegExp(patternDef.pattern, "gi"));
    for (const match of matches) {
      const signalContent = patternDef.extractContext
        ? extractContext(match)
        : match[0];
      addSignal(
        patternDef.type,
        signalContent,
        patternDef.confidence,
        patternDef.buyingIntent,
        patternDef.subtype
      );
    }
  }

  // Sort by confidence (high first) and limit
  return signals
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.confidence] - order[b.confidence];
    })
    .slice(0, 20); // Limit to top 20 signals
}

// Extract company info from about page
function extractCompanyInfo(content: string): Partial<CompanyResearch> {
  const info: Partial<CompanyResearch> = {};

  // Try to extract description (first paragraph usually)
  const descMatch = content.match(/^(.{50,300}?\.)/m);
  if (descMatch) {
    info.description = descMatch[1].trim();
  }

  // Team size patterns
  const sizePatterns = [
    /(\d+)\+?\s*employees/i,
    /team\s+of\s+(\d+)/i,
    /(\d+)\s*people/i,
  ];

  for (const pattern of sizePatterns) {
    const match = content.match(pattern);
    if (match) {
      info.teamInfo = { size: match[1] };
      break;
    }
  }

  return info;
}

// Extract news/blog posts
function extractNews(content: string, url: string): CompanyResearch["recentNews"] {
  const news: CompanyResearch["recentNews"] = [];

  // Look for headlines/titles (markdown format)
  const headlineMatches = content.matchAll(/^#+\s*(.+)$/gm);
  for (const match of headlineMatches) {
    const title = match[1].trim();
    if (title.length > 10 && title.length < 200) {
      // Get snippet (text after headline)
      const startIndex = (match.index || 0) + match[0].length;
      const snippet = content.slice(startIndex, startIndex + 200).trim().split("\n")[0];

      news.push({
        title,
        snippet: snippet.slice(0, 150),
        url,
      });

      if (news.length >= 5) break;
    }
  }

  return news;
}

// Main research function - comprehensive company research
// Uses 4 credits (one per page: home, about, blog, careers)
export async function researchCompany(domain: string): Promise<CompanyResearch & { usageWarning?: string }> {
  const baseUrl = `https://${domain.replace(/^https?:\/\//, "")}`;

  const research: CompanyResearch & { usageWarning?: string } = {
    domain,
    companyName: domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1),
    description: "",
    signals: [],
    recentNews: [],
    teamInfo: {},
    techStack: [],
    painPoints: [],
  };

  // If no API key, return basic structure
  if (!FIRECRAWL_API_KEY) {
    research.signals.push({
      type: "Note",
      content: "Add FIRECRAWL_API_KEY to enable deep company research",
      source: "system",
      confidence: "high",
    });
    return research;
  }

  // Check if we have enough credits for deep research (4 pages)
  const check = await checkRateLimitAndCredits(4);
  if (!check.allowed) {
    research.signals.push({
      type: "Limit",
      content: check.reason || "Rate/credit limit reached",
      source: "system",
      confidence: "high",
    });
    return research;
  }

  if (check.warning) {
    research.usageWarning = check.warning;
  }

  // Scrape key pages (4 credits total for deep research)
  const pagesToScrape = [
    { url: baseUrl, type: "home" },
    { url: `${baseUrl}/about`, type: "about" },
    { url: `${baseUrl}/blog`, type: "blog" },
    { url: `${baseUrl}/careers`, type: "careers" },
  ];

  const allSignals: CompanyResearch["signals"] = [];
  const allNews: CompanyResearch["recentNews"] = [];
  const techSet = new Set<string>();

  for (const page of pagesToScrape) {
    const result = await scrapeUrl(page.url);

    if (result.success && result.data?.markdown) {
      const content = result.data.markdown;

      // Extract signals
      const pageSignals = extractSignals(content, page.url);
      allSignals.push(...pageSignals);

      // Extract tech stack
      pageSignals
        .filter((s) => s.type === "Tech Stack")
        .forEach((s) => techSet.add(s.content));

      // Extract company info from about page
      if (page.type === "about") {
        const companyInfo = extractCompanyInfo(content);
        if (companyInfo.description) research.description = companyInfo.description;
        if (companyInfo.teamInfo) research.teamInfo = companyInfo.teamInfo;
      }

      // Extract news from blog
      if (page.type === "blog") {
        const news = extractNews(content, page.url);
        allNews.push(...news);
      }

      // Get metadata
      if (result.data.metadata) {
        if (!research.description && result.data.metadata.description) {
          research.description = result.data.metadata.description;
        }
        if (result.data.metadata.title) {
          // Extract company name from title
          const titleParts = result.data.metadata.title.split(/[-|–]/);
          if (titleParts.length > 0) {
            research.companyName = titleParts[0].trim();
          }
        }
      }
    }
  }

  // Dedupe signals
  const seenSignals = new Set<string>();
  research.signals = allSignals.filter((s) => {
    const key = `${s.type}:${s.content}`;
    if (seenSignals.has(key)) return false;
    seenSignals.add(key);
    return s.type !== "Tech Stack"; // Tech stack handled separately
  });

  research.techStack = Array.from(techSet);
  research.recentNews = allNews.slice(0, 5);

  // Infer pain points based on signals
  research.painPoints = inferPainPoints(research.signals, research.teamInfo);

  return research;
}

// ============= ENHANCED PAIN POINT INFERENCE =============
// Comprehensive analysis based on signals, stage, and context

interface PainPointRule {
  condition: (ctx: PainPointContext) => boolean;
  pain: string;
  urgency: "immediate" | "near-term" | "ongoing";
  category: "growth" | "operations" | "technology" | "people" | "market";
}

interface PainPointContext {
  signalTypes: Set<string>;
  signalContent: string[];
  teamSize?: number;
  hasFunding: boolean;
  fundingStage?: string;
  isHiring: boolean;
  hiringVolume: "aggressive" | "moderate" | "light" | "none";
  isExpanding: boolean;
  hasNewLeadership: boolean;
  hasProductLaunch: boolean;
  techStack: string[];
  industry?: string;
}

// Comprehensive pain point rules
const PAIN_POINT_RULES: PainPointRule[] = [
  // === FUNDING-TRIGGERED PAINS ===
  {
    condition: (ctx) => ctx.signalTypes.has("Funding - Series") || ctx.signalTypes.has("Funding - Round Closed"),
    pain: "Board pressure to hit aggressive growth targets with new capital",
    urgency: "immediate",
    category: "growth",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Funding - Seed") || ctx.signalTypes.has("Funding - Pre-Seed"),
    pain: "Finding product-market fit before runway depletes",
    urgency: "immediate",
    category: "growth",
  },
  {
    condition: (ctx) => ctx.hasFunding && ctx.isHiring,
    pain: "Deploying capital efficiently while scaling team rapidly",
    urgency: "immediate",
    category: "operations",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Funding - IPO"),
    pain: "Meeting public market expectations and compliance requirements",
    urgency: "immediate",
    category: "operations",
  },

  // === HIRING-TRIGGERED PAINS ===
  {
    condition: (ctx) => ctx.hiringVolume === "aggressive",
    pain: "Maintaining culture and quality bar while hiring fast",
    urgency: "immediate",
    category: "people",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Hiring - Leadership Hire") || ctx.signalTypes.has("Hiring - Executive Hire"),
    pain: "New executive evaluating and potentially replacing existing vendors",
    urgency: "immediate",
    category: "operations",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Hiring - Department Growth"),
    pain: "Building new team capabilities from scratch",
    urgency: "near-term",
    category: "people",
  },
  {
    condition: (ctx) => ctx.isHiring && (ctx.teamSize ?? 0) > 0 && (ctx.teamSize ?? 0) < 50,
    pain: "Every hire is critical - wrong hires set back the company months",
    urgency: "immediate",
    category: "people",
  },
  {
    condition: (ctx) => ctx.isHiring && (ctx.teamSize ?? 0) > 100,
    pain: "Onboarding at scale while maintaining productivity",
    urgency: "ongoing",
    category: "people",
  },

  // === PRODUCT-TRIGGERED PAINS ===
  {
    condition: (ctx) => ctx.hasProductLaunch,
    pain: "Driving adoption and usage of new product features",
    urgency: "immediate",
    category: "growth",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Product - GA Release"),
    pain: "Scaling infrastructure to handle production load",
    urgency: "immediate",
    category: "technology",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Product - Beta Phase"),
    pain: "Converting beta users to paying customers",
    urgency: "near-term",
    category: "growth",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Product - Integration"),
    pain: "Managing integration complexity and partner relationships",
    urgency: "ongoing",
    category: "technology",
  },

  // === EXPANSION-TRIGGERED PAINS ===
  {
    condition: (ctx) => ctx.isExpanding,
    pain: "Coordinating across time zones and maintaining team cohesion",
    urgency: "ongoing",
    category: "operations",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Expansion - New Market") || ctx.signalTypes.has("Expansion - Market Expansion"),
    pain: "Adapting product and GTM for new market requirements",
    urgency: "immediate",
    category: "market",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Expansion - Regional Expansion"),
    pain: "Navigating regional compliance and data residency requirements",
    urgency: "immediate",
    category: "operations",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Expansion - Global Growth"),
    pain: "Localizing product and support for international customers",
    urgency: "near-term",
    category: "market",
  },

  // === LEADERSHIP-TRIGGERED PAINS ===
  {
    condition: (ctx) => ctx.hasNewLeadership,
    pain: "New leader wants to make their mark with fresh initiatives",
    urgency: "immediate",
    category: "operations",
  },
  {
    condition: (ctx) => ctx.hasNewLeadership && ctx.hasFunding,
    pain: "Pressure to justify investment thesis with quick wins",
    urgency: "immediate",
    category: "growth",
  },

  // === TECHNOLOGY-TRIGGERED PAINS ===
  {
    condition: (ctx) => ctx.techStack.some(t => /kubernetes|k8s/i.test(t)),
    pain: "Managing Kubernetes complexity and cost optimization",
    urgency: "ongoing",
    category: "technology",
  },
  {
    condition: (ctx) => ctx.techStack.some(t => /llm|ai|gpt|claude|openai/i.test(t)),
    pain: "Controlling AI/LLM costs while maintaining quality",
    urgency: "ongoing",
    category: "technology",
  },
  {
    condition: (ctx) => ctx.techStack.some(t => /microservices/i.test(t)),
    pain: "Observability and debugging across distributed services",
    urgency: "ongoing",
    category: "technology",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Compliance - Security Cert"),
    pain: "Maintaining compliance while shipping features fast",
    urgency: "ongoing",
    category: "operations",
  },

  // === TRACTION-TRIGGERED PAINS ===
  {
    condition: (ctx) => ctx.signalTypes.has("Traction - Enterprise Clients"),
    pain: "Meeting enterprise security, compliance, and SLA requirements",
    urgency: "ongoing",
    category: "operations",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Traction - Growth Rate"),
    pain: "Scaling infrastructure and team to match hypergrowth",
    urgency: "immediate",
    category: "operations",
  },

  // === PARTNERSHIP-TRIGGERED PAINS ===
  {
    condition: (ctx) => ctx.signalTypes.has("M&A - Acquisition"),
    pain: "Integrating acquired company while maintaining momentum",
    urgency: "immediate",
    category: "operations",
  },
  {
    condition: (ctx) => ctx.signalTypes.has("Partnership - Strategic Partner"),
    pain: "Delivering on partnership commitments while running core business",
    urgency: "near-term",
    category: "market",
  },

  // === STAGE-BASED PAINS ===
  {
    condition: (ctx) => (ctx.teamSize ?? 0) >= 10 && (ctx.teamSize ?? 0) <= 30,
    pain: "Transitioning from startup chaos to structured processes",
    urgency: "ongoing",
    category: "operations",
  },
  {
    condition: (ctx) => (ctx.teamSize ?? 0) >= 50 && (ctx.teamSize ?? 0) <= 150,
    pain: "Breaking down silos as teams specialize and grow",
    urgency: "ongoing",
    category: "people",
  },
  {
    condition: (ctx) => (ctx.teamSize ?? 0) > 200,
    pain: "Maintaining agility and innovation at scale",
    urgency: "ongoing",
    category: "operations",
  },
];

// Infer pain points from signals
function inferPainPoints(
  signals: CompanyResearch["signals"],
  teamInfo: CompanyResearch["teamInfo"]
): string[] {
  // Build context object
  const signalTypes = new Set(signals.map((s) => s.type));
  const signalContent = signals.map((s) => s.content.toLowerCase());
  const teamSize = teamInfo.size ? parseInt(teamInfo.size) : undefined;

  // Detect patterns
  const hasFunding = signals.some((s) => s.type.startsWith("Funding"));
  const fundingStage = signals.find((s) => s.type.includes("Series"))?.content;
  const isHiring = signals.some((s) => s.type.startsWith("Hiring"));
  const isExpanding = signals.some((s) => s.type.startsWith("Expansion"));
  const hasNewLeadership = signals.some((s) =>
    s.type.includes("Leadership") || s.type.includes("Executive")
  );
  const hasProductLaunch = signals.some((s) => s.type.startsWith("Product"));
  const techStack = signals
    .filter((s) => s.type.startsWith("Tech Stack"))
    .map((s) => s.content);

  // Determine hiring volume
  let hiringVolume: "aggressive" | "moderate" | "light" | "none" = "none";
  if (isHiring) {
    const hiringSignals = signals.filter((s) => s.type.startsWith("Hiring"));
    if (hiringSignals.length >= 3 || signalContent.some((c) => /\d{2,}\s*(?:positions|roles|jobs)/i.test(c))) {
      hiringVolume = "aggressive";
    } else if (hiringSignals.length >= 2) {
      hiringVolume = "moderate";
    } else {
      hiringVolume = "light";
    }
  }

  const ctx: PainPointContext = {
    signalTypes,
    signalContent,
    teamSize,
    hasFunding,
    fundingStage,
    isHiring,
    hiringVolume,
    isExpanding,
    hasNewLeadership,
    hasProductLaunch,
    techStack,
  };

  // Apply rules and collect pains
  const matchedPains: { pain: string; urgency: string; category: string }[] = [];

  for (const rule of PAIN_POINT_RULES) {
    if (rule.condition(ctx)) {
      matchedPains.push({
        pain: rule.pain,
        urgency: rule.urgency,
        category: rule.category,
      });
    }
  }

  // Sort by urgency (immediate first) and dedupe
  const urgencyOrder = { immediate: 0, "near-term": 1, ongoing: 2 };
  const sortedPains = matchedPains
    .sort((a, b) => urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder]);

  // Return unique pains, prioritizing immediate ones
  const seen = new Set<string>();
  const uniquePains: string[] = [];
  for (const p of sortedPains) {
    if (!seen.has(p.pain)) {
      seen.add(p.pain);
      uniquePains.push(p.pain);
    }
  }

  return uniquePains.slice(0, 6); // Return top 6 most relevant
}

// ============= ENHANCED RESEARCH OUTPUT =============
// Generates actionable insights and outreach angles

export interface EnhancedResearch {
  // Basic info
  domain: string;
  companyName: string;
  description: string;

  // Categorization
  industry: string;
  companyType: "startup" | "scaleup" | "enterprise" | "smb" | "unknown";
  stage: "early" | "growth" | "mature" | "unknown";

  // Signals & insights
  signals: Array<{
    type: string;
    content: string;
    source: string;
    confidence: "high" | "medium" | "low";
    buyingIntent: "strong" | "moderate" | "weak";
  }>;
  painPoints: string[];
  techStack: string[];

  // Actionable outreach
  outreachAngles: Array<{
    angle: string;
    opener: string;
    whyNow: string;
    priority: "high" | "medium" | "low";
  }>;

  // Recommended contacts
  targetPersonas: Array<{
    title: string;
    reason: string;
  }>;

  // Timing
  bestTiming: string;
  urgencyScore: number; // 1-10

  // Metadata
  recentNews: Array<{ title: string; snippet: string; url: string }>;
  warning?: string;
  error?: string;
}

// Generate outreach angles based on detected signals
function generateOutreachAngles(
  signals: CompanyResearch["signals"],
  painPoints: string[],
  companyName: string
): EnhancedResearch["outreachAngles"] {
  const angles: EnhancedResearch["outreachAngles"] = [];

  // Helper to check if any signal matches a category (handles "Funding - Series A" format)
  const hasSignalCategory = (category: string) =>
    signals.some(s => s.type.startsWith(category));

  const hasSignalSubtype = (subtype: string) =>
    signals.some(s => s.type.includes(subtype) || s.subtype === subtype);

  // Funding-based angles
  if (hasSignalCategory("Funding")) {
    angles.push({
      angle: "Post-Funding Growth",
      opener: `Congrats on the recent funding! Companies at your stage often struggle with [problem]. We've helped similar companies like...`,
      whyNow: `Fresh capital = budget to invest in growth infrastructure`,
      priority: "high",
    });
  }

  // Hiring-based angles
  if (hasSignalCategory("Hiring")) {
    if (hasSignalSubtype("Volume Hiring") || hasSignalSubtype("Rapid Growth")) {
      angles.push({
        angle: "Scaling Team Challenges",
        opener: `Saw you're rapidly growing the team. When companies double headcount, they often face [challenge]. We help by...`,
        whyNow: `Rapid hiring = process/tooling pain points emerging`,
        priority: "high",
      });
    }
    if (hasSignalSubtype("Executive Hire") || hasSignalSubtype("Leadership Hire")) {
      angles.push({
        angle: "New Leadership Priorities",
        opener: `Noticed you brought on new leadership. New executives often look to make quick wins in their first 90 days...`,
        whyNow: `New leaders have budget authority and mandate to change things`,
        priority: "high",
      });
    }
    if (hasSignalSubtype("Department Growth")) {
      angles.push({
        angle: "Department Build-Out",
        opener: `Saw you're building out the team. Companies investing in this area typically need [solution] to scale effectively...`,
        whyNow: `Active investment in capability = receptive to supporting tools`,
        priority: "medium",
      });
    }
  }

  // Product launch angles
  if (hasSignalCategory("Product")) {
    angles.push({
      angle: "Post-Launch Momentum",
      opener: `Congrats on the recent launch! Companies in launch mode often need [solution] to capitalize on momentum...`,
      whyNow: `Launch = high visibility period, receptive to growth tools`,
      priority: "medium",
    });
  }

  // Expansion angles
  if (hasSignalCategory("Expansion")) {
    angles.push({
      angle: "Market Expansion Support",
      opener: `Noticed you're expanding into new markets. Companies entering new regions often face [challenge] that we help solve...`,
      whyNow: `Expansion = new budgets and urgency to execute`,
      priority: "high",
    });
  }

  // Tech stack angles (check in raw signals since tech stack is extracted separately)
  if (hasSignalCategory("Tech Stack")) {
    if (hasSignalSubtype("LLM/AI") || hasSignalSubtype("ML")) {
      angles.push({
        angle: "AI/ML Infrastructure",
        opener: `Saw you're building with AI/ML. Teams investing in AI often struggle with [problem]. We've helped similar companies...`,
        whyNow: `AI adoption = complex infrastructure needs`,
        priority: "medium",
      });
    }
  }

  // Pain point-based angles
  if (painPoints.length > 0) {
    const topPain = painPoints[0];
    angles.push({
      angle: "Address Core Challenge",
      opener: `Companies at your stage typically struggle with "${topPain.toLowerCase()}". We've seen this pattern and built a solution that...`,
      whyNow: `This pain point likely exists based on company signals`,
      priority: "medium",
    });
  }

  // Traction-based angles
  if (hasSignalCategory("Traction")) {
    angles.push({
      angle: "Scale Operations",
      opener: `Your growth metrics are impressive! Companies hitting your scale often need to upgrade [area] to maintain momentum...`,
      whyNow: `Proven traction = budget and urgency to optimize`,
      priority: "medium",
    });
  }

  // Default angle if none matched
  if (angles.length === 0) {
    angles.push({
      angle: "Industry Relevance",
      opener: `${companyName} seems like a great fit for what we're building. Companies in your space typically face [challenge]...`,
      whyNow: `General industry fit`,
      priority: "low",
    });
  }

  return angles.slice(0, 4); // Top 4 angles
}

// Determine target personas based on signals
function determineTargetPersonas(
  signals: CompanyResearch["signals"],
  industry?: string
): EnhancedResearch["targetPersonas"] {
  const personas: EnhancedResearch["targetPersonas"] = [];

  // Helper to check if any signal matches a category
  const hasSignalCategory = (category: string) =>
    signals.some(s => s.type.startsWith(category));

  const hasSignalSubtype = (subtype: string) =>
    signals.some(s => s.type.includes(subtype) || s.subtype === subtype);

  // Engineering/Tech signals
  if (hasSignalCategory("Tech Stack") || hasSignalSubtype("Department Growth")) {
    personas.push({
      title: "VP of Engineering / CTO",
      reason: "Technical decision maker, controls engineering budget",
    });
    personas.push({
      title: "Engineering Manager",
      reason: "Day-to-day tooling decisions, strong influence on adoption",
    });
  }

  // Growth/Sales signals
  if (hasSignalCategory("Funding") || hasSignalCategory("Expansion") || hasSignalCategory("Traction")) {
    personas.push({
      title: "VP of Sales / CRO",
      reason: "Growth mandate, budget for revenue tools",
    });
    personas.push({
      title: "Head of Growth",
      reason: "Owns growth initiatives, experimental with new tools",
    });
  }

  // Hiring signals
  if (hasSignalCategory("Hiring")) {
    personas.push({
      title: "VP of People / Head of HR",
      reason: "Owns hiring initiatives and people ops tools",
    });
  }

  // Product signals
  if (hasSignalCategory("Product")) {
    personas.push({
      title: "VP of Product / CPO",
      reason: "Product roadmap owner, evaluates supporting tools",
    });
  }

  // Default
  if (personas.length === 0) {
    personas.push({
      title: "CEO / Founder",
      reason: "Early-stage decision maker for all major purchases",
    });
    personas.push({
      title: "Head of Operations",
      reason: "Operational efficiency and tooling decisions",
    });
  }

  return personas.slice(0, 3);
}

// Determine company stage and type
function categorizeCompany(
  signals: CompanyResearch["signals"],
  description: string
): { companyType: EnhancedResearch["companyType"]; stage: EnhancedResearch["stage"]; industry: string } {
  const signalTypes = new Set(signals.map(s => s.type));
  const signalSubtypes = signals.map(s => `${s.type} - ${s.subtype || ""}`).join(" ");
  const industrySignals = signals.filter(s => s.type === "Industry");

  // Determine industry
  let industry = "Technology";
  if (industrySignals.length > 0) {
    industry = industrySignals[0].subtype || "Technology";
  }

  // Determine stage
  let stage: EnhancedResearch["stage"] = "unknown";
  if (signalSubtypes.includes("Seed") || signalSubtypes.includes("Pre-Seed")) {
    stage = "early";
  } else if (signalSubtypes.includes("Series A") || signalSubtypes.includes("Series B")) {
    stage = "growth";
  } else if (signalSubtypes.includes("Series C") || signalSubtypes.includes("Series D") || signalSubtypes.includes("IPO")) {
    stage = "mature";
  } else if (signalTypes.has("Funding")) {
    stage = "growth";
  }

  // Determine company type
  let companyType: EnhancedResearch["companyType"] = "unknown";
  if (stage === "early") {
    companyType = "startup";
  } else if (stage === "growth") {
    companyType = "scaleup";
  } else if (stage === "mature" || signalSubtypes.includes("Enterprise")) {
    companyType = "enterprise";
  } else if (signalTypes.has("Traction")) {
    companyType = "scaleup";
  }

  return { companyType, stage, industry };
}

// Calculate urgency score
function calculateUrgencyScore(signals: CompanyResearch["signals"]): number {
  let score = 3; // Base score

  for (const signal of signals) {
    if (signal.buyingIntent === "strong") score += 2;
    else if (signal.buyingIntent === "moderate") score += 1;

    // Bonus for high-confidence signals
    if (signal.confidence === "high") score += 0.5;
  }

  // Cap at 10
  return Math.min(Math.round(score), 10);
}

// Determine best timing
function determineBestTiming(signals: CompanyResearch["signals"]): string {
  const signalSubtypes = signals.map(s => `${s.type} - ${s.subtype || ""}`).join(" ");

  if (signalSubtypes.includes("Funding")) {
    return "Reach out within 2-4 weeks of funding announcement";
  }
  if (signalSubtypes.includes("Executive Hire") || signalSubtypes.includes("Leadership Hire")) {
    return "Contact within first 90 days of new leadership";
  }
  if (signalSubtypes.includes("Launch") || signalSubtypes.includes("GA Release")) {
    return "Reach out during post-launch momentum (1-2 weeks)";
  }
  if (signalSubtypes.includes("Expansion")) {
    return "Contact during expansion planning phase";
  }
  if (signalSubtypes.includes("Volume Hiring")) {
    return "Reach out early in hiring ramp";
  }

  return "No specific timing trigger - reach out anytime";
}

// Quick scrape for enrichment (single page, fast) - uses 1 credit
// Now returns EnhancedResearch with actionable insights
export async function quickEnrich(domain: string): Promise<EnhancedResearch> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const result = await scrapeUrl(`https://${cleanDomain}`);

  // Base response structure
  const baseResponse: EnhancedResearch = {
    domain: cleanDomain,
    companyName: cleanDomain.split(".")[0].charAt(0).toUpperCase() + cleanDomain.split(".")[0].slice(1),
    description: "",
    industry: "Technology",
    companyType: "unknown",
    stage: "unknown",
    signals: [],
    painPoints: [],
    techStack: [],
    outreachAngles: [],
    targetPersonas: [],
    bestTiming: "No specific timing trigger",
    urgencyScore: 3,
    recentNews: [],
  };

  if (!result.success) {
    return {
      ...baseResponse,
      error: result.error || "Failed to fetch website",
      warning: "Could not reach website. Check if the domain is correct.",
      outreachAngles: [{
        angle: "Cold Outreach",
        opener: `Hi! I noticed ${baseResponse.companyName} and thought you might be interested in...`,
        whyNow: "General outreach - no specific trigger found",
        priority: "low",
      }],
      targetPersonas: [{ title: "CEO / Founder", reason: "Default decision maker" }],
    };
  }

  if (!result.data?.markdown) {
    return {
      ...baseResponse,
      warning: "No content found on website.",
    };
  }

  const content = result.data.markdown;
  const rawSignals = extractSignals(content, cleanDomain);

  // Extract company name from title or og:title
  const companyName = result.data.metadata?.ogTitle?.split(/[|\-–—]/)[0]?.trim() ||
                      result.data.metadata?.title?.split(/[|\-–—]/)[0]?.trim() ||
                      baseResponse.companyName;

  // Get description from metadata
  const description = result.data.metadata?.ogDescription ||
                      result.data.metadata?.description ||
                      extractFirstParagraph(content);

  // Categorize company
  const { companyType, stage, industry } = categorizeCompany(rawSignals, description);

  // Extract tech stack (signal types like "Tech Stack - AWS")
  const techStack = [...new Set(
    rawSignals
      .filter(s => s.type.startsWith("Tech Stack"))
      .map(s => s.subtype || s.content)
  )];

  // Convert signals to enhanced format (exclude tech stack signals)
  const signals = rawSignals
    .filter(s => !s.type.startsWith("Tech Stack"))
    .map(s => ({
      type: s.type,
      content: s.content,
      source: s.source,
      confidence: s.confidence,
      buyingIntent: s.buyingIntent || determineBuyingIntent(s),
    }));

  // Infer pain points (use raw signals to include tech stack info)
  const painPoints = inferPainPoints(rawSignals, {});

  // Generate outreach angles (use raw signals to include tech stack for AI/ML detection)
  const outreachAngles = generateOutreachAngles(rawSignals, painPoints, companyName);

  // Determine target personas (use raw signals to include tech stack)
  const targetPersonas = determineTargetPersonas(rawSignals, industry);

  // Calculate urgency
  const urgencyScore = calculateUrgencyScore(rawSignals);

  // Determine timing
  const bestTiming = determineBestTiming(rawSignals);

  return {
    domain: cleanDomain,
    companyName,
    description,
    industry,
    companyType,
    stage,
    signals,
    painPoints,
    techStack,
    outreachAngles,
    targetPersonas,
    bestTiming,
    urgencyScore,
    recentNews: [],
    warning: result.warning,
  };
}

// Helper to extract first meaningful paragraph from content
function extractFirstParagraph(content: string): string {
  const lines = content.split("\n").filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 50 && !trimmed.startsWith("#") && !trimmed.startsWith("-");
  });
  return lines[0]?.substring(0, 300) || "";
}

// Helper to determine buying intent from signal (fallback when not set by pattern)
function determineBuyingIntent(signal: CompanyResearch["signals"][0]): "strong" | "moderate" | "weak" {
  const strongTypes = ["Funding", "M&A", "Expansion"];
  const moderateTypes = ["Hiring", "Product", "Partnership", "Traction"];

  // Check if signal type STARTS WITH any of the strong/moderate categories
  // Signal types are formatted as "Category - Subtype" (e.g., "Funding - Series A")
  const baseType = signal.type.split(" - ")[0];

  if (strongTypes.includes(baseType)) return "strong";
  if (moderateTypes.includes(baseType)) return "moderate";
  return "weak";
}
