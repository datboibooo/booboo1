"use client";

import * as React from "react";
import {
  Bookmark,
  ExternalLink,
  Trash2,
  Download,
  Code2,
  Briefcase,
  Users,
  Search,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSavedLeads,
  removeLead,
  downloadCSV,
  type SavedLead,
} from "@/lib/storage/leads";
import { OutreachModal } from "@/components/outreach/outreach-modal";

export default function SavedLeadsPage() {
  const [leads, setLeads] = React.useState<SavedLead[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [outreachLead, setOutreachLead] = React.useState<SavedLead | null>(null);

  React.useEffect(() => {
    setLeads(getSavedLeads());

    const handleUpdate = () => setLeads(getSavedLeads());
    window.addEventListener("leads-updated", handleUpdate);
    return () => window.removeEventListener("leads-updated", handleUpdate);
  }, []);

  const handleRemove = (id: string) => {
    removeLead(id);
  };

  const handleExportAll = () => {
    if (leads.length > 0) {
      downloadCSV(leads, "saved-leads");
    }
  };

  const filteredLeads = searchQuery
    ? leads.filter(
        (l) =>
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.techStack.some((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : leads;

  const velocityLabels = {
    aggressive: "Aggressive",
    moderate: "Growing",
    stable: "Stable",
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bookmark className="h-6 w-6 text-[--accent]" />
              Saved Leads
            </h1>
            <p className="text-sm text-[--foreground-muted] mt-1">
              {leads.length} {leads.length === 1 ? "lead" : "leads"} saved
            </p>
          </div>
          {leads.length > 0 && (
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[--background-secondary] hover:bg-[--background-tertiary] text-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              Export All
            </button>
          )}
        </div>

        {/* Search */}
        {leads.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[--foreground-subtle]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, industry, or tech..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[--background-secondary] border border-[--border] text-sm focus:outline-none focus:border-[--accent]/50"
            />
          </div>
        )}

        {/* Empty state */}
        {leads.length === 0 && (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-[--background-secondary] flex items-center justify-center mx-auto mb-4">
              <Bookmark className="h-8 w-8 text-[--foreground-subtle]" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No saved leads yet</h2>
            <p className="text-sm text-[--foreground-muted] max-w-sm mx-auto">
              Use the magic command bar (⌘K) to search for companies and save
              the ones you want to reach out to.
            </p>
          </div>
        )}

        {/* No results */}
        {leads.length > 0 && filteredLeads.length === 0 && (
          <div className="text-center py-12 text-[--foreground-muted]">
            No leads match &quot;{searchQuery}&quot;
          </div>
        )}

        {/* Leads grid */}
        {filteredLeads.length > 0 && (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-4 rounded-xl bg-[--background-secondary] border border-[--border] hover:border-[--accent]/30 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {lead.name}
                      <a
                        href={`https://${lead.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[--foreground-muted] hover:text-[--accent]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <div className="text-xs text-[--foreground-muted] mt-0.5">
                      {lead.industry} • {lead.stage}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div
                        className={cn(
                          "text-xl font-bold",
                          lead.score >= 85
                            ? "text-[--score-excellent]"
                            : lead.score >= 70
                            ? "text-[--score-good]"
                            : "text-[--score-average]"
                        )}
                      >
                        {lead.score}
                      </div>
                      <div className="text-[10px] text-[--foreground-muted]">
                        {velocityLabels[lead.hiringVelocity]}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(lead.id)}
                      className="p-2 rounded-lg text-[--foreground-subtle] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Signals */}
                {lead.signals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {lead.signals.map((signal, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] rounded-full bg-[--accent]/20 text-[--accent]"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                )}

                {/* Tech Stack */}
                {lead.techStack.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Code2 className="h-3.5 w-3.5 text-[--foreground-subtle]" />
                    <div className="flex flex-wrap gap-1">
                      {lead.techStack.map((tech, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs rounded bg-[--background-tertiary] text-[--foreground-muted]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats + Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-[--foreground-muted]">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {lead.totalJobs} open roles
                    </span>
                    {lead.departments.Engineering && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {lead.departments.Engineering} eng
                      </span>
                    )}
                    <span className="text-[--foreground-subtle]">
                      Saved {new Date(lead.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setOutreachLead(lead)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[--accent] text-white text-xs font-medium hover:bg-[--accent]/90 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Generate Outreach
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outreach Modal */}
      <OutreachModal
        open={!!outreachLead}
        onOpenChange={(open) => !open && setOutreachLead(null)}
        lead={outreachLead}
      />
    </div>
  );
}
