import type {
  PolymarketMarket,
  PolymarketEvent,
  OrderBook,
  MarketSearchOptions,
  TrumpBetOpportunity,
  TrumpBetFilters,
  TrumpBetCategory,
} from "./types";

// ============================================
// Polymarket API Client
// ============================================

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";
const CLOB_API_BASE = "https://clob.polymarket.com";

// Trump-related keywords for filtering
const TRUMP_KEYWORDS = [
  "trump",
  "donald trump",
  "president trump",
  "trump administration",
  "trump say",
  "trump tweet",
  "trump statement",
  "trump announce",
  "trump executive order",
  "trump cabinet",
  "maga",
  "make america",
];

// Category detection patterns
const CATEGORY_PATTERNS: Record<TrumpBetCategory, RegExp[]> = {
  speech: [
    /will trump say/i,
    /trump.*say/i,
    /trump.*mention/i,
    /trump.*statement/i,
    /trump.*announce/i,
    /trump.*speech/i,
    /trump.*remarks/i,
    /trump.*press conference/i,
  ],
  policy: [
    /executive order/i,
    /policy/i,
    /tariff/i,
    /regulation/i,
    /immigration/i,
    /border/i,
    /ban/i,
    /mandate/i,
  ],
  election: [
    /election/i,
    /vote/i,
    /ballot/i,
    /electoral/i,
    /campaign/i,
    /primary/i,
    /nominee/i,
    /2024|2025|2026/,
  ],
  legal: [
    /court/i,
    /trial/i,
    /indictment/i,
    /lawsuit/i,
    /legal/i,
    /conviction/i,
    /sentence/i,
    /verdict/i,
    /judge/i,
  ],
  media: [
    /tweet/i,
    /truth social/i,
    /interview/i,
    /fox news/i,
    /cnn/i,
    /rally/i,
    /appearance/i,
  ],
  personnel: [
    /cabinet/i,
    /appoint/i,
    /nominate/i,
    /secretary/i,
    /advisor/i,
    /fire/i,
    /resign/i,
    /staff/i,
  ],
  foreign: [
    /russia/i,
    /ukraine/i,
    /china/i,
    /nato/i,
    /putin/i,
    /xi/i,
    /zelensky/i,
    /foreign/i,
    /international/i,
  ],
  economic: [
    /economy/i,
    /inflation/i,
    /jobs/i,
    /unemployment/i,
    /stock market/i,
    /gdp/i,
    /recession/i,
    /tax/i,
    /fed/i,
    /interest rate/i,
  ],
  other: [],
};

/**
 * Fetch wrapper with error handling
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Parse outcome prices from JSON string
 */
function parseOutcomePrices(market: PolymarketMarket): { yesPrice: number; noPrice: number } {
  try {
    if (market.outcomePrices) {
      const prices = JSON.parse(market.outcomePrices);
      return {
        yesPrice: parseFloat(prices[0]) || 0.5,
        noPrice: parseFloat(prices[1]) || 0.5,
      };
    }
  } catch {
    // Fallback to 50/50
  }
  return { yesPrice: 0.5, noPrice: 0.5 };
}

/**
 * Calculate ROI for a bet
 * If you buy Yes shares at 0.20, and it resolves Yes, you get 1.00
 * ROI = (payout - cost) / cost = (1 - price) / price
 */
function calculateRoi(price: number): number {
  if (price <= 0 || price >= 1) return 0;
  return ((1 - price) / price) * 100; // Return as percentage
}

/**
 * Detect category from market question
 */
function detectCategory(question: string): TrumpBetCategory {
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(question)) {
        return category as TrumpBetCategory;
      }
    }
  }
  return "other";
}

/**
 * Extract keywords that matched
 */
function extractMatchedKeywords(question: string): string[] {
  const lowerQuestion = question.toLowerCase();
  return TRUMP_KEYWORDS.filter((kw) => lowerQuestion.includes(kw.toLowerCase()));
}

/**
 * Assess liquidity level
 */
function assessLiquidity(liquidity: number): "high" | "medium" | "low" {
  if (liquidity >= 100000) return "high";
  if (liquidity >= 10000) return "medium";
  return "low";
}

/**
 * Assess risk level
 */
function assessRisk(market: PolymarketMarket, yesPrice: number): { level: "low" | "medium" | "high"; factors: string[] } {
  const factors: string[] = [];

  // Low liquidity = higher risk
  if (market.liquidity < 5000) {
    factors.push("Low liquidity - may be hard to exit position");
  }

  // Very low or very high odds = higher risk
  if (yesPrice < 0.1 || yesPrice > 0.9) {
    factors.push("Extreme odds - high potential for adverse movement");
  }

  // New market = less price discovery
  if (market.new) {
    factors.push("New market - less price discovery");
  }

  // Restricted market
  if (market.restricted) {
    factors.push("Restricted market - may have trading limitations");
  }

  // Time pressure
  if (market.endDateIso) {
    const daysUntil = Math.ceil(
      (new Date(market.endDateIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 3) {
      factors.push("Expiring very soon - limited time for information");
    }
  }

  const level: "low" | "medium" | "high" =
    factors.length >= 3 ? "high" : factors.length >= 1 ? "medium" : "low";

  return { level, factors };
}

// ============================================
// Gamma API Methods (Market Discovery)
// ============================================

/**
 * Fetch all active markets from Gamma API
 */
export async function fetchMarkets(options: MarketSearchOptions = {}): Promise<PolymarketMarket[]> {
  const params = new URLSearchParams();

  if (options.active !== false) params.append("active", "true");
  if (options.closed !== undefined) params.append("closed", String(options.closed));
  if (options.tags?.length) params.append("tag_slug", options.tags.join(","));
  if (options.limit) params.append("limit", String(options.limit));
  if (options.offset) params.append("offset", String(options.offset));

  const url = `${GAMMA_API_BASE}/markets?${params.toString()}`;
  const markets = await apiFetch<PolymarketMarket[]>(url);

  // Parse prices and compute ROI
  return markets.map((market) => {
    const { yesPrice, noPrice } = parseOutcomePrices(market);
    return {
      ...market,
      yesPrice,
      noPrice,
      roiIfYes: calculateRoi(yesPrice),
      roiIfNo: calculateRoi(noPrice),
      impliedProbability: yesPrice,
    };
  });
}

/**
 * Fetch events from Gamma API
 */
export async function fetchEvents(options: { tags?: string[]; active?: boolean; limit?: number } = {}): Promise<PolymarketEvent[]> {
  const params = new URLSearchParams();

  if (options.active !== false) params.append("active", "true");
  if (options.tags?.length) params.append("tag_slug", options.tags.join(","));
  if (options.limit) params.append("limit", String(options.limit));

  const url = `${GAMMA_API_BASE}/events?${params.toString()}`;
  return apiFetch<PolymarketEvent[]>(url);
}

/**
 * Fetch a single market by ID or slug
 */
export async function fetchMarket(idOrSlug: string): Promise<PolymarketMarket> {
  const url = `${GAMMA_API_BASE}/markets/${idOrSlug}`;
  const market = await apiFetch<PolymarketMarket>(url);
  const { yesPrice, noPrice } = parseOutcomePrices(market);
  return {
    ...market,
    yesPrice,
    noPrice,
    roiIfYes: calculateRoi(yesPrice),
    roiIfNo: calculateRoi(noPrice),
    impliedProbability: yesPrice,
  };
}

/**
 * Fetch a single event by ID or slug
 */
export async function fetchEvent(idOrSlug: string): Promise<PolymarketEvent> {
  const url = `${GAMMA_API_BASE}/events/${idOrSlug}`;
  return apiFetch<PolymarketEvent>(url);
}

// ============================================
// CLOB API Methods (Prices & Order Books)
// ============================================

/**
 * Fetch order book for a token
 */
export async function fetchOrderBook(tokenId: string): Promise<OrderBook> {
  const url = `${CLOB_API_BASE}/book?token_id=${tokenId}`;
  return apiFetch<OrderBook>(url);
}

/**
 * Fetch current price for a token
 */
export async function fetchPrice(tokenId: string, side: "BUY" | "SELL" = "BUY"): Promise<number> {
  const url = `${CLOB_API_BASE}/price?token_id=${tokenId}&side=${side}`;
  const response = await apiFetch<{ price: string }>(url);
  return parseFloat(response.price);
}

// ============================================
// Trump-Specific Market Discovery
// ============================================

/**
 * Fetch all Trump-related markets
 */
export async function fetchTrumpMarkets(options: MarketSearchOptions = {}): Promise<PolymarketMarket[]> {
  // Fetch a large batch of political markets
  const allMarkets = await fetchMarkets({
    ...options,
    tags: ["politics", ...(options.tags || [])],
    limit: options.limit || 500,
    active: options.active ?? true,
  });

  // Filter for Trump-related
  const searchTerms = options.searchTerms || TRUMP_KEYWORDS;
  const trumpMarkets = allMarkets.filter((market) => {
    const text = `${market.question} ${market.description || ""} ${market.groupItemTitle || ""}`.toLowerCase();
    return searchTerms.some((term) => text.includes(term.toLowerCase()));
  });

  // Apply additional filters
  return trumpMarkets.filter((market) => {
    if (options.minVolume && market.volume < options.minVolume) return false;
    if (options.maxOdds && (market.yesPrice || 0.5) > options.maxOdds) return false;
    if (options.minRoi && (market.roiIfYes || 0) < options.minRoi) return false;
    return true;
  });
}

/**
 * Analyze Trump markets and identify betting opportunities
 */
export async function findTrumpBetOpportunities(
  filters: TrumpBetFilters = {}
): Promise<TrumpBetOpportunity[]> {
  const markets = await fetchTrumpMarkets({
    active: true,
    minVolume: filters.minLiquidity,
  });

  const opportunities: TrumpBetOpportunity[] = markets.map((market) => {
    const yesPrice = market.yesPrice || 0.5;
    const noPrice = market.noPrice || 0.5;
    const roiIfYes = calculateRoi(yesPrice);
    const roiIfNo = calculateRoi(noPrice);

    // Determine if it's a contrarian opportunity
    const isContrarian = yesPrice < 0.3 || noPrice < 0.3;
    const contrarianSide: "YES" | "NO" | null = isContrarian
      ? yesPrice < noPrice
        ? "YES"
        : "NO"
      : null;
    const contrarianRoi = contrarianSide === "YES" ? roiIfYes : contrarianSide === "NO" ? roiIfNo : 0;

    // Days until close
    let daysUntilClose: number | undefined;
    let isExpiringSoon = false;
    if (market.endDateIso) {
      daysUntilClose = Math.ceil(
        (new Date(market.endDateIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      isExpiringSoon = daysUntilClose <= 7;
    }

    // Risk assessment
    const { level: riskLevel, factors: riskFactors } = assessRisk(market, yesPrice);

    return {
      market,
      category: detectCategory(market.question),
      keywords: extractMatchedKeywords(market.question),
      yesPrice,
      noPrice,
      roiIfYes,
      roiIfNo,
      isContrarian,
      contrarianSide,
      contrarianRoi,
      liquidityScore: assessLiquidity(market.liquidity),
      daysUntilClose,
      isExpiringSoon,
      riskLevel,
      riskFactors,
    };
  });

  // Apply filters
  return opportunities.filter((opp) => {
    if (filters.categories?.length && !filters.categories.includes(opp.category)) return false;
    if (filters.minRoi && Math.max(opp.roiIfYes, opp.roiIfNo) < filters.minRoi) return false;
    if (filters.maxYesPrice && opp.yesPrice > filters.maxYesPrice) return false;
    if (filters.minLiquidity && opp.market.liquidity < filters.minLiquidity) return false;
    if (filters.onlyContrarian && !opp.isContrarian) return false;
    if (filters.expiringWithinDays && (!opp.daysUntilClose || opp.daysUntilClose > filters.expiringWithinDays)) return false;
    if (filters.riskLevels?.length && !filters.riskLevels.includes(opp.riskLevel)) return false;
    return true;
  });
}

/**
 * Get top contrarian Trump bets (best ROI opportunities)
 */
export async function getTopContrarianBets(limit: number = 10): Promise<TrumpBetOpportunity[]> {
  const opportunities = await findTrumpBetOpportunities({
    maxYesPrice: 0.35, // Focus on underdogs
    minLiquidity: 1000,
  });

  // Sort by potential ROI
  return opportunities
    .sort((a, b) => Math.max(b.roiIfYes, b.roiIfNo) - Math.max(a.roiIfYes, a.roiIfNo))
    .slice(0, limit);
}

/**
 * Get "Will Trump Say" markets specifically
 */
export async function getTrumpSayMarkets(): Promise<TrumpBetOpportunity[]> {
  return findTrumpBetOpportunities({
    categories: ["speech"],
  });
}

/**
 * Get expiring Trump markets (urgency filter)
 */
export async function getExpiringTrumpMarkets(withinDays: number = 7): Promise<TrumpBetOpportunity[]> {
  return findTrumpBetOpportunities({
    expiringWithinDays: withinDays,
  });
}
