-- ─────────────────────────────────────────────
-- PHASE 0: Consent storage + forward-looking profile columns
-- ─────────────────────────────────────────────

-- Forward-looking, nullable profile columns (populated in Phases 1–3).
alter table public.profiles
  add column if not exists terms_accepted_at   timestamptz,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists vipps_sub           text,
  add column if not exists phone_verified_at   timestamptz,
  add column if not exists kyc_status          text not null default 'none'
    check (kyc_status in ('none','pending','verified','rejected')),
  add column if not exists payout_account      text;

-- Append-only consent audit trail. One row per accepted policy version.
create table if not exists public.consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('terms','privacy')),
  version     text not null,
  accepted_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

alter table public.consents enable row level security;

-- Users can read and insert only their own consent rows. No update/delete
-- policy: the table is append-only by omission.
create policy "consents: own read"   on public.consents for select using (auth.uid() = user_id);
create policy "consents: own insert" on public.consents for insert with check (auth.uid() = user_id);

create index if not exists consents_user_id_idx on public.consents (user_id);

-- Extend the sign-up trigger to denormalize consent timestamps onto profiles.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role, terms_accepted_at, privacy_accepted_at)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'sjåfør'),
    case when new.raw_user_meta_data ? 'terms_accepted_at'
         then (new.raw_user_meta_data->>'terms_accepted_at')::timestamptz end,
    case when new.raw_user_meta_data ? 'privacy_accepted_at'
         then (new.raw_user_meta_data->>'privacy_accepted_at')::timestamptz end
  );
  return new;
end;
$$;
