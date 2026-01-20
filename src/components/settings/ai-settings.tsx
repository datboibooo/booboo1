"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  Zap,
  Brain,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AIConfig,
  AIProvider,
  PROVIDER_INFO,
  PROVIDER_MODELS,
  getAIConfig,
  saveAIConfig,
  maskApiKey,
  validateApiKeyFormat,
  isProviderConfigured,
} from "@/lib/ai/config";
import { resetAIGateway } from "@/lib/ai/gateway";

interface ProviderCardProps {
  provider: AIProvider;
  config: AIConfig;
  onUpdateKey: (provider: AIProvider, key: string) => void;
  onUpdateModel: (provider: AIProvider, model: string) => void;
  isPrimary: boolean;
  onSetPrimary: () => void;
}

function ProviderCard({
  provider,
  config,
  onUpdateKey,
  onUpdateModel,
  isPrimary,
  onSetPrimary,
}: ProviderCardProps) {
  const [showKey, setShowKey] = React.useState(false);
  const [keyInput, setKeyInput] = React.useState("");
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
    latency?: number;
  } | null>(null);

  const info = PROVIDER_INFO[provider];
  const models = PROVIDER_MODELS[provider];
  const isConfigured = isProviderConfigured(provider, config);
  const currentKey = config.apiKeys[provider] || "";
  const currentModel = config.models[provider];

  const handleSaveKey = () => {
    if (keyInput) {
      onUpdateKey(provider, keyInput);
      setKeyInput("");
      setTestResult(null);
    }
  };

  const handleRemoveKey = () => {
    onUpdateKey(provider, "");
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    const key = keyInput || currentKey;
    if (!key) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: key }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: `Connected! Response in ${data.latency}ms`,
          latency: data.latency,
        });
        // Auto-save if testing a new key
        if (keyInput) {
          onUpdateKey(provider, keyInput);
          setKeyInput("");
        }
      } else {
        setTestResult({
          success: false,
          message: data.error || "Connection failed",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Network error - could not test connection",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className={cn(isPrimary && "ring-2 ring-[--accent]")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{info.icon}</span>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {info.name}
                {isPrimary && (
                  <Badge variant="default" className="text-xs">
                    Primary
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {info.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <CheckCircle className="h-5 w-5 text-[--score-excellent]" />
            ) : (
              <XCircle className="h-5 w-5 text-[--foreground-subtle]" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">API Key</Label>
            <a
              href={info.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[--accent] hover:underline flex items-center gap-1"
            >
              Get key <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {isConfigured && !keyInput ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-[--background-tertiary] text-sm font-mono">
                {showKey ? currentKey : maskApiKey(currentKey)}
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="ml-auto text-[--foreground-subtle] hover:text-[--foreground]"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={handleRemoveKey}>
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={info.keyPlaceholder}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveKey}
                disabled={!keyInput || !validateApiKeyFormat(provider, keyInput)}
              >
                Save
              </Button>
            </div>
          )}

          {keyInput && !validateApiKeyFormat(provider, keyInput) && (
            <p className="text-xs text-[--priority-high]">
              Invalid key format. {provider === "openai" ? "Should start with 'sk-'" : provider === "anthropic" ? "Should start with 'sk-ant-'" : "Check the format"}
            </p>
          )}
        </div>

        {/* Test Connection */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={isTesting || (!currentKey && !keyInput)}
            className="gap-1"
          >
            {isTesting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
            Test Connection
          </Button>
          {testResult && (
            <span
              className={cn(
                "text-xs",
                testResult.success ? "text-[--score-excellent]" : "text-[--priority-high]"
              )}
            >
              {testResult.message}
            </span>
          )}
        </div>

        {/* Model Selection */}
        {isConfigured && (
          <div className="space-y-2">
            <Label className="text-xs">Model</Label>
            <Select value={currentModel} onValueChange={(v) => onUpdateModel(provider, v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          model.tier === "premium" && "border-[--priority-medium] text-[--priority-medium]",
                          model.tier === "budget" && "border-[--score-excellent] text-[--score-excellent]"
                        )}
                      >
                        {model.tier}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[--foreground-muted]">
              {models.find((m) => m.id === currentModel)?.description}
            </p>
          </div>
        )}

        {/* Set as Primary */}
        {isConfigured && !isPrimary && (
          <Button variant="ghost" size="sm" onClick={onSetPrimary} className="w-full">
            Set as Primary Provider
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function AISettings() {
  const [config, setConfig] = React.useState<AIConfig>(getAIConfig());
  const [isSaving, setIsSaving] = React.useState(false);

  // Save config whenever it changes
  const updateConfig = React.useCallback((updates: Partial<AIConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...updates };
      saveAIConfig(updated);
      resetAIGateway(); // Reset gateway to pick up new config
      return updated;
    });
  }, []);

  const handleUpdateKey = (provider: AIProvider, key: string) => {
    updateConfig({
      apiKeys: { ...config.apiKeys, [provider]: key },
    });
  };

  const handleUpdateModel = (provider: AIProvider, model: string) => {
    updateConfig({
      models: { ...config.models, [provider]: model },
    });
  };

  const handleSetPrimary = (provider: AIProvider) => {
    updateConfig({ primaryProvider: provider });
  };

  const configuredProviders = (["openai", "anthropic", "google"] as AIProvider[]).filter(
    (p) => isProviderConfigured(p, config)
  );

  return (
    <div className="space-y-6">
      {/* AI Providers Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-[--accent]" />
          <h2 className="text-lg font-semibold">AI Providers</h2>
        </div>
        <p className="text-sm text-[--foreground-muted] mb-4">
          Configure your AI providers. LeadDrip uses these for research, outreach generation, and lead scoring.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(["openai", "anthropic", "google"] as AIProvider[]).map((provider) => (
            <ProviderCard
              key={provider}
              provider={provider}
              config={config}
              onUpdateKey={handleUpdateKey}
              onUpdateModel={handleUpdateModel}
              isPrimary={config.primaryProvider === provider}
              onSetPrimary={() => handleSetPrimary(provider)}
            />
          ))}
        </div>

        {configuredProviders.length === 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-[--border] bg-[--background-secondary] p-6 text-center">
            <Sparkles className="h-8 w-8 mx-auto text-[--foreground-subtle] mb-2" />
            <p className="text-sm text-[--foreground-muted]">
              No AI providers configured yet. Add an API key to enable AI features.
            </p>
          </div>
        )}
      </section>

      {/* Feature Routing */}
      {configuredProviders.length > 1 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="h-5 w-5 text-[--accent]" />
            <h2 className="text-lg font-semibold">Feature Routing</h2>
          </div>
          <p className="text-sm text-[--foreground-muted] mb-4">
            Optionally use different providers for specific features.
          </p>

          <Card>
            <CardContent className="pt-4 space-y-4">
              {[
                { key: "research" as const, label: "AI Search & Research", description: "Complex queries and analysis" },
                { key: "outreach" as const, label: "Outreach Generation", description: "Email and message drafting" },
                { key: "scoring" as const, label: "Lead Scoring", description: "Evaluating lead quality" },
                { key: "extraction" as const, label: "Signal Extraction", description: "Parsing data from sources" },
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{feature.label}</p>
                    <p className="text-xs text-[--foreground-muted]">{feature.description}</p>
                  </div>
                  <Select
                    value={config.featureProviders[feature.key] || "default"}
                    onValueChange={(v) => {
                      updateConfig({
                        featureProviders: {
                          ...config.featureProviders,
                          [feature.key]: v === "default" ? undefined : (v as AIProvider),
                        },
                      });
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">
                        Use Primary ({PROVIDER_INFO[config.primaryProvider].name})
                      </SelectItem>
                      {configuredProviders.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PROVIDER_INFO[p].name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Advanced Settings */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-5 w-5 text-[--accent]" />
          <h2 className="text-lg font-semibold">Advanced Settings</h2>
        </div>

        <Card>
          <CardContent className="pt-4 space-y-6">
            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <span className="text-sm text-[--foreground-muted]">
                  {config.settings.temperature}
                </span>
              </div>
              <Slider
                value={[config.settings.temperature]}
                min={0}
                max={2}
                step={0.1}
                onValueChange={([v]) => {
                  updateConfig({
                    settings: { ...config.settings, temperature: v },
                  });
                }}
              />
              <p className="text-xs text-[--foreground-muted]">
                Lower = more focused, higher = more creative
              </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <Label>Max Output Tokens</Label>
              <Select
                value={config.settings.maxTokens.toString()}
                onValueChange={(v) => {
                  updateConfig({
                    settings: { ...config.settings, maxTokens: parseInt(v) },
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024">1,024 (Short)</SelectItem>
                  <SelectItem value="2048">2,048 (Medium)</SelectItem>
                  <SelectItem value="4096">4,096 (Default)</SelectItem>
                  <SelectItem value="8192">8,192 (Long)</SelectItem>
                  <SelectItem value="16384">16,384 (Very Long)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Streaming */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Stream Responses</Label>
                <p className="text-xs text-[--foreground-muted]">
                  Show AI responses as they generate
                </p>
              </div>
              <Switch
                checked={config.settings.streamResponses}
                onCheckedChange={(checked) => {
                  updateConfig({
                    settings: { ...config.settings, streamResponses: checked },
                  });
                }}
              />
            </div>

            {/* Fallback */}
            {configuredProviders.length > 1 && (
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Fallback</Label>
                  <p className="text-xs text-[--foreground-muted]">
                    Use backup provider if primary fails
                  </p>
                </div>
                <Switch
                  checked={config.settings.enableFallback}
                  onCheckedChange={(checked) => {
                    updateConfig({
                      settings: { ...config.settings, enableFallback: checked },
                    });
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
