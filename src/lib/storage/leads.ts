"use client";

export interface SavedLead {
  id: string;
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
  topJobs?: Array<{ title: string; department: string; location: string; url: string }>;
  savedAt: string;
  notes?: string;
  tags?: string[];
}

const STORAGE_KEY = "leaddrip_saved_leads";

export function getSavedLeads(): SavedLead[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLead(lead: Omit<SavedLead, "id" | "savedAt">): SavedLead {
  const saved: SavedLead = {
    ...lead,
    id: `${lead.domain}-${Date.now()}`,
    savedAt: new Date().toISOString(),
  };

  const leads = getSavedLeads();

  // Check if already saved (by domain)
  const exists = leads.some((l) => l.domain === lead.domain);
  if (exists) {
    return leads.find((l) => l.domain === lead.domain)!;
  }

  leads.unshift(saved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));

  // Dispatch event for reactivity
  window.dispatchEvent(new CustomEvent("leads-updated"));

  return saved;
}

export function removeLead(id: string): void {
  const leads = getSavedLeads().filter((l) => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  window.dispatchEvent(new CustomEvent("leads-updated"));
}

export function isLeadSaved(domain: string): boolean {
  return getSavedLeads().some((l) => l.domain === domain);
}

export function exportLeadsToCSV(leads: SavedLead[]): string {
  const headers = [
    "Name",
    "Domain",
    "Industry",
    "Stage",
    "Score",
    "Hiring Velocity",
    "Open Roles",
    "Engineering Roles",
    "Tech Stack",
    "Signals",
    "Saved At",
  ];

  const rows = leads.map((lead) => [
    lead.name,
    lead.domain,
    lead.industry,
    lead.stage,
    lead.score.toString(),
    lead.hiringVelocity,
    lead.totalJobs.toString(),
    (lead.departments.Engineering || 0).toString(),
    lead.techStack.join("; "),
    lead.signals.join("; "),
    new Date(lead.savedAt).toLocaleDateString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

export function downloadCSV(leads: SavedLead[], filename = "leads"): void {
  const csv = exportLeadsToCSV(leads);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
