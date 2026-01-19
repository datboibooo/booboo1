import { SupabaseClient } from "@supabase/supabase-js";
import { UserConfig, LeadRecord, List, ListAccount, SignalRun, DoNotContact } from "@/lib/schemas";
import { v4 as uuidv4 } from "uuid";

// User Config Operations
export async function getUserConfig(
  supabase: SupabaseClient,
  userId: string
): Promise<UserConfig | null> {
  const { data, error } = await supabase
    .from("user_configs")
    .select("config")
    .eq("user_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.config as UserConfig;
}

export async function saveUserConfig(
  supabase: SupabaseClient,
  userId: string,
  config: UserConfig
): Promise<void> {
  // Get current version
  const { data: existing } = await supabase
    .from("user_configs")
    .select("version")
    .eq("user_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const newVersion = (existing?.version || 0) + 1;
  const newConfig = { ...config, version: newVersion };

  const { error } = await supabase.from("user_configs").insert({
    user_id: userId,
    version: newVersion,
    config: newConfig,
  });

  if (error) throw error;
}

// Lead Operations
export async function getLeadsByDate(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<LeadRecord[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("score", { ascending: false });

  if (error) throw error;
  return (data || []).map(transformLeadFromDb);
}

export async function getLeadsWithFilters(
  supabase: SupabaseClient,
  userId: string,
  filters: {
    date?: string;
    status?: string;
    minScore?: number;
    maxScore?: number;
    industry?: string;
    signalCategory?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ leads: LeadRecord[]; total: number }> {
  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (filters.date) {
    query = query.eq("date", filters.date);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.minScore !== undefined) {
    query = query.gte("score", filters.minScore);
  }
  if (filters.maxScore !== undefined) {
    query = query.lte("score", filters.maxScore);
  }
  if (filters.industry) {
    query = query.eq("industry", filters.industry);
  }

  query = query.order("score", { ascending: false });

  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return {
    leads: (data || []).map(transformLeadFromDb),
    total: count || 0,
  };
}

export async function saveLead(
  supabase: SupabaseClient,
  lead: LeadRecord
): Promise<void> {
  const { error } = await supabase.from("leads").upsert(transformLeadToDb(lead));
  if (error) throw error;
}

export async function saveLeads(
  supabase: SupabaseClient,
  leads: LeadRecord[]
): Promise<void> {
  if (leads.length === 0) return;
  const { error } = await supabase.from("leads").upsert(leads.map(transformLeadToDb));
  if (error) throw error;
}

export async function updateLeadStatus(
  supabase: SupabaseClient,
  leadId: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);
  if (error) throw error;
}

export async function getLead(
  supabase: SupabaseClient,
  leadId: string
): Promise<LeadRecord | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (error || !data) return null;
  return transformLeadFromDb(data);
}

// List Operations
export async function getLists(
  supabase: SupabaseClient,
  userId: string,
  type?: "hunt" | "watch"
): Promise<List[]> {
  let query = supabase
    .from("lists")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(transformListFromDb);
}

export async function createList(
  supabase: SupabaseClient,
  userId: string,
  list: Partial<List>
): Promise<List> {
  const newList = {
    id: uuidv4(),
    user_id: userId,
    name: list.name,
    type: list.type,
    description: list.description || null,
    archived: false,
  };

  const { data, error } = await supabase
    .from("lists")
    .insert(newList)
    .select()
    .single();

  if (error) throw error;
  return transformListFromDb(data);
}

export async function getListAccounts(
  supabase: SupabaseClient,
  listId: string
): Promise<ListAccount[]> {
  const { data, error } = await supabase
    .from("list_accounts")
    .select("*")
    .eq("list_id", listId)
    .order("added_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(transformListAccountFromDb);
}

export async function addAccountsToList(
  supabase: SupabaseClient,
  listId: string,
  accounts: Array<{ domain: string; companyName?: string }>
): Promise<number> {
  const records = accounts.map((a) => ({
    id: uuidv4(),
    list_id: listId,
    domain: a.domain,
    company_name: a.companyName || null,
    status: "active",
  }));

  const { error, count } = await supabase
    .from("list_accounts")
    .upsert(records, { onConflict: "list_id,domain", ignoreDuplicates: true })
    .select();

  if (error) throw error;
  return count || records.length;
}

// Signal Run Operations
export async function createSignalRun(
  supabase: SupabaseClient,
  userId: string,
  mode: "hunt" | "watch",
  listId?: string
): Promise<SignalRun> {
  const newRun = {
    id: uuidv4(),
    user_id: userId,
    mode,
    list_id: listId || null,
    status: "running",
  };

  const { data, error } = await supabase
    .from("signal_runs")
    .insert(newRun)
    .select()
    .single();

  if (error) throw error;
  return transformSignalRunFromDb(data);
}

export async function updateSignalRun(
  supabase: SupabaseClient,
  runId: string,
  updates: Partial<{ status: string; stats: object; error: string; finished_at: string }>
): Promise<void> {
  const { error } = await supabase
    .from("signal_runs")
    .update(updates)
    .eq("id", runId);
  if (error) throw error;
}

// Do Not Contact Operations
export async function getDNC(
  supabase: SupabaseClient,
  userId: string
): Promise<DoNotContact[]> {
  const { data, error } = await supabase
    .from("do_not_contact")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(transformDNCFromDb);
}

export async function addToDNC(
  supabase: SupabaseClient,
  userId: string,
  type: "company" | "domain" | "person",
  value: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase.from("do_not_contact").upsert({
    id: uuidv4(),
    user_id: userId,
    type,
    value,
    reason: reason || null,
  }, { onConflict: "user_id,type,value" });

  if (error) throw error;
}

export async function isDNC(
  supabase: SupabaseClient,
  userId: string,
  domain: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from("do_not_contact")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "domain")
    .eq("value", domain);

  if (error) throw error;
  return (count || 0) > 0;
}

// Domain History
export async function wasDomainSeenRecently(
  supabase: SupabaseClient,
  userId: string,
  domain: string,
  days: number = 30
): Promise<boolean> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { count, error } = await supabase
    .from("domain_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("domain", domain)
    .gte("last_seen_at", cutoffDate.toISOString());

  if (error) throw error;
  return (count || 0) > 0;
}

export async function markDomainSeen(
  supabase: SupabaseClient,
  userId: string,
  domain: string
): Promise<void> {
  const { error } = await supabase.from("domain_history").upsert(
    {
      user_id: userId,
      domain,
      last_seen_at: new Date().toISOString(),
      times_seen: 1,
    },
    { onConflict: "user_id,domain" }
  );

  if (error) throw error;
}

// Transform functions
function transformLeadFromDb(row: Record<string, unknown>): LeadRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    date: row.date as string,
    domain: row.domain as string,
    companyName: row.company_name as string,
    industry: row.industry as string | null,
    geo: row.geo as string | null,
    score: row.score as number,
    whyNow: row.why_now as string,
    triggeredSignals: row.triggered_signals as LeadRecord["triggeredSignals"],
    evidenceUrls: row.evidence_urls as string[],
    evidenceSnippets: row.evidence_snippets as string[],
    linkedinSearchUrl: row.linkedin_search_url as string,
    linkedinSearchQuery: row.linkedin_search_query as string,
    targetTitles: row.target_titles as string[],
    openerShort: row.opener_short as string,
    openerMedium: row.opener_medium as string,
    status: row.status as LeadRecord["status"],
    personName: row.person_name as string | null,
    angles: row.angles as LeadRecord["angles"],
    narrative: row.narrative as string[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformLeadToDb(lead: LeadRecord): Record<string, unknown> {
  return {
    id: lead.id,
    user_id: lead.userId,
    date: lead.date,
    domain: lead.domain,
    company_name: lead.companyName,
    industry: lead.industry,
    geo: lead.geo,
    score: lead.score,
    why_now: lead.whyNow,
    triggered_signals: lead.triggeredSignals,
    evidence_urls: lead.evidenceUrls,
    evidence_snippets: lead.evidenceSnippets,
    linkedin_search_url: lead.linkedinSearchUrl,
    linkedin_search_query: lead.linkedinSearchQuery,
    target_titles: lead.targetTitles,
    opener_short: lead.openerShort,
    opener_medium: lead.openerMedium,
    status: lead.status,
    person_name: lead.personName,
    angles: lead.angles,
    narrative: lead.narrative,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
  };
}

function transformListFromDb(row: Record<string, unknown>): List {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    type: row.type as List["type"],
    description: row.description as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    archived: row.archived as boolean,
  };
}

function transformListAccountFromDb(row: Record<string, unknown>): ListAccount {
  return {
    id: row.id as string,
    listId: row.list_id as string,
    domain: row.domain as string,
    companyName: row.company_name as string | null,
    status: row.status as ListAccount["status"],
    currentScore: row.current_score as number | null,
    lastScoredAt: row.last_scored_at as string | null,
    addedAt: row.added_at as string,
  };
}

function transformSignalRunFromDb(row: Record<string, unknown>): SignalRun {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    mode: row.mode as SignalRun["mode"],
    startedAt: row.started_at as string,
    finishedAt: row.finished_at as string | null,
    status: row.status as SignalRun["status"],
    stats: row.stats as SignalRun["stats"],
    error: row.error as string | null,
  };
}

function transformDNCFromDb(row: Record<string, unknown>): DoNotContact {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as DoNotContact["type"],
    value: row.value as string,
    reason: row.reason as string | null,
    createdAt: row.created_at as string,
  };
}
