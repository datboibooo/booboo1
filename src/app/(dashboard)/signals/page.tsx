"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { SignalDefinition, SignalCategory, SignalPriority } from "@/lib/schemas";
import { DEFAULT_SIGNAL_PRESETS, getAllDefaultSignals } from "@/lib/fixtures/demo-data";
import { getUserConfig, saveUserConfig, toggleSignal, addCustomSignal, deleteSignal } from "@/lib/store";
import {
  Plus,
  Play,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Radio,
  Zap,
  TrendingUp,
  Users,
  Globe,
  Cpu,
  Shield,
  Ban,
  Search,
  Loader2,
  ExternalLink,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Signal types available for discovery
const DISCOVERY_SIGNAL_TYPES = [
  { id: "funding", label: "Funding Rounds", icon: TrendingUp, color: "text-emerald-400" },
  { id: "hiring", label: "Hiring Surges", icon: Users, color: "text-blue-400" },
  { id: "product_launch", label: "Product Launches", icon: Zap, color: "text-purple-400" },
  { id: "leadership_change", label: "Leadership Changes", icon: Users, color: "text-amber-400" },
  { id: "expansion", label: "Market Expansion", icon: Globe, color: "text-cyan-400" },
  { id: "partnership", label: "New Partnerships", icon: Building2, color: "text-pink-400" },
  { id: "acquisition", label: "M&A Activity", icon: TrendingUp, color: "text-orange-400" },
  { id: "tech_adoption", label: "Tech Adoption", icon: Cpu, color: "text-indigo-400" },
];

interface DiscoveredSignal {
  companyName: string;
  domain: string;
  signalType: string;
  title: string;
  snippet: string;
  url: string;
  confidence: "high" | "medium" | "low";
  publishedAt?: string;
}

const CATEGORY_CONFIG: Record<
  SignalCategory,
  { label: string; icon: React.ElementType; color: string }
> = {
  funding_corporate: {
    label: "Funding & Corporate",
    icon: TrendingUp,
    color: "text-emerald-400",
  },
  leadership_org: {
    label: "Leadership & Org",
    icon: Users,
    color: "text-blue-400",
  },
  product_strategy: {
    label: "Product & Strategy",
    icon: Zap,
    color: "text-purple-400",
  },
  hiring_team: {
    label: "Hiring & Team",
    icon: Users,
    color: "text-cyan-400",
  },
  expansion_partnerships: {
    label: "Expansion & Partnerships",
    icon: Globe,
    color: "text-amber-400",
  },
  technology_adoption: {
    label: "Technology",
    icon: Cpu,
    color: "text-pink-400",
  },
  risk_compliance: {
    label: "Risk & Compliance",
    icon: Shield,
    color: "text-orange-400",
  },
  disqualifier: {
    label: "Disqualifiers",
    icon: Ban,
    color: "text-rose-400",
  },
};

export default function SignalsStudioPage() {
  const [signals, setSignals] = React.useState<SignalDefinition[]>([]);
  const [selectedSignal, setSelectedSignal] =
    React.useState<SignalDefinition | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    queriesExecuted: string[];
    matchesFound: number;
    qualityChecklist: {
      isSpecific: boolean;
      isObservable: boolean;
      hasQualifiers: boolean;
      lowAmbiguity: boolean;
    };
  } | null>(null);
  const [isTesting, setIsTesting] = React.useState(false);

  // Discovery mode state
  const [activeTab, setActiveTab] = React.useState<"configure" | "discover">("configure");
  const [selectedDiscoveryTypes, setSelectedDiscoveryTypes] = React.useState<string[]>(["funding", "hiring"]);
  const [isDiscovering, setIsDiscovering] = React.useState(false);
  const [discoveredSignals, setDiscoveredSignals] = React.useState<DiscoveredSignal[]>([]);
  const [discoveryError, setDiscoveryError] = React.useState<string | null>(null);

  // Load signals from localStorage on mount
  React.useEffect(() => {
    const config = getUserConfig();
    setSignals(config.signals);
  }, []);

  // Handle signal discovery
  const handleDiscoverSignals = async () => {
    if (selectedDiscoveryTypes.length === 0) return;

    setIsDiscovering(true);
    setDiscoveryError(null);
    setDiscoveredSignals([]);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "discover",
          signalTypes: selectedDiscoveryTypes,
          maxResults: 30,
          enrichDomains: false,
        }),
      });

      if (!response.ok) throw new Error("Discovery failed");

      const data = await response.json();
      if (data.success && data.signals) {
        setDiscoveredSignals(data.signals);
      } else if (data.error) {
        setDiscoveryError(data.error);
      }
    } catch (error) {
      console.error("Discovery failed:", error);
      setDiscoveryError("Failed to discover signals. Please try again.");
    } finally {
      setIsDiscovering(false);
    }
  };

  const toggleDiscoveryType = (typeId: string) => {
    setSelectedDiscoveryTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const signalsByCategory = React.useMemo(() => {
    const grouped: Record<SignalCategory, SignalDefinition[]> = {
      funding_corporate: [],
      leadership_org: [],
      product_strategy: [],
      hiring_team: [],
      expansion_partnerships: [],
      technology_adoption: [],
      risk_compliance: [],
      disqualifier: [],
    };

    for (const signal of signals) {
      grouped[signal.category].push(signal);
    }

    return grouped;
  }, [signals]);

  const handleToggleSignal = (signalId: string) => {
    setSignals((prev) => {
      const updated = prev.map((s) =>
        s.id === signalId ? { ...s, enabled: !s.enabled } : s
      );
      // Persist to localStorage
      const config = getUserConfig();
      config.signals = updated;
      saveUserConfig(config);
      return updated;
    });
    // Also update toggleSignal helper
    const signal = signals.find(s => s.id === signalId);
    if (signal) {
      toggleSignal(signalId, !signal.enabled);
    }
  };

  const handleTestSignal = async (signal: SignalDefinition) => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/signals/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal, sampleSize: 3 }),
      });

      const data = await response.json();
      setTestResult(data.result);
    } catch (error) {
      console.error("Failed to test signal:", error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSignal = (updatedSignal: SignalDefinition) => {
    setSignals((prev) => {
      const updated = prev.map((s) => (s.id === updatedSignal.id ? updatedSignal : s));
      // Persist to localStorage
      const config = getUserConfig();
      config.signals = updated;
      saveUserConfig(config);
      return updated;
    });
    setIsEditing(false);
    setSelectedSignal(updatedSignal);
  };

  const handleCreateSignal = (newSignal: Omit<SignalDefinition, "id">) => {
    const created = addCustomSignal(newSignal);
    setSignals((prev) => [...prev, created]);
    setIsCreating(false);
    setSelectedSignal(created);
  };

  const handleDeleteSignal = (signalId: string) => {
    deleteSignal(signalId);
    setSignals((prev) => prev.filter((s) => s.id !== signalId));
    if (selectedSignal?.id === signalId) {
      setSelectedSignal(null);
    }
  };

  const enabledCount = signals.filter((s) => s.enabled && !s.isDisqualifier)
    .length;
  const disqualifierCount = signals.filter((s) => s.enabled && s.isDisqualifier)
    .length;

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Signals Studio"
        subtitle={`${enabledCount} signals active • ${disqualifierCount} disqualifiers`}
        showSearch={false}
        actions={
          activeTab === "configure" ? (
            <Button variant="default" size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4" />
              New Signal
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleDiscoverSignals}
              disabled={isDiscovering || selectedDiscoveryTypes.length === 0}
            >
              {isDiscovering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isDiscovering ? "Searching..." : "Discover Companies"}
            </Button>
          )
        }
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 px-4 py-2 border-b border-[--border] bg-[--background-secondary]">
        <button
          onClick={() => setActiveTab("configure")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "configure"
              ? "bg-[--background] text-[--foreground] shadow-sm"
              : "text-[--foreground-muted] hover:text-[--foreground]"
          )}
        >
          <Radio className="h-4 w-4" />
          Configure Signals
        </button>
        <button
          onClick={() => setActiveTab("discover")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "discover"
              ? "bg-[--background] text-[--foreground] shadow-sm"
              : "text-[--foreground-muted] hover:text-[--foreground]"
          )}
        >
          <Search className="h-4 w-4" />
          Discover Companies
        </button>
      </div>

      {/* Configure Tab Content */}
      {activeTab === "configure" && (
      <div className="flex flex-1 overflow-hidden">
        {/* Signal List */}
        <div className="w-80 border-r border-[--border] bg-[--background-secondary]">
          <ScrollArea className="h-full">
            <div className="p-4">
              {Object.entries(signalsByCategory).map(([category, categorySignals]) => {
                const config = CATEGORY_CONFIG[category as SignalCategory];
                if (categorySignals.length === 0) return null;

                return (
                  <div key={category} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <config.icon className={cn("h-4 w-4", config.color)} />
                      <span className="text-xs font-medium uppercase tracking-wider text-[--foreground-subtle]">
                        {config.label}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {categorySignals.filter((s) => s.enabled).length}/
                        {categorySignals.length}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {categorySignals.map((signal) => (
                        <button
                          key={signal.id}
                          onClick={() => {
                            setSelectedSignal(signal);
                            setIsEditing(false);
                            setTestResult(null);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            selectedSignal?.id === signal.id
                              ? "bg-[--background-tertiary] text-[--foreground]"
                              : "text-[--foreground-muted] hover:bg-[--background-tertiary] hover:text-[--foreground]"
                          )}
                        >
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              signal.enabled
                                ? signal.isDisqualifier
                                  ? "bg-[--priority-high]"
                                  : "bg-[--accent]"
                                : "bg-[--foreground-subtle]"
                            )}
                          />
                          <span className="flex-1 truncate">{signal.name}</span>
                          <Badge
                            variant={
                              signal.priority === "high"
                                ? "high"
                                : signal.priority === "medium"
                                ? "medium"
                                : "low"
                            }
                            className="text-[10px]"
                          >
                            {signal.weight}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Signal Detail */}
        <div className="flex-1 overflow-hidden">
          {selectedSignal ? (
            <ScrollArea className="h-full">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedSignal.name}
                    </h2>
                    <p className="mt-1 text-sm text-[--foreground-muted]">
                      {selectedSignal.question}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedSignal.enabled}
                      onCheckedChange={() =>
                        handleToggleSignal(selectedSignal.id)
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleTestSignal(selectedSignal)}
                      disabled={isTesting}
                    >
                      <Play className="h-4 w-4" />
                      {isTesting ? "Testing..." : "Test"}
                    </Button>
                    {selectedSignal.id.startsWith("sig_custom_") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSignal(selectedSignal.id)}
                        className="text-[--priority-high] hover:bg-[--priority-high]/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Signal Details */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[--foreground-muted]">
                          Category
                        </span>
                        <Badge variant="outline">
                          {
                            CATEGORY_CONFIG[selectedSignal.category]
                              .label
                          }
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[--foreground-muted]">
                          Priority
                        </span>
                        <Badge
                          variant={
                            selectedSignal.priority === "high"
                              ? "high"
                              : selectedSignal.priority === "medium"
                              ? "medium"
                              : "low"
                          }
                        >
                          {selectedSignal.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[--foreground-muted]">
                          Weight
                        </span>
                        <span className="font-mono font-semibold">
                          {selectedSignal.weight}/10
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[--foreground-muted]">
                          Disqualifier
                        </span>
                        <Badge
                          variant={
                            selectedSignal.isDisqualifier
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {selectedSignal.isDisqualifier ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Query Templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedSignal.queryTemplates.map((template, idx) => (
                          <Badge key={idx} variant="outline" className="font-mono text-xs">
                            {template}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Accepted Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedSignal.acceptedSources.map((source, idx) => (
                          <Badge key={idx} variant="secondary">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Test Results */}
                  {testResult && (
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-sm">Test Results</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-[--accent]">
                              {testResult.matchesFound}
                            </p>
                            <p className="text-xs text-[--foreground-muted]">
                              Matches
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">
                              {testResult.queriesExecuted.length}
                            </p>
                            <p className="text-xs text-[--foreground-muted]">
                              Queries
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">
                            Quality Checklist
                          </p>
                          <div className="space-y-2">
                            {Object.entries(testResult.qualityChecklist).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  {value ? (
                                    <CheckCircle className="h-4 w-4 text-[--score-excellent]" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-[--priority-high]" />
                                  )}
                                  <span className="text-[--foreground-muted]">
                                    {key === "isSpecific" && "Is Specific"}
                                    {key === "isObservable" && "Is Observable"}
                                    {key === "hasQualifiers" && "Has Qualifiers"}
                                    {key === "lowAmbiguity" && "Low Ambiguity"}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Radio className="mx-auto h-12 w-12 text-[--foreground-subtle]" />
                <h3 className="mt-4 text-lg font-semibold">Select a Signal</h3>
                <p className="mt-2 text-sm text-[--foreground-muted]">
                  Choose a signal from the list to view details and test
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Discover Tab Content */}
      {activeTab === "discover" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Signal Type Selection */}
          <div className="w-80 border-r border-[--border] bg-[--background-secondary] p-4">
            <h3 className="text-sm font-medium text-[--foreground-muted] uppercase tracking-wider mb-4">
              Signal Types to Find
            </h3>
            <div className="space-y-2">
              {DISCOVERY_SIGNAL_TYPES.map((signalType) => {
                const Icon = signalType.icon;
                const isSelected = selectedDiscoveryTypes.includes(signalType.id);
                return (
                  <button
                    key={signalType.id}
                    onClick={() => toggleDiscoveryType(signalType.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all",
                      isSelected
                        ? "bg-[--teal]/10 text-[--teal] border border-[--teal]/30"
                        : "text-[--foreground-muted] hover:bg-[--background-tertiary] hover:text-[--foreground] border border-transparent"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isSelected ? "text-[--teal]" : signalType.color)} />
                    <span className="flex-1">{signalType.label}</span>
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 text-[--teal]" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-[--foreground-subtle]">
              Select signal types to discover companies actively showing these buying signals.
            </p>
          </div>

          {/* Discovery Results */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                {isDiscovering ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-[--teal] mb-4" />
                    <p className="text-[--foreground-muted]">Discovering companies with selected signals...</p>
                  </div>
                ) : discoveryError ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <AlertCircle className="h-12 w-12 text-[--priority-high] mb-4" />
                    <h3 className="font-semibold mb-2">Discovery Failed</h3>
                    <p className="text-sm text-[--foreground-muted] mb-4">{discoveryError}</p>
                    <Button onClick={handleDiscoverSignals} variant="outline">
                      Try Again
                    </Button>
                  </div>
                ) : discoveredSignals.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">
                        Found {discoveredSignals.length} Companies
                      </h3>
                      <Badge variant="secondary">
                        {selectedDiscoveryTypes.length} signal types
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {discoveredSignals.map((signal, idx) => (
                        <Card key={idx} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{signal.companyName}</h4>
                                <p className="text-xs text-[--foreground-muted]">{signal.domain}</p>
                              </div>
                              <Badge
                                variant={
                                  signal.confidence === "high" ? "default" :
                                  signal.confidence === "medium" ? "secondary" : "outline"
                                }
                              >
                                {signal.confidence}
                              </Badge>
                            </div>
                            <Badge variant="outline" className="mb-2">
                              {DISCOVERY_SIGNAL_TYPES.find(t => t.id === signal.signalType)?.label || signal.signalType}
                            </Badge>
                            <p className="text-sm font-medium mb-1">{signal.title}</p>
                            <p className="text-sm text-[--foreground-muted] line-clamp-2 mb-3">
                              {signal.snippet}
                            </p>
                            <div className="flex items-center justify-between">
                              {signal.publishedAt && (
                                <span className="text-xs text-[--foreground-subtle]">
                                  {new Date(signal.publishedAt).toLocaleDateString()}
                                </span>
                              )}
                              <a
                                href={signal.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-[--teal] hover:underline"
                              >
                                View source <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Search className="h-12 w-12 text-[--foreground-subtle] mb-4" />
                    <h3 className="font-semibold mb-2">Discover Companies</h3>
                    <p className="text-sm text-[--foreground-muted] max-w-md">
                      Select signal types on the left and click "Discover Companies" to find companies
                      actively showing these buying signals.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Edit Signal Sheet */}
      <Sheet open={isEditing} onOpenChange={setIsEditing}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit Signal</SheetTitle>
            <SheetDescription>
              Modify the signal configuration
            </SheetDescription>
          </SheetHeader>
          {selectedSignal && (
            <SignalEditForm
              signal={selectedSignal}
              onSave={handleSaveSignal}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Create Signal Sheet */}
      <Sheet open={isCreating} onOpenChange={setIsCreating}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Create New Signal</SheetTitle>
            <SheetDescription>
              Define a new buying signal to track
            </SheetDescription>
          </SheetHeader>
          <SignalCreateForm
            onCreate={handleCreateSignal}
            onCancel={() => setIsCreating(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SignalEditForm({
  signal,
  onSave,
  onCancel,
}: {
  signal: SignalDefinition;
  onSave: (signal: SignalDefinition) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = React.useState(signal);

  return (
    <div className="mt-6 space-y-6">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData((f) => ({ ...f, name: e.target.value }))
          }
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="question">Question</Label>
        <Textarea
          id="question"
          value={formData.question}
          onChange={(e) =>
            setFormData((f) => ({ ...f, question: e.target.value }))
          }
          className="mt-1"
          rows={3}
        />
        <p className="mt-1 text-xs text-[--foreground-subtle]">
          Use {"{account}"} as placeholder for company name
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(v) =>
              setFormData((f) => ({ ...f, priority: v as SignalPriority }))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="weight">Weight (0-10)</Label>
          <Input
            id="weight"
            type="number"
            min={0}
            max={10}
            value={formData.weight}
            onChange={(e) =>
              setFormData((f) => ({
                ...f,
                weight: parseInt(e.target.value) || 0,
              }))
            }
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="templates">Query Templates (one per line)</Label>
        <Textarea
          id="templates"
          value={formData.queryTemplates.join("\n")}
          onChange={(e) =>
            setFormData((f) => ({
              ...f,
              queryTemplates: e.target.value.split("\n").filter(Boolean),
            }))
          }
          className="mt-1 font-mono text-sm"
          rows={4}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isDisqualifier}
          onCheckedChange={(checked) =>
            setFormData((f) => ({ ...f, isDisqualifier: checked }))
          }
        />
        <Label>Is Disqualifier</Label>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onSave(formData)} className="flex-1">
          Save Changes
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function SignalCreateForm({
  onCreate,
  onCancel,
}: {
  onCreate: (signal: Omit<SignalDefinition, "id">) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = React.useState<Omit<SignalDefinition, "id">>({
    name: "",
    question: "Has {account} ...",
    category: "funding_corporate",
    priority: "medium",
    weight: 6,
    queryTemplates: [],
    acceptedSources: ["news", "press_release", "company_site"],
    isDisqualifier: false,
    enabled: true,
  });

  const isValid = formData.name.trim() && formData.queryTemplates.length > 0;

  return (
    <div className="mt-6 space-y-6">
      <div>
        <Label htmlFor="create-name">Name</Label>
        <Input
          id="create-name"
          value={formData.name}
          onChange={(e) =>
            setFormData((f) => ({ ...f, name: e.target.value }))
          }
          placeholder="e.g., New Office Opening"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="create-question">Question</Label>
        <Textarea
          id="create-question"
          value={formData.question}
          onChange={(e) =>
            setFormData((f) => ({ ...f, question: e.target.value }))
          }
          className="mt-1"
          rows={3}
        />
        <p className="mt-1 text-xs text-[--foreground-subtle]">
          Use {"{account}"} as placeholder for company name
        </p>
      </div>

      <div>
        <Label htmlFor="create-category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(v) =>
            setFormData((f) => ({ ...f, category: v as SignalCategory }))
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="create-priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(v) =>
              setFormData((f) => ({ ...f, priority: v as SignalPriority }))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="create-weight">Weight (0-10)</Label>
          <Input
            id="create-weight"
            type="number"
            min={0}
            max={10}
            value={formData.weight}
            onChange={(e) =>
              setFormData((f) => ({
                ...f,
                weight: parseInt(e.target.value) || 0,
              }))
            }
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="create-templates">Query Templates (one per line)</Label>
        <Textarea
          id="create-templates"
          value={formData.queryTemplates.join("\n")}
          onChange={(e) =>
            setFormData((f) => ({
              ...f,
              queryTemplates: e.target.value.split("\n").filter(Boolean),
            }))
          }
          placeholder="announces new office&#10;opens location in&#10;expands headquarters"
          className="mt-1 font-mono text-sm"
          rows={4}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isDisqualifier}
          onCheckedChange={(checked) =>
            setFormData((f) => ({ ...f, isDisqualifier: checked }))
          }
        />
        <Label>Is Disqualifier</Label>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onCreate(formData)} disabled={!isValid} className="flex-1">
          Create Signal
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
