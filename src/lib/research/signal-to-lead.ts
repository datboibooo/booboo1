import { createId } from "@paralleldrive/cuid2";
import { LeadRecord, SignalCategory, SignalPriority } from "@/lib/schemas";
import { AggregatedSignal, SignalType } from "./types";

// Map research signal types to lead signal categories
const SIGNAL_TYPE_TO_CATEGORY: Record<SignalType, SignalCategory> = {
  funding: "funding_corporate",
  hiring: "hiring_team",
  product_launch: "product_strategy",
  leadership_change: "leadership_org",
  expansion: "expansion_partnerships",
  partnership: "expansion_partnerships",
  acquisition: "funding_corporate",
  tech_adoption: "technology_adoption",
};

// Signal type priorities
const SIGNAL_TYPE_PRIORITY: Record<SignalType, SignalPriority> = {
  funding: "high",
  hiring: "medium",
  product_launch: "high",
  leadership_change: "medium",
  expansion: "high",
  partnership: "medium",
  acquisition: "high",
  tech_adoption: "medium",
};

// Generate "why now" statement
function generateWhyNow(signal: AggregatedSignal): string {
  const { signalType, companyName, entities } = signal;

  switch (signalType) {
    case "funding":
      if (entities.amount) {
        return `${companyName} just raised ${entities.amount}${entities.investors?.length ? ` from ${entities.investors[0]}` : ""} - they're likely investing in growth and new tools.`;
      }
      return `${companyName} recently secured funding - perfect time to engage as they scale operations.`;

    case "hiring":
      if (entities.roles?.length) {
        return `${companyName} is actively hiring ${entities.roles.slice(0, 2).join(", ")} - signals team expansion and potential budget for new solutions.`;
      }
      return `${companyName} is in hiring mode - growing teams often need new tools and processes.`;

    case "product_launch":
      return `${companyName} just launched something new - they're in execution mode and may need complementary solutions.`;

    case "leadership_change":
      if (entities.people?.length) {
        return `${companyName} brought in ${entities.people[0]} - new leadership often means new initiatives and vendor reviews.`;
      }
      return `${companyName} has new leadership - great time for a fresh conversation as priorities shift.`;

    case "expansion":
      if (entities.locations?.length) {
        return `${companyName} is expanding to ${entities.locations[0]} - geographic growth brings new operational needs.`;
      }
      return `${companyName} is expanding into new markets - scaling requires new infrastructure and partners.`;

    case "partnership":
      return `${companyName} just announced a strategic partnership - they're clearly open to new collaborations.`;

    case "acquisition":
      return `${companyName} was involved in M&A activity - integration periods create opportunities for new solutions.`;

    case "tech_adoption":
      return `${companyName} is modernizing their tech stack - perfect timing to discuss complementary tools.`;

    default:
      return `${companyName} is showing growth signals - good time to reach out.`;
  }
}

// Generate narrative points
function generateNarrative(signal: AggregatedSignal): string[] {
  const points: string[] = [];
  const { signalType, companyName, entities, sourceCount, confidence } = signal;

  // Primary signal point
  points.push(signal.summary.slice(0, 200));

  // Entities-based points
  if (signalType === "funding" && entities.amount) {
    points.push(`Funding amount: ${entities.amount}`);
    if (entities.investors?.length) {
      points.push(`Backed by: ${entities.investors.join(", ")}`);
    }
  }

  if (signalType === "hiring" && entities.roles?.length) {
    points.push(`Hiring for: ${entities.roles.join(", ")}`);
  }

  if (entities.people?.length) {
    points.push(`Key people: ${entities.people.join(", ")}`);
  }

  // Confidence indicator
  if (sourceCount > 1) {
    points.push(`Verified across ${sourceCount} sources (${Math.round(confidence * 100)}% confidence)`);
  }

  return points;
}

// Generate target titles based on signal type
function getTargetTitles(signalType: SignalType): string[] {
  const titles: Record<SignalType, string[]> = {
    funding: ["CEO", "CFO", "VP Finance", "Head of Operations"],
    hiring: ["VP People", "Head of HR", "Engineering Manager", "CTO"],
    product_launch: ["VP Product", "Head of Product", "CPO", "CEO"],
    leadership_change: ["New Executive", "CEO", "Chief of Staff"],
    expansion: ["VP Operations", "Head of Growth", "COO", "CEO"],
    partnership: ["VP Business Development", "Head of Partnerships", "CEO"],
    acquisition: ["CEO", "CFO", "VP Corporate Development"],
    tech_adoption: ["CTO", "VP Engineering", "IT Director", "Head of IT"],
  };

  return titles[signalType] || ["CEO", "Founder", "Head of Operations"];
}

// Calculate lead score from signal
function calculateScore(signal: AggregatedSignal): number {
  let score = 50; // Base score

  // Confidence bonus (up to 20 points)
  score += Math.round(signal.confidence * 20);

  // Source count bonus (up to 15 points)
  score += Math.min(signal.sourceCount * 5, 15);

  // Freshness bonus (up to 15 points) - fresher is better
  if (signal.freshness < 24) {
    score += 15;
  } else if (signal.freshness < 48) {
    score += 10;
  } else if (signal.freshness < 72) {
    score += 5;
  }

  // Signal type bonus
  if (signal.signalType === "funding" || signal.signalType === "acquisition") {
    score += 10;
  } else if (signal.signalType === "expansion" || signal.signalType === "product_launch") {
    score += 5;
  }

  return Math.min(Math.round(score), 100);
}

// Generate LinkedIn search URL
function generateLinkedInUrl(companyName: string, titles: string[]): string {
  const query = `"${companyName}" ${titles.slice(0, 2).map(t => `"${t}"`).join(" OR ")}`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
}

// Generate short opener
function generateShortOpener(signal: AggregatedSignal): string {
  const { companyName, signalType, entities } = signal;

  if (signalType === "funding" && entities.amount) {
    return `Congrats on the ${entities.amount} raise! Curious if you're exploring [your solution category] as you scale - happy to share what's worked for similar companies post-funding.`;
  }

  if (signalType === "hiring") {
    return `Noticed ${companyName} is growing the team - we've helped similar companies [your value prop] during scaling phases. Worth a quick chat?`;
  }

  if (signalType === "product_launch") {
    return `Saw the news about your launch - impressive! As you scale this, [your value prop]. Would love to share how others have approached this.`;
  }

  return `Something caught my eye about ${companyName} recently - [personalize based on signal]. Happy to share what's worked for similar companies if useful.`;
}

// Generate medium opener
function generateMediumOpener(signal: AggregatedSignal): string {
  const short = generateShortOpener(signal);
  const { companyName, signalType } = signal;

  let context = "";
  if (signalType === "funding") {
    context = `\n\nPost-funding is often when companies invest in [your category] - we've seen this pattern with [example customers]. Our [specific differentiator] has been particularly valuable during growth phases.`;
  } else if (signalType === "hiring") {
    context = `\n\nGrowing teams often surface new challenges around [your problem space]. We work with [similar companies] to help them [your value]. The earlier you address this, the smoother the scale.`;
  } else {
    context = `\n\nCompanies in similar situations have found [your value prop] helpful. Would be happy to share specific examples if you're exploring options.`;
  }

  return short + context + "\n\nNo pressure either way - just thought the timing might be right.";
}

// Convert aggregated signal to lead record
export function signalToLead(signal: AggregatedSignal, userId: string = "system"): LeadRecord {
  const targetTitles = getTargetTitles(signal.signalType);
  const today = new Date().toISOString().split("T")[0];

  return {
    id: createId(),
    userId,
    date: today,
    companyName: signal.companyName,
    domain: signal.domain || "",
    score: calculateScore(signal),
    industry: signal.industry || null,
    geo: null, // Will be enriched later if needed
    whyNow: generateWhyNow(signal),
    triggeredSignals: [
      {
        signalId: signal.id,
        signalName: signal.headline.slice(0, 50),
        category: SIGNAL_TYPE_TO_CATEGORY[signal.signalType],
        priority: SIGNAL_TYPE_PRIORITY[signal.signalType],
      },
    ],
    narrative: generateNarrative(signal),
    angles: signal.sources.slice(0, 3).map((source, idx) => ({
      title: `Source ${idx + 1}: ${source.type}`,
      description: source.snippet.slice(0, 150),
      evidenceUrl: source.url,
    })),
    evidenceUrls: signal.sources.map((s) => s.url),
    evidenceSnippets: signal.sources.map((s) => s.snippet),
    targetTitles,
    linkedinSearchUrl: generateLinkedInUrl(signal.companyName, targetTitles),
    linkedinSearchQuery: `${signal.companyName} ${targetTitles[0]}`,
    openerShort: generateShortOpener(signal),
    openerMedium: generateMediumOpener(signal),
    personName: signal.entities.people?.[0] || null,
    status: "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Batch convert signals to leads
export function signalsToLeads(signals: AggregatedSignal[], userId: string = "system"): LeadRecord[] {
  return signals
    .filter((s) => s.domain) // Only convert signals with domains
    .map((s) => signalToLead(s, userId));
}
