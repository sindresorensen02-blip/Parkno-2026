-- Parkno lead capture (PRD §6.1 / §6.5). Run once in the Supabase SQL editor.
-- The table doubles as the concierge CRM until the native app exists.

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  role            text not null check (role in ('driver','host')),
  -- concierge pipeline state (PRD §6.5)
  status          text not null default 'new'
                  check (status in ('new','contacted','verified','live','matched',
                                     'booked','paid','paid_out','rated','rejected')),
  first_name      text not null,
  last_name       text not null,
  email           text not null,
  phone           text not null,
  neighborhood    text,
  -- driver
  vehicle         text,
  plate           text,
  -- host
  space_address   text,
  space_type      text,
  availability    text,
  expected_price  text,
  consent         boolean not null default false,
  source          text default 'register.html',
  ip              text,
  user_agent      text
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_role_status_idx on public.leads (role, status);
-- Supports the per-IP rate-limit lookup in api/lead.js.
create index if not exists leads_ip_created_idx on public.leads (ip, created_at);

-- RLS on, with NO policies: only the service role (used server-side by
-- api/lead.js) can read or write. The anon/public key cannot touch this table.
alter table public.leads enable row level security;
