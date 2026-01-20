/**
 * Real company database with job board slugs
 * These are all publicly accessible - no API keys needed
 */

export interface Company {
  name: string;
  domain: string;
  slug: string;
  source: "greenhouse" | "lever";
  industry: string;
  stage: string;
  techStack?: string[];
}

// Curated list of tech companies with public job boards
export const COMPANIES: Company[] = [
  // Unicorns & Late Stage
  { name: "Stripe", domain: "stripe.com", slug: "stripe", source: "greenhouse", industry: "Fintech", stage: "Late Stage" },
  { name: "Notion", domain: "notion.so", slug: "notion", source: "greenhouse", industry: "Productivity", stage: "Late Stage" },
  { name: "Figma", domain: "figma.com", slug: "figma", source: "greenhouse", industry: "Design", stage: "Acquired" },
  { name: "Datadog", domain: "datadoghq.com", slug: "datadog", source: "greenhouse", industry: "DevOps", stage: "Public" },
  { name: "Plaid", domain: "plaid.com", slug: "plaid", source: "greenhouse", industry: "Fintech", stage: "Late Stage" },
  { name: "Ramp", domain: "ramp.com", slug: "ramp", source: "greenhouse", industry: "Fintech", stage: "Series D" },
  { name: "Brex", domain: "brex.com", slug: "brex", source: "greenhouse", industry: "Fintech", stage: "Late Stage" },

  // Growth Stage
  { name: "Linear", domain: "linear.app", slug: "linear", source: "greenhouse", industry: "Developer Tools", stage: "Series B" },
  { name: "Vercel", domain: "vercel.com", slug: "vercel", source: "greenhouse", industry: "Developer Tools", stage: "Series D" },
  { name: "Supabase", domain: "supabase.com", slug: "supabase", source: "greenhouse", industry: "Developer Tools", stage: "Series C" },
  { name: "Retool", domain: "retool.com", slug: "retool", source: "greenhouse", industry: "Developer Tools", stage: "Series C" },
  { name: "Loom", domain: "loom.com", slug: "loom", source: "greenhouse", industry: "Productivity", stage: "Acquired" },
  { name: "Webflow", domain: "webflow.com", slug: "webflow", source: "greenhouse", industry: "Web Development", stage: "Series C" },
  { name: "Airtable", domain: "airtable.com", slug: "airtable", source: "greenhouse", industry: "Productivity", stage: "Series F" },
  { name: "Miro", domain: "miro.com", slug: "miro", source: "greenhouse", industry: "Collaboration", stage: "Series C" },

  // Series A/B - High Growth
  { name: "Resend", domain: "resend.com", slug: "resend", source: "greenhouse", industry: "Developer Tools", stage: "Series A" },
  { name: "Loops", domain: "loops.so", slug: "loops", source: "greenhouse", industry: "Email", stage: "Series A" },
  { name: "Clerk", domain: "clerk.com", slug: "clerkdev", source: "greenhouse", industry: "Developer Tools", stage: "Series B" },
  { name: "Neon", domain: "neon.tech", slug: "neondatabase", source: "greenhouse", industry: "Database", stage: "Series B" },
  { name: "Railway", domain: "railway.app", slug: "railway", source: "greenhouse", industry: "Developer Tools", stage: "Series A" },
  { name: "Inngest", domain: "inngest.com", slug: "inngest", source: "greenhouse", industry: "Developer Tools", stage: "Series A" },

  // Lever companies
  { name: "Coinbase", domain: "coinbase.com", slug: "coinbase", source: "lever", industry: "Crypto", stage: "Public" },
  { name: "Netflix", domain: "netflix.com", slug: "netflix", source: "lever", industry: "Entertainment", stage: "Public" },
  { name: "Twitch", domain: "twitch.tv", slug: "twitch", source: "lever", industry: "Entertainment", stage: "Acquired" },
  { name: "Postman", domain: "postman.com", slug: "postman", source: "lever", industry: "Developer Tools", stage: "Series D" },

  // B2B SaaS
  { name: "HubSpot", domain: "hubspot.com", slug: "hubspot", source: "greenhouse", industry: "Marketing", stage: "Public" },
  { name: "Amplitude", domain: "amplitude.com", slug: "amplitude", source: "greenhouse", industry: "Analytics", stage: "Public" },
  { name: "Segment", domain: "segment.com", slug: "segment", source: "greenhouse", industry: "Data", stage: "Acquired" },
  { name: "LaunchDarkly", domain: "launchdarkly.com", slug: "launchdarkly", source: "greenhouse", industry: "Developer Tools", stage: "Series D" },
  { name: "PlanetScale", domain: "planetscale.com", slug: "planetscale", source: "greenhouse", industry: "Database", stage: "Series C" },

  // AI Companies
  { name: "Anthropic", domain: "anthropic.com", slug: "anthropic", source: "greenhouse", industry: "AI", stage: "Series D" },
  { name: "OpenAI", domain: "openai.com", slug: "openai", source: "greenhouse", industry: "AI", stage: "Late Stage" },
  { name: "Cohere", domain: "cohere.com", slug: "cohere", source: "greenhouse", industry: "AI", stage: "Series C" },
  { name: "Hugging Face", domain: "huggingface.co", slug: "huggingface", source: "greenhouse", industry: "AI", stage: "Series D" },
  { name: "Replicate", domain: "replicate.com", slug: "replicate", source: "greenhouse", industry: "AI", stage: "Series B" },
  { name: "Modal", domain: "modal.com", slug: "modal", source: "greenhouse", industry: "AI Infrastructure", stage: "Series A" },
  { name: "Perplexity", domain: "perplexity.ai", slug: "perplexityai", source: "greenhouse", industry: "AI", stage: "Series B" },
];

/**
 * Search companies by various criteria
 */
export function searchCompanies(query: string): Company[] {
  const lower = query.toLowerCase();

  return COMPANIES.filter((c) => {
    return (
      c.name.toLowerCase().includes(lower) ||
      c.domain.toLowerCase().includes(lower) ||
      c.industry.toLowerCase().includes(lower) ||
      c.stage.toLowerCase().includes(lower) ||
      (c.techStack && c.techStack.some((t) => t.toLowerCase().includes(lower)))
    );
  });
}

/**
 * Get companies by industry
 */
export function getCompaniesByIndustry(industry: string): Company[] {
  return COMPANIES.filter((c) => c.industry.toLowerCase() === industry.toLowerCase());
}

/**
 * Get companies by stage
 */
export function getCompaniesByStage(stage: string): Company[] {
  return COMPANIES.filter((c) => c.stage.toLowerCase().includes(stage.toLowerCase()));
}

/**
 * Get random sample of companies
 */
export function getRandomCompanies(count: number): Company[] {
  const shuffled = [...COMPANIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
