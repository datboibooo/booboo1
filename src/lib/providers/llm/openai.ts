import OpenAI from "openai";
import { z } from "zod";
import {
  LLMProvider,
  LLMMessage,
  LLMCompletionOptions,
  LLMCompletionResult,
  LLMStructuredOptions,
  LLM_MODELS,
} from "./types";
import { sleep } from "@/lib/utils";

export class OpenAIProvider implements LLMProvider {
  name = "openai";
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResult> {
    const response = await this.client.chat.completions.create({
      model: options?.model || LLM_MODELS.openai.default,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      response_format:
        options?.responseFormat === "json"
          ? { type: "json_object" }
          : undefined,
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  async completeStructured<T extends z.ZodType>(
    messages: LLMMessage[],
    structuredOptions: LLMStructuredOptions<T>,
    completionOptions?: LLMCompletionOptions
  ): Promise<z.infer<T>> {
    const maxRetries = structuredOptions.maxRetries ?? 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add JSON schema instruction to the system message
        const systemMessage: LLMMessage = {
          role: "system",
          content: `You must respond with valid JSON that matches the following schema for "${structuredOptions.schemaName}".

Response must be ONLY valid JSON, no markdown code blocks, no explanations.

Schema description: The response should be a valid ${structuredOptions.schemaName} object.`,
        };

        const allMessages = [systemMessage, ...messages];

        const result = await this.complete(allMessages, {
          ...completionOptions,
          responseFormat: "json",
          temperature: completionOptions?.temperature ?? 0.3,
        });

        // Parse and validate
        let parsed: unknown;
        try {
          parsed = JSON.parse(result.content);
        } catch {
          throw new Error(`Invalid JSON response: ${result.content.slice(0, 200)}`);
        }

        const validated = structuredOptions.schema.parse(parsed);
        return validated;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await sleep(1000 * (attempt + 1));
        }
      }
    }

    throw new Error(
      `Failed to get valid structured response after ${maxRetries} attempts: ${lastError?.message}`
    );
  }
}
