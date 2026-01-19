import Anthropic from "@anthropic-ai/sdk";
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

export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResult> {
    // Extract system message if present
    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const response = await this.client.messages.create({
      model: options?.model || LLM_MODELS.anthropic.default,
      max_tokens: options?.maxTokens ?? 4096,
      system: systemMessages.map((m) => m.content).join("\n\n") || undefined,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const textContent = response.content.find((c) => c.type === "text");
    return {
      content: textContent?.type === "text" ? textContent.text : "",
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
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
        // Add JSON instruction to the last user message
        const augmentedMessages = [...messages];
        const jsonInstruction = `

IMPORTANT: You must respond with ONLY valid JSON that matches the "${structuredOptions.schemaName}" schema.
No markdown code blocks, no explanations, no text before or after the JSON.
Just pure, valid JSON.`;

        if (augmentedMessages.length > 0) {
          const lastIdx = augmentedMessages.length - 1;
          if (augmentedMessages[lastIdx].role === "user") {
            augmentedMessages[lastIdx] = {
              ...augmentedMessages[lastIdx],
              content: augmentedMessages[lastIdx].content + jsonInstruction,
            };
          } else {
            augmentedMessages.push({
              role: "user",
              content: jsonInstruction,
            });
          }
        }

        const result = await this.complete(augmentedMessages, {
          ...completionOptions,
          temperature: completionOptions?.temperature ?? 0.3,
        });

        // Extract JSON from response (handle potential markdown)
        let jsonStr = result.content.trim();

        // Remove markdown code blocks if present
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.slice(7);
        } else if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith("```")) {
          jsonStr = jsonStr.slice(0, -3);
        }
        jsonStr = jsonStr.trim();

        // Parse and validate
        let parsed: unknown;
        try {
          parsed = JSON.parse(jsonStr);
        } catch {
          throw new Error(`Invalid JSON response: ${jsonStr.slice(0, 200)}`);
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
