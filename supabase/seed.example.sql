-- Example: provisioning business #1 and linking it to the first logged-in user.
--
-- 1. Create business #1:
insert into public.business_config (name, tone_notes, service_menu, faqs, inbox_provider)
values (
  'Acme Plumbing',
  'Friendly, direct, no corporate-speak. Sign off as "The Acme Team".',
  'Emergency callout, drain cleaning, water heater install/repair',
  'Q: Do you offer weekend service? A: Yes, emergency callouts only.',
  'gmail'
)
returning id;

-- 2. Sign up / log in once through the app's /login page with the owner's
--    email so a row exists in auth.users, then find that user's id:
--    select id, email from auth.users;

-- 3. Link that user to the business created above (replace both uuids):
insert into public.profiles (id, business_id, full_name, role)
values (
  '00000000-0000-0000-0000-000000000000', -- auth.users.id
  '11111111-1111-1111-1111-111111111111', -- business_config.id from step 1
  'Business Owner',
  'owner'
);
