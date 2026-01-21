/**
 * Florida Home Service Business Search API
 * Find local businesses that need AI video content for social media
 * Package: 20 videos / $2,000
 */

import { NextResponse } from "next/server";
import {
  FLORIDA_BUSINESSES,
  searchFloridaBusinesses,
  getHotLeads,
  getByCategory,
  getByRegion,
  FLORIDA_BUSINESS_STATS,
  type FloridaBusiness,
} from "@/lib/data/florida-businesses";

// ============ QUERY PARSER ============
interface ParsedQuery {
  original: string;
  categories: string[];
  regions: string[];
  cities: string[];
  keywords: string[];
  minScore?: number;
  revenueRange?: string;
  employeeRange?: string;
  needsVideo: boolean;
  noSocial: boolean;
}

function parseQuery(query: string): ParsedQuery {
  const lower = query.toLowerCase();
  const result: ParsedQuery = {
    original: query,
    categories: [],
    regions: [],
    cities: [],
    keywords: [],
    needsVideo: false,
    noSocial: false,
  };

  // Category detection
  const categoryMap: Record<string, string[]> = {
    "Roofing": ["roof", "roofing", "roofer", "shingle"],
    "HVAC": ["hvac", "ac", "air conditioning", "heating", "cooling", "air condition"],
    "Plumbing": ["plumb", "plumber", "plumbing", "pipe", "drain"],
    "Electrical": ["electric", "electrical", "electrician", "wiring"],
    "Pool Service": ["pool", "pools", "swimming pool"],
    "Landscaping": ["landscape", "landscaping", "lawn", "garden", "tree", "yard"],
    "Pest Control": ["pest", "exterminator", "bug", "termite", "rodent"],
    "Cleaning": ["clean", "cleaning", "maid", "janitorial", "pressure wash"],
    "Painting": ["paint", "painter", "painting"],
    "Flooring": ["floor", "flooring", "tile", "carpet", "hardwood"],
    "Kitchen & Bath": ["kitchen", "bath", "bathroom", "remodel", "renovation"],
    "Garage Doors": ["garage", "garage door", "overhead door"],
    "Windows & Doors": ["window", "door", "glass", "impact"],
    "Fencing": ["fence", "fencing"],
    "Concrete": ["concrete", "paving", "driveway", "patio", "masonry"],
    "Solar": ["solar", "solar panel", "energy"],
    "Security": ["security", "alarm", "camera", "surveillance"],
    "Moving": ["moving", "mover", "relocation"],
    "Handyman": ["handyman", "repair", "fix"],
    "Septic": ["septic", "septic tank", "pumping"],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(k => lower.includes(k))) {
      result.categories.push(category);
    }
  }

  // Region detection
  const regionMap: Record<string, string[]> = {
    "South Florida": ["south florida", "miami", "fort lauderdale", "boca", "west palm", "broward", "dade", "palm beach"],
    "Central Florida": ["central florida", "orlando", "kissimmee", "daytona", "melbourne", "ocala", "gainesville", "lakeland"],
    "Tampa Bay": ["tampa", "st pete", "st. petersburg", "clearwater", "bradenton", "sarasota", "naples", "fort myers", "cape coral"],
    "Jacksonville": ["jacksonville", "jax", "st augustine", "ponte vedra"],
    "Panhandle": ["panhandle", "pensacola", "destin", "panama city", "tallahassee", "fort walton"],
  };

  for (const [region, keywords] of Object.entries(regionMap)) {
    if (keywords.some(k => lower.includes(k))) {
      result.regions.push(region);
    }
  }

  // City detection (major cities)
  const cities = ["miami", "orlando", "tampa", "jacksonville", "fort lauderdale", "west palm beach", "naples", "sarasota", "pensacola", "gainesville"];
  for (const city of cities) {
    if (lower.includes(city)) {
      result.cities.push(city);
    }
  }

  // Special filters
  if (lower.includes("no video") || lower.includes("needs video") || lower.includes("without video")) {
    result.needsVideo = true;
  }
  if (lower.includes("no social") || lower.includes("no facebook") || lower.includes("no instagram")) {
    result.noSocial = true;
  }

  // Revenue filters
  if (lower.includes("1m") || lower.includes("million")) {
    result.revenueRange = "$1M-$5M";
  }
  if (lower.includes("500k") || lower.includes("small")) {
    result.revenueRange = "$500K-$1M";
  }

  // Score filter
  if (lower.includes("hot") || lower.includes("best") || lower.includes("top")) {
    result.minScore = 75;
  }
  if (lower.includes("high score") || lower.includes("high potential")) {
    result.minScore = 80;
  }

  // Extract keywords
  const stopWords = ["the", "and", "for", "with", "that", "this", "are", "companies", "company", "businesses", "business", "find", "show", "florida", "in", "near"];
  result.keywords = lower.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));

  return result;
}

// ============ FILTER BUSINESSES ============
function filterBusinesses(parsedQuery: ParsedQuery): FloridaBusiness[] {
  let results = [...FLORIDA_BUSINESSES];

  // Filter by category
  if (parsedQuery.categories.length > 0) {
    results = results.filter(b =>
      parsedQuery.categories.some(c => b.category.toLowerCase() === c.toLowerCase())
    );
  }

  // Filter by region
  if (parsedQuery.regions.length > 0) {
    results = results.filter(b =>
      parsedQuery.regions.some(r => b.region.toLowerCase().includes(r.toLowerCase()))
    );
  }

  // Filter by city
  if (parsedQuery.cities.length > 0) {
    results = results.filter(b =>
      parsedQuery.cities.some(c => b.city.toLowerCase().includes(c.toLowerCase()))
    );
  }

  // Filter by video need
  if (parsedQuery.needsVideo) {
    results = results.filter(b => !b.socialPresence.hasVideo);
  }

  // Filter by no social
  if (parsedQuery.noSocial) {
    results = results.filter(b => !b.socialPresence.facebook && !b.socialPresence.instagram);
  }

  // Filter by revenue
  if (parsedQuery.revenueRange) {
    results = results.filter(b => b.estimatedRevenue === parsedQuery.revenueRange);
  }

  // Filter by minimum score
  if (parsedQuery.minScore !== undefined) {
    const minScore = parsedQuery.minScore;
    results = results.filter(b => b.score >= minScore);
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

// ============ FORMAT FOR UI ============
function formatBusinessForUI(business: FloridaBusiness) {
  // Generate video content package recommendation
  const packageRecommendation = generatePackageRec(business);

  // Generate opener
  const openers = generateOpeners(business);

  return {
    id: business.id,
    name: business.name,
    domain: business.website || `${business.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,

    // Business details
    industry: business.category,
    subCategory: business.subCategory,
    stage: business.estimatedRevenue,
    location: `${business.city}, FL`,
    region: business.region,
    phone: business.phone,
    email: business.email,
    website: business.website,

    // Company size
    employeeCount: business.employeeCount,
    yearsInBusiness: business.yearsInBusiness,

    // Scoring
    score: business.score,
    signals: business.signals,

    // Social presence (key for video pitch)
    socialPresence: business.socialPresence,
    hasVideo: business.socialPresence.hasVideo,
    hasFacebook: business.socialPresence.facebook,
    hasInstagram: business.socialPresence.instagram,
    hasYouTube: business.socialPresence.youtube,
    hasTikTok: business.socialPresence.tiktok,

    // Video opportunity
    videoOpportunity: !business.socialPresence.hasVideo ? "High" : business.socialPresence.youtube ? "Medium" : "Low",
    packageRecommendation,

    // Sales context
    whyNow: business.whyNow,
    painPoints: business.painPoints,
    idealFor: business.idealFor,

    // Video buyer criteria - WHY they would buy
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

    // Outreach
    openerShort: openers.short,
    openerMedium: openers.medium,
    targetTitles: [business.videoBuyerCriteria.decisionMaker, "Owner", "Marketing Manager"],
  };
}

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

// ============ MAIN API ============
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, limit = 20, category, region, city, minScore, hotLeadsOnly } = body;

    const startTime = Date.now();

    // If specific filters provided, use them directly
    if (hotLeadsOnly) {
      const leads = getHotLeads(limit).map(formatBusinessForUI);
      return NextResponse.json({
        success: true,
        query: { original: "Hot leads", parsed: { hotLeadsOnly: true } },
        stats: {
          totalInDatabase: FLORIDA_BUSINESS_STATS.total,
          leadsReturned: leads.length,
          processingTimeMs: Date.now() - startTime,
          categories: FLORIDA_BUSINESS_STATS.categories,
          regions: FLORIDA_BUSINESS_STATS.regions,
        },
        leads,
      });
    }

    if (category && !query) {
      const leads = getByCategory(category, limit).map(formatBusinessForUI);
      return NextResponse.json({
        success: true,
        query: { original: `Category: ${category}`, parsed: { categories: [category] } },
        stats: {
          totalInDatabase: FLORIDA_BUSINESS_STATS.total,
          leadsReturned: leads.length,
          processingTimeMs: Date.now() - startTime,
        },
        leads,
      });
    }

    if (region && !query) {
      const leads = getByRegion(region, limit).map(formatBusinessForUI);
      return NextResponse.json({
        success: true,
        query: { original: `Region: ${region}`, parsed: { regions: [region] } },
        stats: {
          totalInDatabase: FLORIDA_BUSINESS_STATS.total,
          leadsReturned: leads.length,
          processingTimeMs: Date.now() - startTime,
        },
        leads,
      });
    }

    // Parse natural language query
    const parsedQuery = query ? parseQuery(query) : {
      original: "all",
      categories: category ? [category] : [],
      regions: region ? [region] : [],
      cities: city ? [city] : [],
      keywords: [],
      minScore: minScore,
      needsVideo: false,
      noSocial: false,
    };

    // Filter and score businesses
    const filteredBusinesses = filterBusinesses(parsedQuery);
    const leads = filteredBusinesses.slice(0, limit).map(formatBusinessForUI);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query: {
        original: query || "default",
        parsed: parsedQuery,
      },
      stats: {
        totalInDatabase: FLORIDA_BUSINESS_STATS.total,
        matchingBusinesses: filteredBusinesses.length,
        leadsReturned: leads.length,
        processingTimeMs: processingTime,
        avgScore: FLORIDA_BUSINESS_STATS.avgScore,
        categories: FLORIDA_BUSINESS_STATS.categories,
        regions: FLORIDA_BUSINESS_STATS.regions,
      },
      leads,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed", details: String(error) }, { status: 500 });
  }
}

// GET endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || searchParams.get("query");
  const category = searchParams.get("category");
  const region = searchParams.get("region");
  const limit = parseInt(searchParams.get("limit") || "20");
  const hotLeads = searchParams.get("hot") === "true";

  if (!query && !category && !region && !hotLeads) {
    // Return API info and stats
    return NextResponse.json({
      success: true,
      message: "Florida Home Service Business Lead API",
      description: "Find local businesses that need AI video content for social media marketing",
      package: "20 videos / $2,000",
      stats: {
        totalBusinesses: FLORIDA_BUSINESS_STATS.total,
        categories: FLORIDA_BUSINESS_STATS.categories,
        regions: FLORIDA_BUSINESS_STATS.regions,
        avgScore: FLORIDA_BUSINESS_STATS.avgScore,
      },
      usage: {
        "POST": {
          description: "Search with natural language or filters",
          example: {
            query: "roofing companies in miami without video",
            limit: 20,
          },
        },
        "GET with query": "?q=plumbers+in+tampa",
        "GET with category": "?category=HVAC&region=South+Florida",
        "GET hot leads": "?hot=true&limit=10",
      },
      categories: [
        "Roofing", "HVAC", "Plumbing", "Electrical", "Pool Service",
        "Landscaping", "Pest Control", "Cleaning", "Painting", "Flooring",
        "Kitchen & Bath", "Garage Doors", "Windows & Doors", "Fencing",
        "Concrete", "Solar", "Security", "Moving", "Handyman", "Septic"
      ],
      regions: ["South Florida", "Central Florida", "Tampa Bay", "Jacksonville", "Panhandle"],
    });
  }

  // Forward to POST handler
  const requestBody = {
    query,
    category,
    region,
    limit,
    hotLeadsOnly: hotLeads,
  };

  return POST(new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  }));
}
