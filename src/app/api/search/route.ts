/**
 * ELITE Search API - Industry-leading lead intelligence
 * Features:
 * - Intelligent NLP query parsing with synonym expansion
 * - Live job board crawling (Greenhouse, Lever)
 * - Real-time website scraping for buying signals
 * - Advanced multi-factor scoring algorithm
 * - Intent-based result ranking
 */

import { NextResponse } from "next/server";
import { COMPANIES, Company, searchCompanies, getRandomCompanies, getHotCompanies, COMPANY_COUNT } from "@/lib/data/companies";
import { quickEnrich, type EnhancedResearch } from "@/lib/firecrawl";

// ============ COMPREHENSIVE TECH PATTERNS ============
const TECH_PATTERNS: Record<string, RegExp> = {
  // Frontend
  "React": /\breact\b/i,
  "Next.js": /\bnext\.?js\b/i,
  "Vue": /\bvue\.?js?\b/i,
  "Angular": /\bangular\b/i,
  "Svelte": /\bsvelte\b/i,
  "TypeScript": /\btypescript\b|\bts\b/i,
  "TailwindCSS": /\btailwind/i,

  // Backend
  "Node.js": /\bnode\.?js\b/i,
  "Python": /\bpython\b/i,
  "Go": /\bgolang\b|\bgo\s+(programming|developer|engineer)/i,
  "Rust": /\brust\b/i,
  "Java": /\bjava\b(?!script)/i,
  "Kotlin": /\bkotlin\b/i,
  "Ruby": /\bruby\b/i,
  "Rails": /\brails\b/i,
  "Django": /\bdjango\b/i,
  "FastAPI": /\bfastapi\b/i,
  "C++": /\bc\+\+\b/i,
  "Scala": /\bscala\b/i,
  "Elixir": /\belixir\b/i,

  // Infrastructure
  "Kubernetes": /\bkubernetes\b|\bk8s\b/i,
  "Docker": /\bdocker\b/i,
  "AWS": /\baws\b|\bamazon web services\b/i,
  "GCP": /\bgcp\b|\bgoogle cloud\b/i,
  "Azure": /\bazure\b/i,
  "Terraform": /\bterraform\b/i,

  // Data
  "PostgreSQL": /\bpostgres(ql)?\b/i,
  "MongoDB": /\bmongodb\b/i,
  "Redis": /\bredis\b/i,
  "GraphQL": /\bgraphql\b/i,
  "Elasticsearch": /\belasticsearch\b|\belastic\b/i,
  "Kafka": /\bkafka\b/i,
  "Snowflake": /\bsnowflake\b/i,
  "BigQuery": /\bbigquery\b/i,
  "dbt": /\bdbt\b/i,

  // AI/ML
  "PyTorch": /\bpytorch\b/i,
  "TensorFlow": /\btensorflow\b/i,
  "OpenAI": /\bopenai\b/i,
  "LangChain": /\blangchain\b/i,
  "Hugging Face": /\bhugging\s*face\b/i,

  // Mobile
  "Swift": /\bswift\b/i,
  "React Native": /\breact\s*native\b/i,
  "Flutter": /\bflutter\b/i,
};

// ============ DEPARTMENT INTELLIGENCE ============
const DEPT_PATTERNS: Record<string, { pattern: RegExp; titles: string[]; signals: string[] }> = {
  "Engineering": {
    pattern: /engineer|developer|software|backend|frontend|fullstack|sre|devops|platform|architect/i,
    titles: ["VP of Engineering", "CTO", "Engineering Manager", "Staff Engineer"],
    signals: ["Scaling engineering team", "Technical investment"],
  },
  "Sales": {
    pattern: /sales|account executive|sdr|bdr|revenue|ae\b|account manager/i,
    titles: ["VP of Sales", "CRO", "Head of Sales", "Sales Director"],
    signals: ["Revenue growth focus", "GTM expansion"],
  },
  "Marketing": {
    pattern: /marketing|growth|content|brand|demand gen|pmm|product marketing/i,
    titles: ["VP of Marketing", "CMO", "Head of Growth", "Marketing Director"],
    signals: ["Brand investment", "Growth acceleration"],
  },
  "Product": {
    pattern: /product manager|product design|pm\b|product lead|product director/i,
    titles: ["VP of Product", "CPO", "Head of Product", "Product Director"],
    signals: ["Product expansion", "New product initiatives"],
  },
  "Design": {
    pattern: /designer|ux|ui|creative|visual|brand design/i,
    titles: ["VP of Design", "Head of Design", "Design Director"],
    signals: ["Design investment", "UX focus"],
  },
  "Data": {
    pattern: /data scientist|data engineer|analytics|ml engineer|machine learning|ai engineer/i,
    titles: ["VP of Data", "Head of Data Science", "Chief Data Officer"],
    signals: ["AI/ML investment", "Data infrastructure build"],
  },
  "Operations": {
    pattern: /operations|ops|support|success|customer success/i,
    titles: ["VP of Operations", "COO", "Head of Customer Success"],
    signals: ["Operational scaling", "Customer focus"],
  },
  "Finance": {
    pattern: /finance|accounting|controller|fp&a|financial/i,
    titles: ["CFO", "VP of Finance", "Controller"],
    signals: ["Financial operations scaling"],
  },
  "HR": {
    pattern: /hr\b|human resources|people|talent|recruiting|recruiter/i,
    titles: ["VP of People", "CHRO", "Head of Talent"],
    signals: ["Team scaling", "Culture investment"],
  },
};

// ============ ADVANCED QUERY PARSER ============
interface ParsedQuery {
  originalQuery: string;
  techStack: string[];
  departments: string[];
  industries: string[];
  stages: string[];
  locations: string[];
  companyTypes: string[];
  intentSignals: string[];
  keywords: string[];
  isHotLeads: boolean;
  isAIFocused: boolean;
  isGrowthStage: boolean;
}

function parseQuery(query: string): ParsedQuery {
  const lower = query.toLowerCase().trim();
  const result: ParsedQuery = {
    originalQuery: query,
    techStack: [],
    departments: [],
    industries: [],
    stages: [],
    locations: [],
    companyTypes: [],
    intentSignals: [],
    keywords: [],
    isHotLeads: false,
    isAIFocused: false,
    isGrowthStage: false,
  };

  // Extract tech stack
  for (const [tech, pattern] of Object.entries(TECH_PATTERNS)) {
    if (pattern.test(lower)) {
      result.techStack.push(tech);
    }
  }

  // Extract departments
  for (const [dept, config] of Object.entries(DEPT_PATTERNS)) {
    if (config.pattern.test(lower)) {
      result.departments.push(dept);
    }
  }

  // Industry detection (expanded)
  const industryMatches: Record<string, string[]> = {
    "AI": ["ai", "artificial intelligence", "machine learning", "ml", "llm", "gpt", "deep learning", "neural", "generative"],
    "Fintech": ["fintech", "finance", "payment", "banking", "neobank", "insurtech", "lending", "credit", "debit"],
    "Developer Tools": ["devtool", "developer tool", "api", "sdk", "infrastructure", "platform", "developer experience"],
    "Security": ["security", "cybersecurity", "infosec", "devsecops", "compliance", "identity", "zero trust"],
    "Data": ["data", "analytics", "etl", "warehouse", "pipeline", "observability", "monitoring"],
    "Productivity": ["productivity", "collaboration", "docs", "notes", "project management", "workflow"],
    "Sales": ["sales tech", "revenue", "crm", "sales engagement", "prospecting"],
    "Marketing": ["martech", "marketing tech", "email marketing", "automation"],
    "HR Tech": ["hr tech", "hris", "payroll", "recruiting", "talent", "people ops"],
    "Healthcare": ["health", "healthcare", "telehealth", "medical", "biotech"],
    "E-commerce": ["ecommerce", "e-commerce", "retail", "shopify", "commerce"],
    "Crypto": ["crypto", "web3", "blockchain", "defi", "nft"],
  };

  for (const [industry, keywords] of Object.entries(industryMatches)) {
    if (keywords.some(k => lower.includes(k))) {
      result.industries.push(industry);
    }
  }

  // Stage detection
  if (/seed|pre-seed|early.?stage/i.test(lower)) result.stages.push("Seed");
  if (/series\s*a\b/i.test(lower)) result.stages.push("Series A");
  if (/series\s*b\b/i.test(lower)) result.stages.push("Series B");
  if (/series\s*c\b/i.test(lower)) result.stages.push("Series C");
  if (/growth|scaling|hypergrowth/i.test(lower)) {
    result.stages.push("Series B", "Series C", "Series D");
    result.isGrowthStage = true;
  }
  if (/enterprise|large|public|late.?stage/i.test(lower)) result.stages.push("Public", "Late Stage");
  if (/startup/i.test(lower)) result.stages.push("Seed", "Series A", "Series B");

  // Location detection
  const locationMatches: Record<string, string[]> = {
    "San Francisco": ["sf", "san francisco", "bay area", "silicon valley"],
    "New York": ["nyc", "new york", "manhattan"],
    "Remote": ["remote", "distributed", "fully remote"],
    "Europe": ["europe", "eu", "london", "berlin", "paris"],
    "Tel Aviv": ["israel", "tel aviv"],
  };

  for (const [location, keywords] of Object.entries(locationMatches)) {
    if (keywords.some(k => lower.includes(k))) {
      result.locations.push(location);
    }
  }

  // Intent signals (what makes a good lead)
  if (/hiring|recruiting|growing|scaling|expanding/i.test(lower)) {
    result.intentSignals.push("Active Hiring");
  }
  if (/funding|raised|series|venture|backed/i.test(lower)) {
    result.intentSignals.push("Recently Funded");
  }
  if (/hot|trending|fast.?growing|high.?growth/i.test(lower)) {
    result.isHotLeads = true;
  }
  if (/ai|machine learning|llm|gpt/i.test(lower)) {
    result.isAIFocused = true;
  }

  // Extract remaining keywords
  const allMatchedWords = [
    ...result.techStack,
    ...result.departments,
    ...result.industries,
    ...result.stages,
    ...result.locations,
  ].map(w => w.toLowerCase());

  const words = lower.split(/\s+/).filter(w =>
    w.length > 2 &&
    !["the", "and", "for", "with", "that", "this", "are", "was", "were", "companies", "company", "startup", "startups"].includes(w) &&
    !allMatchedWords.some(m => m.includes(w))
  );
  result.keywords = words;

  return result;
}

// ============ JOB BOARD CRAWLERS ============
interface Job {
  title: string;
  department: string;
  location: string;
  url: string;
  seniority?: string;
}

interface CrawlResult {
  company: Company;
  jobs: Job[];
  totalJobs: number;
  techStack: string[];
  departments: Record<string, number>;
  signals: string[];
  hiringVelocity: "aggressive" | "moderate" | "stable";
  topDepartments: string[];
  seniorityMix: Record<string, number>;
}

async function crawlGreenhouse(company: Company): Promise<CrawlResult | null> {
  try {
    const response = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs`,
      {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const jobs: Job[] = [];
    const techStack = new Set<string>();
    const departments: Record<string, number> = {};
    const seniorityMix: Record<string, number> = { senior: 0, mid: 0, junior: 0, lead: 0, exec: 0 };
    let allContent = "";

    for (const job of data.jobs || []) {
      const title = job.title || "";
      const location = job.location?.name || "Remote";
      const content = job.content || "";
      allContent += " " + title + " " + content;

      // Detect department
      let dept = "Other";
      for (const [name, config] of Object.entries(DEPT_PATTERNS)) {
        if (config.pattern.test(title)) {
          dept = name;
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

      jobs.push({
        title,
        department: dept,
        location,
        url: job.absolute_url || `https://boards.greenhouse.io/${company.slug}/jobs/${job.id}`,
        seniority,
      });
    }

    // Extract tech stack
    for (const [tech, pattern] of Object.entries(TECH_PATTERNS)) {
      if (pattern.test(allContent)) {
        techStack.add(tech);
      }
    }

    // Generate intelligent signals
    const signals: string[] = [];
    const totalJobs = jobs.length;

    // Hiring velocity signals
    if (totalJobs >= 100) signals.push(`🔥 Hyper-growth: ${totalJobs} open roles`);
    else if (totalJobs >= 50) signals.push(`📈 Aggressive hiring: ${totalJobs} open roles`);
    else if (totalJobs >= 20) signals.push(`📊 Growing team: ${totalJobs} open roles`);

    // Department-specific signals
    if (departments["Engineering"] >= 20) signals.push(`💻 Major eng build: ${departments["Engineering"]} roles`);
    else if (departments["Engineering"] >= 10) signals.push(`⚡ Scaling engineering: ${departments["Engineering"]} roles`);

    if (departments["Sales"] >= 10) signals.push(`💰 Revenue expansion: ${departments["Sales"]} sales roles`);
    else if (departments["Sales"] >= 5) signals.push(`📞 GTM growth: ${departments["Sales"]} sales roles`);

    if (departments["Data"] >= 5) signals.push(`🤖 AI/Data investment: ${departments["Data"]} data roles`);
    if (departments["Product"] >= 5) signals.push(`🎯 Product expansion: ${departments["Product"]} PM roles`);
    if (departments["Marketing"] >= 5) signals.push(`📣 Marketing push: ${departments["Marketing"]} roles`);

    // First hire signals (high value)
    const firstHireSignals: Record<string, string> = {
      "Data": "🆕 First Data hire",
      "Design": "🆕 First Design hire",
      "Product": "🆕 First Product hire",
      "HR": "🆕 Building People team",
    };
    for (const [dept, signal] of Object.entries(firstHireSignals)) {
      if (departments[dept] === 1) signals.push(signal);
    }

    // Leadership signals
    if (seniorityMix.exec >= 2) signals.push("👔 Exec team build");
    if (seniorityMix.lead >= 5) signals.push("🎖️ Adding leadership layer");

    // Top departments
    const topDepartments = Object.entries(departments)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dept]) => dept);

    const hiringVelocity: CrawlResult["hiringVelocity"] =
      totalJobs >= 50 ? "aggressive" : totalJobs >= 15 ? "moderate" : "stable";

    return {
      company,
      jobs: jobs.slice(0, 15),
      totalJobs,
      techStack: Array.from(techStack),
      departments,
      signals,
      hiringVelocity,
      topDepartments,
      seniorityMix,
    };
  } catch {
    return null;
  }
}

async function crawlLever(company: Company): Promise<CrawlResult | null> {
  try {
    const response = await fetch(
      `https://api.lever.co/v0/postings/${company.slug}`,
      {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const jobs: Job[] = [];
    const techStack = new Set<string>();
    const departments: Record<string, number> = {};
    const seniorityMix: Record<string, number> = { senior: 0, mid: 0, junior: 0, lead: 0, exec: 0 };
    let allContent = "";

    for (const job of data || []) {
      const title = job.text || "";
      const location = job.categories?.location || "Remote";
      const content = job.descriptionPlain || "";
      allContent += " " + title + " " + content;

      let dept = "Other";
      for (const [name, config] of Object.entries(DEPT_PATTERNS)) {
        if (config.pattern.test(title)) {
          dept = name;
          break;
        }
      }
      departments[dept] = (departments[dept] || 0) + 1;

      let seniority = "mid";
      if (/senior|sr\.?|staff|principal/i.test(title)) seniority = "senior";
      else if (/junior|jr\.?|associate|entry/i.test(title)) seniority = "junior";
      else if (/lead|manager|director/i.test(title)) seniority = "lead";
      else if (/vp|vice president|chief|cto|cfo|coo|head of/i.test(title)) seniority = "exec";
      seniorityMix[seniority]++;

      jobs.push({
        title,
        department: dept,
        location,
        url: job.hostedUrl || job.applyUrl || "",
        seniority,
      });
    }

    for (const [tech, pattern] of Object.entries(TECH_PATTERNS)) {
      if (pattern.test(allContent)) {
        techStack.add(tech);
      }
    }

    const signals: string[] = [];
    const totalJobs = jobs.length;

    if (totalJobs >= 50) signals.push(`📈 Aggressive hiring: ${totalJobs} roles`);
    else if (totalJobs >= 20) signals.push(`📊 Growing team: ${totalJobs} roles`);

    if (departments["Engineering"] >= 10) signals.push(`⚡ Scaling eng: ${departments["Engineering"]} roles`);
    if (departments["Sales"] >= 5) signals.push(`💰 GTM growth: ${departments["Sales"]} roles`);

    const topDepartments = Object.entries(departments)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dept]) => dept);

    const hiringVelocity: CrawlResult["hiringVelocity"] =
      totalJobs >= 50 ? "aggressive" : totalJobs >= 15 ? "moderate" : "stable";

    return {
      company,
      jobs: jobs.slice(0, 15),
      totalJobs,
      techStack: Array.from(techStack),
      departments,
      signals,
      hiringVelocity,
      topDepartments,
      seniorityMix,
    };
  } catch {
    return null;
  }
}

// ============ ADVANCED SCORING ALGORITHM ============
interface ScoringFactors {
  hiringVelocity: number;      // 0-30 points
  fundingRecency: number;      // 0-20 points
  departmentMatch: number;     // 0-15 points
  techMatch: number;           // 0-15 points
  companyStage: number;        // 0-10 points
  signalStrength: number;      // 0-10 points
}

function calculateScore(
  result: CrawlResult,
  enrichment: EnhancedResearch | null,
  parsedQuery: ParsedQuery
): { score: number; factors: ScoringFactors; breakdown: string[] } {
  const factors: ScoringFactors = {
    hiringVelocity: 0,
    fundingRecency: 0,
    departmentMatch: 0,
    techMatch: 0,
    companyStage: 0,
    signalStrength: 0,
  };
  const breakdown: string[] = [];

  // 1. Hiring Velocity (0-30)
  if (result.totalJobs >= 100) {
    factors.hiringVelocity = 30;
    breakdown.push("+30 Hyper-growth (100+ jobs)");
  } else if (result.totalJobs >= 50) {
    factors.hiringVelocity = 25;
    breakdown.push("+25 Aggressive hiring (50+ jobs)");
  } else if (result.totalJobs >= 20) {
    factors.hiringVelocity = 18;
    breakdown.push("+18 Strong hiring (20+ jobs)");
  } else if (result.totalJobs >= 10) {
    factors.hiringVelocity = 12;
    breakdown.push("+12 Active hiring (10+ jobs)");
  } else if (result.totalJobs >= 5) {
    factors.hiringVelocity = 8;
    breakdown.push("+8 Moderate hiring (5+ jobs)");
  }

  // 2. Funding Recency (0-20)
  if (result.company.lastFunding === "2024") {
    factors.fundingRecency = 20;
    breakdown.push("+20 Recent funding (2024)");
  } else if (result.company.stage?.includes("Series")) {
    factors.fundingRecency = 12;
    breakdown.push("+12 VC-backed");
  }

  // 3. Department Match (0-15)
  if (parsedQuery.departments.length > 0) {
    const matchingDepts = parsedQuery.departments.filter(d => result.departments[d] > 0);
    if (matchingDepts.length > 0) {
      factors.departmentMatch = Math.min(15, matchingDepts.length * 8);
      breakdown.push(`+${factors.departmentMatch} Department match (${matchingDepts.join(", ")})`);
    }
  } else {
    // Default: boost if hiring in key revenue departments
    if (result.departments["Sales"] > 0 || result.departments["Engineering"] > 0) {
      factors.departmentMatch = 8;
    }
  }

  // 4. Tech Match (0-15)
  if (parsedQuery.techStack.length > 0) {
    const matchingTech = parsedQuery.techStack.filter(t =>
      result.techStack.some(rt => rt.toLowerCase().includes(t.toLowerCase()))
    );
    if (matchingTech.length > 0) {
      factors.techMatch = Math.min(15, matchingTech.length * 5);
      breakdown.push(`+${factors.techMatch} Tech match (${matchingTech.join(", ")})`);
    }
  } else {
    // Default: boost modern tech stacks
    const modernTech = ["TypeScript", "React", "Python", "Kubernetes", "AWS"];
    const hasModernTech = modernTech.some(t => result.techStack.includes(t));
    if (hasModernTech) factors.techMatch = 5;
  }

  // 5. Company Stage (0-10)
  const stage = result.company.stage?.toLowerCase() || "";
  if (parsedQuery.isGrowthStage && (stage.includes("series b") || stage.includes("series c") || stage.includes("series d"))) {
    factors.companyStage = 10;
    breakdown.push("+10 Growth stage match");
  } else if (stage.includes("series a") || stage.includes("series b")) {
    factors.companyStage = 8;
  } else if (stage.includes("series c") || stage.includes("series d")) {
    factors.companyStage = 6;
  }

  // 6. Signal Strength (0-10)
  factors.signalStrength = Math.min(10, result.signals.length * 2);
  if (factors.signalStrength > 0) {
    breakdown.push(`+${factors.signalStrength} Strong signals (${result.signals.length})`);
  }

  // Calculate total
  const score = Math.min(99, Math.round(
    factors.hiringVelocity +
    factors.fundingRecency +
    factors.departmentMatch +
    factors.techMatch +
    factors.companyStage +
    factors.signalStrength
  ));

  return { score, factors, breakdown };
}

// ============ GENERATE PERSONALIZED OPENERS ============
function generateOpener(result: CrawlResult, enrichment: EnhancedResearch | null): { short: string; medium: string } {
  const companyName = result.company.name;

  // Extract key insight
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

  const short = `Noticed ${keyInsight} at ${companyName}. Companies at your stage often need [your value prop] to scale faster.`;

  const medium = `Hi! I noticed ${keyInsight} at ${companyName}. ${
    result.totalJobs >= 20
      ? `With ${result.totalJobs} open roles, your team is clearly scaling fast.`
      : `Growing teams like yours often face challenges with [pain point].`
  } We've helped similar companies in ${result.company.industry} solve this. Would love to share some insights.`;

  return { short, medium };
}

// ============ MAIN API HANDLER ============
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, limit = 12, enrichWebsites = false, hotLeadsOnly = false } = body;

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const startTime = Date.now();

    // Parse the query with NLP
    const parsedQuery = parseQuery(query);

    // Find matching companies
    let companies: Company[] = [];

    if (hotLeadsOnly || parsedQuery.isHotLeads) {
      companies = getHotCompanies(limit * 2);
    } else if (parsedQuery.industries.length > 0 || parsedQuery.techStack.length > 0 || parsedQuery.keywords.length > 0) {
      // Use intelligent search
      companies = searchCompanies(query, { limit: limit * 2 });
    } else {
      // Fallback to random quality companies
      companies = getRandomCompanies(limit * 2);
    }

    // Filter by AI focus if needed
    if (parsedQuery.isAIFocused) {
      const aiCompanies = COMPANIES.filter(c =>
        c.industry === "AI" || c.subIndustry?.includes("AI") || c.subIndustry?.includes("ML")
      );
      companies = [...aiCompanies, ...companies].slice(0, limit * 2);
    }

    // Limit before crawling
    companies = companies.slice(0, Math.min(limit * 2, 24));

    // Crawl job boards in parallel
    const crawlPromises = companies.map(c =>
      c.source === "lever" ? crawlLever(c) : crawlGreenhouse(c)
    );
    const crawlResults = await Promise.all(crawlPromises);

    // Filter out failed crawls
    let validResults = crawlResults.filter((r): r is CrawlResult => r !== null && r.totalJobs > 0);

    // Optional: Enrich with website data (slower but more signals)
    const enrichments: Map<string, EnhancedResearch | null> = new Map();
    if (enrichWebsites && validResults.length <= 8) {
      const enrichPromises = validResults.slice(0, 5).map(async r => {
        try {
          const enrichment = await quickEnrich(r.company.domain);
          return { domain: r.company.domain, enrichment };
        } catch {
          return { domain: r.company.domain, enrichment: null };
        }
      });
      const enrichResults = await Promise.all(enrichPromises);
      enrichResults.forEach(e => enrichments.set(e.domain, e.enrichment));
    }

    // Score and rank results
    const scoredResults = validResults.map(result => {
      const enrichment = enrichments.get(result.company.domain) || null;
      const { score, factors, breakdown } = calculateScore(result, enrichment, parsedQuery);
      const opener = generateOpener(result, enrichment);

      return {
        ...result,
        score,
        scoringFactors: factors,
        scoreBreakdown: breakdown,
        opener,
        enrichment,
      };
    });

    // Sort by score (descending)
    scoredResults.sort((a, b) => b.score - a.score);

    // Take top results
    const topResults = scoredResults.slice(0, limit);

    // Format response
    const leads = topResults.map(r => ({
      // Core info
      id: `lead_${r.company.domain.replace(/\./g, "_")}`,
      name: r.company.name,
      domain: r.company.domain,
      industry: r.company.industry,
      subIndustry: r.company.subIndustry,
      stage: r.company.stage,
      hqLocation: r.company.hqLocation,
      estimatedEmployees: r.company.estimatedEmployees,
      lastFunding: r.company.lastFunding,
      fundingAmount: r.company.fundingAmount,

      // Hiring intelligence
      totalJobs: r.totalJobs,
      hiringVelocity: r.hiringVelocity,
      departments: r.departments,
      topDepartments: r.topDepartments,
      seniorityMix: r.seniorityMix,
      techStack: r.techStack.slice(0, 10),
      topJobs: r.jobs.slice(0, 8),

      // Signals & scoring
      score: r.score,
      signals: r.signals,
      scoreBreakdown: r.scoreBreakdown,

      // Outreach
      openerShort: r.opener.short,
      openerMedium: r.opener.medium,
      targetTitles: DEPT_PATTERNS[r.topDepartments[0]]?.titles || ["VP of Sales", "Head of Growth"],

      // Enrichment data (if available)
      enrichment: r.enrichment ? {
        description: r.enrichment.description,
        painPoints: r.enrichment.painPoints,
        outreachAngles: r.enrichment.outreachAngles?.slice(0, 2),
        urgencyScore: r.enrichment.urgencyScore,
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
        totalCompaniesInDB: COMPANY_COUNT,
        companiesSearched: companies.length,
        companiesCrawled: validResults.length,
        leadsReturned: leads.length,
        processingTimeMs: processingTime,
        enrichmentEnabled: enrichWebsites,
      },
      leads,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed", details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint for quick queries
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || searchParams.get("query");
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!query) {
    // Return stats and hot leads
    const hotLeads = getHotCompanies(5);
    return NextResponse.json({
      success: true,
      stats: {
        totalCompanies: COMPANY_COUNT,
        industries: [...new Set(COMPANIES.map(c => c.industry))].length,
      },
      hotCompanies: hotLeads.map(c => ({
        name: c.name,
        domain: c.domain,
        industry: c.industry,
        stage: c.stage,
      })),
    });
  }

  // Quick search - just return matching companies without crawling
  const companies = searchCompanies(query, { limit });
  return NextResponse.json({
    success: true,
    query,
    count: companies.length,
    companies: companies.map(c => ({
      name: c.name,
      domain: c.domain,
      industry: c.industry,
      subIndustry: c.subIndustry,
      stage: c.stage,
      hqLocation: c.hqLocation,
      jobBoardUrl: c.source === "lever"
        ? `https://jobs.lever.co/${c.slug}`
        : `https://boards.greenhouse.io/${c.slug}`,
    })),
  });
}
