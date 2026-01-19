import { LLMProvider, AIProviderType } from "./types";
import { VercelAIProvider, createAIProvider } from "./vercel-ai";

export * from "./types";
export { VercelAIProvider, createAIProvider } from "./vercel-ai";

// Backwards compatibility exports
export type LLMProviderType = AIProviderType;

let cachedProvider: LLMProvider | null = null;
let cachedProviderType: AIProviderType | null = null;

export function getLLMProvider(type?: AIProviderType): LLMProvider {
  const providerType = type || (process.env.AI_PROVIDER as AIProviderType) || "openai";

  // Return cached if same type
  if (cachedProvider && cachedProviderType === providerType) {
    return cachedProvider;
  }

  cachedProvider = createAIProvider(providerType);
  cachedProviderType = providerType;

  return cachedProvider;
}

export function isLLMConfigured(): boolean {
  const provider = process.env.AI_PROVIDER || "openai";

  if (provider === "openai") {
    return !!process.env.OPENAI_API_KEY;
  } else if (provider === "anthropic") {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  return false;
}

// Clear the cache (useful for testing)
export function clearProviderCache(): void {
  cachedProvider = null;
  cachedProviderType = null;
}
