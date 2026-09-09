import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. This BYPASSES Row Level Security, so it must
 * only ever be used from trusted server-side code that has already
 * determined which business_id it is allowed to act on (e.g. the daily
 * booking-reminder cron job, or OAuth token storage during inbox connect).
 *
 * The `server-only` import guarantees a build error if this ever ends up in
 * a client bundle. Never import this from a Client Component or expose
 * SUPABASE_SERVICE_ROLE_KEY to the frontend.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
