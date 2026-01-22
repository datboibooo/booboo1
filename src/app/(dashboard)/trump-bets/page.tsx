"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  RefreshCw,
  Filter,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ChevronRight,
  Loader2,
  DollarSign,
  Clock,
  AlertTriangle,
  Zap,
  Target,
  BarChart3,
  Percent,
  Activity,
  Flame,
  MessageSquare,
  Gavel,
  Globe,
  Briefcase,
  Users,
  Megaphone,
  CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrumpBetOpportunity, TrumpBetCategory } from "@/lib/polymarket";

// Category icons mapping
const CATEGORY_ICONS: Record<TrumpBetCategory, React.ElementType> = {
  speech: MessageSquare,
  policy: Briefcase,
  election: Users,
  legal: Gavel,
  media: Megaphone,
  personnel: Users,
  foreign: Globe,
  economic: CircleDollarSign,
  other: Activity,
};

const CATEGORY_COLORS: Record<TrumpBetCategory, string> = {
  speech: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  policy: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  election: "bg-red-500/10 text-red-500 border-red-500/20",
  legal: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  media: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  personnel: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  foreign: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  economic: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

// Quick filter options
const QUICK_FILTERS = [
  { label: "All Opportunities", mode: "opportunities", icon: Target },
  { label: "Contrarian Plays", mode: "contrarian", icon: TrendingUp },
  { label: "Trump Says", mode: "say", icon: MessageSquare },
  { label: "Expiring Soon", mode: "expiring", icon: Clock },
];

export default function TrumpBetsPage() {
  const [opportunities, setOpportunities] = React.useState<TrumpBetOpportunity[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedBet, setSelectedBet] = React.useState<TrumpBetOpportunity | null>(null);
  const [activeMode, setActiveMode] = React.useState<string>("opportunities");
  const [activeCategory, setActiveCategory] = React.useState<TrumpBetCategory | "all">("all");
  const [summary, setSummary] = React.useState<{
    totalMarkets: number;
    avgRoiIfYes: number;
    avgRoiIfNo: number;
    contrarianCount: number;
    expiringCount: number;
  } | null>(null);

  // Load data
  const loadData = React.useCallback(async (mode: string = "opportunities") => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/polymarket/markets?mode=${mode}&limit=50`);
      if (!response.ok) throw new Error("Failed to fetch markets");

      const data = await response.json();
      if (data.success) {
        setOpportunities(data.opportunities || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error("Failed to load Polymarket data:", error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    loadData(activeMode);
  }, [loadData, activeMode]);

  // Filter by category
  const filteredOpportunities = React.useMemo(() => {
    if (activeCategory === "all") return opportunities;
    return opportunities.filter((opp) => opp.category === activeCategory);
  }, [opportunities, activeCategory]);

  // Stats
  const stats = {
    total: filteredOpportunities.length,
    contrarian: filteredOpportunities.filter((o) => o.isContrarian).length,
    expiring: filteredOpportunities.filter((o) => o.isExpiringSoon).length,
    highRoi: filteredOpportunities.filter((o) => Math.max(o.roiIfYes, o.roiIfNo) > 200).length,
  };

  // Category counts
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: opportunities.length };
    opportunities.forEach((opp) => {
      counts[opp.category] = (counts[opp.category] || 0) + 1;
    });
    return counts;
  }, [opportunities]);

  return (
    <div className="flex h-full flex-col bg-[--background]">
      {/* Header */}
      <header className="border-b border-[--border] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Trump Betting Markets</h1>
              <p className="text-sm text-[--foreground-muted]">
                {stats.total} opportunities · {stats.contrarian} contrarian plays
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(activeMode)}
              disabled={isRefreshing}
              className="h-9 gap-2"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Mode Filters */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.mode}
              onClick={() => {
                setActiveMode(filter.mode);
                loadData(filter.mode);
              }}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5",
                activeMode === filter.mode
                  ? "bg-orange-500 text-white"
                  : "bg-[--background-secondary] text-[--foreground-muted] hover:text-[--foreground]"
              )}
            >
              <filter.icon className="h-3.5 w-3.5" />
              {filter.label}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-all",
              activeCategory === "all"
                ? "bg-[--foreground] text-[--background]"
                : "bg-[--background-secondary] text-[--foreground-muted] hover:text-[--foreground]"
            )}
          >
            All ({categoryCounts.all || 0})
          </button>
          {Object.entries(CATEGORY_ICONS).map(([cat, Icon]) => {
            const count = categoryCounts[cat] || 0;
            if (count === 0 && activeCategory !== cat) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as TrumpBetCategory)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5 border",
                  activeCategory === cat
                    ? CATEGORY_COLORS[cat as TrumpBetCategory]
                    : "bg-[--background-secondary] text-[--foreground-muted] hover:text-[--foreground] border-transparent"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.charAt(0).toUpperCase() + cat.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </header>

      {/* Summary Stats */}
      {summary && !isLoading && (
        <div className="px-6 py-3 border-b border-[--border] bg-[--background-secondary]/50">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              <span className="text-[--foreground-muted]">Markets:</span>
              <span className="font-semibold">{summary.totalMarkets}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-[--foreground-muted]">Avg ROI (Yes):</span>
              <span className="font-semibold text-green-500">{summary.avgRoiIfYes}%</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-[--foreground-muted]">Avg ROI (No):</span>
              <span className="font-semibold text-red-500">{summary.avgRoiIfNo}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-[--foreground-muted]">Contrarian:</span>
              <span className="font-semibold">{summary.contrarianCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="text-[--foreground-muted]">Expiring Soon:</span>
              <span className="font-semibold">{summary.expiringCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Market Grid */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-[--background-secondary] animate-pulse" />
              ))}
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No markets found</h3>
              <p className="text-sm text-[--foreground-muted] mb-6 max-w-md">
                No Trump-related prediction markets match your current filters. Try changing the mode or category.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredOpportunities.map((opp, idx) => (
                  <motion.div
                    key={opp.market.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                  >
                    <BetOpportunityCard
                      opportunity={opp}
                      onSelect={() => setSelectedBet(opp)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bet Detail Sheet */}
      <Sheet open={!!selectedBet} onOpenChange={(open) => !open && setSelectedBet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto">
          {selectedBet && (
            <BetOpportunityDetail
              opportunity={selectedBet}
              onClose={() => setSelectedBet(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Bet Opportunity Card Component
function BetOpportunityCard({
  opportunity,
  onSelect,
}: {
  opportunity: TrumpBetOpportunity;
  onSelect: () => void;
}) {
  const { market, category, yesPrice, noPrice, roiIfYes, roiIfNo, isContrarian, contrarianSide, liquidityScore, riskLevel, isExpiringSoon, daysUntilClose } = opportunity;
  const CategoryIcon = CATEGORY_ICONS[category];
  const bestRoi = Math.max(roiIfYes, roiIfNo);
  const bestSide = roiIfYes > roiIfNo ? "YES" : "NO";

  return (
    <div
      className={cn(
        "water-card rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg group relative",
        isContrarian && "border-yellow-500/40 bg-yellow-500/5"
      )}
      onClick={onSelect}
    >
      {/* Badges */}
      <div className="absolute -top-2 right-2 flex gap-1">
        {isContrarian && (
          <div className="px-2 py-0.5 rounded-full bg-yellow-500 text-black text-xs font-medium shadow-lg flex items-center gap-1">
            <Zap className="h-3 w-3" /> Contrarian
          </div>
        )}
        {isExpiringSoon && (
          <div className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-xs font-medium shadow-lg flex items-center gap-1">
            <Clock className="h-3 w-3" /> {daysUntilClose}d
          </div>
        )}
        {riskLevel === "high" && (
          <div className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium shadow-lg flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Risk
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3 mt-1">
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border",
          CATEGORY_COLORS[category]
        )}>
          <CategoryIcon className="h-3 w-3" />
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </div>

        <div className="text-right">
          <div className="text-xs text-[--foreground-muted]">Best ROI</div>
          <div className={cn(
            "text-lg font-bold font-display",
            bestRoi > 300 ? "text-green-500" : bestRoi > 100 ? "text-yellow-500" : "text-[--foreground]"
          )}>
            {Math.round(bestRoi)}%
          </div>
        </div>
      </div>

      {/* Question */}
      <h3 className="font-semibold text-sm leading-tight mb-4 line-clamp-3">
        {market.question}
      </h3>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className={cn(
          "p-3 rounded-xl text-center",
          contrarianSide === "YES" ? "bg-green-500/10 border border-green-500/20" : "bg-[--background-secondary]"
        )}>
          <div className="text-xs text-[--foreground-muted] mb-1">YES</div>
          <div className="text-xl font-bold text-green-500">{(yesPrice * 100).toFixed(0)}¢</div>
          <div className="text-xs text-[--foreground-muted]">+{Math.round(roiIfYes)}% ROI</div>
        </div>
        <div className={cn(
          "p-3 rounded-xl text-center",
          contrarianSide === "NO" ? "bg-red-500/10 border border-red-500/20" : "bg-[--background-secondary]"
        )}>
          <div className="text-xs text-[--foreground-muted] mb-1">NO</div>
          <div className="text-xl font-bold text-red-500">{(noPrice * 100).toFixed(0)}¢</div>
          <div className="text-xs text-[--foreground-muted]">+{Math.round(roiIfNo)}% ROI</div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center justify-between text-xs text-[--foreground-muted]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {liquidityScore}
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            ${market.volume?.toLocaleString() || "N/A"}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="flex items-center gap-1 text-sm text-orange-500 font-medium group-hover:gap-2 transition-all"
        >
          Analyze
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Bet Opportunity Detail Component
function BetOpportunityDetail({
  opportunity,
  onClose,
}: {
  opportunity: TrumpBetOpportunity;
  onClose: () => void;
}) {
  const { market, category, yesPrice, noPrice, roiIfYes, roiIfNo, isContrarian, contrarianSide, contrarianRoi, liquidityScore, riskLevel, riskFactors, isExpiringSoon, daysUntilClose, keywords } = opportunity;
  const CategoryIcon = CATEGORY_ICONS[category];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[--border]">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border",
            CATEGORY_COLORS[category]
          )}>
            <CategoryIcon className="h-4 w-4" />
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </div>
          {isContrarian && (
            <div className="px-3 py-1.5 rounded-lg bg-yellow-500 text-black text-sm font-medium flex items-center gap-1.5">
              <Zap className="h-4 w-4" /> Contrarian Play
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold mb-4">{market.question}</h2>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => window.open(`https://polymarket.com/event/${market.slug || market.id}`, "_blank")}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Trade on Polymarket
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Current Prices */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Current Prices</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={cn(
                "p-4 rounded-xl text-center",
                contrarianSide === "YES" ? "bg-green-500/10 border-2 border-green-500/40" : "bg-[--background-secondary]"
              )}>
                <div className="text-sm text-[--foreground-muted] mb-1">Buy YES</div>
                <div className="text-3xl font-bold text-green-500">{(yesPrice * 100).toFixed(1)}¢</div>
                <div className="text-sm text-[--foreground-muted] mt-1">
                  Implied: {(yesPrice * 100).toFixed(1)}% chance
                </div>
                <div className="text-lg font-semibold text-green-500 mt-2">
                  +{Math.round(roiIfYes)}% ROI if Yes
                </div>
              </div>
              <div className={cn(
                "p-4 rounded-xl text-center",
                contrarianSide === "NO" ? "bg-red-500/10 border-2 border-red-500/40" : "bg-[--background-secondary]"
              )}>
                <div className="text-sm text-[--foreground-muted] mb-1">Buy NO</div>
                <div className="text-3xl font-bold text-red-500">{(noPrice * 100).toFixed(1)}¢</div>
                <div className="text-sm text-[--foreground-muted] mt-1">
                  Implied: {(noPrice * 100).toFixed(1)}% chance
                </div>
                <div className="text-lg font-semibold text-red-500 mt-2">
                  +{Math.round(roiIfNo)}% ROI if No
                </div>
              </div>
            </div>
          </div>

          {/* ROI Calculator */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Investment Scenarios</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">If you buy $100 of YES shares</span>
                  <span className="text-green-500 font-bold">{Math.round(100 / yesPrice)} shares</span>
                </div>
                <div className="text-sm text-[--foreground-muted]">
                  <p>Win: <span className="text-green-500 font-semibold">${Math.round((1 - yesPrice) / yesPrice * 100)}</span> profit ({Math.round(roiIfYes)}% ROI)</p>
                  <p>Lose: <span className="text-red-500 font-semibold">-$100</span> (total loss)</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">If you buy $100 of NO shares</span>
                  <span className="text-red-500 font-bold">{Math.round(100 / noPrice)} shares</span>
                </div>
                <div className="text-sm text-[--foreground-muted]">
                  <p>Win: <span className="text-green-500 font-semibold">${Math.round((1 - noPrice) / noPrice * 100)}</span> profit ({Math.round(roiIfNo)}% ROI)</p>
                  <p>Lose: <span className="text-red-500 font-semibold">-$100</span> (total loss)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contrarian Analysis */}
          {isContrarian && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Contrarian Opportunity</h3>
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">The market says {contrarianSide === "YES" ? "NO" : "YES"} is likely</span>
                </div>
                <p className="text-sm text-[--foreground-muted] mb-3">
                  But buying <span className="font-bold text-yellow-500">{contrarianSide}</span> at current prices
                  offers <span className="font-bold text-yellow-500">{Math.round(contrarianRoi)}% ROI</span> if you're right.
                </p>
                <p className="text-xs text-[--foreground-muted]">
                  Contrarian plays are high-risk, high-reward. Only bet what you can afford to lose.
                </p>
              </div>
            </div>
          )}

          {/* Market Stats */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Market Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[--background-secondary]">
                <p className="text-xs text-[--foreground-muted] mb-1">Volume</p>
                <p className="font-semibold">${market.volume?.toLocaleString() || "N/A"}</p>
              </div>
              <div className="p-3 rounded-lg bg-[--background-secondary]">
                <p className="text-xs text-[--foreground-muted] mb-1">Liquidity</p>
                <p className="font-semibold capitalize">{liquidityScore}</p>
              </div>
              {daysUntilClose !== undefined && (
                <div className={cn(
                  "p-3 rounded-lg col-span-2",
                  isExpiringSoon ? "bg-purple-500/10 border border-purple-500/20" : "bg-[--background-secondary]"
                )}>
                  <p className="text-xs text-[--foreground-muted] mb-1">Time Remaining</p>
                  <p className={cn("font-semibold", isExpiringSoon && "text-purple-500")}>
                    {daysUntilClose} days until resolution
                    {isExpiringSoon && " (Expiring Soon!)"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Risk Assessment */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Risk Assessment</h3>
            <div className={cn(
              "p-4 rounded-xl",
              riskLevel === "high" ? "bg-red-500/10 border border-red-500/20" :
              riskLevel === "medium" ? "bg-yellow-500/10 border border-yellow-500/20" :
              "bg-green-500/10 border border-green-500/20"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  riskLevel === "high" ? "text-red-500" :
                  riskLevel === "medium" ? "text-yellow-500" :
                  "text-green-500"
                )} />
                <span className={cn(
                  "font-semibold capitalize",
                  riskLevel === "high" ? "text-red-500" :
                  riskLevel === "medium" ? "text-yellow-500" :
                  "text-green-500"
                )}>
                  {riskLevel} Risk
                </span>
              </div>
              {riskFactors.length > 0 && (
                <ul className="text-sm text-[--foreground-muted] space-y-1">
                  {riskFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[--foreground-subtle]">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Matched Keywords */}
          {keywords.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Matched Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-sm border border-orange-500/20">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Market Description */}
          {market.description && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Market Description</h3>
              <p className="text-sm text-[--foreground-muted] p-4 rounded-xl bg-[--background-secondary]">
                {market.description}
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 rounded-xl bg-[--foreground]/5 border border-[--border]">
            <p className="text-xs text-[--foreground-muted]">
              <strong>Disclaimer:</strong> This is not financial advice. Prediction markets involve risk of loss.
              Only bet what you can afford to lose. Past performance does not guarantee future results.
              Verify all information on Polymarket before placing any trades.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
