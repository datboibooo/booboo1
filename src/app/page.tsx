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
  Send,
  Building2,
  TrendingUp,
  Zap,
  Sparkles,
  Droplets,
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
  { icon: Code2, text: "React engineers", color: "bg-[--teal]" },
  { icon: TrendingUp, text: "AI startups", color: "bg-[--purple]" },
  { icon: Building2, text: "Series A fintech", color: "bg-[--coral]" },
  { icon: Zap, text: "DevTools companies", color: "bg-[--accent]" },
];

// Animated water droplet component
function WaterDrop({ delay = 0, size = "md" }: { delay?: number; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-2 h-3",
    md: "w-3 h-4",
    lg: "w-4 h-5",
  };

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: [0, 8, 0], opacity: [0.7, 1, 0.7] }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn(
        sizes[size],
        "rounded-full bg-gradient-to-b from-[--teal] to-[--purple]",
        "shadow-lg shadow-[--teal]/30"
      )}
      style={{
        borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
      }}
    />
  );
}

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
    <div className="min-h-screen bg-[--background]">
      {/* Animated blob backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[--teal-subtle] rounded-full blur-[100px] opacity-70 animate-blob"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-[--purple-subtle] rounded-full blur-[100px] opacity-50 animate-blob"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[--coral-subtle] rounded-full blur-[120px] opacity-30 animate-blob"
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Droplet Logo */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-[--teal] to-[--purple] flex items-center justify-center shadow-lg shadow-[--teal]/20"
          >
            <Droplets className="h-5 w-5 text-white" />
            {/* Floating mini drops */}
            <motion.div
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[--coral]"
            />
          </motion.div>
          {/* 3D Logo Text */}
          <span className="logo-drip-3d text-2xl">drip drip</span>
        </Link>
        <Link
          href="/drip"
          className="text-sm text-[--foreground-muted] hover:text-[--foreground] transition-colors flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-[--background-secondary] border border-transparent hover:border-[--border]"
        >
          Dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center px-6 pt-16 pb-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 max-w-2xl"
        >
          {/* Floating drops decoration */}
          <div className="flex justify-center gap-3 mb-6">
            <WaterDrop delay={0} size="sm" />
            <WaterDrop delay={0.3} size="lg" />
            <WaterDrop delay={0.6} size="md" />
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-5 leading-[1.05]">
            <span className="text-3d">Find companies</span>
            <br />
            <span className="text-water">ready to buy</span>
          </h1>
          <p className="text-lg text-[--foreground-muted] max-w-md mx-auto leading-relaxed">
            Real-time hiring signals from job boards.
            <br />
            <span className="text-[--teal] font-medium">No signup. No API keys.</span> Just insights.
          </p>
        </motion.div>

        {/* Chat input - the main event */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-xl mb-8"
        >
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <motion.div
                whileFocus={{ scale: 1.02 }}
                className="flex items-center gap-3 bg-[--background-elevated] border-2 border-[--border] rounded-2xl px-5 py-4 shadow-xl shadow-black/[0.03] hover:border-[--teal]/40 focus-within:border-[--teal] transition-all"
              >
                <Sparkles className="h-5 w-5 text-[--teal] shrink-0 animate-pulse" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What kind of companies are you looking for?"
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
                    query.trim()
                      ? "btn-fluid"
                      : "bg-[--background-tertiary] text-[--foreground-subtle]"
                  )}
                >
                  {isSearching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </motion.button>
              </motion.div>
            </div>
          </form>

          {/* Loading state with bubble animation */}
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
                <span>Scanning job boards...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Example queries */}
        <AnimatePresence>
          {!hasSearched && !isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-wrap justify-center gap-3 mb-16"
            >
              {EXAMPLE_QUERIES.map((example, idx) => (
                <motion.button
                  key={example.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExampleClick(example.text)}
                  className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[--background-elevated] border border-[--border] hover:border-[--teal]/50 hover:shadow-lg hover:shadow-[--teal]/10 transition-all"
                >
                  <div className={cn("p-1.5 rounded-lg", example.color)}>
                    <example.icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm text-[--foreground-muted] group-hover:text-[--foreground] transition-colors">
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
              className="w-full max-w-2xl"
            >
              {results.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-[--foreground-muted]">
                      Found <span className="text-[--teal] font-semibold">{results.length} companies</span>
                    </p>
                    <Link
                      href="/drip"
                      className="text-xs text-[--purple] hover:text-[--purple-muted] flex items-center gap-1 font-medium"
                    >
                      View all in dashboard
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {results.map((lead, idx) => (
                    <motion.div
                      key={lead.domain}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.06 }}
                      whileHover={{ y: -2 }}
                      className="water-card p-5 rounded-2xl transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <motion.div
                            whileHover={{ rotate: 5 }}
                            className="h-11 w-11 rounded-xl bg-gradient-to-br from-[--teal]/20 to-[--purple]/20 flex items-center justify-center text-lg font-bold text-[--teal] border border-[--teal]/20"
                          >
                            {lead.name.charAt(0)}
                          </motion.div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-[--foreground]">{lead.name}</h3>
                              <a
                                href={`https://${lead.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[--foreground-subtle] hover:text-[--teal] transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                            <p className="text-sm text-[--foreground-muted]">
                              {lead.industry} &middot; {lead.stage}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "text-2xl font-bold font-display",
                            lead.score >= 85 ? "text-[--teal]" :
                            lead.score >= 70 ? "text-[--purple]" : "text-[--foreground-muted]"
                          )}>
                            {lead.score}
                          </div>
                          <div className={cn(
                            "text-xs font-medium",
                            lead.hiringVelocity === "aggressive" ? "text-[--coral]" :
                            lead.hiringVelocity === "moderate" ? "text-[--purple]" : "text-[--foreground-subtle]"
                          )}>
                            {lead.hiringVelocity === "aggressive" ? "🔥 Hot" :
                             lead.hiringVelocity === "moderate" ? "📈 Growing" : "Stable"}
                          </div>
                        </div>
                      </div>

                      {/* Signals */}
                      {lead.signals.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {lead.signals.slice(0, 3).map((signal, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 text-xs font-medium rounded-full bg-[--teal]/10 text-[--teal] border border-[--teal]/20"
                            >
                              {signal}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Tech stack */}
                      {lead.techStack.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <Code2 className="h-3.5 w-3.5 text-[--foreground-subtle]" />
                          <div className="flex flex-wrap gap-1.5">
                            {lead.techStack.slice(0, 5).map((tech, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs rounded-md bg-[--background-tertiary] text-[--foreground-muted]"
                              >
                                {tech}
                              </span>
                            ))}
                            {lead.techStack.length > 5 && (
                              <span className="text-xs text-[--foreground-subtle]">
                                +{lead.techStack.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-5 text-sm text-[--foreground-muted]">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4" />
                          {lead.totalJobs} roles
                        </span>
                        {lead.departments.Engineering && (
                          <span className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            {lead.departments.Engineering} eng
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Try another */}
                  <div className="pt-6 flex flex-wrap justify-center gap-2">
                    <span className="text-sm text-[--foreground-subtle] mr-2 py-2">Try:</span>
                    {EXAMPLE_QUERIES.filter(e => !query.toLowerCase().includes(e.text.toLowerCase())).slice(0, 3).map((example) => (
                      <motion.button
                        key={example.text}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleExampleClick(example.text)}
                        className="px-4 py-2 text-sm rounded-full bg-[--background-secondary] text-[--foreground-muted] hover:text-[--foreground] hover:bg-[--background-tertiary] transition-colors border border-transparent hover:border-[--border]"
                      >
                        {example.text}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 px-6 rounded-2xl bg-[--background-secondary] border border-[--border]">
                  <Droplets className="h-10 w-10 mx-auto mb-3 text-[--foreground-subtle]" />
                  <p className="text-[--foreground-muted]">No companies found. Try a different search.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA after results */}
        <AnimatePresence>
          {hasSearched && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-12 text-center"
            >
              <Link href="/drip">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group px-8 py-4 rounded-full btn-fluid font-semibold text-lg"
                >
                  <span className="flex items-center gap-2">
                    <Droplets className="h-5 w-5" />
                    Open Dashboard
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              </Link>
              <p className="mt-4 text-sm text-[--foreground-subtle]">
                Save leads &middot; Generate outreach &middot; Export CSV
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-[--border]">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-[--foreground-subtle]">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-[--teal]" />
            <span>Real-time data from Greenhouse & Lever</span>
          </div>
          <span className="text-[--purple]">No API keys required</span>
        </div>
      </footer>
    </div>
  );
}
