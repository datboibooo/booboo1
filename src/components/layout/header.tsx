"use client";

import * as React from "react";
import { Search, Bell, RefreshCw, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  showRefresh?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  actions?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  showSearch = true,
  showRefresh = false,
  onRefresh,
  isRefreshing = false,
  actions,
}: HeaderProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="glass relative flex h-16 items-center justify-between border-b border-[--border] px-6">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[--accent]/5 via-transparent to-[--accent-secondary]/5 pointer-events-none" />

      <div className="relative flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gradient">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[--foreground-muted]">{subtitle}</p>
          )}
        </div>
        {showRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="glass-button gap-2 h-8"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-[--accent]" />
            )}
            {isRefreshing ? "Generating..." : "Generate"}
          </Button>
        )}
      </div>

      <div className="relative flex items-center gap-4">
        {showSearch && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--foreground-subtle]" />
            <Input
              type="search"
              placeholder="Search leads..."
              className="glass-input pl-9 h-9 border-[--border]"
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-[--foreground-muted] bg-[--background-tertiary] px-3 py-1.5 rounded-lg border border-[--border]">
          <Calendar className="h-4 w-4 text-[--accent]" />
          <span>{today}</span>
        </div>

        {actions}

        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-[--accent]/10"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-[--accent] to-[--accent-secondary] text-[10px] font-bold text-white shadow-lg shadow-[--accent]/30">
            3
          </span>
        </Button>
      </div>
    </header>
  );
}
