import type { LeadClassification } from "@/types/database";

const STYLES: Record<
  LeadClassification,
  { label: string; dot: string; text: string; bg: string }
> = {
  hot: {
    label: "Hot",
    dot: "bg-hot",
    text: "text-hot",
    bg: "bg-hot-tint",
  },
  warm: {
    label: "Warm",
    dot: "bg-warm",
    text: "text-warm",
    bg: "bg-warm-tint",
  },
  cold: {
    label: "Cold",
    dot: "bg-cold",
    text: "text-cold",
    bg: "bg-cold-tint",
  },
};

export function ClassificationBadge({
  classification,
}: {
  classification: LeadClassification | null;
}) {
  if (!classification) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border-strong px-2.5 py-1 text-xs font-medium text-ink-faint">
        Unclassified
      </span>
    );
  }

  const style = STYLES[classification];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {style.label}
    </span>
  );
}
