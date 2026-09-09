import "server-only";
import { createResendClient } from "@/lib/email/resend-client";

// Resend's closed set of error codes. Only the transient ones are worth a
// retry -- a bad API key or an invalid address will fail identically on
// attempt two.
const RETRYABLE_ERROR_CODES = new Set([
  "rate_limit_exceeded",
  "internal_server_error",
  "application_error",
  "concurrent_idempotent_requests",
]);

const RETRY_DELAYS_MS = [500, 1500];

export type SendReplyResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; error: string; retryable: boolean };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends the approved reply as a real email via Resend and returns a typed
 * result -- never throws. Retries a fixed, short sequence of delays for
 * errors Resend itself flags as transient (rate limits, its own 5xx);
 * anything else (bad key, invalid address, quota exhausted) fails once
 * with no retry, since retrying wouldn't change the outcome.
 *
 * This is the one thing that stands in for "the connected inbox" until
 * step 2 wires up a real Gmail/Outlook send -- callers (the approve-and-
 * send API route) don't need to change when that happens, only this
 * function's internals.
 */
export async function sendLeadReply({
  businessName,
  to,
  text,
}: {
  businessName: string;
  to: string;
  text: string;
}): Promise<SendReplyResult> {
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  let lastError: { message: string; retryable: boolean } | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAYS_MS[attempt - 1]);
    }

    try {
      const resend = createResendClient();
      const { data, error } = await resend.emails.send({
        from: `${businessName} <${from}>`,
        to,
        subject: `Re: your message to ${businessName}`,
        text,
      });

      if (error) {
        const retryable = RETRYABLE_ERROR_CODES.has(error.name);
        lastError = { message: `${error.name}: ${error.message}`, retryable };
        if (!retryable) break;
        continue;
      }

      if (!data) {
        lastError = {
          message: "Resend returned no error but no data either.",
          retryable: true,
        };
        continue;
      }

      return { ok: true, providerMessageId: data.id };
    } catch (err) {
      // Thrown errors (network failure, missing API key, etc.) -- treat
      // network-shaped failures as retryable, everything else as not.
      const message = err instanceof Error ? err.message : "Unknown error";
      const retryable = err instanceof TypeError; // fetch's own network-failure shape
      lastError = { message, retryable };
      if (!retryable) break;
    }
  }

  return {
    ok: false,
    error: lastError?.message ?? "Failed to send email for an unknown reason.",
    retryable: lastError?.retryable ?? false,
  };
}
