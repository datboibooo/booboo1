"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  Target,
  Eye,
  Settings,
  List,
  Radio,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

const navItems = [
  {
    title: "Drip Feed",
    href: "/drip",
    icon: Zap,
    description: "Today's recommendations",
  },
  {
    title: "Signals Studio",
    href: "/signals",
    icon: Radio,
    description: "Configure signals",
  },
  {
    title: "Lists",
    href: "/lists",
    icon: List,
    description: "Manage lists",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "App settings",
  },
];

const modeItems = [
  {
    title: "Hunt Mode",
    icon: Target,
    description: "Discover new leads",
    active: true,
  },
  {
    title: "Watch Mode",
    icon: Eye,
    description: "Monitor accounts",
    active: false,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-[--border] bg-[--background-secondary]",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-[--border] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--accent]">
          <Zap className="h-4 w-4 text-[--background]" />
        </div>
        <span className="text-lg font-bold tracking-tight">LeadDrip</span>
      </div>

      {/* Mode Selector */}
      <div className="border-b border-[--border] p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[--foreground-subtle]">
          Mode
        </p>
        <div className="space-y-1">
          {modeItems.map((item) => (
            <button
              key={item.title}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                item.active
                  ? "bg-[--accent-subtle] text-[--accent]"
                  : "text-[--foreground-muted] hover:bg-[--background-tertiary] hover:text-[--foreground]"
              )}
            >
              <item.icon className="h-4 w-4" />
              <div className="flex-1 text-left">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs opacity-70">{item.description}</p>
              </div>
              {item.active && (
                <div className="h-2 w-2 rounded-full bg-[--accent] animate-pulse-glow" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[--foreground-subtle]">
          Navigation
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-[--background-tertiary] text-[--foreground]"
                      : "text-[--foreground-muted] hover:bg-[--background-tertiary] hover:text-[--foreground]"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Saved Lists */}
      <div className="border-t border-[--border] p-4">
        <button className="flex w-full items-center justify-between text-xs font-medium uppercase tracking-wider text-[--foreground-subtle]">
          <span>Saved Lists</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        <ul className="mt-2 space-y-1">
          <li>
            <Link
              href="/lists?id=1"
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[--foreground-muted] hover:bg-[--background-tertiary] hover:text-[--foreground]"
            >
              <div className="h-2 w-2 rounded-full bg-[--score-excellent]" />
              <span>Enterprise Tech</span>
              <span className="ml-auto text-xs">24</span>
            </Link>
          </li>
          <li>
            <Link
              href="/lists?id=2"
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[--foreground-muted] hover:bg-[--background-tertiary] hover:text-[--foreground]"
            >
              <div className="h-2 w-2 rounded-full bg-[--score-good]" />
              <span>Healthcare IT</span>
              <span className="ml-auto text-xs">18</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* User */}
      <div className="border-t border-[--border] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[--background-tertiary] text-sm font-medium">
            U
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Demo User</p>
            <p className="text-xs text-[--foreground-subtle]">Demo Mode</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
