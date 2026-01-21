import { NextRequest, NextResponse } from "next/server";
import { runResearch, researchCompanies } from "@/lib/research/orchestrator";
import { SignalType } from "@/lib/research/types";

// Fallback sample signals when APIs fail
const SAMPLE_SIGNALS = [
  {
    id: "sig_1",
    companyName: "Anthropic",
    domain: "anthropic.com",
    signalType: "funding",
    title: "Anthropic Raises $750M Series D",
    snippet: "AI safety company Anthropic has raised $750 million in Series D funding, valuing the company at $18.4 billion.",
    url: "https://techcrunch.com/anthropic-series-d",
    confidence: "high" as const,
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sig_2",
    companyName: "Vercel",
    domain: "vercel.com",
    signalType: "hiring",
    title: "Vercel Expanding Engineering Team",
    snippet: "Vercel is hiring 50+ engineers to scale their edge computing platform and improve developer experience.",
    url: "https://vercel.com/careers",
    confidence: "high" as const,
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sig_3",
    companyName: "OpenAI",
    domain: "openai.com",
    signalType: "product_launch",
    title: "OpenAI Launches GPT-5",
    snippet: "OpenAI announces GPT-5 with improved reasoning capabilities and reduced hallucinations.",
    url: "https://openai.com/blog/gpt-5",
    confidence: "high" as const,
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sig_4",
    companyName: "Stripe",
    domain: "stripe.com",
    signalType: "expansion",
    title: "Stripe Expands to 10 New Countries",
    snippet: "Stripe expands global availability to 10 new markets including Southeast Asia and Latin America.",
    url: "https://stripe.com/blog/expansion",
    confidence: "medium" as const,
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sig_5",
    companyName: "Ramp",
    domain: "ramp.com",
    signalType: "funding",
    title: "Ramp Closes $300M Series D",
    snippet: "Corporate card startup Ramp raised $300M at a $8.1B valuation to expand AI-powered expense management.",
    url: "https://techcrunch.com/ramp-series-d",
    confidence: "high" as const,
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sig_6",
    companyName: "Linear",
    domain: "linear.app",
    signalType: "hiring",
    title: "Linear Building Out Sales Team",
    snippet: "Linear is hiring their first sales team as they expand upmarket to enterprise customers.",
    url: "https://linear.app/careers",
    confidence: "medium" as const,
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sig_7",
    companyName: "Notion",
    domain: "notion.so",
    signalType: "product_launch",
    title: "Notion Launches AI-Powered Q&A",
    snippet: "Notion releases AI Q&A feature that lets users ask questions about their workspace content.",
    url: "https://notion.so/product/ai",
    confidence: "high" as const,
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sig_8",
    companyName: "Supabase",
    domain: "supabase.com",
    signalType: "funding",
    title: "Supabase Raises $116M Series C",
    snippet: "Open source Firebase alternative Supabase raised $116M to accelerate AI/ML integrations.",
    url: "https://techcrunch.com/supabase-series-c",
    confidence: "high" as const,
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sig_9",
    companyName: "Scale AI",
    domain: "scale.com",
    signalType: "leadership_change",
    title: "Scale AI Hires New CFO",
    snippet: "Scale AI appoints former Snowflake executive as CFO ahead of potential IPO.",
    url: "https://scale.com/blog/new-cfo",
    confidence: "medium" as const,
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sig_10",
    companyName: "Retool",
    domain: "retool.com",
    signalType: "partnership",
    title: "Retool Partners with Snowflake",
    snippet: "Retool announces native Snowflake integration for building internal tools on data warehouse.",
    url: "https://retool.com/blog/snowflake",
    confidence: "medium" as const,
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

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
      // Try to get real data first
      let result;
      let usedFallback = false;

      try {
        result = await runResearch({
          signalTypes: signalTypes as SignalType[] | undefined,
          maxResults,
          enrichDomains,
        });
      } catch (err) {
        console.error("Research failed, using fallback:", err);
        result = { signals: [], stats: { agentsRun: 0, totalRawSignals: 0, uniqueSignals: 0, processingTimeMs: 0 }, errors: [] };
      }

      // If no signals found, use fallback data
      if (result.signals.length === 0) {
        usedFallback = true;
        const filteredSamples = signalTypes
          ? SAMPLE_SIGNALS.filter(s => (signalTypes as string[]).includes(s.signalType))
          : SAMPLE_SIGNALS;

        return NextResponse.json({
          success: true,
          signals: filteredSamples.slice(0, maxResults),
          stats: {
            ...result.stats,
            usedFallback: true,
            note: "Using sample data. Configure EXA_API_KEY for live discovery.",
          },
          errors: result.errors.length > 0 ? result.errors : undefined,
        });
      }

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
