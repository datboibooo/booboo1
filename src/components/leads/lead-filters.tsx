"use client";

import * as React from "react";
import {
  Filter,
  X,
  ChevronDown,
  Check,
  TrendingUp,
  Users,
  Rocket,
  Globe,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export interface LeadFilters {
  status: ("new" | "saved" | "contacted" | "skip")[];
  minScore: number;
  signalTypes: string[];
  priority: ("high" | "medium" | "low")[];
}

interface LeadFiltersProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  className?: string;
}

const SIGNAL_TYPES = [
  { id: "funding", label: "Funding", icon: TrendingUp },
  { id: "hiring", label: "Hiring", icon: Users },
  { id: "product_launch", label: "Product Launch", icon: Rocket },
  { id: "expansion", label: "Expansion", icon: Globe },
  { id: "leadership", label: "Leadership", icon: Briefcase },
];

const STATUS_OPTIONS = [
  { id: "new", label: "New" },
  { id: "saved", label: "Saved" },
  { id: "contacted", label: "Contacted" },
  { id: "skip", label: "Skipped" },
] as const;

const PRIORITY_OPTIONS = [
  { id: "high", label: "High", color: "text-[--priority-high]" },
  { id: "medium", label: "Medium", color: "text-[--priority-medium]" },
  { id: "low", label: "Low", color: "text-[--priority-low]" },
] as const;

export function LeadFiltersBar({
  filters,
  onFiltersChange,
  className,
}: LeadFiltersProps) {
  const activeFilterCount =
    (filters.status.length > 0 ? 1 : 0) +
    (filters.minScore > 0 ? 1 : 0) +
    (filters.signalTypes.length > 0 ? 1 : 0) +
    (filters.priority.length > 0 ? 1 : 0);

  const clearFilters = () => {
    onFiltersChange({
      status: [],
      minScore: 0,
      signalTypes: [],
      priority: [],
    });
  };

  const toggleStatus = (status: (typeof STATUS_OPTIONS)[number]["id"]) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const toggleSignalType = (signalType: string) => {
    const newSignalTypes = filters.signalTypes.includes(signalType)
      ? filters.signalTypes.filter((s) => s !== signalType)
      : [...filters.signalTypes, signalType];
    onFiltersChange({ ...filters, signalTypes: newSignalTypes });
  };

  const togglePriority = (priority: (typeof PRIORITY_OPTIONS)[number]["id"]) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];
    onFiltersChange({ ...filters, priority: newPriority });
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5",
              filters.status.length > 0 && "border-[--accent] text-[--accent]"
            )}
          >
            Status
            {filters.status.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {filters.status.length}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Lead Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.id}
              checked={filters.status.includes(option.id)}
              onCheckedChange={() => toggleStatus(option.id)}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Score Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5",
              filters.minScore > 0 && "border-[--accent] text-[--accent]"
            )}
          >
            Score
            {filters.minScore > 0 && (
              <span className="ml-1 text-[10px]">{">="}{filters.minScore}</span>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Minimum Score</span>
              <span className="text-sm font-semibold text-[--accent]">
                {filters.minScore}
              </span>
            </div>
            <Slider
              value={[filters.minScore]}
              onValueChange={([value]) =>
                onFiltersChange({ ...filters, minScore: value })
              }
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[--foreground-muted]">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Signal Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5",
              filters.signalTypes.length > 0 &&
                "border-[--accent] text-[--accent]"
            )}
          >
            Signals
            {filters.signalTypes.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {filters.signalTypes.length}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Signal Types</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SIGNAL_TYPES.map((signal) => (
            <DropdownMenuCheckboxItem
              key={signal.id}
              checked={filters.signalTypes.includes(signal.id)}
              onCheckedChange={() => toggleSignalType(signal.id)}
            >
              <signal.icon className="h-4 w-4 mr-2" />
              {signal.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Priority Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5",
              filters.priority.length > 0 && "border-[--accent] text-[--accent]"
            )}
          >
            Priority
            {filters.priority.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {filters.priority.length}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Priority Level</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PRIORITY_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.id}
              checked={filters.priority.includes(option.id)}
              onCheckedChange={() => togglePriority(option.id)}
              className={option.color}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 gap-1.5 text-[--foreground-muted] hover:text-[--foreground]"
        >
          <X className="h-3 w-3" />
          Clear ({activeFilterCount})
        </Button>
      )}
    </div>
  );
}
