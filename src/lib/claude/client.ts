import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Anthropic client. Never import this from a Client Component —
 * ANTHROPIC_API_KEY must never reach the browser bundle.
 */
export function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.local.example)."
    );
  }
  return new Anthropic({ apiKey });
}
