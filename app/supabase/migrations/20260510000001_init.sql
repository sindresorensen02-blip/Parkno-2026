-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- PROFILES
-- One row per auth.users entry. Created by trigger on sign-up.
-- ─────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read and update their own profile
create policy "profiles: own read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─────────────────────────────────────────────
-- SPOTS
-- Parking spots listed by hosts
-- ─────────────────────────────────────────────
create table public.spots (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  address       text not null,
  spot_type     text not null check (spot_type in ('innkjorsel','garasje','utendors','innendors')),
  price_per_hour numeric(8,2) not null check (price_per_hour > 0),
  active        boolean not null default true,
  description   text,
  amenities     text[] not null default '{}',
  available_days text[] not null default '{"Ma","Ti","On","To","Fr","Lø","Sø"}',
  available_from time not null default '08:00',
  available_to   time not null default '20:00',
  lat           double precision,
  lng           double precision,
  created_at    timestamptz not null default now()
);

alter table public.spots enable row level security;

-- Anyone can read active spots (for the map / search)
create policy "spots: public read active"
  on public.spots for select
  using (active = true);

-- Owners can read all their own spots (including paused)
create policy "spots: owner read all"
  on public.spots for select
  using (auth.uid() = owner_id);

-- Owners can insert, update, delete their own spots
create policy "spots: owner insert" on public.spots for insert with check (auth.uid() = owner_id);
create policy "spots: owner update" on public.spots for update using (auth.uid() = owner_id);
create policy "spots: owner delete" on public.spots for delete using (auth.uid() = owner_id);


-- ─────────────────────────────────────────────
-- RESERVATIONS
-- Bookings made by renters on spots
-- ─────────────────────────────────────────────
create type public.reservation_status as enum ('pending','confirmed','cancelled','completed');

create table public.reservations (
  id            uuid primary key default gen_random_uuid(),
  spot_id       uuid not null references public.spots(id) on delete cascade,
  renter_id     uuid not null references public.profiles(id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  duration_mins int not null check (duration_mins > 0),
  price_subtotal numeric(10,2) not null,
  booking_fee    numeric(10,2) not null,
  total          numeric(10,2) not null,
  status        public.reservation_status not null default 'pending',
  created_at    timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.reservations enable row level security;

-- Renters see their own bookings
create policy "reservations: renter read"
  on public.reservations for select
  using (auth.uid() = renter_id);

-- Spot owners see bookings on their spots
create policy "reservations: owner read"
  on public.reservations for select
  using (
    exists (
      select 1 from public.spots s
      where s.id = spot_id and s.owner_id = auth.uid()
    )
  );

-- Renters can create and cancel their own reservations
create policy "reservations: renter insert" on public.reservations for insert with check (auth.uid() = renter_id);
create policy "reservations: renter cancel"
  on public.reservations for update
  using (auth.uid() = renter_id)
  with check (status = 'cancelled');
