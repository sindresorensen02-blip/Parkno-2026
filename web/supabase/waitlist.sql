-- Parkno pre-launch waitlist. Run once in the Supabase SQL editor.
-- Separate from `leads` (the concierge CRM) on purpose: a waitlist signup is
-- just name + email + intent (park / host), with no phone/verification pipeline.

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  first_name  text not null,
  last_name   text not null,
  email       text not null,
  role        text not null default 'park',   -- 'park' (find parking) | 'host' (rent out a spot)
  source      text default 'waitlist.html',
  ip          text,
  user_agent  text
);

-- Add the role column to tables created before it existed (idempotent).
alter table public.waitlist add column if not exists role text not null default 'park';

-- One signup per email. The API treats a duplicate as success ("already on
-- the list") rather than an error.
create unique index if not exists waitlist_email_key
  on public.waitlist (lower(email));
create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);
-- Supports the per-IP rate-limit lookup in api/waitlist.js.
create index if not exists waitlist_ip_created_idx on public.waitlist (ip, created_at);

-- RLS on, with NO policies: only the service role (used server-side by
-- api/waitlist.js) can read or write. The anon/public key cannot touch it.
alter table public.waitlist enable row level security;
