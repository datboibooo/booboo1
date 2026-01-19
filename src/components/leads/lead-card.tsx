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

  return (
    <div
      className={cn(
        "card p-4 transition-all",
        isSelected && "border-[--accent] bg-[--accent-subtle]",
        isFocused && !isSelected && "border-[--foreground-subtle]"
      )}
    >
      {/* Header: Company & Score */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{lead.companyName}</h3>
            <a
              href={`https://${lead.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--foreground-subtle] hover:text-[--foreground] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-xs text-[--foreground-muted] mt-0.5">{lead.domain}</p>
        </div>

        <div className={cn("score-pill", scoreClass)}>{lead.score}</div>
      </div>

      {/* Meta: Industry & Location */}
      {(lead.industry || lead.geo) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[--foreground-muted]">
          {lead.industry && <span>{lead.industry}</span>}
          {lead.industry && lead.geo && <span>·</span>}
          {lead.geo && <span>{lead.geo}</span>}
        </div>
      )}

      {/* Signals */}
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
          <Badge variant="secondary">+{lead.triggeredSignals.length - 3}</Badge>
        )}
      </div>

      {/* Why Now */}
      <div className="callout mt-3">
        <p className="text-sm leading-relaxed">{lead.whyNow}</p>
      </div>

      {/* Footer: Sources & Actions */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-[--border]">
        <div className="flex items-center gap-2 text-xs text-[--foreground-muted]">
          <span>{lead.evidenceUrls.length} sources</span>
          <span>·</span>
          <span className="truncate max-w-[120px]">
            {lead.targetTitles.slice(0, 2).join(", ")}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange?.("saved")}
            className={cn(
              "h-7 text-xs gap-1",
              lead.status === "saved" && "border-[--success] text-[--success] bg-[--success]/5"
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", lead.status === "saved" && "fill-current")} />
            {lead.status === "saved" ? "Saved" : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange?.("skip")}
            className="h-7 text-xs gap-1"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyOpener}
            className="h-7 text-xs gap-1"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[--success]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSelect}
          className="h-7 text-xs gap-0.5 text-[--accent]"
        >
          View
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Status Indicator */}
      {lead.status !== "new" && (
        <div className="absolute right-2 top-2">
          <div
            className={cn(
              "status-dot",
              lead.status === "saved" && "status-dot-active",
              lead.status === "skip" && "status-dot-inactive"
            )}
          />
        </div>
      )}
    </div>
  );
}
