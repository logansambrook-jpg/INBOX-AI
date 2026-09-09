import { NextResponse } from "next/server";
import { requireBusinessContext } from "@/lib/auth";
import { sendLeadReply } from "@/lib/email/send-lead-reply";

/**
 * Approve-and-send: the one place a reply actually leaves the building.
 * Authenticated and business_id-scoped like every other route. Takes the
 * final text the owner approved (verbatim, whether they edited the draft
 * or accepted it as-is) and a contact address if the lead doesn't already
 * have one on file.
 *
 * Order matters here: the email only gets sent after the lead is loaded
 * and validated, and the DB is only updated *after* the send succeeds --
 * so a failed send never gets logged as sent, and a successful send is
 * never left unlogged. That row (status, sent_at, and the exact text in
 * draft_text) is the audit trail: once this returns 200, it reflects
 * exactly what went out and when.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireBusinessContext();
  if (auth instanceof NextResponse) return auth;

  const { supabase, businessId } = auth;
  const { id: leadId } = await params;

  const body = await request.json().catch(() => null);
  const finalText =
    typeof body?.finalText === "string" ? body.finalText.trim() : "";
  const contactInput =
    typeof body?.contact === "string" ? body.contact.trim() : "";

  if (!finalText) {
    return NextResponse.json(
      { error: "The reply text can't be empty." },
      { status: 400 }
    );
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, status, contact")
    .eq("id", leadId)
    .eq("business_id", businessId)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  if (lead.status === "sent") {
    return NextResponse.json(
      { error: "This lead has already been sent." },
      { status: 409 }
    );
  }

  const contact = lead.contact || contactInput;
  if (!contact) {
    return NextResponse.json(
      { error: "No contact address on file — enter one to send to." },
      { status: 400 }
    );
  }

  const { data: business, error: businessError } = await supabase
    .from("business_config")
    .select("name")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    return NextResponse.json(
      { error: "Business profile not found" },
      { status: 404 }
    );
  }

  const result = await sendLeadReply({
    businessName: business.name,
    to: contact,
    text: finalText,
  });

  if (!result.ok) {
    console.error(`sendLeadReply failed for lead ${leadId}:`, result.error);
    return NextResponse.json(
      { error: result.error },
      { status: result.retryable ? 502 : 500 }
    );
  }

  // The send succeeded -- now log it. If this write fails, the email is
  // already out, so surface a loud error rather than pretending nothing
  // happened; the audit trail (status/sent_at/draft_text) must never
  // silently fall out of sync with what was actually sent.
  const { data: updated, error: updateError } = await supabase
    .from("leads")
    .update({
      draft_text: finalText,
      contact,
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("business_id", businessId)
    .select("id, status, sent_at, draft_text, contact")
    .single();

  if (updateError || !updated) {
    console.error(
      `Email to ${contact} for lead ${leadId} sent successfully ` +
        `(provider id: ${result.providerMessageId}) but failed to record ` +
        `it on the lead:`,
      updateError
    );
    return NextResponse.json(
      {
        error:
          "The email sent, but recording it against the lead failed. " +
          "Refresh and check the lead's status before sending again.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ lead: updated });
}
