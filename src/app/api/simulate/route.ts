import { NextRequest, NextResponse } from "next/server";

// Buyer simulation system - uses AI to understand buying patterns
// and generate smarter searches + outreach

interface SimulationRequest {
  type: "buyer_journey" | "message_test" | "search_expand" | "pain_discovery";
  // For buyer_journey
  productDescription?: string;
  targetAudience?: string;
  // For message_test
  message?: string;
  companyContext?: string;
  personaTitle?: string;
  // For search_expand
  baseQuery?: string;
  // For pain_discovery
  companyName?: string;
  signals?: string[];
}

interface BuyerJourneyResult {
  buyerProfile: {
    title: string;
    painPoints: string[];
    triggers: string[];
    timeline: string;
  };
  signalsToFind: {
    signal: string;
    why: string;
    urgency: "high" | "medium" | "low";
  }[];
  searchQueries: string[];
  outreachAngles: {
    angle: string;
    opener: string;
  }[];
}

interface MessageTestResult {
  score: number; // 1-10
  likelihood: "high" | "medium" | "low";
  feedback: string[];
  improvements: string[];
  rewrittenMessage: string;
}

interface SearchExpandResult {
  originalQuery: string;
  expandedQueries: {
    query: string;
    rationale: string;
  }[];
  filters: {
    industries: string[];
    companySize: string[];
    signals: string[];
  };
}

interface PainDiscoveryResult {
  hypotheses: {
    pain: string;
    evidence: string;
    confidence: "high" | "medium" | "low";
    outreachAngle: string;
  }[];
}

// Simulate buyer journey based on product description
function simulateBuyerJourney(product: string, audience: string): BuyerJourneyResult {
  // This would ideally call Claude API, but for now we'll use smart heuristics
  const isDevTool = /developer|engineering|code|api|sdk|devops|ci\/cd|testing/i.test(product);
  const isSalesTool = /sales|crm|outreach|pipeline|revenue/i.test(product);
  const isMarketingTool = /marketing|seo|content|analytics|ads/i.test(product);
  const isSecurityTool = /security|compliance|soc|gdpr|privacy/i.test(product);
  const isAITool = /ai|ml|machine learning|llm|gpt|automation/i.test(product);

  let profile: BuyerJourneyResult["buyerProfile"];
  let signals: BuyerJourneyResult["signalsToFind"];
  let queries: string[];
  let angles: BuyerJourneyResult["outreachAngles"];

  if (isDevTool) {
    profile = {
      title: "VP of Engineering / Engineering Manager",
      painPoints: [
        "Slow deployment cycles",
        "Developer productivity bottlenecks",
        "Scaling engineering team",
        "Technical debt accumulation",
        "Onboarding new engineers takes too long",
      ],
      triggers: [
        "Hiring 5+ engineers in a quarter",
        "Migrating to cloud/Kubernetes",
        "Series A/B funding (need to scale fast)",
        "New VP of Engineering hired",
        "Complaints about tooling in job posts",
      ],
      timeline: "3-6 months from trigger to purchase",
    };
    signals = [
      { signal: "Hiring Senior/Staff Engineers", why: "Scaling team = need better tooling", urgency: "high" },
      { signal: "DevOps/Platform Engineer roles", why: "Building internal platform", urgency: "high" },
      { signal: "Kubernetes/Cloud in job posts", why: "Modernizing infrastructure", urgency: "medium" },
      { signal: "Recent funding round", why: "Budget unlocked for tools", urgency: "high" },
      { signal: "Engineering blog posts", why: "Team cares about craft", urgency: "low" },
    ];
    queries = [
      "companies hiring senior engineers kubernetes",
      "startups scaling engineering team",
      "series A companies hiring devops",
      "companies migrating to cloud",
      "engineering teams hiring platform engineers",
    ];
    angles = [
      { angle: "Scaling pain", opener: "Noticed you're growing the eng team fast - that usually means deployment bottlenecks are coming..." },
      { angle: "New leader", opener: "Congrats on the new VP Eng hire - new leaders often look to upgrade the toolchain..." },
      { angle: "Tech modernization", opener: "Saw you're moving to Kubernetes - most teams hit CI/CD pain around this stage..." },
    ];
  } else if (isSalesTool) {
    profile = {
      title: "VP of Sales / Head of Revenue",
      painPoints: [
        "Pipeline visibility issues",
        "Rep productivity",
        "Forecasting accuracy",
        "Lead quality",
        "Scaling sales team",
      ],
      triggers: [
        "Hiring SDRs/AEs in volume",
        "New VP of Sales hired",
        "Series B+ funding",
        "Expanding to new markets",
        "Missing revenue targets",
      ],
      timeline: "1-3 months from trigger to purchase",
    };
    signals = [
      { signal: "Hiring multiple SDRs/AEs", why: "Scaling sales = need tools", urgency: "high" },
      { signal: "New VP/Head of Sales", why: "New leaders change tools", urgency: "high" },
      { signal: "Series B+ funding", why: "Growth mode", urgency: "high" },
      { signal: "Sales ops/enablement hire", why: "Professionalizing sales", urgency: "medium" },
      { signal: "Expanding to new geo", why: "New market = new process", urgency: "medium" },
    ];
    queries = [
      "companies hiring SDRs account executives",
      "series B startups scaling sales",
      "companies hiring VP of Sales",
      "startups expanding sales team",
      "companies hiring sales operations",
    ];
    angles = [
      { angle: "Scaling team", opener: "Saw you're hiring 5+ sales reps - most teams hit pipeline visibility issues around this size..." },
      { angle: "New leader", opener: "Noticed you just brought on a new sales leader - they usually audit the tech stack first 90 days..." },
      { angle: "Growth stage", opener: "Series B usually means aggressive revenue targets - curious how you're thinking about sales tooling..." },
    ];
  } else if (isAITool) {
    profile = {
      title: "CTO / VP of Engineering / ML Lead",
      painPoints: [
        "AI implementation complexity",
        "Model deployment challenges",
        "Data pipeline issues",
        "Cost of AI infrastructure",
        "Lack of ML expertise",
      ],
      triggers: [
        "Hiring ML/AI engineers",
        "AI mentioned in job posts",
        "Competitor launched AI features",
        "New AI-focused leadership",
        "Funding for AI initiatives",
      ],
      timeline: "2-4 months from trigger to purchase",
    };
    signals = [
      { signal: "Hiring ML Engineers", why: "Building AI capabilities", urgency: "high" },
      { signal: "AI/ML in job descriptions", why: "AI is strategic priority", urgency: "high" },
      { signal: "Data Engineer hiring", why: "Building data infrastructure for AI", urgency: "medium" },
      { signal: "Recent AI product launch", why: "Invested in AI, need more tools", urgency: "medium" },
      { signal: "LLM/GPT mentioned anywhere", why: "Exploring generative AI", urgency: "high" },
    ];
    queries = [
      "companies hiring ML engineers",
      "startups building AI features",
      "companies using LLMs GPT",
      "hiring data scientists machine learning",
      "AI-first companies hiring",
    ];
    angles = [
      { angle: "AI adoption", opener: "Saw you're building out the ML team - most companies hit deployment bottlenecks around this stage..." },
      { angle: "LLM exploration", opener: "Noticed you're exploring LLMs - curious how you're thinking about build vs buy..." },
      { angle: "Scaling AI", opener: "Your AI features are impressive - usually scaling those creates infrastructure challenges..." },
    ];
  } else {
    // Generic B2B
    profile = {
      title: "Department Head / VP",
      painPoints: [
        "Operational inefficiency",
        "Scaling challenges",
        "Tool fragmentation",
        "Reporting/visibility gaps",
        "Team productivity",
      ],
      triggers: [
        "Rapid hiring",
        "New leadership",
        "Funding round",
        "Market expansion",
        "Competitive pressure",
      ],
      timeline: "2-6 months from trigger to purchase",
    };
    signals = [
      { signal: "Rapid hiring", why: "Growth creates tool needs", urgency: "high" },
      { signal: "New leadership", why: "New leaders change tools", urgency: "high" },
      { signal: "Recent funding", why: "Budget for improvements", urgency: "medium" },
      { signal: "Job posts mention pain points", why: "Actively trying to solve", urgency: "high" },
      { signal: "Competitor mentions", why: "Evaluating alternatives", urgency: "medium" },
    ];
    queries = [
      "fast growing startups hiring",
      "series A B companies scaling",
      "companies hiring operations",
      "startups expanding team",
      "companies modernizing tools",
    ];
    angles = [
      { angle: "Growth pain", opener: "Noticed you're scaling fast - that usually surfaces operational challenges..." },
      { angle: "New leader", opener: "Saw you have new leadership - they often look to upgrade tools in the first quarter..." },
      { angle: "Efficiency play", opener: "Companies at your stage usually hit efficiency walls - curious how you're handling..." },
    ];
  }

  return {
    buyerProfile: profile,
    signalsToFind: signals,
    searchQueries: queries,
    outreachAngles: angles,
  };
}

// Test a message against a simulated persona
function simulateMessageResponse(
  message: string,
  companyContext: string,
  personaTitle: string
): MessageTestResult {
  const issues: string[] = [];
  const improvements: string[] = [];
  let score = 5;

  // Check for common issues
  if (message.length < 50) {
    issues.push("Message is too short - needs more context");
    score -= 1;
  }
  if (message.length > 500) {
    issues.push("Message is too long - busy executives won't read it");
    score -= 1;
  }
  if (!message.toLowerCase().includes(companyContext.toLowerCase().split(" ")[0])) {
    issues.push("Doesn't mention the company - feels like a template");
    score -= 2;
    improvements.push("Reference something specific about their company");
  }
  if (/I wanted to reach out|I hope this email finds you|I came across your/i.test(message)) {
    issues.push("Uses generic opener - gets ignored");
    score -= 1;
    improvements.push("Start with value or insight, not 'I wanted to...'");
  }
  if (!/\?/.test(message)) {
    issues.push("No question - doesn't invite response");
    score -= 1;
    improvements.push("End with a specific, easy-to-answer question");
  }
  if (/schedule a call|book a meeting|15 minutes/i.test(message)) {
    issues.push("Asks for meeting too early - needs to earn attention first");
    score -= 1;
    improvements.push("Offer value before asking for time");
  }
  if (/we help companies|we're the leading|our platform/i.test(message)) {
    issues.push("Too focused on 'we' - should focus on them");
    score -= 1;
    improvements.push("Make it about their challenges, not your product");
  }

  // Positive signals
  if (/noticed|saw that|congrats on/i.test(message)) {
    score += 1;
  }
  if (message.includes(personaTitle.split(" ")[0]) || message.includes(companyContext)) {
    score += 1;
  }

  score = Math.max(1, Math.min(10, score));

  const likelihood: "high" | "medium" | "low" =
    score >= 7 ? "high" : score >= 5 ? "medium" : "low";

  // Generate rewritten message
  const rewritten = `Hey,

Noticed ${companyContext} - that usually means [specific challenge related to their situation].

Curious: [relevant question about their approach]?

[One sentence about how you might help, focused on outcome not features]`;

  return {
    score,
    likelihood,
    feedback: issues.length > 0 ? issues : ["Message looks solid - personalized and concise"],
    improvements: improvements.length > 0 ? improvements : ["Consider A/B testing different value props"],
    rewrittenMessage: rewritten,
  };
}

// Expand a search query into multiple targeted queries
function expandSearch(baseQuery: string): SearchExpandResult {
  const keywords = baseQuery.toLowerCase().split(" ");
  const expanded: SearchExpandResult["expandedQueries"] = [];
  const filters: SearchExpandResult["filters"] = {
    industries: [],
    companySize: [],
    signals: [],
  };

  // Industry detection
  if (keywords.some(k => ["ai", "ml", "machine", "learning", "llm"].includes(k))) {
    filters.industries.push("AI/ML", "Technology", "Data");
    expanded.push(
      { query: "AI startups hiring engineers", rationale: "Core AI companies" },
      { query: "companies building LLM features", rationale: "LLM adopters" },
      { query: "ML platform teams hiring", rationale: "MLOps focus" }
    );
  }
  if (keywords.some(k => ["fintech", "finance", "banking", "payments"].includes(k))) {
    filters.industries.push("Fintech", "Financial Services", "Payments");
    expanded.push(
      { query: "fintech companies series A B", rationale: "Growth stage fintech" },
      { query: "payment startups hiring", rationale: "Payment infrastructure" },
      { query: "banking technology companies", rationale: "Bank tech modernization" }
    );
  }
  if (keywords.some(k => ["saas", "b2b", "enterprise", "software"].includes(k))) {
    filters.industries.push("SaaS", "Enterprise Software", "B2B");
    expanded.push(
      { query: "B2B SaaS companies scaling", rationale: "Growth stage SaaS" },
      { query: "enterprise software startups hiring", rationale: "Enterprise focus" },
      { query: "SaaS companies series A B", rationale: "Funded SaaS" }
    );
  }

  // Role detection
  if (keywords.some(k => ["engineer", "engineering", "developer", "dev"].includes(k))) {
    filters.signals.push("Hiring Engineers", "Engineering Growth");
    expanded.push(
      { query: "companies hiring senior engineers", rationale: "Senior roles = serious build" },
      { query: "startups scaling engineering team", rationale: "Team growth" },
      { query: "companies hiring 10+ engineers", rationale: "Aggressive hiring" }
    );
  }
  if (keywords.some(k => ["sales", "sdr", "ae", "revenue"].includes(k))) {
    filters.signals.push("Hiring Sales", "Scaling Revenue");
    expanded.push(
      { query: "companies hiring SDRs AEs", rationale: "Sales team growth" },
      { query: "startups scaling sales team", rationale: "Revenue focus" },
      { query: "companies hiring VP of Sales", rationale: "Sales leadership" }
    );
  }

  // Funding stage detection
  if (keywords.some(k => ["series", "funded", "raised", "a", "b", "c"].includes(k))) {
    filters.companySize.push("Series A", "Series B", "Series C");
    expanded.push(
      { query: "recently funded startups", rationale: "Fresh budget" },
      { query: "series B companies hiring", rationale: "Growth stage" },
      { query: "startups raised funding 2024", rationale: "Recent raises" }
    );
  }

  // Add default expansions if none matched
  if (expanded.length === 0) {
    expanded.push(
      { query: `${baseQuery} startups`, rationale: "Startup focus" },
      { query: `${baseQuery} companies hiring`, rationale: "Active hiring signal" },
      { query: `${baseQuery} series A B`, rationale: "Growth stage" },
      { query: `fast growing ${baseQuery}`, rationale: "Growth signal" }
    );
  }

  return {
    originalQuery: baseQuery,
    expandedQueries: expanded,
    filters,
  };
}

// Discover pain points based on company signals
function discoverPainPoints(companyName: string, signals: string[]): PainDiscoveryResult {
  const hypotheses: PainDiscoveryResult["hypotheses"] = [];

  for (const signal of signals) {
    const signalLower = signal.toLowerCase();

    if (signalLower.includes("hiring") && signalLower.includes("engineer")) {
      hypotheses.push({
        pain: "Scaling engineering velocity while maintaining quality",
        evidence: `Hiring engineers suggests growth - usually comes with tooling/process challenges`,
        confidence: "high",
        outreachAngle: "Engineering scaling pain",
      });
    }
    if (signalLower.includes("devops") || signalLower.includes("platform")) {
      hypotheses.push({
        pain: "Developer productivity and deployment speed",
        evidence: "Platform/DevOps hire = investing in developer experience",
        confidence: "high",
        outreachAngle: "Developer productivity",
      });
    }
    if (signalLower.includes("sales") || signalLower.includes("sdr")) {
      hypotheses.push({
        pain: "Pipeline generation and sales efficiency",
        evidence: "Scaling sales team = need for better prospecting tools",
        confidence: "high",
        outreachAngle: "Sales efficiency",
      });
    }
    if (signalLower.includes("series") || signalLower.includes("funding")) {
      hypotheses.push({
        pain: "Pressure to scale quickly with new capital",
        evidence: "Recent funding = aggressive growth targets",
        confidence: "medium",
        outreachAngle: "Post-funding scaling",
      });
    }
    if (signalLower.includes("remote") || signalLower.includes("distributed")) {
      hypotheses.push({
        pain: "Collaboration and communication across distributed team",
        evidence: "Remote-first = need for async collaboration tools",
        confidence: "medium",
        outreachAngle: "Remote team productivity",
      });
    }
    if (signalLower.includes("ai") || signalLower.includes("ml")) {
      hypotheses.push({
        pain: "AI implementation complexity and infrastructure",
        evidence: "AI focus = likely hitting model deployment/scaling challenges",
        confidence: "high",
        outreachAngle: "AI infrastructure",
      });
    }
  }

  // Add a default if no matches
  if (hypotheses.length === 0) {
    hypotheses.push({
      pain: "General scaling challenges",
      evidence: "Growth signals suggest scaling pains",
      confidence: "low",
      outreachAngle: "Growth enablement",
    });
  }

  return { hypotheses };
}

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
