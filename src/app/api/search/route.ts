/**
 * Universal Company Search API
 * Find and research ANY company on the internet
 *
 * Capabilities:
 * 1. Web search (Tavily/SerpAPI/Bing) for company discovery
 * 2. Firecrawl scraping for deep company research
 * 3. Florida local business database for home services
 */

import { NextResponse } from "next/server";
import { getSearchProvider, isSearchConfigured } from "@/lib/providers/search";
import { quickEnrich, scrapeUrl } from "@/lib/firecrawl";
import {
  FLORIDA_BUSINESSES,
  searchFloridaBusinesses,
  getHotLeads,
  getByCategory,
  getByRegion,
  FLORIDA_BUSINESS_STATS,
  type FloridaBusiness,
} from "@/lib/data/florida-businesses";

// ============ TYPES ============
interface CompanyResult {
  id: string;
  name: string;
  domain: string;
  description: string;
  industry: string;
  subCategory?: string;
  stage: string;
  location?: string;
  score: number;
  signals: string[];
  painPoints: string[];
  techStack: string[];
  outreachAngles: Array<{
    angle: string;
    opener: string;
    whyNow: string;
    priority: string;
  }>;
  targetPersonas: Array<{
    title: string;
    reason: string;
  }>;
  bestTiming: string;
  urgencyScore: number;
  source: "web_search" | "firecrawl" | "florida_database" | "direct_lookup";
  // Additional fields for UI compatibility
  phone?: string;
  email?: string;
  website?: string;
  region?: string;
  employeeCount?: string;
  yearsInBusiness?: number;
  videoOpportunity?: string;
  packageRecommendation?: string;
  whyNow?: string;
  socialPresence?: {
    facebook?: boolean;
    instagram?: boolean;
    youtube?: boolean;
    tiktok?: boolean;
    hasVideo?: boolean;
  };
  hasVideo?: boolean;
  hasFacebook?: boolean;
  hasInstagram?: boolean;
  hasYouTube?: boolean;
  hasTikTok?: boolean;
  // Video buyer criteria
  videoBuyerCriteria?: FloridaBusiness["videoBuyerCriteria"];
  primaryUseCase?: string;
  buyingIntent?: string;
  buyingIntentReasons?: string[];
  idealVideoTypes?: string[];
  estimatedROI?: string;
  competitorThreat?: boolean;
  closingAngle?: string;
  decisionMaker?: string;
  adSpendLevel?: string;
  useCases?: string[];
  openerShort?: string;
  openerMedium?: string;
  targetTitles?: string[];
  idealFor?: string[];
}

interface SearchRequest {
  query?: string;
  mode?: "web" | "local" | "both" | "direct";
  limit?: number;
  domain?: string;
  category?: string;
  region?: string;
  city?: string;
  minScore?: number;
  enrichResults?: boolean;
  hotLeadsOnly?: boolean;
}

// ============ WEB SEARCH ============
async function searchWeb(query: string, limit: number = 10): Promise<CompanyResult[]> {
  if (!isSearchConfigured()) {
    console.log("No search provider configured, skipping web search");
    return [];
  }

  try {
    const searchProvider = getSearchProvider();
    const enhancedQuery = `${query} company OR business OR startup`;

    const results = await searchProvider.search(enhancedQuery, {
      maxResults: limit,
    });

    const companies: CompanyResult[] = [];
    const seenDomains = new Set<string>();

    for (const result of results.results || []) {
      let domain: string;
      try {
        const url = new URL(result.url);
        domain = url.hostname.replace(/^www\./, "");
      } catch {
        continue;
      }

      if (seenDomains.has(domain)) continue;
      const skipDomains = ["wikipedia.org", "linkedin.com", "facebook.com", "twitter.com", "youtube.com", "crunchbase.com", "bloomberg.com", "forbes.com", "techcrunch.com", "reuters.com", "yelp.com", "bbb.org"];
      if (skipDomains.some(d => domain.includes(d))) continue;
      seenDomains.add(domain);

      const companyName = result.title?.split(/[|\-–—]/)[0]?.trim() ||
                          domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);

      companies.push({
        id: `web_${domain.replace(/\./g, "_")}`,
        name: companyName,
        domain,
        description: result.snippet || "",
        industry: "Unknown",
        stage: "Unknown",
        score: 50,
        signals: [`Found via web search: "${query}"`],
        painPoints: [],
        techStack: [],
        outreachAngles: [{
          angle: "Web Search Result",
          opener: `Hi! I found ${companyName} while researching ${query}...`,
          whyNow: "Research their website for specific triggers",
          priority: "medium",
        }],
        targetPersonas: [{ title: "Decision Maker", reason: "Research needed" }],
        bestTiming: "Research needed",
        urgencyScore: 5,
        source: "web_search",
      });
    }

    return companies;
  } catch (error) {
    console.error("Web search error:", error);
    return [];
  }
}

// ============ FIRECRAWL ENRICHMENT ============
async function enrichCompany(domain: string): Promise<CompanyResult | null> {
  try {
    const research = await quickEnrich(domain);

    if (research.error && !research.signals.length) {
      return null;
    }

    return {
      id: `fc_${domain.replace(/\./g, "_")}`,
      name: research.companyName,
      domain: research.domain,
      description: research.description,
      industry: research.industry,
      stage: research.stage === "unknown" ? "Unknown" : research.stage,
      score: research.urgencyScore * 10,
      signals: research.signals.map(s => `${s.type}: ${s.content}`),
      painPoints: research.painPoints,
      techStack: research.techStack,
      outreachAngles: research.outreachAngles,
      targetPersonas: research.targetPersonas,
      bestTiming: research.bestTiming,
      urgencyScore: research.urgencyScore,
      source: "firecrawl",
    };
  } catch (error) {
    console.error(`Firecrawl enrichment error for ${domain}:`, error);
    return null;
  }
}

// ============ DIRECT DOMAIN LOOKUP ============
async function lookupDomain(domain: string): Promise<CompanyResult | null> {
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];

  const enriched = await enrichCompany(cleanDomain);
  if (enriched) {
    enriched.source = "direct_lookup";
    return enriched;
  }

  try {
    const scrapeResult = await scrapeUrl(`https://${cleanDomain}`);
    if (scrapeResult.success && scrapeResult.data) {
      const companyName = scrapeResult.data.metadata?.title?.split(/[|\-–—]/)[0]?.trim() ||
                          cleanDomain.split(".")[0].charAt(0).toUpperCase() + cleanDomain.split(".")[0].slice(1);

      return {
        id: `direct_${cleanDomain.replace(/\./g, "_")}`,
        name: companyName,
        domain: cleanDomain,
        description: scrapeResult.data.metadata?.description || "",
        industry: "Unknown",
        stage: "Unknown",
        score: 50,
        signals: ["Direct lookup - website accessible"],
        painPoints: [],
        techStack: [],
        outreachAngles: [{
          angle: "Direct Outreach",
          opener: `Hi! I came across ${companyName} and thought you might be interested in...`,
          whyNow: "Direct lookup - research their recent news",
          priority: "medium",
        }],
        targetPersonas: [{ title: "Decision Maker", reason: "Research needed" }],
        bestTiming: "Research recent news and signals first",
        urgencyScore: 5,
        source: "direct_lookup",
      };
    }
  } catch (error) {
    console.error(`Direct lookup error for ${cleanDomain}:`, error);
  }

  return null;
}

// ============ FLORIDA DATABASE HELPERS ============
function generatePackageRec(business: FloridaBusiness): string {
  if (!business.socialPresence.hasVideo && !business.socialPresence.instagram) {
    return "Full Package: 20 videos ($2,000) - No video presence, huge opportunity";
  }
  if (!business.socialPresence.hasVideo) {
    return "Starter Package: 20 videos ($2,000) - Has social but no video content";
  }
  if (business.socialPresence.hasVideo && !business.socialPresence.tiktok) {
    return "Expansion Package: Short-form video focus for TikTok/Reels";
  }
  return "Refresh Package: Update existing video content";
}

function generateOpeners(business: FloridaBusiness): { short: string; medium: string } {
  const videoStatus = !business.socialPresence.hasVideo
    ? "I noticed you don't have any video content yet"
    : "I see you're using some video content";

  const categoryBenefit: Record<string, string> = {
    "Roofing": "before/after roof transformations get 3x more engagement",
    "HVAC": "AC repair videos build trust during Florida's hot season",
    "Plumbing": "emergency plumbing tips videos get tons of local shares",
    "Pool Service": "pool cleaning timelapses are incredibly shareable",
    "Landscaping": "lawn transformation videos drive serious leads",
    "Painting": "before/after paint reveals are social media gold",
    "Solar": "ROI explanation videos help close high-ticket solar sales",
    "Kitchen & Bath": "kitchen and bath renovation reveals go viral locally",
    "Cleaning": "satisfying cleaning videos get massive engagement",
    "default": "local service videos consistently outperform other content",
  };

  const benefit = categoryBenefit[business.category] || categoryBenefit["default"];

  const short = `${videoStatus} for ${business.name}. ${business.category} businesses using video see 2-3x more leads.`;
  const medium = `Hi! ${videoStatus} on social media for ${business.name}. I work with ${business.category.toLowerCase()} companies in ${business.region}, and ${benefit}. I create 20 professional videos for $2,000 - would that be helpful for getting more leads?`;

  return { short, medium };
}

function formatFloridaBusiness(business: FloridaBusiness): CompanyResult {
  const packageRecommendation = generatePackageRec(business);
  const openers = generateOpeners(business);

  return {
    id: business.id,
    name: business.name,
    domain: business.website || `${business.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    description: business.whyNow,
    industry: business.category,
    subCategory: business.subCategory,
    stage: business.estimatedRevenue,
    location: `${business.city}, FL`,
    score: business.score,
    signals: business.signals,
    painPoints: business.painPoints,
    techStack: [],
    outreachAngles: [{
      angle: "Video Content Package",
      opener: business.videoBuyerCriteria.closingAngle,
      whyNow: business.whyNow,
      priority: business.score >= 80 ? "high" : business.score >= 60 ? "medium" : "low",
    }],
    targetPersonas: [{ title: business.videoBuyerCriteria.decisionMaker, reason: "Primary decision maker" }],
    bestTiming: business.videoBuyerCriteria.seasonalUrgency ? "Seasonal - reach out now" : "Anytime",
    urgencyScore: Math.round(business.score / 10),
    source: "florida_database",
    // Additional fields
    phone: business.phone,
    email: business.email,
    website: business.website,
    region: business.region,
    employeeCount: business.employeeCount,
    yearsInBusiness: business.yearsInBusiness,
    videoOpportunity: !business.socialPresence.hasVideo ? "High" : business.socialPresence.youtube ? "Medium" : "Low",
    packageRecommendation,
    whyNow: business.whyNow,
    socialPresence: business.socialPresence,
    hasVideo: business.socialPresence.hasVideo,
    hasFacebook: business.socialPresence.facebook,
    hasInstagram: business.socialPresence.instagram,
    hasYouTube: business.socialPresence.youtube,
    hasTikTok: business.socialPresence.tiktok,
    videoBuyerCriteria: business.videoBuyerCriteria,
    primaryUseCase: business.videoBuyerCriteria.primaryUseCase,
    buyingIntent: business.videoBuyerCriteria.buyingIntent,
    buyingIntentReasons: business.videoBuyerCriteria.buyingIntentReasons,
    idealVideoTypes: business.videoBuyerCriteria.idealVideoTypes,
    estimatedROI: business.videoBuyerCriteria.estimatedROI,
    competitorThreat: business.videoBuyerCriteria.competitorThreat,
    closingAngle: business.videoBuyerCriteria.closingAngle,
    decisionMaker: business.videoBuyerCriteria.decisionMaker,
    adSpendLevel: business.videoBuyerCriteria.adSpendEstimate,
    useCases: business.videoBuyerCriteria.useCases,
    openerShort: openers.short,
    openerMedium: openers.medium,
    targetTitles: [business.videoBuyerCriteria.decisionMaker, "Owner", "Marketing Manager"],
    idealFor: business.idealFor,
  };
}

// ============ QUERY PARSER FOR FLORIDA ============
function parseFloridaQuery(query: string): { categories: string[]; regions: string[]; cities: string[]; needsVideo: boolean; minScore?: number } {
  const lower = query.toLowerCase();
  const result = { categories: [] as string[], regions: [] as string[], cities: [] as string[], needsVideo: false, minScore: undefined as number | undefined };

  const categoryMap: Record<string, string[]> = {
    "Roofing": ["roof", "roofing", "roofer"],
    "HVAC": ["hvac", "ac", "air conditioning", "heating", "cooling"],
    "Plumbing": ["plumb", "plumber", "plumbing"],
    "Electrical": ["electric", "electrical", "electrician"],
    "Pool Service": ["pool", "pools"],
    "Landscaping": ["landscape", "landscaping", "lawn"],
    "Pest Control": ["pest", "exterminator"],
    "Cleaning": ["clean", "cleaning", "maid"],
    "Painting": ["paint", "painter", "painting"],
    "Kitchen & Bath": ["kitchen", "bath", "bathroom", "remodel", "renovation"],
    "Solar": ["solar"],
    "Flooring": ["floor", "flooring", "tile"],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(k => lower.includes(k))) {
      result.categories.push(category);
    }
  }

  const regionMap: Record<string, string[]> = {
    "South Florida": ["south florida", "miami", "fort lauderdale", "boca", "west palm"],
    "Central Florida": ["central florida", "orlando", "kissimmee", "daytona"],
    "Tampa Bay": ["tampa", "st pete", "clearwater", "sarasota", "naples", "fort myers"],
    "Jacksonville": ["jacksonville", "jax", "st augustine"],
    "Panhandle": ["panhandle", "pensacola", "destin", "tallahassee"],
  };

  for (const [region, keywords] of Object.entries(regionMap)) {
    if (keywords.some(k => lower.includes(k))) {
      result.regions.push(region);
    }
  }

  if (lower.includes("no video") || lower.includes("needs video") || lower.includes("without video")) {
    result.needsVideo = true;
  }

  if (lower.includes("hot") || lower.includes("best") || lower.includes("top")) {
    result.minScore = 75;
  }

  return result;
}

function searchFloridaDB(query: string, options: { category?: string; region?: string; limit?: number; minScore?: number; hotLeadsOnly?: boolean }): CompanyResult[] {
  const { category, region, limit = 20, minScore, hotLeadsOnly } = options;

  if (hotLeadsOnly) {
    return getHotLeads(limit).map(formatFloridaBusiness);
  }

  const parsed = parseFloridaQuery(query);
  let businesses: FloridaBusiness[] = [];

  const effectiveCategory = category || parsed.categories[0];
  const effectiveRegion = region || parsed.regions[0];
  const effectiveMinScore = minScore || parsed.minScore;

  if (effectiveCategory) {
    businesses = getByCategory(effectiveCategory, 100);
    if (effectiveRegion) {
      businesses = businesses.filter(b => b.region === effectiveRegion);
    }
  } else if (effectiveRegion) {
    businesses = getByRegion(effectiveRegion, 100);
  } else {
    businesses = searchFloridaBusinesses({ query, limit: 100 });
  }

  if (parsed.needsVideo) {
    businesses = businesses.filter(b => !b.socialPresence.hasVideo);
  }

  if (effectiveMinScore) {
    businesses = businesses.filter(b => b.score >= effectiveMinScore);
  }

  businesses.sort((a, b) => b.score - a.score);

  return businesses.slice(0, limit).map(formatFloridaBusiness);
}

// ============ MAIN API ============
export async function POST(request: Request) {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    const body: SearchRequest = await request.json();
    const {
      query = "",
      mode = "both",
      limit = 20,
      domain,
      category,
      region,
      city,
      minScore,
      enrichResults = false,
      hotLeadsOnly = false,
    } = body;

    let results: CompanyResult[] = [];
    let webResultsCount = 0;
    let localResultsCount = 0;
    let firecrawlCreditsUsed = 0;

    // MODE: Direct domain lookup
    if (mode === "direct" && domain) {
      const result = await lookupDomain(domain);
      if (result) {
        results.push(result);
        firecrawlCreditsUsed = 1;
      }
    }
    // MODE: Web search only
    else if (mode === "web") {
      const webResults = await searchWeb(query, limit);
      webResultsCount = webResults.length;

      if (enrichResults && webResults.length > 0) {
        const enrichLimit = Math.min(webResults.length, 5);
        for (let i = 0; i < enrichLimit; i++) {
          const enriched = await enrichCompany(webResults[i].domain);
          if (enriched) {
            results.push(enriched);
            firecrawlCreditsUsed++;
          } else {
            results.push(webResults[i]);
          }
        }
        results.push(...webResults.slice(enrichLimit));
      } else {
        results = webResults;
      }
    }
    // MODE: Local Florida database only
    else if (mode === "local") {
      results = searchFloridaDB(query, { category, region, limit, minScore, hotLeadsOnly });
      localResultsCount = results.length;
    }
    // MODE: Both web and local
    else {
      const floridaKeywords = ["florida", "fl", "miami", "orlando", "tampa", "jacksonville", "roofing", "hvac", "plumbing", "pool", "landscaping", "kitchen", "bath", "painting", "electrical", "solar", "pest", "cleaning", "home service", "renovation", "remodel"];
      const isFloridaSearch = floridaKeywords.some(k => query.toLowerCase().includes(k));

      if (isFloridaSearch || hotLeadsOnly) {
        const localResults = searchFloridaDB(query, { category, region, limit, minScore, hotLeadsOnly });
        localResultsCount = localResults.length;
        results.push(...localResults);

        if (results.length < limit && !hotLeadsOnly) {
          const webResults = await searchWeb(query, limit - results.length);
          webResultsCount = webResults.length;
          results.push(...webResults);
        }
      } else {
        const webResults = await searchWeb(query, Math.ceil(limit / 2));
        webResultsCount = webResults.length;

        if (enrichResults && webResults.length > 0) {
          const enrichLimit = Math.min(webResults.length, 3);
          for (let i = 0; i < enrichLimit; i++) {
            const enriched = await enrichCompany(webResults[i].domain);
            if (enriched) {
              results.push(enriched);
              firecrawlCreditsUsed++;
            } else {
              results.push(webResults[i]);
            }
          }
          results.push(...webResults.slice(enrichLimit));
        } else {
          results.push(...webResults);
        }

        const localResults = searchFloridaDB(query, { limit: limit - results.length });
        localResultsCount = localResults.length;
        results.push(...localResults);
      }
    }

    results.sort((a, b) => b.score - a.score);

    const seenDomains = new Set<string>();
    results = results.filter(r => {
      if (seenDomains.has(r.domain)) return false;
      seenDomains.add(r.domain);
      return true;
    });

    results = results.slice(0, limit);

    // Return in "leads" format for UI compatibility
    return NextResponse.json({
      success: true,
      query: {
        original: query || domain || "",
        mode,
        enriched: enrichResults,
      },
      stats: {
        totalResults: results.length,
        webResults: webResultsCount,
        localResults: localResultsCount,
        processingTimeMs: Date.now() - startTime,
        searchProvider: isSearchConfigured() ? process.env.SEARCH_PROVIDER || "tavily" : undefined,
        firecrawlCreditsUsed: firecrawlCreditsUsed > 0 ? firecrawlCreditsUsed : undefined,
        totalInDatabase: FLORIDA_BUSINESS_STATS.total,
        categories: FLORIDA_BUSINESS_STATS.categories,
        regions: FLORIDA_BUSINESS_STATS.regions,
      },
      leads: results, // UI expects "leads"
      results, // Also provide as "results"
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({
      success: false,
      error: "Search failed",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

// GET endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || searchParams.get("query");
  const domain = searchParams.get("domain");
  const mode = searchParams.get("mode") as "web" | "local" | "both" | "direct" | null;
  const category = searchParams.get("category");
  const region = searchParams.get("region");
  const limit = parseInt(searchParams.get("limit") || "20");
  const enrich = searchParams.get("enrich") === "true";
  const hotLeads = searchParams.get("hot") === "true";

  if (domain) {
    return POST(new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, mode: "direct", enrichResults: true }),
    }));
  }

  if (!query && !category && !region && !hotLeads) {
    return NextResponse.json({
      success: true,
      message: "Universal Company Search API",
      description: "Find and research ANY company on the internet",
      capabilities: {
        webSearch: isSearchConfigured(),
        searchProvider: process.env.SEARCH_PROVIDER || "not configured",
        firecrawl: !!process.env.FIRECRAWL_API_KEY,
        floridaDatabase: {
          total: FLORIDA_BUSINESS_STATS.total,
          categories: FLORIDA_BUSINESS_STATS.categories,
          regions: FLORIDA_BUSINESS_STATS.regions,
        },
      },
      usage: {
        "GET ?q=query": "Search any company (web + local)",
        "GET ?domain=example.com": "Direct domain lookup with Firecrawl enrichment",
        "GET ?q=roofing+miami&mode=local": "Florida database only",
        "GET ?q=AI+startups&mode=web&enrich=true": "Web search with Firecrawl enrichment",
        "GET ?hot=true": "Hot Florida leads",
        "GET ?category=Kitchen+%26+Bath": "Filter by category",
      },
      examples: [
        "?q=AI startups San Francisco",
        "?q=roofing companies miami",
        "?domain=stripe.com",
        "?q=fintech&mode=web&enrich=true",
        "?hot=true&limit=10",
        "?category=Kitchen+%26+Bath&region=South+Florida",
      ],
    });
  }

  return POST(new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      mode: mode || "both",
      category,
      region,
      limit,
      enrichResults: enrich,
      hotLeadsOnly: hotLeads,
    }),
  }));
}
