import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { addAccountsToList } from "@/lib/db/queries";
import { normalizeDomain, isValidDomain, dedupeDomains } from "@/lib/utils";
import { ImportWatchListRequestSchema } from "@/lib/schemas";
import { isDemoMode } from "@/lib/fixtures/demo-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = ImportWatchListRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { listId, domains } = parsed.data;

    // Normalize and validate domains
    const normalized = domains.map(normalizeDomain);
    const unique = dedupeDomains(normalized);
    const valid = unique.filter(isValidDomain);
    const invalid = unique.filter((d) => !isValidDomain(d));

    // Demo mode
    if (isDemoMode()) {
      return NextResponse.json({
        imported: valid.length,
        skipped: invalid.length,
        invalidDomains: invalid.slice(0, 10),
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

    // Verify list ownership
    const { data: list } = await supabase
      .from("lists")
      .select("user_id")
      .eq("id", listId)
      .single();

    if (!list || list.user_id !== user.id) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Add accounts
    const accounts = valid.map((domain) => ({ domain }));
    const importedCount = await addAccountsToList(supabase, listId, accounts);

    return NextResponse.json({
      imported: importedCount,
      skipped: invalid.length,
      invalidDomains: invalid.slice(0, 10),
      isDemo: false,
    });
  } catch (error) {
    console.error("Error importing domains:", error);
    return NextResponse.json(
      { error: "Failed to import domains" },
      { status: 500 }
    );
  }
}
