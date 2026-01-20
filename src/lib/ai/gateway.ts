/**
 * AI Gateway - Unified interface to multiple AI providers
 * Uses Vercel AI SDK for consistent API across providers
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, streamText, generateObject, LanguageModel } from "ai";
import { z } from "zod";
import {
  AIConfig,
  AIProvider,
  getAIConfig,
  getProviderForFeature,
  getModelForProvider,
  isProviderConfigured,
} from "./config";

// Feature types for routing
export type AIFeature = "research" | "outreach" | "scoring" | "extraction" | "general";

// Gateway options
export interface GatewayOptions {
  feature?: AIFeature;
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Response type
export interface GatewayResponse {
  text: string;
  provider: AIProvider;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Create a provider client based on configuration
 */
function createProviderClient(
  provider: AIProvider,
  config: AIConfig
): { client: ReturnType<typeof createOpenAI> | ReturnType<typeof createAnthropic>; model: LanguageModel } | null {
  const apiKey = config.apiKeys[provider];

  if (!apiKey) {
    return null;
  }

  const modelId = config.models[provider];

  switch (provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return { client: openai, model: openai(modelId) };
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return { client: anthropic, model: anthropic(modelId) };
    }
    case "google": {
      // Google support via OpenAI-compatible endpoint or separate SDK
      // For now, fall back to OpenAI if Google selected but not fully supported
      console.warn("Google AI support coming soon, falling back to available provider");
      return null;
    }
    default:
      return null;
  }
}

/**
 * Get the best available provider
 */
function getBestProvider(preferredProvider: AIProvider, config: AIConfig): AIProvider | null {
  // Try preferred first
  if (isProviderConfigured(preferredProvider, config)) {
    return preferredProvider;
  }

  // Try fallback
  if (config.settings.enableFallback && config.settings.fallbackProvider) {
    if (isProviderConfigured(config.settings.fallbackProvider, config)) {
      return config.settings.fallbackProvider;
    }
  }

  // Try any configured provider
  const providers: AIProvider[] = ["openai", "anthropic", "google"];
  for (const p of providers) {
    if (isProviderConfigured(p, config)) {
      return p;
    }
  }

  return null;
}

/**
 * AI Gateway class for making requests
 */
export class AIGateway {
  private config: AIConfig;

  constructor(config?: AIConfig) {
    this.config = config || getAIConfig();
  }

  /**
   * Update configuration
   */
  updateConfig(config: AIConfig) {
    this.config = config;
  }

  /**
   * Check if any provider is available
   */
  isAvailable(): boolean {
    return getBestProvider(this.config.primaryProvider, this.config) !== null;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = ["openai", "anthropic", "google"];
    return providers.filter((p) => isProviderConfigured(p, this.config));
  }

  /**
   * Generate text (non-streaming)
   */
  async generate(
    prompt: string,
    systemPrompt?: string,
    options?: GatewayOptions
  ): Promise<GatewayResponse> {
    const feature = options?.feature || "general";
    const preferredProvider = options?.provider || getProviderForFeature(
      feature as keyof AIConfig["featureProviders"],
      this.config
    );

    const provider = getBestProvider(preferredProvider, this.config);
    if (!provider) {
      throw new Error("No AI provider configured. Please add an API key in Settings.");
    }

    const clientInfo = createProviderClient(provider, this.config);
    if (!clientInfo) {
      throw new Error(`Failed to initialize ${provider} client`);
    }

    const { model } = clientInfo;

    const result = await generateText({
      model,
      prompt,
      system: systemPrompt,
      temperature: options?.temperature ?? this.config.settings.temperature,
    });

    return {
      text: result.text,
      provider,
      model: this.config.models[provider],
      usage: result.usage,
    };
  }

  /**
   * Generate with structured output
   */
  async generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemPrompt?: string,
    options?: GatewayOptions
  ): Promise<{ data: T; provider: AIProvider; model: string }> {
    const feature = options?.feature || "general";
    const preferredProvider = options?.provider || getProviderForFeature(
      feature as keyof AIConfig["featureProviders"],
      this.config
    );

    const provider = getBestProvider(preferredProvider, this.config);
    if (!provider) {
      throw new Error("No AI provider configured. Please add an API key in Settings.");
    }

    const clientInfo = createProviderClient(provider, this.config);
    if (!clientInfo) {
      throw new Error(`Failed to initialize ${provider} client`);
    }

    const { model } = clientInfo;

    const result = await generateObject({
      model,
      prompt,
      system: systemPrompt,
      schema,
      temperature: options?.temperature ?? this.config.settings.temperature,
    });

    return {
      data: result.object,
      provider,
      model: this.config.models[provider],
    };
  }

  /**
   * Stream text generation
   */
  async *stream(
    prompt: string,
    systemPrompt?: string,
    options?: GatewayOptions
  ): AsyncGenerator<string, GatewayResponse, unknown> {
    const feature = options?.feature || "general";
    const preferredProvider = options?.provider || getProviderForFeature(
      feature as keyof AIConfig["featureProviders"],
      this.config
    );

    const provider = getBestProvider(preferredProvider, this.config);
    if (!provider) {
      throw new Error("No AI provider configured. Please add an API key in Settings.");
    }

    const clientInfo = createProviderClient(provider, this.config);
    if (!clientInfo) {
      throw new Error(`Failed to initialize ${provider} client`);
    }

    const { model } = clientInfo;

    const result = streamText({
      model,
      prompt,
      system: systemPrompt,
      temperature: options?.temperature ?? this.config.settings.temperature,
    });

    let fullText = "";

    for await (const chunk of result.textStream) {
      fullText += chunk;
      yield chunk;
    }

    const finalResult = await result;
    const usage = await finalResult.usage;

    return {
      text: fullText,
      provider,
      model: this.config.models[provider],
      usage,
    };
  }
}

// Singleton instance
let gatewayInstance: AIGateway | null = null;

/**
 * Get the AI gateway instance
 */
export function getAIGateway(): AIGateway {
  if (!gatewayInstance) {
    gatewayInstance = new AIGateway();
  }
  return gatewayInstance;
}

/**
 * Reset the gateway (useful when config changes)
 */
export function resetAIGateway(): void {
  gatewayInstance = null;
}

// Convenience functions

/**
 * Quick generate text
 */
export async function aiGenerate(
  prompt: string,
  options?: GatewayOptions & { system?: string }
): Promise<string> {
  const gateway = getAIGateway();
  const result = await gateway.generate(prompt, options?.system, options);
  return result.text;
}

/**
 * Quick structured generation
 */
export async function aiGenerateStructured<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  options?: GatewayOptions & { system?: string }
): Promise<T> {
  const gateway = getAIGateway();
  const result = await gateway.generateStructured(prompt, schema, options?.system, options);
  return result.data;
}
