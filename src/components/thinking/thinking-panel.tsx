"use client";

import * as React from "react";
import {
  Brain,
  Search,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Target,
  Building2,
  TrendingUp,
  Users,
  Code,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ThinkingStep, CandidateReasoning, ResearchResult } from "@/lib/thinking/types";

interface ThinkingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResultsFound?: (candidates: CandidateReasoning[]) => void;
}

type ThinkingState = "idle" | "thinking" | "complete" | "error";

// Icon mapping for step types
const stepIcons: Record<string, React.ElementType> = {
  understanding: Brain,
  planning: Target,
  searching: Search,
  analyzing: TrendingUp,
  reasoning: Sparkles,
  complete: CheckCircle,
};

export function ThinkingPanel({
  open,
  onOpenChange,
  onResultsFound,
}: ThinkingPanelProps) {
  const [query, setQuery] = React.useState("");
  const [state, setState] = React.useState<ThinkingState>("idle");
  const [steps, setSteps] = React.useState<ThinkingStep[]>([]);
  const [result, setResult] = React.useState<ResearchResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = React.useState<Set<string>>(new Set());

  const runResearch = async () => {
    if (!query.trim()) return;

    setState("thinking");
    setSteps([]);
    setResult(null);
    setError(null);

    // Simulate thinking steps (in production, this would be SSE/WebSocket)
    const simulatedSteps: ThinkingStep[] = [
      {
        id: "understand",
        type: "understanding",
        status: "pending",
        title: "Understanding your query",
        description: "Parsing natural language...",
      },
      {
        id: "plan",
        type: "planning",
        status: "pending",
        title: "Planning research strategy",
        description: "Determining optimal approach...",
      },
      {
        id: "search",
        type: "searching",
        status: "pending",
        title: "Searching job boards",
        description: "Scanning Greenhouse and Lever...",
        progress: 0,
      },
      {
        id: "analyze",
        type: "analyzing",
        status: "pending",
        title: "Analyzing signals",
        description: "Extracting hiring patterns...",
      },
      {
        id: "reason",
        type: "reasoning",
        status: "pending",
        title: "Reasoning about matches",
        description: "Scoring and ranking candidates...",
      },
    ];

    setSteps(simulatedSteps);

    try {
      // Step 1: Understanding
      setSteps((prev) =>
        prev.map((s) =>
          s.id === "understand" ? { ...s, status: "running" } : s
        )
      );
      await new Promise((r) => setTimeout(r, 800));

      // Parse intent via API
      const parseRes = await fetch("/api/think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode: "parse" }),
      });
      const parseData = await parseRes.json();

      setSteps((prev) =>
        prev.map((s) =>
          s.id === "understand"
            ? {
                ...s,
                status: "completed",
                description: parseData.intent?.understanding || "Understood",
              }
            : s
        )
      );

      // Step 2: Planning
      setSteps((prev) =>
        prev.map((s) =>
          s.id === "plan" ? { ...s, status: "running" } : s
        )
      );
      await new Promise((r) => setTimeout(r, 600));
      setSteps((prev) =>
        prev.map((s) =>
          s.id === "plan"
            ? { ...s, status: "completed", description: "Research plan created" }
            : s
        )
      );

      // Step 3: Searching
      setSteps((prev) =>
        prev.map((s) =>
          s.id === "search" ? { ...s, status: "running" } : s
        )
      );

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((r) => setTimeout(r, 200));
        setSteps((prev) =>
          prev.map((s) =>
            s.id === "search" ? { ...s, progress: i } : s
          )
        );
      }
      setSteps((prev) =>
        prev.map((s) =>
          s.id === "search"
            ? { ...s, status: "completed", description: "Scanned 15 companies" }
            : s
        )
      );

      // Step 4: Analyzing
      setSteps((prev) =>
        prev.map((s) =>
          s.id === "analyze" ? { ...s, status: "running" } : s
        )
      );
      await new Promise((r) => setTimeout(r, 500));
      setSteps((prev) =>
        prev.map((s) =>
          s.id === "analyze"
            ? { ...s, status: "completed", description: "Found 47 signals" }
            : s
        )
      );

      // Step 5: Reasoning
      setSteps((prev) =>
        prev.map((s) =>
          s.id === "reason" ? { ...s, status: "running" } : s
        )
      );

      // Make full API call
      const res = await fetch("/api/think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode: "full" }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Research failed");
      }

      setSteps((prev) =>
        prev.map((s) =>
          s.id === "reason"
            ? {
                ...s,
                status: "completed",
                description: `Ranked ${data.result?.candidates?.length || 0} candidates`,
              }
            : s
        )
      );

      setResult(data.result);
      setState("complete");
      onResultsFound?.(data.result?.candidates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => state !== "thinking" && onOpenChange(false)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl border-l border-[--border] bg-[--background] shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[--border] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Research Agent</h2>
              <p className="text-sm text-[--foreground-muted]">
                AI-powered signal discovery
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={state === "thinking"}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Query Input */}
        <div className="border-b border-[--border] p-6">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Find B2B SaaS companies that just raised Series A and are hiring sales..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runResearch()}
              disabled={state === "thinking"}
              className="flex-1"
            />
            <Button
              onClick={runResearch}
              disabled={state === "thinking" || !query.trim()}
            >
              {state === "thinking" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {state === "thinking" ? "Thinking..." : "Research"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-[--foreground-subtle]">
            Describe the companies you're looking for in natural language
          </p>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Thinking Steps */}
            {steps.length > 0 && (
              <div className="space-y-3 mb-6">
                {steps.map((step) => {
                  const Icon = stepIcons[step.type] || Sparkles;
                  const isExpanded = expandedSteps.has(step.id);

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "rounded-lg border p-4 transition-all",
                        step.status === "running"
                          ? "border-purple-500/50 bg-purple-500/5"
                          : step.status === "completed"
                          ? "border-[--score-excellent]/30 bg-[--score-excellent]/5"
                          : step.status === "failed"
                          ? "border-[--priority-high]/30 bg-[--priority-high]/5"
                          : "border-[--border] bg-[--background-secondary]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg",
                            step.status === "running"
                              ? "bg-purple-500/20 text-purple-400"
                              : step.status === "completed"
                              ? "bg-[--score-excellent]/20 text-[--score-excellent]"
                              : "bg-[--background-tertiary] text-[--foreground-muted]"
                          )}
                        >
                          {step.status === "running" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : step.status === "completed" ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : step.status === "failed" ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{step.title}</h4>
                          <p className="text-xs text-[--foreground-muted]">
                            {step.description}
                          </p>
                        </div>
                        {step.details && step.details.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStep(step.id)}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>

                      {step.progress !== undefined && step.status === "running" && (
                        <div className="mt-3">
                          <Progress value={step.progress} className="h-1" />
                        </div>
                      )}

                      {isExpanded && step.details && (
                        <div className="mt-3 pl-11 space-y-1">
                          {step.details.map((detail, i) => (
                            <p
                              key={i}
                              className="text-xs text-[--foreground-subtle]"
                            >
                              • {detail}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Results */}
            {result && result.candidates.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Results</h3>
                  <Badge variant="outline">
                    {result.candidates.length} matches
                  </Badge>
                </div>

                <div className="space-y-3">
                  {result.candidates.map((candidate) => (
                    <div
                      key={candidate.companyDomain}
                      className="rounded-lg border border-[--border] bg-[--background-secondary] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[--foreground-muted]" />
                            <h4 className="font-medium">{candidate.companyName}</h4>
                            <a
                              href={`https://${candidate.companyDomain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[--foreground-subtle] hover:text-[--accent]"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <p className="text-xs text-[--foreground-muted] mt-0.5">
                            {candidate.companyDomain}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              candidate.confidence === "high"
                                ? "default"
                                : candidate.confidence === "medium"
                                ? "secondary"
                                : "outline"
                            }
                            className={
                              candidate.confidence === "high"
                                ? "bg-[--score-excellent] text-white"
                                : ""
                            }
                          >
                            {candidate.confidence}
                          </Badge>
                          <div className="score-pill score-excellent">
                            {candidate.score}
                          </div>
                        </div>
                      </div>

                      {/* Why Now */}
                      <div className="mt-3 rounded-lg bg-[--background-tertiary] p-3">
                        <p className="text-sm">{candidate.whyNow}</p>
                      </div>

                      {/* Matched Criteria */}
                      {candidate.matchedCriteria.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-[--foreground-subtle] mb-2">
                            Evidence:
                          </p>
                          <div className="space-y-1">
                            {candidate.matchedCriteria.slice(0, 3).map((m, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 text-[--score-excellent] mt-0.5 flex-shrink-0" />
                                <span className="text-[--foreground-muted]">
                                  <strong>{m.criterion}:</strong> {m.evidence}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                {result.summary.insights.length > 0 && (
                  <div className="mt-6 rounded-lg border border-[--accent]/30 bg-[--accent]/5 p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[--accent]" />
                      Insights
                    </h4>
                    <ul className="space-y-1">
                      {result.summary.insights.map((insight, i) => (
                        <li
                          key={i}
                          className="text-sm text-[--foreground-muted]"
                        >
                          • {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-[--priority-high]/30 bg-[--priority-high]/10 p-4">
                <div className="flex items-center gap-2 text-[--priority-high]">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="mt-2 text-sm text-[--foreground-muted]">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {state === "idle" && steps.length === 0 && (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto text-[--foreground-subtle] mb-4" />
                <h3 className="font-semibold mb-2">Ask me anything</h3>
                <p className="text-sm text-[--foreground-muted] max-w-sm mx-auto">
                  Describe the companies you're looking for and I'll search job
                  boards, analyze hiring patterns, and find the best matches.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {[
                    "Series A companies hiring sales",
                    "B2B SaaS using Segment",
                    "Startups building first engineering team",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setQuery(example)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[--border] bg-[--background-secondary] hover:border-[--accent] transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
