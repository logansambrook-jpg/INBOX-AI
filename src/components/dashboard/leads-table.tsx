"use client";

import { Fragment, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Pencil,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ClassificationBadge } from "@/components/dashboard/classification-badge";
import { formatDateTime, formatRelative, truncate } from "@/lib/format";
import { buildHref } from "@/components/dashboard/leads-filters";
import type { LeadListItem } from "@/lib/data/leads";
import type { LeadClassification, LeadStatus } from "@/types/database";

const CHANNEL_LABEL: Record<LeadListItem["channel"], string> = {
  email: "Email",
  form: "Form",
  sms: "SMS",
};

function SortToggle({
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
  const next = sort === "desc" ? "asc" : "desc";
  return (
    <Link
      href={buildHref(basePath, { status, classification, sort: next })}
      className="inline-flex items-center gap-1 hover:text-ink"
    >
      Date
      {sort === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUp className="h-3.5 w-3.5" />
      )}
    </Link>
  );
}

function LeadExpandedDetail({ lead }: { lead: LeadListItem }) {
  const router = useRouter();
  // The same lead renders in both the desktop table and the mobile card
  // list at once (one hidden via CSS) -- useId() keeps the contact
  // input's id/label pairing unique per instance instead of colliding on
  // a shared `contact-${lead.id}`.
  const contactInputId = useId();

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(lead.draft_text ?? "");
  const [contactValue, setContactValue] = useState(lead.contact ?? "");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/classify`, {
        method: "POST",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? "Failed to generate draft");
      }
      router.refresh();
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Failed to generate draft"
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalText: draftValue,
          contact: contactValue,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? "Failed to send");
      }
      router.refresh();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  const hasDraft = Boolean(lead.draft_text);
  const isSent = lead.status === "sent";
  const canSend =
    !sending && draftValue.trim().length > 0 && contactValue.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Raw message · {formatDateTime(lead.created_at)}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {lead.raw_message}
        </p>
      </div>

      {isSent ? (
        <div className="rounded-lg border border-brand/25 bg-brand-tint p-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sent{lead.sent_at ? ` · ${formatDateTime(lead.sent_at)}` : ""}
            {lead.contact ? ` · to ${lead.contact}` : ""}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {lead.draft_text}
          </p>
        </div>
      ) : (
        hasDraft && (
          <div className="rounded-lg border border-brand/25 bg-brand-tint p-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                Draft reply · awaiting approval
              </p>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-dark"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <>
                <textarea
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-brand/30 bg-surface p-3 text-sm leading-relaxed text-ink outline-none focus:border-brand"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setDraftValue(lead.draft_text ?? "");
                    setEditing(false);
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
                >
                  <X className="h-3 w-3" />
                  Cancel edit
                </button>
              </>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {draftValue}
              </p>
            )}
          </div>
        )
      )}

      {!isSent && hasDraft && (
        <div className="space-y-2 rounded-lg border border-border bg-surface-muted/60 p-4">
          {lead.contact ? (
            <p className="text-xs text-ink-muted">
              Sending to <span className="font-medium text-ink">{lead.contact}</span>
            </p>
          ) : (
            <div className="space-y-1">
              <label
                htmlFor={contactInputId}
                className="text-xs font-medium text-ink"
              >
                Send to (email) — no contact on file for this lead yet
              </label>
              <input
                id={contactInputId}
                type="email"
                required
                value={contactValue}
                onChange={(event) => setContactValue(event.target.value)}
                placeholder="client@example.com"
                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-brand"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-fg transition-colors hover:bg-brand-dark disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "Sending…" : "Approve & Send"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? "Generating…" : "Regenerate draft"}
            </button>
            {sendError && <p className="text-xs text-danger">{sendError}</p>}
            {generateError && (
              <p className="text-xs text-danger">{generateError}</p>
            )}
          </div>
        </div>
      )}

      {!isSent && !hasDraft && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-fg transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generating ? "Generating…" : "Generate draft with Claude"}
          </button>
          {generateError && (
            <p className="text-xs text-danger">{generateError}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function LeadsTable({
  leads,
  basePath,
  status,
  classification,
  sort,
}: {
  leads: LeadListItem[];
  basePath: string;
  status: LeadStatus | "all";
  classification: LeadClassification | "all";
  sort: "asc" | "desc";
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-surface-muted/50 px-6 py-16 text-center">
        <p className="text-sm font-medium text-ink">No leads match these filters</p>
        <p className="mt-1 text-sm text-ink-muted">
          Try a different status or classification.
        </p>
      </div>
    );
  }

  function toggle(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      {/* Desktop / tablet table */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wider text-ink-faint">
            <th className="w-8 px-4 py-3" />
            <th className="px-3 py-3">Message</th>
            <th className="px-3 py-3">Channel</th>
            <th className="px-3 py-3">Classification</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">
              <SortToggle
                basePath={basePath}
                status={status}
                classification={classification}
                sort={sort}
              />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map((lead) => {
            const expanded = expandedId === lead.id;
            return (
              <Fragment key={lead.id}>
                <tr
                  onClick={() => toggle(lead.id)}
                  className="cursor-pointer transition-colors hover:bg-surface-muted/60"
                >
                  <td className="px-4 py-3.5 align-top text-ink-faint">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </td>
                  <td className="max-w-md px-3 py-3.5 align-top">
                    <p className="line-clamp-1 text-ink">
                      {truncate(lead.raw_message, 90)}
                    </p>
                    {lead.intent_summary && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                        {lead.intent_summary}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3.5 align-top text-ink-muted">
                    {CHANNEL_LABEL[lead.channel]}
                  </td>
                  <td className="px-3 py-3.5 align-top">
                    <ClassificationBadge classification={lead.classification} />
                  </td>
                  <td className="px-3 py-3.5 align-top">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-3 py-3.5 align-top whitespace-nowrap text-ink-muted">
                    {formatRelative(lead.created_at)}
                  </td>
                </tr>
                {expanded && (
                  <tr className="bg-surface-muted/40">
                    <td />
                    <td colSpan={5} className="px-3 pb-4 pt-1">
                      <LeadExpandedDetail key={`${lead.id}-${lead.draft_text}-${lead.contact}`} lead={lead} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Mobile card list */}
      <ul className="divide-y divide-border md:hidden">
        {leads.map((lead) => {
          const expanded = expandedId === lead.id;
          return (
            <li key={lead.id}>
              <button
                onClick={() => toggle(lead.id)}
                className="flex w-full flex-col gap-2 px-4 py-4 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ClassificationBadge classification={lead.classification} />
                    <StatusBadge status={lead.status} />
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-ink-faint transition-transform ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <p className="line-clamp-2 text-sm text-ink">
                  {truncate(lead.raw_message, 140)}
                </p>
                <p className="text-xs text-ink-muted">
                  {CHANNEL_LABEL[lead.channel]} · {formatRelative(lead.created_at)}
                </p>
              </button>
              {expanded && (
                <div className="px-4 pb-4">
                  <LeadExpandedDetail key={`${lead.id}-${lead.draft_text}-${lead.contact}`} lead={lead} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
