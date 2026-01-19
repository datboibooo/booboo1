import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/db/supabase-server";
import { runPipeline } from "@/lib/pipeline";
import { getUserConfig, getLists, getListAccounts } from "@/lib/db/queries";
import { DEFAULT_USER_CONFIG, isDemoMode } from "@/lib/fixtures/demo-data";

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Demo mode - just return success
    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: "Demo mode - no actual processing",
        isDemo: true,
      });
    }

    const supabase = createServiceRoleClient();

    // Get all users with active configurations
    const { data: configs, error: configError } = await supabase
      .from("user_configs")
      .select("user_id, config")
      .order("version", { ascending: false });

    if (configError) {
      throw configError;
    }

    // Deduplicate by user (get latest config per user)
    const userConfigs = new Map<string, { user_id: string; config: typeof DEFAULT_USER_CONFIG }>();
    for (const row of configs || []) {
      if (!userConfigs.has(row.user_id)) {
        userConfigs.set(row.user_id, row);
      }
    }

    const results = [];

    for (const [userId, { config }] of userConfigs) {
      try {
        // Skip if onboarding not complete
        if (!config.onboardingComplete) {
          continue;
        }

        // Run hunt mode if enabled
        if (config.modes.huntEnabled) {
          const huntResult = await runPipeline(supabase, userId, config, {
            mode: "hunt",
            limit: config.modes.huntDailyLimit,
          });

          results.push({
            userId,
            mode: "hunt",
            leadsGenerated: huntResult.stats.leadsGenerated,
            errors: huntResult.errors,
          });
        }

        // Run watch mode if enabled
        if (config.modes.watchEnabled) {
          const watchLists = await getLists(supabase, userId, "watch");

          for (const list of watchLists) {
            const accounts = await getListAccounts(supabase, list.id);
            const domains = accounts.filter((a) => a.status === "active").map((a) => a.domain);

            if (domains.length === 0) continue;

            const watchResult = await runPipeline(supabase, userId, config, {
              mode: "watch",
              listId: list.id,
              domains,
              limit: domains.length,
            });

            results.push({
              userId,
              mode: "watch",
              listId: list.id,
              leadsGenerated: watchResult.stats.leadsGenerated,
              errors: watchResult.errors,
            });
          }
        }
      } catch (error) {
        results.push({
          userId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      usersProcessed: userConfigs.size,
      results,
      isDemo: false,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}
