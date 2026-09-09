import { NextResponse } from "next/server";
import { requireBusinessContext } from "@/lib/auth";
import { classifyLead } from "@/lib/claude/classify-lead";

/**
 * Manually triggers Claude classification + drafting for one lead.
 * Authenticated, and every query is explicitly scoped to the caller's
 * business_id — a lead id from another tenant simply won't be found.
 *
 * Writes classification, intent_summary, and draft_text back onto the
 * lead and moves its status to "drafted". Never sends anything — the
 * approve-and-send flow (a later step) is what actually sends a reply,
 * and only after a human approves it.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireBusinessContext();
  if (auth instanceof NextResponse) return auth;

  const { supabase, businessId } = auth;
  const { id: leadId } = await params;

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, raw_message, status")
    .eq("id", leadId)
    .eq("business_id", businessId)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  if (lead.status === "sent") {
    return NextResponse.json(
      { error: "This lead has already been sent — nothing to draft." },
      { status: 409 }
    );
  }

  const { data: business, error: businessError } = await supabase
    .from("business_config")
    .select("name, tone_notes, service_menu, faqs")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    return NextResponse.json(
      { error: "Business profile not found" },
      { status: 404 }
    );
  }

  const result = await classifyLead(business, lead.raw_message);

  if (!result.ok) {
    console.error(`classifyLead failed for lead ${leadId}:`, result.error);
    return NextResponse.json(
      { error: result.error },
      { status: result.retryable ? 502 : 500 }
    );
  }

  const { classification, intent_summary, draft_reply } = result.analysis;

  const { data: updated, error: updateError } = await supabase
    .from("leads")
    .update({
      classification,
      intent_summary,
      draft_text: draft_reply,
      status: "drafted",
    })
    .eq("id", leadId)
    .eq("business_id", businessId)
    .select(
      "id, classification, intent_summary, draft_text, status, created_at"
    )
    .single();

  if (updateError || !updated) {
    console.error(`Failed to save lead analysis for ${leadId}:`, updateError);
    return NextResponse.json(
      { error: "Generated a draft but failed to save it — try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ lead: updated });
}
