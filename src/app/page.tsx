"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  ExternalLink,
  Code2,
  Briefcase,
  Users,
  Sparkles,
  Send,
  Building2,
  TrendingUp,
  Zap,
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

const EXAMPLE_QUERIES = [
  { icon: Code2, text: "React engineers", color: "from-blue-500 to-cyan-400" },
  { icon: TrendingUp, text: "AI startups", color: "from-purple-500 to-pink-400" },
  { icon: Building2, text: "Series A fintech", color: "from-orange-500 to-yellow-400" },
  { icon: Zap, text: "DevTools companies", color: "from-green-500 to-emerald-400" },
];

export default function LandingPage() {
  const [query, setQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<Lead[]>([]);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || isSearching) return;

    setQuery(searchQuery);
    setIsSearching(true);
    setHasSearched(false);
    setShowResults(false);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, limit: 5 }),
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

  const handleExampleClick = (text: string) => {
    setQuery(`Companies hiring ${text}`);
    handleSearch(`Companies hiring ${text}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden">
      {/* Gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Minimal nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">LeadDrip</span>
        </div>
        <Link
          href="/drip"
          className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1"
        >
          Dashboard
          <ArrowRight className="h-3 w-3" />
        </Link>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            <span className="text-white/90">Find who&apos;s </span>
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              hiring
            </span>
          </h1>
          <p className="text-lg text-white/40 max-w-md mx-auto">
            Real-time job board intelligence. No signup required.
          </p>
        </motion.div>

        {/* Chat input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-2xl mb-8"
        >
          <form onSubmit={handleSubmit}>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity" />
              <div className="relative flex items-center gap-3 bg-[#141416] border border-white/10 rounded-2xl px-5 py-4">
                <Sparkles className="h-5 w-5 text-violet-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What kind of companies are you looking for?"
                  className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none text-lg"
                  disabled={isSearching}
                />
                <button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  className={cn(
                    "p-2.5 rounded-xl transition-all",
                    query.trim()
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90"
                      : "bg-white/5 text-white/30"
                  )}
                >
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Loading state */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center justify-center gap-2 text-sm text-white/40"
              >
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>Scanning job boards...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Example queries - only show before search */}
        <AnimatePresence>
          {!hasSearched && !isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-wrap justify-center gap-3 mb-12"
            >
              {EXAMPLE_QUERIES.map((example, idx) => (
                <motion.button
                  key={example.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
                  onClick={() => handleExampleClick(example.text)}
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all"
                >
                  <div className={cn("p-1 rounded-lg bg-gradient-to-br", example.color)}>
                    <example.icon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors">
                    {example.text}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {showResults && hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-3xl"
            >
              {results.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-white/40">
                      Found <span className="text-white/80 font-medium">{results.length} companies</span> matching your search
                    </p>
                    <Link
                      href="/drip"
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      See all in dashboard
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {results.map((lead, idx) => (
                    <motion.div
                      key={lead.domain}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="group p-5 rounded-2xl bg-[#141416] border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-lg font-bold text-white/60">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white/90">{lead.name}</h3>
                              <a
                                href={`https://${lead.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/30 hover:text-violet-400 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                            <p className="text-sm text-white/40">
                              {lead.industry} &middot; {lead.stage}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "text-2xl font-bold",
                            lead.score >= 85 ? "text-emerald-400" :
                            lead.score >= 70 ? "text-amber-400" : "text-white/50"
                          )}>
                            {lead.score}
                          </div>
                          <div className={cn(
                            "text-xs",
                            lead.hiringVelocity === "aggressive" ? "text-emerald-400/80" :
                            lead.hiringVelocity === "moderate" ? "text-amber-400/80" : "text-white/40"
                          )}>
                            {lead.hiringVelocity === "aggressive" ? "Hot" :
                             lead.hiringVelocity === "moderate" ? "Growing" : "Stable"}
                          </div>
                        </div>
                      </div>

                      {/* Signals */}
                      {lead.signals.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {lead.signals.slice(0, 3).map((signal, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 text-xs rounded-lg bg-violet-500/20 text-violet-300"
                            >
                              {signal}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Tech stack */}
                      {lead.techStack.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <Code2 className="h-3.5 w-3.5 text-white/30" />
                          <div className="flex flex-wrap gap-1.5">
                            {lead.techStack.slice(0, 6).map((tech, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs rounded-md bg-white/5 text-white/50"
                              >
                                {tech}
                              </span>
                            ))}
                            {lead.techStack.length > 6 && (
                              <span className="text-xs text-white/30">
                                +{lead.techStack.length - 6}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5" />
                          {lead.totalJobs} open roles
                        </span>
                        {lead.departments.Engineering && (
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {lead.departments.Engineering} engineers
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Try another */}
                  <div className="pt-4 flex flex-wrap justify-center gap-2">
                    <span className="text-xs text-white/30 mr-2 py-2">Try:</span>
                    {EXAMPLE_QUERIES.filter(e => !query.toLowerCase().includes(e.text.toLowerCase())).slice(0, 3).map((example) => (
                      <button
                        key={example.text}
                        onClick={() => handleExampleClick(example.text)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                      >
                        {example.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-white/40">No companies found. Try a different search.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom CTA - only show after results */}
        <AnimatePresence>
          {hasSearched && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-12 text-center"
            >
              <Link href="/drip">
                <button className="group relative px-8 py-4 rounded-2xl font-medium text-white overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    Open Dashboard
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>
              <p className="mt-4 text-xs text-white/30">
                Save leads &middot; Generate outreach &middot; Export to CSV
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-white/30">
          <span>Real-time data from Greenhouse & Lever</span>
          <span>No API keys required</span>
        </div>
      </footer>
    </div>
  );
}
