# Phase 0 — Foundation: Consent Storage + Profile Schema

**Date:** 2026-06-28
**Status:** Approved design, pending spec review
**Provider stack:** Vipps (Login + payments) — chosen for Norway fit; covers verified phone, identity, KYC, and payments in one integration.
**Build depth:** Stub-first — schema + consent UI are real now; provider columns exist but stay null until their phase wires the live integration.

## Context

The parkno app is a two-sided Norwegian parking marketplace (drivers = *sjåfør*, hosts = *utleier*) on Supabase. A six-field rollout was agreed across phases:

| Phase | Field | Class |
|-------|-------|-------|
| 0 | Terms/privacy consent (stored) | Legal (GDPR) |
| 0 | Profiles schema extension | Foundation |
| 1 | Verified phone | Important |
| 2 | License plate | Blocker |
| 2 | Driver payment method | Blocker |
| 3 | Host payout account (kontonummer) | Blocker |
| 3 | Host KYC + identity | Legal (AML) |

This spec covers **Phase 0 only**. It is the foundation every later phase writes to.

## Existing conventions (build with the grain)

- Timestamped SQL migrations in `app/supabase/migrations/` (e.g. `20260512000005_profile_deleted_at.sql`).
- Row Level Security enabled on every table, with `own read` / `own insert` / `own update` policies keyed on `auth.uid()`.
- `public.profiles` is auto-created per `auth.users` row by the `handle_new_user()` trigger, which reads `raw_user_meta_data` set at signup.
- Vipps is the established payment rail (`payment_method` enum, `vipps-webhook` edge function).
- App auth flows through `AuthContext.signUp(email, password, fullName, role)` → `supabase.auth.signUp({ ..., options: { data: {...} } })`.

## Goals

1. Store **terms + privacy consent** at signup — timestamped, versioned, GDPR-defensible.
2. Replace the **dead legal label** at `AuthScreen.js:140-144` with a real, required consent checkbox on the register flow.
3. Add the **forward-looking, nullable profile columns** Phases 1–3 will populate, so later phases are pure feature work with no schema churn.

## Non-Goals (explicitly out of scope for Phase 0)

- No Vipps API calls of any kind.
- No license-plate capture (deferred to a `vehicles` table in Phase 2 — drivers can have multiple plates, so it is not a profile column).
- No payout UI, no KYC flow, no phone OTP verification.
- Login flow is untouched; only the register flow changes.

## Design

### 1. Consent — separate audit table (not profile columns)

Consent lives in its own append-only table so re-consent on policy updates is captured as history, which is the GDPR-defensible shape. Denormalized convenience columns on `profiles` give cheap gating reads.

```
public.consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('terms','privacy')),
  version     text not null,
  accepted_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
)
```

RLS:
- `consents: own read`   — `using (auth.uid() = user_id)`
- `consents: own insert` — `with check (auth.uid() = user_id)`

No update/delete policy — append-only by omission.

### 2. Forward-looking profile columns (all nullable, no behavior)

```
alter table public.profiles
  add column if not exists terms_accepted_at   timestamptz,   -- denormalized from consents (Phase 0)
  add column if not exists privacy_accepted_at timestamptz,   -- denormalized from consents (Phase 0)
  add column if not exists vipps_sub           text,          -- Vipps Login subject id (Phase 1)
  add column if not exists phone_verified_at   timestamptz,   -- Phase 1
  add column if not exists kyc_status          text not null default 'none'
                                                 check (kyc_status in ('none','pending','verified','rejected')),  -- Phase 3
  add column if not exists payout_account      text;          -- kontonummer (Phase 3)
```

`license plate` is intentionally **absent** — it becomes a `vehicles` table in Phase 2.

### 3. Consent version constant

A single source of truth for the current policy version, referenced by both the app and the trigger fallback:

- App constant: `CURRENT_TERMS_VERSION = '2026-06-28'` (and privacy same date) in a small `app/src/lib/legal.js`.
- Bumping the version on a future policy change forces fresh consent capture; old `consents` rows remain as history.

### 4. Signup trigger change

`handle_new_user()` extended to denormalize consent timestamps from signup metadata onto the new profile row:

```sql
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
```

The trigger only denormalizes onto `profiles`. The authoritative `consents` rows are inserted from the app client immediately after a successful `signUp()` (two rows: `terms`, `privacy`), under the user's own session so RLS `own insert` applies.

### 5. App changes

**`app/src/lib/legal.js`** (new) — exports `CURRENT_TERMS_VERSION`, `CURRENT_PRIVACY_VERSION`.

**`AuthContext.signUp`** — signature becomes `signUp(email, password, fullName, role, consent)` where `consent` carries the accepted versions + timestamp. It:
1. Calls `supabase.auth.signUp` with `terms_accepted_at` / `privacy_accepted_at` in `options.data`.
2. On success, inserts the two authoritative `consents` rows.

**`AuthScreen.js`** — on the **register** view only:
- The legal text (`AuthScreen.js:140-144`) becomes a required checkbox row.
- `submit()` blocks registration unless the box is checked (Norwegian validation message, matching existing `setError` style).
- Login view unchanged.

## Data Flow

```
Register form (consent checked)
  └─ AuthContext.signUp(..., consent)
       ├─ supabase.auth.signUp({ options.data: { full_name, role, terms_accepted_at, privacy_accepted_at } })
       │     └─ trigger handle_new_user() → profiles row w/ denormalized consent timestamps
       └─ on success: insert consents[terms], consents[privacy]  (authoritative audit rows, RLS own-insert)
```

## Error Handling

- Consent checkbox unticked → register blocked client-side with a Norwegian error, no network call.
- `auth.signUp` error → existing error surface in `AuthScreen.submit()` (unchanged path).
- `consents` insert failure after a successful `signUp` → log + non-fatal: the denormalized profile timestamps still record consent; a retry/backfill can reconcile. Registration is not failed for this, to avoid orphaning a created auth user. (Acceptable because the profile-level timestamps are themselves a valid consent record; the table is the richer audit copy.)

## Testing

- Migration applies cleanly on top of existing migrations (`supabase db reset` locally).
- New profile columns default correctly (`kyc_status = 'none'`, others null).
- RLS: a user can read/insert only their own `consents` rows; cannot read another user's.
- Register with consent → profile has both timestamps set AND two `consents` rows exist.
- Register attempt without ticking consent → blocked, no auth user created.
- Login flow unaffected.

## Files Touched

- `app/supabase/migrations/20260628000001_phase0_consent_and_profile_fields.sql` (new)
- `app/src/lib/legal.js` (new)
- `app/src/context/AuthContext.js` (signUp)
- `app/src/screens/AuthScreen.js` (register consent checkbox + validation)
