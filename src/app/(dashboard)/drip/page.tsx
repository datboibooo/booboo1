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
import type { VerifiedLead } from "@/lib/data/lead-generator";
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
  TrendingUp,
  Building2,
} from "lucide-react";
import { getStoredLeads, saveLeads, updateLead, logActivity } from "@/lib/store";
import { jobBoardLeadsToRecords, type JobBoardLead } from "@/lib/data/job-to-lead";
import { cn } from "@/lib/utils";
import { CompanyBrief } from "@/components/leads/company-brief";

// Type for leads that may have verification
type LeadWithOptionalVerification = LeadRecord | VerifiedLead;

export default function DripFeedPage() {
  const [leads, setLeads] = React.useState<LeadWithOptionalVerification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<LeadWithOptionalVerification | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<string>("all");

  // Quick search suggestions
  const QUICK_SEARCHES = [
    { label: "Engineering", query: "engineering", icon: Sparkles },
    { label: "AI/ML", query: "ai ml machine learning", icon: TrendingUp },
    { label: "Fintech", query: "fintech finance", icon: Building2 },
  ];

  // Load data
  const loadData = React.useCallback(async (query?: string) => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query || "Companies hiring engineers",
          limit: 15,
        }),
      });

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      if (data.leads && data.leads.length > 0) {
        const records = jobBoardLeadsToRecords(data.leads as JobBoardLead[]);
        setLeads(records);
        saveLeads(records);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      const stored = getStoredLeads();
      if (stored.length > 0) setLeads(stored);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const stored = getStoredLeads();
    if (stored.length > 0) {
      setLeads(stored);
      setIsLoading(false);
    } else {
      loadData();
    }
  }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadData(searchQuery);
    }
  };

  const handleStatusChange = (leadId: string, status: LeadRecord["status"]) => {
    const lead = leads.find((l) => l.id === leadId);
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === leadId ? { ...l, status } : l));
      saveLeads(updated);
      return updated;
    });
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status } : null));
    }
    updateLead(leadId, { status });
    if (lead) {
      const activityType = status === "saved" ? "lead_saved" : status === "skip" ? "lead_skipped" : null;
      if (activityType) logActivity(activityType, { id: lead.id, companyName: lead.companyName, domain: lead.domain });
    }
  };

  const handleExport = () => {
    const csv = [
      ["Company", "Domain", "Score", "Industry", "Status"].join(","),
      ...leads.map((l) => [`"${l.companyName}"`, l.domain, l.score, l.industry || "", l.status].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drip-drip-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    if (activeFilter === "saved" && lead.status !== "saved") return false;
    if (activeFilter === "hot" && lead.score < 80) return false;
    return true;
  });

  const stats = {
    total: leads.length,
    saved: leads.filter((l) => l.status === "saved").length,
    hot: leads.filter((l) => l.score >= 80).length,
  };

  return (
    <div className="flex h-full flex-col bg-[--background]">
      {/* Clean Header */}
      <header className="border-b border-[--border] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[--teal] to-[--purple] flex items-center justify-center">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Today's Leads</h1>
              <p className="text-sm text-[--foreground-muted]">
                {stats.total} companies · {stats.hot} hot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData()}
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
            <Button variant="outline" size="sm" onClick={handleExport} className="h-9 gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[--foreground-subtle]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, industries, tech stack..."
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
        <div className="mt-3 flex items-center gap-2">
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
            <span>🔥</span> Hot ({stats.hot})
          </button>
          <button
            onClick={() => setActiveFilter("saved")}
            className={cn(
              "px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5",
              activeFilter === "saved"
                ? "bg-[--purple] text-white"
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
                <div key={i} className="h-48 rounded-2xl bg-[--background-secondary] animate-pulse" />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[--background-secondary] flex items-center justify-center mb-4">
                <Filter className="h-7 w-7 text-[--foreground-subtle]" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No leads found</h3>
              <p className="text-sm text-[--foreground-muted] mb-4">
                Try a different search or refresh for new leads
              </p>
              <Button onClick={() => loadData()} className="btn-fluid">
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Fresh Leads
              </Button>
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
                    <LeadCardSimple
                      lead={lead}
                      onSelect={() => setSelectedLead(lead)}
                      onSave={() => handleStatusChange(lead.id, "saved")}
                      onSkip={() => handleStatusChange(lead.id, "skip")}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Company Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          {selectedLead && (
            <CompanyBrief lead={selectedLead} onClose={() => setSelectedLead(null)} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Simplified Lead Card Component
function LeadCardSimple({
  lead,
  onSelect,
  onSave,
  onSkip,
}: {
  lead: LeadWithOptionalVerification;
  onSelect: () => void;
  onSave: () => void;
  onSkip: () => void;
}) {
  const isSaved = lead.status === "saved";
  const isHot = lead.score >= 80;

  return (
    <div
      className={cn(
        "water-card rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg group",
        isSaved && "border-[--purple]/40 bg-[--purple]/5"
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[--teal]/20 to-[--purple]/20 flex items-center justify-center text-base font-bold text-[--teal] border border-[--teal]/20 shrink-0">
              {lead.companyName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{lead.companyName}</h3>
              <div className="flex items-center gap-1.5 text-xs text-[--foreground-muted]">
                <span className="truncate">{lead.domain}</span>
                <a
                  href={`https://${lead.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[--foreground-subtle] hover:text-[--teal]"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
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

      {/* Industry & Location */}
      <div className="flex items-center gap-2 text-xs text-[--foreground-muted] mb-3">
        {lead.industry && <span>{lead.industry}</span>}
        {lead.industry && lead.geo && <span>·</span>}
        {lead.geo && <span>{lead.geo}</span>}
      </div>

      {/* Signals */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {lead.triggeredSignals.slice(0, 2).map((signal, idx) => (
          <span
            key={idx}
            className={cn(
              "px-2 py-0.5 text-xs rounded-md",
              signal.priority === "high"
                ? "bg-[--coral]/10 text-[--coral]"
                : signal.priority === "medium"
                ? "bg-[--teal]/10 text-[--teal]"
                : "bg-[--background-tertiary] text-[--foreground-muted]"
            )}
          >
            {signal.signalName}
          </span>
        ))}
        {lead.triggeredSignals.length > 2 && (
          <span className="text-xs text-[--foreground-subtle]">
            +{lead.triggeredSignals.length - 2}
          </span>
        )}
      </div>

      {/* Why Now - simplified */}
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
