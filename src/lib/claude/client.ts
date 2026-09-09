import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Anthropic client. Never import this from a Client Component --
 * ANTHROPIC_API_KEY must never reach the browser bundle.
 *
 * `fetchOptions: { cache: "no-store" }` opts every request out of Next.js's
 * fetch Data Cache. This call is a mutating, per-lead classification --
 * never something to cache -- and opting out also keeps Next's cache-key
 * machinery (which fingerprints the request body/headers) out of the
 * request path entirely, which is one less place for a stray character in
 * business_config/lead text to interact with anything ASCII-only.
 */
export function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.local.example)."
    );
  }
  return new Anthropic({
    apiKey,
    fetchOptions: { cache: "no-store" },
  });
}
