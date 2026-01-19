"use client";

import { LeadRecord, SignalDefinition, UserConfig } from "@/lib/schemas";
import { DEFAULT_USER_CONFIG, DEFAULT_SIGNAL_PRESETS, generateDemoLeads, getAllDefaultSignals } from "@/lib/fixtures/demo-data";

const STORAGE_KEYS = {
  USER_CONFIG: "leaddrip_user_config",
  LEADS: "leaddrip_leads",
  LISTS: "leaddrip_lists",
  ONBOARDING_COMPLETE: "leaddrip_onboarding_complete",
  ACTIVITY_LOG: "leaddrip_activity_log",
} as const;

// Activity types
export type ActivityType =
  | "lead_discovered"
  | "lead_saved"
  | "lead_skipped"
  | "lead_contacted"
  | "lead_viewed"
  | "opener_copied"
  | "linkedin_searched"
  | "signal_triggered";

export interface ActivityEntry {
  id: string;
  leadId: string;
  companyName: string;
  domain: string;
  type: ActivityType;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// User Config
export function getUserConfig(): UserConfig {
  if (typeof window === "undefined") return DEFAULT_USER_CONFIG;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_CONFIG);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load user config:", e);
  }

  return DEFAULT_USER_CONFIG;
}

export function saveUserConfig(config: UserConfig): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.USER_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save user config:", e);
  }
}

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === "true";
  } catch {
    return false;
  }
}

export function setOnboardingComplete(complete: boolean): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, String(complete));
  } catch (e) {
    console.error("Failed to save onboarding status:", e);
  }
}

// Leads
export function getStoredLeads(): LeadRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LEADS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load leads:", e);
  }

  // Generate and store demo leads if none exist
  const demoLeads = generateDemoLeads(50);
  saveLeads(demoLeads);
  return demoLeads;
}

export function saveLeads(leads: LeadRecord[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  } catch (e) {
    console.error("Failed to save leads:", e);
  }
}

export function updateLead(leadId: string, updates: Partial<LeadRecord>): LeadRecord | null {
  const leads = getStoredLeads();
  const index = leads.findIndex(l => l.id === leadId);

  if (index === -1) return null;

  leads[index] = { ...leads[index], ...updates, updatedAt: new Date().toISOString() };
  saveLeads(leads);

  return leads[index];
}

// Add new leads from RSS, avoiding duplicates by domain
export function addNewLeads(newLeads: LeadRecord[]): { added: number; skipped: number } {
  if (typeof window === "undefined") return { added: 0, skipped: 0 };

  const existingLeads = getStoredLeads();
  const existingDomains = new Set(existingLeads.map(l => l.domain.toLowerCase()));

  let added = 0;
  let skipped = 0;

  for (const lead of newLeads) {
    const domain = lead.domain.toLowerCase();
    if (existingDomains.has(domain)) {
      skipped++;
      continue;
    }

    existingLeads.unshift(lead); // Add to beginning (newest first)
    existingDomains.add(domain);
    added++;
  }

  // Keep only last 500 leads
  const trimmed = existingLeads.slice(0, 500);
  saveLeads(trimmed);

  return { added, skipped };
}

// Clear all leads and start fresh
export function clearLeads(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.LEADS);
}

// Get leads count by status
export function getLeadStats(): { total: number; new: number; saved: number; skipped: number; contacted: number } {
  const leads = getStoredLeads();
  return {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    saved: leads.filter(l => l.status === "saved").length,
    skipped: leads.filter(l => l.status === "skip").length,
    contacted: leads.filter(l => l.status === "contacted").length,
  };
}

// Lists (for Watch mode)
export interface WatchList {
  id: string;
  name: string;
  color: string;
  accounts: WatchAccount[];
  createdAt: string;
  updatedAt: string;
}

export interface WatchAccount {
  id: string;
  domain: string;
  companyName: string;
  addedAt: string;
  lastChecked: string | null;
  signalCount: number;
}

export function getWatchLists(): WatchList[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LISTS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load lists:", e);
  }

  // Return default demo lists
  const defaultLists: WatchList[] = [
    {
      id: "list_1",
      name: "Enterprise Tech",
      color: "#00d4aa",
      accounts: [
        { id: "acc_1", domain: "salesforce.com", companyName: "Salesforce", addedAt: new Date().toISOString(), lastChecked: new Date().toISOString(), signalCount: 3 },
        { id: "acc_2", domain: "hubspot.com", companyName: "HubSpot", addedAt: new Date().toISOString(), lastChecked: new Date().toISOString(), signalCount: 2 },
        { id: "acc_3", domain: "zendesk.com", companyName: "Zendesk", addedAt: new Date().toISOString(), lastChecked: null, signalCount: 0 },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "list_2",
      name: "Healthcare IT",
      color: "#f59e0b",
      accounts: [
        { id: "acc_4", domain: "epic.com", companyName: "Epic Systems", addedAt: new Date().toISOString(), lastChecked: new Date().toISOString(), signalCount: 1 },
        { id: "acc_5", domain: "cerner.com", companyName: "Cerner", addedAt: new Date().toISOString(), lastChecked: null, signalCount: 0 },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  saveWatchLists(defaultLists);
  return defaultLists;
}

export function saveWatchLists(lists: WatchList[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
  } catch (e) {
    console.error("Failed to save lists:", e);
  }
}

export function addWatchList(name: string, color: string): WatchList {
  const lists = getWatchLists();
  const newList: WatchList = {
    id: `list_${Date.now()}`,
    name,
    color,
    accounts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  lists.push(newList);
  saveWatchLists(lists);

  return newList;
}

export function deleteWatchList(listId: string): void {
  const lists = getWatchLists();
  const filtered = lists.filter(l => l.id !== listId);
  saveWatchLists(filtered);
}

export function addAccountToList(listId: string, account: Omit<WatchAccount, "id" | "addedAt" | "lastChecked" | "signalCount">): WatchAccount | null {
  const lists = getWatchLists();
  const list = lists.find(l => l.id === listId);

  if (!list) return null;

  // Check for duplicate
  if (list.accounts.some(a => a.domain === account.domain)) {
    return null;
  }

  const newAccount: WatchAccount = {
    ...account,
    id: `acc_${Date.now()}`,
    addedAt: new Date().toISOString(),
    lastChecked: null,
    signalCount: 0,
  };

  list.accounts.push(newAccount);
  list.updatedAt = new Date().toISOString();
  saveWatchLists(lists);

  return newAccount;
}

export function removeAccountFromList(listId: string, accountId: string): void {
  const lists = getWatchLists();
  const list = lists.find(l => l.id === listId);

  if (!list) return;

  list.accounts = list.accounts.filter(a => a.id !== accountId);
  list.updatedAt = new Date().toISOString();
  saveWatchLists(lists);
}

// Signals
export function getEnabledSignals(): SignalDefinition[] {
  const config = getUserConfig();
  return config.signals.filter(s => s.enabled);
}

export function toggleSignal(signalId: string, enabled: boolean): void {
  const config = getUserConfig();
  const signal = config.signals.find(s => s.id === signalId);

  if (signal) {
    signal.enabled = enabled;
    saveUserConfig(config);
  }
}

export function updateSignalPriority(signalId: string, priority: "high" | "medium" | "low"): void {
  const config = getUserConfig();
  const signal = config.signals.find(s => s.id === signalId);

  if (signal) {
    signal.priority = priority;
    signal.weight = priority === "high" ? 9 : priority === "medium" ? 6 : 3;
    saveUserConfig(config);
  }
}

export function addCustomSignal(signal: Omit<SignalDefinition, "id">): SignalDefinition {
  const config = getUserConfig();
  const newSignal: SignalDefinition = {
    ...signal,
    id: `sig_custom_${Date.now()}`,
  };

  config.signals.push(newSignal);
  saveUserConfig(config);

  return newSignal;
}

export function deleteSignal(signalId: string): void {
  const config = getUserConfig();
  config.signals = config.signals.filter(s => s.id !== signalId);
  saveUserConfig(config);
}

// Reset
export function resetAllData(): void {
  if (typeof window === "undefined") return;

  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Activity Log
export function getActivityLog(limit?: number): ActivityEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
    if (stored) {
      const activities = JSON.parse(stored) as ActivityEntry[];
      // Sort by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return limit ? activities.slice(0, limit) : activities;
    }
  } catch (e) {
    console.error("Failed to load activity log:", e);
  }

  return [];
}

export function getLeadActivity(leadId: string): ActivityEntry[] {
  const allActivities = getActivityLog();
  return allActivities.filter(a => a.leadId === leadId);
}

export function logActivity(
  type: ActivityType,
  lead: { id: string; companyName: string; domain: string },
  metadata?: Record<string, unknown>
): ActivityEntry {
  const entry: ActivityEntry = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    leadId: lead.id,
    companyName: lead.companyName,
    domain: lead.domain,
    type,
    timestamp: new Date().toISOString(),
    metadata,
  };

  if (typeof window === "undefined") return entry;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
    const activities: ActivityEntry[] = stored ? JSON.parse(stored) : [];

    // Add new entry
    activities.unshift(entry);

    // Keep only last 1000 activities
    const trimmed = activities.slice(0, 1000);

    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(trimmed));
  } catch (e) {
    console.error("Failed to save activity:", e);
  }

  return entry;
}

export function getActivityLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    lead_discovered: "Lead discovered",
    lead_saved: "Saved to pipeline",
    lead_skipped: "Skipped",
    lead_contacted: "Marked as contacted",
    lead_viewed: "Viewed details",
    opener_copied: "Copied opener message",
    linkedin_searched: "Searched on LinkedIn",
    signal_triggered: "Signal triggered",
  };
  return labels[type];
}

// Signal categories for grouping
export const SIGNAL_CATEGORIES = {
  funding_corporate: { label: "Funding & Corporate", icon: "💰" },
  leadership_org: { label: "Leadership & Org", icon: "👥" },
  product_strategy: { label: "Product & Strategy", icon: "🚀" },
  hiring_team: { label: "Hiring & Team", icon: "📋" },
  expansion_partnerships: { label: "Expansion & Partnerships", icon: "🌍" },
  technology_adoption: { label: "Technology Adoption", icon: "💻" },
  risk_compliance: { label: "Risk & Compliance", icon: "🛡️" },
  disqualifier: { label: "Disqualifiers", icon: "🚫" },
} as const;
