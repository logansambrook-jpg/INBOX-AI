-- Step 5 (approve-and-send) needs to know who to actually send the reply
-- to. The original leads table only stored raw_message -- there was
-- nowhere to put the sender's address. Nullable because existing rows
-- (and anything inserted before step 2 parses a real "From" header) won't
-- have it yet; the approve-and-send UI prompts for it when missing.
alter table public.leads
  add column if not exists contact text;

comment on column public.leads.contact is
  'Email (or phone, for SMS leads) to send the approved reply to. Populated from the inbox connector once step 2 exists; entered manually for test leads until then.';
