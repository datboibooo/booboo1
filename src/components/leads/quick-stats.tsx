"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Target,
  Bookmark,
  SkipForward,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: number | string;
  change?: number;
  icon: React.ElementType;
  color?: string;
}

interface QuickStatsProps {
  stats: {
    total: number;
    new: number;
    saved: number;
    contacted: number;
    skipped: number;
    avgScore: number;
    highPriority: number;
  };
  className?: string;
}

export function QuickStats({ stats, className }: QuickStatsProps) {
  const items: StatItem[] = [
    {
      label: "Total Leads",
      value: stats.total,
      icon: Users,
      color: "text-[--foreground]",
    },
    {
      label: "New Today",
      value: stats.new,
      icon: Zap,
      color: "text-[--accent]",
    },
    {
      label: "Saved",
      value: stats.saved,
      icon: Bookmark,
      color: "text-[--score-excellent]",
    },
    {
      label: "Contacted",
      value: stats.contacted,
      icon: Mail,
      color: "text-blue-400",
    },
    {
      label: "Avg Score",
      value: stats.avgScore,
      icon: Target,
      color: stats.avgScore >= 70 ? "text-[--score-excellent]" : stats.avgScore >= 50 ? "text-[--score-good]" : "text-[--score-fair]",
    },
    {
      label: "High Priority",
      value: stats.highPriority,
      icon: TrendingUp,
      color: "text-[--priority-high]",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-lg border border-[--border] bg-[--background-secondary] p-3"
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg bg-[--background-tertiary]",
              item.color
            )}
          >
            <item.icon className="h-4 w-4" />
          </div>
          <div>
            <p className={cn("text-lg font-semibold", item.color)}>
              {item.value}
            </p>
            <p className="text-xs text-[--foreground-muted]">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
