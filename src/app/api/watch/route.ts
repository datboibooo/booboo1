import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { getLists, createList, getListAccounts, addAccountsToList } from "@/lib/db/queries";
import { normalizeDomain, isValidDomain, dedupeDomains } from "@/lib/utils";
import { isDemoMode } from "@/lib/fixtures/demo-data";

export async function GET() {
  try {
    // Demo mode
    if (isDemoMode()) {
      return NextResponse.json({
        lists: [
          {
            id: "demo-list-1",
            userId: "demo-user",
            name: "Enterprise Accounts",
            type: "watch",
            description: "Key enterprise accounts to monitor",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            archived: false,
            accountCount: 25,
          },
          {
            id: "demo-list-2",
            userId: "demo-user",
            name: "Competitor Customers",
            type: "watch",
            description: "Accounts using competitor solutions",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            archived: false,
            accountCount: 50,
          },
        ],
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

    const lists = await getLists(supabase, user.id, "watch");

    // Get account counts
    const listsWithCounts = await Promise.all(
      lists.map(async (list) => {
        const accounts = await getListAccounts(supabase, list.id);
        return {
          ...list,
          accountCount: accounts.length,
        };
      })
    );

    return NextResponse.json({ lists: listsWithCounts, isDemo: false });
  } catch (error) {
    console.error("Error fetching watch lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch watch lists" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "List name is required" },
        { status: 400 }
      );
    }

    // Demo mode
    if (isDemoMode()) {
      return NextResponse.json({
        list: {
          id: "demo-new-list",
          userId: "demo-user",
          name,
          type: "watch",
          description: description || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          archived: false,
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

    const list = await createList(supabase, user.id, {
      name,
      type: "watch",
      description,
    });

    return NextResponse.json({ list, isDemo: false });
  } catch (error) {
    console.error("Error creating watch list:", error);
    return NextResponse.json(
      { error: "Failed to create watch list" },
      { status: 500 }
    );
  }
}
