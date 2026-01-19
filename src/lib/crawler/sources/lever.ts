/**
 * Lever Job Board Crawler
 *
 * Lever has a public API for job listings at:
 * https://api.lever.co/v0/postings/{company}
 *
 * No authentication required for public job boards.
 */

import { JobPosting, RawSignal, SignalType } from "../types";

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl: string;
  categories: {
    commitment?: string;
    department?: string;
    location?: string;
    team?: string;
  };
  description: string;
  descriptionPlain: string;
  lists: Array<{
    text: string;
    content: string;
  }>;
  additional?: string;
  additionalPlain?: string;
  createdAt: number;
}

// Department mapping
function mapDepartment(deptName: string | undefined): JobPosting["department"] {
  if (!deptName) return "other";
  const lower = deptName.toLowerCase();
  if (lower.includes("engineer") || lower.includes("develop") || lower.includes("tech")) return "engineering";
  if (lower.includes("sales") || lower.includes("account") || lower.includes("business dev") || lower.includes("revenue")) return "sales";
  if (lower.includes("market") || lower.includes("growth") || lower.includes("brand") || lower.includes("content")) return "marketing";
  if (lower.includes("product") || lower.includes("design") || lower.includes("ux")) return "product";
  if (lower.includes("operation") || lower.includes("support") || lower.includes("success") || lower.includes("customer")) return "operations";
  if (lower.includes("finance") || lower.includes("account") || lower.includes("legal")) return "finance";
  if (lower.includes("people") || lower.includes("hr") || lower.includes("recruit") || lower.includes("talent")) return "hr";
  return "other";
}

// Seniority detection from title
function detectSeniority(title: string): JobPosting["seniority"] {
  const lower = title.toLowerCase();
  if (lower.includes("intern")) return "intern";
  if (lower.includes("junior") || lower.includes("associate") || lower.includes("entry") || lower.includes("i ") || lower.match(/\bi\b/)) return "entry";
  if (lower.includes("senior") || lower.includes("sr.") || lower.includes("sr ") || lower.includes("ii")) return "senior";
  if (lower.includes("staff") || lower.includes("principal") || lower.includes("lead") || lower.includes("iii")) return "lead";
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
    "javascript", "typescript", "python", "java", "golang", "go", "ruby", "rust", "c++", "c#", "php", "swift", "kotlin", "scala",
    // Frontend
    "react", "vue", "angular", "next.js", "nextjs", "svelte", "tailwind", "remix",
    // Backend
    "node.js", "nodejs", "express", "django", "flask", "fastapi", "rails", "spring", "graphql",
    // Databases
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb", "cassandra",
    // Cloud
    "aws", "gcp", "azure", "kubernetes", "k8s", "docker", "terraform", "vercel", "netlify", "cloudflare",
    // Tools
    "git", "github", "gitlab", "jira", "confluence", "figma", "datadog", "sentry", "pagerduty",
    // Data
    "snowflake", "databricks", "spark", "kafka", "airflow", "dbt", "fivetran", "looker", "tableau",
    // CRM/Sales/Marketing
    "salesforce", "hubspot", "segment", "amplitude", "mixpanel", "intercom", "zendesk", "marketo", "outreach",
    // AI/ML
    "openai", "langchain", "pytorch", "tensorflow", "llm", "machine learning", "ml",
  ];

  const found: string[] = [];
  const lower = content.toLowerCase();

  for (const tech of techPatterns) {
    // Use word boundary matching for short terms
    if (tech.length <= 3) {
      const regex = new RegExp(`\\b${tech}\\b`, "i");
      if (regex.test(lower) && !found.includes(tech)) {
        found.push(tech);
      }
    } else if (lower.includes(tech) && !found.includes(tech)) {
      found.push(tech);
    }
  }

  return found;
}

// Extract pain points from job description
function extractPainPoints(content: string): string[] {
  const painPatterns = [
    { pattern: /scale\s+(from|to)\s+\d+/gi, point: "scaling challenges" },
    { pattern: /growing\s+(team|company|rapidly|fast)/gi, point: "rapid growth" },
    { pattern: /first\s+(hire|engineer|sales|marketing|pm)/gi, point: "building from scratch" },
    { pattern: /founding\s+(member|team|engineer)/gi, point: "founding team" },
    { pattern: /improve\s+(our|the)\s+(process|system|infrastructure)/gi, point: "process improvement" },
    { pattern: /technical\s+debt/gi, point: "technical debt" },
    { pattern: /legacy\s+(system|code|infrastructure)/gi, point: "legacy systems" },
    { pattern: /greenfield/gi, point: "greenfield project" },
    { pattern: /0\s+to\s+1|zero\s+to\s+one/gi, point: "zero to one" },
    { pattern: /series\s+[a-d]/gi, point: "startup stage" },
    { pattern: /enterprise\s+(customer|client|sale|deal)/gi, point: "enterprise motion" },
    { pattern: /hyper.?growth/gi, point: "hyper-growth" },
    { pattern: /product.?market\s+fit/gi, point: "PMF stage" },
    { pattern: /go.?to.?market/gi, point: "GTM motion" },
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
 * Crawl Lever job board for a company
 */
export async function crawlLever(
  companySlug: string,
  companyDomain: string,
  companyName: string
): Promise<{ jobs: JobPosting[]; signals: RawSignal[] }> {
  const url = `https://api.lever.co/v0/postings/${companySlug}?mode=json`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "LeadDrip Research Bot/1.0",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Company doesn't have public Lever board
        return { jobs: [], signals: [] };
      }
      throw new Error(`Lever API error: ${response.status}`);
    }

    const data: LeverPosting[] = await response.json();
    const jobs: JobPosting[] = [];
    const signals: RawSignal[] = [];

    for (const leverJob of data) {
      const fullContent = `${leverJob.descriptionPlain || ""} ${leverJob.additionalPlain || ""} ${leverJob.lists.map(l => l.content).join(" ")}`;
      const techStack = extractTechStack(fullContent);
      const painPoints = extractPainPoints(fullContent);

      const job: JobPosting = {
        id: `lever_${leverJob.id}`,
        companyDomain,
        companyName,
        title: leverJob.text,
        department: mapDepartment(leverJob.categories.department || leverJob.categories.team),
        seniority: detectSeniority(leverJob.text),
        location: leverJob.categories.location,
        remote: leverJob.categories.location?.toLowerCase().includes("remote") ||
                leverJob.categories.commitment?.toLowerCase().includes("remote"),
        description: fullContent,
        requirements: leverJob.lists
          .filter(l => l.text.toLowerCase().includes("requirement") || l.text.toLowerCase().includes("qualification"))
          .map(l => l.content),
        techStack,
        painPoints,
        postedAt: new Date(leverJob.createdAt).toISOString(),
        sourceType: "lever",
        sourceUrl: leverJob.hostedUrl,
      };

      jobs.push(job);

      // Create a signal for this job
      const signal: RawSignal = {
        id: `sig_lever_${leverJob.id}`,
        companyDomain,
        companyName,
        signalType: jobToSignalType(job),
        title: `Hiring: ${leverJob.text}`,
        description: `${companyName} is hiring a ${leverJob.text}${job.location ? ` in ${job.location}` : ""}. ${painPoints.length > 0 ? `Signals: ${painPoints.join(", ")}` : ""}`,
        sourceType: "lever",
        sourceUrl: leverJob.hostedUrl,
        rawData: {
          department: job.department,
          seniority: job.seniority,
          techStack,
          painPoints,
          commitment: leverJob.categories.commitment,
        },
        crawledAt: new Date().toISOString(),
        confidence: 0.95, // High confidence - direct from job board
      };

      signals.push(signal);
    }

    return { jobs, signals };
  } catch (error) {
    console.error(`Error crawling Lever for ${companySlug}:`, error);
    return { jobs: [], signals: [] };
  }
}

/**
 * Try to find Lever board for a domain
 */
export async function findLeverBoard(domain: string): Promise<string | null> {
  const slugsToTry = [
    domain.replace(/\.(com|io|co|ai|app|dev)$/, ""),
    domain.replace(/\.(com|io|co|ai|app|dev)$/, "").replace(/-/g, ""),
    domain.split(".")[0],
  ];

  for (const slug of slugsToTry) {
    try {
      const response = await fetch(
        `https://api.lever.co/v0/postings/${slug}?mode=json`,
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
