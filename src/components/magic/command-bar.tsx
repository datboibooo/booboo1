"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Building2,
  TrendingUp,
  Code2,
  Briefcase,
  X,
  ExternalLink,
  Zap,
  Users,
  MapPin,
} from "lucide-react";

interface Lead {
  name: string;
  domain: string;
  industry: string;
  stage: string;
  score: number;
  totalJobs: number;
  techStack: string[];
  departments: Record<string, number>;
  signals: string[];
  hiringVelocity: "aggressive" | "moderate" | "stable";
  topJobs?: Array<{ title: string; department: string; location: string; url: string }>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "leads" | "action";
  data?: { leads?: Lead[] };
  timestamp: Date;
}

interface MagicCommandBarProps {
  onLeadSelect?: (lead: Lead) => void;
  className?: string;
}

// Suggested queries - these work with real data
const SUGGESTIONS = [
  { icon: Code2, text: "Companies hiring React engineers" },
  { icon: TrendingUp, text: "AI startups scaling their team" },
  { icon: Building2, text: "Series A companies hiring" },
  { icon: Briefcase, text: "Fintech with aggressive hiring" },
];

export function MagicCommandBar({ onLeadSelect, className }: MagicCommandBarProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isThinking, setIsThinking] = React.useState(false);
  const [thinkingStep, setThinkingStep] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsExpanded(true);
      }
      if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = input.trim();
    setInput("");
    setIsThinking(true);

    await processQuery(query);
  };

  const processQuery = async (query: string) => {
    const lowerQuery = query.toLowerCase();

    // Settings/config queries - redirect
    if (lowerQuery.includes("config") || lowerQuery.includes("setting") || lowerQuery.includes("api key")) {
      setThinkingStep("Opening settings...");
      await sleep(300);
      window.location.href = "/settings";
      setIsThinking(false);
      return;
    }

    // Search queries - call real API
    if (
      lowerQuery.includes("find") ||
      lowerQuery.includes("search") ||
      lowerQuery.includes("companies") ||
      lowerQuery.includes("hiring") ||
      lowerQuery.includes("startups") ||
      lowerQuery.includes("series") ||
      lowerQuery.includes("engineer") ||
      lowerQuery.includes("team") ||
      lowerQuery.includes("scaling") ||
      lowerQuery.includes("fintech") ||
      lowerQuery.includes("ai ") ||
      lowerQuery.includes("devtool")
    ) {
      await searchRealData(query);
      return;
    }

    // Default - also search
    await searchRealData(query);
  };

  const searchRealData = async (query: string) => {
    try {
      setThinkingStep("Parsing your query...");
      await sleep(400);

      setThinkingStep("Searching job boards...");

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 8 }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      setThinkingStep("Analyzing hiring signals...");
      await sleep(300);

      const data = await response.json();

      if (data.leads && data.leads.length > 0) {
        setThinkingStep("Ranking by intent...");
        await sleep(200);

        const totalJobs = data.leads.reduce((sum: number, l: Lead) => sum + l.totalJobs, 0);
        const topSignals = data.leads.flatMap((l: Lead) => l.signals).slice(0, 3);

        addAssistantMessage(
          `Found **${data.leads.length} companies** with **${totalJobs} open roles** matching "${query}":`,
          "leads",
          { leads: data.leads }
        );
      } else {
        addAssistantMessage(
          "No companies found matching that criteria. Try:\n\n" +
          "• \"Companies hiring React engineers\"\n" +
          "• \"AI startups scaling their team\"\n" +
          "• \"Series A fintech hiring\"",
          "text"
        );
      }
    } catch (error) {
      console.error("Search error:", error);
      addAssistantMessage(
        "Search failed. Please try again.",
        "text"
      );
    } finally {
      setIsThinking(false);
    }
  };

  const addAssistantMessage = (content: string, type: Message["type"] = "text", data?: Message["data"]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content,
        type,
        data,
        timestamp: new Date(),
      },
    ]);
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const velocityColors = {
    aggressive: "text-[--score-excellent]",
    moderate: "text-[--score-good]",
    stable: "text-[--foreground-muted]",
  };

  const velocityLabels = {
    aggressive: "🔥 Aggressive",
    moderate: "📈 Growing",
    stable: "➡️ Stable",
  };

  return (
    <>
      {/* Collapsed state */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setIsExpanded(true)}
            className={cn(
              "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
              "flex items-center gap-3 px-5 py-3",
              "bg-[--background-secondary]/95 backdrop-blur-xl",
              "border border-[--border] rounded-full",
              "shadow-2xl shadow-black/20",
              "hover:border-[--accent]/50 hover:bg-[--background-tertiary]",
              "transition-all duration-200 group",
              className
            )}
          >
            <Sparkles className="h-4 w-4 text-[--accent]" />
            <span className="text-sm text-[--foreground-muted] group-hover:text-[--foreground]">
              Find companies hiring...
            </span>
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-[--background-tertiary] text-[--foreground-subtle] border border-[--border]">
              ⌘K
            </kbd>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded state */}
      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
                "w-full max-w-2xl",
                "bg-[--background]/95 backdrop-blur-xl",
                "border border-[--border] rounded-2xl",
                "shadow-2xl shadow-black/40",
                "overflow-hidden"
              )}
            >
              {/* Messages */}
              {messages.length > 0 && (
                <div className="max-h-[450px] overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[90%] rounded-2xl px-4 py-2.5",
                          message.role === "user"
                            ? "bg-[--accent] text-white"
                            : "bg-[--background-secondary]"
                        )}
                      >
                        {message.type === "leads" && message.data?.leads ? (
                          <div className="space-y-3">
                            <p className="text-sm">
                              {message.content.split("**").map((part, i) =>
                                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                              )}
                            </p>
                            <div className="space-y-2">
                              {message.data.leads.map((lead, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-xl bg-[--background]/60 hover:bg-[--background] transition-colors"
                                >
                                  {/* Header */}
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <div className="font-semibold text-sm flex items-center gap-2">
                                        {lead.name}
                                        <a
                                          href={`https://${lead.domain}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[--foreground-muted] hover:text-[--accent]"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>
                                      <div className="text-xs text-[--foreground-muted] flex items-center gap-2">
                                        <span>{lead.industry}</span>
                                        <span>•</span>
                                        <span>{lead.stage}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className={cn(
                                        "text-lg font-bold",
                                        lead.score >= 85 ? "text-[--score-excellent]" :
                                        lead.score >= 70 ? "text-[--score-good]" : "text-[--score-average]"
                                      )}>
                                        {lead.score}
                                      </div>
                                      <div className={cn("text-[10px]", velocityColors[lead.hiringVelocity])}>
                                        {velocityLabels[lead.hiringVelocity]}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Signals */}
                                  {lead.signals.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {lead.signals.slice(0, 2).map((signal, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-0.5 text-[10px] rounded-full bg-[--accent]/20 text-[--accent]"
                                        >
                                          {signal}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Tech Stack */}
                                  {lead.techStack.length > 0 && (
                                    <div className="flex items-center gap-1 mb-2">
                                      <Code2 className="h-3 w-3 text-[--foreground-subtle]" />
                                      <div className="flex flex-wrap gap-1">
                                        {lead.techStack.slice(0, 6).map((tech, i) => (
                                          <span
                                            key={i}
                                            className="px-1.5 py-0.5 text-[10px] rounded bg-[--background-tertiary] text-[--foreground-muted]"
                                          >
                                            {tech}
                                          </span>
                                        ))}
                                        {lead.techStack.length > 6 && (
                                          <span className="text-[10px] text-[--foreground-subtle]">
                                            +{lead.techStack.length - 6} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Stats */}
                                  <div className="flex items-center gap-4 text-[10px] text-[--foreground-muted]">
                                    <span className="flex items-center gap-1">
                                      <Briefcase className="h-3 w-3" />
                                      {lead.totalJobs} open roles
                                    </span>
                                    {lead.departments.Engineering && (
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {lead.departments.Engineering} eng
                                      </span>
                                    )}
                                  </div>

                                  {/* Top Jobs Preview */}
                                  {lead.topJobs && lead.topJobs.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-[--border]/50">
                                      <div className="text-[10px] text-[--foreground-subtle] mb-1">Featured roles:</div>
                                      <div className="space-y-1">
                                        {lead.topJobs.slice(0, 2).map((job, i) => (
                                          <a
                                            key={i}
                                            href={job.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between text-[11px] hover:text-[--accent] transition-colors"
                                          >
                                            <span className="truncate">{job.title}</span>
                                            <span className="text-[--foreground-subtle] flex items-center gap-1 shrink-0">
                                              <MapPin className="h-2.5 w-2.5" />
                                              {job.location.length > 20 ? job.location.slice(0, 20) + "..." : job.location}
                                            </span>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content.split("**").map((part, i) =>
                              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex justify-start">
                      <div className="bg-[--background-secondary] rounded-2xl px-4 py-2.5">
                        <div className="flex items-center gap-2 text-sm text-[--foreground-muted]">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {thinkingStep}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Suggestions */}
              {messages.length === 0 && (
                <div className="p-4 pb-2">
                  <p className="text-xs text-[--foreground-subtle] mb-3">
                    Search real job boards instantly. Try:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {SUGGESTIONS.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-[--background-secondary] hover:bg-[--background-tertiary] text-left transition-colors group"
                      >
                        <suggestion.icon className="h-4 w-4 text-[--foreground-subtle] group-hover:text-[--accent]" />
                        <span className="text-xs text-[--foreground-muted] group-hover:text-[--foreground]">
                          {suggestion.text}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[--foreground-subtle] mt-3 text-center">
                    Live data from Greenhouse & Lever • No API keys needed
                  </p>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t border-[--border]">
                <div className="flex items-center gap-3 p-3">
                  <Sparkles className="h-5 w-5 text-[--accent] shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Find companies hiring..."
                    disabled={isThinking}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-[--foreground-subtle]"
                  />
                  <div className="flex items-center gap-2">
                    {input.trim() ? (
                      <button
                        type="submit"
                        disabled={isThinking}
                        className="p-2 rounded-lg bg-[--accent] text-white hover:bg-[--accent]/90 transition-colors disabled:opacity-50"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsExpanded(false)}
                        className="p-2 rounded-lg hover:bg-[--background-secondary] transition-colors"
                      >
                        <X className="h-4 w-4 text-[--foreground-subtle]" />
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
