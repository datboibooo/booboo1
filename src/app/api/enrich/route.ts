import { NextRequest, NextResponse } from "next/server";
import { researchCompany, quickEnrich, type CompanyResearch } from "@/lib/firecrawl";

export interface EnrichRequest {
  domain: string;
  mode?: "quick" | "deep"; // quick = homepage only, deep = multiple pages
}

export interface EnrichResponse {
  success: boolean;
  data?: CompanyResearch | {
    description?: string;
    signals: string[];
    techStack: string[];
  };
  error?: string;
  cached?: boolean;
}

// Simple in-memory cache (in production, use Redis)
const cache = new Map<string, { data: CompanyResearch; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const body: EnrichRequest = await request.json();

    if (!body.domain) {
      return NextResponse.json(
        { success: false, error: "domain is required" },
        { status: 400 }
      );
    }

    // Clean domain
    const domain = body.domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];

    const mode = body.mode || "quick";

    // Check cache for deep mode
    if (mode === "deep") {
      const cached = cache.get(domain);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({
          success: true,
          data: cached.data,
          cached: true,
        });
      }
    }

    // Perform enrichment
    if (mode === "quick") {
      const data = await quickEnrich(domain);
      return NextResponse.json({ success: true, data });
    } else {
      const data = await researchCompany(domain);

      // Cache the result
      cache.set(domain, { data, timestamp: Date.now() });

      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    console.error("Enrichment error:", error);
    return NextResponse.json(
      { success: false, error: "Enrichment failed" },
      { status: 500 }
    );
  }
}

// GET endpoint for quick lookups
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { success: false, error: "domain query param is required" },
      { status: 400 }
    );
  }

  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];

  // Check cache first
  const cached = cache.get(cleanDomain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      success: true,
      data: cached.data,
      cached: true,
    });
  }

  // Quick enrich
  const data = await quickEnrich(cleanDomain);
  return NextResponse.json({ success: true, data });
}
