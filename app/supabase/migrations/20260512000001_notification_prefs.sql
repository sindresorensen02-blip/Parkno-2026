-- Add notification preferences and push token to profiles
alter table public.profiles
  add column if not exists notification_prefs jsonb default '{}'::jsonb,
  add column if not exists expo_push_token    text;

-- Index for server-side push fan-out queries
create index if not exists profiles_expo_push_token_idx
  on public.profiles(expo_push_token)
  where expo_push_token is not null;
