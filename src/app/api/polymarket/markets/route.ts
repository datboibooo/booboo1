/**
 * Polymarket Markets API
 * Fetch Trump-related prediction markets and betting opportunities
 */

import { NextResponse } from "next/server";
import {
  fetchTrumpMarkets,
  findTrumpBetOpportunities,
  getTopContrarianBets,
  getTrumpSayMarkets,
  getExpiringTrumpMarkets,
  type TrumpBetFilters,
  type TrumpBetCategory,
} from "@/lib/polymarket";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const mode = searchParams.get("mode") || "opportunities"; // markets, opportunities, contrarian, say, expiring
  const categories = searchParams.get("categories")?.split(",") as TrumpBetCategory[] | undefined;
  const minRoi = searchParams.get("minRoi") ? parseFloat(searchParams.get("minRoi")!) : undefined;
  const maxYesPrice = searchParams.get("maxYesPrice") ? parseFloat(searchParams.get("maxYesPrice")!) : undefined;
  const minLiquidity = searchParams.get("minLiquidity") ? parseFloat(searchParams.get("minLiquidity")!) : undefined;
  const onlyContrarian = searchParams.get("onlyContrarian") === "true";
  const expiringWithinDays = searchParams.get("expiringWithinDays") ? parseInt(searchParams.get("expiringWithinDays")!) : undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

  try {
    const startTime = Date.now();

    let result;

    switch (mode) {
      case "markets":
        // Raw markets without analysis
        const markets = await fetchTrumpMarkets({ limit });
        result = {
          type: "markets",
          count: markets.length,
          markets,
        };
        break;

      case "contrarian":
        // Top contrarian bets (best ROI on underdogs)
        const contrarianBets = await getTopContrarianBets(limit);
        result = {
          type: "contrarian",
          count: contrarianBets.length,
          opportunities: contrarianBets,
          summary: {
            avgRoi: contrarianBets.length > 0
              ? Math.round(contrarianBets.reduce((sum, o) => sum + o.contrarianRoi, 0) / contrarianBets.length)
              : 0,
            categoryCounts: countByCategory(contrarianBets.map(o => o.category)),
          },
        };
        break;

      case "say":
        // "Will Trump Say" markets specifically
        const sayMarkets = await getTrumpSayMarkets();
        result = {
          type: "say",
          count: sayMarkets.length,
          opportunities: sayMarkets.slice(0, limit),
          summary: {
            avgYesPrice: sayMarkets.length > 0
              ? (sayMarkets.reduce((sum, o) => sum + o.yesPrice, 0) / sayMarkets.length).toFixed(2)
              : 0,
          },
        };
        break;

      case "expiring":
        // Expiring soon markets
        const expiringMarkets = await getExpiringTrumpMarkets(expiringWithinDays || 7);
        result = {
          type: "expiring",
          count: expiringMarkets.length,
          opportunities: expiringMarkets.slice(0, limit),
          expiringWithinDays: expiringWithinDays || 7,
        };
        break;

      case "opportunities":
      default:
        // Full analysis with filters
        const filters: TrumpBetFilters = {
          categories,
          minRoi,
          maxYesPrice,
          minLiquidity,
          onlyContrarian,
          expiringWithinDays,
        };

        const opportunities = await findTrumpBetOpportunities(filters);
        const sortedOpps = opportunities
          .sort((a, b) => Math.max(b.roiIfYes, b.roiIfNo) - Math.max(a.roiIfYes, a.roiIfNo))
          .slice(0, limit);

        result = {
          type: "opportunities",
          count: sortedOpps.length,
          totalFound: opportunities.length,
          filters,
          opportunities: sortedOpps,
          summary: generateSummary(sortedOpps),
        };
        break;
    }

    return NextResponse.json({
      success: true,
      ...result,
      meta: {
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        api: "Polymarket Gamma + CLOB",
      },
    });
  } catch (error) {
    console.error("Polymarket API error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch Polymarket data",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      categories,
      minRoi,
      maxYesPrice,
      minLiquidity,
      onlyContrarian,
      expiringWithinDays,
      riskLevels,
      limit = 20,
    } = body as TrumpBetFilters & { limit?: number };

    const startTime = Date.now();

    const filters: TrumpBetFilters = {
      categories,
      minRoi,
      maxYesPrice,
      minLiquidity,
      onlyContrarian,
      expiringWithinDays,
      riskLevels,
    };

    const opportunities = await findTrumpBetOpportunities(filters);
    const sortedOpps = opportunities
      .sort((a, b) => Math.max(b.roiIfYes, b.roiIfNo) - Math.max(a.roiIfYes, a.roiIfNo))
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      type: "opportunities",
      count: sortedOpps.length,
      totalFound: opportunities.length,
      filters,
      opportunities: sortedOpps,
      summary: generateSummary(sortedOpps),
      meta: {
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        api: "Polymarket Gamma + CLOB",
      },
    });
  } catch (error) {
    console.error("Polymarket API error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch Polymarket data",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

// Helper functions
function countByCategory(categories: TrumpBetCategory[]): Record<string, number> {
  return categories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function generateSummary(opportunities: Awaited<ReturnType<typeof findTrumpBetOpportunities>>) {
  if (opportunities.length === 0) {
    return {
      totalMarkets: 0,
      avgRoiIfYes: 0,
      avgRoiIfNo: 0,
      contrarianCount: 0,
      expiringCount: 0,
      highLiquidityCount: 0,
      categoryCounts: {},
      riskBreakdown: {},
    };
  }

  return {
    totalMarkets: opportunities.length,
    avgRoiIfYes: Math.round(opportunities.reduce((s, o) => s + o.roiIfYes, 0) / opportunities.length),
    avgRoiIfNo: Math.round(opportunities.reduce((s, o) => s + o.roiIfNo, 0) / opportunities.length),
    contrarianCount: opportunities.filter(o => o.isContrarian).length,
    expiringCount: opportunities.filter(o => o.isExpiringSoon).length,
    highLiquidityCount: opportunities.filter(o => o.liquidityScore === "high").length,
    categoryCounts: countByCategory(opportunities.map(o => o.category)),
    riskBreakdown: {
      low: opportunities.filter(o => o.riskLevel === "low").length,
      medium: opportunities.filter(o => o.riskLevel === "medium").length,
      high: opportunities.filter(o => o.riskLevel === "high").length,
    },
    topOpportunity: opportunities[0] ? {
      question: opportunities[0].market.question,
      yesPrice: opportunities[0].yesPrice,
      bestRoi: Math.max(opportunities[0].roiIfYes, opportunities[0].roiIfNo),
      category: opportunities[0].category,
    } : null,
  };
}
