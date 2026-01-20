"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Search,
  Sparkles,
  ArrowRight,
  Loader2,
  Building2,
  TrendingUp,
  Mail,
  Settings,
  X,
  ChevronDown,
  ExternalLink,
  Check,
  Zap,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "leads" | "action" | "thinking";
  data?: any;
  timestamp: Date;
}

interface MagicCommandBarProps {
  onLeadSelect?: (lead: any) => void;
  className?: string;
}

// Suggested queries for empty state
const SUGGESTIONS = [
  { icon: Building2, text: "Companies hiring engineers with Series A" },
  { icon: TrendingUp, text: "Show high-intent leads this week" },
  { icon: Mail, text: "Draft outreach for my top leads" },
  { icon: Settings, text: "Configure AI providers" },
];

// Quick actions
const QUICK_ACTIONS = [
  { key: "search", label: "Search leads", shortcut: "/" },
  { key: "refresh", label: "Refresh feed", shortcut: "R" },
  { key: "export", label: "Export CSV", shortcut: "E" },
];

export function MagicCommandBar({ onLeadSelect, className }: MagicCommandBarProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isThinking, setIsThinking] = React.useState(false);
  const [thinkingStep, setThinkingStep] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-focus when expanded
  React.useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keyboard shortcut to open
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
    setInput("");
    setIsThinking(true);

    // Simulate AI processing with thinking steps
    await processQuery(userMessage.content);
  };

  const processQuery = async (query: string) => {
    const lowerQuery = query.toLowerCase();

    // Settings/config queries
    if (lowerQuery.includes("config") || lowerQuery.includes("setting") || lowerQuery.includes("api key")) {
      setThinkingStep("Opening settings...");
      await sleep(500);
      addAssistantMessage("Opening AI configuration...", "action", { action: "open_settings" });
      setIsThinking(false);
      return;
    }

    // Search/find queries
    if (lowerQuery.includes("find") || lowerQuery.includes("search") || lowerQuery.includes("companies") || lowerQuery.includes("hiring")) {
      setThinkingStep("Understanding your query...");
      await sleep(600);
      setThinkingStep("Searching across data sources...");
      await sleep(800);
      setThinkingStep("Analyzing hiring signals...");
      await sleep(700);
      setThinkingStep("Ranking by intent score...");
      await sleep(500);

      // Mock results - in production, call /api/think
      const mockLeads = [
        { name: "Acme Corp", domain: "acme.com", score: 92, signal: "Hiring 5 engineers", funding: "Series B" },
        { name: "TechStart", domain: "techstart.io", score: 87, signal: "New CTO hired", funding: "Series A" },
        { name: "DataFlow", domain: "dataflow.ai", score: 84, signal: "Expanding to EU", funding: "Seed" },
      ];

      addAssistantMessage(
        `Found ${mockLeads.length} high-intent companies matching your criteria:`,
        "leads",
        { leads: mockLeads }
      );
      setIsThinking(false);
      return;
    }

    // Outreach queries
    if (lowerQuery.includes("outreach") || lowerQuery.includes("email") || lowerQuery.includes("draft")) {
      setThinkingStep("Analyzing lead context...");
      await sleep(600);
      setThinkingStep("Crafting personalized message...");
      await sleep(800);

      addAssistantMessage(
        "Here's a draft outreach based on their hiring signals:\n\n" +
        "**Subject:** Quick question about your engineering growth\n\n" +
        "Hi [Name],\n\n" +
        "Noticed you're scaling the engineering team - congrats on the momentum. " +
        "We've helped similar companies streamline their hiring pipeline...\n\n" +
        "*[Click to customize and send]*",
        "text"
      );
      setIsThinking(false);
      return;
    }

    // Show leads/dashboard queries
    if (lowerQuery.includes("show") || lowerQuery.includes("leads") || lowerQuery.includes("dashboard")) {
      setThinkingStep("Fetching your leads...");
      await sleep(500);

      addAssistantMessage(
        "Here's your lead overview:\n\n" +
        "**This Week:** 24 new leads\n" +
        "**High Intent:** 8 companies\n" +
        "**Saved:** 12 leads\n\n" +
        "Top signal: *Hiring activity up 40%*",
        "text"
      );
      setIsThinking(false);
      return;
    }

    // Default response
    setThinkingStep("Processing...");
    await sleep(800);
    addAssistantMessage(
      "I can help you with:\n\n" +
      "- **Find leads:** \"Companies hiring React devs with Series A\"\n" +
      "- **Draft outreach:** \"Write email for Acme Corp\"\n" +
      "- **Analyze:** \"Show my best leads this week\"\n" +
      "- **Configure:** \"Set up AI providers\"\n\n" +
      "What would you like to do?",
      "text"
    );
    setIsThinking(false);
  };

  const addAssistantMessage = (content: string, type: Message["type"] = "text", data?: any) => {
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

  return (
    <>
      {/* Collapsed state - minimal bar */}
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
              Ask anything...
            </span>
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-[--background-tertiary] text-[--foreground-subtle] border border-[--border]">
              ⌘K
            </kbd>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded state - full command interface */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Command panel */}
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
              {/* Messages area */}
              {messages.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
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
                          "max-w-[85%] rounded-2xl px-4 py-2.5",
                          message.role === "user"
                            ? "bg-[--accent] text-white"
                            : "bg-[--background-secondary]"
                        )}
                      >
                        {message.type === "leads" && message.data?.leads ? (
                          <div className="space-y-2">
                            <p className="text-sm mb-3">{message.content}</p>
                            {message.data.leads.map((lead: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => onLeadSelect?.(lead)}
                                className="w-full text-left p-3 rounded-xl bg-[--background]/50 hover:bg-[--background] transition-colors group"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-sm flex items-center gap-2">
                                      {lead.name}
                                      <span className="text-xs text-[--foreground-muted]">
                                        {lead.domain}
                                      </span>
                                    </div>
                                    <div className="text-xs text-[--foreground-muted] mt-0.5">
                                      {lead.signal} • {lead.funding}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "text-sm font-semibold",
                                      lead.score >= 90 ? "text-[--score-excellent]" :
                                      lead.score >= 70 ? "text-[--score-good]" : "text-[--score-average]"
                                    )}>
                                      {lead.score}
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-[--foreground-subtle] opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm whitespace-pre-wrap prose prose-sm prose-invert max-w-none">
                            {message.content.split("**").map((part, i) =>
                              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Thinking indicator */}
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

              {/* Suggestions (empty state) */}
              {messages.length === 0 && (
                <div className="p-4 pb-2">
                  <p className="text-xs text-[--foreground-subtle] mb-3">Try asking:</p>
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
                </div>
              )}

              {/* Input area */}
              <form onSubmit={handleSubmit} className="border-t border-[--border]">
                <div className="flex items-center gap-3 p-3">
                  <Sparkles className="h-5 w-5 text-[--accent] shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about your leads..."
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
