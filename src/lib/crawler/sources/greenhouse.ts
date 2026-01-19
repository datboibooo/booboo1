/**
 * Greenhouse Job Board Crawler
 *
 * Greenhouse has a public API for job listings at:
 * https://boards-api.greenhouse.io/v1/boards/{company}/jobs
 *
 * No authentication required for public job boards.
 */

import { JobPosting, RawSignal, SourceType, SignalType } from "../types";

interface GreenhouseJob {
  id: number;
  title: string;
  location: {
    name: string;
  };
  updated_at: string;
  absolute_url: string;
  content: string;
  departments: Array<{ name: string }>;
  offices: Array<{ name: string }>;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

// Department mapping
function mapDepartment(deptName: string): JobPosting["department"] {
  const lower = deptName.toLowerCase();
  if (lower.includes("engineer") || lower.includes("develop") || lower.includes("tech")) return "engineering";
  if (lower.includes("sales") || lower.includes("account") || lower.includes("business dev")) return "sales";
  if (lower.includes("market") || lower.includes("growth") || lower.includes("brand")) return "marketing";
  if (lower.includes("product") || lower.includes("design") || lower.includes("ux")) return "product";
  if (lower.includes("operation") || lower.includes("support") || lower.includes("success")) return "operations";
  if (lower.includes("finance") || lower.includes("account") || lower.includes("legal")) return "finance";
  if (lower.includes("people") || lower.includes("hr") || lower.includes("recruit") || lower.includes("talent")) return "hr";
  return "other";
}

// Seniority detection from title
function detectSeniority(title: string): JobPosting["seniority"] {
  const lower = title.toLowerCase();
  if (lower.includes("intern")) return "intern";
  if (lower.includes("junior") || lower.includes("associate") || lower.includes("entry")) return "entry";
  if (lower.includes("senior") || lower.includes("sr.") || lower.includes("sr ")) return "senior";
  if (lower.includes("staff") || lower.includes("principal") || lower.includes("lead")) return "lead";
  if (lower.includes("manager") || lower.includes("head of")) return "manager";
  if (lower.includes("director")) return "director";
  if (lower.includes("vp") || lower.includes("vice president")) return "vp";
  if (lower.includes("chief") || lower.includes("cto") || lower.includes("ceo") || lower.includes("cfo") || lower.includes("coo")) return "c_level";
  return "mid";
}

// Extract tech stack from job description
function extractTechStack(content: string): string[] {
  const techPatterns = [
    // Languages
    "javascript", "typescript", "python", "java", "golang", "go", "ruby", "rust", "c++", "c#", "php", "swift", "kotlin",
    // Frontend
    "react", "vue", "angular", "next.js", "nextjs", "svelte", "tailwind",
    // Backend
    "node.js", "nodejs", "express", "django", "flask", "fastapi", "rails", "spring",
    // Databases
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb",
    // Cloud
    "aws", "gcp", "azure", "kubernetes", "docker", "terraform", "vercel", "netlify",
    // Tools
    "git", "github", "gitlab", "jira", "confluence", "figma", "datadog", "sentry",
    // Data
    "snowflake", "databricks", "spark", "kafka", "airflow", "dbt",
    // CRM/Sales
    "salesforce", "hubspot", "segment", "amplitude", "mixpanel", "intercom", "zendesk",
  ];

  const found: string[] = [];
  const lower = content.toLowerCase();

  for (const tech of techPatterns) {
    if (lower.includes(tech) && !found.includes(tech)) {
      found.push(tech);
    }
  }

  return found;
}

// Extract pain points from job description
function extractPainPoints(content: string): string[] {
  const painPatterns = [
    { pattern: /scale\s+(from|to)\s+\d+/gi, point: "scaling challenges" },
    { pattern: /growing\s+(team|company|rapidly)/gi, point: "rapid growth" },
    { pattern: /first\s+(hire|engineer|sales|marketing)/gi, point: "building from scratch" },
    { pattern: /improve\s+(our|the)\s+(process|system|infrastructure)/gi, point: "process improvement needed" },
    { pattern: /technical\s+debt/gi, point: "technical debt" },
    { pattern: /legacy\s+(system|code|infrastructure)/gi, point: "legacy systems" },
    { pattern: /greenfield/gi, point: "greenfield project" },
    { pattern: /0\s+to\s+1/gi, point: "zero to one" },
    { pattern: /series\s+[a-d]/gi, point: "startup stage" },
    { pattern: /enterprise\s+(customer|client|sale)/gi, point: "enterprise motion" },
  ];

  const found: string[] = [];

  for (const { pattern, point } of painPatterns) {
    if (pattern.test(content) && !found.includes(point)) {
      found.push(point);
    }
  }

  return found;
}

// Convert job to signal type
function jobToSignalType(job: JobPosting): SignalType {
  if (job.department === "sales") return "hiring_sales";
  if (job.department === "engineering") return "hiring_engineering";
  if (job.seniority === "c_level" || job.seniority === "vp" || job.seniority === "director") return "hiring_leadership";
  return "hiring";
}

/**
 * Crawl Greenhouse job board for a company
 */
export async function crawlGreenhouse(
  companySlug: string,
  companyDomain: string,
  companyName: string
): Promise<{ jobs: JobPosting[]; signals: RawSignal[] }> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs?content=true`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "LeadDrip Research Bot/1.0",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Company doesn't have public Greenhouse board
        return { jobs: [], signals: [] };
      }
      throw new Error(`Greenhouse API error: ${response.status}`);
    }

    const data: GreenhouseResponse = await response.json();
    const jobs: JobPosting[] = [];
    const signals: RawSignal[] = [];

    for (const ghJob of data.jobs) {
      const department = ghJob.departments[0]?.name || "other";
      const techStack = extractTechStack(ghJob.content);
      const painPoints = extractPainPoints(ghJob.content);

      const job: JobPosting = {
        id: `gh_${ghJob.id}`,
        companyDomain,
        companyName,
        title: ghJob.title,
        department: mapDepartment(department),
        seniority: detectSeniority(ghJob.title),
        location: ghJob.location?.name,
        remote: ghJob.location?.name?.toLowerCase().includes("remote"),
        description: ghJob.content,
        requirements: [], // Could extract with more parsing
        techStack,
        painPoints,
        postedAt: ghJob.updated_at,
        sourceType: "greenhouse",
        sourceUrl: ghJob.absolute_url,
      };

      jobs.push(job);

      // Create a signal for this job
      const signal: RawSignal = {
        id: `sig_gh_${ghJob.id}`,
        companyDomain,
        companyName,
        signalType: jobToSignalType(job),
        title: `Hiring: ${ghJob.title}`,
        description: `${companyName} is hiring a ${ghJob.title}${job.location ? ` in ${job.location}` : ""}. ${painPoints.length > 0 ? `Signals: ${painPoints.join(", ")}` : ""}`,
        sourceType: "greenhouse",
        sourceUrl: ghJob.absolute_url,
        rawData: {
          department: job.department,
          seniority: job.seniority,
          techStack,
          painPoints,
        },
        crawledAt: new Date().toISOString(),
        confidence: 0.95, // High confidence - direct from job board
      };

      signals.push(signal);
    }

    return { jobs, signals };
  } catch (error) {
    console.error(`Error crawling Greenhouse for ${companySlug}:`, error);
    return { jobs: [], signals: [] };
  }
}

/**
 * Try to find Greenhouse board for a domain
 * Common patterns: company name, domain without TLD
 */
export async function findGreenhouseBoard(domain: string): Promise<string | null> {
  const slugsToTry = [
    domain.replace(/\.(com|io|co|ai|app)$/, ""),
    domain.replace(/\.(com|io|co|ai|app)$/, "").replace(/-/g, ""),
    domain.split(".")[0],
  ];

  for (const slug of slugsToTry) {
    try {
      const response = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
        { method: "HEAD" }
      );
      if (response.ok) {
        return slug;
      }
    } catch {
      // Continue to next slug
    }
  }

  return null;
}

/**
 * Analyze hiring velocity from job postings
 */
export function analyzeHiringVelocity(jobs: JobPosting[]): {
  totalOpenings: number;
  byDepartment: Record<string, number>;
  bySeniority: Record<string, number>;
  growthSignal: "aggressive" | "moderate" | "stable" | "contracting";
  techStack: string[];
} {
  const byDepartment: Record<string, number> = {};
  const bySeniority: Record<string, number> = {};
  const techStackSet = new Set<string>();

  for (const job of jobs) {
    byDepartment[job.department] = (byDepartment[job.department] || 0) + 1;
    bySeniority[job.seniority] = (bySeniority[job.seniority] || 0) + 1;
    job.techStack.forEach((tech) => techStackSet.add(tech));
  }

  // Determine growth signal based on number of openings
  let growthSignal: "aggressive" | "moderate" | "stable" | "contracting";
  if (jobs.length >= 20) {
    growthSignal = "aggressive";
  } else if (jobs.length >= 10) {
    growthSignal = "moderate";
  } else if (jobs.length >= 3) {
    growthSignal = "stable";
  } else {
    growthSignal = "contracting";
  }

  return {
    totalOpenings: jobs.length,
    byDepartment,
    bySeniority,
    growthSignal,
    techStack: Array.from(techStackSet),
  };
}
