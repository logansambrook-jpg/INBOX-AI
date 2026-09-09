# Inbox AI

AI-assisted lead response and booking-reminder dashboard. Reads inbound
leads from a connected inbox, classifies and drafts a reply with Claude,
waits for a human to approve or edit before anything sends, and separately
sends automated booking reminders to cut no-shows. Multi-tenant: one
deployment hosts many businesses, each fully isolated by `business_id`.

This repo is being built in the step order described in the project brief.
**Step 1 (this commit): project foundation** — Next.js app, Supabase schema
with Row Level Security, and basic auth.

## Stack

- **Next.js (App Router)** — frontend + API routes, deployed on Vercel
- **Supabase** — Postgres, Auth, Row Level Security for per-tenant isolation
- **Anthropic (Claude)** — lead classification and reply drafting (added in step 3)
- **Gmail/Outlook OAuth** — inbox intake (added in step 2)
- **Twilio / Resend** — booking reminders (added in step 6)

## Multi-tenancy model

One Supabase project, shared by every business ("tabs in one browser"). Every
tenant-owned table (`leads`, `bookings`, `business_config`,
`inbox_connections`) carries a `business_id` column. Application code always
filters by it explicitly, **and** Postgres Row Level Security enforces the
same boundary independently — see `supabase/migrations/0001_init.sql`. A
user's `business_id` is resolved from `public.profiles`, which links
`auth.users` to exactly one `business_config` row.

## Getting started

### 1. Create a Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/migrations/0001_init.sql`. This creates
   `business_config`, `profiles`, `inbox_connections`, `leads`, `bookings`,
   and all Row Level Security policies.
3. In **Authentication → Providers**, confirm Email is enabled (magic-link
   sign-in is used — no passwords in v1).
4. In **Authentication → URL Configuration**, add your local and deployed
   URLs (e.g. `http://localhost:3000/auth/callback` and
   `https://<your-vercel-domain>/auth/callback`) as redirect URLs.
5. Grab your project URL, anon key, and service role key from
   **Project Settings → API**.

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` from step 1. Leave the Anthropic/OAuth/reminder
keys blank for now — they're needed starting in steps 2–6. `.env.local` is
gitignored; never commit real keys.

### 3. Install and run

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) — you'll be redirected
to `/login`.

### 4. Provision business #1 and sign in

There's no self-service signup yet (by design — onboarding is streamlined
later, in step 8). To create the first tenant:

1. Sign in once at `/login` with the owner's email to create their
   `auth.users` row (you'll get a magic link — following it lands you on
   `/dashboard`, which will say the account isn't linked to a business yet).
2. In the Supabase SQL Editor, adapt `supabase/seed.example.sql` to create
   the `business_config` row and link it to that user's `profiles` row.
3. Refresh `/dashboard` — you should now see the (empty) lead and booking
   lists for that business.

### 5. Deploy to Vercel

1. Push this repo to GitHub (already done if you're reading this from the
   repo).
2. In [vercel.com](https://vercel.com), **Add New → Project**, import the
   GitHub repo.
3. Add the same environment variables from `.env.local` in the Vercel
   project's **Settings → Environment Variables**.
4. Deploy. Vercel gives you a live `https://*.vercel.app` URL immediately,
   and redeploys automatically on every push to the default branch.
5. Add that Vercel URL's `/auth/callback` path to Supabase's redirect URL
   allowlist (see step 1.4).

> Claude Code cannot create or authorize your Supabase/Vercel accounts on
> its own — those steps need your login. Once both accounts exist, ask
> Claude Code to walk through connecting them if you'd like help.

## Security notes (non-negotiable per the project brief)

- Every tenant table has `business_id` and Row Level Security enabled;
  `public.get_my_business_id()` is the single source of truth policies use.
- Inbox OAuth tokens will be stored encrypted in `inbox_connections`, which
  has **no** RLS policies for `anon`/`authenticated` at all — only
  server-side code using the service-role key
  (`src/lib/supabase/admin.ts`) can reach that table.
- `src/lib/supabase/admin.ts` imports `server-only` so a service-role key
  can never end up in a client bundle.
- All dashboard routes require authentication via `src/middleware.ts`; API
  routes must call `requireBusinessContext()` from `src/lib/auth.ts` first.
- No lead reply is ever sent without an explicit human approval step
  (enforced by the `leads.status` state machine: `new → drafted → approved
  → sent`). The classification engine (step 3) only ever writes a
  `draft_text` and sets status to `drafted` — nothing is sent automatically.
- `ANTHROPIC_API_KEY` is read server-only in `src/lib/claude/client.ts`
  (also `server-only`-guarded) and never reaches the browser.

## Project structure

```
src/
  app/
    login/                        magic-link sign-in
    auth/callback/                 exchanges the magic-link code for a session
    api/leads/[id]/classify/       POST: run Claude on one lead (auth required)
    dashboard/
      layout.tsx                   sidebar/nav shell, auth + onboarding gate
      page.tsx                     overview (stats row, recent activity)
      leads/                       full lead list — filter/sort/expand
      bookings/                    booking list
      settings/                    read-only business profile
  components/dashboard/            badges, stat cards, nav, leads table, etc.
  lib/
    supabase/
      client.ts                   browser Supabase client (anon key)
      server.ts                   server Supabase client (anon key, RLS-scoped)
      admin.ts                    service-role client — server-only, bypasses RLS
      middleware.ts               session refresh + route protection (used by proxy.ts)
    claude/
      client.ts                   server-only Anthropic client
      classify-lead.ts            classification + drafting engine
    data/leads.ts, data/bookings.ts   query helpers, always business_id-scoped
    auth.ts                       requireBusinessContext() guard for API routes
    dashboard-context.ts          same, for server-rendered dashboard pages
  proxy.ts                        auth gate for every route (Next.js "proxy" convention)
  types/database.ts               hand-written types mirroring the SQL schema
supabase/
  migrations/0001_init.sql          schema + Row Level Security
  migrations/0002_gym_test_business.sql   sample tenant profile for step 3 testing
  seed.example.sql                   template for provisioning a business
```

## Build order

See the project brief for full acceptance criteria per step. Status:

- [x] 1. Project foundation
- [ ] 2. Connect one inbox
- [x] 3. Claude classification & drafting engine (manual "Generate draft"
      button in the Leads page; not yet wired to run automatically on
      insert — there's no insert path until step 2 exists)
- [x] 4. Dashboard (list/filter/edit — inline edit of the draft itself is
      still open, deferred until there's a dedicated lead-detail view)
- [ ] 5. Approve-and-send flow
- [ ] 6. Booking reminder engine
- [ ] 7. End-to-end testing with real data
- [ ] 8. Streamline onboarding for the next business
