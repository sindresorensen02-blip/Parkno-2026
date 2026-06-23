create table if not exists public.support_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  channel    text not null,
  topic      text,
  message    text not null,
  created_at timestamptz default now()
);

create table if not exists public.app_reviews (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  rating     int not null check (rating between 1 and 5),
  tags       text[],
  comment    text,
  created_at timestamptz default now()
);

alter table public.support_messages enable row level security;
alter table public.app_reviews enable row level security;

create policy "insert own support message"
  on public.support_messages for insert
  with check (user_id = auth.uid() or user_id is null);

create policy "insert own app review"
  on public.app_reviews for insert
  with check (user_id = auth.uid() or user_id is null);
