"use client";

import * as React from "react";
import {
  ExternalLink,
  Bookmark,
  SkipForward,
  Copy,
  Check,
  ChevronRight,
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
        "group relative rounded-xl border border-[--border] bg-[--background-secondary] p-4 transition-all hover:border-[--accent]/50",
        isSelected && "border-[--accent] ring-1 ring-[--accent]/20",
        isFocused && !isSelected && "border-[--accent]/70 ring-2 ring-[--accent]/10"
      )}
    >
      {/* Top Row: Company Info & Score */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[--foreground] truncate">
              {lead.companyName}
            </h3>
            <a
              href={`https://${lead.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--foreground-subtle] hover:text-[--accent]"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-sm text-[--foreground-muted]">{lead.domain}</p>
          {(lead.industry || lead.geo) && (
            <p className="mt-1 text-xs text-[--foreground-subtle]">
              {[lead.industry, lead.geo].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>

        <div className={cn("score-pill", scoreClass)}>{lead.score}</div>
      </div>

      {/* Triggered Signals */}
      <div className="mt-3 flex flex-wrap gap-1.5">
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
      <div className="why-now-callout mt-3">
        <p className="text-sm">{lead.whyNow}</p>
      </div>

      {/* Evidence Quality */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[--foreground-muted]">
          <span>{lead.evidenceUrls.length} sources</span>
          <span>•</span>
          <span className="truncate max-w-[120px]">{lead.targetTitles.slice(0, 2).join(", ")}</span>
        </div>
        <div className={cn("flex items-center gap-1 font-medium", evidenceQuality.color)}>
          <div className="flex gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i < Math.ceil(evidenceQuality.score / 25)
                    ? evidenceQuality.color.replace("text-", "bg-")
                    : "bg-[--border]"
                )}
              />
            ))}
          </div>
          <span className="text-[10px]">{evidenceQuality.label}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange?.("saved")}
            className={cn(
              lead.status === "saved" && "border-[--score-excellent] text-[--score-excellent]"
            )}
          >
            <Bookmark className="h-3 w-3" />
            {lead.status === "saved" ? "Saved" : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange?.("skip")}
          >
            <SkipForward className="h-3 w-3" />
            Skip
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopyOpener}>
            {copied ? (
              <Check className="h-3 w-3 text-[--score-excellent]" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied!" : "Copy Opener"}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSelect}
          className="gap-1 text-[--accent]"
        >
          View Brief
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Status Indicator */}
      {lead.status !== "new" && (
        <div className="absolute -right-1 -top-1">
          <div
            className={cn(
              "h-3 w-3 rounded-full",
              lead.status === "saved" && "bg-[--score-excellent]",
              lead.status === "contacted" && "bg-[--status-contacted]",
              lead.status === "skip" && "bg-[--foreground-subtle]"
            )}
          />
        </div>
      )}
    </div>
  );
}
