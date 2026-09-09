import Link from "next/link";
import {
  LEAD_CLASSIFICATIONS,
  LEAD_STATUSES,
} from "@/lib/data/leads";
import type { LeadClassification, LeadStatus } from "@/types/database";

function buildHref(
  base: string,
  params: Record<string, string | undefined>
) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== "all") usp.set(key, value);
  }
  const qs = usp.toString();
  return qs ? `${base}?${qs}` : base;
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  drafted: "Drafted",
  approved: "Approved",
  sent: "Sent",
};

const CLASSIFICATION_LABEL: Record<LeadClassification, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
};

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-surface text-ink shadow-sm"
          : "text-ink-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function LeadsFilters({
  basePath,
  status,
  classification,
  sort,
}: {
  basePath: string;
  status: LeadStatus | "all";
  classification: LeadClassification | "all";
  sort: "asc" | "desc";
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
      <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-surface-muted p-1">
        <Pill
          href={buildHref(basePath, { classification, sort })}
          active={status === "all"}
        >
          All statuses
        </Pill>
        {LEAD_STATUSES.map((s) => (
          <Pill
            key={s}
            href={buildHref(basePath, { status: s, classification, sort })}
            active={status === s}
          >
            {STATUS_LABEL[s]}
          </Pill>
        ))}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto rounded-full bg-surface-muted p-1">
        <Pill
          href={buildHref(basePath, { status, sort })}
          active={classification === "all"}
        >
          All leads
        </Pill>
        {LEAD_CLASSIFICATIONS.map((c) => (
          <Pill
            key={c}
            href={buildHref(basePath, { status, classification: c, sort })}
            active={classification === c}
          >
            {CLASSIFICATION_LABEL[c]}
          </Pill>
        ))}
      </div>
    </div>
  );
}

export { buildHref };
