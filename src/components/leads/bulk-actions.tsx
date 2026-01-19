"use client";

import * as React from "react";
import {
  Bookmark,
  SkipForward,
  Mail,
  Trash2,
  Download,
  ChevronDown,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface BulkActionsProps {
  selectedCount: number;
  onSaveAll: () => void;
  onSkipAll: () => void;
  onContactedAll: () => void;
  onExport: () => void;
  onClearSelection: () => void;
  className?: string;
}

export function BulkActions({
  selectedCount,
  onSaveAll,
  onSkipAll,
  onContactedAll,
  onExport,
  onClearSelection,
  className,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-[--accent]/30 bg-[--accent]/5 px-4 py-2",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[--accent] text-white text-xs font-semibold">
          {selectedCount}
        </div>
        <span className="text-sm font-medium">selected</span>
      </div>

      <div className="h-4 w-px bg-[--border]" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSaveAll}
          className="h-8 gap-1.5 text-xs"
        >
          <Bookmark className="h-3.5 w-3.5" />
          Save All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onContactedAll}
          className="h-8 gap-1.5 text-xs"
        >
          <Mail className="h-3.5 w-3.5" />
          Mark Contacted
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkipAll}
          className="h-8 gap-1.5 text-xs"
        >
          <SkipForward className="h-3.5 w-3.5" />
          Skip All
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
              More
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExport}>
              <Download className="h-4 w-4" />
              Export Selected
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onClearSelection}
              className="text-[--foreground-muted]"
            >
              <X className="h-4 w-4" />
              Clear Selection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
