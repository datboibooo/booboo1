"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { LeadCard } from "@/components/leads/lead-card";
import { CompanyBrief } from "@/components/leads/company-brief";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadRecord } from "@/lib/schemas";
import type { VerifiedLead } from "@/lib/data/lead-generator";
import {
  Filter,
  Download,
  SlidersHorizontal,
  AlertCircle,
  CheckSquare,
  Square,
  X,
  CheckCircle,
  Keyboard,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { getStoredLeads, saveLeads, updateLead, logActivity } from "@/lib/store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { KeyboardShortcutsHelp } from "@/components/ui/keyboard-shortcuts-help";
import { cn } from "@/lib/utils";

// Type for leads that may have verification
type LeadWithOptionalVerification = LeadRecord | VerifiedLead;

// Type guard
function hasVerification(lead: LeadWithOptionalVerification): lead is VerifiedLead {
  return 'verification' in lead && lead.verification !== undefined;
}

export default function DripFeedPage() {
  const [leads, setLeads] = React.useState<LeadWithOptionalVerification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<LeadWithOptionalVerification | null>(
    null
  );
  const [isDemo, setIsDemo] = React.useState(false);
  const [filters, setFilters] = React.useState({
    status: "all",
    minScore: 0,
    industry: "all",
    geo: "all",
    verification: "all", // all, verified, watchlist, unverified
  });

  // Bulk selection state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = React.useState(false);

  // Current focus index for keyboard navigation
  const [focusIndex, setFocusIndex] = React.useState(0);

  const fetchLeads = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        date: new Date().toISOString().split("T")[0],
      });

      if (filters.status !== "all") {
        params.set("status", filters.status);
      }
      if (filters.minScore > 0) {
        params.set("minScore", filters.minScore.toString());
      }

      const response = await fetch(`/api/leads?${params.toString()}`);
      const data = await response.json();

      if (data.leads && data.leads.length > 0) {
        setLeads(data.leads);
        setIsDemo(data.isDemo || false);
        // Save to localStorage for persistence
        if (data.isDemo) {
          saveLeads(data.leads);
        }
      } else {
        // Fall back to localStorage
        const storedLeads = getStoredLeads();
        setLeads(storedLeads);
        setIsDemo(true);
      }
    } catch (error) {
      console.error("Failed to fetch leads from API:", error);
      // Fall back to localStorage
      const storedLeads = getStoredLeads();
      setLeads(storedLeads);
      setIsDemo(true);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Call the real RSS endpoint with verification enabled
      const response = await fetch("/api/leads/rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxItems: 15,
          enableVerification: true,
          verificationMinConfidence: 0.45,
          skipOpeners: false,
        }),
      });
      const data = await response.json();

      if (data.error) {
        console.error("RSS lead generation error:", data.error, data.message || data.details);
        // Fall back to demo data
        const storedLeads = getStoredLeads();
        setLeads(storedLeads);
        setIsDemo(true);
        return;
      }

      if (data.leads && data.leads.length > 0) {
        setLeads(data.leads);
        setIsDemo(false);
        // Save to localStorage for persistence
        saveLeads(data.leads);
        console.log(`Generated ${data.leads.length} leads from RSS`, data.stats);
      } else {
        console.warn("No leads generated from RSS");
        // Fall back to demo data
        const storedLeads = getStoredLeads();
        setLeads(storedLeads);
        setIsDemo(true);
      }
    } catch (error) {
      console.error("Failed to generate leads:", error);
      // If API fails, fall back to localStorage
      const storedLeads = getStoredLeads();
      setLeads(storedLeads);
      setIsDemo(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (
    leadId: string,
    status: LeadRecord["status"]
  ) => {
    // Find the lead for logging
    const lead = leads.find((l) => l.id === leadId);

    // Optimistic update
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === leadId ? { ...l, status } : l));
      // Persist to localStorage
      saveLeads(updated);
      return updated;
    });

    // Also update selected lead if open
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status } : null));
    }

    // Also update in localStorage store
    updateLead(leadId, { status });

    // Log the activity
    if (lead) {
      const activityType = status === "saved" ? "lead_saved"
        : status === "skip" ? "lead_skipped"
        : status === "contacted" ? "lead_contacted"
        : null;

      if (activityType) {
        logActivity(activityType, {
          id: lead.id,
          companyName: lead.companyName,
          domain: lead.domain,
        });
      }
    }

    // API call (will work when backend is connected)
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error("Failed to update lead status via API:", error);
    }
  };

  // Bulk status change
  const handleBulkStatusChange = async (status: LeadRecord["status"]) => {
    const idsToUpdate = Array.from(selectedIds);
    const leadsToUpdate = leads.filter((l) => selectedIds.has(l.id));

    // Optimistic update
    setLeads((prev) => {
      const updated = prev.map((l) =>
        selectedIds.has(l.id) ? { ...l, status } : l
      );
      saveLeads(updated);
      return updated;
    });

    // Determine activity type
    const activityType = status === "saved" ? "lead_saved"
      : status === "skip" ? "lead_skipped"
      : status === "contacted" ? "lead_contacted"
      : null;

    // Update each lead and log activity
    for (const lead of leadsToUpdate) {
      updateLead(lead.id, { status });

      // Log activity
      if (activityType) {
        logActivity(activityType, {
          id: lead.id,
          companyName: lead.companyName,
          domain: lead.domain,
        });
      }

      try {
        await fetch(`/api/leads/${lead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      } catch (error) {
        console.error(`Failed to update lead ${lead.id}:`, error);
      }
    }

    // Clear selection
    setSelectedIds(new Set());
    setBulkMode(false);
  };

  const handleExport = () => {
    const csv = [
      [
        "Company",
        "Domain",
        "Score",
        "Industry",
        "Geo",
        "Why Now",
        "Signals",
        "Status",
      ].join(","),
      ...leads.map((l) =>
        [
          `"${l.companyName}"`,
          l.domain,
          l.score,
          l.industry || "",
          l.geo || "",
          `"${l.whyNow.replace(/"/g, '""')}"`,
          `"${l.triggeredSignals.map((s) => s.signalName).join("; ")}"`,
          l.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leaddrip-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filteredLeads = leads.filter((lead) => {
    if (filters.status !== "all" && lead.status !== filters.status) return false;
    if (lead.score < filters.minScore) return false;
    if (
      filters.industry !== "all" &&
      lead.industry?.toLowerCase() !== filters.industry.toLowerCase()
    )
      return false;
    if (
      filters.geo !== "all" &&
      lead.geo?.toLowerCase() !== filters.geo.toLowerCase()
    )
      return false;

    // Verification filter
    if (filters.verification !== "all") {
      const isVerified = hasVerification(lead);
      if (filters.verification === "verified" && (!isVerified || lead.verification?.status !== "verified")) {
        return false;
      }
      if (filters.verification === "watchlist" && (!isVerified || lead.verification?.status !== "watchlist")) {
        return false;
      }
      if (filters.verification === "unverified" && isVerified) {
        return false;
      }
    }

    return true;
  });

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Keyboard shortcuts
  const { showHelp, setShowHelp } = useKeyboardShortcuts({
    onNext: () => {
      setFocusIndex((prev) => Math.min(prev + 1, filteredLeads.length - 1));
    },
    onPrevious: () => {
      setFocusIndex((prev) => Math.max(prev - 1, 0));
    },
    onOpenDetails: () => {
      if (filteredLeads[focusIndex]) {
        setSelectedLead(filteredLeads[focusIndex]);
      }
    },
    onCloseDetails: () => {
      setSelectedLead(null);
    },
    onSave: () => {
      if (bulkMode && selectedIds.size > 0) {
        handleBulkStatusChange("saved");
      } else if (filteredLeads[focusIndex]) {
        handleStatusChange(filteredLeads[focusIndex].id, "saved");
      }
    },
    onSkip: () => {
      if (bulkMode && selectedIds.size > 0) {
        handleBulkStatusChange("skip");
      } else if (filteredLeads[focusIndex]) {
        handleStatusChange(filteredLeads[focusIndex].id, "skip");
      }
    },
    onSelectAll: () => {
      setBulkMode(true);
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    },
    onDeselectAll: () => {
      setSelectedIds(new Set());
      setBulkMode(false);
    },
    enabled: !isLoading,
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    saved: leads.filter((l) => l.status === "saved").length,
    avgScore: Math.round(
      leads.reduce((sum, l) => sum + l.score, 0) / Math.max(leads.length, 1)
    ),
    verified: leads.filter((l) => hasVerification(l) && l.verification?.status === "verified").length,
    watchlist: leads.filter((l) => hasVerification(l) && l.verification?.status === "watchlist").length,
  };

  const industries = Array.from(
    new Set(leads.map((l) => l.industry).filter(Boolean))
  );

  const geos = Array.from(
    new Set(leads.map((l) => l.geo).filter(Boolean))
  );

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Today's Drip"
        subtitle={`${stats.total} leads • ${stats.new} new${stats.verified > 0 ? ` • ${stats.verified} verified` : ""} • Avg score: ${stats.avgScore}`}
        showRefresh
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(true)}
              className="gap-1"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="flex items-center gap-2 border-b border-[--priority-medium]/30 bg-[--priority-medium]/10 px-6 py-2 text-sm text-[--priority-medium]">
          <AlertCircle className="h-4 w-4" />
          <span>
            Demo Mode: Showing sample data. Configure API keys to enable live
            generation.
          </span>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {bulkMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-4 border-b border-[--accent]/30 bg-[--accent]/10 px-6 py-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[--accent]" />
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleBulkStatusChange("saved")}
              className="h-7 text-xs"
            >
              <CheckCircle className="h-3 w-3" />
              Save All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkStatusChange("skip")}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3" />
              Skip All
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedIds(new Set());
              setBulkMode(false);
            }}
            className="ml-auto h-7 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex items-center gap-4 border-b border-[--border] bg-[--background-secondary] px-6 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant={bulkMode ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setBulkMode(!bulkMode);
              if (bulkMode) {
                setSelectedIds(new Set());
              }
            }}
            className="h-8 gap-1"
          >
            {bulkMode ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            Select
          </Button>
        </div>

        <div className="h-4 w-px bg-[--border]" />

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[--foreground-subtle]" />
          <span className="text-sm text-[--foreground-muted]">Filters:</span>
        </div>

        <Select
          value={filters.status}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="saved">Saved</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="skip">Skipped</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.minScore.toString()}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, minScore: parseInt(v) }))
          }
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="Min Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any Score</SelectItem>
            <SelectItem value="40">40+</SelectItem>
            <SelectItem value="60">60+</SelectItem>
            <SelectItem value="80">80+</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.industry}
          onValueChange={(v) => setFilters((f) => ({ ...f, industry: v }))}
        >
          <SelectTrigger className="w-40 h-8">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map((ind) => (
              <SelectItem key={ind} value={ind!.toLowerCase()}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.geo}
          onValueChange={(v) => setFilters((f) => ({ ...f, geo: v }))}
        >
          <SelectTrigger className="w-36 h-8">
            <MapPin className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {geos.map((geo) => (
              <SelectItem key={geo} value={geo!.toLowerCase()}>
                {geo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.verification}
          onValueChange={(v) => setFilters((f) => ({ ...f, verification: v }))}
        >
          <SelectTrigger className="w-36 h-8">
            <ShieldCheck className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Signals</SelectItem>
            <SelectItem value="verified">Verified Only</SelectItem>
            <SelectItem value="watchlist">Watchlist</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-sm text-[--foreground-muted]">
          Showing {filteredLeads.length} of {leads.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[--border] bg-[--background-secondary] p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-12 rounded-full" />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                    <Skeleton className="mt-3 h-16 w-full rounded-lg" />
                    <div className="mt-4 flex justify-between">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-[--background-tertiary] p-4">
                  <Filter className="h-8 w-8 text-[--foreground-subtle]" />
                </div>
                <h3 className="text-lg font-semibold">No leads found</h3>
                <p className="mt-2 text-sm text-[--foreground-muted]">
                  {leads.length > 0
                    ? "Try adjusting your filters to see more results."
                    : "Click 'Refresh' to generate new leads."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredLeads.map((lead, idx) => (
                  <div key={lead.id} className="relative">
                    {bulkMode && (
                      <button
                        onClick={() => toggleSelect(lead.id)}
                        className={cn(
                          "absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                          selectedIds.has(lead.id)
                            ? "border-[--accent] bg-[--accent] text-white"
                            : "border-[--border] bg-[--background] hover:border-[--accent]"
                        )}
                      >
                        {selectedIds.has(lead.id) && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <LeadCard
                      lead={lead}
                      isSelected={selectedLead?.id === lead.id}
                      isFocused={focusIndex === idx}
                      onSelect={() => setSelectedLead(lead)}
                      onStatusChange={(status) =>
                        handleStatusChange(lead.id, status)
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="border-t border-[--border] bg-[--background-secondary] px-6 py-2">
        <div className="flex items-center justify-between text-xs text-[--foreground-subtle]">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="rounded border border-[--border] bg-[--background] px-1">j</kbd>
              <span className="mx-1">/</span>
              <kbd className="rounded border border-[--border] bg-[--background] px-1">k</kbd>
              {" "}navigate
            </span>
            <span>
              <kbd className="rounded border border-[--border] bg-[--background] px-1">s</kbd>
              {" "}save
            </span>
            <span>
              <kbd className="rounded border border-[--border] bg-[--background] px-1">x</kbd>
              {" "}skip
            </span>
            <span>
              <kbd className="rounded border border-[--border] bg-[--background] px-1">Enter</kbd>
              {" "}open
            </span>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="hover:text-[--foreground] transition-colors"
          >
            Press <kbd className="rounded border border-[--border] bg-[--background] px-1">?</kbd> for all shortcuts
          </button>
        </div>
      </div>

      {/* Company Brief Drawer */}
      <Sheet
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          {selectedLead && (
            <CompanyBrief
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
