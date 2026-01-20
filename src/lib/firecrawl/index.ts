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
    content: string;
    source: string;
    confidence: "high" | "medium" | "low";
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
  if (!FIRECRAWL_API_KEY) {
    return { success: false, error: "FIRECRAWL_API_KEY not configured" };
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
      return { success: false, error: `Firecrawl API error: ${error}` };
    }

    // Record credit usage on success
    await recordCreditUsage(1);

    const data = await response.json();
    return { success: true, data: data.data, warning: check.warning };
  } catch (error) {
    return { success: false, error: `Firecrawl request failed: ${error}` };
  }
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

// Extract signals from scraped content
function extractSignals(content: string, url: string): CompanyResearch["signals"] {
  const signals: CompanyResearch["signals"] = [];
  const contentLower = content.toLowerCase();

  // Funding signals
  const fundingPatterns = [
    { pattern: /raised?\s+\$[\d.]+\s*(million|m|billion|b)/i, type: "Funding Round" },
    { pattern: /series\s+[a-d]/i, type: "Funding Stage" },
    { pattern: /seed\s+(round|funding)/i, type: "Seed Funding" },
    { pattern: /ipo|going\s+public/i, type: "IPO Signal" },
  ];

  for (const { pattern, type } of fundingPatterns) {
    const match = content.match(pattern);
    if (match) {
      signals.push({
        type,
        content: match[0],
        source: url,
        confidence: "high",
      });
    }
  }

  // Product signals
  if (/launch|releasing|announcing|introducing/i.test(content)) {
    signals.push({
      type: "Product Launch",
      content: "Recent product announcement detected",
      source: url,
      confidence: "medium",
    });
  }

  // Expansion signals
  if (/new\s+office|expanding\s+to|opening\s+in|hiring\s+in/i.test(content)) {
    signals.push({
      type: "Expansion",
      content: "Geographic or office expansion",
      source: url,
      confidence: "medium",
    });
  }

  // Leadership signals
  if (/new\s+(ceo|cto|cfo|vp|head\s+of|chief)/i.test(content)) {
    signals.push({
      type: "Leadership Change",
      content: "New executive hire",
      source: url,
      confidence: "high",
    });
  }

  // Tech stack signals
  const techPatterns = [
    "kubernetes", "docker", "aws", "gcp", "azure", "react", "node",
    "python", "golang", "rust", "typescript", "graphql", "microservices",
    "machine learning", "ai", "llm", "gpt"
  ];

  for (const tech of techPatterns) {
    if (contentLower.includes(tech)) {
      signals.push({
        type: "Tech Stack",
        content: tech.charAt(0).toUpperCase() + tech.slice(1),
        source: url,
        confidence: "high",
      });
    }
  }

  // Hiring signals
  if (/hiring|join\s+our\s+team|we're\s+growing|open\s+positions/i.test(content)) {
    signals.push({
      type: "Hiring",
      content: "Active hiring detected",
      source: url,
      confidence: "high",
    });
  }

  return signals;
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

// Infer pain points from signals
function inferPainPoints(
  signals: CompanyResearch["signals"],
  teamInfo: CompanyResearch["teamInfo"]
): string[] {
  const pains: string[] = [];

  const signalTypes = new Set(signals.map((s) => s.type));

  if (signalTypes.has("Hiring")) {
    pains.push("Scaling team while maintaining quality");
  }
  if (signalTypes.has("Funding Round") || signalTypes.has("Funding Stage")) {
    pains.push("Pressure to show growth with new capital");
  }
  if (signalTypes.has("Product Launch")) {
    pains.push("Go-to-market execution and adoption");
  }
  if (signalTypes.has("Expansion")) {
    pains.push("Operational complexity across locations");
  }
  if (signalTypes.has("Leadership Change")) {
    pains.push("New leader evaluating tools and processes");
  }

  // Team size based pains
  if (teamInfo.size) {
    const size = parseInt(teamInfo.size);
    if (size > 50 && size < 200) {
      pains.push("Scaling processes that worked when smaller");
    }
    if (size > 200) {
      pains.push("Enterprise-grade security and compliance needs");
    }
  }

  return pains;
}

// Quick scrape for enrichment (single page, fast) - uses 1 credit
export async function quickEnrich(domain: string): Promise<{
  description?: string;
  signals: string[];
  techStack: string[];
  warning?: string;
}> {
  const result = await scrapeUrl(`https://${domain}`);

  if (!result.success || !result.data?.markdown) {
    return { signals: [], techStack: [] };
  }

  const content = result.data.markdown;
  const signals = extractSignals(content, domain);

  return {
    description: result.data.metadata?.description,
    signals: signals.map((s) => s.content),
    techStack: signals.filter((s) => s.type === "Tech Stack").map((s) => s.content),
    warning: result.warning,
  };
}
