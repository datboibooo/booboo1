"use client";

import * as React from "react";
import {
  ExternalLink,
  Bookmark,
  SkipForward,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { LeadRecord } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: LeadRecord;
  isSelected?: boolean;
  isFocused?: boolean;
  onSelect?: () => void;
  onStatusChange?: (status: LeadRecord["status"]) => void;
}

// Calculate evidence quality score (0-100)
function getEvidenceQuality(lead: LeadRecord): { score: number; label: string; color: string } {
  let score = 0;

  // Number of evidence sources (up to 40 points)
  score += Math.min(lead.evidenceUrls.length * 10, 40);

  // Number of signals triggered (up to 30 points)
  score += Math.min(lead.triggeredSignals.length * 10, 30);

  // Has evidence snippets (up to 15 points)
  const snippetCount = lead.evidenceSnippets.filter(s => s && s.length > 50).length;
  score += Math.min(snippetCount * 5, 15);

  // Has person name mentioned (15 points)
  if (lead.personName) score += 15;

  const clampedScore = Math.min(100, score);

  if (clampedScore >= 80) return { score: clampedScore, label: "Strong", color: "text-[--score-excellent]" };
  if (clampedScore >= 60) return { score: clampedScore, label: "Good", color: "text-[--score-good]" };
  if (clampedScore >= 40) return { score: clampedScore, label: "Fair", color: "text-[--score-fair]" };
  return { score: clampedScore, label: "Weak", color: "text-[--score-low]" };
}

export function LeadCard({
  lead,
  isSelected = false,
  isFocused = false,
  onSelect,
  onStatusChange,
}: LeadCardProps) {
  const [copied, setCopied] = React.useState(false);

  const scoreClass =
    lead.score >= 80
      ? "score-excellent"
      : lead.score >= 60
      ? "score-good"
      : lead.score >= 40
      ? "score-fair"
      : "score-low";

  const handleCopyOpener = async () => {
    await navigator.clipboard.writeText(lead.openerShort);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const evidenceQuality = getEvidenceQuality(lead);

  return (
    <div
      className={cn(
        "glass-card group relative p-5 transition-all duration-300",
        isSelected && "border-[--accent]/50 shadow-lg shadow-[--accent]/10 scale-[1.02]",
        isFocused && !isSelected && "border-[--accent]/40 ring-2 ring-[--accent]/15"
      )}
    >
      {/* Gradient highlight on hover */}
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-[--accent]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Top Row: Company Info & Score */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[--foreground] truncate group-hover:text-gradient-subtle transition-colors">
              {lead.companyName}
            </h3>
            <a
              href={`https://${lead.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--foreground-subtle] hover:text-[--accent] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-sm text-[--foreground-muted] mt-0.5">{lead.domain}</p>
          {(lead.industry || lead.geo) && (
            <p className="mt-1.5 text-xs text-[--foreground-subtle] flex items-center gap-1.5">
              {lead.industry && (
                <span className="px-1.5 py-0.5 rounded bg-[--accent]/10 border border-[--accent]/20">
                  {lead.industry}
                </span>
              )}
              {lead.geo && <span>{lead.geo}</span>}
            </p>
          )}
        </div>

        <div className={cn("score-pill relative", scoreClass)}>
          {lead.score}
          {lead.score >= 80 && (
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-[--score-excellent] animate-pulse" />
          )}
        </div>
      </div>

      {/* Triggered Signals */}
      <div className="relative mt-4 flex flex-wrap gap-1.5">
        {lead.triggeredSignals.slice(0, 3).map((signal, idx) => (
          <Badge
            key={idx}
            variant={
              signal.priority === "high"
                ? "high"
                : signal.priority === "medium"
                ? "medium"
                : "low"
            }
          >
            {signal.signalName}
          </Badge>
        ))}
        {lead.triggeredSignals.length > 3 && (
          <Badge variant="secondary">
            +{lead.triggeredSignals.length - 3}
          </Badge>
        )}
      </div>

      {/* Why Now */}
      <div className="why-now-callout relative mt-4">
        <p className="text-sm leading-relaxed">{lead.whyNow}</p>
      </div>

      {/* Evidence Quality */}
      <div className="relative mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[--foreground-muted]">
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-[--accent]" />
            {lead.evidenceUrls.length} sources
          </span>
          <span className="text-[--border]">|</span>
          <span className="truncate max-w-[100px]">{lead.targetTitles.slice(0, 2).join(", ")}</span>
        </div>
        <div className={cn("flex items-center gap-1.5 font-medium", evidenceQuality.color)}>
          <div className="flex gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all",
                  i < Math.ceil(evidenceQuality.score / 25)
                    ? cn(
                        evidenceQuality.color.replace("text-", "bg-"),
                        "shadow-sm",
                        evidenceQuality.color.includes("excellent") && "shadow-[--score-excellent]/50",
                        evidenceQuality.color.includes("good") && "shadow-[--score-good]/50"
                      )
                    : "bg-[--border]/50"
                )}
              />
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-wide">{evidenceQuality.label}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="relative mt-5 flex items-center justify-between border-t border-[--border]/50 pt-4">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange?.("saved")}
            className={cn(
              "glass-button h-8 text-xs gap-1.5",
              lead.status === "saved" && "border-[--score-excellent]/50 text-[--score-excellent] bg-[--score-excellent]/10"
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", lead.status === "saved" && "fill-current")} />
            {lead.status === "saved" ? "Saved" : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange?.("skip")}
            className="h-8 text-xs gap-1.5 hover:bg-[--foreground-subtle]/10"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyOpener}
            className="h-8 text-xs gap-1.5 hover:bg-[--accent]/10"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[--score-excellent]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSelect}
          className="h-8 gap-1 text-xs text-[--accent] hover:bg-[--accent]/10 font-medium"
        >
          View Brief
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Status Indicator */}
      {lead.status !== "new" && (
        <div className="absolute -right-1.5 -top-1.5">
          <div
            className={cn(
              "h-3.5 w-3.5 rounded-full border-2 border-[--background]",
              lead.status === "saved" && "bg-[--score-excellent] shadow-md shadow-[--score-excellent]/50",
              lead.status === "contacted" && "bg-[--status-contacted] shadow-md shadow-[--status-contacted]/50",
              lead.status === "skip" && "bg-[--foreground-subtle]"
            )}
          />
        </div>
      )}
    </div>
  );
}
