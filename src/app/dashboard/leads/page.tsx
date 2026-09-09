import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboard-context";
import { getLeads, LEAD_CLASSIFICATIONS, LEAD_STATUSES } from "@/lib/data/leads";
import { LeadsFilters } from "@/components/dashboard/leads-filters";
import { LeadsTable } from "@/components/dashboard/leads-table";
import type { LeadClassification, LeadStatus } from "@/types/database";

const BASE_PATH = "/dashboard/leads";

function parseStatus(value: string | undefined): LeadStatus | "all" {
  return value && LEAD_STATUSES.includes(value as LeadStatus)
    ? (value as LeadStatus)
    : "all";
}

function parseClassification(
  value: string | undefined
): LeadClassification | "all" {
  return value && LEAD_CLASSIFICATIONS.includes(value as LeadClassification)
    ? (value as LeadClassification)
    : "all";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    classification?: string;
    sort?: string;
  }>;
}) {
  const ctx = await getDashboardContext();
  if (!ctx) redirect("/login");

  const params = await searchParams;
  const status = parseStatus(params.status);
  const classification = parseClassification(params.classification);
  const sort = params.sort === "asc" ? "asc" : "desc";

  const leads = await getLeads(ctx.supabase, ctx.businessId, {
    status,
    classification,
    sort,
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Leads
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {leads.length} lead{leads.length === 1 ? "" : "s"} matching these
          filters.
        </p>
      </div>

      <LeadsFilters
        basePath={BASE_PATH}
        status={status}
        classification={classification}
        sort={sort}
      />

      <LeadsTable
        leads={leads}
        basePath={BASE_PATH}
        status={status}
        classification={classification}
        sort={sort}
      />
    </div>
  );
}
