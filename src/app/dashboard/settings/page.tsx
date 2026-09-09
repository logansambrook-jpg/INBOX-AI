import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboard-context";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </p>
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
        {value || <span className="text-ink-faint">Not set</span>}
      </p>
    </div>
  );
}

export default async function SettingsPage() {
  const ctx = await getDashboardContext();
  if (!ctx) redirect("/login");

  const { data: business } = await ctx.supabase
    .from("business_config")
    .select("name, tone_notes, service_menu, faqs, inbox_provider")
    .eq("id", ctx.businessId)
    .single();

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Business profile Claude uses to classify leads and match your tone.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <Field label="Business name" value={business?.name ?? null} />
        <Field
          label="Inbox provider"
          value={
            business?.inbox_provider
              ? business.inbox_provider === "gmail"
                ? "Gmail"
                : "Outlook"
              : null
          }
        />
        <Field label="Tone notes" value={business?.tone_notes ?? null} />
        <Field label="Service menu" value={business?.service_menu ?? null} />
        <Field label="FAQs" value={business?.faqs ?? null} />
      </div>

      <p className="text-xs text-ink-faint">
        Editing these fields, plus connecting an inbox, is coming in a later
        step — for now they&apos;re set directly in Supabase.
      </p>
    </div>
  );
}
