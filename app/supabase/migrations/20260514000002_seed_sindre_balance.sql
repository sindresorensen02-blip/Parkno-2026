-- One-shot: credit 100 000 NOK to sindresorensen02@gmail.com for testing.
-- Safe to re-run: the wallet_transactions row keys this seed by `ref`, so
-- repeated runs add only if the credit has not already been applied.

do $$
declare
  v_user uuid;
  v_already integer;
begin
  select id into v_user from auth.users where lower(email) = lower('sindresorensen02@gmail.com');

  if v_user is null then
    raise notice 'no user with email sindresorensen02@gmail.com — sign in once, then run this again';
    return;
  end if;

  select coalesce(count(*), 0) into v_already
    from wallet_transactions
    where user_id = v_user and ref = 'dev_seed_100k';

  if v_already > 0 then
    raise notice 'seed already applied for user %', v_user;
    return;
  end if;

  update profiles set balance = coalesce(balance, 0) + 100000 where id = v_user;
  insert into wallet_transactions (user_id, amount, kind, ref)
    values (v_user, 100000, 'redeem', 'dev_seed_100k');
end $$;
