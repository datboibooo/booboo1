"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  scope?: "global" | "leads" | "modal";
  requiresModifier?: boolean;
}

interface UseKeyboardShortcutsOptions {
  onSave?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onOpenDetails?: () => void;
  onCloseDetails?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onResearch?: () => void;
  onCopyOpener?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onSearch?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    onSave,
    onSkip,
    onNext,
    onPrevious,
    onOpenDetails,
    onCloseDetails,
    onSelectAll,
    onDeselectAll,
    onResearch,
    onCopyOpener,
    onRefresh,
    onExport,
    onSearch,
    enabled = true,
  } = options;

  const router = useRouter();
  const [showHelp, setShowHelp] = React.useState(false);
  const [gKeyPressed, setGKeyPressed] = React.useState(false);

  const shortcuts: KeyboardShortcut[] = React.useMemo(() => [
    // Navigation
    { key: "j", description: "Next lead", action: () => onNext?.(), scope: "leads" },
    { key: "k", description: "Previous lead", action: () => onPrevious?.(), scope: "leads" },
    { key: "Enter", description: "Open lead details", action: () => onOpenDetails?.(), scope: "leads" },
    { key: "Escape", description: "Close modal/details", action: () => onCloseDetails?.(), scope: "modal" },

    // Actions
    { key: "s", description: "Save lead", action: () => onSave?.(), scope: "leads" },
    { key: "x", description: "Skip lead", action: () => onSkip?.(), scope: "leads" },
    { key: "r", description: "Research company", action: () => onResearch?.(), scope: "leads" },
    { key: "c", description: "Copy opener", action: () => onCopyOpener?.(), scope: "leads" },

    // Quick actions
    { key: "r", description: "Refresh leads", action: () => onRefresh?.(), scope: "global", requiresModifier: true },
    { key: "e", description: "Export leads", action: () => onExport?.(), scope: "global", requiresModifier: true },
    { key: "/", description: "Focus search", action: () => onSearch?.(), scope: "global" },

    // Selection
    { key: "a", description: "Select all", action: () => onSelectAll?.(), scope: "leads", requiresModifier: true },
    { key: "d", description: "Deselect all", action: () => onDeselectAll?.(), scope: "leads", requiresModifier: true },

    // Global navigation (g + key)
    { key: "g+d", description: "Go to Drip Feed", action: () => router.push("/drip"), scope: "global" },
    { key: "g+a", description: "Go to Analytics", action: () => router.push("/analytics"), scope: "global" },
    { key: "g+s", description: "Go to Signals", action: () => router.push("/signals"), scope: "global" },
    { key: "g+l", description: "Go to Lists", action: () => router.push("/lists"), scope: "global" },
    { key: "g+t", description: "Go to Settings", action: () => router.push("/settings"), scope: "global" },

    // Help
    { key: "?", description: "Show shortcuts help", action: () => setShowHelp(true), scope: "global" },
  ], [onNext, onPrevious, onOpenDetails, onCloseDetails, onSave, onSkip, onSelectAll, onDeselectAll, onResearch, onCopyOpener, onRefresh, onExport, onSearch, router]);

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Handle 'g' prefix for navigation
      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setGKeyPressed(true);
        // Reset after a short delay
        setTimeout(() => setGKeyPressed(false), 1000);
        return;
      }

      // Handle g + key combinations
      if (gKeyPressed) {
        const gKey = `g+${e.key}`;
        const shortcut = shortcuts.find((s) => s.key === gKey);
        if (shortcut) {
          e.preventDefault();
          shortcut.action();
          setGKeyPressed(false);
          return;
        }
        setGKeyPressed(false);
      }

      // Handle Cmd/Ctrl + key combinations
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        const shortcut = shortcuts.find(
          (s) => s.key.toLowerCase() === e.key.toLowerCase() && s.requiresModifier
        );
        if (shortcut) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }

      // Handle simple key presses
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const shortcut = shortcuts.find(
          (s) => s.key === e.key && !s.requiresModifier && !s.key.includes("+")
        );
        if (shortcut) {
          // Don't prevent default for Escape, let it bubble
          if (e.key !== "Escape") {
            e.preventDefault();
          }
          shortcut.action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, shortcuts, gKeyPressed]);

  return {
    shortcuts,
    showHelp,
    setShowHelp,
  };
}

// Grouped shortcuts for the help modal
export const SHORTCUT_GROUPS = {
  navigation: {
    label: "Navigation",
    shortcuts: [
      { key: "j", description: "Next lead" },
      { key: "k", description: "Previous lead" },
      { key: "Enter", description: "Open lead details" },
      { key: "Escape", description: "Close modal/details" },
      { key: "/", description: "Focus search" },
    ],
  },
  actions: {
    label: "Lead Actions",
    shortcuts: [
      { key: "s", description: "Save current lead" },
      { key: "x", description: "Skip current lead" },
      { key: "r", description: "Research company" },
      { key: "c", description: "Copy opener" },
    ],
  },
  quickActions: {
    label: "Quick Actions",
    shortcuts: [
      { key: "Cmd+r", description: "Refresh leads" },
      { key: "Cmd+e", description: "Export leads" },
      { key: "Cmd+a", description: "Select all leads" },
      { key: "Cmd+d", description: "Deselect all" },
    ],
  },
  goTo: {
    label: "Go To (press g, then...)",
    shortcuts: [
      { key: "d", description: "Drip Feed" },
      { key: "a", description: "Analytics" },
      { key: "s", description: "Signals Studio" },
      { key: "l", description: "Lists" },
      { key: "t", description: "Settings" },
    ],
  },
  help: {
    label: "Help",
    shortcuts: [
      { key: "?", description: "Show this help" },
    ],
  },
};
