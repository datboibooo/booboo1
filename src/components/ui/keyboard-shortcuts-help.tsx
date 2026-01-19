"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SHORTCUT_GROUPS } from "@/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function KeyboardKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-[--border] bg-[--background-secondary] px-1.5 py-0.5 font-mono text-xs">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Keyboard Shortcuts</SheetTitle>
          <SheetDescription>
            Use these shortcuts to navigate and take actions quickly
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {Object.entries(SHORTCUT_GROUPS).map(([key, group]) => (
            <div key={key}>
              <h3 className="mb-3 text-sm font-medium text-[--foreground-subtle] uppercase tracking-wider">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-[--foreground-muted]">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.key.includes("+") ? (
                        shortcut.key.split("+").map((k, i) => (
                          <React.Fragment key={k}>
                            {i > 0 && (
                              <span className="text-xs text-[--foreground-subtle]">+</span>
                            )}
                            <KeyboardKey>{k === "Cmd" ? "⌘" : k}</KeyboardKey>
                          </React.Fragment>
                        ))
                      ) : (
                        <KeyboardKey>{shortcut.key}</KeyboardKey>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-[--border] bg-[--background-tertiary] p-4">
          <p className="text-sm text-[--foreground-muted]">
            <strong className="text-[--foreground]">Pro tip:</strong> Press{" "}
            <KeyboardKey>g</KeyboardKey> followed by a letter to quickly jump to different pages.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
