import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { getUserConfig, saveUserConfig } from "@/lib/db/queries";
import { UserConfigSchema } from "@/lib/schemas";
import { DEFAULT_USER_CONFIG, isDemoMode } from "@/lib/fixtures/demo-data";

export async function GET() {
  try {
    // Demo mode
    if (isDemoMode()) {
      return NextResponse.json({ config: DEFAULT_USER_CONFIG, isDemo: true });
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await getUserConfig(supabase, user.id);

    return NextResponse.json({
      config: config || DEFAULT_USER_CONFIG,
      isDemo: false,
    });
  } catch (error) {
    console.error("Error fetching config:", error);
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = UserConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid config", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Demo mode - just return success
    if (isDemoMode()) {
      return NextResponse.json({ success: true, isDemo: true });
    }

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await saveUserConfig(supabase, user.id, parsed.data);

    return NextResponse.json({ success: true, isDemo: false });
  } catch (error) {
    console.error("Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Demo mode - just return success
    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        config: { ...DEFAULT_USER_CONFIG, ...body },
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

    // Get current config
    let config = await getUserConfig(supabase, user.id);
    if (!config) {
      config = DEFAULT_USER_CONFIG;
    }

    // Merge with updates
    const updatedConfig = {
      ...config,
      ...body,
      version: config.version + 1,
    };

    // Validate
    const parsed = UserConfigSchema.safeParse(updatedConfig);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid config update", details: parsed.error.issues },
        { status: 400 }
      );
    }

    await saveUserConfig(supabase, user.id, parsed.data);

    return NextResponse.json({
      success: true,
      config: parsed.data,
      isDemo: false,
    });
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}
