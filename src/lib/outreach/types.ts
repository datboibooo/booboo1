import { z } from "zod";

// Outreach tone options
export const OutreachTone = z.enum([
  "professional",   // Formal, corporate-friendly
  "conversational", // Friendly, approachable
  "provocative",    // Pattern-interrupt, bold
  "concise",        // Ultra-short, respect their time
]);
export type OutreachTone = z.infer<typeof OutreachTone>;

// Outreach channel
export const OutreachChannel = z.enum([
  "email",
  "linkedin",
  "twitter",
]);
export type OutreachChannel = z.infer<typeof OutreachChannel>;

// Generated outreach message
export const OutreachMessage = z.object({
  id: z.string(),
  channel: OutreachChannel,
  tone: OutreachTone,
  subject: z.string().optional(), // For email only
  body: z.string(),
  hook: z.string(), // The signal-based hook used
  wordCount: z.number(),
  generatedAt: z.string(),
});
export type OutreachMessage = z.infer<typeof OutreachMessage>;

// Input for generating outreach
export const GenerateOutreachInput = z.object({
  companyName: z.string(),
  domain: z.string(),
  industry: z.string().optional(),
  whyNow: z.string(), // The "why now" signal
  signals: z.array(z.object({
    signalName: z.string(),
    description: z.string().optional(),
  })),
  verification: z.object({
    confidence: z.number(),
    claims: z.array(z.object({
      type: z.string(),
      content: z.string(),
      entities: z.array(z.string()).optional(),
    })).optional(),
  }).optional(),
  // User's context
  senderName: z.string().optional(),
  senderCompany: z.string().optional(),
  senderValue: z.string().optional(), // What value they provide
  channel: OutreachChannel,
  tone: OutreachTone,
});
export type GenerateOutreachInput = z.infer<typeof GenerateOutreachInput>;

// Output from outreach generation
export const GenerateOutreachOutput = z.object({
  messages: z.array(OutreachMessage),
  tokensUsed: z.number().optional(),
});
export type GenerateOutreachOutput = z.infer<typeof GenerateOutreachOutput>;

// Saved outreach for a lead
export const SavedOutreach = z.object({
  leadId: z.string(),
  messages: z.array(OutreachMessage),
  selectedMessageId: z.string().optional(),
  sentAt: z.string().optional(),
  response: z.enum(["none", "positive", "negative", "meeting"]).optional(),
});
export type SavedOutreach = z.infer<typeof SavedOutreach>;
