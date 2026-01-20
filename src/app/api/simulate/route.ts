import { NextRequest, NextResponse } from "next/server";

// ============= ENHANCED BUYER SIMULATION SYSTEM =============
// Sophisticated heuristics for buyer journey mapping and outreach optimization

interface SimulationRequest {
  type: "buyer_journey" | "message_test" | "search_expand" | "pain_discovery";
  productDescription?: string;
  targetAudience?: string;
  message?: string;
  companyContext?: string;
  personaTitle?: string;
  baseQuery?: string;
  companyName?: string;
  signals?: string[];
}

interface BuyerJourneyResult {
  buyerProfile: {
    title: string;
    alternativeTitles: string[];
    painPoints: string[];
    triggers: string[];
    timeline: string;
    budgetAuthority: "direct" | "influencer" | "champion";
    buyingProcess: string;
  };
  signalsToFind: {
    signal: string;
    why: string;
    urgency: "high" | "medium" | "low";
    searchQuery: string;
  }[];
  searchQueries: string[];
  outreachAngles: {
    angle: string;
    opener: string;
    followUp: string;
    bestFor: string;
  }[];
  competitiveIntel: {
    likelyCurrentSolutions: string[];
    switchingTriggers: string[];
  };
}

interface MessageTestResult {
  score: number;
  likelihood: "high" | "medium" | "low";
  feedback: string[];
  improvements: string[];
  rewrittenMessage: string;
  analysis: {
    personalization: number;
    valueProposition: number;
    callToAction: number;
    length: number;
    tone: number;
  };
}

interface SearchExpandResult {
  originalQuery: string;
  expandedQueries: {
    query: string;
    rationale: string;
    expectedResults: string;
  }[];
  filters: {
    industries: string[];
    companySize: string[];
    signals: string[];
    geos: string[];
  };
  negativeKeywords: string[];
}

interface PainDiscoveryResult {
  hypotheses: {
    pain: string;
    evidence: string;
    confidence: "high" | "medium" | "low";
    outreachAngle: string;
    messageTemplate: string;
  }[];
  buyingStage: "awareness" | "consideration" | "decision";
  urgencyLevel: "high" | "medium" | "low";
}

// ============= PRODUCT CATEGORY DETECTION =============

interface ProductCategory {
  id: string;
  patterns: RegExp[];
  buyers: BuyerProfile[];
  signals: SignalMapping[];
  angles: OutreachAngle[];
  competitors: string[];
}

interface BuyerProfile {
  title: string;
  alternativeTitles: string[];
  painPoints: string[];
  triggers: string[];
  timeline: string;
  budgetAuthority: "direct" | "influencer" | "champion";
  buyingProcess: string;
}

interface SignalMapping {
  signal: string;
  why: string;
  urgency: "high" | "medium" | "low";
  searchQuery: string;
}

interface OutreachAngle {
  angle: string;
  opener: string;
  followUp: string;
  bestFor: string;
}

// Comprehensive product categories with detailed buyer mapping
const PRODUCT_CATEGORIES: ProductCategory[] = [
  // === DEVELOPER TOOLS ===
  {
    id: "devtools",
    patterns: [
      /developer\s*(?:tool|experience|productivity)/i,
      /\b(?:ide|sdk|api|cli|devops)\b/i,
      /ci\/?cd|continuous\s+(?:integration|deployment)/i,
      /code\s+(?:review|quality|analysis)/i,
      /testing\s+(?:platform|framework|automation)/i,
      /\b(?:debugging|monitoring|observability)\b/i,
    ],
    buyers: [{
      title: "VP of Engineering",
      alternativeTitles: ["Head of Engineering", "Engineering Director", "CTO", "Principal Engineer"],
      painPoints: [
        "Developer velocity declining as team grows",
        "Inconsistent code quality and review bottlenecks",
        "Slow release cycles blocking product delivery",
        "Onboarding new engineers takes 2-3 months",
        "Production incidents from gaps in testing",
        "Context switching killing deep work time",
      ],
      triggers: [
        "Hiring 5+ engineers in a quarter",
        "New VP/Head of Engineering starts",
        "Post-mortem after major production incident",
        "Series A/B funding with product roadmap pressure",
        "Migration to microservices or cloud-native",
        "Developer satisfaction survey shows tooling complaints",
      ],
      timeline: "3-6 months from trigger to purchase",
      budgetAuthority: "direct",
      buyingProcess: "Technical evaluation → Team pilot → Security review → Procurement",
    }],
    signals: [
      { signal: "Hiring Senior/Staff+ Engineers", why: "Senior hires evaluate tooling first", urgency: "high", searchQuery: "companies hiring staff principal engineers" },
      { signal: "Platform/DevEx Engineer role", why: "Dedicated investment in developer experience", urgency: "high", searchQuery: "companies hiring platform engineer developer experience" },
      { signal: "DevOps/SRE hiring", why: "Building reliability practice", urgency: "high", searchQuery: "companies hiring devops SRE engineers" },
      { signal: "Engineering blog posts", why: "Team shares learnings = values craft", urgency: "medium", searchQuery: "companies engineering blog technical" },
      { signal: "Kubernetes/Cloud in job posts", why: "Modernizing infrastructure", urgency: "medium", searchQuery: "companies using kubernetes cloud native" },
      { signal: "Recent funding round", why: "Budget unlocked, pressure to deliver", urgency: "high", searchQuery: "series A B funded startups engineering" },
    ],
    angles: [
      {
        angle: "Scaling pain",
        opener: "Noticed you're growing the eng team from ~X to Y - that's the stage where deployment bottlenecks usually start hurting product velocity.",
        followUp: "How are you thinking about maintaining release speed as the team scales?",
        bestFor: "Companies hiring 5+ engineers",
      },
      {
        angle: "New leader",
        opener: "Congrats on the new [Title] - I've seen new eng leaders often audit the toolchain in their first 90 days.",
        followUp: "Are there any tools on the chopping block?",
        bestFor: "Recent leadership change",
      },
      {
        angle: "Incident-driven",
        opener: "Saw [Company] is scaling fast - at this stage, most teams hit a point where manual testing can't keep up with release velocity.",
        followUp: "How are you thinking about test coverage as you grow?",
        bestFor: "Fast-growing companies",
      },
      {
        angle: "Platform investment",
        opener: "Noticed you're hiring a Platform Engineer - companies that invest in DevEx early usually see 2-3x better retention.",
        followUp: "What's the first thing on their roadmap?",
        bestFor: "Companies hiring platform roles",
      },
    ],
    competitors: ["GitHub Actions", "GitLab", "CircleCI", "Jenkins", "Datadog", "New Relic"],
  },

  // === AI/ML TOOLS ===
  {
    id: "ai-ml",
    patterns: [
      /\b(?:ai|ml|machine\s+learning)\b/i,
      /\b(?:llm|gpt|claude|generative\s+ai)\b/i,
      /\bml\s*ops\b/i,
      /model\s+(?:training|deployment|serving)/i,
      /\b(?:vector|embedding|rag)\b/i,
      /ai\s+(?:infrastructure|platform|automation)/i,
    ],
    buyers: [{
      title: "Head of AI/ML",
      alternativeTitles: ["ML Engineering Lead", "VP of Engineering", "CTO", "Chief AI Officer", "Data Science Lead"],
      painPoints: [
        "Model deployment takes weeks instead of hours",
        "GPU costs spiraling out of control",
        "Can't iterate fast enough on prompts/models",
        "Production ML systems are unreliable",
        "Don't have enough ML talent to build in-house",
        "Evaluating model quality is mostly guesswork",
      ],
      triggers: [
        "Hiring ML Engineers / AI team",
        "Competitor launched AI-powered features",
        "Board asking about AI strategy",
        "Exploring LLM integration",
        "Current AI prototype needs to scale",
        "Costs of existing AI infrastructure exceeding budget",
      ],
      timeline: "2-4 months from trigger to purchase",
      budgetAuthority: "direct",
      buyingProcess: "POC with real data → Technical validation → Cost analysis → Executive buy-in",
    }],
    signals: [
      { signal: "Hiring ML/AI Engineers", why: "Building AI capabilities in-house", urgency: "high", searchQuery: "companies hiring ML engineers AI" },
      { signal: "LLM/GPT in job posts", why: "Exploring generative AI specifically", urgency: "high", searchQuery: "companies building LLM GPT features" },
      { signal: "Data Engineer hiring", why: "Building data pipeline for AI", urgency: "medium", searchQuery: "companies hiring data engineers ML" },
      { signal: "AI product launch", why: "Already invested, need to scale", urgency: "high", searchQuery: "companies launched AI features" },
      { signal: "MLOps role posted", why: "Serious about ML in production", urgency: "high", searchQuery: "companies hiring MLOps engineer" },
      { signal: "Partnerships with AI companies", why: "Evaluating AI ecosystem", urgency: "medium", searchQuery: "companies partnered OpenAI Anthropic" },
    ],
    angles: [
      {
        angle: "LLM cost control",
        opener: "Saw you're building with LLMs - most teams hit a point where API costs start exceeding engineering salary costs.",
        followUp: "How are you thinking about cost optimization as usage scales?",
        bestFor: "Companies using LLM APIs",
      },
      {
        angle: "Model deployment",
        opener: "Noticed your team is hiring ML engineers - the pattern I see is hiring happens fast but getting models to production stays slow.",
        followUp: "What's your current model-to-production timeline?",
        bestFor: "Companies hiring ML engineers",
      },
      {
        angle: "Build vs buy",
        opener: "Saw [Company] is exploring AI - curious if you're evaluating build vs buy for the infrastructure layer.",
        followUp: "What's driving that decision?",
        bestFor: "Companies early in AI journey",
      },
    ],
    competitors: ["OpenAI", "Anthropic", "AWS Bedrock", "Hugging Face", "Weights & Biases", "MLflow"],
  },

  // === SALES TOOLS ===
  {
    id: "sales",
    patterns: [
      /\bsales\s*(?:tool|platform|automation|intelligence)\b/i,
      /\b(?:crm|pipeline|forecasting|prospecting)\b/i,
      /\boutreach|engagement\b/i,
      /revenue\s+(?:operations|intelligence)/i,
      /\b(?:sdr|bdr|ae)\s+(?:tool|productivity)/i,
    ],
    buyers: [{
      title: "VP of Sales",
      alternativeTitles: ["Head of Sales", "CRO", "Sales Director", "VP of Revenue"],
      painPoints: [
        "Pipeline coverage is inconsistent",
        "Forecasting accuracy under 70%",
        "Reps spending too much time on research",
        "Lead quality from marketing is poor",
        "Ramping new reps takes 6+ months",
        "Visibility into rep activity is limited",
      ],
      triggers: [
        "Hiring multiple SDRs/AEs",
        "New VP/CRO starts",
        "Missed revenue target last quarter",
        "Series B+ funding with aggressive targets",
        "Expanding to new market/geo",
        "Sales ops/enablement hire",
      ],
      timeline: "1-3 months from trigger to purchase",
      budgetAuthority: "direct",
      buyingProcess: "Demo → Pilot team → ROI analysis → Full rollout",
    }],
    signals: [
      { signal: "Hiring SDRs/BDRs", why: "Scaling outbound = needs tools", urgency: "high", searchQuery: "companies hiring SDR BDR outbound" },
      { signal: "New VP/Head of Sales", why: "New leaders audit tech stack", urgency: "high", searchQuery: "companies hired VP head of sales" },
      { signal: "Hiring Account Executives", why: "Scaling direct sales", urgency: "high", searchQuery: "companies hiring account executives" },
      { signal: "Sales Ops role", why: "Professionalizing sales process", urgency: "high", searchQuery: "companies hiring sales operations" },
      { signal: "Series B+ funding", why: "Revenue targets increase", urgency: "high", searchQuery: "series B C funded companies sales" },
      { signal: "Expanding to new geo", why: "New market = new process", urgency: "medium", searchQuery: "companies expanding EMEA APAC sales" },
    ],
    angles: [
      {
        angle: "Scaling SDR team",
        opener: "Noticed you're hiring [X] SDRs - that's usually when research time per prospect becomes a bottleneck.",
        followUp: "How much time are reps spending on pre-call research?",
        bestFor: "Companies hiring multiple SDRs",
      },
      {
        angle: "New sales leader",
        opener: "Saw you just brought on [Name] as [Title] - new sales leaders usually audit the stack in the first 90 days.",
        followUp: "What's on the keep/kill list?",
        bestFor: "New VP/CRO hire",
      },
      {
        angle: "Pipeline challenge",
        opener: "Companies at your stage usually hit a point where pipeline coverage becomes unpredictable.",
        followUp: "What does your pipeline look like for next quarter?",
        bestFor: "Series B+ companies",
      },
    ],
    competitors: ["Salesforce", "HubSpot", "Outreach", "Apollo", "ZoomInfo", "Gong"],
  },

  // === SECURITY & COMPLIANCE ===
  {
    id: "security",
    patterns: [
      /\bsecurity\s*(?:tool|platform|operations)\b/i,
      /\b(?:soc\s*2|gdpr|hipaa|compliance|audit)\b/i,
      /\b(?:vulnerability|threat|incident)\b/i,
      /\b(?:siem|soar|xdr|edr)\b/i,
      /identity|access\s+management/i,
    ],
    buyers: [{
      title: "CISO",
      alternativeTitles: ["VP of Security", "Head of Security", "Security Director", "VP of IT"],
      painPoints: [
        "Too many security tools, not enough integration",
        "Alert fatigue drowning the team",
        "Compliance audits consuming months of time",
        "Can't hire enough security talent",
        "Visibility gaps across cloud environments",
        "Board asking tough questions about risk",
      ],
      triggers: [
        "Security incident or near-miss",
        "Upcoming SOC 2 / ISO 27001 audit",
        "Enterprise deal requires security certification",
        "Hired first dedicated security person",
        "Moving sensitive data to cloud",
        "Board-level security concerns",
      ],
      timeline: "2-6 months from trigger to purchase",
      budgetAuthority: "direct",
      buyingProcess: "Security assessment → POC → Compliance review → Procurement",
    }],
    signals: [
      { signal: "Hiring security engineers", why: "Building security practice", urgency: "high", searchQuery: "companies hiring security engineer" },
      { signal: "SOC 2 / compliance mentioned", why: "Compliance deadline approaching", urgency: "high", searchQuery: "companies SOC 2 certification" },
      { signal: "First CISO/security hire", why: "Formalizing security", urgency: "high", searchQuery: "companies hired first CISO security" },
      { signal: "Enterprise deals announced", why: "Enterprise requires security", urgency: "medium", searchQuery: "companies landed enterprise customers" },
      { signal: "Healthcare/Fintech industry", why: "Regulated industry", urgency: "high", searchQuery: "healthtech fintech companies" },
    ],
    angles: [
      {
        angle: "Compliance deadline",
        opener: "Noticed you're preparing for SOC 2 - most companies underestimate the prep time by about 2x.",
        followUp: "When's your audit deadline?",
        bestFor: "Companies pursuing certification",
      },
      {
        angle: "Enterprise requirements",
        opener: "Saw you closed [Enterprise Company] - enterprise deals usually come with a security questionnaire surprise.",
        followUp: "How's the security review process going?",
        bestFor: "Companies moving upmarket",
      },
    ],
    competitors: ["Vanta", "Drata", "Crowdstrike", "SentinelOne", "Wiz", "Snyk"],
  },

  // === MARKETING TOOLS ===
  {
    id: "marketing",
    patterns: [
      /\bmarketing\s*(?:tool|platform|automation)\b/i,
      /\b(?:seo|content|analytics)\b/i,
      /demand\s+generation/i,
      /\b(?:abm|attribution|personalization)\b/i,
      /customer\s+(?:data|journey)/i,
    ],
    buyers: [{
      title: "VP of Marketing",
      alternativeTitles: ["CMO", "Head of Marketing", "Head of Growth", "Director of Demand Gen"],
      painPoints: [
        "Can't prove marketing ROI to board",
        "Attribution is a mess",
        "Content production can't keep up with demand",
        "Website traffic isn't converting",
        "Sales complaining about lead quality",
        "Too many point solutions, no single view",
      ],
      triggers: [
        "New CMO/VP Marketing starts",
        "Missed pipeline contribution targets",
        "Launching into new market",
        "Post-funding growth expectations",
        "Rebranding or website redesign",
        "Demand gen team scaling",
      ],
      timeline: "1-4 months from trigger to purchase",
      budgetAuthority: "direct",
      buyingProcess: "Demo → Pilot campaign → ROI proof → Team rollout",
    }],
    signals: [
      { signal: "New CMO/VP Marketing", why: "New leaders change tools", urgency: "high", searchQuery: "companies hired CMO VP marketing" },
      { signal: "Demand Gen hires", why: "Scaling marketing operations", urgency: "high", searchQuery: "companies hiring demand generation" },
      { signal: "Content/SEO hires", why: "Investing in content", urgency: "medium", searchQuery: "companies hiring content SEO" },
      { signal: "Website redesign", why: "Likely upgrading tech stack too", urgency: "medium", searchQuery: "companies website redesign rebrand" },
      { signal: "Series A/B funding", why: "Need to prove marketing ROI", urgency: "high", searchQuery: "series A B funded startups marketing" },
    ],
    angles: [
      {
        angle: "Attribution challenge",
        opener: "Noticed you're scaling the demand gen team - at this stage, attribution usually becomes a board-level question.",
        followUp: "How are you measuring marketing's contribution to pipeline?",
        bestFor: "Growing marketing teams",
      },
      {
        angle: "New leader",
        opener: "Congrats on bringing in [Name] as [Title] - new marketing leaders often audit the tech stack in month one.",
        followUp: "What's on the chopping block?",
        bestFor: "New CMO/VP Marketing",
      },
    ],
    competitors: ["HubSpot", "Marketo", "6sense", "Clearbit", "Semrush", "Ahrefs"],
  },
];

// ============= SIMULATION FUNCTIONS =============

function detectProductCategory(product: string): ProductCategory | null {
  for (const category of PRODUCT_CATEGORIES) {
    if (category.patterns.some(p => p.test(product))) {
      return category;
    }
  }
  return null;
}

function simulateBuyerJourney(product: string, audience: string): BuyerJourneyResult {
  const category = detectProductCategory(product);

  if (category && category.buyers.length > 0) {
    const buyer = category.buyers[0];
    return {
      buyerProfile: {
        title: buyer.title,
        alternativeTitles: buyer.alternativeTitles,
        painPoints: buyer.painPoints,
        triggers: buyer.triggers,
        timeline: buyer.timeline,
        budgetAuthority: buyer.budgetAuthority,
        buyingProcess: buyer.buyingProcess,
      },
      signalsToFind: category.signals,
      searchQueries: category.signals.map(s => s.searchQuery),
      outreachAngles: category.angles,
      competitiveIntel: {
        likelyCurrentSolutions: category.competitors,
        switchingTriggers: [
          "Contract renewal coming up",
          "Pricing increased significantly",
          "Key features missing",
          "Poor customer support experience",
          "Integration issues with other tools",
        ],
      },
    };
  }

  // Default generic B2B profile
  return {
    buyerProfile: {
      title: "Department Head / VP",
      alternativeTitles: ["Director", "Head of Operations", "General Manager"],
      painPoints: [
        "Operational inefficiency slowing growth",
        "Too many manual processes",
        "Visibility gaps across the org",
        "Can't scale current approach",
        "Tool fragmentation causing data silos",
      ],
      triggers: [
        "Rapid team growth (20%+ headcount increase)",
        "New leadership with mandate to improve",
        "Recent funding round with growth targets",
        "Competitor pulling ahead",
        "Major customer complaint or churn",
      ],
      timeline: "2-6 months from trigger to purchase",
      budgetAuthority: "influencer",
      buyingProcess: "Problem identification → Solution research → Vendor evaluation → Business case → Procurement",
    },
    signalsToFind: [
      { signal: "Rapid hiring", why: "Growth creates process needs", urgency: "high", searchQuery: "fast growing companies hiring" },
      { signal: "New leadership", why: "New leaders drive change", urgency: "high", searchQuery: "companies new VP director hired" },
      { signal: "Recent funding", why: "Budget available, targets set", urgency: "medium", searchQuery: "recently funded startups" },
      { signal: "Expansion signals", why: "Scaling pains emerging", urgency: "medium", searchQuery: "companies expanding offices" },
    ],
    searchQueries: [
      "fast growing startups hiring",
      "series A B companies scaling",
      "companies new leadership team",
      "startups expanding operations",
    ],
    outreachAngles: [
      {
        angle: "Growth pain",
        opener: "Noticed [Company] is scaling fast - that usually surfaces operational challenges that didn't exist at smaller scale.",
        followUp: "How are you handling [specific area] as you grow?",
        bestFor: "Companies in growth phase",
      },
      {
        angle: "New leader",
        opener: "Saw you have new leadership - new leaders often look to make their mark with quick wins.",
        followUp: "What's top priority in the first 90 days?",
        bestFor: "Recent leadership change",
      },
    ],
    competitiveIntel: {
      likelyCurrentSolutions: ["Manual processes", "Spreadsheets", "Legacy tools", "Point solutions"],
      switchingTriggers: ["Scale limitations", "Cost concerns", "Feature gaps", "Support issues"],
    },
  };
}

function simulateMessageResponse(
  message: string,
  companyContext: string,
  personaTitle: string
): MessageTestResult {
  const analysis = {
    personalization: 5,
    valueProposition: 5,
    callToAction: 5,
    length: 5,
    tone: 5,
  };
  const issues: string[] = [];
  const improvements: string[] = [];
  let score = 5;

  // Length analysis
  if (message.length < 50) {
    issues.push("Message too short - lacks substance to engage a busy exec");
    analysis.length = 2;
    score -= 1.5;
  } else if (message.length > 400) {
    issues.push("Message too long - will get skimmed or ignored");
    analysis.length = 3;
    score -= 1;
  } else if (message.length >= 100 && message.length <= 250) {
    analysis.length = 8;
    score += 0.5;
  }

  // Personalization analysis
  const contextWords = companyContext.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const hasSpecificContext = contextWords.some(w => message.toLowerCase().includes(w));
  if (!hasSpecificContext) {
    issues.push("No specific reference to the company - feels templated");
    analysis.personalization = 2;
    score -= 2;
    improvements.push("Reference a specific signal: their funding, hiring, product launch, etc.");
  } else {
    analysis.personalization = 7;
    score += 1;
  }

  // Generic opener detection
  const genericOpeners = [
    /^(hi|hey|hello)[,.]?\s*(i\s+wanted|i\s+hope|i\s+came|i\s+noticed\s+you)/i,
    /hope\s+this\s+(email\s+)?finds\s+you/i,
    /i\s+came\s+across\s+(your|the)\s+(company|profile)/i,
    /i\s+wanted\s+to\s+(reach|connect)/i,
  ];
  if (genericOpeners.some(p => p.test(message))) {
    issues.push("Generic opener - these get filtered or ignored");
    analysis.tone = 3;
    score -= 1.5;
    improvements.push("Start with an insight or observation, not 'I wanted to reach out'");
  }

  // Value proposition analysis
  const weFocused = /\b(we help|we're the|we offer|our platform|our solution|we provide)\b/i;
  const youFocused = /\b(you|your team|your company|you're|you might)\b/i;
  if (weFocused.test(message) && !youFocused.test(message.slice(0, 200))) {
    issues.push("Too 'we' focused - should lead with their challenges");
    analysis.valueProposition = 3;
    score -= 1;
    improvements.push("Lead with their problem, not your solution");
  }

  // CTA analysis
  const hardCTA = /\b(schedule|book|15\s*min|30\s*min|quick\s+call|jump\s+on\s+a\s+call)\b/i;
  const softCTA = /\b(curious|wondering|thinking about|open to|worth\s+exploring)\b/i;
  const hasQuestion = message.includes("?");

  if (!hasQuestion) {
    issues.push("No question - doesn't invite a response");
    analysis.callToAction = 2;
    score -= 1;
    improvements.push("End with a low-friction question that's easy to answer");
  }
  if (hardCTA.test(message) && message.length < 300) {
    issues.push("Asking for a meeting too early - haven't earned attention yet");
    analysis.callToAction = 3;
    score -= 1;
    improvements.push("Offer value or insight before asking for time");
  }
  if (softCTA.test(message)) {
    analysis.callToAction = 7;
    score += 0.5;
  }

  // Positive signals
  if (/\b(noticed|saw|congrats|impressive)\b/i.test(message) && hasSpecificContext) {
    analysis.personalization = Math.min(10, analysis.personalization + 2);
    score += 1;
  }
  if (message.includes(personaTitle.split(" ")[0])) {
    score += 0.5;
  }

  // Calculate final score
  score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

  const likelihood: "high" | "medium" | "low" =
    score >= 7 ? "high" : score >= 4.5 ? "medium" : "low";

  // Generate rewritten message
  const rewritten = generateImprovedMessage(companyContext, personaTitle);

  return {
    score,
    likelihood,
    feedback: issues.length > 0 ? issues : ["Message is well-personalized and concise - good foundation"],
    improvements: improvements.length > 0 ? improvements : ["A/B test different value props to optimize response rate"],
    rewrittenMessage: rewritten,
    analysis,
  };
}

function generateImprovedMessage(context: string, persona: string): string {
  const templates = [
    `Noticed ${context.slice(0, 60)}${context.length > 60 ? "..." : ""} - that usually creates [specific challenge].

Curious: How are you thinking about [relevant question]?

[One sentence: outcome-focused value, not feature list]`,
    `${context.includes("hiring") ? "Congrats on the growth" : "Saw"} ${context.slice(0, 50)}...

That's the stage where most [${persona.toLowerCase()}s] start hitting [specific pain point].

Are you seeing that yet, or has your team found a way around it?`,
    `Quick observation: ${context.slice(0, 80)}

[Single sentence hypothesis about their challenge]

Worth a conversation if that resonates?`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function expandSearch(baseQuery: string): SearchExpandResult {
  const queryLower = baseQuery.toLowerCase();
  const expanded: SearchExpandResult["expandedQueries"] = [];
  const filters: SearchExpandResult["filters"] = {
    industries: [],
    companySize: [],
    signals: [],
    geos: [],
  };
  const negativeKeywords: string[] = [];

  // Industry detection with expansions
  const industryExpansions: Record<string, { industries: string[]; queries: { query: string; rationale: string; expectedResults: string }[] }> = {
    "ai|ml|machine learning|llm": {
      industries: ["AI/ML", "Technology", "Data"],
      queries: [
        { query: "AI startups hiring ML engineers", rationale: "Core AI companies building teams", expectedResults: "Early-mid stage AI companies" },
        { query: "companies building LLM products", rationale: "Generative AI adopters", expectedResults: "Companies integrating LLMs" },
        { query: "MLOps platform teams hiring", rationale: "ML infrastructure focus", expectedResults: "Companies scaling ML" },
        { query: "companies AI strategy 2024", rationale: "Active AI initiatives", expectedResults: "Companies investing in AI" },
      ],
    },
    "fintech|finance|banking|payments": {
      industries: ["Fintech", "Financial Services", "Payments"],
      queries: [
        { query: "fintech startups series A B", rationale: "Growth-stage fintech", expectedResults: "Funded fintech companies" },
        { query: "payment infrastructure companies hiring", rationale: "Payment tech builders", expectedResults: "Payment platform companies" },
        { query: "neobank challenger bank hiring", rationale: "Digital banking players", expectedResults: "Modern banking companies" },
      ],
    },
    "saas|b2b|enterprise": {
      industries: ["SaaS", "Enterprise Software", "B2B"],
      queries: [
        { query: "B2B SaaS companies scaling sales", rationale: "Growth-mode SaaS", expectedResults: "SaaS scaling revenue" },
        { query: "enterprise software startups series B", rationale: "Enterprise-focused startups", expectedResults: "Mid-stage enterprise companies" },
        { query: "SaaS companies 50-200 employees", rationale: "Scale-up stage", expectedResults: "Scaling SaaS companies" },
      ],
    },
    "healthcare|health|medical|biotech": {
      industries: ["Healthcare", "Healthtech", "Biotech"],
      queries: [
        { query: "healthtech startups hiring engineers", rationale: "Digital health builders", expectedResults: "Tech-focused healthcare" },
        { query: "healthcare AI companies", rationale: "AI in healthcare", expectedResults: "AI healthtech companies" },
        { query: "digital health startups funded", rationale: "Funded healthtech", expectedResults: "Well-capitalized healthtech" },
      ],
    },
  };

  for (const [pattern, data] of Object.entries(industryExpansions)) {
    if (new RegExp(pattern, "i").test(queryLower)) {
      filters.industries.push(...data.industries);
      expanded.push(...data.queries);
    }
  }

  // Role-based expansions
  if (/engineer|developer|dev\b/i.test(queryLower)) {
    filters.signals.push("Hiring Engineers", "Engineering Growth");
    expanded.push(
      { query: "companies hiring staff principal engineers", rationale: "Senior hires = serious investment", expectedResults: "Well-funded tech companies" },
      { query: "startups doubling engineering team", rationale: "Aggressive eng growth", expectedResults: "High-growth companies" },
      { query: "companies hiring 10+ engineers", rationale: "Volume hiring signal", expectedResults: "Scaling tech companies" },
    );
  }
  if (/sales|sdr|ae|revenue/i.test(queryLower)) {
    filters.signals.push("Hiring Sales", "Scaling Revenue");
    expanded.push(
      { query: "companies building outbound sales team", rationale: "Sales investment", expectedResults: "Growth-stage companies" },
      { query: "startups hiring VP of Sales", rationale: "Sales leadership", expectedResults: "Companies professionalizing sales" },
      { query: "companies expanding sales EMEA APAC", rationale: "Geographic expansion", expectedResults: "Internationally expanding" },
    );
  }

  // Funding stage expansions
  if (/series|funded|raised|seed/i.test(queryLower)) {
    filters.companySize.push("Series A (11-50)", "Series B (51-200)", "Series C+ (200+)");
    expanded.push(
      { query: "recently funded startups 2024", rationale: "Fresh capital", expectedResults: "Recently funded companies" },
      { query: "series B companies aggressive hiring", rationale: "Growth stage", expectedResults: "Well-funded growth companies" },
    );
  }

  // Location expansions
  if (/remote|distributed/i.test(queryLower)) {
    filters.geos.push("Remote-first", "Global");
  }
  if (/bay area|sf|silicon valley/i.test(queryLower)) {
    filters.geos.push("San Francisco Bay Area");
  }
  if (/nyc|new york/i.test(queryLower)) {
    filters.geos.push("New York");
  }

  // Add negative keywords
  negativeKeywords.push("intern", "junior", "entry level", "part-time", "contractor");

  // Fallback expansions
  if (expanded.length === 0) {
    expanded.push(
      { query: `${baseQuery} startups hiring`, rationale: "Hiring signal overlay", expectedResults: "Active startups" },
      { query: `${baseQuery} series A B funded`, rationale: "Funded companies", expectedResults: "Well-capitalized companies" },
      { query: `fast growing ${baseQuery}`, rationale: "Growth signal", expectedResults: "High-growth companies" },
      { query: `${baseQuery} scaling team 2024`, rationale: "Current activity", expectedResults: "Currently scaling" },
    );
  }

  return {
    originalQuery: baseQuery,
    expandedQueries: expanded.slice(0, 8),
    filters,
    negativeKeywords,
  };
}

function discoverPainPoints(companyName: string, signals: string[]): PainDiscoveryResult {
  const hypotheses: PainDiscoveryResult["hypotheses"] = [];
  let urgencyScore = 0;
  let stageScore = 0;

  const signalPatterns: {
    pattern: RegExp;
    pain: string;
    evidence: string;
    confidence: "high" | "medium" | "low";
    angle: string;
    template: string;
    urgencyBoost: number;
    stageBoost: number;
  }[] = [
    {
      pattern: /hiring.*engineer|engineer.*hiring|growing.*team/i,
      pain: "Maintaining engineering velocity while scaling the team",
      evidence: "Engineering hiring indicates growth pressure - velocity often drops as teams scale",
      confidence: "high",
      angle: "Engineering scaling",
      template: `Noticed ${companyName} is growing the eng team - at this stage, most companies find their deployment frequency drops by 40% even as headcount doubles.\n\nIs that something you're seeing?`,
      urgencyBoost: 2,
      stageBoost: 1,
    },
    {
      pattern: /platform|devops|infra/i,
      pain: "Developer productivity bottlenecks from infrastructure complexity",
      evidence: "Platform/DevOps investment signals internal friction with developer experience",
      confidence: "high",
      angle: "Developer experience",
      template: `Saw you're investing in platform engineering - usually that means developers are spending too much time fighting infra instead of building product.\n\nHow much time is going to non-feature work?`,
      urgencyBoost: 2,
      stageBoost: 2,
    },
    {
      pattern: /sdr|bdr|sales.*hiring|outbound/i,
      pain: "Pipeline generation efficiency as the sales team scales",
      evidence: "Sales hiring indicates revenue pressure - efficiency per rep usually drops at scale",
      confidence: "high",
      angle: "Sales efficiency",
      template: `Noticed ${companyName} is scaling the sales team - curious how you're maintaining efficiency per rep.\n\nAre you seeing research time increase as the team grows?`,
      urgencyBoost: 2,
      stageBoost: 1,
    },
    {
      pattern: /series\s*[abc]|funding|raised/i,
      pain: "Pressure to hit aggressive milestones with new capital",
      evidence: "Post-funding companies face intense pressure to prove growth thesis",
      confidence: "medium",
      angle: "Post-funding scaling",
      template: `Congrats on the raise - that usually means aggressive targets for the next 18 months.\n\nWhat's the biggest bottleneck to hitting those numbers?`,
      urgencyBoost: 3,
      stageBoost: 2,
    },
    {
      pattern: /ml|ai|machine\s*learning|llm|gpt/i,
      pain: "AI implementation complexity and infrastructure costs",
      evidence: "AI investment often hits deployment and cost optimization challenges at scale",
      confidence: "high",
      angle: "AI scaling",
      template: `Saw ${companyName} is investing in AI - most teams hit a wall where model deployment takes weeks and costs start spiraling.\n\nHow are you thinking about the build vs buy tradeoff for AI infra?`,
      urgencyBoost: 2,
      stageBoost: 2,
    },
    {
      pattern: /remote|distributed|async/i,
      pain: "Collaboration friction across distributed team",
      evidence: "Distributed teams struggle with communication overhead and alignment",
      confidence: "medium",
      angle: "Remote productivity",
      template: `Noticed ${companyName} is remote-first - distributed teams usually hit coordination costs around 50-100 people.\n\nHow are you managing async communication at scale?`,
      urgencyBoost: 1,
      stageBoost: 1,
    },
    {
      pattern: /soc\s*2|compliance|security|gdpr|hipaa/i,
      pain: "Compliance overhead slowing down product development",
      evidence: "Compliance requirements create tension with shipping velocity",
      confidence: "high",
      angle: "Compliance efficiency",
      template: `Saw ${companyName} is SOC 2 compliant - maintaining compliance while shipping fast is usually a constant tension.\n\nHow much engineering time goes to compliance work?`,
      urgencyBoost: 1,
      stageBoost: 1,
    },
    {
      pattern: /expand|new\s*office|international|global/i,
      pain: "Operational complexity from geographic expansion",
      evidence: "Expansion creates coordination and localization challenges",
      confidence: "medium",
      angle: "Expansion scaling",
      template: `Noticed ${companyName} is expanding internationally - that usually surfaces unexpected operational complexity.\n\nWhat's been the biggest surprise so far?`,
      urgencyBoost: 1,
      stageBoost: 1,
    },
  ];

  for (const signal of signals) {
    for (const patternDef of signalPatterns) {
      if (patternDef.pattern.test(signal)) {
        // Avoid duplicate pains
        if (!hypotheses.some(h => h.pain === patternDef.pain)) {
          hypotheses.push({
            pain: patternDef.pain,
            evidence: patternDef.evidence,
            confidence: patternDef.confidence,
            outreachAngle: patternDef.angle,
            messageTemplate: patternDef.template,
          });
          urgencyScore += patternDef.urgencyBoost;
          stageScore += patternDef.stageBoost;
        }
      }
    }
  }

  // Fallback hypothesis
  if (hypotheses.length === 0) {
    hypotheses.push({
      pain: "Generic scaling challenges as the company grows",
      evidence: "Growth signals suggest emerging operational needs",
      confidence: "low",
      outreachAngle: "Growth enablement",
      messageTemplate: `Noticed ${companyName} is growing - curious what challenges are emerging as you scale.\n\nWhat's the biggest bottleneck right now?`,
    });
    urgencyScore = 1;
    stageScore = 1;
  }

  // Determine buying stage and urgency
  const buyingStage: "awareness" | "consideration" | "decision" =
    stageScore >= 4 ? "decision" : stageScore >= 2 ? "consideration" : "awareness";
  const urgencyLevel: "high" | "medium" | "low" =
    urgencyScore >= 5 ? "high" : urgencyScore >= 3 ? "medium" : "low";

  return {
    hypotheses: hypotheses.slice(0, 5),
    buyingStage,
    urgencyLevel,
  };
}

// ============= API HANDLER =============

export async function POST(request: NextRequest) {
  try {
    const body: SimulationRequest = await request.json();

    switch (body.type) {
      case "buyer_journey": {
        if (!body.productDescription) {
          return NextResponse.json(
            { error: "productDescription is required" },
            { status: 400 }
          );
        }
        const result = simulateBuyerJourney(
          body.productDescription,
          body.targetAudience || "B2B companies"
        );
        return NextResponse.json(result);
      }

      case "message_test": {
        if (!body.message || !body.companyContext) {
          return NextResponse.json(
            { error: "message and companyContext are required" },
            { status: 400 }
          );
        }
        const result = simulateMessageResponse(
          body.message,
          body.companyContext,
          body.personaTitle || "VP"
        );
        return NextResponse.json(result);
      }

      case "search_expand": {
        if (!body.baseQuery) {
          return NextResponse.json(
            { error: "baseQuery is required" },
            { status: 400 }
          );
        }
        const result = expandSearch(body.baseQuery);
        return NextResponse.json(result);
      }

      case "pain_discovery": {
        if (!body.companyName || !body.signals) {
          return NextResponse.json(
            { error: "companyName and signals are required" },
            { status: 400 }
          );
        }
        const result = discoverPainPoints(body.companyName, body.signals);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: "Invalid simulation type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: "Simulation failed" },
      { status: 500 }
    );
  }
}
