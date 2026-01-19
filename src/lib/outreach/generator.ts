import { createId } from "@paralleldrive/cuid2";
import {
  GenerateOutreachInput,
  GenerateOutreachOutput,
  OutreachMessage,
  OutreachTone,
  OutreachChannel,
} from "./types";

// Tone-specific instructions
const TONE_INSTRUCTIONS: Record<OutreachTone, string> = {
  professional: `
    - Use formal business language
    - Lead with credibility and specific data
    - Be respectful of their time
    - Include a clear, professional call-to-action
  `,
  conversational: `
    - Write like a helpful peer, not a salesperson
    - Use contractions and natural language
    - Be genuine and human
    - Make the ask feel like a friendly chat
  `,
  provocative: `
    - Open with a pattern-interrupt or bold statement
    - Challenge assumptions or status quo
    - Be memorable and different
    - Create curiosity without being gimmicky
  `,
  concise: `
    - Maximum 50 words for email body, 20 for LinkedIn
    - Get straight to the point
    - One clear ask
    - Respect that they're busy
  `,
};

// Channel-specific constraints
const CHANNEL_CONSTRAINTS: Record<OutreachChannel, { maxLength: number; includeSubject: boolean }> = {
  email: { maxLength: 150, includeSubject: true },
  linkedin: { maxLength: 300, includeSubject: false }, // LinkedIn connection limit
  twitter: { maxLength: 280, includeSubject: false },
};

function buildPrompt(input: GenerateOutreachInput): string {
  const { channel, tone, companyName, domain, whyNow, signals, verification, senderName, senderCompany, senderValue } = input;
  const constraints = CHANNEL_CONSTRAINTS[channel];
  const toneInstructions = TONE_INSTRUCTIONS[tone];

  const signalList = signals.map(s => `- ${s.signalName}${s.description ? `: ${s.description}` : ""}`).join("\n");

  let verificationContext = "";
  if (verification?.claims && verification.claims.length > 0) {
    const claimList = verification.claims.slice(0, 3).map(c => `- ${c.type}: ${c.content}`).join("\n");
    verificationContext = `
VERIFIED FACTS (${Math.round(verification.confidence * 100)}% confidence):
${claimList}
`;
  }

  const senderContext = senderName || senderCompany || senderValue ? `
SENDER CONTEXT:
${senderName ? `- Name: ${senderName}` : ""}
${senderCompany ? `- Company: ${senderCompany}` : ""}
${senderValue ? `- Value proposition: ${senderValue}` : ""}
` : "";

  return `Generate a personalized ${channel} outreach message for a B2B sales context.

TARGET COMPANY:
- Name: ${companyName}
- Domain: ${domain}
${input.industry ? `- Industry: ${input.industry}` : ""}

WHY NOW (the key timing signal):
${whyNow}

DETECTED SIGNALS:
${signalList}
${verificationContext}
${senderContext}
TONE: ${tone}
${toneInstructions}

CHANNEL: ${channel}
- Max length: ${constraints.maxLength} words
${constraints.includeSubject ? "- Include a compelling subject line" : ""}

CRITICAL RULES:
1. Reference the SPECIFIC signal/event - don't be generic
2. NO fake flattery ("I love your company", "I'm impressed by...")
3. NO lies or assumptions beyond what's verified
4. ONE clear call-to-action
5. Sound human, not like a template
6. The hook must directly connect to the "why now" signal

Generate 3 variations with different angles/hooks.

Output as JSON array:
[
  {
    "subject": "Subject line here (email only)",
    "body": "Message body here",
    "hook": "Brief description of the angle used"
  }
]`;
}

async function callLLM(prompt: string): Promise<string> {
  // Try OpenAI first, then Anthropic
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (openaiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert B2B sales copywriter. Generate personalized outreach that references specific signals and events. Output valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  if (anthropicKey) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1500,
        messages: [
          { role: "user", content: prompt },
        ],
        system: "You are an expert B2B sales copywriter. Generate personalized outreach that references specific signals and events. Output valid JSON only.",
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || "";
  }

  throw new Error("No LLM API key configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)");
}

function parseMessages(
  raw: string,
  channel: OutreachChannel,
  tone: OutreachTone
): OutreachMessage[] {
  // Extract JSON from response
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error("Failed to parse outreach JSON:", raw);
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      subject?: string;
      body: string;
      hook: string;
    }>;

    return parsed.map((msg) => ({
      id: createId(),
      channel,
      tone,
      subject: msg.subject,
      body: msg.body,
      hook: msg.hook,
      wordCount: msg.body.split(/\s+/).length,
      generatedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.error("Failed to parse outreach JSON:", e);
    return [];
  }
}

export async function generateOutreach(
  input: GenerateOutreachInput
): Promise<GenerateOutreachOutput> {
  const prompt = buildPrompt(input);
  const raw = await callLLM(prompt);
  const messages = parseMessages(raw, input.channel, input.tone);

  return {
    messages,
    tokensUsed: undefined, // Could track if needed
  };
}

// Generate quick opener without full context (for preview)
export function generateQuickHook(whyNow: string, companyName: string): string {
  // Extract the key event/signal
  const lowerWhyNow = whyNow.toLowerCase();

  if (lowerWhyNow.includes("funding") || lowerWhyNow.includes("raised")) {
    return `Congrats on the funding – curious how you're scaling`;
  }
  if (lowerWhyNow.includes("hiring") || lowerWhyNow.includes("roles")) {
    return `Noticed you're growing the team – happy to share what's working`;
  }
  if (lowerWhyNow.includes("launch") || lowerWhyNow.includes("announced")) {
    return `Saw the news about your launch – timing might be right`;
  }
  if (lowerWhyNow.includes("expansion") || lowerWhyNow.includes("new market")) {
    return `Your expansion caught my eye – we've helped others in similar spots`;
  }
  if (lowerWhyNow.includes("acquisition") || lowerWhyNow.includes("acquired")) {
    return `Post-acquisition is often a good time to revisit systems`;
  }

  // Generic but still signal-aware
  return `Something caught my eye about ${companyName} – worth a quick chat?`;
}
