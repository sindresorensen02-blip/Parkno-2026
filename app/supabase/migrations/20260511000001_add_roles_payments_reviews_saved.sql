-- ─────────────────────────────────────────────
-- PROFILES: add role column
-- ─────────────────────────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'sjåfør'
    check (role in ('sjåfør', 'utleier'));

-- Store role from sign-up metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'sjåfør')
  );
  return new;
end;
$$;


-- ─────────────────────────────────────────────
-- RESERVATIONS: add payment columns
-- ─────────────────────────────────────────────
create type public.payment_method as enum ('vipps', 'apple_pay');
create type public.payment_status  as enum ('pending', 'paid', 'refunded');

alter table public.reservations
  add column if not exists payment_method   public.payment_method,
  add column if not exists payment_status   public.payment_status not null default 'pending',
  add column if not exists payment_reference text;  -- external ID from Vipps / Apple Pay


-- ─────────────────────────────────────────────
-- REVIEWS
-- One review per completed reservation
-- ─────────────────────────────────────────────
create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  spot_id        uuid not null references public.spots(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  reviewer_id    uuid not null references public.profiles(id) on delete cascade,
  rating         smallint not null check (rating between 1 and 5),
  comment        text,
  created_at     timestamptz not null default now(),
  unique (reservation_id)  -- one review per booking
);

alter table public.reviews enable row level security;

-- Anyone can read reviews
create policy "reviews: public read"
  on public.reviews for select
  using (true);

-- Only the reviewer can insert (and only if the reservation is theirs)
create policy "reviews: reviewer insert"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

-- Reviewer can update their own review
create policy "reviews: reviewer update"
  on public.reviews for update
  using (auth.uid() = reviewer_id);

-- Handy average rating view
create or replace view public.spot_ratings as
  select
    spot_id,
    round(avg(rating)::numeric, 1) as avg_rating,
    count(*)                        as review_count
  from public.reviews
  group by spot_id;


-- ─────────────────────────────────────────────
-- SAVED SPOTS (favourites)
-- ─────────────────────────────────────────────
create table public.saved_spots (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  spot_id    uuid not null references public.spots(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, spot_id)  -- no duplicates
);

alter table public.saved_spots enable row level security;

-- Users can only see and manage their own saved spots
create policy "saved_spots: own read"   on public.saved_spots for select using (auth.uid() = user_id);
create policy "saved_spots: own insert" on public.saved_spots for insert with check (auth.uid() = user_id);
create policy "saved_spots: own delete" on public.saved_spots for delete using (auth.uid() = user_id);
