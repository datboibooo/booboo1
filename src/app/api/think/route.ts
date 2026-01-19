/**
 * Thinking Model API
 *
 * POST /api/think
 *
 * Executes a research query using the thinking model orchestrator.
 */

import { NextRequest, NextResponse } from "next/server";
import { runResearch, parseQueryIntent, createResearchPlan } from "@/lib/thinking/orchestrator";

// Demo companies to crawl when no specific list provided
const DEMO_COMPANIES = [
  { domain: "notion.so", name: "Notion" },
  { domain: "figma.com", name: "Figma" },
  { domain: "linear.app", name: "Linear" },
  { domain: "vercel.com", name: "Vercel" },
  { domain: "planetscale.com", name: "PlanetScale" },
  { domain: "retool.com", name: "Retool" },
  { domain: "supabase.com", name: "Supabase" },
  { domain: "railway.app", name: "Railway" },
  { domain: "clerk.com", name: "Clerk" },
  { domain: "resend.com", name: "Resend" },
  { domain: "liveblocks.io", name: "Liveblocks" },
  { domain: "inngest.com", name: "Inngest" },
  { domain: "axiom.co", name: "Axiom" },
  { domain: "neon.tech", name: "Neon" },
  { domain: "tinybird.co", name: "Tinybird" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, companies, mode = "full" } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Use provided companies or demo list
    const targetCompanies = companies && companies.length > 0
      ? companies
      : DEMO_COMPANIES;

    if (mode === "parse") {
      // Just parse the intent, don't execute
      const intent = parseQueryIntent(query);
      return NextResponse.json({ intent });
    }

    if (mode === "plan") {
      // Parse and plan, don't execute
      const intent = parseQueryIntent(query);
      const plan = createResearchPlan(intent);
      return NextResponse.json({ intent, plan });
    }

    // Full execution
    const result = await runResearch(query, targetCompanies);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Think API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET endpoint for streaming (SSE) - future implementation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  // For now, return a simple response
  // TODO: Implement Server-Sent Events for streaming updates
  const intent = parseQueryIntent(query);
  const plan = createResearchPlan(intent);

  return NextResponse.json({
    intent,
    plan,
    message: "Use POST for full execution",
  });
}
