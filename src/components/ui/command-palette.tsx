"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Search,
  BarChart3,
  Radio,
  List,
  Settings,
  Download,
  RefreshCw,
  CheckCircle,
  X,
  Plus,
  Target,
  Eye,
  Keyboard,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  shortcut?: string[];
  action: () => void;
  category: "navigation" | "actions" | "leads" | "research";
}

interface CommandPaletteProps {
  onRefresh?: () => void;
  onExport?: () => void;
  onRunResearch?: () => void;
}

export function CommandPalette({
  onRefresh,
  onExport,
  onRunResearch,
}: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: CommandItem[] = React.useMemo(
    () => [
      // Navigation
      {
        id: "nav-drip",
        label: "Go to Drip Feed",
        description: "View today's leads",
        icon: Zap,
        shortcut: ["G", "D"],
        action: () => router.push("/drip"),
        category: "navigation",
      },
      {
        id: "nav-analytics",
        label: "Go to Analytics",
        description: "View performance insights",
        icon: BarChart3,
        shortcut: ["G", "A"],
        action: () => router.push("/analytics"),
        category: "navigation",
      },
      {
        id: "nav-signals",
        label: "Go to Signals",
        description: "Configure signal detection",
        icon: Radio,
        shortcut: ["G", "S"],
        action: () => router.push("/signals"),
        category: "navigation",
      },
      {
        id: "nav-lists",
        label: "Go to Lists",
        description: "Manage watch lists",
        icon: List,
        shortcut: ["G", "L"],
        action: () => router.push("/lists"),
        category: "navigation",
      },
      {
        id: "nav-settings",
        label: "Go to Settings",
        description: "Configure LeadDrip",
        icon: Settings,
        shortcut: ["G", ","],
        action: () => router.push("/settings"),
        category: "navigation",
      },

      // Actions
      {
        id: "action-refresh",
        label: "Refresh Leads",
        description: "Generate new leads from RSS",
        icon: RefreshCw,
        shortcut: ["R"],
        action: () => {
          onRefresh?.();
          setOpen(false);
        },
        category: "actions",
      },
      {
        id: "action-export",
        label: "Export to CSV",
        description: "Download leads as CSV file",
        icon: Download,
        shortcut: ["E"],
        action: () => {
          onExport?.();
          setOpen(false);
        },
        category: "actions",
      },
      {
        id: "action-research",
        label: "Run Research Agent",
        description: "Discover new leads with AI agents",
        icon: Sparkles,
        shortcut: ["Shift", "R"],
        action: () => {
          onRunResearch?.();
          setOpen(false);
        },
        category: "research",
      },

      // Research
      {
        id: "research-funding",
        label: "Find Funding Signals",
        description: "Search for recent funding rounds",
        icon: Target,
        action: () => {
          router.push("/drip?signal=funding");
          setOpen(false);
        },
        category: "research",
      },
      {
        id: "research-hiring",
        label: "Find Hiring Signals",
        description: "Search for companies hiring",
        icon: Plus,
        action: () => {
          router.push("/drip?signal=hiring");
          setOpen(false);
        },
        category: "research",
      },
      {
        id: "research-expansion",
        label: "Find Expansion Signals",
        description: "Search for geographic expansion",
        icon: ExternalLink,
        action: () => {
          router.push("/drip?signal=expansion");
          setOpen(false);
        },
        category: "research",
      },
    ],
    [router, onRefresh, onExport, onRunResearch]
  );

  const filteredCommands = React.useMemo(() => {
    if (!search) return commands;
    const lowerSearch = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerSearch) ||
        cmd.description?.toLowerCase().includes(lowerSearch)
    );
  }, [commands, search]);

  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      actions: [],
      research: [],
      leads: [],
    };
    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Keyboard event handling
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open command palette with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setSearch("");
        setSelectedIndex(0);
      }

      // Close with Escape
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Handle navigation within palette
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          setOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredCommands, selectedIndex]);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  // Reset selected index when search changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!open) return null;

  let flatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-[--border] bg-[--background] shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-[--border] px-4 py-3">
          <Search className="h-5 w-5 text-[--foreground-subtle]" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[--foreground-subtle]"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[--border] bg-[--background-secondary] px-1.5 text-[10px] font-medium text-[--foreground-subtle]">
            ESC
          </kbd>
        </div>

        {/* Commands */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-[--foreground-muted]">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={category} className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-[--foreground-subtle]">
                    {category}
                  </div>
                  {items.map((cmd) => {
                    const index = flatIndex++;
                    const isSelected = selectedIndex === index;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors",
                          isSelected
                            ? "bg-[--accent] text-white"
                            : "hover:bg-[--background-secondary]"
                        )}
                      >
                        <cmd.icon
                          className={cn(
                            "h-4 w-4",
                            isSelected
                              ? "text-white"
                              : "text-[--foreground-muted]"
                          )}
                        />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div
                              className={cn(
                                "text-xs",
                                isSelected
                                  ? "text-white/70"
                                  : "text-[--foreground-subtle]"
                              )}
                            >
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <div className="flex gap-1">
                            {cmd.shortcut.map((key, i) => (
                              <kbd
                                key={i}
                                className={cn(
                                  "inline-flex h-5 min-w-[20px] items-center justify-center rounded border px-1 text-[10px] font-medium",
                                  isSelected
                                    ? "border-white/30 bg-white/10 text-white"
                                    : "border-[--border] bg-[--background-secondary] text-[--foreground-subtle]"
                                )}
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[--border] px-4 py-2 text-xs text-[--foreground-subtle]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[--border] bg-[--background-secondary] px-1">
                ↑↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[--border] bg-[--background-secondary] px-1">
                ↵
              </kbd>
              select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Keyboard className="h-3 w-3" />
            <kbd className="rounded border border-[--border] bg-[--background-secondary] px-1">
              ⌘K
            </kbd>
          </span>
        </div>
      </div>
    </>
  );
}
