-- ─────────────────────────────────────────────
-- PHASE 0 follow-up: write consent audit rows from the sign-up trigger
--
-- The client cannot reliably insert into public.consents: with email
-- confirmation ON (required in production per 20260511000007), signUp returns
-- no session, so a client-side insert runs unauthenticated and RLS rejects it.
-- The trigger is security definer and runs in the same transaction as the
-- profile insert, so it can write the audit rows regardless of session state.
--
-- Policy versions travel in raw_user_meta_data (set by buildConsentMeta in
-- app/src/lib/legal.js) so that module stays the single source of truth.
-- ─────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_terms_at   timestamptz := case when new.raw_user_meta_data ? 'terms_accepted_at'
                                   then (new.raw_user_meta_data->>'terms_accepted_at')::timestamptz end;
  v_privacy_at timestamptz := case when new.raw_user_meta_data ? 'privacy_accepted_at'
                                   then (new.raw_user_meta_data->>'privacy_accepted_at')::timestamptz end;
begin
  insert into public.profiles (id, full_name, role, terms_accepted_at, privacy_accepted_at)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'sjåfør'),
    v_terms_at,
    v_privacy_at
  );

  -- Authoritative audit rows. Only written when consent timestamps + versions
  -- are present in the signup metadata.
  if v_terms_at is not null and new.raw_user_meta_data ? 'terms_version' then
    insert into public.consents (user_id, kind, version, accepted_at)
    values (new.id, 'terms', new.raw_user_meta_data->>'terms_version', v_terms_at);
  end if;

  if v_privacy_at is not null and new.raw_user_meta_data ? 'privacy_version' then
    insert into public.consents (user_id, kind, version, accepted_at)
    values (new.id, 'privacy', new.raw_user_meta_data->>'privacy_version', v_privacy_at);
  end if;

  return new;
end;
$$;
