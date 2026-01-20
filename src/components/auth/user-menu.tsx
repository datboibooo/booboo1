"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { User, LogOut, Settings, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { AuthModal } from "./auth-modal";

export function UserMenu() {
  const { user, isLoading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-8 w-8 rounded-full bg-[--background-secondary] animate-pulse" />
    );
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl",
            "bg-[--accent] text-white text-sm font-medium",
            "hover:bg-[--accent]/90 transition-colors"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Sign In
        </button>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    );
  }

  // Get user initials
  const initials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : "U";

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-[--accent] to-purple-600",
          "text-white text-sm font-medium",
          "hover:opacity-90 transition-opacity",
          "ring-2 ring-transparent hover:ring-[--accent]/30"
        )}
      >
        {initials}
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-64 py-2 bg-[--background-secondary] border border-[--border] rounded-xl shadow-xl z-50">
          <div className="px-4 py-2 border-b border-[--border]">
            <p className="text-sm font-medium truncate">{user.email}</p>
            <p className="text-xs text-[--foreground-muted]">Free plan</p>
          </div>

          <div className="p-2">
            <a
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[--background-tertiary] transition-colors"
            >
              <Settings className="h-4 w-4 text-[--foreground-subtle]" />
              <span className="text-sm">Settings</span>
            </a>
            <button
              onClick={() => {
                signOut();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[--background-tertiary] transition-colors text-left"
            >
              <LogOut className="h-4 w-4 text-[--foreground-subtle]" />
              <span className="text-sm">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
