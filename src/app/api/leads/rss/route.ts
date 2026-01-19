import { NextRequest, NextResponse } from "next/server";
import { generateLeadsFromRSS } from "@/lib/data/lead-generator";
import { testRSSFeeds } from "@/lib/data/rss-fetcher";
import { isLLMConfigured } from "@/lib/providers/llm";

export const maxDuration = 120; // 2 minutes

// GET - Test RSS feeds and return status
export async function GET() {
  try {
    const feedStatus = await testRSSFeeds();

    return NextResponse.json({
      success: true,
      llmConfigured: isLLMConfigured(),
      feeds: feedStatus,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to test feeds", details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Generate leads from RSS feeds
export async function POST(request: NextRequest) {
  try {
    // Check if LLM is configured
    if (!isLLMConfigured()) {
      return NextResponse.json(
        {
          error: "LLM not configured",
          message: "Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable",
        },
        { status: 400 }
      );
    }

    // Parse options from request body
    const body = await request.json().catch(() => ({}));
    const maxItems = Math.min(body.maxItems || 10, 50); // Cap at 50
    const skipOpeners = body.skipOpeners || false;
    const enableVerification = body.enableVerification || false;
    const verificationMinConfidence = body.verificationMinConfidence || 0.45;

    console.log(
      `Starting RSS lead generation (maxItems: ${maxItems}, verification: ${enableVerification})`
    );

    const result = await generateLeadsFromRSS({
      maxItems,
      skipOpeners,
      enableVerification,
      verificationMinConfidence,
    });

    return NextResponse.json({
      success: true,
      leads: result.leads,
      stats: result.stats,
      verificationEnabled: enableVerification,
    });
  } catch (error) {
    console.error("Lead generation failed:", error);
    return NextResponse.json(
      {
        error: "Lead generation failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
