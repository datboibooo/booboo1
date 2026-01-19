import { createId } from "@paralleldrive/cuid2";
import { RawSignal, SignalType, SourceType } from "../types";

const EXA_API_URL = "https://api.exa.ai/search";

interface ExaResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text?: string;
  highlights?: string[];
}

interface ExaResponse {
  results: ExaResult[];
}

// Signal-specific search queries
const SIGNAL_QUERIES: Record<SignalType, string[]> = {
  funding: [
    "startup raises funding round",
    "series A B C funding announcement",
    "company secures investment",
    "venture capital funding round",
  ],
  hiring: [
    "company hiring engineers",
    "startup expanding team",
    "company job openings growth",
  ],
  product_launch: [
    "company launches new product",
    "startup announces new feature",
    "product launch announcement",
  ],
  leadership_change: [
    "company appoints new CEO CTO",
    "startup hires executive",
    "new VP Director hired",
  ],
  expansion: [
    "company expands to new market",
    "startup opens new office",
    "international expansion announcement",
  ],
  partnership: [
    "strategic partnership announcement",
    "company partners with",
    "integration partnership launch",
  ],
  acquisition: [
    "company acquired by",
    "acquisition announcement",
    "M&A deal closed",
  ],
  tech_adoption: [
    "company adopts new technology",
    "migrates to cloud platform",
    "implements new tech stack",
  ],
};

export async function searchExa(
  signalType: SignalType,
  options: {
    maxResults?: number;
    freshnessHours?: number;
    customQueries?: string[];
  } = {}
): Promise<RawSignal[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    console.warn("EXA_API_KEY not configured, skipping Exa search");
    return [];
  }

  const { maxResults = 20, freshnessHours = 72, customQueries } = options;
  const queries = customQueries || SIGNAL_QUERIES[signalType] || [];

  const signals: RawSignal[] = [];
  const startDate = new Date(Date.now() - freshnessHours * 60 * 60 * 1000).toISOString();

  for (const query of queries.slice(0, 2)) { // Limit to 2 queries per signal type
    try {
      const response = await fetch(EXA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          query,
          numResults: Math.min(maxResults, 10),
          startPublishedDate: startDate,
          useAutoprompt: true,
          type: "neural",
          contents: {
            text: { maxCharacters: 1000 },
            highlights: { numSentences: 3 },
          },
        }),
      });

      if (!response.ok) {
        console.error(`Exa search failed for "${query}":`, response.status);
        continue;
      }

      const data: ExaResponse = await response.json();

      for (const result of data.results) {
        // Extract company name from title/content
        const companyMatch = result.title.match(/^([A-Z][A-Za-z0-9\s&.]+?)(?:\s+(?:raises|launches|announces|hires|expands|partners|acquires|adopts))/i);
        const companyName = companyMatch?.[1]?.trim() || extractCompanyFromUrl(result.url);

        if (!companyName) continue;

        const signal: RawSignal = {
          id: createId(),
          signalType,
          source: "news_search" as SourceType,
          sourceUrl: result.url,
          companyName,
          domain: extractDomain(result.url),
          headline: result.title,
          snippet: result.highlights?.join(" ") || result.text?.slice(0, 300) || "",
          rawContent: result.text,
          publishedAt: result.publishedDate,
          discoveredAt: new Date().toISOString(),
          confidence: 0.7, // Base confidence for news search
          ...extractEntities(signalType, result.title + " " + (result.text || "")),
        };

        signals.push(signal);
      }
    } catch (error) {
      console.error(`Exa search error for "${query}":`, error);
    }
  }

  return signals;
}

function extractDomain(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname;
    // Try to get the company domain, not the news site
    // This is a simplification - real implementation would need more logic
    return undefined; // Will be enriched later
  } catch {
    return undefined;
  }
}

function extractCompanyFromUrl(url: string): string | undefined {
  // Extract company name from URL patterns like /company/companyname
  const match = url.match(/\/(?:company|org|business)\/([a-z0-9-]+)/i);
  if (match) {
    return match[1].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
  return undefined;
}

function extractEntities(signalType: SignalType, text: string): Partial<RawSignal> {
  const entities: Partial<RawSignal> = {};

  // Extract funding amount
  if (signalType === "funding") {
    const amountMatch = text.match(/\$[\d.]+\s*(?:million|billion|M|B|mn|bn)/i);
    if (amountMatch) {
      entities.amount = amountMatch[0];
    }
    // Extract investors
    const investorPatterns = [
      /led by ([A-Z][A-Za-z\s&]+(?:Capital|Ventures|Partners))/gi,
      /from ([A-Z][A-Za-z\s&,]+(?:Capital|Ventures|Partners))/gi,
    ];
    const investors: string[] = [];
    for (const pattern of investorPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        investors.push(match[1].trim());
      }
    }
    if (investors.length > 0) {
      entities.investors = [...new Set(investors)];
    }
  }

  // Extract roles for hiring
  if (signalType === "hiring") {
    const rolePatterns = /(?:hiring|seeking|looking for)\s+([A-Za-z\s]+(?:Engineer|Developer|Manager|Director|VP|Lead))/gi;
    const roles: string[] = [];
    const matches = text.matchAll(rolePatterns);
    for (const match of matches) {
      roles.push(match[1].trim());
    }
    if (roles.length > 0) {
      entities.roles = [...new Set(roles)];
    }
  }

  // Extract people names for leadership
  if (signalType === "leadership_change") {
    // Simple pattern - real implementation would use NER
    const namePattern = /(?:appoints|hires|names|welcomes)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g;
    const people: string[] = [];
    const matches = text.matchAll(namePattern);
    for (const match of matches) {
      people.push(match[1]);
    }
    if (people.length > 0) {
      entities.people = [...new Set(people)];
    }
  }

  return entities;
}
