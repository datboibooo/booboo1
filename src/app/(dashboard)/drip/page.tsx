"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { LeadRecord } from "@/lib/schemas";
import {
  RefreshCw,
  Download,
  Filter,
  Droplets,
  ExternalLink,
  Bookmark,
  ChevronRight,
  Loader2,
  Search,
  X,
  Sparkles,
  Building2,
  Copy,
  Check,
  Globe,
  Keyboard,
  Phone,
  MapPin,
  Video,
  Facebook,
  Instagram,
  Youtube,
  Users,
  DollarSign,
  Flame,
} from "lucide-react";
import { getStoredLeads, saveLeads, updateLead, logActivity } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CompanyBrief } from "@/components/leads/company-brief";
import { BuyerSimulation } from "@/components/simulation/buyer-simulation";
import { KeyboardShortcutsHelp } from "@/components/ui/keyboard-shortcuts-help";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ThinkingPanel } from "@/components/thinking/thinking-panel";

// Extended lead type for Florida businesses
interface FloridaLead {
  id: string;
  name: string;
  companyName: string;
  domain: string;
  industry: string;
  subCategory?: string;
  stage: string;
  location: string;
  region: string;
  phone: string;
  email?: string;
  website?: string;
  employeeCount: string;
  yearsInBusiness: number;
  score: number;
  signals: string[];
  socialPresence: {
    facebook?: boolean;
    instagram?: boolean;
    youtube?: boolean;
    tiktok?: boolean;
    hasVideo?: boolean;
  };
  hasVideo: boolean;
  hasFacebook: boolean;
  hasInstagram: boolean;
  hasYouTube: boolean;
  hasTikTok: boolean;
  videoOpportunity: string;
  packageRecommendation: string;
  whyNow: string;
  painPoints: string[];
  idealFor: string[];
  openerShort: string;
  openerMedium: string;
  targetTitles: string[];
  status?: "new" | "saved" | "contacted" | "skip";
  geo?: string;
  triggeredSignals?: Array<{ signalId: string; signalName: string; category: string; priority: string }>;

  // Video buyer criteria
  primaryUseCase?: string;
  buyingIntent?: "high" | "medium" | "low";
  buyingIntentReasons?: string[];
  idealVideoTypes?: string[];
  estimatedROI?: string;
  competitorThreat?: boolean;
  closingAngle?: string;
  decisionMaker?: string;
  adSpendLevel?: string;
  useCases?: string[];
}

export default function DripFeedPage() {
  const [leads, setLeads] = React.useState<FloridaLead[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<FloridaLead | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<string>("all");
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const [showSimulation, setShowSimulation] = React.useState(false);
  const [showThinkingPanel, setShowThinkingPanel] = React.useState(false);
  const [researchDomain, setResearchDomain] = React.useState<string | undefined>();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Quick search suggestions for Florida home services
  const QUICK_SEARCHES = [
    { label: "Hot Leads", query: "hot", icon: Flame },
    { label: "Roofing", query: "roofing", icon: Building2 },
    { label: "HVAC", query: "hvac ac", icon: Building2 },
    { label: "Pool Service", query: "pool", icon: Building2 },
    { label: "Miami", query: "miami south florida", icon: MapPin },
    { label: "Tampa", query: "tampa bay", icon: MapPin },
    { label: "No Video", query: "needs video", icon: Video },
  ];

  // Copy opener handler
  const handleCopyOpener = React.useCallback(async (lead: FloridaLead) => {
    await navigator.clipboard.writeText(lead.openerMedium || lead.openerShort);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Research handler
  const handleResearch = React.useCallback((domain: string) => {
    setResearchDomain(domain);
    setShowSimulation(true);
  }, []);

  // Get focused lead
  const focusedLead = React.useMemo(() => {
    const filtered = leads.filter((lead) => {
      if (activeFilter === "saved" && lead.status !== "saved") return false;
      if (activeFilter === "hot" && lead.score < 80) return false;
      if (activeFilter === "novideo" && lead.hasVideo) return false;
      return true;
    });
    return filtered[focusedIndex] || null;
  }, [leads, activeFilter, focusedIndex]);

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    if (activeFilter === "saved" && lead.status !== "saved") return false;
    if (activeFilter === "hot" && lead.score < 80) return false;
    if (activeFilter === "novideo" && lead.hasVideo) return false;
    return true;
  });

  // Keyboard shortcuts
  const { showHelp, setShowHelp } = useKeyboardShortcuts({
    onNext: () => {
      const maxIndex = filteredLeads.length - 1;
      setFocusedIndex((prev) => Math.min(prev + 1, maxIndex));
    },
    onPrevious: () => {
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    },
    onOpenDetails: () => {
      if (focusedLead) setSelectedLead(focusedLead);
    },
    onCloseDetails: () => {
      setSelectedLead(null);
      setShowSimulation(false);
    },
    onSave: () => {
      if (focusedLead) handleStatusChange(focusedLead.id, "saved");
    },
    onSkip: () => {
      if (focusedLead) handleStatusChange(focusedLead.id, "skip");
    },
    onResearch: () => {
      if (focusedLead) handleResearch(focusedLead.domain);
    },
    onCopyOpener: () => {
      if (focusedLead) handleCopyOpener(focusedLead);
    },
    onRefresh: () => searchQuery && loadData(searchQuery),
    onExport: () => handleExport(),
    onSearch: () => searchInputRef.current?.focus(),
    enabled: !selectedLead && !showSimulation,
  });

  // Load data - only when user explicitly searches
  const loadData = React.useCallback(async (query?: string) => {
    // Don't load if no query provided (user must search first)
    if (!query) {
      setIsLoading(false);
      return;
    }

    setIsRefreshing(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          limit: 20,
          hotLeadsOnly: query === "hot",
        }),
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      if (data.leads && data.leads.length > 0) {
        // Transform API response to include companyName for compatibility
        const transformedLeads = data.leads.map((lead: FloridaLead) => ({
          ...lead,
          companyName: lead.name || lead.companyName,
          status: lead.status || "new",
          geo: lead.location,
          triggeredSignals: lead.signals?.map((s: string) => ({
            signalId: s.toLowerCase().replace(/\s+/g, "-"),
            signalName: s,
            category: "video_opportunity",
            priority: s.includes("No video") || s.includes("huge") ? "high" : "medium",
          })) || [],
        }));
        setLeads(transformedLeads);
      } else {
        setLeads([]);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  // Don't auto-load on mount - wait for user to search
  React.useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadData(searchQuery);
    }
  };

  const handleStatusChange = (leadId: string, status: "new" | "saved" | "contacted" | "skip") => {
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === leadId ? { ...l, status } : l));
      return updated;
    });
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleExport = () => {
    const csv = [
      ["Company", "Category", "Location", "Phone", "Score", "Video Opportunity", "Package", "Status"].join(","),
      ...leads.map((l) => [
        `"${l.companyName}"`,
        l.industry,
        l.location,
        l.phone,
        l.score,
        l.videoOpportunity,
        `"${l.packageRecommendation}"`,
        l.status || "new",
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `florida-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const stats = {
    total: leads.length,
    saved: leads.filter((l) => l.status === "saved").length,
    hot: leads.filter((l) => l.score >= 80).length,
    noVideo: leads.filter((l) => !l.hasVideo).length,
  };

  return (
    <div className="flex h-full flex-col bg-[--background]">
      {/* Header */}
      <header className="border-b border-[--border] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[--teal] to-[--purple] flex items-center justify-center">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Florida Home Services</h1>
              <p className="text-sm text-[--foreground-muted]">
                {stats.total} businesses · {stats.noVideo} need video content
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => searchQuery ? loadData(searchQuery) : null}
              disabled={isRefreshing || !searchQuery}
              className="h-9 gap-2"
              title={searchQuery ? "Refresh current search" : "Search first to enable refresh"}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="h-9 gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(true)}
              className="h-9 w-9 p-0"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[--foreground-subtle]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by category, city, region... (e.g., 'roofing miami' or 'pool tampa')"
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[--background-secondary] border border-[--border] text-sm placeholder:text-[--foreground-subtle] focus:outline-none focus:border-[--teal] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[--foreground-subtle] hover:text-[--foreground]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* Quick Filters */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-all",
              activeFilter === "all"
                ? "bg-[--teal] text-white"
                : "bg-[--background-secondary] text-[--foreground-muted] hover:text-[--foreground]"
            )}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setActiveFilter("hot")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5",
              activeFilter === "hot"
                ? "bg-[--coral] text-white"
                : "bg-[--background-secondary] text-[--foreground-muted] hover:text-[--foreground]"
            )}
          >
            <Flame className="h-3.5 w-3.5" /> Hot ({stats.hot})
          </button>
          <button
            onClick={() => setActiveFilter("novideo")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5",
              activeFilter === "novideo"
                ? "bg-[--purple] text-white"
                : "bg-[--background-secondary] text-[--foreground-muted] hover:text-[--foreground]"
            )}
          >
            <Video className="h-3.5 w-3.5" /> Needs Video ({stats.noVideo})
          </button>
          <button
            onClick={() => setActiveFilter("saved")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5",
              activeFilter === "saved"
                ? "bg-[--accent] text-white"
                : "bg-[--background-secondary] text-[--foreground-muted] hover:text-[--foreground]"
            )}
          >
            <Bookmark className="h-3.5 w-3.5" /> Saved ({stats.saved})
          </button>

          <div className="h-4 w-px bg-[--border] mx-1" />

          {QUICK_SEARCHES.map((qs) => (
            <button
              key={qs.label}
              onClick={() => {
                setSearchQuery(qs.query);
                loadData(qs.query);
              }}
              className="px-3 py-1.5 text-sm rounded-lg bg-[--background-secondary] text-[--foreground-muted] hover:text-[--foreground] hover:bg-[--background-tertiary] transition-all flex items-center gap-1.5"
            >
              <qs.icon className="h-3.5 w-3.5" />
              {qs.label}
            </button>
          ))}
        </div>
      </header>

      {/* Lead Grid */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-[--background-secondary] animate-pulse" />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[--teal]/20 to-[--purple]/20 flex items-center justify-center mb-4">
                <Search className="h-7 w-7 text-[--teal]" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Search for businesses</h3>
              <p className="text-sm text-[--foreground-muted] mb-6 max-w-md">
                Search for Florida home service businesses by category, city, or region. Try "kitchen miami" or "roofing tampa"
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {QUICK_SEARCHES.map((qs) => (
                  <Button
                    key={qs.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery(qs.query);
                      loadData(qs.query);
                    }}
                    className="gap-2"
                  >
                    <qs.icon className="h-3.5 w-3.5" />
                    {qs.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredLeads.map((lead, idx) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                  >
                    <FloridaBusinessCard
                      lead={lead}
                      onSelect={() => setSelectedLead(lead)}
                      onSave={() => handleStatusChange(lead.id, "saved")}
                      onSkip={() => handleStatusChange(lead.id, "skip")}
                      onCopy={() => handleCopyOpener(lead)}
                      isCopied={copiedId === lead.id}
                      isFocused={focusedIndex === idx && !selectedLead}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto">
          {selectedLead && (
            <FloridaBusinessDetail
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              onSave={() => handleStatusChange(selectedLead.id, "saved")}
              onCopy={() => handleCopyOpener(selectedLead)}
              isCopied={copiedId === selectedLead.id}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />

      {/* Keyboard hint */}
      {!isLoading && leads.length > 0 && !selectedLead && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-[--background-secondary] border border-[--border] rounded-lg text-xs text-[--foreground-muted] shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Keyboard className="h-3.5 w-3.5" />
          <span>Press <kbd className="px-1.5 py-0.5 bg-[--background] border border-[--border] rounded text-[10px] font-mono">?</kbd> for shortcuts</span>
        </div>
      )}
    </div>
  );
}

// Florida Business Card Component
function FloridaBusinessCard({
  lead,
  onSelect,
  onSave,
  onSkip,
  onCopy,
  isCopied,
  isFocused,
}: {
  lead: FloridaLead;
  onSelect: () => void;
  onSave: () => void;
  onSkip: () => void;
  onCopy?: () => void;
  isCopied?: boolean;
  isFocused?: boolean;
}) {
  const isSaved = lead.status === "saved";
  const isHot = lead.score >= 80;
  const needsVideo = !lead.hasVideo;

  return (
    <div
      className={cn(
        "water-card rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg group relative",
        isSaved && "border-[--purple]/40 bg-[--purple]/5",
        isFocused && "ring-2 ring-[--teal] ring-offset-2 ring-offset-[--background]"
      )}
      onClick={onSelect}
    >
      {/* Badges */}
      <div className="absolute -top-2 right-2 flex gap-1">
        {isHot && (
          <div className="px-2 py-0.5 rounded-full bg-[--coral] text-white text-xs font-medium shadow-lg flex items-center gap-1">
            <Flame className="h-3 w-3" /> Hot
          </div>
        )}
        {needsVideo && (
          <div className="px-2 py-0.5 rounded-full bg-[--purple] text-white text-xs font-medium shadow-lg flex items-center gap-1">
            <Video className="h-3 w-3" /> No Video
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-3 mt-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[--teal]/20 to-[--purple]/20 flex items-center justify-center text-base font-bold text-[--teal] border border-[--teal]/20 shrink-0">
              {lead.companyName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{lead.companyName}</h3>
              <p className="text-xs text-[--foreground-muted] truncate">{lead.industry}</p>
            </div>
          </div>
        </div>

        <div className={cn(
          "text-xl font-bold font-display px-2 py-1 rounded-lg",
          isHot ? "text-[--coral] bg-[--coral]/10" : "text-[--foreground-muted]"
        )}>
          {lead.score}
        </div>
      </div>

      {/* Location & Contact */}
      <div className="flex items-center gap-3 text-xs text-[--foreground-muted] mb-3">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {lead.location}
        </span>
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {lead.phone}
        </span>
      </div>

      {/* Social Presence */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "px-2 py-1 rounded-lg flex items-center gap-1 text-xs",
          lead.hasFacebook ? "bg-blue-500/10 text-blue-500" : "bg-[--background-secondary] text-[--foreground-subtle]"
        )}>
          <Facebook className="h-3 w-3" />
          {lead.hasFacebook ? "FB" : "No FB"}
        </div>
        <div className={cn(
          "px-2 py-1 rounded-lg flex items-center gap-1 text-xs",
          lead.hasInstagram ? "bg-pink-500/10 text-pink-500" : "bg-[--background-secondary] text-[--foreground-subtle]"
        )}>
          <Instagram className="h-3 w-3" />
          {lead.hasInstagram ? "IG" : "No IG"}
        </div>
        <div className={cn(
          "px-2 py-1 rounded-lg flex items-center gap-1 text-xs",
          lead.hasVideo ? "bg-red-500/10 text-red-500" : "bg-[--purple]/10 text-[--purple]"
        )}>
          <Video className="h-3 w-3" />
          {lead.hasVideo ? "Has Video" : "No Video"}
        </div>
      </div>

      {/* Video Opportunity & Buying Intent */}
      <div className={cn(
        "p-2 rounded-lg mb-3",
        lead.videoOpportunity === "High" ? "bg-[--coral]/10 border border-[--coral]/20" : "bg-[--background-secondary]"
      )}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-[--foreground]">
            {lead.packageRecommendation}
          </p>
          {lead.buyingIntent && (
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium",
              lead.buyingIntent === "high" ? "bg-green-500/20 text-green-600" :
              lead.buyingIntent === "medium" ? "bg-yellow-500/20 text-yellow-600" : "bg-gray-400/20 text-gray-500"
            )}>
              {lead.buyingIntent.toUpperCase()} INTENT
            </span>
          )}
        </div>
        {lead.primaryUseCase && (
          <p className="text-[10px] text-[--foreground-muted]">
            Best for: {lead.primaryUseCase === "meta_ads" ? "Meta/Facebook Ads" :
              lead.primaryUseCase === "organic_social" ? "Organic Social" :
              lead.primaryUseCase === "google_lsa" ? "Google Local Ads" :
              lead.primaryUseCase === "youtube_ads" ? "YouTube Ads" :
              lead.primaryUseCase === "website" ? "Website Content" : lead.primaryUseCase}
          </p>
        )}
      </div>

      {/* Key Signals */}
      <div className="flex flex-wrap gap-1 mb-3">
        {lead.signals.slice(0, 3).map((signal, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded-full bg-[--background-secondary] text-[--foreground-muted] text-xs"
          >
            {signal.length > 40 ? signal.slice(0, 40) + "..." : signal}
          </span>
        ))}
      </div>

      {/* Why Now */}
      <p className="text-sm text-[--foreground-muted] line-clamp-2 mb-4">
        {lead.whyNow}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-[--border]/50">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
              isSaved
                ? "bg-[--purple] text-white"
                : "bg-[--background-secondary] text-[--foreground-muted] hover:bg-[--purple]/10 hover:text-[--purple]"
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
            {isSaved ? "Saved" : "Save"}
          </button>
          {onCopy && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                isCopied
                  ? "bg-green-500/10 text-green-500"
                  : "bg-[--background-secondary] text-[--foreground-muted] hover:bg-[--accent]/10 hover:text-[--accent]"
              )}
              title="Copy opener script"
            >
              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {isCopied ? "Copied!" : "Script"}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
            className="px-3 py-1.5 rounded-lg text-sm text-[--foreground-subtle] hover:bg-[--background-secondary] transition-all"
          >
            Skip
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="flex items-center gap-1 text-sm text-[--teal] font-medium group-hover:gap-2 transition-all"
        >
          View
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Florida Business Detail Component
function FloridaBusinessDetail({
  lead,
  onClose,
  onSave,
  onCopy,
  isCopied,
}: {
  lead: FloridaLead;
  onClose: () => void;
  onSave: () => void;
  onCopy: () => void;
  isCopied: boolean;
}) {
  const isSaved = lead.status === "saved";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[--border]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[--teal]/20 to-[--purple]/20 flex items-center justify-center text-2xl font-bold text-[--teal] border border-[--teal]/20">
              {lead.companyName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{lead.companyName}</h2>
              <p className="text-sm text-[--foreground-muted]">{lead.industry} · {lead.subCategory}</p>
            </div>
          </div>
          <div className={cn(
            "text-3xl font-bold font-display px-3 py-1 rounded-xl",
            lead.score >= 80 ? "text-[--coral] bg-[--coral]/10" : "text-[--foreground-muted]"
          )}>
            {lead.score}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onSave}
            variant={isSaved ? "default" : "outline"}
            className={cn(isSaved && "bg-[--purple] hover:bg-[--purple]/90")}
          >
            <Bookmark className={cn("h-4 w-4 mr-2", isSaved && "fill-current")} />
            {isSaved ? "Saved" : "Save Lead"}
          </Button>
          <Button onClick={onCopy} variant="outline">
            {isCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {isCopied ? "Copied!" : "Copy Script"}
          </Button>
          <Button variant="outline" asChild>
            <a href={`tel:${lead.phone}`}>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </a>
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Contact Info</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[--background-secondary]">
                <Phone className="h-4 w-4 text-[--teal]" />
                <span className="font-medium">{lead.phone}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[--background-secondary]">
                <MapPin className="h-4 w-4 text-[--teal]" />
                <span>{lead.location} ({lead.region})</span>
              </div>
              {lead.website && (
                <a
                  href={`https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[--background-secondary] hover:bg-[--teal]/10 transition-colors"
                >
                  <Globe className="h-4 w-4 text-[--teal]" />
                  <span className="text-[--teal]">{lead.website}</span>
                  <ExternalLink className="h-3 w-3 text-[--teal] ml-auto" />
                </a>
              )}
            </div>
          </div>

          {/* Business Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Business Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[--background-secondary]">
                <p className="text-xs text-[--foreground-muted] mb-1">Employees</p>
                <p className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-[--teal]" />
                  {lead.employeeCount}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[--background-secondary]">
                <p className="text-xs text-[--foreground-muted] mb-1">Est. Revenue</p>
                <p className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[--teal]" />
                  {lead.stage}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[--background-secondary] col-span-2">
                <p className="text-xs text-[--foreground-muted] mb-1">Years in Business</p>
                <p className="font-semibold">{lead.yearsInBusiness} years</p>
              </div>
            </div>
          </div>

          {/* Social Presence */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Social Presence</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={cn(
                "p-3 rounded-lg flex items-center gap-2",
                lead.hasFacebook ? "bg-blue-500/10" : "bg-[--background-secondary]"
              )}>
                <Facebook className={cn("h-4 w-4", lead.hasFacebook ? "text-blue-500" : "text-[--foreground-subtle]")} />
                <span className={lead.hasFacebook ? "text-blue-500 font-medium" : "text-[--foreground-muted]"}>
                  {lead.hasFacebook ? "Has Facebook" : "No Facebook"}
                </span>
              </div>
              <div className={cn(
                "p-3 rounded-lg flex items-center gap-2",
                lead.hasInstagram ? "bg-pink-500/10" : "bg-[--background-secondary]"
              )}>
                <Instagram className={cn("h-4 w-4", lead.hasInstagram ? "text-pink-500" : "text-[--foreground-subtle]")} />
                <span className={lead.hasInstagram ? "text-pink-500 font-medium" : "text-[--foreground-muted]"}>
                  {lead.hasInstagram ? "Has Instagram" : "No Instagram"}
                </span>
              </div>
              <div className={cn(
                "p-3 rounded-lg flex items-center gap-2",
                lead.hasYouTube ? "bg-red-500/10" : "bg-[--background-secondary]"
              )}>
                <Youtube className={cn("h-4 w-4", lead.hasYouTube ? "text-red-500" : "text-[--foreground-subtle]")} />
                <span className={lead.hasYouTube ? "text-red-500 font-medium" : "text-[--foreground-muted]"}>
                  {lead.hasYouTube ? "Has YouTube" : "No YouTube"}
                </span>
              </div>
              <div className={cn(
                "p-3 rounded-lg flex items-center gap-2",
                lead.hasVideo ? "bg-green-500/10" : "bg-[--purple]/10"
              )}>
                <Video className={cn("h-4 w-4", lead.hasVideo ? "text-green-500" : "text-[--purple]")} />
                <span className={lead.hasVideo ? "text-green-500 font-medium" : "text-[--purple] font-medium"}>
                  {lead.hasVideo ? "Has Video Content" : "No Video Content"}
                </span>
              </div>
            </div>
          </div>

          {/* Video Opportunity */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Video Opportunity</h3>
            <div className={cn(
              "p-4 rounded-xl",
              lead.videoOpportunity === "High" ? "bg-[--coral]/10 border border-[--coral]/20" : "bg-[--background-secondary]"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  lead.videoOpportunity === "High" ? "bg-[--coral] text-white" : "bg-[--foreground-subtle]/20"
                )}>
                  {lead.videoOpportunity} Opportunity
                </span>
                {lead.buyingIntent && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    lead.buyingIntent === "high" ? "bg-green-500 text-white" :
                    lead.buyingIntent === "medium" ? "bg-yellow-500 text-white" : "bg-gray-400 text-white"
                  )}>
                    {lead.buyingIntent.charAt(0).toUpperCase() + lead.buyingIntent.slice(1)} Intent
                  </span>
                )}
              </div>
              <p className="font-semibold text-lg">{lead.packageRecommendation}</p>
            </div>
          </div>

          {/* WHY They Would Buy - Video Use Cases */}
          {lead.useCases && lead.useCases.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Why They'd Buy Video</h3>
              <div className="space-y-2">
                {lead.useCases.map((useCase, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[--teal]/5 border border-[--teal]/20">
                    <p className="text-sm">{useCase}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buying Intent Reasons */}
          {lead.buyingIntentReasons && lead.buyingIntentReasons.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Buying Intent Signals</h3>
              <div className="space-y-2">
                {lead.buyingIntentReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ideal Video Types */}
          {lead.idealVideoTypes && lead.idealVideoTypes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Best Video Types for Them</h3>
              <div className="flex flex-wrap gap-2">
                {lead.idealVideoTypes.map((type, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-full bg-[--purple]/10 text-[--purple] text-sm">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ROI & Decision Maker */}
          <div className="grid grid-cols-2 gap-4">
            {lead.estimatedROI && (
              <div className="p-3 rounded-lg bg-[--background-secondary]">
                <p className="text-xs text-[--foreground-muted] mb-1">Estimated ROI</p>
                <p className="text-sm font-medium">{lead.estimatedROI}</p>
              </div>
            )}
            {lead.decisionMaker && (
              <div className="p-3 rounded-lg bg-[--background-secondary]">
                <p className="text-xs text-[--foreground-muted] mb-1">Decision Maker</p>
                <p className="text-sm font-medium">{lead.decisionMaker}</p>
              </div>
            )}
          </div>

          {/* Competitor Threat */}
          {lead.competitorThreat !== undefined && (
            <div className={cn(
              "p-3 rounded-lg flex items-center gap-3",
              lead.competitorThreat ? "bg-[--coral]/10 border border-[--coral]/20" : "bg-[--background-secondary]"
            )}>
              {lead.competitorThreat ? (
                <>
                  <span className="text-[--coral] font-medium">⚠️ Competitors using video</span>
                  <span className="text-xs text-[--foreground-muted]">Urgency to catch up</span>
                </>
              ) : (
                <>
                  <span className="text-green-500 font-medium">✓ First-mover advantage</span>
                  <span className="text-xs text-[--foreground-muted]">Be first in market with video</span>
                </>
              )}
            </div>
          )}

          {/* Closing Angle */}
          {lead.closingAngle && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Closing Angle</h3>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[--teal]/10 to-[--purple]/10 border border-[--teal]/20">
                <p className="text-sm font-medium italic">"{lead.closingAngle}"</p>
              </div>
            </div>
          )}

          {/* Signals */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Buying Signals</h3>
            <div className="space-y-2">
              {lead.signals.map((signal, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[--background-secondary]">
                  <div className="w-2 h-2 rounded-full bg-[--teal]" />
                  <span className="text-sm">{signal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pain Points */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Pain Points</h3>
            <div className="space-y-2">
              {lead.painPoints.map((pain, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-[--coral]/5">
                  <span className="text-[--coral]">•</span>
                  <span className="text-sm">{pain}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ideal Video Content */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Ideal Video Content</h3>
            <div className="flex flex-wrap gap-2">
              {lead.idealFor.map((content, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-full bg-[--teal]/10 text-[--teal] text-sm">
                  {content}
                </span>
              ))}
            </div>
          </div>

          {/* Sales Script */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Sales Script</h3>
            <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
              <p className="text-sm leading-relaxed">{lead.openerMedium}</p>
              <Button onClick={onCopy} variant="outline" size="sm" className="mt-3">
                {isCopied ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
                {isCopied ? "Copied!" : "Copy Script"}
              </Button>
            </div>
          </div>

          {/* Why Now */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[--foreground-muted] mb-3">Why Now?</h3>
            <p className="text-sm p-4 rounded-xl bg-[--teal]/5 border border-[--teal]/20 italic">
              "{lead.whyNow}"
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
