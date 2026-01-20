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
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserConfig, saveUserConfig, getStoredLeads, getWatchLists, resetAllData } from "@/lib/store";
import { AISettings } from "@/components/settings/ai-settings";

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
  >([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState("");

  // Load config from localStorage on mount
  React.useEffect(() => {
    const stored = getUserConfig();
    setConfig({
      schedule: stored.schedule,
      modes: stored.modes,
    });
    // Load DNC list (we'll store it in localStorage too)
    const dncStored = localStorage.getItem("leaddrip_dnc_list");
    if (dncStored) {
      setDncList(JSON.parse(dncStored));
    }
  }, []);

  // Auto-save config when it changes
  const saveConfig = React.useCallback(() => {
    const stored = getUserConfig();
    stored.schedule = config.schedule;
    stored.modes = config.modes;
    saveUserConfig(stored);
    setIsSaving(true);
    setSaveMessage("Saved");
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage("");
    }, 2000);
  }, [config]);

  // Debounced save
  React.useEffect(() => {
    const timer = setTimeout(saveConfig, 500);
    return () => clearTimeout(timer);
  }, [config, saveConfig]);

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
    const newList = [
      ...dncList,
      { type: "domain", value: dncInput.trim() },
    ];
    setDncList(newList);
    localStorage.setItem("leaddrip_dnc_list", JSON.stringify(newList));
    setDncInput("");
  };

  const handleRemoveFromDNC = (value: string) => {
    const newList = dncList.filter((item) => item.value !== value);
    setDncList(newList);
    localStorage.setItem("leaddrip_dnc_list", JSON.stringify(newList));
  };

  const handleExportData = () => {
    const leads = getStoredLeads();
    const lists = getWatchLists();
    const userConfig = getUserConfig();

    const exportData = {
      exportedAt: new Date().toISOString(),
      leads,
      lists,
      config: userConfig,
      dncList,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leaddrip-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      resetAllData();
      localStorage.removeItem("leaddrip_dnc_list");
      window.location.reload();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Settings"
        subtitle={saveMessage || "Configure your LeadDrip instance"}
        showSearch={false}
      />

      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl">
          {/* AI Configuration - Primary Section */}
          <section className="mb-8">
            <AISettings />
          </section>

          {/* Provider Status */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Integration Status</h2>
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
              <CardContent className="flex gap-2">
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4" />
                  Export to JSON
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Danger Zone */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-[--priority-high]">Danger Zone</h2>
            <Card className="border-[--priority-high]/30">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-[--priority-high]">
                  <Trash2 className="h-4 w-4" />
                  Reset All Data
                </CardTitle>
                <CardDescription>
                  Permanently delete all leads, lists, and settings. This cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={handleResetData} className="text-[--priority-high] border-[--priority-high]/30 hover:bg-[--priority-high]/10">
                  <Trash2 className="h-4 w-4" />
                  Reset Everything
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
