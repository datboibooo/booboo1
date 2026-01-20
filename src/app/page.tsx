"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  ExternalLink,
  Code2,
  Briefcase,
  Users,
  Zap,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function LandingPage() {
  const [demoQuery, setDemoQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchStep, setSearchStep] = React.useState("");
  const [results, setResults] = React.useState<Lead[]>([]);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Auto-run demo on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      runDemoSearch("Companies hiring React engineers");
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const runDemoSearch = async (query: string) => {
    setDemoQuery(query);
    setIsSearching(true);
    setResults([]);
    setHasSearched(false);

    // Typing animation
    setSearchStep("Searching job boards...");
    await sleep(800);
    setSearchStep("Analyzing hiring signals...");
    await sleep(600);
    setSearchStep("Extracting tech stacks...");
    await sleep(500);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 4 }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.leads || []);
      }
    } catch {
      // Ignore errors for demo
    }

    setIsSearching(false);
    setHasSearched(true);
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const velocityLabels = {
    aggressive: "🔥 Aggressive",
    moderate: "📈 Growing",
    stable: "➡️ Stable",
  };

  return (
    <div className="min-h-screen bg-[--background]">
      {/* Minimal Nav */}
      <nav className="fixed top-0 z-50 w-full bg-[--background]/80 backdrop-blur-lg border-b border-[--border]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[--accent] to-purple-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold">LeadDrip</span>
          </div>
          <Link href="/drip">
            <Button size="sm">
              Try it free
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero - Value First */}
      <section className="pt-24 pb-8 px-6">
        <div className="mx-auto max-w-5xl">
          {/* Headline */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Find who's hiring.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[--accent] to-purple-400">
                Instantly.
              </span>
            </h1>
            <p className="text-[--foreground-muted] max-w-lg mx-auto">
              Real-time job board data. Tech stack extraction. No API keys needed.
            </p>
          </div>

          {/* Live Demo */}
          <div className="rounded-2xl border border-[--border] bg-[--background-secondary] overflow-hidden shadow-2xl shadow-black/20">
            {/* Search Bar */}
            <div className="p-4 border-b border-[--border] flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[--accent]" />
              <div className="flex-1 text-sm">
                {isSearching ? (
                  <span className="text-[--foreground-muted]">{demoQuery}</span>
                ) : (
                  <span>{demoQuery || "Try searching..."}</span>
                )}
              </div>
              {isSearching && (
                <div className="flex items-center gap-2 text-xs text-[--foreground-muted]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {searchStep}
                </div>
              )}
            </div>

            {/* Results */}
            <div className="p-4 min-h-[300px]">
              {isSearching && results.length === 0 && (
                <div className="flex items-center justify-center h-[250px]">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[--accent] mx-auto mb-3" />
                    <p className="text-sm text-[--foreground-muted]">{searchStep}</p>
                  </div>
                </div>
              )}

              {hasSearched && results.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-[--foreground-muted] mb-3">
                    Found {results.length} companies with live hiring data:
                  </p>
                  {results.map((lead, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[--background] border border-[--border] hover:border-[--accent]/30 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold flex items-center gap-2">
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
                          <div className="text-xs text-[--foreground-muted]">
                            {lead.industry} • {lead.stage}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={cn(
                              "text-xl font-bold",
                              lead.score >= 85
                                ? "text-[--score-excellent]"
                                : lead.score >= 70
                                ? "text-[--score-good]"
                                : "text-[--score-average]"
                            )}
                          >
                            {lead.score}
                          </div>
                          <div className="text-[10px] text-[--foreground-muted]">
                            {velocityLabels[lead.hiringVelocity]}
                          </div>
                        </div>
                      </div>

                      {/* Signals */}
                      {lead.signals.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
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
                        <div className="flex items-center gap-2 mb-2">
                          <Code2 className="h-3 w-3 text-[--foreground-subtle]" />
                          <div className="flex flex-wrap gap-1">
                            {lead.techStack.slice(0, 5).map((tech, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 text-[10px] rounded bg-[--background-tertiary] text-[--foreground-muted]"
                              >
                                {tech}
                              </span>
                            ))}
                            {lead.techStack.length > 5 && (
                              <span className="text-[10px] text-[--foreground-subtle]">
                                +{lead.techStack.length - 5}
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
                    </div>
                  ))}
                </div>
              )}

              {hasSearched && results.length === 0 && (
                <div className="flex items-center justify-center h-[250px] text-[--foreground-muted]">
                  No results found
                </div>
              )}
            </div>

            {/* Try Other Queries */}
            {hasSearched && (
              <div className="p-4 border-t border-[--border] bg-[--background-tertiary]/50">
                <p className="text-xs text-[--foreground-subtle] mb-2">Try another search:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "AI startups hiring",
                    "Series A fintech",
                    "Companies using Python",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => runDemoSearch(q)}
                      disabled={isSearching}
                      className="px-3 py-1.5 text-xs rounded-full bg-[--background] border border-[--border] hover:border-[--accent]/50 transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 text-center">
            <Link href="/drip">
              <Button size="lg" className="h-12 px-8">
                <Zap className="h-4 w-4" />
                Open Full Dashboard
              </Button>
            </Link>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-[--foreground-muted]">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-[--score-excellent]" />
                No signup required
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-[--score-excellent]" />
                Real-time data
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-[--score-excellent]" />
                Free to try
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - minimal */}
      <section className="py-16 px-6 border-t border-[--border]">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-semibold text-center mb-8">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Search naturally",
                desc: "\"Companies hiring React engineers in Series A\"",
              },
              {
                step: "2",
                title: "Get live data",
                desc: "Real job postings, tech stacks, hiring velocity",
              },
              {
                step: "3",
                title: "Reach out",
                desc: "Personalized outreach based on their signals",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-10 w-10 rounded-full bg-[--accent]/20 text-[--accent] flex items-center justify-center font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-[--foreground-muted]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[--border]">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-[--accent] to-purple-600 flex items-center justify-center text-white">
              <Sparkles className="h-3 w-3" />
            </div>
            <span className="font-medium text-sm">LeadDrip</span>
          </div>
          <p className="text-xs text-[--foreground-muted]">
            Real-time hiring signals • No API keys • Free to try
          </p>
        </div>
      </footer>
    </div>
  );
}
