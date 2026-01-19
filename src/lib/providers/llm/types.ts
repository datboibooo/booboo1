import { z } from "zod";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

export interface LLMCompletionResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMStructuredOptions<T extends z.ZodType> {
  schema: T;
  schemaName: string;
  maxRetries?: number;
}

export interface LLMProvider {
  name: string;
  complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResult>;
  completeStructured<T extends z.ZodType>(
    messages: LLMMessage[],
    structuredOptions: LLMStructuredOptions<T>,
    completionOptions?: LLMCompletionOptions
  ): Promise<z.infer<T>>;
}

export const LLM_MODELS = {
  openai: {
    default: "gpt-4o",
    fast: "gpt-4o-mini",
  },
  anthropic: {
    default: "claude-sonnet-4-20250514",
    fast: "claude-3-5-haiku-20241022",
  },
} as const;
