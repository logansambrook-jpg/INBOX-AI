import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DashboardContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  userEmail: string | null;
  businessId: string;
  role: "owner" | "member";
};

/**
 * Resolves the signed-in user's business_id for use in dashboard pages.
 * Every dashboard page and data-fetching call is expected to go through
 * this so business_id scoping is never accidentally skipped.
 *
 * Redirects to /login if there's no session. Returns `null` (rather than
 * throwing) when the user has no linked business yet, so callers can show
 * the "finish onboarding" state instead of a broken page.
 */
export async function getDashboardContext(): Promise<DashboardContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return {
    supabase,
    userId: user.id,
    userEmail: user.email ?? null,
    businessId: profile.business_id,
    role: profile.role,
  };
}
