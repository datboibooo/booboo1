"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  Settings,
  BarChart3,
  Sparkles,
  LogOut,
  User,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/supabase/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";

interface SidebarProps {
  className?: string;
}

const navItems = [
  { title: "Leads", href: "/drip", icon: Zap },
  { title: "Saved", href: "/saved", icon: Bookmark },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "?";

  return (
    <aside className={cn("flex h-full w-16 flex-col items-center py-4 border-r border-[--border]", className)}>
      {/* Logo */}
      <Link
        href="/drip"
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[--accent] to-purple-600 text-white mb-6"
      >
        <Sparkles className="h-5 w-5" />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                isActive
                  ? "bg-[--background-secondary] text-[--foreground]"
                  : "text-[--foreground-muted] hover:text-[--foreground] hover:bg-[--background-secondary]"
              )}
              title={item.title}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="mt-auto">
        {isLoading ? (
          <div className="h-10 w-10 rounded-xl bg-[--background-secondary] animate-pulse" />
        ) : user ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => signOut()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[--foreground-muted] hover:text-[--foreground] hover:bg-[--background-secondary] transition-all"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
            <div
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-[--accent] to-purple-600 flex items-center justify-center text-white text-sm font-medium"
              title={user.email || "User"}
            >
              {initials}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[--background-secondary] text-[--foreground-muted] hover:text-[--foreground] hover:bg-[--background-tertiary] transition-all"
            title="Sign in"
          >
            <User className="h-5 w-5" />
          </button>
        )}
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </aside>
  );
}
