"use client";

import * as React from "react";
import {
  Copy,
  Check,
  Loader2,
  Sparkles,
  Mail,
  Linkedin,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadRecord } from "@/lib/schemas";
import type { OutreachMessage, OutreachTone, OutreachChannel } from "@/lib/outreach/types";
import { cn } from "@/lib/utils";
import { logActivity, type ActivityEntry } from "@/lib/store";

interface OutreachPanelProps {
  lead: LeadRecord;
  onActivityLog?: (activity: ActivityEntry) => void;
}

const TONE_LABELS: Record<OutreachTone, { label: string; description: string }> = {
  professional: { label: "Professional", description: "Formal business tone" },
  conversational: { label: "Conversational", description: "Friendly and human" },
  provocative: { label: "Bold", description: "Pattern-interrupt opener" },
  concise: { label: "Ultra-short", description: "Respect their time" },
};

const CHANNEL_ICONS: Record<OutreachChannel, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  twitter: <span className="h-4 w-4 font-bold">𝕏</span>,
};

export function OutreachPanel({ lead, onActivityLog }: OutreachPanelProps) {
  const [channel, setChannel] = React.useState<OutreachChannel>("email");
  const [tone, setTone] = React.useState<OutreachTone>("conversational");
  const [messages, setMessages] = React.useState<OutreachMessage[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: lead.companyName,
          domain: lead.domain,
          industry: lead.industry,
          whyNow: lead.whyNow,
          signals: lead.triggeredSignals.map((s) => ({
            signalName: s.signalName,
          })),
          channel,
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.message || data.error || "Failed to generate outreach");
        return;
      }

      setMessages(data.messages);
    } catch (err) {
      setError("Failed to generate outreach. Check your API keys.");
      console.error("Outreach generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (message: OutreachMessage) => {
    const textToCopy = message.subject
      ? `Subject: ${message.subject}\n\n${message.body}`
      : message.body;

    await navigator.clipboard.writeText(textToCopy);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Log activity
    const entry = logActivity("opener_copied", {
      id: lead.id,
      companyName: lead.companyName,
      domain: lead.domain,
    }, {
      type: `ai_${tone}`,
      channel,
    });
    onActivityLog?.(entry);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Channel selector */}
        <div className="flex rounded-lg border border-[--border] p-1">
          {(["email", "linkedin"] as OutreachChannel[]).map((ch) => (
            <button
              key={ch}
              onClick={() => setChannel(ch)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                channel === ch
                  ? "bg-[--accent] text-white"
                  : "text-[--foreground-muted] hover:text-[--foreground]"
              )}
            >
              {CHANNEL_ICONS[ch]}
              <span className="capitalize">{ch}</span>
            </button>
          ))}
        </div>

        {/* Tone selector */}
        <Select value={tone} onValueChange={(v) => setTone(v as OutreachTone)}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TONE_LABELS).map(([value, { label, description }]) => (
              <SelectItem key={value} value={value}>
                <div className="flex flex-col">
                  <span>{label}</span>
                  <span className="text-xs text-[--foreground-muted]">{description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : messages.length > 0 ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? "Generating..." : messages.length > 0 ? "Regenerate" : "Generate AI Outreach"}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Generated messages */}
      {messages.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs font-medium uppercase tracking-wider text-[--foreground-subtle]">
            Generated Messages ({messages.length})
          </h4>
          {messages.map((message, idx) => (
            <div
              key={message.id}
              className="group proof-card transition-all hover:border-[--accent]"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Option {idx + 1}
                  </Badge>
                  <span className="text-xs text-[--foreground-subtle]">
                    {message.wordCount} words
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(message)}
                  className="h-7 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copiedId === message.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* Subject line for email */}
              {message.subject && (
                <div className="mb-2">
                  <span className="text-xs text-[--foreground-subtle]">Subject: </span>
                  <span className="text-sm font-medium">{message.subject}</span>
                </div>
              )}

              {/* Message body */}
              <p className="text-sm text-[--foreground-muted] whitespace-pre-line">
                {message.body}
              </p>

              {/* Hook explanation */}
              <div className="mt-3 pt-3 border-t border-[--border]">
                <span className="text-xs text-[--foreground-subtle]">
                  Hook: {message.hook}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 && !isGenerating && !error && (
        <div className="text-center py-8 rounded-lg border border-dashed border-[--border]">
          <Sparkles className="h-8 w-8 mx-auto text-[--foreground-subtle] mb-3" />
          <p className="text-sm text-[--foreground-muted] mb-1">
            Generate personalized outreach based on {lead.companyName}'s signals
          </p>
          <p className="text-xs text-[--foreground-subtle]">
            Select channel and tone, then click Generate
          </p>
        </div>
      )}

      {/* Fallback openers */}
      <div className="border-t border-[--border] pt-6">
        <h4 className="text-xs font-medium uppercase tracking-wider text-[--foreground-subtle] mb-3">
          Quick Openers (pre-generated)
        </h4>
        <div className="space-y-3">
          <QuickOpener
            label="Short"
            text={lead.openerShort}
            leadId={lead.id}
            companyName={lead.companyName}
            domain={lead.domain}
            onActivityLog={onActivityLog}
          />
          <QuickOpener
            label="Medium"
            text={lead.openerMedium}
            leadId={lead.id}
            companyName={lead.companyName}
            domain={lead.domain}
            onActivityLog={onActivityLog}
          />
        </div>
      </div>
    </div>
  );
}

// Quick opener component
function QuickOpener({
  label,
  text,
  leadId,
  companyName,
  domain,
  onActivityLog,
}: {
  label: string;
  text: string;
  leadId: string;
  companyName: string;
  domain: string;
  onActivityLog?: (activity: ActivityEntry) => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    const entry = logActivity("opener_copied", {
      id: leadId,
      companyName,
      domain,
    }, { type: label.toLowerCase() });
    onActivityLog?.(entry);
  };

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-[--border] p-3 hover:border-[--accent]/50 transition-colors">
      <Badge variant="outline" className="shrink-0 text-xs">
        {label}
      </Badge>
      <p className="flex-1 text-sm text-[--foreground-muted]">{text}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
