"use client";

import * as React from "react";
import {
  Sparkles,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Rocket,
  UserCheck,
  Handshake,
  Globe,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ResearchAgent {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  signalTypes: string[];
  status: "idle" | "running" | "complete" | "error";
  progress: number;
  foundCount: number;
}

interface ResearchPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadsFound?: (count: number) => void;
}

export function ResearchPanel({
  open,
  onOpenChange,
  onLeadsFound,
}: ResearchPanelProps) {
  const [isRunning, setIsRunning] = React.useState(false);
  const [agents, setAgents] = React.useState<ResearchAgent[]>([
    {
      id: "funding-hunter",
      name: "Funding Hunter",
      description: "Searches for recent funding rounds, acquisitions, and IPO activity",
      icon: TrendingUp,
      signalTypes: ["funding", "acquisition", "ipo"],
      status: "idle",
      progress: 0,
      foundCount: 0,
    },
    {
      id: "growth-detector",
      name: "Growth Detector",
      description: "Finds companies aggressively hiring and expanding teams",
      icon: Users,
      signalTypes: ["hiring", "team_growth"],
      status: "idle",
      progress: 0,
      foundCount: 0,
    },
    {
      id: "product-watcher",
      name: "Product Watcher",
      description: "Monitors for new product launches and feature announcements",
      icon: Rocket,
      signalTypes: ["product_launch", "feature_release"],
      status: "idle",
      progress: 0,
      foundCount: 0,
    },
    {
      id: "leadership-tracker",
      name: "Leadership Tracker",
      description: "Detects executive changes and organizational restructuring",
      icon: UserCheck,
      signalTypes: ["leadership_change", "reorg"],
      status: "idle",
      progress: 0,
      foundCount: 0,
    },
    {
      id: "partnership-monitor",
      name: "Partnership Monitor",
      description: "Finds new partnerships, integrations, and strategic alliances",
      icon: Handshake,
      signalTypes: ["partnership", "integration"],
      status: "idle",
      progress: 0,
      foundCount: 0,
    },
  ]);

  const totalFound = agents.reduce((sum, a) => sum + a.foundCount, 0);
  const completedAgents = agents.filter(
    (a) => a.status === "complete" || a.status === "error"
  ).length;

  const simulateResearch = async () => {
    setIsRunning(true);

    // Reset all agents
    setAgents((prev) =>
      prev.map((a) => ({ ...a, status: "idle", progress: 0, foundCount: 0 }))
    );

    // Simulate each agent running
    for (let i = 0; i < agents.length; i++) {
      const agentId = agents[i].id;

      // Set agent to running
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, status: "running" } : a))
      );

      // Simulate progress
      for (let p = 0; p <= 100; p += 20) {
        await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
        setAgents((prev) =>
          prev.map((a) => (a.id === agentId ? { ...a, progress: p } : a))
        );
      }

      // Complete with random found count
      const found = Math.floor(Math.random() * 8) + 2;
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? { ...a, status: "complete", progress: 100, foundCount: found }
            : a
        )
      );
    }

    setIsRunning(false);

    // Notify parent of total found
    const total = agents.reduce((sum, a) => sum + a.foundCount, 0);
    onLeadsFound?.(total);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => !isRunning && onOpenChange(false)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-[--border] bg-[--background] shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[--border] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[--accent] to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">Research Agents</h2>
                <p className="text-sm text-[--foreground-muted]">
                  AI-powered signal discovery
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isRunning}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 border-b border-[--border] px-6 py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[--accent]">
                {totalFound}
              </div>
              <div className="text-xs text-[--foreground-muted]">
                Signals Found
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{completedAgents}</div>
              <div className="text-xs text-[--foreground-muted]">
                Agents Complete
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[--score-excellent]">
                {agents.length}
              </div>
              <div className="text-xs text-[--foreground-muted]">
                Total Agents
              </div>
            </div>
          </div>

          {/* Agents List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={cn(
                    "rounded-lg border p-4 transition-all",
                    agent.status === "running"
                      ? "border-[--accent] bg-[--accent]/5"
                      : agent.status === "complete"
                      ? "border-[--score-excellent]/30 bg-[--score-excellent]/5"
                      : agent.status === "error"
                      ? "border-[--priority-high]/30 bg-[--priority-high]/5"
                      : "border-[--border] bg-[--background-secondary]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        agent.status === "running"
                          ? "bg-[--accent]/20 text-[--accent]"
                          : agent.status === "complete"
                          ? "bg-[--score-excellent]/20 text-[--score-excellent]"
                          : "bg-[--background-tertiary] text-[--foreground-muted]"
                      )}
                    >
                      {agent.status === "running" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : agent.status === "complete" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : agent.status === "error" ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <agent.icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{agent.name}</h3>
                        {agent.status === "complete" && (
                          <Badge
                            variant="outline"
                            className="text-[--score-excellent] border-[--score-excellent]/30"
                          >
                            {agent.foundCount} found
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[--foreground-muted] mt-0.5">
                        {agent.description}
                      </p>

                      {/* Progress bar when running */}
                      {agent.status === "running" && (
                        <div className="mt-2">
                          <Progress value={agent.progress} className="h-1" />
                          <p className="text-xs text-[--accent] mt-1">
                            Searching...
                          </p>
                        </div>
                      )}

                      {/* Signal types */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {agent.signalTypes.map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center rounded bg-[--background-tertiary] px-1.5 py-0.5 text-[10px] text-[--foreground-muted]"
                          >
                            {type.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[--border] p-4">
            <Button
              className="w-full"
              onClick={simulateResearch}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Research...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Run All Agents
                </>
              )}
            </Button>
            <p className="text-xs text-center text-[--foreground-subtle] mt-3">
              Research agents search multiple sources including news, job
              boards, and company websites
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
