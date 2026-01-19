"use client";

import * as React from "react";
import { Search, Bell, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
    <header className="flex h-16 items-center justify-between border-b border-[--border] bg-[--background-secondary] px-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[--foreground-muted]">{subtitle}</p>
          )}
        </div>
        {showRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Generating..." : "Refresh"}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--foreground-subtle]" />
            <Input
              type="search"
              placeholder="Search leads..."
              className="pl-9"
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-[--foreground-muted]">
          <Calendar className="h-4 w-4" />
          <span>{today}</span>
        </div>

        {actions}

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[--accent] text-[10px] font-bold text-[--background]">
            3
          </span>
        </Button>
      </div>
    </header>
  );
}
