/**
 * AI Provider Configuration
 * Uses Vercel AI SDK gateway pattern for multi-provider support
 */

import { z } from "zod";

// Supported AI providers
export const AIProvider = z.enum(["openai", "anthropic", "google"]);
export type AIProvider = z.infer<typeof AIProvider>;

// Model configurations per provider
export const PROVIDER_MODELS = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o", description: "Most capable, best for complex tasks", tier: "premium" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and affordable", tier: "standard" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Previous gen, good balance", tier: "premium" },
    { id: "o1-preview", name: "o1 Preview", description: "Reasoning model for complex problems", tier: "premium" },
    { id: "o1-mini", name: "o1 Mini", description: "Faster reasoning model", tier: "standard" },
  ],
  anthropic: [
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", description: "Latest, best balance of speed and quality", tier: "standard" },
    { id: "claude-opus-4-20250514", name: "Claude Opus 4", description: "Most capable for complex tasks", tier: "premium" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", description: "Fastest, great for simple tasks", tier: "budget" },
  ],
  google: [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Fast multimodal model", tier: "standard" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Long context, complex tasks", tier: "premium" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Balanced speed and quality", tier: "standard" },
  ],
} as const;

// AI Configuration schema
export const AIConfig = z.object({
  // Primary provider for most tasks
  primaryProvider: AIProvider.default("openai"),

  // Model selections per provider
  models: z.object({
    openai: z.string().default("gpt-4o-mini"),
    anthropic: z.string().default("claude-sonnet-4-20250514"),
    google: z.string().default("gemini-2.0-flash"),
  }),

  // API keys (stored encrypted in production)
  apiKeys: z.object({
    openai: z.string().optional(),
    anthropic: z.string().optional(),
    google: z.string().optional(),
  }),

  // Feature-specific provider overrides
  featureProviders: z.object({
    // Which provider to use for each feature
    research: AIProvider.optional(), // AI Search/Thinking
    outreach: AIProvider.optional(), // Email generation
    scoring: AIProvider.optional(), // Lead scoring
    extraction: AIProvider.optional(), // Signal extraction
  }),

  // Advanced settings
  settings: z.object({
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(100).max(128000).default(4096),
    streamResponses: z.boolean().default(true),
    enableFallback: z.boolean().default(true), // Fall back to secondary provider on error
    fallbackProvider: AIProvider.optional(),
    costLimit: z.number().optional(), // Monthly cost limit in dollars
  }),
});
export type AIConfig = z.infer<typeof AIConfig>;

// Default configuration
export const DEFAULT_AI_CONFIG: AIConfig = {
  primaryProvider: "openai",
  models: {
    openai: "gpt-4o-mini",
    anthropic: "claude-sonnet-4-20250514",
    google: "gemini-2.0-flash",
  },
  apiKeys: {},
  featureProviders: {},
  settings: {
    temperature: 0.7,
    maxTokens: 4096,
    streamResponses: true,
    enableFallback: true,
  },
};

// Storage key
const AI_CONFIG_KEY = "leaddrip_ai_config";

/**
 * Get AI configuration from storage
 */
export function getAIConfig(): AIConfig {
  if (typeof window === "undefined") {
    return DEFAULT_AI_CONFIG;
  }

  try {
    const stored = localStorage.getItem(AI_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return AIConfig.parse({ ...DEFAULT_AI_CONFIG, ...parsed });
    }
  } catch (error) {
    console.error("Failed to load AI config:", error);
  }

  return DEFAULT_AI_CONFIG;
}

/**
 * Save AI configuration to storage
 */
export function saveAIConfig(config: Partial<AIConfig>): AIConfig {
  const current = getAIConfig();
  const updated = { ...current, ...config };

  if (typeof window !== "undefined") {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(updated));
  }

  return updated;
}

/**
 * Check if a provider is configured (has API key)
 */
export function isProviderConfigured(provider: AIProvider, config?: AIConfig): boolean {
  const cfg = config || getAIConfig();
  const key = cfg.apiKeys[provider];
  return !!key && key.length > 10;
}

/**
 * Get the effective provider for a feature
 */
export function getProviderForFeature(
  feature: keyof AIConfig["featureProviders"],
  config?: AIConfig
): AIProvider {
  const cfg = config || getAIConfig();
  return cfg.featureProviders[feature] || cfg.primaryProvider;
}

/**
 * Get the model for a provider
 */
export function getModelForProvider(provider: AIProvider, config?: AIConfig): string {
  const cfg = config || getAIConfig();
  return cfg.models[provider];
}

/**
 * Mask API key for display
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 10) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(provider: AIProvider, key: string): boolean {
  if (!key) return false;

  switch (provider) {
    case "openai":
      return key.startsWith("sk-") && key.length > 20;
    case "anthropic":
      return key.startsWith("sk-ant-") && key.length > 20;
    case "google":
      return key.length > 20; // Google API keys have varied formats
    default:
      return false;
  }
}

// Provider display info
export const PROVIDER_INFO = {
  openai: {
    name: "OpenAI",
    description: "GPT-4o, o1 reasoning models",
    icon: "🤖",
    docsUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-...",
  },
  anthropic: {
    name: "Anthropic",
    description: "Claude Sonnet 4, Opus 4, Haiku",
    icon: "🧠",
    docsUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-...",
  },
  google: {
    name: "Google AI",
    description: "Gemini 2.0, 1.5 Pro/Flash",
    icon: "✨",
    docsUrl: "https://aistudio.google.com/app/apikey",
    keyPlaceholder: "AIza...",
  },
} as const;
