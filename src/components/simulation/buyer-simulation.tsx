"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Target,
  MessageSquare,
  Search,
  Lightbulb,
  ArrowRight,
  Copy,
  Check,
  Zap,
  Users,
  Clock,
  AlertCircle,
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

type SimMode = "journey" | "message" | "search";

interface BuyerSimulationProps {
  open: boolean;
  onClose: () => void;
  onSearchGenerated?: (queries: string[]) => void;
}

export function BuyerSimulation({ open, onClose, onSearchGenerated }: BuyerSimulationProps) {
  const [mode, setMode] = React.useState<SimMode>("journey");
  const [isLoading, setIsLoading] = React.useState(false);

  // Journey mode state
  const [productDescription, setProductDescription] = React.useState("");
  const [journeyResult, setJourneyResult] = React.useState<BuyerJourneyResult | null>(null);

  // Message mode state
  const [testMessage, setTestMessage] = React.useState("");
  const [companyContext, setCompanyContext] = React.useState("");
  const [messageResult, setMessageResult] = React.useState<MessageTestResult | null>(null);

  // Copy state
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

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
              <h2 className="font-semibold">Buyer Simulation</h2>
              <p className="text-sm text-[--foreground-muted]">AI-powered buyer journey analysis</p>
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
          {mode === "journey" && (
            <div className="space-y-4">
              {/* Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  What do you sell?
                </label>
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

              {/* Results */}
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

                    {/* Signals to Find */}
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
                        <Search className="h-4 w-4 text-[--teal]" />
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

          {mode === "message" && (
            <div className="space-y-4">
              {/* Company Context */}
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

              {/* Message to Test */}
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

              {/* Results */}
              <AnimatePresence>
                {messageResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Score */}
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

                      {/* Feedback */}
                      <div className="space-y-2">
                        {messageResult.feedback.map((fb, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-[--coral] shrink-0 mt-0.5" />
                            <span>{fb}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Improvements */}
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

                    {/* Rewritten Message */}
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
