-- Updates the existing test tenant to a gym/personal-training business, for
-- testing the Claude classification & drafting engine (step 3).
--
-- Assumes a single test business exists so far. If you've provisioned more
-- than one, replace the WHERE clause with an explicit id.
update public.business_config
set
  name = 'Iron & Co. Personal Training',
  tone_notes =
    'Friendly, motivating, no-nonsense — talk like a coach, not a call '
    || 'center. Encouraging but direct, and never corporate ("per our '
    || 'policy", "valued customer") or overly casual/slangy. Use the '
    || 'person''s name when you have it. Keep replies tight, no fluff.',
  service_menu =
    '1:1 personal training (custom programming, one-on-one coaching). '
    || 'Small group classes, max 8 people, coached. Free trial session for '
    || 'new enquiries — one no-obligation session to try the gym and meet '
    || 'a coach. Monthly membership options, no long-term contract.',
  faqs =
    'Q: How much does it cost? A: 1:1 personal training runs $70-$100 per '
    || 'session depending on package size — packages of 10+ sessions cost '
    || 'less per session. Small group classes are covered by membership, '
    || 'starting at $129/month for 2x/week up to $199/month unlimited. No '
    || 'sign-up fee.'
    || E'\n'
    || 'Q: Can I try before I commit? A: Yes — every new enquiry gets one '
    || 'free trial session, no obligation, no credit card required.'
    || E'\n'
    || 'Q: What are your hours? A: Mon-Fri 5:30am-8:30pm, Sat 8am-1pm, '
    || 'closed Sundays.'
    || E'\n'
    || 'Q: Is there parking? A: Free lot parking directly behind the '
    || 'building, plus street parking on 4th Ave.',
  inbox_provider = coalesce(inbox_provider, 'gmail')
where id = (select id from public.business_config order by created_at asc limit 1)
returning id, name;
