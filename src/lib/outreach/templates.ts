// Template-based outreach generation (no API keys required)

export interface OutreachContext {
  companyName: string;
  industry?: string;
  techStack: string[];
  totalJobs: number;
  engineeringJobs?: number;
  hiringVelocity: "aggressive" | "moderate" | "stable";
  signals: string[];
  topJobTitles?: string[];
  recipientTitle?: string;
  senderName?: string;
  senderRole?: string;
  senderCompany?: string;
}

export interface GeneratedOutreach {
  subject: string;
  body: string;
  variant: "short" | "medium" | "long";
  tone: "casual" | "professional" | "direct";
}

// Generate subject line based on context
function generateSubject(ctx: OutreachContext): string {
  const templates = [
    `Quick question about ${ctx.companyName}'s ${ctx.techStack[0] || "tech"} stack`,
    `Noticed ${ctx.companyName} is hiring`,
    `Re: ${ctx.companyName}'s engineering growth`,
    `${ctx.companyName} + ${ctx.senderCompany || "a quick idea"}`,
  ];

  if (ctx.hiringVelocity === "aggressive") {
    templates.push(`Congrats on ${ctx.companyName}'s growth`);
  }

  if (ctx.engineeringJobs && ctx.engineeringJobs >= 5) {
    templates.push(`Saw ${ctx.companyName} is scaling engineering`);
  }

  return templates[Math.floor(Math.random() * templates.length)];
}

// Generate short outreach (1-2 sentences)
function generateShort(ctx: OutreachContext): string {
  const openings = [
    `Noticed ${ctx.companyName} is ${ctx.hiringVelocity === "aggressive" ? "aggressively " : ""}hiring`,
    `Saw ${ctx.companyName} has ${ctx.totalJobs} open roles`,
    `${ctx.companyName}'s growth caught my attention`,
  ];

  if (ctx.techStack.length > 0) {
    openings.push(`Saw ${ctx.companyName} is building with ${ctx.techStack.slice(0, 2).join(" and ")}`);
  }

  const hooks = [
    `Any interest in a quick chat?`,
    `Worth a 15-min call to discuss?`,
    `Open to exploring some ideas?`,
    `Would love to share some thoughts.`,
  ];

  const opening = openings[Math.floor(Math.random() * openings.length)];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];

  return `${opening}. ${hook}`;
}

// Generate medium outreach (3-5 sentences)
function generateMedium(ctx: OutreachContext): string {
  const parts: string[] = [];

  // Opening - context-aware
  if (ctx.hiringVelocity === "aggressive" && ctx.totalJobs >= 10) {
    parts.push(`${ctx.companyName}'s hiring velocity caught my attention - ${ctx.totalJobs} open roles is impressive growth.`);
  } else if (ctx.engineeringJobs && ctx.engineeringJobs >= 5) {
    parts.push(`Noticed ${ctx.companyName} is scaling the engineering team with ${ctx.engineeringJobs} open positions.`);
  } else if (ctx.techStack.length > 0) {
    parts.push(`Saw ${ctx.companyName} is building with ${ctx.techStack.slice(0, 3).join(", ")} - solid stack.`);
  } else {
    parts.push(`${ctx.companyName}'s growth trajectory is interesting.`);
  }

  // Middle - value proposition hint
  if (ctx.signals.length > 0) {
    const signal = ctx.signals[0];
    if (signal.toLowerCase().includes("first")) {
      parts.push(`Building out a new function is always an exciting (and challenging) phase.`);
    } else if (signal.toLowerCase().includes("aggressive")) {
      parts.push(`Rapid scaling comes with unique challenges.`);
    } else {
      parts.push(`The signals suggest now might be a pivotal time.`);
    }
  } else {
    parts.push(`Companies at this stage often face interesting scaling challenges.`);
  }

  // Close - call to action
  const ctas = [
    `Would you be open to a quick call to explore if there's a fit?`,
    `Happy to share some ideas that might be relevant - worth 15 minutes?`,
    `If timing works, would love to chat about what you're building.`,
  ];
  parts.push(ctas[Math.floor(Math.random() * ctas.length)]);

  return parts.join(" ");
}

// Generate long outreach (5+ sentences, more personalized)
function generateLong(ctx: OutreachContext): string {
  const parts: string[] = [];

  // Personalized opening
  parts.push(`Hi${ctx.recipientTitle ? ` there` : ""},`);
  parts.push("");

  // Context about why reaching out
  if (ctx.hiringVelocity === "aggressive") {
    parts.push(`I've been following ${ctx.companyName}'s growth - ${ctx.totalJobs} open roles suggests you're in an exciting scaling phase.`);
  } else if (ctx.techStack.length > 0) {
    parts.push(`Came across ${ctx.companyName} while researching companies building with ${ctx.techStack[0]}. The tech choices look solid.`);
  } else {
    parts.push(`${ctx.companyName} caught my attention while researching ${ctx.industry || "fast-growing"} companies.`);
  }
  parts.push("");

  // Specific observation
  if (ctx.engineeringJobs && ctx.engineeringJobs >= 3) {
    parts.push(`Scaling engineering from where you are to ${ctx.engineeringJobs}+ new hires is a meaningful jump. The transition often surfaces interesting challenges around velocity, quality, and culture.`);
  } else if (ctx.signals.length > 0) {
    const relevantSignal = ctx.signals.find(s =>
      s.toLowerCase().includes("first") ||
      s.toLowerCase().includes("new") ||
      s.toLowerCase().includes("scaling")
    );
    if (relevantSignal) {
      parts.push(`${relevantSignal} - that's an exciting milestone. Companies at this stage often think about similar challenges.`);
    } else {
      parts.push(`The hiring signals suggest you're building something meaningful.`);
    }
  } else {
    parts.push(`Growth phases like this often come with unique challenges.`);
  }
  parts.push("");

  // Soft CTA
  parts.push(`I'd love to learn more about what ${ctx.companyName} is building and share some ideas that might be relevant.`);
  parts.push("");
  parts.push(`Would a quick 15-minute call work sometime this week or next?`);
  parts.push("");

  // Sign off
  if (ctx.senderName) {
    parts.push(`Best,`);
    parts.push(ctx.senderName);
    if (ctx.senderRole && ctx.senderCompany) {
      parts.push(`${ctx.senderRole} @ ${ctx.senderCompany}`);
    }
  } else {
    parts.push(`Best`);
  }

  return parts.join("\n");
}

// Main generation function
export function generateTemplateOutreach(
  ctx: OutreachContext,
  variant: "short" | "medium" | "long" = "medium",
  tone: "casual" | "professional" | "direct" = "professional"
): GeneratedOutreach {
  let body: string;

  switch (variant) {
    case "short":
      body = generateShort(ctx);
      break;
    case "long":
      body = generateLong(ctx);
      break;
    default:
      body = generateMedium(ctx);
  }

  // Apply tone adjustments
  if (tone === "casual") {
    body = body
      .replace(/Would you be open to/g, "Any chance we could")
      .replace(/I'd love to/g, "I'd be happy to")
      .replace(/Best,/g, "Cheers,");
  } else if (tone === "direct") {
    body = body
      .replace(/Would you be open to/g, "Can we schedule")
      .replace(/I'd love to/g, "I want to")
      .replace(/If timing works,/g, "Let's");
  }

  return {
    subject: generateSubject(ctx),
    body,
    variant,
    tone,
  };
}

// Generate multiple variants at once
export function generateAllVariants(ctx: OutreachContext): GeneratedOutreach[] {
  return [
    generateTemplateOutreach(ctx, "short", "direct"),
    generateTemplateOutreach(ctx, "medium", "professional"),
    generateTemplateOutreach(ctx, "long", "casual"),
  ];
}
