import { NextRequest, NextResponse } from "next/server";
import { generateOutreach } from "@/lib/outreach/generator";
import { GenerateOutreachInput } from "@/lib/outreach/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = GenerateOutreachInput.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Check for API keys
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: "No LLM API key configured",
          message: "Set OPENAI_API_KEY or ANTHROPIC_API_KEY to enable outreach generation",
        },
        { status: 503 }
      );
    }

    // Generate outreach messages
    const result = await generateOutreach(input);

    if (result.messages.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate messages", messages: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: result.messages,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error("Outreach generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate outreach",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
