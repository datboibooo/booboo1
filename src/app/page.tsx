"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  ExternalLink,
  Briefcase,
  Users,
  Send,
  Droplets,
  Sparkles,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Building2,
  Code2,
  DollarSign,
  UserPlus,
  Globe,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

// Signal categories with context
const SIGNAL_CONTEXT: Record<string, { icon: React.ElementType; action: string; color: string }> = {
  "Hiring Engineers": { icon: Code2, action: "Building product", color: "teal" },
  "Hiring Sales": { icon: UserPlus, action: "Scaling revenue", color: "purple" },
  "Series A": { icon: DollarSign, action: "Just funded", color: "coral" },
  "Series B": { icon: DollarSign, action: "Growth stage", color: "coral" },
  "Remote OK": { icon: Globe, action: "Distributed team", color: "accent" },
  "AI/ML Focus": { icon: Sparkles, action: "Tech-forward", color: "purple" },
  "Fast Growing": { icon: TrendingUp, action: "Scaling fast", color: "coral" },
  "New Office": { icon: Building2, action: "Expanding", color: "teal" },
};

// Smart suggestions based on input
const SMART_SUGGESTIONS = [
  { query: "AI startups hiring engineers", tags: ["AI", "Engineering", "Startups"] },
  { query: "Fintech companies Series A", tags: ["Fintech", "Funded", "Growth"] },
  { query: "Remote DevOps roles", tags: ["Remote", "DevOps", "Infrastructure"] },
  { query: "Healthcare tech hiring", tags: ["Healthcare", "Tech", "Hiring"] },
];

// Recent/popular searches
const TRENDING_SEARCHES = [
  "React engineers Bay Area",
  "AI startups hiring",
  "Fintech Series B",
  "DevTools companies",
];

export default function LandingPage() {
  const [query, setQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<Lead[]>([]);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("drip-recent-searches");
    if (saved) setRecentSearches(JSON.parse(saved).slice(0, 5));
  }, []);

  // Save search to recent
  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("drip-recent-searches", JSON.stringify(updated));
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || isSearching) return;

    setQuery(searchQuery);
    setIsSearching(true);
    setHasSearched(false);
    setShowResults(false);
    setShowSuggestions(false);
    saveRecentSearch(searchQuery);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, limit: 6 }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.leads || []);
      }
    } catch {
      setResults([]);
    }

    setIsSearching(false);
    setHasSearched(true);
    setTimeout(() => setShowResults(true), 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  // Get filtered suggestions based on query
  const filteredSuggestions = query.length > 1
    ? SMART_SUGGESTIONS.filter(s =>
        s.query.toLowerCase().includes(query.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div className="min-h-screen bg-[--background]">
      {/* Animated blob backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[--teal-subtle] rounded-full blur-[100px] opacity-60 animate-blob"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-[--purple-subtle] rounded-full blur-[100px] opacity-40 animate-blob"
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-[--teal] to-[--purple] flex items-center justify-center shadow-lg shadow-[--teal]/20"
          >
            <Droplets className="h-5 w-5 text-white" />
          </motion.div>
          <span className="logo-drip-3d text-2xl">drip drip</span>
        </Link>
        <Link
          href="/drip"
          className="text-sm text-[--foreground-muted] hover:text-[--foreground] transition-colors flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-[--background-secondary]"
        >
          Dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center px-6 pt-12 pb-12">
        {/* Hero - more conversational */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 max-w-2xl"
        >
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-[1.1]">
            <span className="text-3d">Who's ready to</span>
            <br />
            <span className="text-water">buy right now?</span>
          </h1>
          <p className="text-base text-[--foreground-muted] max-w-md mx-auto">
            Find companies with buying signals. Real-time hiring data, no signup required.
          </p>
        </motion.div>

        {/* Chat Input - The Star of the Show */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-2xl mb-6"
        >
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <div className="flex items-center gap-3 bg-[--background-elevated] border-2 border-[--border] rounded-2xl px-5 py-4 shadow-xl shadow-black/[0.03] hover:border-[--teal]/40 focus-within:border-[--teal] focus-within:shadow-[--teal]/10 transition-all">
                <Target className="h-5 w-5 text-[--teal] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Try: 'AI startups hiring engineers' or 'Fintech Series A'"
                  className="flex-1 bg-transparent text-[--foreground] placeholder:text-[--foreground-subtle] outline-none text-base"
                  disabled={isSearching}
                />
                <motion.button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "p-2.5 rounded-xl transition-all",
                    query.trim() ? "btn-fluid" : "bg-[--background-tertiary] text-[--foreground-subtle]"
                  )}
                >
                  {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </motion.button>
              </div>

              {/* Smart Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && !isSearching && !hasSearched && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[--background-elevated] border border-[--border] rounded-xl shadow-xl overflow-hidden z-20"
                  >
                    {/* Recent searches */}
                    {recentSearches.length > 0 && query.length === 0 && (
                      <div className="p-3 border-b border-[--border]">
                        <p className="text-xs text-[--foreground-subtle] mb-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Recent
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {recentSearches.map((search, i) => (
                            <button
                              key={i}
                              onClick={() => handleSearch(search)}
                              className="px-3 py-1.5 text-sm rounded-lg bg-[--background-secondary] text-[--foreground-muted] hover:text-[--foreground] hover:bg-[--background-tertiary] transition-all"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Filtered suggestions */}
                    {filteredSuggestions.length > 0 && (
                      <div className="p-2">
                        {filteredSuggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSearch(suggestion.query)}
                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[--background-secondary] transition-all flex items-center justify-between group"
                          >
                            <span className="text-sm">{suggestion.query}</span>
                            <div className="flex gap-1">
                              {suggestion.tags.slice(0, 2).map((tag, j) => (
                                <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-[--teal]/10 text-[--teal]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Trending if no query */}
                    {query.length === 0 && (
                      <div className="p-3">
                        <p className="text-xs text-[--foreground-subtle] mb-2 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Trending searches
                        </p>
                        <div className="space-y-1">
                          {TRENDING_SEARCHES.map((search, i) => (
                            <button
                              key={i}
                              onClick={() => handleSearch(search)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-[--background-secondary] text-sm text-[--foreground-muted] hover:text-[--foreground] transition-all"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>

          {/* Loading state */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center justify-center gap-3 text-sm text-[--foreground-muted]"
              >
                <div className="bubble-dots">
                  <span className="bubble-dot" />
                  <span className="bubble-dot" />
                  <span className="bubble-dot" />
                </div>
                <span>Finding companies with buying signals...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {showResults && hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-4xl"
            >
              {results.length > 0 ? (
                <div className="space-y-6">
                  {/* Results header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">
                        Found <span className="text-[--teal]">{results.length} companies</span> ready to buy
                      </p>
                      <p className="text-sm text-[--foreground-muted]">
                        Based on real-time hiring signals and company data
                      </p>
                    </div>
                    <Link
                      href="/drip"
                      className="text-sm text-[--purple] hover:text-[--purple-muted] flex items-center gap-1 font-medium"
                    >
                      View all in dashboard
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Results grid - 2 columns */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {results.map((lead, idx) => (
                      <ResultCard key={lead.domain} lead={lead} index={idx} />
                    ))}
                  </div>

                  {/* Follow-up suggestions */}
                  <div className="pt-4 border-t border-[--border]">
                    <p className="text-sm text-[--foreground-muted] mb-3">Refine your search:</p>
                    <div className="flex flex-wrap gap-2">
                      {["Add location filter", "Higher score only", "Recently funded", "10+ engineers"].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSearch(`${query} ${suggestion.toLowerCase()}`)}
                          className="px-3 py-1.5 text-sm rounded-full bg-[--background-secondary] text-[--foreground-muted] hover:text-[--foreground] hover:bg-[--background-tertiary] transition-all border border-transparent hover:border-[--border]"
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 px-6 rounded-2xl bg-[--background-secondary] border border-[--border]">
                  <Droplets className="h-10 w-10 mx-auto mb-3 text-[--foreground-subtle]" />
                  <p className="text-[--foreground-muted] mb-4">No companies found matching your search.</p>
                  <p className="text-sm text-[--foreground-subtle]">Try: "AI startups" or "Fintech hiring"</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <AnimatePresence>
          {hasSearched && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-10 text-center"
            >
              <Link href="/drip">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-8 py-4 rounded-full btn-fluid font-semibold text-lg"
                >
                  <span className="flex items-center gap-2">
                    Open Full Dashboard
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-6 border-t border-[--border]">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-[--foreground-subtle]">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-[--teal]" />
            <span>Real-time data from job boards</span>
          </div>
          <span className="text-[--purple]">No API keys required</span>
        </div>
      </footer>
    </div>
  );
}

// Enhanced Result Card with Signal Context
function ResultCard({ lead, index }: { lead: Lead; index: number }) {
  const isHot = lead.score >= 85 || lead.hiringVelocity === "aggressive";

  // Get signal context
  const getSignalDisplay = (signal: string) => {
    const ctx = SIGNAL_CONTEXT[signal] || { icon: Zap, action: "Active signal", color: "teal" };
    return ctx;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="water-card rounded-2xl p-5 hover:shadow-lg transition-all group"
    >
      {/* Hot badge */}
      {isHot && (
        <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-[--coral] text-white text-xs font-medium flex items-center gap-1 shadow-lg">
          <Flame className="h-3 w-3" />
          Hot
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[--teal]/20 to-[--purple]/20 flex items-center justify-center text-lg font-bold text-[--teal] border border-[--teal]/20">
            {lead.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{lead.name}</h3>
              <a
                href={`https://${lead.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--foreground-subtle] hover:text-[--teal]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="text-sm text-[--foreground-muted]">
              {lead.industry} · {lead.stage}
            </p>
          </div>
        </div>
        <div className={cn(
          "text-2xl font-bold font-display",
          lead.score >= 85 ? "text-[--coral]" : lead.score >= 70 ? "text-[--teal]" : "text-[--foreground-muted]"
        )}>
          {lead.score}
        </div>
      </div>

      {/* Signals with context - THE KEY IMPROVEMENT */}
      <div className="space-y-2 mb-4">
        {lead.signals.slice(0, 2).map((signal, i) => {
          const ctx = getSignalDisplay(signal);
          const Icon = ctx.icon;
          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-xl transition-all",
                `bg-[--${ctx.color}]/5 border border-[--${ctx.color}]/10`
              )}
            >
              <div className={cn("p-1.5 rounded-lg", `bg-[--${ctx.color}]/10`)}>
                <Icon className={cn("h-4 w-4", `text-[--${ctx.color}]`)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{signal}</p>
                <p className="text-xs text-[--foreground-muted]">{ctx.action}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-4 text-sm text-[--foreground-muted] pt-3 border-t border-[--border]/50">
        <span className="flex items-center gap-1.5">
          <Briefcase className="h-4 w-4" />
          {lead.totalJobs} open roles
        </span>
        {lead.departments.Engineering && (
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {lead.departments.Engineering} eng
          </span>
        )}
        {lead.techStack.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Code2 className="h-4 w-4" />
            {lead.techStack[0]}
            {lead.techStack.length > 1 && ` +${lead.techStack.length - 1}`}
          </span>
        )}
      </div>

      {/* View CTA */}
      <Link
        href="/drip"
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[--background-secondary] text-sm font-medium text-[--foreground-muted] hover:text-[--foreground] hover:bg-[--background-tertiary] transition-all group-hover:bg-[--teal]/10 group-hover:text-[--teal]"
      >
        View Details
        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  );
}
