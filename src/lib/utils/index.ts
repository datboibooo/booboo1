import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeDomain(input: string): string {
  let domain = input.toLowerCase().trim();
  // Remove protocol
  domain = domain.replace(/^https?:\/\//, "");
  // Remove www
  domain = domain.replace(/^www\./, "");
  // Remove trailing slash and path
  domain = domain.split("/")[0];
  // Remove port
  domain = domain.split(":")[0];
  return domain;
}

export function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

export function generateLinkedInSearchUrl(
  companyName: string,
  domain: string,
  titles: string[]
): string {
  const titleQuery = titles.join(" OR ");
  const query = encodeURIComponent(`"${companyName}" ${titleQuery}`);
  return `https://www.linkedin.com/search/results/people/?keywords=${query}&origin=GLOBAL_SEARCH_HEADER`;
}

export function generateLinkedInSearchQuery(
  companyName: string,
  titles: string[]
): string {
  const titleQuery = titles.map((t) => `"${t}"`).join(" OR ");
  return `"${companyName}" (${titleQuery})`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function getSourceTypeLabel(sourceType: string): string {
  const labels: Record<string, string> = {
    news: "News Article",
    press_release: "Press Release",
    company_site: "Company Website",
    job_post: "Job Posting",
    sec_filing: "SEC Filing",
    blog: "Blog Post",
    social: "Social Media",
    review: "Review Site",
    directory: "Business Directory",
    other: "Web Source",
  };
  return labels[sourceType] || "Web Source";
}

export function calculateScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-cyan-400";
  if (score >= 40) return "text-amber-400";
  return "text-zinc-400";
}

export function calculateScoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-400/10 border-emerald-400/30";
  if (score >= 60) return "bg-cyan-400/10 border-cyan-400/30";
  if (score >= 40) return "bg-amber-400/10 border-amber-400/30";
  return "bg-zinc-400/10 border-zinc-400/30";
}

export function getPriorityColor(priority: "low" | "medium" | "high"): string {
  switch (priority) {
    case "high":
      return "bg-rose-500/20 text-rose-300 border-rose-500/30";
    case "medium":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "low":
      return "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
  }
}

export function dedupeDomains(domains: string[]): string[] {
  const seen = new Set<string>();
  return domains.filter((d) => {
    const normalized = normalizeDomain(d);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(initialDelay * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}
