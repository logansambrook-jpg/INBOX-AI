import type { LeadStatus } from "@/types/database";

const STYLES: Record<
  LeadStatus,
  { label: string; text: string; bg: string; solid?: boolean }
> = {
  new: { label: "New", text: "text-status-new", bg: "bg-status-new-tint" },
  drafted: {
    label: "Drafted",
    text: "text-status-drafted",
    bg: "bg-status-drafted-tint",
  },
  approved: {
    label: "Approved",
    text: "text-status-approved",
    bg: "bg-status-approved-tint",
  },
  sent: {
    label: "Sent",
    text: "text-brand-fg",
    bg: "bg-status-sent",
    solid: true,
  },
};

/**
 * Status reads as a left-to-right workflow: new -> drafted -> approved ->
 * sent. "sent" gets a solid fill since it's the completed state.
 */
export function StatusBadge({ status }: { status: LeadStatus }) {
  const style = STYLES[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
