"use client";

import * as React from "react";
import { Search, Bell, RefreshCw } from "lucide-react";
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
  return (
    <header className="header flex h-14 items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-medium">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[--foreground-muted]">{subtitle}</p>
          )}
        </div>
        {showRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Generating..." : "Generate"}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[--foreground-subtle]" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        )}

        {actions}

        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[--danger] text-[10px] font-medium text-white">
            3
          </span>
        </Button>
      </div>
    </header>
  );
}
