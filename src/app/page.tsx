"use client";

import * as React from "react";
import Link from "next/link";
import {
  Zap,
  Target,
  Sparkles,
  TrendingUp,
  Users,
  Rocket,
  CheckCircle,
  ArrowRight,
  Play,
  Shield,
  Globe,
  BarChart3,
  Search,
  MessageSquare,
  Clock,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Sparkles,
    title: "AI Research Agents",
    description:
      "5 specialized agents crawl news, job boards, and company sites to find buying signals in real-time.",
    highlight: true,
  },
  {
    icon: Target,
    title: "Signal-Based Scoring",
    description:
      "Leads scored based on funding rounds, hiring sprees, product launches, and leadership changes.",
  },
  {
    icon: MessageSquare,
    title: "AI Outreach Generation",
    description:
      "Generate personalized outreach messages tailored to each lead's specific signals and context.",
    highlight: true,
  },
  {
    icon: Shield,
    title: "Signal Verification",
    description:
      "Multi-source verification ensures signals are accurate with evidence and confidence scores.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track signal performance, conversion rates, and optimize your ICP based on real data.",
  },
  {
    icon: Clock,
    title: "Daily Drip Feed",
    description:
      "Fresh leads delivered daily at your preferred time, filtered to match your ideal customer profile.",
  },
];

const signals = [
  { name: "Funding Round", icon: TrendingUp, color: "text-emerald-400" },
  { name: "Hiring Spree", icon: Users, color: "text-blue-400" },
  { name: "Product Launch", icon: Rocket, color: "text-purple-400" },
  { name: "Leadership Change", icon: Target, color: "text-amber-400" },
  { name: "Geographic Expansion", icon: Globe, color: "text-pink-400" },
  { name: "M&A Activity", icon: DollarSign, color: "text-cyan-400" },
];

const comparisons = [
  {
    feature: "AI Research Agents",
    leaddrip: true,
    competitor: false,
  },
  {
    feature: "Real-time Signal Detection",
    leaddrip: true,
    competitor: true,
  },
  {
    feature: "Signal Verification",
    leaddrip: true,
    competitor: false,
  },
  {
    feature: "AI Outreach Generation",
    leaddrip: true,
    competitor: false,
  },
  {
    feature: "Multi-source Crawling",
    leaddrip: true,
    competitor: "Limited",
  },
  {
    feature: "Custom Signal Config",
    leaddrip: true,
    competitor: true,
  },
  {
    feature: "Starting Price",
    leaddrip: "$49/mo",
    competitor: "$249/mo",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[--background]">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-[--border] bg-[--background]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--foreground] text-[--background]">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-semibold text-lg">LeadDrip</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/drip">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/drip">
              <Button size="sm">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[--accent]/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <Badge
              variant="outline"
              className="mb-6 border-[--accent]/30 text-[--accent]"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Lead Intelligence
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Find buyers before
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[--accent] to-purple-400">
                they start searching
              </span>
            </h1>

            <p className="text-xl text-[--foreground-muted] max-w-2xl mx-auto mb-10">
              LeadDrip uses AI research agents to discover companies showing
              buying signals - funding rounds, hiring sprees, product launches -
              and delivers them to your inbox daily.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link href="/drip">
                <Button size="lg" className="h-12 px-8">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-8">
                <Play className="h-4 w-4" />
                Watch Demo
              </Button>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-[--foreground-muted]">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[--score-excellent]" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[--score-excellent]" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[--score-excellent]" />
                Cancel anytime
              </div>
            </div>
          </div>

          {/* Signals visualization */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[--background] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-2xl border border-[--border] bg-[--background-secondary] p-8 overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-3 w-3 rounded-full bg-[--priority-high]" />
                <div className="h-3 w-3 rounded-full bg-[--priority-medium]" />
                <div className="h-3 w-3 rounded-full bg-[--score-excellent]" />
                <span className="ml-2 text-sm text-[--foreground-muted]">
                  LeadDrip Dashboard
                </span>
              </div>

              {/* Simulated dashboard content */}
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[--border] bg-[--background] p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="h-4 w-32 bg-[--background-tertiary] rounded mb-2" />
                        <div className="h-3 w-24 bg-[--background-tertiary] rounded" />
                      </div>
                      <div className="h-8 w-12 rounded-full bg-gradient-to-r from-[--score-excellent] to-emerald-400 flex items-center justify-center text-xs font-bold text-white">
                        {95 - i * 8}
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        Funding
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Hiring
                      </Badge>
                    </div>
                    <div className="h-16 bg-[--background-tertiary] rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signals Section */}
      <section className="py-20 border-t border-[--border]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Signals that indicate buying intent
            </h2>
            <p className="text-[--foreground-muted] max-w-2xl mx-auto">
              Our AI agents monitor multiple sources to detect these high-intent
              signals before your competitors do.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {signals.map((signal) => (
              <div
                key={signal.name}
                className="flex flex-col items-center p-6 rounded-xl border border-[--border] bg-[--background-secondary] hover:border-[--accent]/50 transition-colors"
              >
                <signal.icon className={cn("h-8 w-8 mb-3", signal.color)} />
                <span className="text-sm font-medium text-center">
                  {signal.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-[--border]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything you need to find and convert leads
            </h2>
            <p className="text-[--foreground-muted] max-w-2xl mx-auto">
              A complete platform for signal-based prospecting, from discovery
              to outreach.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "p-6 rounded-xl border transition-all",
                  feature.highlight
                    ? "border-[--accent]/30 bg-[--accent]/5 hover:border-[--accent]/50"
                    : "border-[--border] bg-[--background-secondary] hover:border-[--foreground-subtle]"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg mb-4",
                    feature.highlight
                      ? "bg-[--accent]/20 text-[--accent]"
                      : "bg-[--background-tertiary] text-[--foreground-muted]"
                  )}
                >
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[--foreground-muted]">
                  {feature.description}
                </p>
                {feature.highlight && (
                  <Badge className="mt-4 bg-[--accent]/20 text-[--accent] border-0">
                    New
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 border-t border-[--border]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why choose LeadDrip?</h2>
            <p className="text-[--foreground-muted]">
              More features, better accuracy, lower price.
            </p>
          </div>

          <div className="rounded-xl border border-[--border] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[--border] bg-[--background-secondary]">
                  <th className="text-left p-4 font-medium">Feature</th>
                  <th className="text-center p-4 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4 text-[--accent]" />
                      LeadDrip
                    </div>
                  </th>
                  <th className="text-center p-4 font-medium text-[--foreground-muted]">
                    Competitors
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={cn(
                      "border-b border-[--border]",
                      i % 2 === 0 ? "bg-[--background]" : "bg-[--background-secondary]"
                    )}
                  >
                    <td className="p-4">{row.feature}</td>
                    <td className="p-4 text-center">
                      {typeof row.leaddrip === "boolean" ? (
                        row.leaddrip ? (
                          <CheckCircle className="h-5 w-5 text-[--score-excellent] mx-auto" />
                        ) : (
                          <span className="text-[--foreground-subtle]">-</span>
                        )
                      ) : (
                        <span className="font-semibold text-[--score-excellent]">
                          {row.leaddrip}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof row.competitor === "boolean" ? (
                        row.competitor ? (
                          <CheckCircle className="h-5 w-5 text-[--foreground-subtle] mx-auto" />
                        ) : (
                          <span className="text-[--foreground-subtle]">-</span>
                        )
                      ) : (
                        <span className="text-[--foreground-muted]">
                          {row.competitor}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-[--border]">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to find your next customers?
          </h2>
          <p className="text-[--foreground-muted] mb-8 max-w-xl mx-auto">
            Start your free 14-day trial today. No credit card required.
          </p>
          <Link href="/drip">
            <Button size="lg" className="h-12 px-8">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[--border] py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[--foreground] text-[--background]">
                <Zap className="h-3 w-3" />
              </div>
              <span className="font-semibold">LeadDrip</span>
            </div>
            <p className="text-sm text-[--foreground-muted]">
              Built with AI for modern sales teams
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
