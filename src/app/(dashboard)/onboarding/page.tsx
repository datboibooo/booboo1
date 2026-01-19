"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap,
  Target,
  Radio,
  Settings2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SIGNAL_PRESETS,
  getAllDefaultSignals,
  DEFAULT_USER_CONFIG,
} from "@/lib/fixtures/demo-data";
import { UserConfig, SignalDefinition, SignalCategory } from "@/lib/schemas";

const STEPS = [
  { id: 1, title: "What You Sell", icon: Zap },
  { id: 2, title: "ICP Builder", icon: Target },
  { id: 3, title: "Signals", icon: Radio },
  { id: 4, title: "Modes", icon: Settings2 },
  { id: 5, title: "Schedule", icon: Clock },
];

const INDUSTRIES = [
  "Technology",
  "Software",
  "SaaS",
  "FinTech",
  "Healthcare",
  "Healthcare IT",
  "E-commerce",
  "Manufacturing",
  "Financial Services",
  "Retail",
  "Media & Entertainment",
  "Education",
  "Real Estate",
  "Transportation & Logistics",
  "Energy",
  "Telecommunications",
];

const GEOS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "Singapore",
  "Japan",
  "India",
  "Brazil",
  "Mexico",
  "Netherlands",
  "Sweden",
  "Switzerland",
];

const COMPANY_SIZES = [
  { label: "1-10 employees", min: 1, max: 10 },
  { label: "11-50 employees", min: 11, max: 50 },
  { label: "51-200 employees", min: 51, max: 200 },
  { label: "201-500 employees", min: 201, max: 500 },
  { label: "501-1000 employees", min: 501, max: 1000 },
  { label: "1001-5000 employees", min: 1001, max: 5000 },
  { label: "5000+ employees", min: 5001, max: null },
];

const DEFAULT_ROLES = [
  "CEO",
  "CTO",
  "CFO",
  "COO",
  "VP of Sales",
  "VP of Marketing",
  "VP of Engineering",
  "Head of Sales",
  "Head of Marketing",
  "Head of Growth",
  "Sales Director",
  "Marketing Director",
  "Product Manager",
  "Engineering Manager",
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [config, setConfig] = React.useState<UserConfig>({
    ...DEFAULT_USER_CONFIG,
    signals: getAllDefaultSignals(),
  });
  const [customRole, setCustomRole] = React.useState("");

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    const finalConfig = { ...config, onboardingComplete: true };

    try {
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalConfig),
      });
    } catch (error) {
      console.error("Failed to save config:", error);
    }

    router.push("/drip");
  };

  const toggleArrayItem = <T,>(array: T[], item: T): T[] => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[--background] flex flex-col">
      {/* Header */}
      <div className="border-b border-[--border] bg-[--background-secondary]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--accent]">
              <Zap className="h-4 w-4 text-[--background]" />
            </div>
            <span className="text-lg font-bold">LeadDrip Setup</span>
          </div>

          {/* Progress */}
          <Progress value={progress} className="h-1" />

          {/* Steps */}
          <div className="flex items-center justify-between mt-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  currentStep >= step.id
                    ? "text-[--foreground]"
                    : "text-[--foreground-subtle]"
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    currentStep > step.id
                      ? "bg-[--accent] text-[--background]"
                      : currentStep === step.id
                      ? "border-2 border-[--accent] text-[--accent]"
                      : "border border-[--border]"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="hidden md:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Step 1: What You Sell */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold">What do you sell?</h2>
                <p className="mt-2 text-[--foreground-muted]">
                  Describe your product or service in a few sentences. This
                  helps LeadDrip find relevant signals.
                </p>
              </div>

              <div>
                <Label htmlFor="offer">Your Offer</Label>
                <Textarea
                  id="offer"
                  value={config.offer}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, offer: e.target.value }))
                  }
                  placeholder="e.g., We provide AI-powered sales intelligence that helps B2B teams find high-intent prospects and personalize outreach at scale."
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 2: ICP Builder */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold">Define your ICP</h2>
                <p className="mt-2 text-[--foreground-muted]">
                  Who are your ideal customers? The more specific, the better
                  your leads.
                </p>
              </div>

              {/* Industries */}
              <div>
                <Label>Industries</Label>
                <p className="text-sm text-[--foreground-muted] mb-2">
                  Select target industries
                </p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((industry) => (
                    <Badge
                      key={industry}
                      variant={
                        config.icp.industries.includes(industry)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        setConfig((c) => ({
                          ...c,
                          icp: {
                            ...c.icp,
                            industries: toggleArrayItem(
                              c.icp.industries,
                              industry
                            ),
                          },
                        }))
                      }
                    >
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Geographies */}
              <div>
                <Label>Geographies</Label>
                <p className="text-sm text-[--foreground-muted] mb-2">
                  Select target regions
                </p>
                <div className="flex flex-wrap gap-2">
                  {GEOS.map((geo) => (
                    <Badge
                      key={geo}
                      variant={
                        config.icp.geos.includes(geo) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        setConfig((c) => ({
                          ...c,
                          icp: {
                            ...c.icp,
                            geos: toggleArrayItem(c.icp.geos, geo),
                          },
                        }))
                      }
                    >
                      {geo}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Company Size */}
              <div>
                <Label>Company Size</Label>
                <p className="text-sm text-[--foreground-muted] mb-2">
                  Select target company sizes
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {COMPANY_SIZES.map((size) => {
                    const isSelected =
                      config.icp.companySizeRange?.min === size.min;
                    return (
                      <Button
                        key={size.label}
                        variant={isSelected ? "default" : "outline"}
                        className="justify-start"
                        onClick={() =>
                          setConfig((c) => ({
                            ...c,
                            icp: {
                              ...c.icp,
                              companySizeRange: isSelected
                                ? null
                                : { min: size.min, max: size.max },
                            },
                          }))
                        }
                      >
                        {size.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Target Roles */}
              <div>
                <Label>Target Buyer Roles</Label>
                <p className="text-sm text-[--foreground-muted] mb-2">
                  Who should we find at these companies?
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {config.icp.targetRoles.map((role) => (
                    <Badge key={role} variant="default" className="gap-1 pr-1">
                      {role}
                      <button
                        onClick={() =>
                          setConfig((c) => ({
                            ...c,
                            icp: {
                              ...c.icp,
                              targetRoles: c.icp.targetRoles.filter(
                                (r) => r !== role
                              ),
                            },
                          }))
                        }
                        className="ml-1 rounded-full p-0.5 hover:bg-[--background-tertiary]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Select
                    value=""
                    onValueChange={(v) =>
                      setConfig((c) => ({
                        ...c,
                        icp: {
                          ...c.icp,
                          targetRoles: [...c.icp.targetRoles, v],
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add a role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_ROLES.filter(
                        (r) => !config.icp.targetRoles.includes(r)
                      ).map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="Custom role"
                      className="w-32"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (customRole.trim()) {
                          setConfig((c) => ({
                            ...c,
                            icp: {
                              ...c.icp,
                              targetRoles: [...c.icp.targetRoles, customRole],
                            },
                          }));
                          setCustomRole("");
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Signals */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold">Configure Signals</h2>
                <p className="mt-2 text-[--foreground-muted]">
                  Select which buying signals to track. You can customize these
                  later.
                </p>
              </div>

              {Object.entries(DEFAULT_SIGNAL_PRESETS).map(
                ([category, signals]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-sm capitalize">
                        {category.replace("_", " & ")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {signals.map((signal) => {
                          const isEnabled = config.signals.find(
                            (s) => s.id === signal.id
                          )?.enabled;
                          return (
                            <div
                              key={signal.id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {signal.name}
                                </p>
                                <p className="text-xs text-[--foreground-muted]">
                                  {signal.question.replace("{account}", "...")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    signal.priority === "high"
                                      ? "high"
                                      : signal.priority === "medium"
                                      ? "medium"
                                      : "low"
                                  }
                                >
                                  {signal.priority}
                                </Badge>
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={(checked) =>
                                    setConfig((c) => ({
                                      ...c,
                                      signals: c.signals.map((s) =>
                                        s.id === signal.id
                                          ? { ...s, enabled: checked }
                                          : s
                                      ),
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}

          {/* Step 4: Modes */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold">Choose Your Modes</h2>
                <p className="mt-2 text-[--foreground-muted]">
                  How do you want to use LeadDrip?
                </p>
              </div>

              <Card
                className={cn(
                  "cursor-pointer transition-colors",
                  config.modes.huntEnabled && "border-[--accent]"
                )}
                onClick={() =>
                  setConfig((c) => ({
                    ...c,
                    modes: { ...c.modes, huntEnabled: !c.modes.huntEnabled },
                  }))
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[--accent-subtle]">
                        <Target className="h-5 w-5 text-[--accent]" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Hunt Mode</CardTitle>
                        <p className="text-sm text-[--foreground-muted]">
                          Discover net-new accounts daily
                        </p>
                      </div>
                    </div>
                    <Switch checked={config.modes.huntEnabled} />
                  </div>
                </CardHeader>
                {config.modes.huntEnabled && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4">
                      <Label>Daily limit:</Label>
                      <Input
                        type="number"
                        min={10}
                        max={100}
                        value={config.modes.huntDailyLimit}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            modes: {
                              ...c.modes,
                              huntDailyLimit: parseInt(e.target.value) || 50,
                            },
                          }))
                        }
                        className="w-20"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm text-[--foreground-muted]">
                        leads per day
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>

              <Card
                className={cn(
                  "cursor-pointer transition-colors",
                  config.modes.watchEnabled && "border-[--accent]"
                )}
                onClick={() =>
                  setConfig((c) => ({
                    ...c,
                    modes: { ...c.modes, watchEnabled: !c.modes.watchEnabled },
                  }))
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[--accent-subtle]">
                        <Radio className="h-5 w-5 text-[--accent]" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Watch Mode</CardTitle>
                        <p className="text-sm text-[--foreground-muted]">
                          Monitor specific accounts for signals
                        </p>
                      </div>
                    </div>
                    <Switch checked={config.modes.watchEnabled} />
                  </div>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Step 5: Schedule */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold">Set Your Schedule</h2>
                <p className="mt-2 text-[--foreground-muted]">
                  When should LeadDrip deliver your daily drip?
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Timezone</Label>
                  <Select
                    value={config.schedule.timezone}
                    onValueChange={(v) =>
                      setConfig((c) => ({
                        ...c,
                        schedule: { ...c.schedule, timezone: v },
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Daily Run Time</Label>
                  <Select
                    value={config.schedule.dailyRunHour.toString()}
                    onValueChange={(v) =>
                      setConfig((c) => ({
                        ...c,
                        schedule: {
                          ...c.schedule,
                          dailyRunHour: parseInt(v),
                        },
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }).map((_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i === 0
                            ? "12:00 AM"
                            : i < 12
                            ? `${i}:00 AM`
                            : i === 12
                            ? "12:00 PM"
                            : `${i - 12}:00 PM`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="bg-[--accent-subtle] border-[--accent]">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[--accent]" />
                    <div>
                      <p className="font-medium">You're all set!</p>
                      <p className="text-sm text-[--foreground-muted]">
                        Click "Launch LeadDrip" to start discovering leads.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[--border] bg-[--background-secondary]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button onClick={handleNext}>
            {currentStep === STEPS.length ? (
              <>
                <Zap className="h-4 w-4" />
                Launch LeadDrip
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
