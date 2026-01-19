import { getLLMProvider, LLMMessage } from "@/lib/providers/llm";
import {
  QueryPlanSchema,
  QueryPlan,
  UserConfig,
  SignalDefinition
} from "@/lib/schemas";

const QUERY_PLANNER_SYSTEM_PROMPT = `You are an expert search query planner for B2B lead generation. Your job is to create search queries that will find companies exhibiting specific buying signals.

CRITICAL RULES:
1. Each query should be designed to find evidence of specific signals
2. Queries should target news, press releases, job postings, SEC filings, company announcements
3. Do NOT use LinkedIn-specific queries
4. Include time modifiers for recent news (e.g., "2024", "recent", "announces")
5. Vary query structure: some exact phrases, some keyword combinations
6. Target specific evidence sources like:
   - News: "[company type] raises funding"
   - Job posts: "[company type] hiring [role]"
   - Press releases: "[company type] announces expansion"
   - SEC/Filings: "[company type] SEC filing"
7. Keep queries focused - each query should target 1-2 related signals

QUERY TEMPLATES:
- Funding: "[industry] startup raises Series [A/B/C]", "[industry] company secures funding 2024"
- Hiring: "[industry] company hiring [role]", "[role] job opening [geo]"
- Expansion: "[industry] company expands to [market]", "[company type] opens new office"
- Leadership: "[industry] company appoints new [CEO/CTO/VP]", "new [role] joins [company type]"
- Technology: "[industry] company adopts [technology]", "[company type] implements [solution]"
- Partnerships: "[industry] company partners with", "[company type] announces partnership"

OUTPUT FORMAT: Return a QueryPlan JSON object with:
- queries: Array of search queries with targetSignals, expectedSourceTypes, and rationale
- icpSummary: Brief summary of the ICP being targeted
- signalsSummary: Brief summary of signals being searched for`;

export async function planQueries(
  config: UserConfig,
  recentDomains: string[] = []
): Promise<QueryPlan> {
  const llm = getLLMProvider();

  const enabledSignals = config.signals.filter(s => s.enabled && !s.isDisqualifier);

  const userPrompt = buildQueryPlannerPrompt(config, enabledSignals, recentDomains);

  const messages: LLMMessage[] = [
    { role: "system", content: QUERY_PLANNER_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  const plan = await llm.completeStructured(
    messages,
    {
      schema: QueryPlanSchema,
      schemaName: "QueryPlan",
      maxRetries: 3,
    },
    { temperature: 0.7 }
  );

  return plan;
}

function buildQueryPlannerPrompt(
  config: UserConfig,
  signals: SignalDefinition[],
  recentDomains: string[]
): string {
  const icp = config.icp;

  const signalsList = signals
    .map((s, i) => `${i + 1}. [${s.category}/${s.priority}] ${s.name}: ${s.question}\n   Keywords: ${s.queryTemplates.join(", ")}`)
    .join("\n");

  const excludeInstructions = recentDomains.length > 0
    ? `\n\nEXCLUDE these domains seen recently: ${recentDomains.slice(0, 20).join(", ")}`
    : "";

  return `Create 20-40 search queries to find companies matching this profile:

WHAT WE SELL:
${config.offer}

IDEAL CUSTOMER PROFILE:
- Industries: ${icp.industries.join(", ") || "Any"}
- Geographies: ${icp.geos.join(", ") || "Any"}
- Company Size: ${icp.companySizeRange ? `${icp.companySizeRange.min || "Any"} - ${icp.companySizeRange.max || "Any"} employees` : "Any size"}
- Target Roles: ${icp.targetRoles.join(", ")}
- Exclude Industries: ${icp.excludeIndustries.join(", ") || "None"}
- Exclude Roles: ${icp.excludeRoles.join(", ") || "None"}

SIGNALS TO FIND (create queries that will surface evidence for these):
${signalsList}
${excludeInstructions}

Generate diverse queries across all enabled signals. Prioritize high-priority signals.
Focus on recent news and announcements (past 90 days).
Include geographic qualifiers where relevant.
Return your response as a valid QueryPlan JSON object.`;
}
