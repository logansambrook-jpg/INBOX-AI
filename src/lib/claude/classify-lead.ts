import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { createAnthropicClient } from "@/lib/claude/client";
import { sanitizeForPrompt } from "@/lib/text";

const MODEL = "claude-opus-5";

const LeadAnalysisSchema = z.object({
  classification: z.enum(["hot", "warm", "cold"]),
  intent_summary: z.string(),
  draft_reply: z.string(),
});

export type LeadAnalysis = z.infer<typeof LeadAnalysisSchema>;

export type BusinessProfile = {
  name: string;
  tone_notes: string | null;
  service_menu: string | null;
  faqs: string | null;
};

/**
 * Every field pulled from business_config (owner-editable, often
 * copy-pasted from Word/Docs/Notion) and the lead's raw_message is run
 * through sanitizeForPrompt() before it touches the prompt. Claude doesn't
 * need a literal curly quote or bullet to write a good reply, and this
 * closes off the "smart typography breaks something ASCII-only downstream"
 * bug class at the source rather than trying to guess where else it might
 * resurface.
 */
function buildSystemPrompt(business: BusinessProfile): string {
  const name = sanitizeForPrompt(business.name);
  const toneNotes = sanitizeForPrompt(business.tone_notes || "Friendly and professional.");
  const serviceMenu = sanitizeForPrompt(business.service_menu || "Not specified.");
  const faqs = sanitizeForPrompt(business.faqs || "Not specified.");

  return `You are the lead-triage assistant for ${name}, a small service business. A human always reviews and approves your draft before anything is sent -- you are never sending anything directly -- so write the reply ready to send as-is, with no hedging or disclaimers about being an AI.

BUSINESS TONE
${toneNotes}

SERVICES OFFERED
${serviceMenu}

FREQUENTLY ASKED QUESTIONS (the only source of truth for specifics -- never invent a price, hour, or policy that isn't listed here)
${faqs}

TASK
Given one inbound lead message, do three things:

1. Classify it as exactly one of "hot", "warm", or "cold":
   - hot: ready to book now, or asks for a specific date/time
   - warm: interested and asking questions first (pricing, details, comparing options) before committing
   - cold: vague, low-intent, just browsing, or too little information to tell what they want

2. Write intent_summary: a short phrase (under 12 words) capturing what they actually want -- not a restatement of their message.

3. Write draft_reply: a reply in the business's tone that directly answers their specific question, using real specifics from the FAQs/service menu above where relevant (for example, mention the free trial if they're price-shopping or on the fence). Match reply length to the message -- a one-line reply for a one-line question, fuller for a message with multiple questions. Sign off naturally for the business; never sign with a generic "Customer Support" or similar.`;
}

export type ClassifyLeadResult =
  | { ok: true; analysis: LeadAnalysis }
  | { ok: false; error: string; retryable: boolean };

/**
 * Classifies one inbound lead and drafts a reply, using the business's own
 * tone/services/FAQs as context. This never sends anything -- the caller
 * writes the result back as a draft awaiting human approval, per the
 * project's no-auto-send rule. The Anthropic SDK already retries
 * transient failures (429/5xx/connection errors) internally before
 * throwing; this wraps whatever reaches us after that in a typed result
 * instead of letting an unhandled rejection reach the caller.
 */
export async function classifyLead(
  business: BusinessProfile,
  rawMessage: string
): Promise<ClassifyLeadResult> {
  try {
    const client = createAnthropicClient();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 1024,
      output_config: {
        effort: "low",
        format: zodOutputFormat(LeadAnalysisSchema),
      },
      system: buildSystemPrompt(business),
      messages: [{ role: "user", content: sanitizeForPrompt(rawMessage) }],
    });

    if (!response.parsed_output) {
      return {
        ok: false,
        error: "Claude's response didn't match the expected format.",
        retryable: true,
      };
    }

    return { ok: true, analysis: response.parsed_output };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return {
        ok: false,
        error: "Rate limited by the Claude API -- try again shortly.",
        retryable: true,
      };
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return {
        ok: false,
        error: "Invalid ANTHROPIC_API_KEY.",
        retryable: false,
      };
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return {
        ok: false,
        error: "Could not reach the Claude API.",
        retryable: true,
      };
    }
    if (error instanceof Anthropic.APIError) {
      return {
        ok: false,
        error: `Claude API error (${error.status}): ${error.message}`,
        retryable: error.status !== undefined && error.status >= 500,
      };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      retryable: false,
    };
  }
}
