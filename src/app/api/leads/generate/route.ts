import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { getUserConfig, getListAccounts } from "@/lib/db/queries";
import { runPipeline } from "@/lib/pipeline";
import { GenerateLeadsRequestSchema } from "@/lib/schemas";
import {
  generateDemoLeads,
  isDemoMode,
  DEFAULT_USER_CONFIG,
} from "@/lib/fixtures/demo-data";

export const maxDuration = 300; // 5 minutes for serverless

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = GenerateLeadsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { mode, limit, listId } = parsed.data;

    // Demo mode
    if (isDemoMode()) {
      const demoLeads = generateDemoLeads(limit);
      return NextResponse.json({
        runId: "demo-run",
        leads: demoLeads,
        stats: {
          queriesExecuted: 25,
          candidatesFound: 150,
          candidatesAfterDedup: 120,
          evidenceChunksFetched: 480,
          signalEvaluations: 120,
          leadsGenerated: demoLeads.length,
          leadsPassedGate: demoLeads.length,
          insufficientEvidence: 70,
          disqualified: 0,
          duplicatesSkipped: 0,
        },
        isDemo: true,
      });
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user config
    let config = await getUserConfig(supabase, user.id);
    if (!config) {
      config = DEFAULT_USER_CONFIG;
    }

    // Get domains for watch mode
    let domains: string[] | undefined;
    if (mode === "watch" && listId) {
      const accounts = await getListAccounts(supabase, listId);
      domains = accounts.map((a) => a.domain);
    }

    // Run pipeline
    const result = await runPipeline(supabase, user.id, config, {
      mode,
      limit,
      listId,
      domains,
    });

    return NextResponse.json({
      runId: result.runId,
      leads: result.leads,
      stats: result.stats,
      errors: result.errors,
      isDemo: false,
    });
  } catch (error) {
    console.error("Error generating leads:", error);
    return NextResponse.json(
      { error: "Failed to generate leads" },
      { status: 500 }
    );
  }
}
