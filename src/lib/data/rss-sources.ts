// Curated RSS feeds for B2B lead intelligence
// Focused on: funding, hiring, product launches, expansions

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  category: "funding" | "tech_news" | "industry" | "hiring" | "press";
  signalTypes: string[];
}

export const RSS_SOURCES: RSSSource[] = [
  // Funding & Startups
  {
    id: "techcrunch_funding",
    name: "TechCrunch Funding",
    url: "https://techcrunch.com/category/venture/feed/",
    category: "funding",
    signalTypes: ["funding_round", "acquisition", "ipo"],
  },
  {
    id: "crunchbase_news",
    name: "Crunchbase News",
    url: "https://news.crunchbase.com/feed/",
    category: "funding",
    signalTypes: ["funding_round", "acquisition", "company_news"],
  },
  {
    id: "venturebeat",
    name: "VentureBeat",
    url: "https://venturebeat.com/feed/",
    category: "tech_news",
    signalTypes: ["product_launch", "funding_round", "partnership"],
  },

  // Tech News
  {
    id: "techcrunch_main",
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    category: "tech_news",
    signalTypes: ["product_launch", "expansion", "leadership_change"],
  },
  {
    id: "wired_business",
    name: "Wired Business",
    url: "https://www.wired.com/feed/category/business/latest/rss",
    category: "tech_news",
    signalTypes: ["product_launch", "company_news"],
  },
  {
    id: "theverge",
    name: "The Verge",
    url: "https://www.theverge.com/rss/index.xml",
    category: "tech_news",
    signalTypes: ["product_launch", "company_news"],
  },

  // Enterprise & SaaS
  {
    id: "saastr",
    name: "SaaStr",
    url: "https://www.saastr.com/feed/",
    category: "industry",
    signalTypes: ["funding_round", "growth", "hiring"],
  },
  {
    id: "zdnet_enterprise",
    name: "ZDNet",
    url: "https://www.zdnet.com/topic/enterprise-software/rss.xml",
    category: "industry",
    signalTypes: ["product_launch", "partnership", "digital_transformation"],
  },

  // Business News
  {
    id: "reuters_tech",
    name: "Reuters Technology",
    url: "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best&best-topics=tech",
    category: "tech_news",
    signalTypes: ["acquisition", "ipo", "leadership_change"],
  },
  {
    id: "businesswire",
    name: "Business Wire Tech",
    url: "https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtSWA==",
    category: "press",
    signalTypes: ["funding_round", "product_launch", "partnership", "expansion"],
  },
  {
    id: "prnewswire_tech",
    name: "PR Newswire Tech",
    url: "https://www.prnewswire.com/rss/technology-latest-news.rss",
    category: "press",
    signalTypes: ["product_launch", "partnership", "expansion", "hiring"],
  },

  // Fintech
  {
    id: "finextra",
    name: "Finextra",
    url: "https://www.finextra.com/rss/headlines.aspx",
    category: "industry",
    signalTypes: ["funding_round", "product_launch", "partnership"],
  },

  // Healthcare IT
  {
    id: "healthcareitnews",
    name: "Healthcare IT News",
    url: "https://www.healthcareitnews.com/feed",
    category: "industry",
    signalTypes: ["funding_round", "product_launch", "partnership"],
  },
];

// Signal type to priority mapping
export const SIGNAL_PRIORITIES: Record<string, "high" | "medium" | "low"> = {
  funding_round: "high",
  acquisition: "high",
  ipo: "high",
  leadership_change: "high",
  expansion: "high",
  product_launch: "medium",
  partnership: "medium",
  hiring: "medium",
  digital_transformation: "medium",
  company_news: "low",
  growth: "medium",
};

// Keywords that indicate buying signals
export const SIGNAL_KEYWORDS = {
  funding: [
    "raises", "raised", "funding", "series a", "series b", "series c", "series d",
    "seed round", "investment", "venture", "capital", "million", "billion",
    "led by", "participated", "valuation"
  ],
  acquisition: [
    "acquires", "acquired", "acquisition", "merger", "merges", "buys", "bought",
    "deal", "transaction"
  ],
  expansion: [
    "expands", "expansion", "opens office", "new market", "enters", "launches in",
    "international", "global", "headquarters"
  ],
  hiring: [
    "hires", "hired", "appoints", "appointed", "joins", "new ceo", "new cto",
    "new cfo", "new vp", "chief", "executive", "leadership"
  ],
  product: [
    "launches", "launched", "announces", "unveiled", "introduces", "new product",
    "new feature", "platform", "solution", "release"
  ],
  partnership: [
    "partners", "partnership", "collaboration", "integrates", "integration",
    "alliance", "teaming up", "joins forces"
  ],
};
