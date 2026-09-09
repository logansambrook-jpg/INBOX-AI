import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Standard auth guard for Route Handlers. Every API route must call this
 * first — there are no open endpoints. Returns the authenticated user's id
 * and business_id (resolved via their profile), or a 401 response to
 * return immediately.
 *
 * Usage:
 *   const auth = await requireBusinessContext();
 *   if (auth instanceof NextResponse) return auth;
 *   const { userId, businessId, supabase } = auth;
 */
export async function requireBusinessContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "No business linked to this account" },
      { status: 403 }
    );
  }

  return { supabase, userId: user.id, businessId: profile.business_id };
}
