/**
 * Normalizes "smart" typography (curly quotes, em/en dashes, bullets,
 * ellipses, non-breaking spaces) to plain ASCII equivalents.
 *
 * Business owners paste FAQ/service-menu text from Word, Google Docs, or
 * Notion, all of which auto-convert quotes/dashes/bullets to their
 * typographic Unicode forms. Those characters carry no meaning Claude needs
 * -- but they're exactly the class of character that trips "header must be
 * ASCII/Latin-1" (ByteString) failures if this text ever ends up on an HTTP
 * header somewhere downstream (tracing/instrumentation, a proxy, etc.),
 * even though it's correctly placed in the request body here. Stripping
 * them at the source is cheap insurance against that whole bug class,
 * wherever it originates.
 *
 * Deliberately narrow: this does NOT strip all non-ASCII (accented names,
 * emoji, etc. are fine in a request body and should be preserved) -- only
 * the specific typographic substitutions below. Every target character is
 * built from its numeric Unicode code point rather than pasted as a
 * literal glyph, so nothing invisible is hiding in this source file and
 * every substitution is auditable by its code point comment.
 */
function charClass(codePoints: number[]): string {
  return codePoints.map((cp) => String.fromCodePoint(cp)).join("");
}

const SINGLE_QUOTES = charClass([0x2018, 0x2019, 0x201a, 0x201b]);
const DOUBLE_QUOTES = charClass([0x201c, 0x201d, 0x201e, 0x201f]);
const DASHES = charClass([0x2013, 0x2014, 0x2212]); // en dash, em dash, minus sign
const BULLETS = charClass([0x2022, 0x00b7, 0x25aa, 0x25cf]); // bullet, middle dot, black small square, black circle
const ELLIPSIS = String.fromCodePoint(0x2026);
const UNICODE_SPACES = charClass([
  0x00a0, // no-break space
  0x1680, // ogham space mark
  0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008,
  0x2009, 0x200a, // en quad .. hair space
  0x202f, // narrow no-break space
  0x205f, // medium mathematical space
  0x3000, // ideographic space
]);
const ZERO_WIDTH = charClass([0x200b, 0x200c, 0x200d, 0xfeff]); // zero-width space/ZWNJ/ZWJ/BOM

const REPLACEMENTS: Array<[RegExp, string]> = [
  [new RegExp(`[${SINGLE_QUOTES}]`, "g"), "'"],
  [new RegExp(`[${DOUBLE_QUOTES}]`, "g"), '"'],
  [new RegExp(`[${DASHES}]`, "g"), "-"],
  [new RegExp(`[${BULLETS}]`, "g"), "-"],
  [new RegExp(ELLIPSIS, "g"), "..."],
  [new RegExp(`[${UNICODE_SPACES}]`, "g"), " "],
  [new RegExp(`[${ZERO_WIDTH}]`, "g"), ""],
];

export function sanitizeForPrompt(text: string): string {
  return REPLACEMENTS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text
  );
}
