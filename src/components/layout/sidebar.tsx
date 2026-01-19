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
  BarChart3,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Insights & metrics",
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
        "glass-sidebar flex h-full w-64 flex-col relative overflow-hidden",
        className
      )}
    >
      {/* Decorative gradient orbs */}
      <div className="orb orb-purple absolute -top-20 -left-20 h-40 w-40" />
      <div className="orb orb-blue absolute top-1/2 -right-16 h-32 w-32" />

      {/* Logo */}
      <div className="relative flex h-16 items-center gap-3 border-b border-[--border] px-6">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[--accent] to-[--accent-secondary] shadow-lg shadow-[--accent]/20">
          <Zap className="h-5 w-5 text-white" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-gradient">LeadDrip</span>
          <div className="flex items-center gap-1 text-[10px] text-[--accent]">
            <Sparkles className="h-3 w-3" />
            <span>AI-Powered</span>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="relative border-b border-[--border] p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[--foreground-subtle]">
          Mode
        </p>
        <div className="space-y-1.5">
          {modeItems.map((item) => (
            <button
              key={item.title}
              className={cn(
                "glass-card flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300",
                item.active
                  ? "border-[--accent]/30 bg-gradient-to-r from-[--accent]/10 to-[--accent-secondary]/5"
                  : "border-transparent bg-transparent hover:bg-[--background-tertiary]"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                  item.active
                    ? "bg-gradient-to-br from-[--accent] to-[--accent-secondary] text-white shadow-lg shadow-[--accent]/20"
                    : "bg-[--background-tertiary] text-[--foreground-muted]"
                )}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left">
                <p
                  className={cn(
                    "font-medium",
                    item.active ? "text-[--foreground]" : "text-[--foreground-muted]"
                  )}
                >
                  {item.title}
                </p>
                <p className="text-[10px] text-[--foreground-subtle]">{item.description}</p>
              </div>
              {item.active && (
                <div className="relative h-2.5 w-2.5">
                  <div className="absolute inset-0 rounded-full bg-[--accent] animate-pulse-glow" />
                  <div className="absolute inset-0 rounded-full bg-[--accent]" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[--foreground-subtle]">
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
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                    isActive
                      ? "text-[--foreground]"
                      : "text-[--foreground-muted] hover:text-[--foreground]"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[--accent]/15 to-transparent border border-[--accent]/20" />
                  )}
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                      isActive
                        ? "bg-gradient-to-br from-[--accent]/20 to-[--accent-secondary]/10 text-[--accent]"
                        : "text-[--foreground-muted] group-hover:text-[--accent]"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="relative z-10">{item.title}</span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-gradient-to-b from-[--accent] to-[--accent-secondary]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Saved Lists */}
      <div className="relative border-t border-[--border] p-4">
        <button className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[--foreground-subtle] hover:text-[--foreground] transition-colors">
          <span>Saved Lists</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        <ul className="mt-3 space-y-1">
          <li>
            <Link
              href="/lists?id=1"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[--foreground-muted] hover:bg-[--background-tertiary] hover:text-[--foreground] transition-all"
            >
              <div className="h-2 w-2 rounded-full bg-[--score-excellent] shadow-sm shadow-[--score-excellent]/50" />
              <span>Enterprise Tech</span>
              <span className="ml-auto text-[10px] text-[--foreground-subtle] bg-[--background-tertiary] px-1.5 py-0.5 rounded">24</span>
            </Link>
          </li>
          <li>
            <Link
              href="/lists?id=2"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[--foreground-muted] hover:bg-[--background-tertiary] hover:text-[--foreground] transition-all"
            >
              <div className="h-2 w-2 rounded-full bg-[--score-good] shadow-sm shadow-[--score-good]/50" />
              <span>Healthcare IT</span>
              <span className="ml-auto text-[10px] text-[--foreground-subtle] bg-[--background-tertiary] px-1.5 py-0.5 rounded">18</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* User */}
      <div className="relative border-t border-[--border] p-4">
        <div className="glass-card flex items-center gap-3 rounded-xl p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[--accent]/20 to-[--accent-secondary]/10 text-sm font-semibold text-[--accent] border border-[--accent]/20">
            U
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Demo User</p>
            <p className="text-[10px] text-[--foreground-subtle] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[--score-excellent] animate-pulse" />
              Demo Mode
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
