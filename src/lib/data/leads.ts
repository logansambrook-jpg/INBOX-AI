import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  LeadClassification,
  LeadStatus,
} from "@/types/database";

type Supabase = SupabaseClient<Database>;

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

/** The subset of columns getLeads() actually selects (no business_id — it's
 * the query filter, not something the UI needs to display). */
export type LeadListItem = Pick<
  LeadRow,
  | "id"
  | "raw_message"
  | "channel"
  | "status"
  | "classification"
  | "intent_summary"
  | "draft_text"
  | "sent_at"
  | "created_at"
>;

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "drafted",
  "approved",
  "sent",
];

export const LEAD_CLASSIFICATIONS: LeadClassification[] = [
  "hot",
  "warm",
  "cold",
];

const LEADS_LIST_LIMIT = 200;

export type LeadFilters = {
  status?: LeadStatus | "all";
  classification?: LeadClassification | "all";
  sort?: "asc" | "desc";
  limit?: number;
};

/**
 * Fetches leads for one business, always explicitly scoped by business_id
 * (on top of the Row Level Security policy that enforces the same thing at
 * the database level). Filters/sort are applied at the query level so this
 * scales past a client-side array filter.
 */
export async function getLeads(
  supabase: Supabase,
  businessId: string,
  filters: LeadFilters = {}
) {
  let query = supabase
    .from("leads")
    .select(
      "id, raw_message, channel, status, classification, intent_summary, draft_text, sent_at, created_at"
    )
    .eq("business_id", businessId);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.classification && filters.classification !== "all") {
    query = query.eq("classification", filters.classification);
  }

  query = query
    .order("created_at", { ascending: filters.sort === "asc" })
    .limit(filters.limit ?? LEADS_LIST_LIMIT);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export type LeadWeekStats = {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  unclassified: number;
};

/** Counts leads created in the last 7 days, broken down by classification. */
export async function getLeadStatsThisWeek(
  supabase: Supabase,
  businessId: string
): Promise<LeadWeekStats> {
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("leads")
    .select("classification")
    .eq("business_id", businessId)
    .gte("created_at", sevenDaysAgo);

  if (error) throw error;

  const stats: LeadWeekStats = {
    total: data.length,
    hot: 0,
    warm: 0,
    cold: 0,
    unclassified: 0,
  };

  for (const row of data) {
    if (row.classification === "hot") stats.hot += 1;
    else if (row.classification === "warm") stats.warm += 1;
    else if (row.classification === "cold") stats.cold += 1;
    else stats.unclassified += 1;
  }

  return stats;
}

/** True if this business has never had a single lead — drives empty states. */
export async function hasAnyLeads(supabase: Supabase, businessId: string) {
  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (error) throw error;
  return (count ?? 0) > 0;
}
