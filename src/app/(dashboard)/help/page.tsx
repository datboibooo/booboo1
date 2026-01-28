"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Zap,
  Bookmark,
  BarChart3,
  List,
  Settings,
  ArrowRight,
  Keyboard,
  Download,
  Filter,
  User,
  Building2,
  Phone,
  Mail,
  Globe,
  FileText,
  Shield,
  Sparkles,
  Target,
  Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "SkipTrace Pro",
    description: "Comprehensive investigation tools for people, businesses, property, and public records search.",
    icon: Search,
    href: "/skiptrace",
    color: "teal",
    capabilities: [
      "Person lookup by name, phone, or email",
      "Business entity and SEC filing search",
      "Property records and ownership data",
      "Court records and public records",
      "Vehicle records and VIN lookup",
    ],
  },
  {
    title: "Lead Intelligence",
    description: "Discover high-intent leads with buying signals and company insights.",
    icon: Zap,
    href: "/drip",
    color: "purple",
    capabilities: [
      "Search by industry, location, or signals",
      "Lead scoring and prioritization",
      "Company brief and contact info",
      "Export leads to CSV",
      "Save and track favorites",
    ],
  },
  {
    title: "Saved Leads",
    description: "Manage your saved leads and track your outreach progress.",
    icon: Bookmark,
    href: "/saved",
    color: "coral",
    capabilities: [
      "View all saved leads in one place",
      "Filter by status and score",
      "Track contacted vs new leads",
      "Bulk actions and export",
    ],
  },
  {
    title: "Watchlists",
    description: "Create and monitor lists of companies you're tracking.",
    icon: List,
    href: "/lists",
    color: "accent",
    capabilities: [
      "Create custom watchlists",
      "Monitor companies for signals",
      "Import/export company lists",
      "Track list performance",
    ],
  },
  {
    title: "Analytics",
    description: "Get insights into your lead generation and conversion metrics.",
    icon: BarChart3,
    href: "/analytics",
    color: "teal",
    capabilities: [
      "Lead scoring breakdown",
      "Industry distribution",
      "Signal frequency analysis",
      "Performance metrics",
    ],
  },
];

const keyboardShortcuts = [
  { key: "j / k", action: "Navigate between leads" },
  { key: "Enter", action: "Open lead details" },
  { key: "Escape", action: "Close details panel" },
  { key: "s", action: "Save current lead" },
  { key: "x", action: "Skip current lead" },
  { key: "c", action: "Copy opener script" },
  { key: "/", action: "Focus search input" },
  { key: "?", action: "Show all shortcuts" },
];

const searchTypes = [
  { icon: User, title: "Person Search", description: "Find people by name, location, phone, or email" },
  { icon: Building2, title: "Business Search", description: "Look up companies, SEC filings, and corporate records" },
  { icon: Globe, title: "Property Search", description: "Property records, ownership, and assessment data" },
  { icon: FileText, title: "Court Records", description: "Civil, criminal, and bankruptcy court records" },
  { icon: Phone, title: "Phone Lookup", description: "Reverse phone lookup and carrier information" },
  { icon: Mail, title: "Email Search", description: "Find emails or do reverse email lookup" },
];

export default function HelpPage() {
  return (
    <div className="flex h-full flex-col bg-[--background] overflow-y-auto">
      {/* Header */}
      <header className="border-b border-[--border] px-6 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[--teal] to-[--purple] flex items-center justify-center">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Getting Started</h1>
            <p className="text-sm text-[--foreground-muted]">
              Learn how to use drip drip to find high-intent leads
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-10 max-w-5xl mx-auto">
        {/* Quick Start */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-[--teal]" />
            Quick Start
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 rounded-2xl bg-[--background-secondary] border border-[--border]"
            >
              <div className="h-10 w-10 rounded-xl bg-[--teal]/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-[--teal]">1</span>
              </div>
              <h3 className="font-semibold mb-2">Search for Leads</h3>
              <p className="text-sm text-[--foreground-muted] mb-3">
                Go to the Lead Intelligence page and search by industry, location, or buying signals.
              </p>
              <Link href="/drip">
                <Button variant="outline" size="sm" className="gap-2">
                  Start Searching <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 rounded-2xl bg-[--background-secondary] border border-[--border]"
            >
              <div className="h-10 w-10 rounded-xl bg-[--purple]/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-[--purple]">2</span>
              </div>
              <h3 className="font-semibold mb-2">Investigate People & Companies</h3>
              <p className="text-sm text-[--foreground-muted] mb-3">
                Use SkipTrace to look up detailed information on people, businesses, and property.
              </p>
              <Link href="/skiptrace">
                <Button variant="outline" size="sm" className="gap-2">
                  Open SkipTrace <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl bg-[--background-secondary] border border-[--border]"
            >
              <div className="h-10 w-10 rounded-xl bg-[--coral]/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-[--coral]">3</span>
              </div>
              <h3 className="font-semibold mb-2">Save & Export</h3>
              <p className="text-sm text-[--foreground-muted] mb-3">
                Save promising leads and export your data to CSV for your CRM or outreach tools.
              </p>
              <Link href="/saved">
                <Button variant="outline" size="sm" className="gap-2">
                  View Saved <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[--purple]" />
            Platform Features
          </h2>
          <div className="space-y-4">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="p-5 rounded-2xl bg-[--background-secondary] border border-[--border] hover:border-[--teal]/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl bg-[--${feature.color}]/10 flex items-center justify-center shrink-0`}>
                    <feature.icon className={`h-6 w-6 text-[--${feature.color}]`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <Link href={feature.href}>
                        <Button variant="ghost" size="sm" className="gap-1 text-[--foreground-muted]">
                          Open <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                    <p className="text-sm text-[--foreground-muted] mb-3">{feature.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {feature.capabilities.map((cap, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded-lg bg-[--background] text-[--foreground-muted]"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SkipTrace Search Types */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-[--teal]" />
            SkipTrace Search Types
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchTypes.map((type, idx) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
                className="p-4 rounded-xl bg-[--background-secondary] border border-[--border]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <type.icon className="h-5 w-5 text-[--teal]" />
                  <h3 className="font-medium">{type.title}</h3>
                </div>
                <p className="text-xs text-[--foreground-muted]">{type.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-[--purple]" />
            Keyboard Shortcuts
          </h2>
          <div className="grid md:grid-cols-2 gap-2">
            {keyboardShortcuts.map((shortcut, idx) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between p-3 rounded-lg bg-[--background-secondary]"
              >
                <span className="text-sm text-[--foreground-muted]">{shortcut.action}</span>
                <kbd className="px-2 py-1 bg-[--background] border border-[--border] rounded text-xs font-mono">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* Demo Mode Notice */}
        <section className="p-5 rounded-2xl bg-gradient-to-br from-[--teal]/10 to-[--purple]/10 border border-[--teal]/20">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[--teal]/20 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-[--teal]" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Demo Mode</h3>
              <p className="text-sm text-[--foreground-muted] mb-3">
                This platform works without any API keys in demo mode. All features are functional with sample data.
                For production use with real data, configure your API keys in Settings.
              </p>
              <div className="flex gap-2">
                <Link href="/settings">
                  <Button variant="outline" size="sm">Configure Settings</Button>
                </Link>
                <Link href="/drip">
                  <Button size="sm" className="bg-[--teal] hover:bg-[--teal]/90">Try Demo</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="text-center py-8">
          <p className="text-sm text-[--foreground-muted]">
            Need help? Check the{" "}
            <Link href="/settings" className="text-[--teal] hover:underline">
              Settings
            </Link>{" "}
            page or view the source code on{" "}
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[--teal] hover:underline">
              GitHub
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
