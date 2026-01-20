/**
 * API Route: Test AI Provider Connection
 * POST /api/ai/test
 *
 * Tests if an API key is valid by making a minimal request
 */

import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { AIProvider } from "@/lib/ai/config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, apiKey } = body as { provider: AIProvider; apiKey: string };

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Missing provider or apiKey" },
        { status: 400 }
      );
    }

    // Test with minimal request
    const startTime = Date.now();
    let testModel;
    let response;

    switch (provider) {
      case "openai": {
        const openai = createOpenAI({ apiKey });
        testModel = openai("gpt-4o-mini");
        break;
      }
      case "anthropic": {
        const anthropic = createAnthropic({ apiKey });
        testModel = anthropic("claude-3-5-haiku-20241022");
        break;
      }
      case "google": {
        // For Google, we'll validate the key format for now
        if (!apiKey.startsWith("AIza") || apiKey.length < 30) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid Google API key format",
              details: "Google API keys typically start with 'AIza'"
            },
            { status: 400 }
          );
        }
        // Return success for format validation (full test would need google SDK)
        return NextResponse.json({
          success: true,
          provider,
          latency: 0,
          message: "API key format validated (full test requires additional setup)",
        });
      }
      default:
        return NextResponse.json(
          { error: `Unknown provider: ${provider}` },
          { status: 400 }
        );
    }

    // Make test request
    response = await generateText({
      model: testModel,
      prompt: "Say 'OK' and nothing else.",
    });

    const latency = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider,
      model: provider === "openai" ? "gpt-4o-mini" : "claude-3-5-haiku-20241022",
      latency,
      response: response.text,
      usage: response.usage,
    });
  } catch (error) {
    console.error("AI test error:", error);

    // Parse error message for user-friendly response
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    let userMessage = "Failed to connect to AI provider";
    let details = errorMessage;

    if (errorMessage.includes("401") || errorMessage.includes("invalid_api_key")) {
      userMessage = "Invalid API key";
      details = "The API key was rejected by the provider. Please check that it's correct.";
    } else if (errorMessage.includes("429")) {
      userMessage = "Rate limited";
      details = "Too many requests. The API key is valid but rate limited.";
    } else if (errorMessage.includes("insufficient_quota")) {
      userMessage = "Insufficient quota";
      details = "The API key is valid but has no remaining credits.";
    } else if (errorMessage.includes("network") || errorMessage.includes("ECONNREFUSED")) {
      userMessage = "Network error";
      details = "Could not connect to the AI provider. Check your internet connection.";
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        details,
      },
      { status: 400 }
    );
  }
}
