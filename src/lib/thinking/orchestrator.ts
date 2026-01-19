/**
 * Thinking Model Orchestrator
 *
 * This is the brain of the research agent. It:
 * 1. Parses natural language queries into structured intent
 * 2. Plans a research strategy
 * 3. Executes the plan using crawlers
 * 4. Reasons about findings and ranks candidates
 * 5. Synthesizes everything into actionable insights
 */

import {
  ResearchQuery,
  ParsedIntent,
  ResearchPlan,
  ResearchExecution,
  CandidateReasoning,
  ResearchResult,
  ThinkingStep,
  ThinkingUpdate,
} from "./types";
import { crawlCompany, CrawlResult, filterByHiringPattern, aggregateSignals } from "../crawler/orchestrator";
import { JobPosting } from "../crawler/types";

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Parse a natural language query into structured intent
 * In production, this would use an LLM. For now, we use pattern matching.
 */
export function parseQueryIntent(query: string): ParsedIntent {
  const lower = query.toLowerCase();

  // Extract company type
  let companyType: string | undefined;
  if (lower.includes("b2b saas") || lower.includes("b2b software")) companyType = "B2B SaaS";
  else if (lower.includes("fintech")) companyType = "Fintech";
  else if (lower.includes("healthcare") || lower.includes("healthtech")) companyType = "Healthcare";
  else if (lower.includes("e-commerce") || lower.includes("ecommerce")) companyType = "E-commerce";
  else if (lower.includes("ai ") || lower.includes("artificial intelligence")) companyType = "AI/ML";

  // Extract funding stage
  const fundingStage: string[] = [];
  if (lower.includes("seed")) fundingStage.push("seed");
  if (lower.includes("series a")) fundingStage.push("series_a");
  if (lower.includes("series b")) fundingStage.push("series_b");
  if (lower.includes("series c")) fundingStage.push("series_c");
  if (lower.includes("raised") || lower.includes("funding")) {
    if (fundingStage.length === 0) fundingStage.push("recent_funding");
  }

  // Extract tech stack requirements
  const techStack: string[] = [];
  const techPatterns = [
    "react", "vue", "angular", "node", "python", "java", "golang", "ruby",
    "aws", "gcp", "azure", "kubernetes", "docker",
    "salesforce", "hubspot", "segment", "snowflake", "databricks",
    "openai", "langchain", "llm",
  ];
  for (const tech of techPatterns) {
    if (lower.includes(tech)) techStack.push(tech);
  }

  // Extract hiring signals
  const departments: string[] = [];
  const seniorities: string[] = [];
  let isFirstHire = false;
  let minOpenings: number | undefined;

  if (lower.includes("hiring sales") || lower.includes("sales team") || lower.includes("sales hire")) {
    departments.push("sales");
  }
  if (lower.includes("hiring engineer") || lower.includes("engineering team")) {
    departments.push("engineering");
  }
  if (lower.includes("first sales") || lower.includes("first hire") || lower.includes("first team")) {
    isFirstHire = true;
  }
  if (lower.includes("aggressively hiring") || lower.includes("hiring spree")) {
    minOpenings = 10;
  }

  // Extract recency
  let recency: string | undefined;
  if (lower.includes("recently") || lower.includes("just raised") || lower.includes("last month")) {
    recency = "30 days";
  } else if (lower.includes("last 6 months") || lower.includes("past 6 months")) {
    recency = "6 months";
  } else if (lower.includes("this year")) {
    recency = "12 months";
  }

  // Build understanding
  const understandingParts: string[] = [];
  if (companyType) understandingParts.push(`${companyType} companies`);
  if (fundingStage.length > 0) understandingParts.push(`with ${fundingStage.join(" or ")} funding`);
  if (departments.length > 0) understandingParts.push(`hiring in ${departments.join(", ")}`);
  if (isFirstHire) understandingParts.push("building their first team");
  if (techStack.length > 0) understandingParts.push(`using ${techStack.join(", ")}`);
  if (recency) understandingParts.push(`in the ${recency}`);

  const understanding = understandingParts.length > 0
    ? `Looking for ${understandingParts.join(", ")}`
    : "Looking for companies matching your criteria";

  return {
    originalQuery: query,
    understanding,
    criteria: {
      companyType,
      fundingStage: fundingStage.length > 0 ? fundingStage : undefined,
      techStack: techStack.length > 0 ? techStack : undefined,
      hiringSignals: {
        departments: departments.length > 0 ? departments : undefined,
        seniorities: seniorities.length > 0 ? seniorities : undefined,
        isFirstHire: isFirstHire || undefined,
        minOpenings,
      },
      recency,
    },
    confidence: 0.8, // Would be determined by LLM in production
  };
}

/**
 * Create a research plan based on parsed intent
 */
export function createResearchPlan(intent: ParsedIntent): ResearchPlan {
  const steps: ResearchPlan["steps"] = [];

  // Step 1: Always start with job board crawling
  steps.push({
    id: "crawl_jobs",
    type: "crawl_jobs",
    description: "Scanning job boards for hiring signals",
    source: "greenhouse,lever",
    params: {
      departments: intent.criteria.hiringSignals?.departments,
      minOpenings: intent.criteria.hiringSignals?.minOpenings,
    },
  });

  // Step 2: Filter by criteria
  steps.push({
    id: "filter_candidates",
    type: "filter",
    description: "Filtering companies by your criteria",
    params: {
      techStack: intent.criteria.techStack,
      departments: intent.criteria.hiringSignals?.departments,
      isFirstHire: intent.criteria.hiringSignals?.isFirstHire,
    },
    dependsOn: ["crawl_jobs"],
  });

  // Step 3: Rank and reason
  steps.push({
    id: "rank_candidates",
    type: "rank",
    description: "Analyzing and ranking candidates",
    params: {},
    dependsOn: ["filter_candidates"],
  });

  return {
    id: generateId(),
    intent,
    steps,
    estimatedTime: 30, // seconds
    createdAt: new Date().toISOString(),
  };
}

/**
 * Score and reason about a candidate
 */
function reasonAboutCandidate(
  result: CrawlResult,
  intent: ParsedIntent
): CandidateReasoning {
  const matchedCriteria: CandidateReasoning["matchedCriteria"] = [];
  const unmatchedCriteria: string[] = [];

  let score = 50; // Base score

  // Check hiring signals
  if (intent.criteria.hiringSignals?.departments) {
    const wantedDepts = intent.criteria.hiringSignals.departments;
    const hasDepts = result.jobs.some((job) =>
      wantedDepts.some((d) => job.department.includes(d))
    );
    if (hasDepts) {
      score += 15;
      const matchingJobs = result.jobs.filter((job) =>
        wantedDepts.some((d) => job.department.includes(d))
      );
      matchedCriteria.push({
        criterion: `Hiring ${wantedDepts.join("/")}`,
        evidence: `${matchingJobs.length} open ${wantedDepts.join("/")} positions`,
        source: matchingJobs[0]?.sourceType || "job board",
        sourceUrl: matchingJobs[0]?.sourceUrl,
      });
    } else {
      unmatchedCriteria.push(`Not hiring in ${wantedDepts.join("/")}`);
    }
  }

  // Check tech stack
  if (intent.criteria.techStack && intent.criteria.techStack.length > 0) {
    const allTech = new Set(result.jobs.flatMap((job) => job.techStack));
    const matchedTech = intent.criteria.techStack.filter((t) => allTech.has(t));
    if (matchedTech.length > 0) {
      score += 10;
      matchedCriteria.push({
        criterion: `Uses ${matchedTech.join(", ")}`,
        evidence: `Found in job requirements`,
        source: "job postings",
      });
    }
  }

  // Check growth signal
  if (result.hiringVelocity) {
    if (result.hiringVelocity.growthSignal === "aggressive") {
      score += 20;
      matchedCriteria.push({
        criterion: "Aggressive hiring",
        evidence: `${result.hiringVelocity.totalOpenings} open positions`,
        source: "hiring analysis",
      });
    } else if (result.hiringVelocity.growthSignal === "moderate") {
      score += 10;
    }
  }

  // Check for first hire signals
  if (intent.criteria.hiringSignals?.isFirstHire) {
    const firstHireJobs = result.jobs.filter((job) =>
      job.painPoints.some((p) =>
        p.includes("building from scratch") || p.includes("founding") || p.includes("first")
      )
    );
    if (firstHireJobs.length > 0) {
      score += 15;
      matchedCriteria.push({
        criterion: "Building first team",
        evidence: `Job description mentions "${firstHireJobs[0].painPoints.find((p) => p.includes("first") || p.includes("founding"))}"`,
        source: firstHireJobs[0].sourceType,
        sourceUrl: firstHireJobs[0].sourceUrl,
      });
    }
  }

  // Check pain points
  const allPainPoints = result.jobs.flatMap((job) => job.painPoints);
  if (allPainPoints.length > 0) {
    score += 5;
    matchedCriteria.push({
      criterion: "Growth indicators",
      evidence: allPainPoints.slice(0, 3).join(", "),
      source: "job descriptions",
    });
  }

  // Cap score at 100
  score = Math.min(100, score);

  // Determine confidence
  let confidence: CandidateReasoning["confidence"] = "medium";
  if (matchedCriteria.length >= 3 && score >= 75) confidence = "high";
  else if (matchedCriteria.length <= 1 || score < 50) confidence = "low";

  // Generate why now
  const whyNowParts: string[] = [];
  if (result.hiringVelocity?.growthSignal === "aggressive") {
    whyNowParts.push(`aggressively hiring with ${result.hiringVelocity.totalOpenings} open roles`);
  }
  if (matchedCriteria.some((m) => m.criterion.includes("first team"))) {
    whyNowParts.push("building their first team");
  }
  if (result.jobs.some((j) => j.painPoints.includes("scaling challenges"))) {
    whyNowParts.push("facing scaling challenges");
  }

  const whyNow = whyNowParts.length > 0
    ? `${result.company.name} is ${whyNowParts.join(" and ")}`
    : `${result.company.name} is actively hiring and shows buying intent`;

  // Generate full reasoning
  const reasoning = `${result.company.name} scored ${score}/100 based on ${matchedCriteria.length} matched criteria. ${whyNow}. ${unmatchedCriteria.length > 0 ? `Potential gaps: ${unmatchedCriteria.join(", ")}.` : "All specified criteria met."}`;

  return {
    companyDomain: result.company.domain,
    companyName: result.company.name,
    score,
    confidence,
    matchedCriteria,
    unmatchedCriteria,
    whyNow,
    reasoning,
  };
}

/**
 * Execute a research plan
 */
export async function executeResearchPlan(
  plan: ResearchPlan,
  companies: Array<{ domain: string; name: string }>,
  onUpdate?: (update: ThinkingUpdate) => void
): Promise<ResearchResult> {
  const startTime = Date.now();
  const execution: ResearchExecution = {
    planId: plan.id,
    status: "executing",
    steps: {},
    intermediateResults: {
      companiesFound: 0,
      signalsFound: 0,
      candidatesAfterFilter: 0,
    },
    startedAt: new Date().toISOString(),
  };

  // Initialize step statuses
  for (const step of plan.steps) {
    execution.steps[step.id] = { status: "pending" };
  }

  let crawlResults: CrawlResult[] = [];
  let filteredResults: CrawlResult[] = [];
  let candidates: CandidateReasoning[] = [];

  // Execute each step
  for (const step of plan.steps) {
    execution.currentStep = step.id;
    execution.steps[step.id] = {
      status: "running",
      startedAt: new Date().toISOString(),
    };

    onUpdate?.({
      type: "step_started",
      stepId: step.id,
      data: {
        id: step.id,
        type: step.type === "crawl_jobs" ? "searching" : step.type === "filter" ? "analyzing" : "reasoning",
        status: "running",
        title: step.description,
        description: `Executing ${step.type}...`,
        progress: 0,
      },
    });

    try {
      if (step.type === "crawl_jobs") {
        // Crawl each company
        for (let i = 0; i < companies.length; i++) {
          const company = companies[i];
          const result = await crawlCompany(company.domain, company.name);
          if (result.jobs.length > 0) {
            crawlResults.push(result);
          }

          onUpdate?.({
            type: "step_progress",
            stepId: step.id,
            data: {
              progress: Math.round(((i + 1) / companies.length) * 100),
              detail: `Crawled ${company.name}: ${result.jobs.length} jobs found`,
            },
          });
        }

        execution.intermediateResults.companiesFound = crawlResults.length;
        execution.intermediateResults.signalsFound = crawlResults.reduce(
          (sum, r) => sum + r.signals.length,
          0
        );
      } else if (step.type === "filter") {
        // Filter results
        filteredResults = filterByHiringPattern(crawlResults, {
          departments: step.params.departments as JobPosting["department"][] | undefined,
          techStack: step.params.techStack as string[] | undefined,
        });
        execution.intermediateResults.candidatesAfterFilter = filteredResults.length;
      } else if (step.type === "rank") {
        // Reason about each candidate
        for (const result of filteredResults) {
          const reasoning = reasonAboutCandidate(result, plan.intent);
          candidates.push(reasoning);
        }

        // Sort by score
        candidates.sort((a, b) => b.score - a.score);
      }

      execution.steps[step.id] = {
        status: "completed",
        startedAt: execution.steps[step.id].startedAt,
        completedAt: new Date().toISOString(),
      };

      onUpdate?.({
        type: "step_completed",
        stepId: step.id,
        data: {
          id: step.id,
          type: step.type === "crawl_jobs" ? "searching" : step.type === "filter" ? "analyzing" : "reasoning",
          status: "completed",
          title: step.description,
          description: "Completed",
          progress: 100,
        },
      });
    } catch (error) {
      execution.steps[step.id] = {
        status: "failed",
        startedAt: execution.steps[step.id].startedAt,
        completedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };

      onUpdate?.({
        type: "step_failed",
        stepId: step.id,
        data: {
          id: step.id,
          type: "searching",
          status: "failed",
          title: step.description,
          description: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  execution.status = "completed";
  execution.completedAt = new Date().toISOString();

  // Aggregate signals for summary
  const aggregated = aggregateSignals(filteredResults);

  const result: ResearchResult = {
    id: generateId(),
    query: { query: plan.intent.originalQuery, maxResults: 20 },
    intent: plan.intent,
    execution,
    candidates: candidates.slice(0, 20),
    summary: {
      totalFound: crawlResults.length,
      qualified: candidates.length,
      topSignals: Object.keys(aggregated.byType).slice(0, 5),
      commonTechStack: aggregated.topTechStack.slice(0, 10).map((t) => t.tech),
      insights: [
        `Found ${crawlResults.length} companies with active job postings`,
        `${candidates.filter((c) => c.confidence === "high").length} high-confidence matches`,
        aggregated.topTechStack[0]
          ? `Most common tech: ${aggregated.topTechStack[0].tech}`
          : "",
      ].filter(Boolean),
    },
    completedAt: new Date().toISOString(),
    duration: Date.now() - startTime,
  };

  onUpdate?.({
    type: "result",
    data: result,
  });

  return result;
}

/**
 * Main entry point: Run a complete research flow
 */
export async function runResearch(
  query: string,
  companies: Array<{ domain: string; name: string }>,
  onUpdate?: (update: ThinkingUpdate) => void
): Promise<ResearchResult> {
  // Step 1: Parse intent
  onUpdate?.({
    type: "step_started",
    stepId: "parse",
    data: {
      id: "parse",
      type: "understanding",
      status: "running",
      title: "Understanding your query",
      description: "Parsing natural language...",
    },
  });

  const intent = parseQueryIntent(query);

  onUpdate?.({
    type: "step_completed",
    stepId: "parse",
    data: {
      id: "parse",
      type: "understanding",
      status: "completed",
      title: "Understanding your query",
      description: intent.understanding,
    },
  });

  // Step 2: Create plan
  onUpdate?.({
    type: "step_started",
    stepId: "plan",
    data: {
      id: "plan",
      type: "planning",
      status: "running",
      title: "Planning research strategy",
      description: "Determining optimal search approach...",
    },
  });

  const plan = createResearchPlan(intent);

  onUpdate?.({
    type: "step_completed",
    stepId: "plan",
    data: {
      id: "plan",
      type: "planning",
      status: "completed",
      title: "Planning research strategy",
      description: `Will execute ${plan.steps.length} research steps`,
      details: plan.steps.map((s) => s.description),
    },
  });

  // Step 3: Execute plan
  return executeResearchPlan(plan, companies, onUpdate);
}
