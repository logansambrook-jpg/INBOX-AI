"use client";

import { useState, type FormEvent } from "react";
import { Mail, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/dashboard/logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-md">
          <h1 className="font-display text-xl font-semibold text-ink">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Sign in with a magic link — no password to manage.
          </p>

          {status === "sent" ? (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-brand/20 bg-brand-tint px-4 py-4">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <p className="text-sm text-ink">
                Check <span className="font-semibold">{email}</span> for a
                sign-in link.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-ink"
                >
                  Work email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-border bg-paper py-2.5 pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-brand focus:ring-2 focus:ring-brand/15"
                    placeholder="you@business.com"
                  />
                </div>
              </div>

              {status === "error" && errorMessage && (
                <p className="text-sm text-danger">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-lg bg-brand px-3 py-2.5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {status === "sending" ? "Sending link…" : "Send magic link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
