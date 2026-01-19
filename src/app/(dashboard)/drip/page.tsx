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
import {
  Filter,
  Download,
  SlidersHorizontal,
  AlertCircle,
} from "lucide-react";

export default function DripFeedPage() {
  const [leads, setLeads] = React.useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<LeadRecord | null>(
    null
  );
  const [isDemo, setIsDemo] = React.useState(false);
  const [filters, setFilters] = React.useState({
    status: "all",
    minScore: 0,
    industry: "all",
  });

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

      setLeads(data.leads || []);
      setIsDemo(data.isDemo || false);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
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
      const response = await fetch("/api/leads/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "hunt", limit: 50 }),
      });
      const data = await response.json();

      if (data.leads) {
        setLeads(data.leads);
        setIsDemo(data.isDemo || false);
      }
    } catch (error) {
      console.error("Failed to generate leads:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (
    leadId: string,
    status: LeadRecord["status"]
  ) => {
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );

    // Also update selected lead if open
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status } : null));
    }

    // API call
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error("Failed to update lead status:", error);
    }
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
    return true;
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    saved: leads.filter((l) => l.status === "saved").length,
    avgScore: Math.round(
      leads.reduce((sum, l) => sum + l.score, 0) / Math.max(leads.length, 1)
    ),
  };

  const industries = Array.from(
    new Set(leads.map((l) => l.industry).filter(Boolean))
  );

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Today's Drip"
        subtitle={`${stats.total} leads • ${stats.new} new • Avg score: ${stats.avgScore}`}
        showRefresh
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        actions={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
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

      {/* Filters Bar */}
      <div className="flex items-center gap-4 border-b border-[--border] bg-[--background-secondary] px-6 py-3">
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
                {filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedLead?.id === lead.id}
                    onSelect={() => setSelectedLead(lead)}
                    onStatusChange={(status) =>
                      handleStatusChange(lead.id, status)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
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
    </div>
  );
}
