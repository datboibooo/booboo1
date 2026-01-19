"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  Key,
  Clock,
  Ban,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

export default function SettingsPage() {
  const [config, setConfig] = React.useState({
    schedule: {
      timezone: "America/New_York",
      dailyRunHour: 8,
    },
    modes: {
      huntEnabled: true,
      huntDailyLimit: 50,
      watchEnabled: false,
    },
  });
  const [dncInput, setDncInput] = React.useState("");
  const [dncList, setDncList] = React.useState<
    Array<{ type: string; value: string }>
  >([
    { type: "domain", value: "competitor.com" },
    { type: "domain", value: "blocked.io" },
  ]);

  const providerStatus = {
    llm: {
      provider: process.env.NEXT_PUBLIC_LLM_PROVIDER || "openai",
      configured: false, // Would check actual env vars
    },
    search: {
      provider: process.env.NEXT_PUBLIC_SEARCH_PROVIDER || "tavily",
      configured: false,
    },
    supabase: {
      configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
  };

  const handleAddToDNC = () => {
    if (!dncInput.trim()) return;
    setDncList((prev) => [
      ...prev,
      { type: "domain", value: dncInput.trim() },
    ]);
    setDncInput("");
  };

  const handleRemoveFromDNC = (value: string) => {
    setDncList((prev) => prev.filter((item) => item.value !== value));
  };

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Settings"
        subtitle="Configure your LeadDrip instance"
        showSearch={false}
      />

      <ScrollArea className="flex-1">
        <div className="p-6 max-w-3xl">
          {/* Provider Status */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Provider Status</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    LLM Provider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="uppercase">
                      {providerStatus.llm.provider}
                    </Badge>
                    {providerStatus.llm.configured ? (
                      <CheckCircle className="h-4 w-4 text-[--score-excellent]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[--priority-high]" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[--foreground-muted]">
                    {providerStatus.llm.configured
                      ? "API key configured"
                      : "API key missing"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Search Provider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="uppercase">
                      {providerStatus.search.provider}
                    </Badge>
                    {providerStatus.search.configured ? (
                      <CheckCircle className="h-4 w-4 text-[--score-excellent]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[--priority-high]" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[--foreground-muted]">
                    {providerStatus.search.configured
                      ? "API key configured"
                      : "API key missing"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Supabase</Badge>
                    {providerStatus.supabase.configured ? (
                      <CheckCircle className="h-4 w-4 text-[--score-excellent]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[--priority-high]" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[--foreground-muted]">
                    {providerStatus.supabase.configured
                      ? "Connected"
                      : "Not configured"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {!providerStatus.llm.configured ||
              (!providerStatus.search.configured && (
                <div className="mt-4 rounded-lg border border-[--priority-medium]/30 bg-[--priority-medium]/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-[--priority-medium] mt-0.5" />
                    <div>
                      <p className="font-medium text-[--priority-medium]">
                        Demo Mode Active
                      </p>
                      <p className="mt-1 text-sm text-[--foreground-muted]">
                        Configure API keys in your environment variables to
                        enable live lead generation.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </section>

          {/* Schedule */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Schedule</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Daily Run Schedule
                </CardTitle>
                <CardDescription>
                  When should LeadDrip generate new leads?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
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
                    <Label htmlFor="hour">Daily Run Hour</Label>
                    <Select
                      value={config.schedule.dailyRunHour.toString()}
                      onValueChange={(v) =>
                        setConfig((c) => ({
                          ...c,
                          schedule: { ...c.schedule, dailyRunHour: parseInt(v) },
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
              </CardContent>
            </Card>
          </section>

          {/* Mode Settings */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Mode Settings</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Hunt Mode</CardTitle>
                      <CardDescription>
                        Discover new accounts matching your ICP
                      </CardDescription>
                    </div>
                    <Switch
                      checked={config.modes.huntEnabled}
                      onCheckedChange={(checked) =>
                        setConfig((c) => ({
                          ...c,
                          modes: { ...c.modes, huntEnabled: checked },
                        }))
                      }
                    />
                  </div>
                </CardHeader>
                {config.modes.huntEnabled && (
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Label htmlFor="limit" className="whitespace-nowrap">
                        Daily limit:
                      </Label>
                      <Input
                        id="limit"
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
                      />
                      <span className="text-sm text-[--foreground-muted]">
                        leads per day
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Watch Mode</CardTitle>
                      <CardDescription>
                        Monitor specific accounts for new signals
                      </CardDescription>
                    </div>
                    <Switch
                      checked={config.modes.watchEnabled}
                      onCheckedChange={(checked) =>
                        setConfig((c) => ({
                          ...c,
                          modes: { ...c.modes, watchEnabled: checked },
                        }))
                      }
                    />
                  </div>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* Do Not Contact */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Do Not Contact</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Ban className="h-4 w-4" />
                  Blocked Domains
                </CardTitle>
                <CardDescription>
                  These domains will never appear in your leads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={dncInput}
                    onChange={(e) => setDncInput(e.target.value)}
                    placeholder="domain.com"
                    onKeyDown={(e) => e.key === "Enter" && handleAddToDNC()}
                  />
                  <Button onClick={handleAddToDNC}>Add</Button>
                </div>

                {dncList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {dncList.map((item) => (
                      <Badge
                        key={item.value}
                        variant="outline"
                        className="gap-1 pr-1"
                      >
                        {item.value}
                        <button
                          onClick={() => handleRemoveFromDNC(item.value)}
                          className="ml-1 rounded-full p-0.5 hover:bg-[--background-tertiary]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Export */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Data Export</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export All Data
                </CardTitle>
                <CardDescription>
                  Download all your leads, lists, and configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline">
                  <Download className="h-4 w-4" />
                  Export to CSV
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
