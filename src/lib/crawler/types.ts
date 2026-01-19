import { z } from "zod";

// Signal types that can be extracted
export const SignalType = z.enum([
  "funding",
  "hiring",
  "hiring_sales",
  "hiring_engineering",
  "hiring_leadership",
  "product_launch",
  "expansion",
  "partnership",
  "acquisition",
  "leadership_change",
  "tech_adoption",
  "office_opening",
  "layoff",
  "ipo_rumor",
]);
export type SignalType = z.infer<typeof SignalType>;

// Source types for crawled data
export const SourceType = z.enum([
  "greenhouse",
  "lever",
  "ashby",
  "workable",
  "company_website",
  "linkedin",
  "press_release",
  "news_article",
  "github",
  "g2_review",
  "crunchbase",
]);
export type SourceType = z.infer<typeof SourceType>;

// A raw crawled signal before processing
export const RawSignal = z.object({
  id: z.string(),
  companyDomain: z.string(),
  companyName: z.string(),
  signalType: SignalType,
  title: z.string(),
  description: z.string(),
  sourceType: SourceType,
  sourceUrl: z.string(),
  rawData: z.record(z.string(), z.unknown()).optional(),
  crawledAt: z.string(),
  confidence: z.number().min(0).max(1),
});
export type RawSignal = z.infer<typeof RawSignal>;

// Job posting structure
export const JobPosting = z.object({
  id: z.string(),
  companyDomain: z.string(),
  companyName: z.string(),
  title: z.string(),
  department: z.enum(["engineering", "sales", "marketing", "product", "operations", "finance", "hr", "other"]),
  seniority: z.enum(["intern", "entry", "mid", "senior", "lead", "manager", "director", "vp", "c_level"]),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  description: z.string(),
  requirements: z.array(z.string()),
  techStack: z.array(z.string()),
  painPoints: z.array(z.string()),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  postedAt: z.string(),
  sourceType: SourceType,
  sourceUrl: z.string(),
});
export type JobPosting = z.infer<typeof JobPosting>;

// Company profile enriched from crawling
export const CompanyProfile = z.object({
  domain: z.string(),
  name: z.string(),
  description: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.number().optional(),
  employeeGrowth: z.number().optional(), // percentage
  techStack: z.array(z.string()),
  fundingStage: z.string().optional(),
  fundingTotal: z.number().optional(),
  lastFundingDate: z.string().optional(),
  headquarters: z.string().optional(),
  founded: z.number().optional(),
  socialProfiles: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    github: z.string().optional(),
  }).optional(),
  lastCrawled: z.string(),
});
export type CompanyProfile = z.infer<typeof CompanyProfile>;

// Crawler task
export const CrawlerTask = z.object({
  id: z.string(),
  type: z.enum(["job_board", "company_website", "news", "social"]),
  source: SourceType,
  target: z.string(), // domain or URL
  priority: z.number().min(1).max(10),
  createdAt: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  result: z.object({
    signalsFound: z.number(),
    error: z.string().optional(),
  }).optional(),
});
export type CrawlerTask = z.infer<typeof CrawlerTask>;

// Crawler configuration
export interface CrawlerConfig {
  maxConcurrent: number;
  requestDelay: number; // ms between requests to same domain
  timeout: number; // ms
  retries: number;
  userAgent: string;
  respectRobotsTxt: boolean;
}

export const DEFAULT_CRAWLER_CONFIG: CrawlerConfig = {
  maxConcurrent: 5,
  requestDelay: 1000,
  timeout: 30000,
  retries: 3,
  userAgent: "LeadDrip Research Bot/1.0 (+https://leaddrip.com/bot)",
  respectRobotsTxt: true,
};

// Hiring velocity analysis
export const HiringVelocity = z.object({
  companyDomain: z.string(),
  totalOpenings: z.number(),
  byDepartment: z.record(z.string(), z.number()),
  bySeniority: z.record(z.string(), z.number()),
  growthSignal: z.enum(["aggressive", "moderate", "stable", "contracting"]),
  techStack: z.array(z.string()),
  analyzedAt: z.string(),
});
export type HiringVelocity = z.infer<typeof HiringVelocity>;
