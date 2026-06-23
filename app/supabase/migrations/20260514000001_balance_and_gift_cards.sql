-- Wallet balance + gift card system
-- Balance is stored in kr (integer). Gift card codes are single-use.

alter table profiles add column if not exists balance integer not null default 0;

create table if not exists gift_cards (
  code text primary key,
  amount integer not null check (amount > 0),
  redeemed_by uuid references auth.users(id),
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  kind text not null check (kind in ('redeem', 'spend', 'refund')),
  ref text,
  created_at timestamptz not null default now()
);

create index if not exists wallet_transactions_user_idx on wallet_transactions(user_id, created_at desc);

alter table gift_cards enable row level security;
alter table wallet_transactions enable row level security;

drop policy if exists "wallet_tx_own_select" on wallet_transactions;
create policy "wallet_tx_own_select" on wallet_transactions
  for select using (auth.uid() = user_id);

-- Atomic redeem: marks the gift card used, bumps profile balance, writes a transaction.
create or replace function redeem_gift_card(p_code text)
returns table(new_balance integer, redeemed_amount integer)
language plpgsql security definer as $$
declare
  v_amount integer;
  v_user uuid := auth.uid();
  v_new integer;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  update gift_cards
    set redeemed_by = v_user, redeemed_at = now()
    where code = upper(trim(p_code)) and redeemed_by is null
    returning amount into v_amount;

  if v_amount is null then
    raise exception 'invalid_or_used_code';
  end if;

  update profiles set balance = balance + v_amount
    where id = v_user
    returning balance into v_new;

  insert into wallet_transactions (user_id, amount, kind, ref)
    values (v_user, v_amount, 'redeem', upper(trim(p_code)));

  return query select v_new, v_amount;
end $$;

-- Atomic spend: only succeeds if balance covers the amount.
create or replace function spend_balance(p_amount integer, p_ref text)
returns integer
language plpgsql security definer as $$
declare
  v_user uuid := auth.uid();
  v_new integer;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;

  update profiles
    set balance = balance - p_amount
    where id = v_user and balance >= p_amount
    returning balance into v_new;

  if v_new is null then raise exception 'insufficient_balance'; end if;

  insert into wallet_transactions (user_id, amount, kind, ref)
    values (v_user, -p_amount, 'spend', p_ref);

  return v_new;
end $$;

grant execute on function redeem_gift_card(text) to authenticated;
grant execute on function spend_balance(integer, text) to authenticated;

-- Seed a few demo gift cards for testing. Remove/replace in production.
insert into gift_cards (code, amount) values
  ('WELCOME100', 100),
  ('BERGEN50',   50),
  ('MINPLASS200', 200)
on conflict (code) do nothing;
