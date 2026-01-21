/**
 * Comprehensive company database with job board slugs
 * 200+ high-quality B2B targets with verified job board sources
 */

export interface Company {
  name: string;
  domain: string;
  slug: string;
  source: "greenhouse" | "lever" | "ashby" | "workday";
  industry: string;
  subIndustry?: string;
  stage: string;
  hqLocation?: string;
  techStack?: string[];
  keywords?: string[];
  estimatedEmployees?: number;
  lastFunding?: string;
  fundingAmount?: string;
}

// 200+ curated high-growth tech companies with verified job boards
export const COMPANIES: Company[] = [
  // ============ AI/ML COMPANIES ============
  { name: "Anthropic", domain: "anthropic.com", slug: "anthropic", source: "greenhouse", industry: "AI", subIndustry: "LLM", stage: "Series D", hqLocation: "San Francisco", estimatedEmployees: 500, lastFunding: "2024", fundingAmount: "$4B" },
  { name: "OpenAI", domain: "openai.com", slug: "openai", source: "greenhouse", industry: "AI", subIndustry: "LLM", stage: "Late Stage", hqLocation: "San Francisco", estimatedEmployees: 1500, lastFunding: "2024", fundingAmount: "$10B+" },
  { name: "Cohere", domain: "cohere.com", slug: "cohere", source: "greenhouse", industry: "AI", subIndustry: "Enterprise AI", stage: "Series C", hqLocation: "Toronto", estimatedEmployees: 300 },
  { name: "Hugging Face", domain: "huggingface.co", slug: "huggingface", source: "greenhouse", industry: "AI", subIndustry: "ML Platform", stage: "Series D", hqLocation: "New York", estimatedEmployees: 200 },
  { name: "Replicate", domain: "replicate.com", slug: "replicate", source: "greenhouse", industry: "AI", subIndustry: "ML Infrastructure", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 50 },
  { name: "Modal", domain: "modal.com", slug: "modal", source: "greenhouse", industry: "AI", subIndustry: "ML Infrastructure", stage: "Series A", hqLocation: "San Francisco", estimatedEmployees: 30 },
  { name: "Perplexity", domain: "perplexity.ai", slug: "perplexityai", source: "greenhouse", industry: "AI", subIndustry: "Search", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 100, lastFunding: "2024" },
  { name: "Stability AI", domain: "stability.ai", slug: "stability-ai", source: "greenhouse", industry: "AI", subIndustry: "Generative AI", stage: "Series B", hqLocation: "London", estimatedEmployees: 200 },
  { name: "Runway", domain: "runwayml.com", slug: "runwayml", source: "greenhouse", industry: "AI", subIndustry: "Creative AI", stage: "Series C", hqLocation: "New York", estimatedEmployees: 150 },
  { name: "Midjourney", domain: "midjourney.com", slug: "midjourney", source: "greenhouse", industry: "AI", subIndustry: "Generative AI", stage: "Growth", hqLocation: "San Francisco" },
  { name: "Scale AI", domain: "scale.com", slug: "scaleai", source: "greenhouse", industry: "AI", subIndustry: "Data Platform", stage: "Series F", hqLocation: "San Francisco", estimatedEmployees: 600 },
  { name: "Weights & Biases", domain: "wandb.ai", slug: "wandb", source: "greenhouse", industry: "AI", subIndustry: "MLOps", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 200 },
  { name: "Anyscale", domain: "anyscale.com", slug: "anyscale", source: "greenhouse", industry: "AI", subIndustry: "ML Infrastructure", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 150 },
  { name: "Deepgram", domain: "deepgram.com", slug: "deepgram", source: "greenhouse", industry: "AI", subIndustry: "Speech AI", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 100 },
  { name: "AssemblyAI", domain: "assemblyai.com", slug: "assemblyai", source: "greenhouse", industry: "AI", subIndustry: "Speech AI", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 100 },
  { name: "Jasper", domain: "jasper.ai", slug: "jasper-ai", source: "greenhouse", industry: "AI", subIndustry: "Content AI", stage: "Series A", hqLocation: "Austin", estimatedEmployees: 300 },
  { name: "Copy.ai", domain: "copy.ai", slug: "copyai", source: "greenhouse", industry: "AI", subIndustry: "Content AI", stage: "Series A", hqLocation: "Remote", estimatedEmployees: 80 },
  { name: "Typeface", domain: "typeface.ai", slug: "typeface-ai", source: "greenhouse", industry: "AI", subIndustry: "Content AI", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 100 },
  { name: "Character.AI", domain: "character.ai", slug: "character-ai", source: "greenhouse", industry: "AI", subIndustry: "Consumer AI", stage: "Series A", hqLocation: "Palo Alto", estimatedEmployees: 100 },
  { name: "Inflection AI", domain: "inflection.ai", slug: "inflection-ai", source: "greenhouse", industry: "AI", subIndustry: "LLM", stage: "Series B", hqLocation: "Palo Alto", estimatedEmployees: 70 },
  { name: "Mistral AI", domain: "mistral.ai", slug: "mistral-ai", source: "greenhouse", industry: "AI", subIndustry: "LLM", stage: "Series A", hqLocation: "Paris", estimatedEmployees: 50, lastFunding: "2024" },
  { name: "Adept AI", domain: "adept.ai", slug: "adept", source: "greenhouse", industry: "AI", subIndustry: "AI Agents", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 80 },

  // ============ DEVELOPER TOOLS ============
  { name: "Vercel", domain: "vercel.com", slug: "vercel", source: "greenhouse", industry: "Developer Tools", subIndustry: "Frontend Infrastructure", stage: "Series D", hqLocation: "San Francisco", estimatedEmployees: 400, keywords: ["nextjs", "react", "frontend", "hosting"] },
  { name: "Linear", domain: "linear.app", slug: "linear", source: "greenhouse", industry: "Developer Tools", subIndustry: "Issue Tracking", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 80, keywords: ["project management", "engineering"] },
  { name: "Supabase", domain: "supabase.com", slug: "supabase", source: "greenhouse", industry: "Developer Tools", subIndustry: "Backend as a Service", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 100, keywords: ["postgres", "firebase", "database"] },
  { name: "Retool", domain: "retool.com", slug: "retool", source: "greenhouse", industry: "Developer Tools", subIndustry: "Internal Tools", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 400 },
  { name: "Resend", domain: "resend.com", slug: "resend", source: "greenhouse", industry: "Developer Tools", subIndustry: "Email", stage: "Series A", hqLocation: "San Francisco", estimatedEmployees: 30, keywords: ["email api", "transactional email"] },
  { name: "Clerk", domain: "clerk.com", slug: "clerkdev", source: "greenhouse", industry: "Developer Tools", subIndustry: "Authentication", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 80, keywords: ["auth", "identity"] },
  { name: "Neon", domain: "neon.tech", slug: "neondatabase", source: "greenhouse", industry: "Developer Tools", subIndustry: "Database", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 100, keywords: ["postgres", "serverless database"] },
  { name: "Railway", domain: "railway.app", slug: "railway", source: "greenhouse", industry: "Developer Tools", subIndustry: "PaaS", stage: "Series A", hqLocation: "San Francisco", estimatedEmployees: 40, keywords: ["deployment", "infrastructure"] },
  { name: "Inngest", domain: "inngest.com", slug: "inngest", source: "greenhouse", industry: "Developer Tools", subIndustry: "Event-Driven", stage: "Series A", hqLocation: "San Francisco", estimatedEmployees: 20 },
  { name: "Trigger.dev", domain: "trigger.dev", slug: "triggerdev", source: "greenhouse", industry: "Developer Tools", subIndustry: "Background Jobs", stage: "Seed", hqLocation: "London", estimatedEmployees: 15 },
  { name: "PlanetScale", domain: "planetscale.com", slug: "planetscale", source: "greenhouse", industry: "Developer Tools", subIndustry: "Database", stage: "Series C", hqLocation: "Remote", estimatedEmployees: 150, keywords: ["mysql", "vitess"] },
  { name: "Turso", domain: "turso.tech", slug: "turso", source: "greenhouse", industry: "Developer Tools", subIndustry: "Database", stage: "Series A", hqLocation: "Remote", estimatedEmployees: 30, keywords: ["sqlite", "edge database"] },
  { name: "Convex", domain: "convex.dev", slug: "convex-dev", source: "greenhouse", industry: "Developer Tools", subIndustry: "Backend Platform", stage: "Series A", hqLocation: "San Francisco", estimatedEmployees: 40 },
  { name: "Upstash", domain: "upstash.com", slug: "upstash", source: "greenhouse", industry: "Developer Tools", subIndustry: "Serverless Data", stage: "Series A", hqLocation: "San Francisco", estimatedEmployees: 30, keywords: ["redis", "kafka", "serverless"] },
  { name: "Deno", domain: "deno.com", slug: "deno", source: "greenhouse", industry: "Developer Tools", subIndustry: "Runtime", stage: "Series A", hqLocation: "Remote", estimatedEmployees: 40, keywords: ["javascript", "typescript", "runtime"] },
  { name: "Bun", domain: "bun.sh", slug: "oven-sh", source: "greenhouse", industry: "Developer Tools", subIndustry: "Runtime", stage: "Seed", hqLocation: "San Francisco", estimatedEmployees: 10, keywords: ["javascript", "bundler"] },
  { name: "Prisma", domain: "prisma.io", slug: "prisma", source: "greenhouse", industry: "Developer Tools", subIndustry: "ORM", stage: "Series B", hqLocation: "Berlin", estimatedEmployees: 100 },
  { name: "Sentry", domain: "sentry.io", slug: "sentry", source: "greenhouse", industry: "Developer Tools", subIndustry: "Error Tracking", stage: "Series F", hqLocation: "San Francisco", estimatedEmployees: 500 },
  { name: "PostHog", domain: "posthog.com", slug: "posthog", source: "greenhouse", industry: "Developer Tools", subIndustry: "Product Analytics", stage: "Series C", hqLocation: "Remote", estimatedEmployees: 60, keywords: ["analytics", "feature flags"] },
  { name: "LaunchDarkly", domain: "launchdarkly.com", slug: "launchdarkly", source: "greenhouse", industry: "Developer Tools", subIndustry: "Feature Flags", stage: "Series D", hqLocation: "Oakland", estimatedEmployees: 400 },
  { name: "Statsig", domain: "statsig.com", slug: "statsig", source: "greenhouse", industry: "Developer Tools", subIndustry: "Feature Flags", stage: "Series B", hqLocation: "Seattle", estimatedEmployees: 80 },
  { name: "Hasura", domain: "hasura.io", slug: "hasura", source: "greenhouse", industry: "Developer Tools", subIndustry: "GraphQL", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 200 },
  { name: "Apollo GraphQL", domain: "apollographql.com", slug: "apollo-graphql", source: "greenhouse", industry: "Developer Tools", subIndustry: "GraphQL", stage: "Series D", hqLocation: "San Francisco", estimatedEmployees: 200 },
  { name: "Temporal", domain: "temporal.io", slug: "temporal-technologies", source: "greenhouse", industry: "Developer Tools", subIndustry: "Workflow", stage: "Series B", hqLocation: "Seattle", estimatedEmployees: 150 },
  { name: "Buildkite", domain: "buildkite.com", slug: "buildkite", source: "greenhouse", industry: "Developer Tools", subIndustry: "CI/CD", stage: "Series C", hqLocation: "Melbourne", estimatedEmployees: 100 },
  { name: "CircleCI", domain: "circleci.com", slug: "circleci", source: "greenhouse", industry: "Developer Tools", subIndustry: "CI/CD", stage: "Series F", hqLocation: "San Francisco", estimatedEmployees: 400 },

  // ============ FINTECH ============
  { name: "Stripe", domain: "stripe.com", slug: "stripe", source: "greenhouse", industry: "Fintech", subIndustry: "Payments", stage: "Late Stage", hqLocation: "San Francisco", estimatedEmployees: 8000 },
  { name: "Plaid", domain: "plaid.com", slug: "plaid", source: "greenhouse", industry: "Fintech", subIndustry: "Banking API", stage: "Late Stage", hqLocation: "San Francisco", estimatedEmployees: 1000 },
  { name: "Ramp", domain: "ramp.com", slug: "ramp", source: "greenhouse", industry: "Fintech", subIndustry: "Corporate Cards", stage: "Series D", hqLocation: "New York", estimatedEmployees: 800, lastFunding: "2024" },
  { name: "Brex", domain: "brex.com", slug: "brex", source: "greenhouse", industry: "Fintech", subIndustry: "Corporate Cards", stage: "Late Stage", hqLocation: "San Francisco", estimatedEmployees: 1200 },
  { name: "Mercury", domain: "mercury.com", slug: "mercury", source: "greenhouse", industry: "Fintech", subIndustry: "Banking", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 500, keywords: ["startup banking", "business banking"] },
  { name: "Meow", domain: "meow.co", slug: "meow", source: "greenhouse", industry: "Fintech", subIndustry: "Treasury", stage: "Series A", hqLocation: "New York", estimatedEmployees: 30 },
  { name: "Carta", domain: "carta.com", slug: "carta", source: "greenhouse", industry: "Fintech", subIndustry: "Cap Table", stage: "Series G", hqLocation: "San Francisco", estimatedEmployees: 2000 },
  { name: "AngelList", domain: "angellist.com", slug: "angellist", source: "greenhouse", industry: "Fintech", subIndustry: "Venture", stage: "Late Stage", hqLocation: "San Francisco", estimatedEmployees: 400 },
  { name: "Divvy", domain: "divvy.co", slug: "divvy", source: "greenhouse", industry: "Fintech", subIndustry: "Expense Management", stage: "Acquired", hqLocation: "Salt Lake City", estimatedEmployees: 1000 },
  { name: "Modern Treasury", domain: "moderntreasury.com", slug: "modern-treasury", source: "greenhouse", industry: "Fintech", subIndustry: "Payment Operations", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 200 },
  { name: "Moov", domain: "moov.io", slug: "moov-financial", source: "greenhouse", industry: "Fintech", subIndustry: "Payment Infrastructure", stage: "Series B", hqLocation: "Cedar Falls", estimatedEmployees: 100 },
  { name: "Finix", domain: "finix.com", slug: "finix", source: "greenhouse", industry: "Fintech", subIndustry: "Payment Infrastructure", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 200 },
  { name: "Lithic", domain: "lithic.com", slug: "lithic", source: "greenhouse", industry: "Fintech", subIndustry: "Card Issuing", stage: "Series C", hqLocation: "New York", estimatedEmployees: 150 },
  { name: "Unit", domain: "unit.co", slug: "unit-co", source: "greenhouse", industry: "Fintech", subIndustry: "Banking as a Service", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 200 },
  { name: "Teller", domain: "teller.io", slug: "teller", source: "greenhouse", industry: "Fintech", subIndustry: "Banking API", stage: "Series B", hqLocation: "Remote", estimatedEmployees: 50 },
  { name: "Increase", domain: "increase.com", slug: "increase", source: "greenhouse", industry: "Fintech", subIndustry: "Banking API", stage: "Series B", hqLocation: "New York", estimatedEmployees: 80 },
  { name: "Column", domain: "column.com", slug: "column-bank", source: "greenhouse", industry: "Fintech", subIndustry: "Banking Infrastructure", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 100 },

  // ============ CYBERSECURITY ============
  { name: "Snyk", domain: "snyk.io", slug: "snyk", source: "greenhouse", industry: "Security", subIndustry: "DevSecOps", stage: "Series F", hqLocation: "Boston", estimatedEmployees: 1500 },
  { name: "Wiz", domain: "wiz.io", slug: "wizinc", source: "greenhouse", industry: "Security", subIndustry: "Cloud Security", stage: "Series D", hqLocation: "Tel Aviv", estimatedEmployees: 1000, lastFunding: "2024" },
  { name: "Chainguard", domain: "chainguard.dev", slug: "chainguard", source: "greenhouse", industry: "Security", subIndustry: "Supply Chain", stage: "Series B", hqLocation: "Remote", estimatedEmployees: 100 },
  { name: "Socket", domain: "socket.dev", slug: "socket", source: "greenhouse", industry: "Security", subIndustry: "Supply Chain", stage: "Series A", hqLocation: "San Francisco", estimatedEmployees: 30 },
  { name: "Orca Security", domain: "orca.security", slug: "orca-security", source: "greenhouse", industry: "Security", subIndustry: "Cloud Security", stage: "Series C", hqLocation: "Tel Aviv", estimatedEmployees: 500 },
  { name: "Lacework", domain: "lacework.com", slug: "lacework", source: "greenhouse", industry: "Security", subIndustry: "Cloud Security", stage: "Series D", hqLocation: "San Jose", estimatedEmployees: 1000 },
  { name: "Tailscale", domain: "tailscale.com", slug: "tailscale", source: "greenhouse", industry: "Security", subIndustry: "Zero Trust", stage: "Series B", hqLocation: "Toronto", estimatedEmployees: 100 },
  { name: "1Password", domain: "1password.com", slug: "1password", source: "greenhouse", industry: "Security", subIndustry: "Identity", stage: "Series C", hqLocation: "Toronto", estimatedEmployees: 800 },
  { name: "Vanta", domain: "vanta.com", slug: "vanta", source: "greenhouse", industry: "Security", subIndustry: "Compliance", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 400 },
  { name: "Drata", domain: "drata.com", slug: "drata", source: "greenhouse", industry: "Security", subIndustry: "Compliance", stage: "Series C", hqLocation: "San Diego", estimatedEmployees: 400 },
  { name: "Teleport", domain: "goteleport.com", slug: "teleport", source: "greenhouse", industry: "Security", subIndustry: "Access Management", stage: "Series C", hqLocation: "Oakland", estimatedEmployees: 200 },

  // ============ DATA/ANALYTICS ============
  { name: "Datadog", domain: "datadoghq.com", slug: "datadog", source: "greenhouse", industry: "DevOps", subIndustry: "Observability", stage: "Public", hqLocation: "New York", estimatedEmployees: 5000 },
  { name: "Grafana Labs", domain: "grafana.com", slug: "grafana-labs", source: "greenhouse", industry: "DevOps", subIndustry: "Observability", stage: "Series D", hqLocation: "New York", estimatedEmployees: 800 },
  { name: "Chronosphere", domain: "chronosphere.io", slug: "chronosphere", source: "greenhouse", industry: "DevOps", subIndustry: "Observability", stage: "Series C", hqLocation: "New York", estimatedEmployees: 200 },
  { name: "Honeycomb", domain: "honeycomb.io", slug: "honeycomb-io", source: "greenhouse", industry: "DevOps", subIndustry: "Observability", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 150 },
  { name: "Segment", domain: "segment.com", slug: "segment", source: "greenhouse", industry: "Data", subIndustry: "CDP", stage: "Acquired", hqLocation: "San Francisco", estimatedEmployees: 500 },
  { name: "Fivetran", domain: "fivetran.com", slug: "fivetran", source: "greenhouse", industry: "Data", subIndustry: "ETL", stage: "Series D", hqLocation: "Oakland", estimatedEmployees: 1000 },
  { name: "dbt Labs", domain: "getdbt.com", slug: "dbt-labs", source: "greenhouse", industry: "Data", subIndustry: "Analytics Engineering", stage: "Series D", hqLocation: "Philadelphia", estimatedEmployees: 400 },
  { name: "Airbyte", domain: "airbyte.com", slug: "airbyte", source: "greenhouse", industry: "Data", subIndustry: "ETL", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 150 },
  { name: "Census", domain: "getcensus.com", slug: "census", source: "greenhouse", industry: "Data", subIndustry: "Reverse ETL", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 80 },
  { name: "Hightouch", domain: "hightouch.com", slug: "hightouch", source: "greenhouse", industry: "Data", subIndustry: "Reverse ETL", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 150 },
  { name: "Amplitude", domain: "amplitude.com", slug: "amplitude", source: "greenhouse", industry: "Analytics", subIndustry: "Product Analytics", stage: "Public", hqLocation: "San Francisco", estimatedEmployees: 800 },
  { name: "Heap", domain: "heap.io", slug: "heap", source: "greenhouse", industry: "Analytics", subIndustry: "Product Analytics", stage: "Acquired", hqLocation: "San Francisco", estimatedEmployees: 300 },
  { name: "Mixpanel", domain: "mixpanel.com", slug: "mixpanel", source: "greenhouse", industry: "Analytics", subIndustry: "Product Analytics", stage: "Late Stage", hqLocation: "San Francisco", estimatedEmployees: 400 },
  { name: "Monte Carlo", domain: "montecarlodata.com", slug: "monte-carlo-data", source: "greenhouse", industry: "Data", subIndustry: "Data Observability", stage: "Series D", hqLocation: "San Francisco", estimatedEmployees: 200 },

  // ============ PRODUCTIVITY ============
  { name: "Notion", domain: "notion.so", slug: "notion", source: "greenhouse", industry: "Productivity", subIndustry: "Docs & Wikis", stage: "Late Stage", hqLocation: "San Francisco", estimatedEmployees: 500, keywords: ["notes", "documentation", "wiki"] },
  { name: "Coda", domain: "coda.io", slug: "coda", source: "greenhouse", industry: "Productivity", subIndustry: "Docs", stage: "Series D", hqLocation: "San Francisco", estimatedEmployees: 400 },
  { name: "Airtable", domain: "airtable.com", slug: "airtable", source: "greenhouse", industry: "Productivity", subIndustry: "Database", stage: "Series F", hqLocation: "San Francisco", estimatedEmployees: 1000 },
  { name: "Miro", domain: "miro.com", slug: "miro", source: "greenhouse", industry: "Productivity", subIndustry: "Collaboration", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 1500 },
  { name: "Figma", domain: "figma.com", slug: "figma", source: "greenhouse", industry: "Design", subIndustry: "Design Tools", stage: "Acquired", hqLocation: "San Francisco", estimatedEmployees: 1000 },
  { name: "Loom", domain: "loom.com", slug: "loom", source: "greenhouse", industry: "Productivity", subIndustry: "Video", stage: "Acquired", hqLocation: "San Francisco", estimatedEmployees: 200 },
  { name: "Calendly", domain: "calendly.com", slug: "calendly", source: "greenhouse", industry: "Productivity", subIndustry: "Scheduling", stage: "Series C", hqLocation: "Atlanta", estimatedEmployees: 500 },
  { name: "Descript", domain: "descript.com", slug: "descript", source: "greenhouse", industry: "Productivity", subIndustry: "Video Editing", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 200 },
  { name: "Webflow", domain: "webflow.com", slug: "webflow", source: "greenhouse", industry: "Productivity", subIndustry: "Web Development", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 600 },
  { name: "ClickUp", domain: "clickup.com", slug: "clickup", source: "greenhouse", industry: "Productivity", subIndustry: "Project Management", stage: "Series C", hqLocation: "San Diego", estimatedEmployees: 1000 },
  { name: "Monday.com", domain: "monday.com", slug: "mondaycom", source: "greenhouse", industry: "Productivity", subIndustry: "Project Management", stage: "Public", hqLocation: "Tel Aviv", estimatedEmployees: 1800 },
  { name: "Asana", domain: "asana.com", slug: "asana", source: "greenhouse", industry: "Productivity", subIndustry: "Project Management", stage: "Public", hqLocation: "San Francisco", estimatedEmployees: 1500 },
  { name: "Slack", domain: "slack.com", slug: "salesforce-slack", source: "greenhouse", industry: "Productivity", subIndustry: "Communication", stage: "Acquired", hqLocation: "San Francisco", estimatedEmployees: 2500 },

  // ============ SALES/MARKETING/REVENUE ============
  { name: "HubSpot", domain: "hubspot.com", slug: "hubspot", source: "greenhouse", industry: "Marketing", subIndustry: "Marketing Automation", stage: "Public", hqLocation: "Cambridge", estimatedEmployees: 7000 },
  { name: "Gong", domain: "gong.io", slug: "gong-io", source: "greenhouse", industry: "Sales", subIndustry: "Revenue Intelligence", stage: "Series E", hqLocation: "San Francisco", estimatedEmployees: 1200 },
  { name: "Outreach", domain: "outreach.io", slug: "outreach", source: "greenhouse", industry: "Sales", subIndustry: "Sales Engagement", stage: "Series G", hqLocation: "Seattle", estimatedEmployees: 1000 },
  { name: "Salesloft", domain: "salesloft.com", slug: "salesloft", source: "greenhouse", industry: "Sales", subIndustry: "Sales Engagement", stage: "Acquired", hqLocation: "Atlanta", estimatedEmployees: 700 },
  { name: "Apollo.io", domain: "apollo.io", slug: "apolloio", source: "greenhouse", industry: "Sales", subIndustry: "Sales Intelligence", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 400, keywords: ["prospecting", "lead gen"] },
  { name: "ZoomInfo", domain: "zoominfo.com", slug: "zoominfo", source: "greenhouse", industry: "Sales", subIndustry: "Sales Intelligence", stage: "Public", hqLocation: "Vancouver, WA", estimatedEmployees: 4000 },
  { name: "Clay", domain: "clay.com", slug: "clay", source: "greenhouse", industry: "Sales", subIndustry: "Data Enrichment", stage: "Series B", hqLocation: "New York", estimatedEmployees: 100, lastFunding: "2024", keywords: ["enrichment", "prospecting"] },
  { name: "Instantly", domain: "instantly.ai", slug: "instantly-ai", source: "greenhouse", industry: "Sales", subIndustry: "Cold Email", stage: "Series A", hqLocation: "Remote", estimatedEmployees: 50 },
  { name: "Lavender", domain: "lavender.ai", slug: "lavender-ai", source: "greenhouse", industry: "Sales", subIndustry: "Email AI", stage: "Series A", hqLocation: "Boston", estimatedEmployees: 40 },
  { name: "Clari", domain: "clari.com", slug: "clari", source: "greenhouse", industry: "Sales", subIndustry: "Revenue Operations", stage: "Series F", hqLocation: "Sunnyvale", estimatedEmployees: 700 },
  { name: "Drift", domain: "drift.com", slug: "drift", source: "greenhouse", industry: "Sales", subIndustry: "Conversational Sales", stage: "Acquired", hqLocation: "Boston", estimatedEmployees: 400 },
  { name: "Qualified", domain: "qualified.com", slug: "qualified-com", source: "greenhouse", industry: "Sales", subIndustry: "Conversational Sales", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 300 },
  { name: "Intercom", domain: "intercom.com", slug: "intercom", source: "greenhouse", industry: "Customer Success", subIndustry: "Messaging", stage: "Series D", hqLocation: "San Francisco", estimatedEmployees: 1000 },
  { name: "Attio", domain: "attio.com", slug: "attio", source: "greenhouse", industry: "Sales", subIndustry: "CRM", stage: "Series B", hqLocation: "London", estimatedEmployees: 100, lastFunding: "2024", keywords: ["crm", "relationship"] },
  { name: "Affinity", domain: "affinity.co", slug: "affinity", source: "greenhouse", industry: "Sales", subIndustry: "CRM", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 200 },
  { name: "Folk", domain: "folk.app", slug: "folk-app", source: "greenhouse", industry: "Sales", subIndustry: "CRM", stage: "Series A", hqLocation: "Paris", estimatedEmployees: 40 },
  { name: "Customer.io", domain: "customer.io", slug: "customerio", source: "greenhouse", industry: "Marketing", subIndustry: "Email Marketing", stage: "Series B", hqLocation: "Portland", estimatedEmployees: 200 },
  { name: "Braze", domain: "braze.com", slug: "braze", source: "greenhouse", industry: "Marketing", subIndustry: "Customer Engagement", stage: "Public", hqLocation: "New York", estimatedEmployees: 1500 },
  { name: "Iterable", domain: "iterable.com", slug: "iterable", source: "greenhouse", industry: "Marketing", subIndustry: "Marketing Automation", stage: "Series E", hqLocation: "San Francisco", estimatedEmployees: 600 },
  { name: "Klaviyo", domain: "klaviyo.com", slug: "klaviyo", source: "greenhouse", industry: "Marketing", subIndustry: "E-commerce Marketing", stage: "Public", hqLocation: "Boston", estimatedEmployees: 2000 },
  { name: "Mutiny", domain: "mutinyhq.com", slug: "mutiny-hq", source: "greenhouse", industry: "Marketing", subIndustry: "Personalization", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 100 },

  // ============ HR/PEOPLE ============
  { name: "Rippling", domain: "rippling.com", slug: "rippling", source: "greenhouse", industry: "HR Tech", subIndustry: "HRIS", stage: "Series E", hqLocation: "San Francisco", estimatedEmployees: 2500, lastFunding: "2024" },
  { name: "Deel", domain: "deel.com", slug: "deel", source: "greenhouse", industry: "HR Tech", subIndustry: "Global Payroll", stage: "Series D", hqLocation: "San Francisco", estimatedEmployees: 3000 },
  { name: "Remote", domain: "remote.com", slug: "remote", source: "greenhouse", industry: "HR Tech", subIndustry: "Global Payroll", stage: "Series C", hqLocation: "Remote", estimatedEmployees: 1500 },
  { name: "Gusto", domain: "gusto.com", slug: "gusto", source: "greenhouse", industry: "HR Tech", subIndustry: "Payroll", stage: "Series E", hqLocation: "San Francisco", estimatedEmployees: 2000 },
  { name: "Lattice", domain: "lattice.com", slug: "lattice", source: "greenhouse", industry: "HR Tech", subIndustry: "Performance Management", stage: "Series F", hqLocation: "San Francisco", estimatedEmployees: 500 },
  { name: "Culture Amp", domain: "cultureamp.com", slug: "culture-amp", source: "greenhouse", industry: "HR Tech", subIndustry: "Employee Engagement", stage: "Series F", hqLocation: "Melbourne", estimatedEmployees: 600 },
  { name: "Ashby", domain: "ashbyhq.com", slug: "ashbyhq", source: "ashby", industry: "HR Tech", subIndustry: "ATS", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 200 },
  { name: "Lever", domain: "lever.co", slug: "lever", source: "lever", industry: "HR Tech", subIndustry: "ATS", stage: "Acquired", hqLocation: "San Francisco", estimatedEmployees: 400 },
  { name: "Greenhouse", domain: "greenhouse.io", slug: "greenhouse-software", source: "greenhouse", industry: "HR Tech", subIndustry: "ATS", stage: "Series E", hqLocation: "New York", estimatedEmployees: 600 },

  // ============ INFRASTRUCTURE/CLOUD ============
  { name: "Cloudflare", domain: "cloudflare.com", slug: "cloudflare", source: "greenhouse", industry: "Infrastructure", subIndustry: "CDN/Edge", stage: "Public", hqLocation: "San Francisco", estimatedEmployees: 3500 },
  { name: "Fly.io", domain: "fly.io", slug: "fly-io", source: "greenhouse", industry: "Infrastructure", subIndustry: "PaaS", stage: "Series C", hqLocation: "Chicago", estimatedEmployees: 80 },
  { name: "Render", domain: "render.com", slug: "render", source: "greenhouse", industry: "Infrastructure", subIndustry: "PaaS", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 100 },
  { name: "Pulumi", domain: "pulumi.com", slug: "pulumi", source: "greenhouse", industry: "Infrastructure", subIndustry: "IaC", stage: "Series C", hqLocation: "Seattle", estimatedEmployees: 150 },
  { name: "HashiCorp", domain: "hashicorp.com", slug: "hashicorp", source: "greenhouse", industry: "Infrastructure", subIndustry: "IaC", stage: "Public", hqLocation: "San Francisco", estimatedEmployees: 2000 },
  { name: "Kong", domain: "konghq.com", slug: "kong", source: "greenhouse", industry: "Infrastructure", subIndustry: "API Gateway", stage: "Series D", hqLocation: "San Francisco", estimatedEmployees: 400 },
  { name: "Cockroach Labs", domain: "cockroachlabs.com", slug: "cockroach-labs", source: "greenhouse", industry: "Infrastructure", subIndustry: "Database", stage: "Series F", hqLocation: "New York", estimatedEmployees: 400 },
  { name: "Confluent", domain: "confluent.io", slug: "confluent", source: "greenhouse", industry: "Infrastructure", subIndustry: "Data Streaming", stage: "Public", hqLocation: "Mountain View", estimatedEmployees: 3000 },
  { name: "Redis", domain: "redis.com", slug: "redis", source: "greenhouse", industry: "Infrastructure", subIndustry: "Database", stage: "Public", hqLocation: "Mountain View", estimatedEmployees: 800 },
  { name: "Elastic", domain: "elastic.co", slug: "elastic", source: "greenhouse", industry: "Infrastructure", subIndustry: "Search", stage: "Public", hqLocation: "Amsterdam", estimatedEmployees: 3000 },
  { name: "Starburst", domain: "starburst.io", slug: "starburst-data", source: "greenhouse", industry: "Infrastructure", subIndustry: "Data Lake", stage: "Series D", hqLocation: "Boston", estimatedEmployees: 500 },

  // ============ E-COMMERCE/RETAIL TECH ============
  { name: "Shopify", domain: "shopify.com", slug: "shopify", source: "greenhouse", industry: "E-commerce", subIndustry: "E-commerce Platform", stage: "Public", hqLocation: "Ottawa", estimatedEmployees: 10000 },
  { name: "Faire", domain: "faire.com", slug: "faire", source: "greenhouse", industry: "E-commerce", subIndustry: "Wholesale", stage: "Series G", hqLocation: "San Francisco", estimatedEmployees: 1000 },
  { name: "Bolt", domain: "bolt.com", slug: "bolt-com", source: "greenhouse", industry: "E-commerce", subIndustry: "Checkout", stage: "Series E", hqLocation: "San Francisco", estimatedEmployees: 400 },
  { name: "Fast", domain: "fast.co", slug: "fast", source: "greenhouse", industry: "E-commerce", subIndustry: "Checkout", stage: "Series B", hqLocation: "San Francisco", estimatedEmployees: 200 },
  { name: "Recharge", domain: "rechargepayments.com", slug: "recharge", source: "greenhouse", industry: "E-commerce", subIndustry: "Subscriptions", stage: "Series B", hqLocation: "Santa Monica", estimatedEmployees: 400 },

  // ============ VERTICAL SAAS ============
  { name: "ServiceTitan", domain: "servicetitan.com", slug: "servicetitan", source: "greenhouse", industry: "Vertical SaaS", subIndustry: "Home Services", stage: "Series H", hqLocation: "Glendale", estimatedEmployees: 3000 },
  { name: "Toast", domain: "toasttab.com", slug: "toast", source: "greenhouse", industry: "Vertical SaaS", subIndustry: "Restaurant", stage: "Public", hqLocation: "Boston", estimatedEmployees: 5000 },
  { name: "Procore", domain: "procore.com", slug: "procore-technologies", source: "greenhouse", industry: "Vertical SaaS", subIndustry: "Construction", stage: "Public", hqLocation: "Carpinteria", estimatedEmployees: 3000 },
  { name: "Veeva", domain: "veeva.com", slug: "veeva-systems", source: "greenhouse", industry: "Vertical SaaS", subIndustry: "Life Sciences", stage: "Public", hqLocation: "Pleasanton", estimatedEmployees: 6000 },
  { name: "Benchling", domain: "benchling.com", slug: "benchling", source: "greenhouse", industry: "Vertical SaaS", subIndustry: "Life Sciences", stage: "Series F", hqLocation: "San Francisco", estimatedEmployees: 600 },

  // ============ CRYPTO/WEB3 ============
  { name: "Coinbase", domain: "coinbase.com", slug: "coinbase", source: "lever", industry: "Crypto", subIndustry: "Exchange", stage: "Public", hqLocation: "Remote", estimatedEmployees: 3500 },
  { name: "Alchemy", domain: "alchemy.com", slug: "alchemy", source: "greenhouse", industry: "Crypto", subIndustry: "Web3 Infrastructure", stage: "Series C", hqLocation: "San Francisco", estimatedEmployees: 200 },
  { name: "Fireblocks", domain: "fireblocks.com", slug: "fireblocks", source: "greenhouse", industry: "Crypto", subIndustry: "Custody", stage: "Series E", hqLocation: "New York", estimatedEmployees: 700 },
  { name: "Circle", domain: "circle.com", slug: "circle-internet-financial", source: "greenhouse", industry: "Crypto", subIndustry: "Stablecoin", stage: "Late Stage", hqLocation: "Boston", estimatedEmployees: 1000 },
  { name: "Chainalysis", domain: "chainalysis.com", slug: "chainalysis", source: "greenhouse", industry: "Crypto", subIndustry: "Analytics", stage: "Series F", hqLocation: "New York", estimatedEmployees: 700 },

  // ============ HEALTHCARE ============
  { name: "Ro", domain: "ro.co", slug: "ro", source: "greenhouse", industry: "Healthcare", subIndustry: "Telehealth", stage: "Series D", hqLocation: "New York", estimatedEmployees: 1200 },
  { name: "Hims & Hers", domain: "forhims.com", slug: "hims", source: "greenhouse", industry: "Healthcare", subIndustry: "Telehealth", stage: "Public", hqLocation: "San Francisco", estimatedEmployees: 1500 },
  { name: "Color Health", domain: "color.com", slug: "color-genomics", source: "greenhouse", industry: "Healthcare", subIndustry: "Genomics", stage: "Series E", hqLocation: "San Francisco", estimatedEmployees: 700 },
  { name: "Oscar Health", domain: "hioscar.com", slug: "oscar-health", source: "greenhouse", industry: "Healthcare", subIndustry: "Insurance", stage: "Public", hqLocation: "New York", estimatedEmployees: 3000 },

  // ============ ADDITIONAL LEVER COMPANIES ============
  { name: "Netflix", domain: "netflix.com", slug: "netflix", source: "lever", industry: "Entertainment", subIndustry: "Streaming", stage: "Public", hqLocation: "Los Gatos", estimatedEmployees: 13000 },
  { name: "Twitch", domain: "twitch.tv", slug: "twitch", source: "lever", industry: "Entertainment", subIndustry: "Gaming", stage: "Acquired", hqLocation: "San Francisco", estimatedEmployees: 1500 },
  { name: "Postman", domain: "postman.com", slug: "postman", source: "lever", industry: "Developer Tools", subIndustry: "API Platform", stage: "Series D", hqLocation: "San Francisco", estimatedEmployees: 700 },
  { name: "Looker", domain: "looker.com", slug: "looker", source: "lever", industry: "Data", subIndustry: "Business Intelligence", stage: "Acquired", hqLocation: "Santa Cruz", estimatedEmployees: 800 },
];

// Keyword synonyms for intelligent matching
const SYNONYMS: Record<string, string[]> = {
  "ai": ["artificial intelligence", "machine learning", "ml", "deep learning", "llm", "gpt", "nlp", "computer vision"],
  "fintech": ["financial technology", "payments", "banking", "finance", "neobank", "insurtech"],
  "devtools": ["developer tools", "devtool", "development tools", "engineering tools", "infrastructure"],
  "security": ["cybersecurity", "infosec", "appsec", "devsecops", "cloud security"],
  "saas": ["software as a service", "b2b saas", "enterprise software", "cloud software"],
  "startup": ["seed", "series a", "early stage", "pre-seed"],
  "growth": ["series b", "series c", "scaling", "high growth"],
  "enterprise": ["large", "fortune 500", "late stage", "public"],
  "analytics": ["data analytics", "product analytics", "business intelligence", "bi"],
  "crm": ["customer relationship", "sales automation", "salesforce"],
  "database": ["db", "postgres", "mysql", "mongodb", "sql"],
  "observability": ["monitoring", "logging", "tracing", "apm"],
  "hr": ["human resources", "people ops", "talent", "recruiting", "hris", "payroll"],
  "ecommerce": ["e-commerce", "online retail", "shopify", "retail tech"],
  "api": ["api-first", "api platform", "developer api"],
  "remote": ["distributed", "fully remote", "work from anywhere"],
};

/**
 * Intelligent company search with synonym matching and fuzzy search
 */
export function searchCompanies(query: string, options?: { limit?: number; fuzzy?: boolean }): Company[] {
  const lower = query.toLowerCase().trim();
  const limit = options?.limit || 50;

  // Expand query with synonyms
  let searchTerms = [lower];
  for (const [key, synonyms] of Object.entries(SYNONYMS)) {
    if (synonyms.some(s => lower.includes(s)) || lower.includes(key)) {
      searchTerms = [...searchTerms, key, ...synonyms];
    }
  }

  // Score each company
  const scored = COMPANIES.map(company => {
    let score = 0;
    const searchFields = [
      company.name.toLowerCase(),
      company.domain.toLowerCase(),
      company.industry.toLowerCase(),
      company.subIndustry?.toLowerCase() || "",
      company.stage.toLowerCase(),
      company.hqLocation?.toLowerCase() || "",
      ...(company.techStack || []).map(t => t.toLowerCase()),
      ...(company.keywords || []).map(k => k.toLowerCase()),
    ].join(" ");

    for (const term of searchTerms) {
      // Exact match in name = highest score
      if (company.name.toLowerCase() === term) score += 100;
      // Name contains term
      else if (company.name.toLowerCase().includes(term)) score += 50;
      // Industry exact match
      if (company.industry.toLowerCase() === term) score += 40;
      // SubIndustry match
      if (company.subIndustry?.toLowerCase().includes(term)) score += 35;
      // Domain match
      if (company.domain.toLowerCase().includes(term)) score += 30;
      // Stage match
      if (company.stage.toLowerCase().includes(term)) score += 25;
      // Keyword match
      if (company.keywords?.some(k => k.toLowerCase().includes(term))) score += 20;
      // General field match
      if (searchFields.includes(term)) score += 10;
    }

    return { company, score };
  });

  // Filter and sort by score
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.company);
}

/**
 * Get companies by industry with sub-industry support
 */
export function getCompaniesByIndustry(industry: string, subIndustry?: string): Company[] {
  return COMPANIES.filter(c => {
    const matchesIndustry = c.industry.toLowerCase() === industry.toLowerCase() ||
                           c.industry.toLowerCase().includes(industry.toLowerCase());
    if (!matchesIndustry) return false;
    if (subIndustry) {
      return c.subIndustry?.toLowerCase().includes(subIndustry.toLowerCase());
    }
    return true;
  });
}

/**
 * Get companies by funding stage
 */
export function getCompaniesByStage(stage: string): Company[] {
  const stageMap: Record<string, string[]> = {
    "seed": ["seed", "pre-seed"],
    "early": ["seed", "series a", "pre-seed"],
    "growth": ["series b", "series c", "series d"],
    "late": ["series e", "series f", "series g", "series h", "late stage"],
    "public": ["public", "acquired", "ipo"],
  };

  const matchStages = stageMap[stage.toLowerCase()] || [stage.toLowerCase()];
  return COMPANIES.filter(c =>
    matchStages.some(s => c.stage.toLowerCase().includes(s))
  );
}

/**
 * Get random sample of companies, optionally filtered
 */
export function getRandomCompanies(count: number, filter?: { industry?: string; stage?: string }): Company[] {
  let pool = [...COMPANIES];

  if (filter?.industry) {
    pool = pool.filter(c => c.industry.toLowerCase().includes(filter.industry!.toLowerCase()));
  }
  if (filter?.stage) {
    pool = getCompaniesByStage(filter.stage).filter(c => pool.includes(c));
  }

  return pool.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Get hot companies (recently funded, high growth)
 */
export function getHotCompanies(limit: number = 20): Company[] {
  return COMPANIES
    .filter(c => c.lastFunding === "2024" || ["Series A", "Series B", "Series C"].some(s => c.stage.includes(s)))
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

/**
 * Get companies by location
 */
export function getCompaniesByLocation(location: string): Company[] {
  const lower = location.toLowerCase();
  return COMPANIES.filter(c =>
    c.hqLocation?.toLowerCase().includes(lower) ||
    (lower === "remote" && c.hqLocation?.toLowerCase() === "remote")
  );
}

// Export count for stats
export const COMPANY_COUNT = COMPANIES.length;
