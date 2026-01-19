import { LeadRecord, SignalDefinition, UserConfig } from "@/lib/schemas";
import { v4 as uuidv4 } from "uuid";

// Default signal presets
export const DEFAULT_SIGNAL_PRESETS: Record<string, SignalDefinition[]> = {
  funding_corporate: [
    {
      id: "sig_funding_series",
      name: "Recent Funding Round",
      question: "Has {account} recently closed a funding round (Series A, B, C, or later)?",
      category: "funding_corporate",
      priority: "high",
      weight: 9,
      queryTemplates: [
        "raises series funding",
        "secures investment round",
        "announces funding",
        "venture capital investment",
      ],
      acceptedSources: ["news", "press_release", "sec_filing"],
      isDisqualifier: false,
      enabled: true,
    },
    {
      id: "sig_acquisition",
      name: "M&A Activity",
      question: "Is {account} involved in merger or acquisition activity?",
      category: "funding_corporate",
      priority: "high",
      weight: 8,
      queryTemplates: [
        "acquires company",
        "announces acquisition",
        "merger agreement",
        "acquired by",
      ],
      acceptedSources: ["news", "press_release", "sec_filing"],
      isDisqualifier: false,
      enabled: true,
    },
    {
      id: "sig_ipo",
      name: "IPO Preparation",
      question: "Is {account} preparing for or recently completed an IPO?",
      category: "funding_corporate",
      priority: "high",
      weight: 8,
      queryTemplates: [
        "files for IPO",
        "IPO prospectus",
        "going public",
        "S-1 filing",
      ],
      acceptedSources: ["news", "press_release", "sec_filing"],
      isDisqualifier: false,
      enabled: true,
    },
  ],
  leadership_org: [
    {
      id: "sig_new_exec",
      name: "New Executive Hire",
      question: "Has {account} recently hired a new C-level or VP executive?",
      category: "leadership_org",
      priority: "high",
      weight: 8,
      queryTemplates: [
        "appoints new CEO",
        "names new CTO",
        "hires VP",
        "new chief officer",
        "joins as executive",
      ],
      acceptedSources: ["news", "press_release", "company_site", "blog"],
      isDisqualifier: false,
      enabled: true,
    },
    {
      id: "sig_reorg",
      name: "Organizational Restructuring",
      question: "Is {account} undergoing organizational restructuring or layoffs?",
      category: "leadership_org",
      priority: "medium",
      weight: 6,
      queryTemplates: [
        "announces restructuring",
        "organizational changes",
        "layoffs announced",
        "workforce reduction",
      ],
      acceptedSources: ["news", "press_release"],
      isDisqualifier: false,
      enabled: true,
    },
  ],
  product_strategy: [
    {
      id: "sig_product_launch",
      name: "New Product Launch",
      question: "Has {account} launched or announced a new product or service?",
      category: "product_strategy",
      priority: "medium",
      weight: 7,
      queryTemplates: [
        "launches new product",
        "announces new service",
        "unveils platform",
        "introduces solution",
      ],
      acceptedSources: ["news", "press_release", "company_site", "blog"],
      isDisqualifier: false,
      enabled: true,
    },
    {
      id: "sig_pivot",
      name: "Strategic Pivot",
      question: "Is {account} pivoting their business model or strategy?",
      category: "product_strategy",
      priority: "medium",
      weight: 6,
      queryTemplates: [
        "pivots to",
        "new strategic direction",
        "business model change",
        "refocuses on",
      ],
      acceptedSources: ["news", "press_release", "blog"],
      isDisqualifier: false,
      enabled: true,
    },
  ],
  hiring_team: [
    {
      id: "sig_hiring_spree",
      name: "Aggressive Hiring",
      question: "Is {account} aggressively hiring across multiple roles?",
      category: "hiring_team",
      priority: "medium",
      weight: 7,
      queryTemplates: [
        "hiring multiple positions",
        "expanding team",
        "job openings",
        "careers page growth",
      ],
      acceptedSources: ["job_post", "company_site", "news"],
      isDisqualifier: false,
      enabled: true,
    },
    {
      id: "sig_hiring_role",
      name: "Hiring Target Role",
      question: "Is {account} hiring for roles that indicate need for our solution?",
      category: "hiring_team",
      priority: "high",
      weight: 8,
      queryTemplates: [
        "hiring manager",
        "job opening director",
        "careers position",
      ],
      acceptedSources: ["job_post", "company_site"],
      isDisqualifier: false,
      enabled: true,
    },
  ],
  expansion_partnerships: [
    {
      id: "sig_geo_expansion",
      name: "Geographic Expansion",
      question: "Is {account} expanding into new geographic markets?",
      category: "expansion_partnerships",
      priority: "high",
      weight: 8,
      queryTemplates: [
        "expands to",
        "opens office in",
        "enters market",
        "international expansion",
      ],
      acceptedSources: ["news", "press_release", "company_site"],
      isDisqualifier: false,
      enabled: true,
    },
    {
      id: "sig_partnership",
      name: "New Partnership",
      question: "Has {account} announced a significant partnership or alliance?",
      category: "expansion_partnerships",
      priority: "medium",
      weight: 7,
      queryTemplates: [
        "partners with",
        "announces partnership",
        "strategic alliance",
        "collaboration with",
      ],
      acceptedSources: ["news", "press_release", "company_site"],
      isDisqualifier: false,
      enabled: true,
    },
  ],
  technology_adoption: [
    {
      id: "sig_tech_adoption",
      name: "Technology Adoption",
      question: "Is {account} adopting new technology platforms or tools?",
      category: "technology_adoption",
      priority: "medium",
      weight: 7,
      queryTemplates: [
        "implements platform",
        "adopts technology",
        "deploys solution",
        "migrates to",
      ],
      acceptedSources: ["news", "press_release", "blog", "company_site"],
      isDisqualifier: false,
      enabled: true,
    },
    {
      id: "sig_digital_transform",
      name: "Digital Transformation",
      question: "Is {account} undergoing digital transformation initiatives?",
      category: "technology_adoption",
      priority: "medium",
      weight: 6,
      queryTemplates: [
        "digital transformation",
        "modernization initiative",
        "cloud migration",
        "technology upgrade",
      ],
      acceptedSources: ["news", "press_release", "blog"],
      isDisqualifier: false,
      enabled: true,
    },
  ],
  risk_compliance: [
    {
      id: "sig_compliance",
      name: "Compliance Initiative",
      question: "Is {account} investing in compliance or regulatory readiness?",
      category: "risk_compliance",
      priority: "medium",
      weight: 6,
      queryTemplates: [
        "compliance initiative",
        "regulatory preparation",
        "SOC 2 certification",
        "GDPR compliance",
      ],
      acceptedSources: ["news", "press_release", "company_site"],
      isDisqualifier: false,
      enabled: true,
    },
  ],
  disqualifier: [
    {
      id: "sig_disq_bankruptcy",
      name: "Financial Distress",
      question: "Is {account} in financial distress or bankruptcy?",
      category: "disqualifier",
      priority: "high",
      weight: 10,
      queryTemplates: [
        "files for bankruptcy",
        "financial trouble",
        "debt default",
        "insolvent",
      ],
      acceptedSources: ["news", "sec_filing"],
      isDisqualifier: true,
      enabled: true,
    },
    {
      id: "sig_disq_shutdown",
      name: "Company Shutdown",
      question: "Is {account} shutting down or going out of business?",
      category: "disqualifier",
      priority: "high",
      weight: 10,
      queryTemplates: [
        "shuts down",
        "closing operations",
        "going out of business",
        "ceases operations",
      ],
      acceptedSources: ["news", "press_release"],
      isDisqualifier: true,
      enabled: true,
    },
  ],
};

export function getAllDefaultSignals(): SignalDefinition[] {
  return Object.values(DEFAULT_SIGNAL_PRESETS).flat();
}

export const DEFAULT_USER_CONFIG: UserConfig = {
  version: 1,
  offer: "AI-powered sales intelligence platform that helps B2B teams find and engage with high-intent prospects",
  icp: {
    industries: ["Technology", "Software", "SaaS", "FinTech", "Healthcare IT"],
    excludeIndustries: ["Government", "Non-profit"],
    geos: ["United States", "Canada", "United Kingdom"],
    excludeGeos: [],
    companySizeRange: { min: 50, max: 5000 },
    targetRoles: [
      "VP of Sales",
      "Head of Sales",
      "Sales Director",
      "Chief Revenue Officer",
      "VP of Marketing",
      "Head of Growth",
    ],
    excludeRoles: ["Intern", "Associate"],
  },
  signals: getAllDefaultSignals(),
  modes: {
    huntEnabled: true,
    huntDailyLimit: 50,
    watchEnabled: false,
  },
  schedule: {
    timezone: "America/New_York",
    dailyRunHour: 8,
  },
  onboardingComplete: false,
};

// Demo leads for when API keys are missing
export function generateDemoLeads(count: number = 50): LeadRecord[] {
  const demoCompanies = [
    {
      name: "Acme Cloud Solutions",
      domain: "acmecloud.io",
      industry: "Cloud Computing",
      geo: "San Francisco, CA",
      signals: ["Recent Funding Round", "New Executive Hire"],
      whyNow: "Just raised $50M Series C and appointed new CTO, indicating major expansion plans",
    },
    {
      name: "DataFlow Analytics",
      domain: "dataflow.ai",
      industry: "Data Analytics",
      geo: "New York, NY",
      signals: ["Aggressive Hiring", "New Product Launch"],
      whyNow: "Launched new enterprise product and hiring 20+ sales reps",
    },
    {
      name: "SecureNet Systems",
      domain: "securenet.com",
      industry: "Cybersecurity",
      geo: "Austin, TX",
      signals: ["Geographic Expansion", "New Partnership"],
      whyNow: "Expanding to European market and partnered with major cloud provider",
    },
    {
      name: "HealthTech Innovations",
      domain: "healthtechinno.com",
      industry: "Healthcare IT",
      geo: "Boston, MA",
      signals: ["Recent Funding Round", "Compliance Initiative"],
      whyNow: "Closed Series B and pursuing HIPAA compliance certification",
    },
    {
      name: "FinanceFlow Pro",
      domain: "financeflowpro.com",
      industry: "FinTech",
      geo: "Chicago, IL",
      signals: ["M&A Activity", "Technology Adoption"],
      whyNow: "Acquired competitor and modernizing tech stack",
    },
    {
      name: "RetailGenius",
      domain: "retailgenius.co",
      industry: "Retail Technology",
      geo: "Seattle, WA",
      signals: ["Strategic Pivot", "Hiring Target Role"],
      whyNow: "Pivoting to B2B and hiring VP of Sales",
    },
    {
      name: "LogiChain Systems",
      domain: "logichain.io",
      industry: "Supply Chain",
      geo: "Denver, CO",
      signals: ["Digital Transformation", "New Executive Hire"],
      whyNow: "New CEO driving digital transformation initiative",
    },
    {
      name: "EduPlatform Inc",
      domain: "eduplatform.com",
      industry: "EdTech",
      geo: "Los Angeles, CA",
      signals: ["Recent Funding Round", "Geographic Expansion"],
      whyNow: "Series A funding for international expansion",
    },
    {
      name: "PropTech Solutions",
      domain: "proptechsol.com",
      industry: "Real Estate Tech",
      geo: "Miami, FL",
      signals: ["New Product Launch", "New Partnership"],
      whyNow: "Launched AI-powered platform in partnership with major broker",
    },
    {
      name: "GreenEnergy Tech",
      domain: "greenenergy.tech",
      industry: "Clean Energy",
      geo: "Portland, OR",
      signals: ["Aggressive Hiring", "Compliance Initiative"],
      whyNow: "Scaling team and pursuing ESG certifications",
    },
  ];

  const leads: LeadRecord[] = [];
  const today = new Date().toISOString().split("T")[0];

  for (let i = 0; i < Math.min(count, demoCompanies.length * 5); i++) {
    const company = demoCompanies[i % demoCompanies.length];
    const variation = Math.floor(i / demoCompanies.length);
    const score = Math.max(40, 95 - i * 1.5);

    leads.push({
      id: uuidv4(),
      userId: "demo-user",
      date: today,
      domain: variation > 0 ? `${company.domain.split(".")[0]}${variation + 1}.com` : company.domain,
      companyName: variation > 0 ? `${company.name} ${variation + 1}` : company.name,
      industry: company.industry,
      geo: company.geo,
      score: Math.round(score),
      whyNow: company.whyNow,
      triggeredSignals: company.signals.map((s, idx) => ({
        signalId: `sig_${idx}`,
        signalName: s,
        category: idx === 0 ? "funding_corporate" : "leadership_org",
        priority: idx === 0 ? "high" : "medium",
      })),
      evidenceUrls: [
        `https://techcrunch.com/article/${company.domain.split(".")[0]}-funding`,
        `https://${company.domain}/press/announcement`,
      ],
      evidenceSnippets: [
        `${company.name} announced major developments today, signaling growth...`,
        `The company has been making strategic moves to position itself...`,
      ],
      linkedinSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(company.name + " VP Sales")}`,
      linkedinSearchQuery: `"${company.name}" "VP Sales" OR "Head of Sales"`,
      targetTitles: ["VP of Sales", "Head of Sales", "Sales Director"],
      openerShort: `Hi, I noticed ${company.name}'s recent ${company.signals[0].toLowerCase()}. Curious how you're thinking about sales enablement as you scale.`,
      openerMedium: `Hi, I came across ${company.name}'s recent news about ${company.signals[0].toLowerCase()} and wanted to reach out. Given the growth trajectory, I imagine sales efficiency is top of mind. Would love to share how similar companies have accelerated their pipeline during expansion phases.`,
      status: "new",
      personName: null,
      angles: [
        {
          title: "Growth Scaling",
          description: "Discuss how to maintain sales efficiency during rapid growth",
          evidenceUrl: `https://techcrunch.com/article/${company.domain.split(".")[0]}-funding`,
        },
        {
          title: "New Market Entry",
          description: "Support for entering new markets or verticals",
          evidenceUrl: `https://${company.domain}/press/announcement`,
        },
        {
          title: "Team Enablement",
          description: "Help new sales hires ramp faster",
          evidenceUrl: `https://${company.domain}/careers`,
        },
      ],
      narrative: [
        `${company.name} recently ${company.whyNow.toLowerCase()}. [Source](https://techcrunch.com)`,
        `The company operates in the ${company.industry} space, targeting enterprise customers.`,
        `Based in ${company.geo}, they're positioned for significant growth.`,
        `Key signals indicate this is an optimal time for outreach.`,
        `Leadership changes suggest new strategic initiatives underway.`,
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return leads;
}

export function isDemoMode(): boolean {
  // Check if Supabase is configured
  const hasSupabase = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Check for LLM keys
  const hasLLMKey = !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);

  // Check for search keys
  const hasSearchKey = !!(
    process.env.TAVILY_API_KEY ||
    process.env.SERPAPI_KEY ||
    process.env.BING_SEARCH_KEY
  );

  // Demo mode if any required service is missing or explicitly enabled
  return !hasSupabase || !hasLLMKey || !hasSearchKey || process.env.DEMO_MODE === "true";
}
