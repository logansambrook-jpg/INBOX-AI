import { NextResponse } from "next/server";
import { requireBusinessContext } from "@/lib/auth";

/**
 * TEMPORARY DIAGNOSTIC ROUTE -- delete after use.
 *
 * Checks whether the ANTHROPIC_API_KEY environment variable actually set
 * on THIS deployment (Vercel's stored value, not whatever's in a local
 * .env.local) is clean ASCII, without ever returning the key itself.
 *
 * The Anthropic SDK sends this value verbatim as the `X-Api-Key` HTTP
 * header (client.mjs's apiKeyAuth()) -- unlike business_config/lead text,
 * which only ever reaches the request body. A non-ASCII byte here would
 * throw exactly the reported "Cannot convert argument to a ByteString"
 * error, and -- unlike variable message text -- would do so at the same
 * character index on every single request, which matches what was
 * reported.
 */
export async function GET() {
  const auth = await requireBusinessContext();
  if (auth instanceof NextResponse) return auth;

  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return NextResponse.json({
      present: false,
      message: "ANTHROPIC_API_KEY is not set on this deployment at all.",
    });
  }

  const badChars: Array<{ index: number; codePoint: number }> = [];
  for (let i = 0; i < key.length; i++) {
    const codePoint = key.codePointAt(i)!;
    if (codePoint > 127) {
      badChars.push({ index: i, codePoint });
    }
  }

  return NextResponse.json({
    present: true,
    length: key.length,
    isCleanAscii: badChars.length === 0,
    // Only ever the index/code point of offending characters -- never the
    // key itself, never even the surrounding characters.
    nonAsciiCharacters: badChars,
    startsWithExpectedPrefix: key.startsWith("sk-ant-"),
  });
}
