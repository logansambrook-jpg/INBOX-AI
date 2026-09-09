-- Fixes a bug: 0002 wrote the gym test business's tone_notes/service_menu/
-- faqs with literal em-dash characters (U+2014). Those flowed unmodified
-- into the Claude system prompt, and something in the request path choked
-- on them with "Cannot convert argument to a ByteString" when clicking
-- "Generate draft with Claude" on the live deployment.
--
-- The application code (src/lib/text.ts, wired into
-- src/lib/claude/classify-lead.ts) now sanitizes this text before it ever
-- reaches Claude, so this class of bug can't recur regardless of what's in
-- the database. This migration just re-applies the same content in plain
-- ASCII, so the already-written row matches what a fresh insert would look
-- like today.
--
-- Run this if you already applied 0002 against your live Supabase project.
update public.business_config
set
  tone_notes =
    'Friendly, motivating, no-nonsense -- talk like a coach, not a call '
    || 'center. Encouraging but direct, and never corporate ("per our '
    || 'policy", "valued customer") or overly casual/slangy. Use the '
    || 'person''s name when you have it. Keep replies tight, no fluff.',
  service_menu =
    '1:1 personal training (custom programming, one-on-one coaching). '
    || 'Small group classes, max 8 people, coached. Free trial session for '
    || 'new enquiries -- one no-obligation session to try the gym and meet '
    || 'a coach. Monthly membership options, no long-term contract.',
  faqs =
    'Q: How much does it cost? A: 1:1 personal training runs $70-$100 per '
    || 'session depending on package size -- packages of 10+ sessions cost '
    || 'less per session. Small group classes are covered by membership, '
    || 'starting at $129/month for 2x/week up to $199/month unlimited. No '
    || 'sign-up fee.'
    || E'\n'
    || 'Q: Can I try before I commit? A: Yes -- every new enquiry gets one '
    || 'free trial session, no obligation, no credit card required.'
    || E'\n'
    || 'Q: What are your hours? A: Mon-Fri 5:30am-8:30pm, Sat 8am-1pm, '
    || 'closed Sundays.'
    || E'\n'
    || 'Q: Is there parking? A: Free lot parking directly behind the '
    || 'building, plus street parking on 4th Ave.'
where id = (select id from public.business_config order by created_at asc limit 1)
returning id, name;

-- Diagnostic: run this separately to see whether ANY business_config row
-- still has a non-ASCII character in one of these three fields (smart
-- quotes, dashes, bullets, etc. picked up from a copy-paste), and exactly
-- which field/row it's in. A clean project returns zero rows.
--
-- select
--   id,
--   name,
--   (tone_notes ~ '[^\x00-\x7F]')   as tone_notes_has_non_ascii,
--   (service_menu ~ '[^\x00-\x7F]') as service_menu_has_non_ascii,
--   (faqs ~ '[^\x00-\x7F]')         as faqs_has_non_ascii
-- from public.business_config
-- where tone_notes ~ '[^\x00-\x7F]'
--    or service_menu ~ '[^\x00-\x7F]'
--    or faqs ~ '[^\x00-\x7F]';
