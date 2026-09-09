import type { ReactNode } from "react";

const ACCENTS = {
  brand: "bg-brand",
  hot: "bg-hot",
  warm: "bg-warm",
  cold: "bg-cold",
  gold: "bg-gold",
} as const;

export function StatCard({
  label,
  value,
  accent = "brand",
  detail,
}: {
  label: string;
  value: number | string;
  accent?: keyof typeof ACCENTS;
  detail?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-sm">
      <span
        className={`absolute inset-x-0 top-0 h-1 ${ACCENTS[accent]}`}
        aria-hidden
      />
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </p>
      <p className="font-display tabular-nums mt-2 text-3xl font-semibold text-ink">
        {value}
      </p>
      {detail && <div className="mt-2 text-sm text-ink-muted">{detail}</div>}
    </div>
  );
}
