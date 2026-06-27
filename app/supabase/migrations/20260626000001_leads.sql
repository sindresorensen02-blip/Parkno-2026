-- Landing-page lead capture (driver + host interest) for /api/lead.
-- Written exclusively by the server using the service role key, which
-- bypasses RLS. We enable RLS with NO policies so the anon/public client
-- can never read or write leads (PII: names, emails, phone numbers).

create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  role           text not null check (role in ('driver', 'host')),
  first_name     text not null,
  last_name      text not null,
  email          text not null,
  phone          text not null,
  -- driver-only
  neighborhood   text,
  vehicle        text,
  plate          text,
  -- host-only (optional for the lightweight 'index-hero' source)
  space_address  text,
  space_type     text,
  availability   text,
  expected_price text,
  consent        boolean not null default false,
  source         text,
  ip             text,
  user_agent     text,
  created_at     timestamptz not null default now()
);

-- Supports the per-IP rate limit query: ip = eq.X and created_at >= since.
create index if not exists leads_ip_created_at_idx
  on public.leads (ip, created_at desc);

create index if not exists leads_created_at_idx
  on public.leads (created_at desc);

alter table public.leads enable row level security;
-- Intentionally no policies: only the service role (server) may touch this table.
