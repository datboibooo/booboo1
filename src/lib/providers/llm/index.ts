import { LLMProvider } from "./types";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";

export * from "./types";
export { OpenAIProvider } from "./openai";
export { AnthropicProvider } from "./anthropic";

export type LLMProviderType = "openai" | "anthropic";

let cachedProvider: LLMProvider | null = null;

export function getLLMProvider(type?: LLMProviderType): LLMProvider {
  const providerType = type || (process.env.LLM_PROVIDER as LLMProviderType) || "openai";

  // Return cached if same type
  if (cachedProvider && cachedProvider.name === providerType) {
    return cachedProvider;
  }

  switch (providerType) {
    case "openai":
      cachedProvider = new OpenAIProvider();
      break;
    case "anthropic":
      cachedProvider = new AnthropicProvider();
      break;
    default:
      throw new Error(`Unknown LLM provider: ${providerType}`);
  }

  return cachedProvider;
}

export function isLLMConfigured(): boolean {
  const provider = process.env.LLM_PROVIDER || "openai";

  if (provider === "openai") {
    return !!process.env.OPENAI_API_KEY;
  } else if (provider === "anthropic") {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  return false;
}
