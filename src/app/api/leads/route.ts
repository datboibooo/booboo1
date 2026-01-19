import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { getLeadsWithFilters } from "@/lib/db/queries";
import { generateDemoLeads, isDemoMode } from "@/lib/fixtures/demo-data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const status = searchParams.get("status") || undefined;
    const minScore = searchParams.get("minScore")
      ? parseInt(searchParams.get("minScore")!)
      : undefined;
    const maxScore = searchParams.get("maxScore")
      ? parseInt(searchParams.get("maxScore")!)
      : undefined;
    const industry = searchParams.get("industry") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;

    // Demo mode
    if (isDemoMode()) {
      const demoLeads = generateDemoLeads(limit);
      return NextResponse.json({
        leads: demoLeads,
        total: demoLeads.length,
        isDemo: true,
      });
    }

    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leads, total } = await getLeadsWithFilters(supabase, user.id, {
      date,
      status,
      minScore,
      maxScore,
      industry,
      limit,
      offset,
    });

    return NextResponse.json({ leads, total, isDemo: false });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
