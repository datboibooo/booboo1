// ============================================
// Polymarket API Types
// ============================================

export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  description?: string;
  outcomes: string[];
  outcomePrices?: string; // JSON string of prices
  volume: number;
  volumeNum?: number;
  liquidity: number;
  liquidityNum?: number;
  startDate?: string;
  endDate?: string;
  endDateIso?: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  groupItemTitle?: string;
  groupItemThreshold?: number;
  enableOrderBook: boolean;
  conditionId?: string;
  questionId?: string;

  // Token IDs for CLOB trading
  clobTokenIds?: string[];

  // Pricing (parsed from outcomePrices)
  yesPrice?: number;
  noPrice?: number;

  // Event info
  eventSlug?: string;
  eventTitle?: string;

  // Computed fields
  impliedProbability?: number;
  potentialRoi?: number;
  roiIfYes?: number;
  roiIfNo?: number;
}

export interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;

  markets: PolymarketMarket[];

  // Tags for filtering
  tags?: string[];

  // Volume/liquidity aggregates
  volume?: number;
  liquidity?: number;
  commentCount?: number;
}

export interface OrderBookEntry {
  price: string;
  size: string;
}

export interface OrderBook {
  market: string;
  asset_id: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  hash: string;
  timestamp: string;
}

export interface PriceInfo {
  tokenId: string;
  price: number;
  side: "BUY" | "SELL";
  timestamp: string;
}

export interface TrumpBetOpportunity {
  market: PolymarketMarket;

  // Analysis
  category: TrumpBetCategory;
  keywords: string[];

  // Pricing
  yesPrice: number;
  noPrice: number;

  // ROI calculations
  roiIfYes: number; // % return if resolves Yes
  roiIfNo: number;  // % return if resolves No

  // Contrarian indicators
  isContrarian: boolean;
  contrarianSide: "YES" | "NO" | null;
  contrarianRoi: number;

  // Liquidity assessment
  liquidityScore: "high" | "medium" | "low";

  // Time factors
  daysUntilClose?: number;
  isExpiringSoon: boolean;

  // Risk assessment
  riskLevel: "low" | "medium" | "high";
  riskFactors: string[];
}

export type TrumpBetCategory =
  | "speech"        // "Will Trump say X"
  | "policy"        // Policy-related markets
  | "election"      // Election/voting markets
  | "legal"         // Legal/court-related
  | "media"         // Media appearances, tweets
  | "personnel"     // Cabinet, appointments
  | "foreign"       // Foreign policy
  | "economic"      // Economic policy
  | "other";

export interface MarketSearchOptions {
  searchTerms?: string[];
  tags?: string[];
  active?: boolean;
  closed?: boolean;
  minVolume?: number;
  maxOdds?: number;      // Max Yes price (for contrarian plays)
  minRoi?: number;       // Minimum potential ROI
  limit?: number;
  offset?: number;
}

export interface TrumpBetFilters {
  categories?: TrumpBetCategory[];
  minRoi?: number;
  maxYesPrice?: number;  // e.g., 0.30 for contrarian bets
  minLiquidity?: number;
  onlyContrarian?: boolean;
  expiringWithinDays?: number;
  riskLevels?: ("low" | "medium" | "high")[];
}

// API Response types
export interface GammaMarketsResponse {
  markets: PolymarketMarket[];
  count?: number;
  limit?: number;
  offset?: number;
}

export interface GammaEventsResponse {
  events: PolymarketEvent[];
  count?: number;
  limit?: number;
  offset?: number;
}

export interface ClobPriceResponse {
  price: string;
  side: string;
}

// WebSocket types for real-time updates
export interface MarketPriceUpdate {
  marketId: string;
  tokenId: string;
  price: number;
  timestamp: string;
}
