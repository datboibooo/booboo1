import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/db/supabase-server";
import { getSearchProvider } from "@/lib/providers/search";
import { TestSignalRequestSchema, TestSignalResultSchema } from "@/lib/schemas";
import { isDemoMode } from "@/lib/fixtures/demo-data";
import { hashString } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = TestSignalRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { signal, testDomains, sampleSize } = parsed.data;

    // Demo mode
    if (isDemoMode()) {
      return NextResponse.json({
        result: {
          queriesExecuted: signal.queryTemplates.slice(0, 3),
          matchesFound: Math.floor(Math.random() * 5) + 1,
          evidenceExtracted: [
            {
              url: "https://example.com/news/article",
              title: "Example News Article",
              snippet: "Sample evidence snippet that matches the signal criteria...",
              sourceType: "news",
              fetchedAt: new Date().toISOString(),
              hash: hashString("example"),
            },
          ],
          scoreImpact: signal.weight * 0.8 * 10,
          qualityChecklist: {
            isSpecific: signal.question.includes("specific") || signal.queryTemplates.length > 2,
            isObservable: !signal.question.toLowerCase().includes("intend"),
            hasQualifiers: signal.question.includes("{account}"),
            lowAmbiguity: signal.queryTemplates.every((t) => t.split(" ").length >= 2),
          },
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

    // Execute test queries
    const search = getSearchProvider();
    const queriesToRun = signal.queryTemplates.slice(0, sampleSize);
    const evidenceExtracted = [];
    let matchesFound = 0;

    for (const query of queriesToRun) {
      try {
        const response = await search.search(query, { maxResults: 5 });

        for (const result of response.results) {
          evidenceExtracted.push({
            url: result.url,
            title: result.title,
            snippet: result.snippet,
            sourceType: "other" as const,
            fetchedAt: new Date().toISOString(),
            hash: hashString(result.url + result.snippet),
          });

          // Simple match detection
          const lowerSnippet = result.snippet.toLowerCase();
          const hasMatch = signal.queryTemplates.some((t) =>
            lowerSnippet.includes(t.toLowerCase().split(" ")[0])
          );
          if (hasMatch) matchesFound++;
        }
      } catch (error) {
        console.warn(`Query failed: ${query}`, error);
      }
    }

    // Quality checklist
    const qualityChecklist = {
      isSpecific:
        signal.queryTemplates.length >= 2 &&
        signal.queryTemplates.some((t) => t.split(" ").length >= 3),
      isObservable:
        !signal.question.toLowerCase().includes("intend") &&
        !signal.question.toLowerCase().includes("plan to") &&
        !signal.question.toLowerCase().includes("consider"),
      hasQualifiers: signal.question.includes("{account}"),
      lowAmbiguity:
        signal.queryTemplates.every((t) => t.split(" ").length >= 2) &&
        signal.queryTemplates.length <= 6,
    };

    const result = {
      queriesExecuted: queriesToRun,
      matchesFound,
      evidenceExtracted: evidenceExtracted.slice(0, 10),
      scoreImpact: signal.weight * (matchesFound > 0 ? 0.8 : 0) * 10,
      qualityChecklist,
    };

    return NextResponse.json({ result, isDemo: false });
  } catch (error) {
    console.error("Error testing signal:", error);
    return NextResponse.json(
      { error: "Failed to test signal" },
      { status: 500 }
    );
  }
}
