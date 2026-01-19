"use client";

import * as React from "react";
import {
  ExternalLink,
  Copy,
  Check,
  Linkedin,
  Eye,
  EyeOff,
  MessageSquare,
  FileText,
  Link2,
  Clock,
} from "lucide-react";
import { LeadRecord } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getSourceTypeLabel, formatRelativeTime } from "@/lib/utils";

interface CompanyBriefProps {
  lead: LeadRecord;
  onClose?: () => void;
  onWatchToggle?: () => void;
  isWatched?: boolean;
}

export function CompanyBrief({
  lead,
  onClose,
  onWatchToggle,
  isWatched = false,
}: CompanyBriefProps) {
  const [copiedOpener, setCopiedOpener] = React.useState<string | null>(null);
  const [copiedQuery, setCopiedQuery] = React.useState(false);

  const handleCopyOpener = async (type: "short" | "medium") => {
    const text = type === "short" ? lead.openerShort : lead.openerMedium;
    await navigator.clipboard.writeText(text);
    setCopiedOpener(type);
    setTimeout(() => setCopiedOpener(null), 2000);
  };

  const handleCopyLinkedInQuery = async () => {
    await navigator.clipboard.writeText(lead.linkedinSearchQuery);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const scoreClass =
    lead.score >= 80
      ? "score-excellent"
      : lead.score >= 60
      ? "score-good"
      : lead.score >= 40
      ? "score-fair"
      : "score-low";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[--border] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{lead.companyName}</h2>
              <a
                href={`https://${lead.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--foreground-subtle] hover:text-[--accent]"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <p className="text-sm text-[--foreground-muted]">{lead.domain}</p>
            {(lead.industry || lead.geo) && (
              <p className="mt-1 text-xs text-[--foreground-subtle]">
                {[lead.industry, lead.geo].filter(Boolean).join(" • ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("score-pill text-lg", scoreClass)}>
              {lead.score}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onWatchToggle}
              className={cn(isWatched && "border-[--accent] text-[--accent]")}
            >
              {isWatched ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {isWatched ? "Watching" : "Watch"}
            </Button>
          </div>
        </div>

        {/* Signals */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {lead.triggeredSignals.map((signal, idx) => (
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
        </div>

        {/* Why Now */}
        <div className="why-now-callout mt-4">
          <p className="text-sm font-medium">{lead.whyNow}</p>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="narrative" className="flex-1 overflow-hidden">
        <div className="border-b border-[--border] px-6">
          <TabsList className="h-12 w-full justify-start gap-4 bg-transparent p-0">
            <TabsTrigger
              value="narrative"
              className="border-b-2 border-transparent data-[state=active]:border-[--accent] data-[state=active]:bg-transparent rounded-none"
            >
              <FileText className="mr-2 h-4 w-4" />
              Narrative
            </TabsTrigger>
            <TabsTrigger
              value="evidence"
              className="border-b-2 border-transparent data-[state=active]:border-[--accent] data-[state=active]:bg-transparent rounded-none"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Evidence
            </TabsTrigger>
            <TabsTrigger
              value="outreach"
              className="border-b-2 border-transparent data-[state=active]:border-[--accent] data-[state=active]:bg-transparent rounded-none"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Outreach
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="narrative" className="m-0 p-6">
            {/* The Narrative */}
            <section>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-[--foreground-subtle]">
                The Narrative
              </h3>
              <ul className="space-y-2">
                {lead.narrative.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2 text-sm text-[--foreground-muted]"
                  >
                    <span className="text-[--accent]">•</span>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: point.replace(
                          /\[([^\]]+)\]\(([^)]+)\)/g,
                          '<a href="$2" target="_blank" rel="noopener" class="text-[--accent] hover:underline">$1</a>'
                        ),
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>

            {/* Outreach Angles */}
            {lead.angles.length > 0 && (
              <section className="mt-6">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-[--foreground-subtle]">
                  Outreach Angles
                </h3>
                <div className="space-y-3">
                  {lead.angles.map((angle, idx) => (
                    <div
                      key={idx}
                      className="proof-card transition-colors hover:border-[--accent]"
                    >
                      <h4 className="font-medium text-[--foreground]">
                        {angle.title}
                      </h4>
                      <p className="mt-1 text-sm text-[--foreground-muted]">
                        {angle.description}
                      </p>
                      <a
                        href={angle.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[--accent] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Evidence
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          <TabsContent value="evidence" className="m-0 p-6">
            {/* Evidence Timeline */}
            <section>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-[--foreground-subtle]">
                Evidence Sources ({lead.evidenceUrls.length})
              </h3>
              <div className="space-y-3">
                {lead.evidenceUrls.map((url, idx) => (
                  <div key={idx} className="proof-card">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-sm text-[--accent] hover:underline truncate"
                      >
                        {url}
                      </a>
                      <span className="source-tag">
                        {getSourceTypeLabel("other")}
                      </span>
                    </div>
                    {lead.evidenceSnippets[idx] && (
                      <p className="mt-2 text-sm text-[--foreground-muted] font-mono text-xs leading-relaxed">
                        "{lead.evidenceSnippets[idx].slice(0, 200)}..."
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="outreach" className="m-0 p-6">
            {/* Target Contacts */}
            <section>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-[--foreground-subtle]">
                Who to Target
              </h3>
              <div className="flex flex-wrap gap-2">
                {lead.targetTitles.map((title, idx) => (
                  <Badge key={idx} variant="outline">
                    {title}
                  </Badge>
                ))}
              </div>
              {lead.personName && (
                <div className="mt-3 rounded-lg border border-[--score-excellent] bg-[--score-excellent]/10 p-3">
                  <p className="text-sm">
                    <span className="text-[--score-excellent] font-medium">
                      Found in evidence:
                    </span>{" "}
                    {lead.personName}
                  </p>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.open(lead.linkedinSearchUrl, "_blank")}
                  className="gap-2"
                >
                  <Linkedin className="h-4 w-4" />
                  Search on LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLinkedInQuery}
                  className="gap-2"
                >
                  {copiedQuery ? (
                    <Check className="h-4 w-4 text-[--score-excellent]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedQuery ? "Copied!" : "Copy Query"}
                </Button>
              </div>
            </section>

            {/* Opener Messages */}
            <section className="mt-6">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-[--foreground-subtle]">
                Starter Messages
              </h3>
              <div className="space-y-4">
                {/* Short Opener */}
                <div className="proof-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[--foreground-subtle]">
                      SHORT (2-3 sentences)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyOpener("short")}
                      className="h-7 gap-1"
                    >
                      {copiedOpener === "short" ? (
                        <Check className="h-3 w-3 text-[--score-excellent]" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copiedOpener === "short" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-sm text-[--foreground-muted]">
                    {lead.openerShort}
                  </p>
                </div>

                {/* Medium Opener */}
                <div className="proof-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[--foreground-subtle]">
                      MEDIUM (4-5 sentences)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyOpener("medium")}
                      className="h-7 gap-1"
                    >
                      {copiedOpener === "medium" ? (
                        <Check className="h-3 w-3 text-[--score-excellent]" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copiedOpener === "medium" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-sm text-[--foreground-muted]">
                    {lead.openerMedium}
                  </p>
                </div>
              </div>
            </section>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
