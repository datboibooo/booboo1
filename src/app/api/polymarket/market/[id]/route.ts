/**
 * Polymarket Single Market API
 * Get detailed information for a specific market
 */

import { NextResponse } from "next/server";
import {
  fetchMarket,
  fetchOrderBook,
  fetchPrice,
} from "@/lib/polymarket";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({
      success: false,
      error: "Market ID or slug is required",
    }, { status: 400 });
  }

  try {
    const startTime = Date.now();

    // Fetch market details
    const market = await fetchMarket(id);

    // Try to fetch order book and live prices if token IDs are available
    let orderBooks = null;
    let livePrices = null;

    if (market.clobTokenIds && market.clobTokenIds.length > 0) {
      try {
        // Fetch order books for all tokens
        const orderBookPromises = market.clobTokenIds.map(tokenId =>
          fetchOrderBook(tokenId).catch(() => null)
        );
        const orderBookResults = await Promise.all(orderBookPromises);
        orderBooks = orderBookResults.filter(Boolean);

        // Fetch live prices
        const pricePromises = market.clobTokenIds.map(async (tokenId, index) => {
          try {
            const buyPrice = await fetchPrice(tokenId, "BUY");
            return {
              tokenId,
              outcome: market.outcomes?.[index] || (index === 0 ? "Yes" : "No"),
              buyPrice,
            };
          } catch {
            return null;
          }
        });
        const priceResults = await Promise.all(pricePromises);
        livePrices = priceResults.filter(Boolean);
      } catch (error) {
        console.warn("Failed to fetch CLOB data:", error);
      }
    }

    // Calculate detailed ROI scenarios
    const yesPrice = market.yesPrice || 0.5;
    const noPrice = market.noPrice || 0.5;

    const analysis = {
      impliedProbability: {
        yes: (yesPrice * 100).toFixed(1) + "%",
        no: (noPrice * 100).toFixed(1) + "%",
      },
      potentialReturns: {
        ifBuyYes: {
          costPer100Shares: (yesPrice * 100).toFixed(2),
          payoutIfWin: "100.00",
          profitIfWin: ((1 - yesPrice) * 100).toFixed(2),
          roiIfWin: (((1 - yesPrice) / yesPrice) * 100).toFixed(1) + "%",
          lossIfLose: (yesPrice * 100).toFixed(2),
        },
        ifBuyNo: {
          costPer100Shares: (noPrice * 100).toFixed(2),
          payoutIfWin: "100.00",
          profitIfWin: ((1 - noPrice) * 100).toFixed(2),
          roiIfWin: (((1 - noPrice) / noPrice) * 100).toFixed(1) + "%",
          lossIfLose: (noPrice * 100).toFixed(2),
        },
      },
      recommendation: generateRecommendation(yesPrice, noPrice, market.liquidity),
    };

    return NextResponse.json({
      success: true,
      market,
      analysis,
      orderBooks,
      livePrices,
      meta: {
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Polymarket market API error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch market details",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

function generateRecommendation(yesPrice: number, noPrice: number, liquidity: number): {
  side: "YES" | "NO" | "NONE";
  confidence: "high" | "medium" | "low";
  reasoning: string;
} {
  // Low liquidity warning
  if (liquidity < 5000) {
    return {
      side: "NONE",
      confidence: "low",
      reasoning: "Low liquidity - difficult to enter/exit positions. Consider avoiding.",
    };
  }

  // Look for contrarian opportunities
  if (yesPrice < 0.15) {
    return {
      side: "YES",
      confidence: "medium",
      reasoning: `Yes at ${(yesPrice * 100).toFixed(1)}% is a deep underdog. High risk/high reward play with ${(((1 - yesPrice) / yesPrice) * 100).toFixed(0)}% potential ROI if it hits.`,
    };
  }

  if (noPrice < 0.15) {
    return {
      side: "NO",
      confidence: "medium",
      reasoning: `No at ${(noPrice * 100).toFixed(1)}% is a deep underdog. High risk/high reward play with ${(((1 - noPrice) / noPrice) * 100).toFixed(0)}% potential ROI if it hits.`,
    };
  }

  // Moderate underdog opportunities
  if (yesPrice < 0.30) {
    return {
      side: "YES",
      confidence: "medium",
      reasoning: `Yes at ${(yesPrice * 100).toFixed(1)}% offers ${(((1 - yesPrice) / yesPrice) * 100).toFixed(0)}% ROI. Contrarian opportunity if you believe the market is wrong.`,
    };
  }

  if (noPrice < 0.30) {
    return {
      side: "NO",
      confidence: "medium",
      reasoning: `No at ${(noPrice * 100).toFixed(1)}% offers ${(((1 - noPrice) / noPrice) * 100).toFixed(0)}% ROI. Contrarian opportunity if you believe the market is wrong.`,
    };
  }

  // Near 50/50 markets
  if (Math.abs(yesPrice - 0.5) < 0.1) {
    return {
      side: "NONE",
      confidence: "low",
      reasoning: "Market is near 50/50 - no clear edge. Wait for better pricing or do more research.",
    };
  }

  // Heavily favored outcomes
  const favoredSide = yesPrice > noPrice ? "YES" : "NO";
  const favoredPrice = Math.max(yesPrice, noPrice);

  return {
    side: favoredSide,
    confidence: "medium",
    reasoning: `${favoredSide} is favored at ${(favoredPrice * 100).toFixed(1)}%. Lower ROI but higher probability of winning.`,
  };
}
