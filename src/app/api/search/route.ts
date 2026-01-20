/**
 * Live Search API - Returns real job board data
 * No API keys needed - uses public Greenhouse/Lever APIs
 */

import { NextResponse } from "next/server";
import { COMPANIES, Company, searchCompanies, getRandomCompanies } from "@/lib/data/companies";

// Tech stack patterns to extract from job descriptions
const TECH_PATTERNS: Record<string, RegExp> = {
  "React": /\breact\b/i,
  "Next.js": /\bnext\.?js\b/i,
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
  "Vue": /\bvue\.?js?\b/i,
  "Angular": /\bangular\b/i,
  "Swift": /\bswift\b/i,
  "Kotlin": /\bkotlin\b/i,
  "Java": /\bjava\b(?!script)/i,
  "C++": /\bc\+\+\b/i,
  "Scala": /\bscala\b/i,
  "Elixir": /\belixir\b/i,
  "Ruby": /\bruby\b/i,
  "Rails": /\brails\b/i,
  "Django": /\bdjango\b/i,
  "FastAPI": /\bfastapi\b/i,
  "TailwindCSS": /\btailwind\b/i,
};

// Department patterns
const DEPT_PATTERNS: Record<string, RegExp> = {
  "Engineering": /engineer|developer|software|backend|frontend|fullstack|sre|devops|platform/i,
  "Sales": /sales|account executive|sdr|bdr|revenue/i,
  "Marketing": /marketing|growth|content|brand|demand gen/i,
  "Product": /product manager|product design|pm\b/i,
  "Design": /designer|ux|ui|creative/i,
  "Data": /data scientist|data engineer|analytics|ml engineer|machine learning/i,
  "Operations": /operations|ops|support|success/i,
};

interface Job {
  title: string;
  department: string;
  location: string;
  url: string;
}

interface CrawlResult {
  company: Company;
  jobs: Job[];
  totalJobs: number;
  techStack: string[];
  departments: Record<string, number>;
  signals: string[];
  hiringVelocity: "aggressive" | "moderate" | "stable";
}

/**
 * Crawl Greenhouse jobs API
 */
async function crawlGreenhouse(company: Company): Promise<CrawlResult | null> {
  try {
    const response = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) return null;

    const data = await response.json();
    const jobs: Job[] = [];
    const techStack = new Set<string>();
    const departments: Record<string, number> = {};
    let allContent = "";

    for (const job of data.jobs || []) {
      const title = job.title || "";
      const location = job.location?.name || "Remote";
      const content = job.content || "";
      allContent += " " + title + " " + content;

      // Detect department
      let dept = "Other";
      for (const [name, pattern] of Object.entries(DEPT_PATTERNS)) {
        if (pattern.test(title)) {
          dept = name;
          break;
        }
      }
      departments[dept] = (departments[dept] || 0) + 1;

      jobs.push({
        title,
        department: dept,
        location,
        url: job.absolute_url || `https://boards.greenhouse.io/${company.slug}/jobs/${job.id}`,
      });
    }

    // Extract tech stack
    for (const [tech, pattern] of Object.entries(TECH_PATTERNS)) {
      if (pattern.test(allContent)) {
        techStack.add(tech);
      }
    }

    // Generate signals
    const signals: string[] = [];
    const totalJobs = jobs.length;

    if (totalJobs >= 50) {
      signals.push(`Aggressive hiring: ${totalJobs} open roles`);
    } else if (totalJobs >= 20) {
      signals.push(`Growing team: ${totalJobs} open roles`);
    }

    if (departments["Engineering"] >= 10) {
      signals.push(`Scaling engineering: ${departments["Engineering"]} eng roles`);
    }
    if (departments["Sales"] >= 5) {
      signals.push(`Sales expansion: ${departments["Sales"]} sales roles`);
    }
    if (departments["Data"] >= 3) {
      signals.push(`Building data team: ${departments["Data"]} data roles`);
    }

    // First hire signals
    for (const [dept, count] of Object.entries(departments)) {
      if (count === 1) {
        const firstHireRoles = ["Data", "Design", "Product"];
        if (firstHireRoles.includes(dept)) {
          signals.push(`First ${dept} hire`);
        }
      }
    }

    const hiringVelocity: CrawlResult["hiringVelocity"] =
      totalJobs >= 50 ? "aggressive" : totalJobs >= 15 ? "moderate" : "stable";

    return {
      company,
      jobs: jobs.slice(0, 10), // Return top 10 jobs
      totalJobs,
      techStack: Array.from(techStack),
      departments,
      signals,
      hiringVelocity,
    };
  } catch (error) {
    console.error(`Failed to crawl ${company.name}:`, error);
    return null;
  }
}

/**
 * Crawl Lever jobs API
 */
async function crawlLever(company: Company): Promise<CrawlResult | null> {
  try {
    const response = await fetch(
      `https://api.lever.co/v0/postings/${company.slug}`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const jobs: Job[] = [];
    const techStack = new Set<string>();
    const departments: Record<string, number> = {};
    let allContent = "";

    for (const job of data || []) {
      const title = job.text || "";
      const location = job.categories?.location || "Remote";
      const content = job.descriptionPlain || "";
      allContent += " " + title + " " + content;

      let dept = "Other";
      for (const [name, pattern] of Object.entries(DEPT_PATTERNS)) {
        if (pattern.test(title)) {
          dept = name;
          break;
        }
      }
      departments[dept] = (departments[dept] || 0) + 1;

      jobs.push({
        title,
        department: dept,
        location,
        url: job.hostedUrl || job.applyUrl || "",
      });
    }

    for (const [tech, pattern] of Object.entries(TECH_PATTERNS)) {
      if (pattern.test(allContent)) {
        techStack.add(tech);
      }
    }

    const signals: string[] = [];
    const totalJobs = jobs.length;

    if (totalJobs >= 50) signals.push(`Aggressive hiring: ${totalJobs} open roles`);
    else if (totalJobs >= 20) signals.push(`Growing team: ${totalJobs} open roles`);

    if (departments["Engineering"] >= 10) {
      signals.push(`Scaling engineering: ${departments["Engineering"]} eng roles`);
    }

    const hiringVelocity: CrawlResult["hiringVelocity"] =
      totalJobs >= 50 ? "aggressive" : totalJobs >= 15 ? "moderate" : "stable";

    return {
      company,
      jobs: jobs.slice(0, 10),
      totalJobs,
      techStack: Array.from(techStack),
      departments,
      signals,
      hiringVelocity,
    };
  } catch (error) {
    console.error(`Failed to crawl ${company.name}:`, error);
    return null;
  }
}

/**
 * Parse query to extract search criteria
 */
function parseQuery(query: string): {
  techStack: string[];
  department: string | null;
  industry: string | null;
  stage: string | null;
} {
  const lower = query.toLowerCase();
  const techStack: string[] = [];
  let department: string | null = null;
  let industry: string | null = null;
  let stage: string | null = null;

  // Extract tech stack mentions
  for (const tech of Object.keys(TECH_PATTERNS)) {
    if (lower.includes(tech.toLowerCase())) {
      techStack.push(tech);
    }
  }

  // Extract department
  if (/engineer|developer|software|backend|frontend/i.test(query)) department = "Engineering";
  else if (/sales|sdr|account/i.test(query)) department = "Sales";
  else if (/market|growth/i.test(query)) department = "Marketing";
  else if (/data|ml|machine learning|analytics/i.test(query)) department = "Data";
  else if (/design|ux|ui/i.test(query)) department = "Design";
  else if (/product/i.test(query)) department = "Product";

  // Extract industry
  if (/fintech|finance|payment/i.test(query)) industry = "Fintech";
  else if (/ai|artificial intelligence|ml/i.test(query)) industry = "AI";
  else if (/devtool|developer tool|infrastructure/i.test(query)) industry = "Developer Tools";
  else if (/saas|b2b/i.test(query)) industry = "B2B SaaS";

  // Extract stage
  if (/series a\b/i.test(query)) stage = "Series A";
  else if (/series b\b/i.test(query)) stage = "Series B";
  else if (/series c\b/i.test(query)) stage = "Series C";
  else if (/seed/i.test(query)) stage = "Seed";
  else if (/startup|early/i.test(query)) stage = "Series A";
  else if (/growth/i.test(query)) stage = "Series B";

  return { techStack, department, industry, stage };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, limit = 8 } = body;

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    // Parse the query
    const criteria = parseQuery(query);

    // Find matching companies
    let companies: Company[] = [];

    if (criteria.industry) {
      companies = COMPANIES.filter((c) =>
        c.industry.toLowerCase().includes(criteria.industry!.toLowerCase())
      );
    } else if (criteria.stage) {
      companies = COMPANIES.filter((c) =>
        c.stage.toLowerCase().includes(criteria.stage!.toLowerCase())
      );
    } else {
      // Search by query text
      companies = searchCompanies(query);
    }

    // If no matches, get random sample
    if (companies.length === 0) {
      companies = getRandomCompanies(limit);
    }

    // Limit to prevent too many requests
    companies = companies.slice(0, limit);

    // Crawl in parallel
    const results = await Promise.all(
      companies.map((c) =>
        c.source === "greenhouse" ? crawlGreenhouse(c) : crawlLever(c)
      )
    );

    // Filter out failed crawls and apply criteria
    let validResults = results.filter((r): r is CrawlResult => r !== null);

    // Filter by tech stack if specified
    if (criteria.techStack.length > 0) {
      validResults = validResults.filter((r) =>
        criteria.techStack.some((tech) =>
          r.techStack.map((t) => t.toLowerCase()).includes(tech.toLowerCase())
        )
      );
    }

    // Filter by department if specified
    if (criteria.department) {
      validResults = validResults.filter(
        (r) => (r.departments[criteria.department!] || 0) > 0
      );
    }

    // Sort by hiring velocity and job count
    validResults.sort((a, b) => {
      const velocityScore = { aggressive: 3, moderate: 2, stable: 1 };
      const aScore = velocityScore[a.hiringVelocity] * 100 + a.totalJobs;
      const bScore = velocityScore[b.hiringVelocity] * 100 + b.totalJobs;
      return bScore - aScore;
    });

    // Format response
    const leads = validResults.map((r) => ({
      name: r.company.name,
      domain: r.company.domain,
      industry: r.company.industry,
      stage: r.company.stage,
      score: Math.min(99, 60 + r.totalJobs + r.signals.length * 5),
      totalJobs: r.totalJobs,
      techStack: r.techStack.slice(0, 8),
      departments: r.departments,
      signals: r.signals,
      hiringVelocity: r.hiringVelocity,
      topJobs: r.jobs.slice(0, 5),
    }));

    return NextResponse.json({
      success: true,
      query,
      criteria,
      count: leads.length,
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
