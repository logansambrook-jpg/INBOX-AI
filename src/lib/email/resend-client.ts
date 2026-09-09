import "server-only";
import { Resend } from "resend";

/**
 * Server-only Resend client. Never import this from a Client Component --
 * RESEND_API_KEY must never reach the browser bundle.
 */
export function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to .env.local (see .env.local.example)."
    );
  }
  return new Resend(apiKey);
}
