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
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

const navItems = [
  { title: "Drip Feed", href: "/drip", icon: Zap },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Signals", href: "/signals", icon: Radio },
  { title: "Lists", href: "/lists", icon: List },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [mode, setMode] = React.useState<"hunt" | "watch">("hunt");

  return (
    <aside className={cn("sidebar flex h-full w-52 flex-col", className)}>
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-[--border]">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-[--foreground] text-[--background]">
          <Zap className="h-4 w-4" />
        </div>
        <span className="font-semibold">LeadDrip</span>
      </div>

      {/* Mode Toggle */}
      <div className="p-3 border-b border-[--border]">
        <div className="flex rounded bg-[--background-secondary] p-0.5">
          <button
            onClick={() => setMode("hunt")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded transition-colors",
              mode === "hunt"
                ? "bg-[--background] text-[--foreground] shadow-sm"
                : "text-[--foreground-muted] hover:text-[--foreground]"
            )}
          >
            <Target className="h-3.5 w-3.5" />
            Hunt
          </button>
          <button
            onClick={() => setMode("watch")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded transition-colors",
              mode === "watch"
                ? "bg-[--background] text-[--foreground] shadow-sm"
                : "text-[--foreground-muted] hover:text-[--foreground]"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Watch
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded px-2.5 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-[--background-secondary] text-[--foreground] font-medium"
                      : "text-[--foreground-muted] hover:text-[--foreground] hover:bg-[--background-secondary]"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-[--border]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[--background-secondary] text-xs font-medium text-[--foreground-muted]">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Demo User</p>
            <p className="text-xs text-[--foreground-subtle]">Demo Mode</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
