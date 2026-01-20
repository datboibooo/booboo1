"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  X,
  Mail,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  generateTemplateOutreach,
  generateAllVariants,
  type OutreachContext,
  type GeneratedOutreach,
} from "@/lib/outreach/templates";

interface OutreachModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    name: string;
    domain: string;
    industry?: string;
    techStack: string[];
    totalJobs: number;
    departments?: Record<string, number>;
    hiringVelocity: "aggressive" | "moderate" | "stable";
    signals: string[];
  } | null;
}

export function OutreachModal({ open, onOpenChange, lead }: OutreachModalProps) {
  const [variants, setVariants] = React.useState<GeneratedOutreach[]>([]);
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  const [senderName, setSenderName] = React.useState("");
  const [senderCompany, setSenderCompany] = React.useState("");

  React.useEffect(() => {
    if (open && lead) {
      regenerate();
    }
  }, [open, lead]);

  const regenerate = () => {
    if (!lead) return;

    const ctx: OutreachContext = {
      companyName: lead.name,
      industry: lead.industry,
      techStack: lead.techStack,
      totalJobs: lead.totalJobs,
      engineeringJobs: lead.departments?.Engineering,
      hiringVelocity: lead.hiringVelocity,
      signals: lead.signals,
      senderName: senderName || undefined,
      senderCompany: senderCompany || undefined,
    };

    const generated = generateAllVariants(ctx);
    setVariants(generated);
    setSelectedIdx(0);
  };

  const handleCopy = async () => {
    if (variants[selectedIdx]) {
      const text = `Subject: ${variants[selectedIdx].subject}\n\n${variants[selectedIdx].body}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedVariant = variants[selectedIdx];

  if (!open || !lead) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onOpenChange(false)}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl"
      >
        <div className="bg-[--background] border border-[--border] rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[--border]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[--teal] to-[--purple] flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">Generate Outreach</h2>
                <p className="text-sm text-[--foreground-muted]">{lead.name}</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg hover:bg-[--background-secondary] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Variant tabs */}
          <div className="flex border-b border-[--border]">
            {variants.map((v, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
                  selectedIdx === idx
                    ? "border-b-2 border-[--accent] text-[--accent]"
                    : "text-[--foreground-muted] hover:text-[--foreground]"
                )}
              >
                {v.variant.charAt(0).toUpperCase() + v.variant.slice(1)}
                <span className="ml-1 text-xs text-[--foreground-subtle]">
                  ({v.tone})
                </span>
              </button>
            ))}
          </div>

          {/* Content */}
          {selectedVariant && (
            <div className="p-4 space-y-4">
              {/* Subject */}
              <div>
                <label className="text-xs font-medium text-[--foreground-muted] mb-1 block">
                  Subject
                </label>
                <div className="p-3 rounded-xl bg-[--background-secondary] border border-[--border] text-sm">
                  {selectedVariant.subject}
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="text-xs font-medium text-[--foreground-muted] mb-1 block">
                  Message
                </label>
                <div className="p-4 rounded-xl bg-[--background-secondary] border border-[--border] text-sm whitespace-pre-wrap min-h-[150px]">
                  {selectedVariant.body}
                </div>
              </div>

              {/* Personalization */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[--foreground-muted] mb-1 block">
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="John"
                    className="w-full px-3 py-2 rounded-lg bg-[--background-secondary] border border-[--border] text-sm focus:outline-none focus:border-[--accent]/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[--foreground-muted] mb-1 block">
                    Your Company (optional)
                  </label>
                  <input
                    type="text"
                    value={senderCompany}
                    onChange={(e) => setSenderCompany(e.target.value)}
                    placeholder="Acme Inc"
                    className="w-full px-3 py-2 rounded-lg bg-[--background-secondary] border border-[--border] text-sm focus:outline-none focus:border-[--accent]/50"
                  />
                </div>
              </div>

              {/* Context used */}
              <div className="p-3 rounded-xl bg-[--background-tertiary]/50 text-xs">
                <div className="font-medium text-[--foreground-muted] mb-1">Context used:</div>
                <div className="flex flex-wrap gap-1">
                  {lead.techStack.slice(0, 4).map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[--background-secondary]">
                      {t}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded bg-[--accent]/20 text-[--accent]">
                    {lead.totalJobs} jobs
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[--background-secondary]">
                    {lead.hiringVelocity} hiring
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between p-4 border-t border-[--border] bg-[--background-secondary]">
            <button
              onClick={regenerate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm hover:bg-[--background-tertiary] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </button>

            <div className="flex items-center gap-2">
              <div className="text-xs text-[--foreground-subtle] flex items-center gap-1">
                <Zap className="h-3 w-3" />
                No API key needed
              </div>
              <button
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  copied
                    ? "bg-green-500/20 text-green-500"
                    : "bg-[--accent] text-white hover:bg-[--accent]/90"
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
