import { generateText, generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import {
  LLMProvider,
  LLMMessage,
  LLMCompletionOptions,
  LLMCompletionResult,
  LLMStructuredOptions,
  AIProviderType,
  AI_MODELS,
} from "./types";

// Create provider instances
function getOpenAIProvider(apiKey?: string) {
  return createOpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY,
  });
}

function getAnthropicProvider(apiKey?: string) {
  return createAnthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
  });
}

export class VercelAIProvider implements LLMProvider {
  name: string;
  private providerType: AIProviderType;
  private apiKey?: string;

  constructor(providerType: AIProviderType = "openai", apiKey?: string) {
    this.providerType = providerType;
    this.name = providerType;
    this.apiKey = apiKey;
  }

  private getModel(modelName?: string) {
    const defaultModel = AI_MODELS[this.providerType].default;
    const model = modelName || defaultModel;

    if (this.providerType === "openai") {
      const openai = getOpenAIProvider(this.apiKey);
      return openai(model);
    } else {
      const anthropic = getAnthropicProvider(this.apiKey);
      return anthropic(model);
    }
  }

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResult> {
    const model = this.getModel(options?.model);

    const result = await generateText({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 4096,
    });

    return {
      content: result.text,
      usage: {
        promptTokens: result.usage?.inputTokens || 0,
        completionTokens: result.usage?.outputTokens || 0,
        totalTokens: (result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0),
      },
    };
  }

  async completeStructured<T extends z.ZodType>(
    messages: LLMMessage[],
    structuredOptions: LLMStructuredOptions<T>,
    completionOptions?: LLMCompletionOptions
  ): Promise<z.infer<T>> {
    const model = this.getModel(completionOptions?.model);
    const maxRetries = structuredOptions.maxRetries ?? 3;

    const result = await generateObject({
      model,
      schema: structuredOptions.schema,
      schemaName: structuredOptions.schemaName,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: completionOptions?.temperature ?? 0.3,
      maxOutputTokens: completionOptions?.maxTokens ?? 4096,
      maxRetries,
    });

    return result.object as z.infer<T>;
  }
}

// Factory function to create the appropriate provider
export function createAIProvider(
  type?: AIProviderType,
  apiKey?: string
): LLMProvider {
  const providerType = type || (process.env.AI_PROVIDER as AIProviderType) || "openai";
  return new VercelAIProvider(providerType, apiKey);
}
