import { NextRequest, NextResponse } from "next/server";
import { runResearch, researchCompanies } from "@/lib/research/orchestrator";
import { SignalType } from "@/lib/research/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mode = "discover", // "discover" or "enrich"
      signalTypes,
      companies,
      maxResults = 50,
      enrichDomains = true,
    } = body;

    // Mode 1: Discover new signals from the web
    if (mode === "discover") {
      const result = await runResearch({
        signalTypes: signalTypes as SignalType[] | undefined,
        maxResults,
        enrichDomains,
      });

      return NextResponse.json({
        success: true,
        signals: result.signals,
        stats: result.stats,
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
    }

    // Mode 2: Research specific companies
    if (mode === "enrich" && companies) {
      const signals = await researchCompanies(
        companies as Array<{ domain: string; companyName: string }>,
        signalTypes as SignalType[] | undefined
      );

      return NextResponse.json({
        success: true,
        signals,
        stats: {
          companiesResearched: companies.length,
          signalsFound: signals.length,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid mode or missing parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json(
      {
        error: "Research failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for quick status/health check
export async function GET() {
  const hasExa = !!process.env.EXA_API_KEY;
  const hasFirecrawl = !!process.env.FIRECRAWL_API_KEY;
  const hasLLM = !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    status: "ok",
    capabilities: {
      exaSearch: hasExa,
      companyCrawling: true,
      firecrawlEnhanced: hasFirecrawl,
      domainEnrichment: hasLLM,
      rssAggregation: true,
    },
    signalTypes: [
      "funding",
      "hiring",
      "product_launch",
      "leadership_change",
      "expansion",
      "partnership",
      "acquisition",
      "tech_adoption",
    ],
  });
}
