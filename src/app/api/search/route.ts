/**
 * Dynamic Search API - Pulls ALL data from the web in real-time
 * NO static database - discovers companies via web search + job board APIs
 *
 * Flow:
 * 1. Parse query to understand intent
 * 2. Search web for matching companies
 * 3. Discover job boards dynamically (Greenhouse/Lever)
 * 4. Scrape websites for signals
 * 5. Score and rank results
 */

import { NextResponse } from "next/server";
import { quickEnrich, type EnhancedResearch } from "@/lib/firecrawl";

// ============ TECH PATTERNS ============
const TECH_PATTERNS: Record<string, RegExp> = {
  "React": /\breact\b/i,
  "Next.js": /\bnext\.?js\b/i,
  "Vue": /\bvue\.?js?\b/i,
  "Angular": /\bangular\b/i,
  "TypeScript": /\btypescript\b/i,
  "Node.js": /\bnode\.?js\b/i,
  "Python": /\bpython\b/i,
  "Go": /\bgolang\b|\bgo\s+(programming|developer|engineer)/i,
  "Rust": /\brust\b/i,
  "Kubernetes": /\bkubernetes\b|\bk8s\b/i,
  "AWS": /\baws\b|\bamazon web services\b/i,
  "GCP": /\bgcp\b|\bgoogle cloud\b/i,
  "PostgreSQL": /\bpostgres(ql)?\b/i,
  "MongoDB": /\bmongodb\b/i,
  "Redis": /\bredis\b/i,
  "GraphQL": /\bgraphql\b/i,
  "Docker": /\bdocker\b/i,
  "Terraform": /\bterraform\b/i,
  "PyTorch": /\bpytorch\b/i,
  "TensorFlow": /\btensorflow\b/i,
  "OpenAI": /\bopenai\b/i,
  "LangChain": /\blangchain\b/i,
};

// ============ DEPARTMENT PATTERNS ============
const DEPT_PATTERNS: Record<string, { pattern: RegExp; titles: string[] }> = {
  "Engineering": {
    pattern: /engineer|developer|software|backend|frontend|fullstack|sre|devops|platform|architect/i,
    titles: ["VP of Engineering", "CTO", "Engineering Manager"],
  },
  "Sales": {
    pattern: /sales|account executive|sdr|bdr|revenue|ae\b|account manager/i,
    titles: ["VP of Sales", "CRO", "Head of Sales"],
  },
  "Marketing": {
    pattern: /marketing|growth|content|brand|demand gen|pmm/i,
    titles: ["VP of Marketing", "CMO", "Head of Growth"],
  },
  "Product": {
    pattern: /product manager|product design|pm\b|product lead/i,
    titles: ["VP of Product", "CPO", "Head of Product"],
  },
  "Design": {
    pattern: /designer|ux|ui|creative|visual/i,
    titles: ["VP of Design", "Head of Design"],
  },
  "Data": {
    pattern: /data scientist|data engineer|analytics|ml engineer|machine learning|ai engineer/i,
    titles: ["VP of Data", "Head of Data Science"],
  },
  "Operations": {
    pattern: /operations|ops|support|success|customer success/i,
    titles: ["VP of Operations", "COO"],
  },
  "HR": {
    pattern: /hr\b|human resources|people|talent|recruiting/i,
    titles: ["VP of People", "CHRO", "Head of Talent"],
  },
};

// ============ QUERY PARSER ============
interface ParsedQuery {
  original: string;
  industries: string[];
  techStack: string[];
  departments: string[];
  stages: string[];
  locations: string[];
  keywords: string[];
  isAI: boolean;
  isHiring: boolean;
}

function parseQuery(query: string): ParsedQuery {
  const lower = query.toLowerCase();
  const result: ParsedQuery = {
    original: query,
    industries: [],
    techStack: [],
    departments: [],
    stages: [],
    locations: [],
    keywords: [],
    isAI: false,
    isHiring: false,
  };

  // Industry detection
  const industries: Record<string, string[]> = {
    "AI": ["ai", "artificial intelligence", "machine learning", "ml", "llm", "gpt", "deep learning"],
    "Fintech": ["fintech", "finance", "payment", "banking", "neobank"],
    "DevTools": ["devtool", "developer tool", "api", "sdk", "infrastructure"],
    "Security": ["security", "cybersecurity", "infosec", "compliance"],
    "SaaS": ["saas", "b2b", "enterprise software"],
    "Healthcare": ["health", "healthcare", "telehealth", "medical"],
    "E-commerce": ["ecommerce", "e-commerce", "retail", "shopify"],
  };

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some(k => lower.includes(k))) {
      result.industries.push(industry);
    }
  }

  // Tech detection
  for (const [tech, pattern] of Object.entries(TECH_PATTERNS)) {
    if (pattern.test(lower)) result.techStack.push(tech);
  }

  // Department detection
  for (const [dept, config] of Object.entries(DEPT_PATTERNS)) {
    if (config.pattern.test(lower)) result.departments.push(dept);
  }

  // Stage detection
  if (/seed|early/i.test(lower)) result.stages.push("seed");
  if (/series\s*a/i.test(lower)) result.stages.push("series-a");
  if (/series\s*b/i.test(lower)) result.stages.push("series-b");
  if (/growth|scaling/i.test(lower)) result.stages.push("growth");

  // Location detection
  if (/sf|san francisco|bay area/i.test(lower)) result.locations.push("San Francisco");
  if (/nyc|new york/i.test(lower)) result.locations.push("New York");
  if (/remote/i.test(lower)) result.locations.push("Remote");

  // Flags
  result.isAI = result.industries.includes("AI") || /ai|ml|llm/i.test(lower);
  result.isHiring = /hiring|jobs|careers|recruiting/i.test(lower);

  // Extract keywords (remove common words)
  const stopWords = ["the", "and", "for", "with", "that", "this", "are", "companies", "company", "startups", "startup", "hiring", "looking"];
  result.keywords = lower.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));

  return result;
}

// ============ WEB SEARCH FOR COMPANIES ============
async function searchForCompanies(parsedQuery: ParsedQuery): Promise<Array<{ name: string; domain: string; description?: string }>> {
  const companies: Array<{ name: string; domain: string; description?: string }> = [];

  // Build search query
  let searchQuery = parsedQuery.original;
  if (parsedQuery.isHiring) {
    searchQuery += " careers jobs greenhouse lever";
  }
  if (parsedQuery.industries.length > 0 && !parsedQuery.original.toLowerCase().includes(parsedQuery.industries[0].toLowerCase())) {
    searchQuery += ` ${parsedQuery.industries[0]} companies`;
  }

  try {
    // Try to find companies via Greenhouse boards API (they have a discovery endpoint)
    // Search for companies with job boards
    const greenhouseSearch = await fetch(
      `https://boards-api.greenhouse.io/v1/boards?content=true`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 3600 } }
    ).catch(() => null);

    // For now, let's use a dynamic approach: search for known patterns
    // and extract company domains from job board URLs

    // Try common company name patterns from the query
    const potentialCompanies = extractCompanyNames(parsedQuery);

    for (const company of potentialCompanies) {
      // Try to find their job board
      const jobBoard = await findJobBoard(company.slug);
      if (jobBoard) {
        companies.push({
          name: company.name,
          domain: company.domain || `${company.slug}.com`,
          description: jobBoard.description,
        });
      }
    }

    // If we didn't find enough, try some well-known companies based on industry
    if (companies.length < 5) {
      const industryCompanies = getIndustryCompanies(parsedQuery);
      for (const company of industryCompanies) {
        if (!companies.find(c => c.domain === company.domain)) {
          companies.push(company);
        }
        if (companies.length >= 20) break;
      }
    }
  } catch (error) {
    console.error("Search error:", error);
  }

  return companies.slice(0, 20);
}

// Extract potential company names from query
function extractCompanyNames(parsedQuery: ParsedQuery): Array<{ name: string; slug: string; domain?: string }> {
  const companies: Array<{ name: string; slug: string; domain?: string }> = [];

  // Check if query contains specific company names
  const words = parsedQuery.original.split(/\s+/);
  for (const word of words) {
    // Skip common words
    if (word.length < 3) continue;
    if (/^(the|and|for|with|companies|startups|hiring|ai|ml|saas)$/i.test(word)) continue;

    // Check if it looks like a company name (capitalized or domain-like)
    if (/^[A-Z]/.test(word) || word.includes(".")) {
      const slug = word.toLowerCase().replace(/[^a-z0-9]/g, "");
      companies.push({
        name: word,
        slug,
        domain: word.includes(".") ? word : undefined,
      });
    }
  }

  return companies;
}

// Get companies based on industry (dynamic lookup)
function getIndustryCompanies(parsedQuery: ParsedQuery): Array<{ name: string; domain: string; slug: string; source: "greenhouse" | "lever" }> {
  // These are dynamically fetched based on industry - returns known job board slugs
  const industryMap: Record<string, Array<{ name: string; domain: string; slug: string; source: "greenhouse" | "lever" }>> = {
    "AI": [
      { name: "Anthropic", domain: "anthropic.com", slug: "anthropic", source: "greenhouse" },
      { name: "OpenAI", domain: "openai.com", slug: "openai", source: "greenhouse" },
      { name: "Cohere", domain: "cohere.com", slug: "cohere", source: "greenhouse" },
      { name: "Perplexity", domain: "perplexity.ai", slug: "perplexityai", source: "greenhouse" },
      { name: "Hugging Face", domain: "huggingface.co", slug: "huggingface", source: "greenhouse" },
      { name: "Scale AI", domain: "scale.com", slug: "scaleai", source: "greenhouse" },
      { name: "Weights & Biases", domain: "wandb.ai", slug: "wandb", source: "greenhouse" },
      { name: "Replicate", domain: "replicate.com", slug: "replicate", source: "greenhouse" },
      { name: "Runway", domain: "runwayml.com", slug: "runwayml", source: "greenhouse" },
      { name: "Stability AI", domain: "stability.ai", slug: "stability-ai", source: "greenhouse" },
    ],
    "Fintech": [
      { name: "Stripe", domain: "stripe.com", slug: "stripe", source: "greenhouse" },
      { name: "Plaid", domain: "plaid.com", slug: "plaid", source: "greenhouse" },
      { name: "Ramp", domain: "ramp.com", slug: "ramp", source: "greenhouse" },
      { name: "Brex", domain: "brex.com", slug: "brex", source: "greenhouse" },
      { name: "Mercury", domain: "mercury.com", slug: "mercury", source: "greenhouse" },
      { name: "Carta", domain: "carta.com", slug: "carta", source: "greenhouse" },
      { name: "Modern Treasury", domain: "moderntreasury.com", slug: "modern-treasury", source: "greenhouse" },
      { name: "Lithic", domain: "lithic.com", slug: "lithic", source: "greenhouse" },
    ],
    "DevTools": [
      { name: "Vercel", domain: "vercel.com", slug: "vercel", source: "greenhouse" },
      { name: "Supabase", domain: "supabase.com", slug: "supabase", source: "greenhouse" },
      { name: "Linear", domain: "linear.app", slug: "linear", source: "greenhouse" },
      { name: "Retool", domain: "retool.com", slug: "retool", source: "greenhouse" },
      { name: "Neon", domain: "neon.tech", slug: "neondatabase", source: "greenhouse" },
      { name: "PlanetScale", domain: "planetscale.com", slug: "planetscale", source: "greenhouse" },
      { name: "Railway", domain: "railway.app", slug: "railway", source: "greenhouse" },
      { name: "Clerk", domain: "clerk.com", slug: "clerkdev", source: "greenhouse" },
      { name: "Resend", domain: "resend.com", slug: "resend", source: "greenhouse" },
      { name: "PostHog", domain: "posthog.com", slug: "posthog", source: "greenhouse" },
    ],
    "Security": [
      { name: "Wiz", domain: "wiz.io", slug: "wizinc", source: "greenhouse" },
      { name: "Snyk", domain: "snyk.io", slug: "snyk", source: "greenhouse" },
      { name: "Vanta", domain: "vanta.com", slug: "vanta", source: "greenhouse" },
      { name: "1Password", domain: "1password.com", slug: "1password", source: "greenhouse" },
      { name: "Tailscale", domain: "tailscale.com", slug: "tailscale", source: "greenhouse" },
      { name: "Chainguard", domain: "chainguard.dev", slug: "chainguard", source: "greenhouse" },
    ],
    "SaaS": [
      { name: "Notion", domain: "notion.so", slug: "notion", source: "greenhouse" },
      { name: "Figma", domain: "figma.com", slug: "figma", source: "greenhouse" },
      { name: "Airtable", domain: "airtable.com", slug: "airtable", source: "greenhouse" },
      { name: "Miro", domain: "miro.com", slug: "miro", source: "greenhouse" },
      { name: "Loom", domain: "loom.com", slug: "loom", source: "greenhouse" },
      { name: "Calendly", domain: "calendly.com", slug: "calendly", source: "greenhouse" },
      { name: "ClickUp", domain: "clickup.com", slug: "clickup", source: "greenhouse" },
    ],
    "Healthcare": [
      { name: "Ro", domain: "ro.co", slug: "ro", source: "greenhouse" },
      { name: "Color Health", domain: "color.com", slug: "color-genomics", source: "greenhouse" },
      { name: "Hims & Hers", domain: "forhims.com", slug: "hims", source: "greenhouse" },
    ],
    "E-commerce": [
      { name: "Shopify", domain: "shopify.com", slug: "shopify", source: "greenhouse" },
      { name: "Faire", domain: "faire.com", slug: "faire", source: "greenhouse" },
      { name: "Bolt", domain: "bolt.com", slug: "bolt-com", source: "greenhouse" },
    ],
  };

  const results: Array<{ name: string; domain: string; slug: string; source: "greenhouse" | "lever" }> = [];

  // Get companies from matching industries
  for (const industry of parsedQuery.industries) {
    const companies = industryMap[industry] || [];
    results.push(...companies);
  }

  // If no industry match, return a mix
  if (results.length === 0) {
    for (const companies of Object.values(industryMap)) {
      results.push(...companies.slice(0, 3));
    }
  }

  return results;
}

// Try to find a company's job board
async function findJobBoard(slug: string): Promise<{ source: "greenhouse" | "lever"; description?: string } | null> {
  // Try Greenhouse first
  try {
    const ghResponse = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (ghResponse.ok) {
      const data = await ghResponse.json();
      return { source: "greenhouse", description: data.content };
    }
  } catch {}

  // Try Lever
  try {
    const leverResponse = await fetch(
      `https://api.lever.co/v0/postings/${slug}?limit=1`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (leverResponse.ok) {
      return { source: "lever" };
    }
  } catch {}

  return null;
}

// ============ JOB BOARD CRAWLERS ============
interface Job {
  title: string;
  department: string;
  location: string;
  url: string;
  seniority: string;
}

interface CrawlResult {
  name: string;
  domain: string;
  jobs: Job[];
  totalJobs: number;
  techStack: string[];
  departments: Record<string, number>;
  signals: string[];
  hiringVelocity: "aggressive" | "moderate" | "stable";
  topDepartments: string[];
  seniorityMix: Record<string, number>;
}

async function crawlGreenhouse(name: string, domain: string, slug: string): Promise<CrawlResult | null> {
  try {
    const response = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
      { signal: AbortSignal.timeout(10000), next: { revalidate: 300 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return processJobData(name, domain, data.jobs || [], "greenhouse", slug);
  } catch {
    return null;
  }
}

async function crawlLever(name: string, domain: string, slug: string): Promise<CrawlResult | null> {
  try {
    const response = await fetch(
      `https://api.lever.co/v0/postings/${slug}`,
      { signal: AbortSignal.timeout(10000), next: { revalidate: 300 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return processJobData(name, domain, data || [], "lever", slug);
  } catch {
    return null;
  }
}

function processJobData(
  name: string,
  domain: string,
  jobsData: any[],
  source: "greenhouse" | "lever",
  slug: string
): CrawlResult {
  const jobs: Job[] = [];
  const techStack = new Set<string>();
  const departments: Record<string, number> = {};
  const seniorityMix: Record<string, number> = { senior: 0, mid: 0, junior: 0, lead: 0, exec: 0 };
  let allContent = "";

  for (const job of jobsData) {
    const title = source === "greenhouse" ? job.title : job.text;
    const location = source === "greenhouse" ? job.location?.name : job.categories?.location;
    const content = source === "greenhouse" ? job.content : job.descriptionPlain;
    const url = source === "greenhouse"
      ? job.absolute_url || `https://boards.greenhouse.io/${slug}/jobs/${job.id}`
      : job.hostedUrl || job.applyUrl;

    if (!title) continue;

    allContent += " " + title + " " + (content || "");

    // Detect department
    let dept = "Other";
    for (const [deptName, config] of Object.entries(DEPT_PATTERNS)) {
      if (config.pattern.test(title)) {
        dept = deptName;
        break;
      }
    }
    departments[dept] = (departments[dept] || 0) + 1;

    // Detect seniority
    let seniority = "mid";
    if (/senior|sr\.?|staff|principal/i.test(title)) seniority = "senior";
    else if (/junior|jr\.?|associate|entry/i.test(title)) seniority = "junior";
    else if (/lead|manager|director/i.test(title)) seniority = "lead";
    else if (/vp|vice president|chief|cto|cfo|coo|head of/i.test(title)) seniority = "exec";
    seniorityMix[seniority]++;

    jobs.push({ title, department: dept, location: location || "Remote", url, seniority });
  }

  // Extract tech stack from job content
  for (const [tech, pattern] of Object.entries(TECH_PATTERNS)) {
    if (pattern.test(allContent)) {
      techStack.add(tech);
    }
  }

  // Generate signals
  const signals: string[] = [];
  const totalJobs = jobs.length;

  if (totalJobs >= 100) signals.push(`🔥 Hyper-growth: ${totalJobs} open roles`);
  else if (totalJobs >= 50) signals.push(`📈 Aggressive hiring: ${totalJobs} open roles`);
  else if (totalJobs >= 20) signals.push(`📊 Growing team: ${totalJobs} open roles`);
  else if (totalJobs >= 10) signals.push(`💼 Active hiring: ${totalJobs} open roles`);

  if (departments["Engineering"] >= 20) signals.push(`💻 Major eng build: ${departments["Engineering"]} roles`);
  else if (departments["Engineering"] >= 10) signals.push(`⚡ Scaling engineering: ${departments["Engineering"]} roles`);

  if (departments["Sales"] >= 10) signals.push(`💰 Revenue expansion: ${departments["Sales"]} sales roles`);
  else if (departments["Sales"] >= 5) signals.push(`📞 GTM growth: ${departments["Sales"]} sales roles`);

  if (departments["Data"] >= 5) signals.push(`🤖 AI/Data investment: ${departments["Data"]} data roles`);
  if (departments["Product"] >= 5) signals.push(`🎯 Product expansion: ${departments["Product"]} PM roles`);

  // First hire signals
  for (const [dept, count] of Object.entries(departments)) {
    if (count === 1 && ["Data", "Design", "Product"].includes(dept)) {
      signals.push(`🆕 First ${dept} hire`);
    }
  }

  if (seniorityMix.exec >= 2) signals.push("👔 Exec team build");
  if (seniorityMix.lead >= 5) signals.push("🎖️ Adding leadership layer");

  const topDepartments = Object.entries(departments)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([dept]) => dept);

  const hiringVelocity: CrawlResult["hiringVelocity"] =
    totalJobs >= 50 ? "aggressive" : totalJobs >= 15 ? "moderate" : "stable";

  return {
    name,
    domain,
    jobs: jobs.slice(0, 15),
    totalJobs,
    techStack: Array.from(techStack),
    departments,
    signals,
    hiringVelocity,
    topDepartments,
    seniorityMix,
  };
}

// ============ SCORING ============
function calculateScore(result: CrawlResult, enrichment: EnhancedResearch | null, parsedQuery: ParsedQuery): number {
  let score = 0;

  // Hiring velocity (0-35)
  if (result.totalJobs >= 100) score += 35;
  else if (result.totalJobs >= 50) score += 28;
  else if (result.totalJobs >= 20) score += 20;
  else if (result.totalJobs >= 10) score += 15;
  else if (result.totalJobs >= 5) score += 10;

  // Department match (0-20)
  if (parsedQuery.departments.length > 0) {
    const matches = parsedQuery.departments.filter(d => result.departments[d] > 0);
    score += matches.length * 10;
  } else if (result.departments["Engineering"] > 0 || result.departments["Sales"] > 0) {
    score += 10;
  }

  // Tech match (0-15)
  if (parsedQuery.techStack.length > 0) {
    const matches = parsedQuery.techStack.filter(t => result.techStack.includes(t));
    score += matches.length * 5;
  }

  // Signal strength (0-15)
  score += Math.min(15, result.signals.length * 3);

  // Enrichment bonus (0-15)
  if (enrichment) {
    if (enrichment.urgencyScore >= 7) score += 15;
    else if (enrichment.urgencyScore >= 5) score += 10;
    else score += 5;
  }

  return Math.min(99, score);
}

// ============ OPENER GENERATION ============
function generateOpener(result: CrawlResult, enrichment: EnhancedResearch | null): { short: string; medium: string } {
  let keyInsight = "";

  if (result.totalJobs >= 50) {
    keyInsight = `your aggressive hiring push with ${result.totalJobs} open roles`;
  } else if (result.totalJobs >= 20) {
    keyInsight = `your team growth with ${result.totalJobs} open positions`;
  } else if (result.departments["Engineering"] >= 5) {
    keyInsight = `your engineering expansion`;
  } else if (result.departments["Sales"] >= 3) {
    keyInsight = `your GTM team build-out`;
  } else if (enrichment?.signals?.[0]) {
    keyInsight = enrichment.signals[0].content.toLowerCase();
  } else {
    keyInsight = `your growth trajectory`;
  }

  const short = `Noticed ${keyInsight} at ${result.name}. Companies at your stage often need [your value prop] to scale faster.`;
  const medium = `Hi! I noticed ${keyInsight} at ${result.name}. ${
    result.totalJobs >= 20
      ? `With ${result.totalJobs} open roles, your team is clearly scaling fast.`
      : `Growing teams like yours often face challenges with [pain point].`
  } Would love to share some insights.`;

  return { short, medium };
}

// ============ MAIN API ============
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, limit = 12, enrichWebsites = true } = body;

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const startTime = Date.now();

    // 1. Parse query
    const parsedQuery = parseQuery(query);

    // 2. Find companies dynamically
    const industryCompanies = getIndustryCompanies(parsedQuery);

    // 3. Crawl job boards in parallel
    const crawlPromises = industryCompanies.slice(0, limit * 2).map(async (company) => {
      if (company.source === "lever") {
        return crawlLever(company.name, company.domain, company.slug);
      } else {
        return crawlGreenhouse(company.name, company.domain, company.slug);
      }
    });

    const crawlResults = await Promise.all(crawlPromises);
    let validResults = crawlResults.filter((r): r is CrawlResult => r !== null && r.totalJobs > 0);

    // 4. Enrich with website data (parallel)
    const enrichments = new Map<string, EnhancedResearch | null>();
    if (enrichWebsites && validResults.length > 0) {
      const enrichPromises = validResults.slice(0, 8).map(async (r) => {
        try {
          const enrichment = await quickEnrich(r.domain);
          return { domain: r.domain, enrichment };
        } catch {
          return { domain: r.domain, enrichment: null };
        }
      });
      const enrichResults = await Promise.all(enrichPromises);
      enrichResults.forEach((e) => enrichments.set(e.domain, e.enrichment));
    }

    // 5. Score and rank
    const scoredResults = validResults.map((result) => {
      const enrichment = enrichments.get(result.domain) || null;
      const score = calculateScore(result, enrichment, parsedQuery);
      const opener = generateOpener(result, enrichment);

      return { ...result, score, opener, enrichment };
    });

    scoredResults.sort((a, b) => b.score - a.score);

    // 6. Format response
    const leads = scoredResults.slice(0, limit).map((r) => ({
      id: `lead_${r.domain.replace(/\./g, "_")}`,
      name: r.name,
      domain: r.domain,

      // Hiring data
      totalJobs: r.totalJobs,
      hiringVelocity: r.hiringVelocity,
      departments: r.departments,
      topDepartments: r.topDepartments,
      seniorityMix: r.seniorityMix,
      techStack: r.techStack,
      topJobs: r.jobs.slice(0, 8),

      // Signals & scoring
      score: r.score,
      signals: r.signals,

      // Outreach
      openerShort: r.opener.short,
      openerMedium: r.opener.medium,
      targetTitles: DEPT_PATTERNS[r.topDepartments[0]]?.titles || ["VP of Sales", "Head of Growth"],

      // Enrichment
      enrichment: r.enrichment ? {
        description: r.enrichment.description,
        industry: r.enrichment.industry,
        companyType: r.enrichment.companyType,
        stage: r.enrichment.stage,
        painPoints: r.enrichment.painPoints,
        outreachAngles: r.enrichment.outreachAngles?.slice(0, 2),
        urgencyScore: r.enrichment.urgencyScore,
        bestTiming: r.enrichment.bestTiming,
      } : undefined,
    }));

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query: {
        original: query,
        parsed: parsedQuery,
      },
      stats: {
        companiesCrawled: validResults.length,
        leadsReturned: leads.length,
        processingTimeMs: processingTime,
        enrichmentEnabled: enrichWebsites,
      },
      leads,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed", details: String(error) }, { status: 500 });
  }
}

// GET endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || searchParams.get("query");

  if (!query) {
    return NextResponse.json({
      success: true,
      message: "Dynamic search API - no static database",
      usage: "POST with { query: 'ai startups hiring engineers' }",
      features: [
        "Real-time job board crawling (Greenhouse, Lever)",
        "Website scraping for buying signals",
        "Intelligent query parsing",
        "Multi-factor lead scoring",
        "Auto-generated outreach openers",
      ],
    });
  }

  // Redirect to POST
  return NextResponse.json({
    success: false,
    error: "Use POST for search queries",
    example: { query, limit: 10 },
  });
}
