import type { LeadRecord } from "@/lib/schemas";

// Convert job board search results to LeadRecord format
export interface JobBoardLead {
  name: string;
  domain: string;
  industry: string;
  stage: string;
  score: number;
  totalJobs: number;
  techStack: string[];
  departments: Record<string, number>;
  signals: string[];
  hiringVelocity: "aggressive" | "moderate" | "stable";
  topJobs?: Array<{
    title: string;
    department: string;
    location: string;
    url: string;
  }>;
}

export function jobBoardLeadToRecord(lead: JobBoardLead): LeadRecord {
  const now = new Date().toISOString();
  const date = now.split("T")[0];

  // Generate signals from hiring data
  const triggeredSignals: Array<{
    signalId: string;
    signalName: string;
    category: "funding_corporate" | "leadership_org" | "product_strategy" | "hiring_team" | "expansion_partnerships" | "technology_adoption" | "risk_compliance" | "disqualifier";
    priority: "low" | "medium" | "high";
  }> = [];

  if (lead.hiringVelocity === "aggressive") {
    triggeredSignals.push({
      signalId: "aggressive-hiring",
      signalName: "Aggressive Hiring",
      category: "hiring_team",
      priority: "high",
    });
  }

  if (lead.departments.Engineering && lead.departments.Engineering >= 5) {
    triggeredSignals.push({
      signalId: "eng-hiring",
      signalName: `Hiring ${lead.departments.Engineering} Engineers`,
      category: "hiring_team",
      priority: "high",
    });
  }

  if (lead.techStack.length > 0) {
    triggeredSignals.push({
      signalId: "tech-stack",
      signalName: `Uses ${lead.techStack.slice(0, 3).join(", ")}`,
      category: "technology_adoption",
      priority: "medium",
    });
  }

  // Add signals from the lead
  for (const signal of lead.signals) {
    triggeredSignals.push({
      signalId: signal.toLowerCase().replace(/\s+/g, "-"),
      signalName: signal,
      category: "hiring_team",
      priority: signal.includes("aggressive") || signal.includes("first") ? "high" : "medium",
    });
  }

  // Generate why now
  const whyNowParts = [];
  if (lead.totalJobs > 0) {
    whyNowParts.push(`${lead.totalJobs} open roles`);
  }
  if (lead.hiringVelocity === "aggressive") {
    whyNowParts.push("aggressive hiring mode");
  }
  if (lead.departments.Engineering) {
    whyNowParts.push(`${lead.departments.Engineering} engineering positions`);
  }
  if (lead.techStack.length > 0) {
    whyNowParts.push(`building with ${lead.techStack.slice(0, 2).join(", ")}`);
  }

  const whyNow = whyNowParts.length > 0
    ? `${lead.name} is actively hiring with ${whyNowParts.join(", ")}.`
    : `${lead.name} has open positions.`;

  // Generate target titles
  const targetTitles = lead.topJobs
    ? lead.topJobs.slice(0, 3).map((j) => j.title)
    : ["Engineering Manager", "Software Engineer", "Technical Lead"];

  // Generate evidence URLs
  const evidenceUrls = [
    `https://${lead.domain}/careers`,
    ...(lead.topJobs?.slice(0, 2).map((j) => j.url) || []),
  ];

  // Generate evidence snippets
  const evidenceSnippets = [
    `${lead.name} has ${lead.totalJobs} open positions.`,
    lead.techStack.length > 0
      ? `Tech stack: ${lead.techStack.join(", ")}.`
      : "",
    lead.signals.length > 0
      ? `Signals: ${lead.signals.join(", ")}.`
      : "",
  ].filter(Boolean);

  // Generate openers
  const openerShort = `Noticed ${lead.name} is ${lead.hiringVelocity === "aggressive" ? "aggressively " : ""}hiring. Any interest in discussing?`;
  const openerMedium = `I saw ${lead.name} has ${lead.totalJobs} open roles${lead.techStack.length > 0 ? `, with a focus on ${lead.techStack.slice(0, 2).join(" and ")}` : ""}. ${lead.hiringVelocity === "aggressive" ? "The growth signals are strong. " : ""}Would love to connect and discuss how we might help.`;

  // Generate angles
  const angles = [
    {
      title: "Hiring Growth",
      description: `${lead.name} is expanding with ${lead.totalJobs} open positions.`,
      evidenceUrl: `https://${lead.domain}/careers`,
    },
  ];

  if (lead.techStack.length > 0) {
    angles.push({
      title: "Tech Stack",
      description: `Building with ${lead.techStack.slice(0, 4).join(", ")}.`,
      evidenceUrl: `https://${lead.domain}`,
    });
  }

  // Generate narrative
  const narrative = [
    `${lead.name} is a ${lead.stage} ${lead.industry} company.`,
    `Currently hiring for ${lead.totalJobs} positions.`,
    lead.departments.Engineering
      ? `${lead.departments.Engineering} of these are engineering roles.`
      : null,
    lead.techStack.length > 0
      ? `Their tech stack includes ${lead.techStack.slice(0, 5).join(", ")}.`
      : null,
    `Hiring velocity: ${lead.hiringVelocity}.`,
  ].filter((s): s is string => s !== null);

  return {
    id: `live-${lead.domain}-${Date.now()}`,
    userId: "system",
    date,
    domain: lead.domain,
    companyName: lead.name,
    industry: lead.industry || null,
    geo: null, // Could extract from job locations
    score: lead.score,
    whyNow,
    triggeredSignals,
    evidenceUrls,
    evidenceSnippets,
    linkedinSearchUrl: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(lead.name)}`,
    linkedinSearchQuery: lead.name,
    targetTitles,
    openerShort,
    openerMedium,
    status: "new",
    personName: null,
    angles,
    narrative,
    createdAt: now,
    updatedAt: now,
  };
}

export function jobBoardLeadsToRecords(leads: JobBoardLead[]): LeadRecord[] {
  return leads.map(jobBoardLeadToRecord);
}
