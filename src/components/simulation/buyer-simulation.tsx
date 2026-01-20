"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Target,
  MessageSquare,
  Lightbulb,
  ArrowRight,
  Copy,
  Check,
  Zap,
  Users,
  Clock,
  AlertCircle,
  Globe,
  Loader2,
  ExternalLink,
  Code2,
  TrendingUp,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BuyerJourneyResult {
  buyerProfile: {
    title: string;
    painPoints: string[];
    triggers: string[];
    timeline: string;
  };
  signalsToFind: {
    signal: string;
    why: string;
    urgency: "high" | "medium" | "low";
  }[];
  searchQueries: string[];
  outreachAngles: {
    angle: string;
    opener: string;
  }[];
}

interface MessageTestResult {
  score: number;
  likelihood: "high" | "medium" | "low";
  feedback: string[];
  improvements: string[];
  rewrittenMessage: string;
}

interface CompanyResearch {
  domain: string;
  companyName: string;
  description: string;
  signals: {
    type: string;
    content: string;
    source: string;
    confidence: "high" | "medium" | "low";
  }[];
  recentNews: {
    title: string;
    snippet: string;
    url: string;
  }[];
  teamInfo: {
    size?: string;
    departments?: string[];
  };
  techStack: string[];
  painPoints: string[];
}

type SimMode = "journey" | "message" | "research";

// Product presets for quick simulation
const PRODUCT_PRESETS = [
  { id: "devtools", label: "DevTools / CI/CD", description: "CI/CD, testing, monitoring" },
  { id: "ai-ml", label: "AI/ML Platform", description: "AI infrastructure, ML ops" },
  { id: "sales", label: "Sales / CRM", description: "Sales automation, CRM" },
  { id: "security", label: "Security", description: "Security, compliance" },
  { id: "marketing", label: "Marketing", description: "Marketing automation" },
];

interface BuyerSimulationProps {
  open: boolean;
  onClose: () => void;
  onSearchGenerated?: (queries: string[]) => void;
  initialDomain?: string;
  initialMode?: SimMode;
}

export function BuyerSimulation({ open, onClose, onSearchGenerated, initialDomain, initialMode }: BuyerSimulationProps) {
  const [mode, setMode] = React.useState<SimMode>(initialMode || "journey");
  const [isLoading, setIsLoading] = React.useState(false);

  // Journey mode state
  const [productDescription, setProductDescription] = React.useState("");
  const [journeyResult, setJourneyResult] = React.useState<BuyerJourneyResult | null>(null);

  // Message mode state
  const [testMessage, setTestMessage] = React.useState("");
  const [companyContext, setCompanyContext] = React.useState("");
  const [messageResult, setMessageResult] = React.useState<MessageTestResult | null>(null);

  // Research mode state
  const [researchDomain, setResearchDomain] = React.useState(initialDomain || "");
  const [researchResult, setResearchResult] = React.useState<CompanyResearch | null>(null);
  const [researchMode, setResearchMode] = React.useState<"quick" | "deep">("quick");

  // Set initial domain when props change
  React.useEffect(() => {
    if (initialDomain) {
      setResearchDomain(initialDomain);
      setMode("research");
    }
  }, [initialDomain]);
  const [usageStats, setUsageStats] = React.useState<{
    creditsUsed: number;
    creditsRemaining: number;
    percentUsed: number;
    isNearLimit: boolean;
  } | null>(null);
  const [usageWarning, setUsageWarning] = React.useState<string | null>(null);

  // Copy state
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  // Fetch usage stats on mount
  React.useEffect(() => {
    if (open && mode === "research") {
      fetch("/api/enrich")
        .then((res) => res.json())
        .then((data) => {
          if (data.usage) {
            setUsageStats(data.usage);
          }
        })
        .catch(() => {});
    }
  }, [open, mode]);

  const handleSimulateBuyerJourney = async () => {
    if (!productDescription.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "buyer_journey",
          productDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJourneyResult(data);
      }
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestMessage = async () => {
    if (!testMessage.trim() || !companyContext.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "message_test",
          message: testMessage,
          companyContext,
          personaTitle: "VP of Engineering",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessageResult(data);
      }
    } catch (error) {
      console.error("Message test failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResearchCompany = async () => {
    if (!researchDomain.trim()) return;

    setIsLoading(true);
    setResearchResult(null);
    setUsageWarning(null);

    try {
      const response = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: researchDomain,
          mode: researchMode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResearchResult(data.data);
        }
        // Update usage stats
        if (data.usage) {
          setUsageStats(data.usage);
        }
        // Show warning if present
        if (data.warning) {
          setUsageWarning(data.warning);
        }
      }
    } catch (error) {
      console.error("Research failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleUseQueries = () => {
    if (journeyResult?.searchQueries && onSearchGenerated) {
      onSearchGenerated(journeyResult.searchQueries);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden bg-[--background] rounded-2xl shadow-2xl border border-[--border]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[--border]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[--teal] to-[--purple] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Buyer Intelligence</h2>
              <p className="text-sm text-[--foreground-muted]">AI-powered research & simulation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[--background-secondary] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 p-2 border-b border-[--border] bg-[--background-secondary]">
          {[
            { id: "journey" as SimMode, label: "Buyer Journey", icon: Target },
            { id: "research" as SimMode, label: "Research Company", icon: Globe },
            { id: "message" as SimMode, label: "Test Message", icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                mode === tab.id
                  ? "bg-[--background] text-[--foreground] shadow-sm"
                  : "text-[--foreground-muted] hover:text-[--foreground]"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* JOURNEY MODE */}
          {mode === "journey" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  What do you sell?
                </label>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRODUCT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setProductDescription(preset.description)}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg border transition-all",
                        productDescription === preset.description
                          ? "border-[--teal] bg-[--teal]/10 text-[--teal]"
                          : "border-[--border] bg-[--background-secondary] text-[--foreground-muted] hover:border-[--foreground-subtle]"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="e.g., CI/CD platform for engineering teams, or Sales automation tool, or AI code review..."
                  className="w-full h-24 px-4 py-3 rounded-xl bg-[--background-secondary] border border-[--border] text-sm resize-none focus:outline-none focus:border-[--teal]"
                />
                <button
                  onClick={handleSimulateBuyerJourney}
                  disabled={isLoading || !productDescription.trim()}
                  className="mt-3 w-full py-2.5 rounded-xl btn-fluid font-medium disabled:opacity-50"
                >
                  {isLoading ? "Analyzing..." : "Simulate Buyer Journey"}
                </button>
              </div>

              <AnimatePresence>
                {journeyResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Buyer Profile */}
                    <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-[--teal]" />
                        <h3 className="font-medium">Target Buyer</h3>
                      </div>
                      <p className="text-lg font-semibold text-[--teal] mb-2">
                        {journeyResult.buyerProfile.title}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[--foreground-muted]">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{journeyResult.buyerProfile.timeline}</span>
                      </div>
                    </div>

                    {/* Pain Points */}
                    <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-[--coral]" />
                        Pain Points to Address
                      </h3>
                      <ul className="space-y-2">
                        {journeyResult.buyerProfile.painPoints.map((pain, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[--coral] mt-1.5 shrink-0" />
                            {pain}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Signals */}
                    <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-[--purple]" />
                        Signals to Look For
                      </h3>
                      <div className="space-y-2">
                        {journeyResult.signalsToFind.map((signal, i) => (
                          <div
                            key={i}
                            className={cn(
                              "p-2.5 rounded-lg flex items-center justify-between",
                              signal.urgency === "high" ? "bg-[--coral]/5" :
                              signal.urgency === "medium" ? "bg-[--teal]/5" : "bg-[--background]"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                signal.urgency === "high" ? "bg-[--coral]" :
                                signal.urgency === "medium" ? "bg-[--teal]" : "bg-[--foreground-subtle]"
                              )} />
                              <span className="text-sm font-medium">{signal.signal}</span>
                            </div>
                            <span className="text-xs text-[--foreground-muted]">{signal.why}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Search Queries */}
                    <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-[--teal]" />
                        Search Queries to Use
                      </h3>
                      <div className="space-y-2">
                        {journeyResult.searchQueries.map((query, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-lg bg-[--background] flex items-center justify-between group"
                          >
                            <span className="text-sm">{query}</span>
                            <button
                              onClick={() => handleCopy(query, i)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[--background-secondary] rounded transition-all"
                            >
                              {copiedIndex === i ? (
                                <Check className="h-3.5 w-3.5 text-[--teal]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleUseQueries}
                        className="mt-3 w-full py-2 rounded-lg bg-[--teal]/10 text-[--teal] text-sm font-medium hover:bg-[--teal]/20 transition-colors flex items-center justify-center gap-2"
                      >
                        Use These Searches
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Outreach Angles */}
                    <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-[--coral]" />
                        Outreach Angles
                      </h3>
                      <div className="space-y-3">
                        {journeyResult.outreachAngles.map((angle, i) => (
                          <div key={i} className="p-3 rounded-lg bg-[--background] border border-[--border]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-[--purple] uppercase">
                                {angle.angle}
                              </span>
                              <button
                                onClick={() => handleCopy(angle.opener, i + 100)}
                                className="p-1 hover:bg-[--background-secondary] rounded transition-all"
                              >
                                {copiedIndex === i + 100 ? (
                                  <Check className="h-3.5 w-3.5 text-[--teal]" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                            <p className="text-sm italic text-[--foreground-muted]">
                              "{angle.opener}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* RESEARCH MODE */}
          {mode === "research" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Company domain to research
                </label>
                <input
                  type="text"
                  value={researchDomain}
                  onChange={(e) => setResearchDomain(e.target.value)}
                  placeholder="e.g., stripe.com, notion.so, linear.app"
                  className="w-full px-4 py-3 rounded-xl bg-[--background-secondary] border border-[--border] text-sm focus:outline-none focus:border-[--teal]"
                />

                {/* Research mode toggle */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setResearchMode("quick")}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                      researchMode === "quick"
                        ? "bg-[--teal] text-white"
                        : "bg-[--background-secondary] text-[--foreground-muted]"
                    )}
                  >
                    Quick (homepage)
                  </button>
                  <button
                    onClick={() => setResearchMode("deep")}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                      researchMode === "deep"
                        ? "bg-[--purple] text-white"
                        : "bg-[--background-secondary] text-[--foreground-muted]"
                    )}
                  >
                    Deep (multiple pages)
                  </button>
                </div>

                <button
                  onClick={handleResearchCompany}
                  disabled={isLoading || !researchDomain.trim()}
                  className="mt-3 w-full py-2.5 rounded-xl btn-fluid font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      Research Company
                    </>
                  )}
                </button>

                <p className="mt-2 text-xs text-[--foreground-subtle] text-center">
                  Uses Firecrawl to extract signals from company website
                </p>

                {/* Credit Usage Indicator */}
                {usageStats && (
                  <div className={cn(
                    "mt-3 p-3 rounded-lg border",
                    usageStats.isNearLimit
                      ? "bg-[--coral]/5 border-[--coral]/20"
                      : "bg-[--background-secondary] border-[--border]"
                  )}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={usageStats.isNearLimit ? "text-[--coral] font-medium" : "text-[--foreground-muted]"}>
                        Free tier: {usageStats.creditsUsed}/500 credits used
                      </span>
                      <span className="text-[--foreground-subtle]">
                        {researchMode === "quick" ? "1 credit" : "4 credits"} per search
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-[--background] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          usageStats.percentUsed > 80 ? "bg-[--coral]" :
                          usageStats.percentUsed > 50 ? "bg-[--coral]/60" : "bg-[--teal]"
                        )}
                        style={{ width: `${usageStats.percentUsed}%` }}
                      />
                    </div>
                    {usageStats.isNearLimit && (
                      <p className="mt-2 text-xs text-[--coral]">
                        Approaching monthly limit. {usageStats.creditsRemaining} credits remaining.
                      </p>
                    )}
                  </div>
                )}

                {/* Usage Warning */}
                {usageWarning && (
                  <div className="mt-2 p-2 rounded-lg bg-[--coral]/10 text-[--coral] text-xs text-center">
                    {usageWarning}
                  </div>
                )}
              </div>

              {/* Research Results */}
              <AnimatePresence>
                {researchResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Company Overview */}
                    <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[--teal]/20 to-[--purple]/20 flex items-center justify-center text-lg font-bold text-[--teal]">
                            {researchResult.companyName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{researchResult.companyName}</h3>
                            <a
                              href={`https://${researchResult.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[--foreground-muted] hover:text-[--teal] flex items-center gap-1"
                            >
                              {researchResult.domain}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                        {researchResult.teamInfo?.size && (
                          <div className="text-right">
                            <p className="text-sm font-medium">{researchResult.teamInfo.size}</p>
                            <p className="text-xs text-[--foreground-muted]">employees</p>
                          </div>
                        )}
                      </div>
                      {researchResult.description && (
                        <p className="text-sm text-[--foreground-muted]">
                          {researchResult.description}
                        </p>
                      )}
                    </div>

                    {/* Signals Found */}
                    {researchResult.signals.length > 0 && (
                      <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-[--coral]" />
                          Signals Detected ({researchResult.signals.length})
                        </h3>
                        <div className="space-y-2">
                          {researchResult.signals.slice(0, 8).map((signal, i) => (
                            <div
                              key={i}
                              className={cn(
                                "p-2.5 rounded-lg flex items-center justify-between",
                                signal.confidence === "high" ? "bg-[--coral]/5" :
                                signal.confidence === "medium" ? "bg-[--teal]/5" : "bg-[--background]"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  signal.confidence === "high" ? "bg-[--coral]" :
                                  signal.confidence === "medium" ? "bg-[--teal]" : "bg-[--foreground-subtle]"
                                )} />
                                <div>
                                  <span className="text-sm font-medium">{signal.type}</span>
                                  <span className="text-xs text-[--foreground-muted] ml-2">
                                    {signal.content}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tech Stack */}
                    {researchResult.techStack.length > 0 && (
                      <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <Code2 className="h-4 w-4 text-[--purple]" />
                          Tech Stack
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {researchResult.techStack.map((tech, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 text-sm rounded-full bg-[--purple]/10 text-[--purple]"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pain Points */}
                    {researchResult.painPoints.length > 0 && (
                      <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-[--coral]" />
                          Likely Pain Points
                        </h3>
                        <ul className="space-y-2">
                          {researchResult.painPoints.map((pain, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[--coral] mt-1.5 shrink-0" />
                              {pain}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recent News */}
                    {researchResult.recentNews.length > 0 && (
                      <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-[--teal]" />
                          Recent Activity
                        </h3>
                        <div className="space-y-3">
                          {researchResult.recentNews.slice(0, 3).map((news, i) => (
                            <a
                              key={i}
                              href={news.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-3 rounded-lg bg-[--background] hover:bg-[--background-tertiary] transition-colors"
                            >
                              <p className="text-sm font-medium line-clamp-1">{news.title}</p>
                              {news.snippet && (
                                <p className="text-xs text-[--foreground-muted] mt-1 line-clamp-2">
                                  {news.snippet}
                                </p>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Use for outreach */}
                    <button
                      onClick={() => {
                        setMode("message");
                        setCompanyContext(
                          researchResult.signals.slice(0, 2).map(s => s.content).join(", ") ||
                          researchResult.description?.slice(0, 100) ||
                          researchResult.domain
                        );
                      }}
                      className="w-full py-2.5 rounded-xl bg-[--teal]/10 text-[--teal] font-medium hover:bg-[--teal]/20 transition-colors flex items-center justify-center gap-2"
                    >
                      Use for Outreach Message
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* MESSAGE MODE */}
          {mode === "message" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Company context (what you noticed about them)
                </label>
                <input
                  type="text"
                  value={companyContext}
                  onChange={(e) => setCompanyContext(e.target.value)}
                  placeholder="e.g., hiring 5 engineers, just raised Series A, expanding to Europe..."
                  className="w-full px-4 py-3 rounded-xl bg-[--background-secondary] border border-[--border] text-sm focus:outline-none focus:border-[--teal]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Your outreach message
                </label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Paste or write your outreach message here..."
                  className="w-full h-32 px-4 py-3 rounded-xl bg-[--background-secondary] border border-[--border] text-sm resize-none focus:outline-none focus:border-[--teal]"
                />
                <button
                  onClick={handleTestMessage}
                  disabled={isLoading || !testMessage.trim() || !companyContext.trim()}
                  className="mt-3 w-full py-2.5 rounded-xl btn-fluid font-medium disabled:opacity-50"
                >
                  {isLoading ? "Testing..." : "Test Message Response"}
                </button>
              </div>

              <AnimatePresence>
                {messageResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Response Likelihood</h3>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-sm font-medium",
                          messageResult.likelihood === "high" ? "bg-[--teal]/10 text-[--teal]" :
                          messageResult.likelihood === "medium" ? "bg-[--coral]/10 text-[--coral]" :
                          "bg-[--foreground-subtle]/10 text-[--foreground-muted]"
                        )}>
                          {messageResult.likelihood.toUpperCase()} ({messageResult.score}/10)
                        </div>
                      </div>

                      <div className="space-y-2">
                        {messageResult.feedback.map((fb, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-[--coral] shrink-0 mt-0.5" />
                            <span>{fb}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {messageResult.improvements.length > 0 && (
                      <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-[--teal]" />
                          Suggestions
                        </h3>
                        <ul className="space-y-2">
                          {messageResult.improvements.map((imp, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-[--teal] mt-1.5 shrink-0" />
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-[--teal]/5 border border-[--teal]/20">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-[--teal]">Suggested Rewrite</h3>
                        <button
                          onClick={() => handleCopy(messageResult.rewrittenMessage, 999)}
                          className="p-1.5 hover:bg-[--teal]/10 rounded transition-all"
                        >
                          {copiedIndex === 999 ? (
                            <Check className="h-4 w-4 text-[--teal]" />
                          ) : (
                            <Copy className="h-4 w-4 text-[--teal]" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {messageResult.rewrittenMessage}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
