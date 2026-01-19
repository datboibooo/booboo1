import { VerifySignalInput, Evidence, Claim } from "../types";

// ============================================
// Funding Signal Fixtures
// ============================================

export const fundingSignalInput: VerifySignalInput = {
  company: "Acme Corp",
  domain: "acme.com",
  rawSignal: {
    type: "funding_round",
    details: "Acme Corp raised $50M Series B led by Sequoia Capital",
    relevanceScore: 8,
  },
  rssItem: {
    title: "Acme Corp Raises $50M Series B to Expand AI Platform",
    link: "https://techcrunch.com/2025/01/15/acme-corp-series-b",
    content:
      "Acme Corp, the enterprise AI platform company, announced today that it has raised $50 million in Series B funding led by Sequoia Capital. The round also included participation from existing investors Andreessen Horowitz and Index Ventures. CEO Jane Smith said the funds will be used to expand the engineering team and accelerate product development.",
    contentSnippet:
      "Acme Corp announced $50M Series B funding led by Sequoia Capital...",
    pubDate: "2025-01-15T09:00:00Z",
    sourceName: "TechCrunch",
  },
};

export const fundingEvidence: Evidence[] = [
  {
    id: "ev_1",
    url: "https://techcrunch.com/2025/01/15/acme-corp-series-b",
    canonicalUrl: "https://techcrunch.com/2025/01/15/acme-corp-series-b",
    title: "Acme Corp Raises $50M Series B to Expand AI Platform",
    snippet:
      "Acme Corp, the enterprise AI platform company, announced today that it has raised $50 million in Series B funding led by Sequoia Capital.",
    sourceType: "rss_article",
    publisher: "TechCrunch",
    publishedAt: "2025-01-15T09:00:00Z",
    fetchedAt: "2025-01-15T10:00:00Z",
    contentHash: "abc123",
    isOfficial: false,
  },
  {
    id: "ev_2",
    url: "https://acme.com/press/series-b-announcement",
    canonicalUrl: "https://acme.com/press/series-b-announcement",
    title: "Acme Corp Announces $50M Series B Funding Round",
    snippet:
      "Acme Corp today announced the closing of a $50 million Series B financing round led by Sequoia Capital, with participation from Andreessen Horowitz and Index Ventures.",
    sourceType: "company_press",
    publishedAt: "2025-01-15T08:00:00Z",
    fetchedAt: "2025-01-15T10:00:00Z",
    contentHash: "def456",
    isOfficial: true,
  },
  {
    id: "ev_3",
    url: "https://www.crunchbase.com/organization/acme-corp",
    canonicalUrl: "https://www.crunchbase.com/organization/acme-corp",
    title: "Acme Corp - Crunchbase Company Profile",
    snippet:
      "Acme Corp has raised a total of $65M in funding over 3 rounds. Their latest funding was raised on Jan 15, 2025 from a Series B round.",
    sourceType: "crunchbase",
    fetchedAt: "2025-01-15T10:00:00Z",
    contentHash: "ghi789",
    isOfficial: false,
  },
];

export const fundingClaims: Claim[] = [
  {
    id: "claim_1",
    type: "funding_raised",
    statement: "Acme Corp raised $50M in Series B funding",
    entities: {
      company: "Acme Corp",
      amount: "$50M",
      date: "January 2025",
    },
    verificationRequirements: [
      "official_announcement_or_2_reputable_sources",
      "amount_consistent_across_sources",
    ],
    extractedFrom: "RSS: Acme Corp Raises $50M Series B to Expand AI Platform",
  },
  {
    id: "claim_2",
    type: "funding_amount",
    statement: "The funding round was led by Sequoia Capital",
    entities: {
      company: "Acme Corp",
      partner: "Sequoia Capital",
    },
    verificationRequirements: [
      "official_announcement_or_2_reputable_sources",
      "amount_not_contradicted",
    ],
    extractedFrom: "RSS: Acme Corp Raises $50M Series B to Expand AI Platform",
  },
];

// ============================================
// Hiring Signal Fixtures
// ============================================

export const hiringSignalInput: VerifySignalInput = {
  company: "TechStartup Inc",
  domain: "techstartup.io",
  rawSignal: {
    type: "hiring",
    details: "TechStartup Inc is rapidly expanding their engineering team with 50+ open roles",
    relevanceScore: 7,
  },
  rssItem: {
    title: "TechStartup Inc Plans Aggressive Hiring Spree After Funding",
    link: "https://venturebeat.com/2025/01/10/techstartup-hiring",
    content:
      "Following their recent $30M Series A, TechStartup Inc announced plans to double their engineering team in the first half of 2025. The company currently has over 50 open positions listed on their careers page, including senior engineers, product managers, and data scientists.",
    contentSnippet:
      "TechStartup Inc announced plans to double their engineering team with 50+ open positions...",
    pubDate: "2025-01-10T14:00:00Z",
    sourceName: "VentureBeat",
  },
};

export const hiringEvidence: Evidence[] = [
  {
    id: "ev_h1",
    url: "https://venturebeat.com/2025/01/10/techstartup-hiring",
    canonicalUrl: "https://venturebeat.com/2025/01/10/techstartup-hiring",
    title: "TechStartup Inc Plans Aggressive Hiring Spree After Funding",
    snippet:
      "TechStartup Inc announced plans to double their engineering team in the first half of 2025 with over 50 open positions.",
    sourceType: "rss_article",
    publisher: "VentureBeat",
    publishedAt: "2025-01-10T14:00:00Z",
    fetchedAt: "2025-01-10T15:00:00Z",
    contentHash: "hir123",
    isOfficial: false,
  },
  {
    id: "ev_h2",
    url: "https://techstartup.io/careers",
    canonicalUrl: "https://techstartup.io/careers",
    title: "Careers at TechStartup Inc - Join Our Team",
    snippet:
      "We're hiring! Browse 52 open positions across engineering, product, design, and operations. Join our mission to revolutionize enterprise software.",
    sourceType: "company_careers",
    fetchedAt: "2025-01-10T15:00:00Z",
    contentHash: "hir456",
    isOfficial: true,
  },
  {
    id: "ev_h3",
    url: "https://www.lever.co/jobs/techstartup",
    canonicalUrl: "https://jobs.lever.co/techstartup",
    title: "TechStartup Inc Jobs | Lever",
    snippet:
      "View all job openings at TechStartup Inc. 52 jobs available including Senior Software Engineer, Product Manager, Data Scientist, and more.",
    sourceType: "jobs_board",
    fetchedAt: "2025-01-10T15:00:00Z",
    contentHash: "hir789",
    isOfficial: false,
  },
];

export const hiringClaims: Claim[] = [
  {
    id: "claim_h1",
    type: "hiring_initiative",
    statement: "TechStartup Inc is expanding with 50+ open positions",
    entities: {
      company: "TechStartup Inc",
    },
    verificationRequirements: ["official_careers_page_or_job_listings"],
    extractedFrom: "RSS: TechStartup Inc Plans Aggressive Hiring Spree After Funding",
  },
];

// ============================================
// Partnership Signal Fixtures
// ============================================

export const partnershipSignalInput: VerifySignalInput = {
  company: "CloudTech",
  domain: "cloudtech.com",
  rawSignal: {
    type: "partnership",
    details: "CloudTech announced strategic partnership with Amazon Web Services",
    relevanceScore: 9,
  },
  rssItem: {
    title: "CloudTech Partners with AWS to Deliver Enterprise Cloud Solutions",
    link: "https://prnewswire.com/2025/01/12/cloudtech-aws-partnership",
    content:
      "CloudTech, a leading cloud infrastructure provider, today announced a strategic partnership with Amazon Web Services (AWS). Under the partnership, CloudTech will become an AWS Advanced Technology Partner, and the companies will collaborate on joint go-to-market initiatives.",
    contentSnippet:
      "CloudTech announced strategic partnership with AWS, becoming an Advanced Technology Partner...",
    pubDate: "2025-01-12T10:00:00Z",
    sourceName: "PR Newswire",
  },
};

export const partnershipEvidence: Evidence[] = [
  {
    id: "ev_p1",
    url: "https://prnewswire.com/2025/01/12/cloudtech-aws-partnership",
    canonicalUrl: "https://prnewswire.com/2025/01/12/cloudtech-aws-partnership",
    title: "CloudTech Partners with AWS to Deliver Enterprise Cloud Solutions",
    snippet:
      "CloudTech today announced a strategic partnership with Amazon Web Services (AWS). CloudTech will become an AWS Advanced Technology Partner.",
    sourceType: "third_party_news",
    publisher: "PR Newswire",
    publishedAt: "2025-01-12T10:00:00Z",
    fetchedAt: "2025-01-12T11:00:00Z",
    contentHash: "part123",
    isOfficial: false,
  },
  {
    id: "ev_p2",
    url: "https://cloudtech.com/news/aws-partnership",
    canonicalUrl: "https://cloudtech.com/news/aws-partnership",
    title: "CloudTech Announces Strategic Partnership with AWS",
    snippet:
      "We are thrilled to announce our strategic partnership with Amazon Web Services. This collaboration will enable us to deliver enhanced cloud solutions to enterprise customers.",
    sourceType: "company_press",
    publishedAt: "2025-01-12T10:00:00Z",
    fetchedAt: "2025-01-12T11:00:00Z",
    contentHash: "part456",
    isOfficial: true,
  },
];

export const partnershipClaims: Claim[] = [
  {
    id: "claim_p1",
    type: "partnership_announced",
    statement: "CloudTech announced strategic partnership with AWS",
    entities: {
      company: "CloudTech",
      partner: "Amazon Web Services",
    },
    verificationRequirements: ["confirmation_from_at_least_one_official_party"],
    extractedFrom: "RSS: CloudTech Partners with AWS to Deliver Enterprise Cloud Solutions",
  },
];

// ============================================
// Contradicted Signal Fixture (for testing)
// ============================================

export const contradictedSignalInput: VerifySignalInput = {
  company: "FailCorp",
  domain: "failcorp.com",
  rawSignal: {
    type: "funding_round",
    details: "FailCorp raised $100M Series C",
    relevanceScore: 8,
  },
  rssItem: {
    title: "FailCorp Reportedly Raises $100M Series C",
    link: "https://unreliablenews.com/failcorp-funding",
    content:
      "Sources say FailCorp has raised $100M in Series C funding. The company has not confirmed the deal.",
    contentSnippet: "Sources say FailCorp has raised $100M in Series C funding...",
    pubDate: "2025-01-14T09:00:00Z",
    sourceName: "Unreliable News",
  },
};

export const contradictedEvidence: Evidence[] = [
  {
    id: "ev_c1",
    url: "https://unreliablenews.com/failcorp-funding",
    canonicalUrl: "https://unreliablenews.com/failcorp-funding",
    title: "FailCorp Reportedly Raises $100M Series C",
    snippet: "Sources say FailCorp has raised $100M in Series C funding.",
    sourceType: "other",
    publishedAt: "2025-01-14T09:00:00Z",
    fetchedAt: "2025-01-14T10:00:00Z",
    contentHash: "con123",
    isOfficial: false,
  },
  {
    id: "ev_c2",
    url: "https://failcorp.com/news/funding-denial",
    canonicalUrl: "https://failcorp.com/news/funding-denial",
    title: "Statement Regarding Funding Rumors",
    snippet:
      "FailCorp has not raised any new funding. Reports of a $100M Series C are inaccurate. We will announce any funding when and if it occurs.",
    sourceType: "company_press",
    publishedAt: "2025-01-14T11:00:00Z",
    fetchedAt: "2025-01-14T12:00:00Z",
    contentHash: "con456",
    isOfficial: true,
  },
];
