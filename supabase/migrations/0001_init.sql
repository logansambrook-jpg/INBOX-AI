-- Inbox AI: initial schema
--
-- Multi-tenant model: one Supabase project hosts every business
-- ("tabs in one browser"). Every tenant-owned table carries business_id,
-- and Row Level Security is the enforcement boundary — application code
-- must still filter by business_id, but RLS is what guarantees a bug in
-- application code can never leak one business's data to another.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- business_config: one row per tenant business
-- ---------------------------------------------------------------------
create table if not exists public.business_config (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  tone_notes     text,
  service_menu   text,
  faqs           text,
  inbox_provider text check (inbox_provider in ('gmail', 'outlook')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.business_config is
  'One row per tenant. Every other tenant-owned table references this via business_id.';

-- ---------------------------------------------------------------------
-- profiles: maps an authenticated Supabase user to exactly one business
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  business_id uuid not null references public.business_config (id) on delete cascade,
  full_name   text,
  role        text not null default 'owner' check (role in ('owner', 'member')),
  created_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Links auth.users -> business_config. This is how RLS policies determine which tenant a request belongs to.';

create index if not exists profiles_business_id_idx on public.profiles (business_id);

-- ---------------------------------------------------------------------
-- inbox_connections: encrypted OAuth tokens for the connected inbox
-- ---------------------------------------------------------------------
create table if not exists public.inbox_connections (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.business_config (id) on delete cascade,
  provider         text not null check (provider in ('gmail', 'outlook')),
  connected_email  text,
  -- Tokens are encrypted application-side (e.g. AES-GCM with a server-only
  -- key) before insert. This column never holds plaintext, and no RLS
  -- policy below grants anon/authenticated access to it at all — only the
  -- service-role key (used exclusively from trusted server code) can
  -- read or write this table.
  encrypted_tokens text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (business_id, provider)
);

comment on table public.inbox_connections is
  'Encrypted inbox OAuth tokens. Service-role only — deliberately has no anon/authenticated RLS policies.';

-- ---------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.business_config (id) on delete cascade,
  raw_message     text not null,
  channel         text not null default 'email' check (channel in ('email', 'form', 'sms')),
  status          text not null default 'new' check (status in ('new', 'drafted', 'approved', 'sent')),
  classification  text check (classification in ('hot', 'warm', 'cold')),
  intent_summary  text,
  draft_text      text,
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.leads is
  'Inbound leads. status tracks the human-in-the-loop pipeline: new -> drafted -> approved -> sent.';

create index if not exists leads_business_id_idx on public.leads (business_id);
create index if not exists leads_business_id_status_idx on public.leads (business_id, status);

-- ---------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------
create table if not exists public.bookings (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.business_config (id) on delete cascade,
  client_name       text not null,
  contact           text not null,
  appointment_time  timestamptz not null,
  reminder_sent     boolean not null default false,
  confirmed         boolean not null default false,
  created_at        timestamptz not null default now()
);

comment on table public.bookings is
  'Upcoming appointments. The reminder cron scans for appointment_time in the near future with reminder_sent = false.';

create index if not exists bookings_business_id_idx on public.bookings (business_id);
create index if not exists bookings_reminder_due_idx
  on public.bookings (appointment_time)
  where reminder_sent = false;

-- ---------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.business_config;
create trigger set_updated_at
  before update on public.business_config
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.inbox_connections;
create trigger set_updated_at
  before update on public.inbox_connections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- get_my_business_id(): the single source of truth RLS policies use to
-- resolve "which tenant is this request allowed to touch". SECURITY
-- DEFINER lets it read public.profiles (which has its own restrictive
-- RLS) without creating a recursive policy dependency.
-- ---------------------------------------------------------------------
create or replace function public.get_my_business_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select business_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.business_config enable row level security;
alter table public.profiles enable row level security;
alter table public.inbox_connections enable row level security;
alter table public.leads enable row level security;
alter table public.bookings enable row level security;

-- profiles: a user may see and edit only their own profile row. Rows are
-- created by trusted server-side code (onboarding), not by end users, so
-- there is deliberately no insert policy for authenticated/anon.
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- business_config: visible/editable only for the caller's own business.
-- No insert/delete policy — new tenants are provisioned by trusted
-- server-side onboarding code, not self-service by end users.
create policy "business_config_select_own" on public.business_config
  for select using (id = public.get_my_business_id());

create policy "business_config_update_own" on public.business_config
  for update using (id = public.get_my_business_id())
  with check (id = public.get_my_business_id());

-- inbox_connections: intentionally NO policies for anon/authenticated.
-- RLS is enabled with zero grants, so every client-side query returns
-- nothing; only the service-role key (server-only) can reach this table.

-- leads: full CRUD scoped to the caller's business_id.
create policy "leads_select_own_business" on public.leads
  for select using (business_id = public.get_my_business_id());

create policy "leads_insert_own_business" on public.leads
  for insert with check (business_id = public.get_my_business_id());

create policy "leads_update_own_business" on public.leads
  for update using (business_id = public.get_my_business_id())
  with check (business_id = public.get_my_business_id());

create policy "leads_delete_own_business" on public.leads
  for delete using (business_id = public.get_my_business_id());

-- bookings: full CRUD scoped to the caller's business_id.
create policy "bookings_select_own_business" on public.bookings
  for select using (business_id = public.get_my_business_id());

create policy "bookings_insert_own_business" on public.bookings
  for insert with check (business_id = public.get_my_business_id());

create policy "bookings_update_own_business" on public.bookings
  for update using (business_id = public.get_my_business_id())
  with check (business_id = public.get_my_business_id());

create policy "bookings_delete_own_business" on public.bookings
  for delete using (business_id = public.get_my_business_id());
