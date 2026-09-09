"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/dashboard/logo";

export function NotOnboarded() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="font-display mt-6 text-xl font-semibold text-ink">
          Almost there
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Your account isn&apos;t linked to a business yet. Ask an admin to
          finish onboarding (see{" "}
          <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">
            supabase/seed.example.sql
          </code>
          ), then refresh this page.
        </p>
        <button
          onClick={handleSignOut}
          className="mt-6 text-sm font-medium text-ink-muted hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
