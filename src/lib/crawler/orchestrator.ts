/**
 * Crawler Orchestrator
 *
 * Coordinates crawling across multiple sources, manages rate limiting,
 * and aggregates signals.
 */

import { JobPosting, RawSignal, HiringVelocity, CompanyProfile, CrawlerConfig, DEFAULT_CRAWLER_CONFIG } from "./types";
import { crawlGreenhouse, findGreenhouseBoard, analyzeHiringVelocity } from "./sources/greenhouse";
import { crawlLever, findLeverBoard } from "./sources/lever";

export interface CrawlResult {
  company: {
    domain: string;
    name: string;
  };
  jobs: JobPosting[];
  signals: RawSignal[];
  hiringVelocity: HiringVelocity | null;
  sources: {
    greenhouse: boolean;
    lever: boolean;
  };
  crawledAt: string;
  errors: string[];
}

export interface BatchCrawlResult {
  results: CrawlResult[];
  stats: {
    companiesCrawled: number;
    totalJobs: number;
    totalSignals: number;
    errors: number;
    duration: number;
  };
}

// Rate limiter to respect domains
class RateLimiter {
  private lastRequestTime: Map<string, number> = new Map();
  private delay: number;

  constructor(delayMs: number = 1000) {
    this.delay = delayMs;
  }

  async wait(domain: string): Promise<void> {
    const lastTime = this.lastRequestTime.get(domain) || 0;
    const now = Date.now();
    const elapsed = now - lastTime;

    if (elapsed < this.delay) {
      await new Promise((resolve) => setTimeout(resolve, this.delay - elapsed));
    }

    this.lastRequestTime.set(domain, Date.now());
  }
}

const rateLimiter = new RateLimiter(1000);

/**
 * Crawl a single company across all job board sources
 */
export async function crawlCompany(
  domain: string,
  companyName: string,
  config: CrawlerConfig = DEFAULT_CRAWLER_CONFIG
): Promise<CrawlResult> {
  const result: CrawlResult = {
    company: { domain, name: companyName },
    jobs: [],
    signals: [],
    hiringVelocity: null,
    sources: { greenhouse: false, lever: false },
    crawledAt: new Date().toISOString(),
    errors: [],
  };

  // Try Greenhouse
  try {
    await rateLimiter.wait("greenhouse.io");
    const ghSlug = await findGreenhouseBoard(domain);

    if (ghSlug) {
      await rateLimiter.wait("greenhouse.io");
      const ghResult = await crawlGreenhouse(ghSlug, domain, companyName);
      result.jobs.push(...ghResult.jobs);
      result.signals.push(...ghResult.signals);
      result.sources.greenhouse = true;
    }
  } catch (error) {
    result.errors.push(`Greenhouse: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Try Lever
  try {
    await rateLimiter.wait("lever.co");
    const leverSlug = await findLeverBoard(domain);

    if (leverSlug) {
      await rateLimiter.wait("lever.co");
      const leverResult = await crawlLever(leverSlug, domain, companyName);
      result.jobs.push(...leverResult.jobs);
      result.signals.push(...leverResult.signals);
      result.sources.lever = true;
    }
  } catch (error) {
    result.errors.push(`Lever: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Analyze hiring velocity if we found jobs
  if (result.jobs.length > 0) {
    const velocity = analyzeHiringVelocity(result.jobs);
    result.hiringVelocity = {
      companyDomain: domain,
      ...velocity,
      analyzedAt: new Date().toISOString(),
    };
  }

  return result;
}

/**
 * Batch crawl multiple companies with concurrency control
 */
export async function batchCrawlCompanies(
  companies: Array<{ domain: string; name: string }>,
  config: CrawlerConfig = DEFAULT_CRAWLER_CONFIG
): Promise<BatchCrawlResult> {
  const startTime = Date.now();
  const results: CrawlResult[] = [];
  let totalJobs = 0;
  let totalSignals = 0;
  let errors = 0;

  // Process in batches to control concurrency
  const batchSize = config.maxConcurrent;

  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map((company) => crawlCompany(company.domain, company.name, config))
    );

    for (const result of batchResults) {
      results.push(result);
      totalJobs += result.jobs.length;
      totalSignals += result.signals.length;
      if (result.errors.length > 0) errors++;
    }
  }

  return {
    results,
    stats: {
      companiesCrawled: companies.length,
      totalJobs,
      totalSignals,
      errors,
      duration: Date.now() - startTime,
    },
  };
}

/**
 * Search for companies with specific hiring patterns
 */
export function filterByHiringPattern(
  results: CrawlResult[],
  criteria: {
    minOpenings?: number;
    departments?: JobPosting["department"][];
    seniorities?: JobPosting["seniority"][];
    techStack?: string[];
    growthSignals?: HiringVelocity["growthSignal"][];
    painPoints?: string[];
  }
): CrawlResult[] {
  return results.filter((result) => {
    // Check minimum openings
    if (criteria.minOpenings && result.jobs.length < criteria.minOpenings) {
      return false;
    }

    // Check departments
    if (criteria.departments && criteria.departments.length > 0) {
      const hasDept = result.jobs.some((job) =>
        criteria.departments!.includes(job.department)
      );
      if (!hasDept) return false;
    }

    // Check seniorities
    if (criteria.seniorities && criteria.seniorities.length > 0) {
      const hasSeniority = result.jobs.some((job) =>
        criteria.seniorities!.includes(job.seniority)
      );
      if (!hasSeniority) return false;
    }

    // Check tech stack
    if (criteria.techStack && criteria.techStack.length > 0) {
      const allTech = new Set(result.jobs.flatMap((job) => job.techStack));
      const hasTech = criteria.techStack.some((tech) =>
        allTech.has(tech.toLowerCase())
      );
      if (!hasTech) return false;
    }

    // Check growth signals
    if (
      criteria.growthSignals &&
      criteria.growthSignals.length > 0 &&
      result.hiringVelocity
    ) {
      if (!criteria.growthSignals.includes(result.hiringVelocity.growthSignal)) {
        return false;
      }
    }

    // Check pain points
    if (criteria.painPoints && criteria.painPoints.length > 0) {
      const allPainPoints = new Set(
        result.jobs.flatMap((job) => job.painPoints.map((p) => p.toLowerCase()))
      );
      const hasPainPoint = criteria.painPoints.some((point) =>
        allPainPoints.has(point.toLowerCase())
      );
      if (!hasPainPoint) return false;
    }

    return true;
  });
}

/**
 * Aggregate signals from crawl results
 */
export function aggregateSignals(results: CrawlResult[]): {
  byType: Record<string, number>;
  byCompany: Record<string, RawSignal[]>;
  topTechStack: Array<{ tech: string; count: number }>;
  topPainPoints: Array<{ point: string; count: number }>;
} {
  const byType: Record<string, number> = {};
  const byCompany: Record<string, RawSignal[]> = {};
  const techStackCounts: Record<string, number> = {};
  const painPointCounts: Record<string, number> = {};

  for (const result of results) {
    byCompany[result.company.domain] = result.signals;

    for (const signal of result.signals) {
      byType[signal.signalType] = (byType[signal.signalType] || 0) + 1;
    }

    for (const job of result.jobs) {
      for (const tech of job.techStack) {
        techStackCounts[tech] = (techStackCounts[tech] || 0) + 1;
      }
      for (const point of job.painPoints) {
        painPointCounts[point] = (painPointCounts[point] || 0) + 1;
      }
    }
  }

  const topTechStack = Object.entries(techStackCounts)
    .map(([tech, count]) => ({ tech, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const topPainPoints = Object.entries(painPointCounts)
    .map(([point, count]) => ({ point, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return { byType, byCompany, topTechStack, topPainPoints };
}
