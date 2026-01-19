"use client";

import * as React from "react";
import {
  TrendingUp,
  Users,
  Rocket,
  UserCheck,
  Handshake,
  Globe,
  DollarSign,
  Building2,
  Newspaper,
  ExternalLink,
  Calendar,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SignalEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  source?: string;
  sourceUrl?: string;
  verified?: boolean;
  confidence?: number;
}

interface SignalTimelineProps {
  signals: SignalEvent[];
  className?: string;
}

const signalIcons: Record<string, React.ElementType> = {
  funding: TrendingUp,
  hiring: Users,
  product_launch: Rocket,
  leadership_change: UserCheck,
  partnership: Handshake,
  expansion: Globe,
  acquisition: DollarSign,
  ipo: Building2,
  news: Newspaper,
};

const signalColors: Record<string, string> = {
  funding: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  hiring: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  product_launch: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  leadership_change: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  partnership: "text-pink-400 bg-pink-400/10 border-pink-400/30",
  expansion: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  acquisition: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  ipo: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30",
  news: "text-gray-400 bg-gray-400/10 border-gray-400/30",
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function SignalTimeline({ signals, className }: SignalTimelineProps) {
  // Sort by date descending
  const sortedSignals = [...signals].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (signals.length === 0) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <Newspaper className="h-8 w-8 mx-auto text-[--foreground-subtle] mb-3" />
        <p className="text-sm text-[--foreground-muted]">
          No signal history available
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-[--border]" />

      <div className="space-y-4">
        {sortedSignals.map((signal, index) => {
          const Icon = signalIcons[signal.type] || Newspaper;
          const colorClass = signalColors[signal.type] || signalColors.news;

          return (
            <div key={signal.id} className="relative pl-10">
              {/* Timeline dot */}
              <div
                className={cn(
                  "absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2",
                  colorClass
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="rounded-lg border border-[--border] bg-[--background-secondary] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{signal.title}</h4>
                      {signal.verified && (
                        <CheckCircle className="h-3.5 w-3.5 text-[--score-excellent]" />
                      )}
                    </div>
                    <p className="text-sm text-[--foreground-muted] mb-2">
                      {signal.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[--foreground-subtle]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeDate(signal.date)}
                      </span>
                      {signal.source && (
                        <span className="flex items-center gap-1">
                          <Newspaper className="h-3 w-3" />
                          {signal.source}
                        </span>
                      )}
                      {signal.confidence !== undefined && (
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            signal.confidence >= 0.8
                              ? "text-[--score-excellent]"
                              : signal.confidence >= 0.6
                              ? "text-[--score-good]"
                              : "text-[--score-fair]"
                          )}
                        >
                          {Math.round(signal.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs capitalize", colorClass)}
                    >
                      {signal.type.replace("_", " ")}
                    </Badge>
                    {signal.sourceUrl && (
                      <a
                        href={signal.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[--accent] hover:underline flex items-center gap-1"
                      >
                        View source
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Demo signals for when no real data is available
export function generateDemoSignals(companyName: string): SignalEvent[] {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  return [
    {
      id: "sig_1",
      type: "funding",
      title: `${companyName} Raises Series B Funding`,
      description:
        "Company secured $25M in Series B funding led by Accel Partners, bringing total funding to $40M.",
      date: new Date(now.getTime() - 2 * dayMs).toISOString(),
      source: "TechCrunch",
      sourceUrl: "https://techcrunch.com",
      verified: true,
      confidence: 0.95,
    },
    {
      id: "sig_2",
      type: "hiring",
      title: "Aggressive Engineering Hiring",
      description:
        "Currently hiring for 15+ engineering positions, indicating major product expansion.",
      date: new Date(now.getTime() - 5 * dayMs).toISOString(),
      source: "LinkedIn",
      sourceUrl: "https://linkedin.com",
      verified: true,
      confidence: 0.88,
    },
    {
      id: "sig_3",
      type: "leadership_change",
      title: "New VP of Sales Appointed",
      description:
        "Former Salesforce executive joins as VP of Sales to lead go-to-market expansion.",
      date: new Date(now.getTime() - 12 * dayMs).toISOString(),
      source: "Company Blog",
      verified: true,
      confidence: 0.92,
    },
    {
      id: "sig_4",
      type: "product_launch",
      title: "Enterprise Product Launch",
      description:
        "Launched new enterprise tier with advanced security and compliance features.",
      date: new Date(now.getTime() - 20 * dayMs).toISOString(),
      source: "Press Release",
      verified: true,
      confidence: 0.97,
    },
    {
      id: "sig_5",
      type: "expansion",
      title: "European Market Entry",
      description:
        "Opened first European office in London, targeting UK and EU expansion.",
      date: new Date(now.getTime() - 35 * dayMs).toISOString(),
      source: "Business Wire",
      sourceUrl: "https://businesswire.com",
      verified: false,
      confidence: 0.75,
    },
  ];
}
