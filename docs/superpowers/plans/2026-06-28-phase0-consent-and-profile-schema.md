# Phase 0 — Consent + Profile Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store timestamped, versioned terms/privacy consent at signup (GDPR) and add the forward-looking nullable profile columns that Phases 1–3 will populate.

**Architecture:** One additive SQL migration creates an append-only `consents` table + nullable `profiles` columns and extends the `handle_new_user()` trigger to denormalize consent timestamps. Pure-JS consent logic lives in `src/lib/legal.js` (testable with `node:test`); `AuthContext.signUp` writes the authoritative consent rows; `AuthScreen.js` gains a required consent checkbox on the register flow only.

**Tech Stack:** Supabase (Postgres + RLS), React Native / Expo, `@supabase/supabase-js`, `node:test` for pure-JS unit tests.

## Global Constraints

- Provider stack is **Vipps** — new provider columns are Vipps-shaped (`vipps_sub`); no other provider columns.
- **Stub-first:** no Vipps API calls in Phase 0. New provider/KYC/payout columns are nullable and stay null.
- License plate is **NOT** in scope — deferred to a `vehicles` table in Phase 2. Do not add a plate column.
- Migrations follow existing style: timestamped filename `app/supabase/migrations/YYYYMMDDNNNNNN_*.sql`, RLS enabled on new tables, lowercase SQL.
- Login flow is untouched; only the **register** view of `AuthScreen.js` changes.
- UI copy is Norwegian, matching existing `setError` message style.
- Consent version strings are date-form: `'2026-06-28'`.
- Pure-JS tests use `node:test` (`const { test } = require('node:test')`), run via `npm test`-style `node --test`.

---

### Task 1: Phase 0 migration — consent table + profile columns + trigger

**Files:**
- Create: `app/supabase/migrations/20260628000001_phase0_consent_and_profile_fields.sql`

**Interfaces:**
- Consumes: existing `public.profiles` table and `public.handle_new_user()` trigger function.
- Produces:
  - Table `public.consents (id uuid, user_id uuid, kind text, version text, accepted_at timestamptz, created_at timestamptz)` with RLS `own read` + `own insert`.
  - New `public.profiles` columns: `terms_accepted_at timestamptz`, `privacy_accepted_at timestamptz`, `vipps_sub text`, `phone_verified_at timestamptz`, `kyc_status text default 'none'`, `payout_account text`.
  - Updated `handle_new_user()` that denormalizes `terms_accepted_at` / `privacy_accepted_at` from `raw_user_meta_data`.

- [ ] **Step 1: Write the migration**

Create `app/supabase/migrations/20260628000001_phase0_consent_and_profile_fields.sql`:

```sql
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
```

- [ ] **Step 2: Apply migrations from a clean state**

Run: `cd app && supabase db reset`
Expected: all migrations apply with no error; output ends with the seed step succeeding. The reset runs every migration in order, so a syntax error or bad reference in the new file fails here.

- [ ] **Step 3: Verify schema shape**

Run:
```bash
cd app && supabase db reset >/dev/null 2>&1 && \
  echo "\d public.consents" | supabase db query 2>/dev/null || \
  psql "$(supabase status -o env 2>/dev/null | grep DB_URL | cut -d= -f2)" -c "\d public.consents" -c "\d public.profiles"
```
Expected: `consents` has columns `id,user_id,kind,version,accepted_at,created_at`; `profiles` lists the six new columns including `kyc_status` with a default of `'none'`. (If the local Supabase CLI query form differs, open Studio at the URL from `supabase status` and confirm the columns visually — the goal is confirming the columns and the `kyc_status` default exist.)

- [ ] **Step 4: Commit**

```bash
git add app/supabase/migrations/20260628000001_phase0_consent_and_profile_fields.sql
git commit -m "feat(db): Phase 0 — consents table + forward-looking profile columns"
```

---

### Task 2: Consent logic in `src/lib/legal.js` (pure JS, tested)

**Files:**
- Create: `app/src/lib/legal.js`
- Test: `app/__tests__/legal.test.js`

**Interfaces:**
- Produces:
  - `CURRENT_TERMS_VERSION: string` (`'2026-06-28'`)
  - `CURRENT_PRIVACY_VERSION: string` (`'2026-06-28'`)
  - `buildConsentMeta(now?: Date): { terms_accepted_at: string, privacy_accepted_at: string }` — ISO timestamps for signup metadata.
  - `consentRows(userId: string, now?: Date): Array<{ user_id, kind, version, accepted_at }>` — the two authoritative rows to insert into `consents`.
- Consumed by: Task 3 (`AuthContext.signUp`).

- [ ] **Step 1: Write the failing test**

Create `app/__tests__/legal.test.js`:

```js
// Run with: npm test  (or: node --test __tests__/legal.test.js)
const { strict: assert } = require('node:assert');
const { test } = require('node:test');

const {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
  buildConsentMeta,
  consentRows,
} = require('../src/lib/legal.js');

test('versions are date-form strings', () => {
  assert.match(CURRENT_TERMS_VERSION, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(CURRENT_PRIVACY_VERSION, /^\d{4}-\d{2}-\d{2}$/);
});

test('buildConsentMeta returns ISO timestamps for both policies', () => {
  const now = new Date('2026-06-28T10:00:00.000Z');
  const meta = buildConsentMeta(now);
  assert.equal(meta.terms_accepted_at, '2026-06-28T10:00:00.000Z');
  assert.equal(meta.privacy_accepted_at, '2026-06-28T10:00:00.000Z');
});

test('consentRows produces one terms + one privacy row for the user', () => {
  const now = new Date('2026-06-28T10:00:00.000Z');
  const rows = consentRows('user-123', now);
  assert.equal(rows.length, 2);

  const terms = rows.find(r => r.kind === 'terms');
  const privacy = rows.find(r => r.kind === 'privacy');

  assert.deepEqual(terms, {
    user_id: 'user-123',
    kind: 'terms',
    version: CURRENT_TERMS_VERSION,
    accepted_at: '2026-06-28T10:00:00.000Z',
  });
  assert.deepEqual(privacy, {
    user_id: 'user-123',
    kind: 'privacy',
    version: CURRENT_PRIVACY_VERSION,
    accepted_at: '2026-06-28T10:00:00.000Z',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && node --test __tests__/legal.test.js`
Expected: FAIL — `Cannot find module '../src/lib/legal.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `app/src/lib/legal.js`:

```js
// Current policy versions. Bumping a version forces fresh consent capture on
// next signup; existing public.consents rows remain as history.
const CURRENT_TERMS_VERSION = '2026-06-28';
const CURRENT_PRIVACY_VERSION = '2026-06-28';

// Timestamps to embed in supabase signUp metadata; the handle_new_user trigger
// denormalizes these onto the profiles row.
function buildConsentMeta(now = new Date()) {
  const iso = now.toISOString();
  return { terms_accepted_at: iso, privacy_accepted_at: iso };
}

// The authoritative audit rows inserted into public.consents after signUp.
function consentRows(userId, now = new Date()) {
  const accepted_at = now.toISOString();
  return [
    { user_id: userId, kind: 'terms',   version: CURRENT_TERMS_VERSION,   accepted_at },
    { user_id: userId, kind: 'privacy', version: CURRENT_PRIVACY_VERSION, accepted_at },
  ];
}

module.exports = {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
  buildConsentMeta,
  consentRows,
};
```

Note: this file uses CommonJS `module.exports` to match `src/lib/search.js` / `src/lib/geo.js`, which are required by both the app (Metro handles CJS) and the `node:test` suite.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && node --test __tests__/legal.test.js`
Expected: PASS — 3 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/legal.js app/__tests__/legal.test.js
git commit -m "feat(app): add consent version + row-builder logic (legal.js)"
```

---

### Task 3: Wire consent into `AuthContext.signUp`

**Files:**
- Modify: `app/src/context/AuthContext.js:34-35` (the `signUp` definition) and the provider `value` if needed.

**Interfaces:**
- Consumes: `buildConsentMeta`, `consentRows` from `src/lib/legal.js`; `supabase` client.
- Produces: `signUp(email, password, fullName, role, accepted) => { data, error }`. When `accepted` is truthy, signUp embeds consent timestamps in `options.data` and, on a successful signUp that returns a user, inserts the two `consents` rows. A failed `consents` insert is logged but NOT returned as an error (per spec: profile-level timestamps already record consent; do not orphan the auth user).

- [ ] **Step 1: Update the import block**

In `app/src/context/AuthContext.js`, add under the existing `supabase` import (line 2):

```js
import { buildConsentMeta, consentRows } from '../lib/legal';
```

- [ ] **Step 2: Replace the `signUp` definition**

Replace lines 34-35:

```js
  const signUp = (email, password, fullName, role = 'sjåfør') =>
    supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } });
```

with:

```js
  const signUp = async (email, password, fullName, role = 'sjåfør', accepted = false) => {
    const data = { full_name: fullName, role };
    if (accepted) Object.assign(data, buildConsentMeta());

    const result = await supabase.auth.signUp({ email, password, options: { data } });

    // Write the authoritative consent audit rows under the new user's session.
    // Non-fatal: the profile-level timestamps (set by the handle_new_user
    // trigger) already record consent, so a failure here must not fail signup
    // and orphan the created auth user.
    if (accepted && result.data?.user && !result.error) {
      const { error: consentErr } = await supabase
        .from('consents')
        .insert(consentRows(result.data.user.id));
      if (consentErr) console.warn('consents insert failed:', consentErr.message);
    }

    return result;
  };
```

- [ ] **Step 3: Verify the file still parses / imports resolve**

Run: `cd app && node -e "require('./src/lib/legal.js'); console.log('legal ok')"`
Expected: prints `legal ok` (confirms the module Task 3 depends on loads; `AuthContext.js` itself imports React Native and can't run under bare node, so this checks the new dependency, not the RN module).

- [ ] **Step 4: Commit**

```bash
git add app/src/context/AuthContext.js
git commit -m "feat(app): signUp records terms/privacy consent (rows + metadata)"
```

---

### Task 4: Required consent checkbox on the register view of `AuthScreen.js`

**Files:**
- Modify: `app/src/screens/AuthScreen.js` — `submit()` (lines 65-82), the `signUp` call (line 74), the legal text block (lines 140-144), and add `consentChecked` state + a checkbox + a style.

**Interfaces:**
- Consumes: `signUp(email, password, fullName, role, accepted)` from Task 3.
- Produces: register flow blocked unless the consent box is checked; consent flag passed through to `signUp`.

- [ ] **Step 1: Add consent state**

After line 56 (`const [rememberMe, setRememberMe] = useState(true);`) add:

```js
  const [consentChecked, setConsentChecked] = useState(false);
```

- [ ] **Step 2: Gate registration on consent in `submit()`**

In `submit()`, after the existing register-name check (line 69):

```js
    if (mode === 'register' && !fullName) { setError('Fyll inn fullt navn.'); return; }
```

add:

```js
    if (mode === 'register' && !consentChecked) {
      setError('Du må godta vilkårene og personvernreglene for å opprette konto.');
      return;
    }
```

- [ ] **Step 3: Pass the consent flag to signUp**

Change line 74 from:

```js
      : await signUp(email, password, fullName, role);
```

to:

```js
      : await signUp(email, password, fullName, role, consentChecked);
```

- [ ] **Step 4: Render a checkbox on the register form**

In the form card, the legal text currently only renders on the landing view (lines 140-144). Add a consent row inside the register form, immediately before the submit button (before line 218 `<TouchableOpacity style={styles.submitBtn} ...>`), shown only in register mode:

```jsx
              {mode === 'register' && (
                <TouchableOpacity
                  style={styles.consentRow}
                  activeOpacity={0.7}
                  onPress={() => setConsentChecked(v => !v)}
                >
                  <View style={[styles.checkbox, consentChecked && styles.checkboxActive]}>
                    {consentChecked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.consentText}>
                    Jeg godtar <Text style={styles.legalLink}>vilkårene</Text> og{' '}
                    <Text style={styles.legalLink}>personvernreglene</Text>.
                  </Text>
                </TouchableOpacity>
              )}
```

This reuses the existing `checkbox`, `checkboxActive`, `checkmark`, and `legalLink` styles already defined in the stylesheet.

- [ ] **Step 5: Add the two new styles**

In the `StyleSheet.create` block, after the `rememberRow` style (around line 390), add:

```js
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14, paddingRight: 4 },
  consentText: { flex: 1, fontFamily: 'System', fontWeight: '500', fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 19 },
```

- [ ] **Step 6: Manual verification (no RN component test harness in repo)**

Run: `cd app && npm start` and in the app:
1. Go to "Opprett konto" (register).
2. Fill name/email/password, leave consent unticked, tap "Opprett konto" → expect the Norwegian consent error, no network call.
3. Tick consent, submit → expect normal signup (success or the existing email-confirmation message).
4. After signup, in Supabase Studio confirm: the new `profiles` row has `terms_accepted_at` + `privacy_accepted_at` set, AND two `consents` rows (kind `terms` + `privacy`) exist for that user.
5. Switch to login → confirm no consent checkbox appears and login is unaffected.

Expected: all five behave as described.

- [ ] **Step 7: Commit**

```bash
git add app/src/screens/AuthScreen.js
git commit -m "feat(app): require terms/privacy consent on register"
```

---

## Self-Review

**Spec coverage:**
- Consent audit table → Task 1 ✓
- Denormalized `terms_accepted_at`/`privacy_accepted_at` on profiles → Task 1 (columns) + Task 1 trigger ✓
- Forward-looking nullable columns (`vipps_sub`, `phone_verified_at`, `kyc_status`, `payout_account`) → Task 1 ✓
- Consent version constant + `legal.js` → Task 2 ✓
- `signUp` writes metadata + authoritative consent rows, non-fatal insert → Task 3 ✓
- Register-only required consent checkbox + Norwegian validation → Task 4 ✓
- Login untouched → Task 4 Step 6.5 verifies ✓
- Plates NOT added → confirmed absent from Task 1 ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; no "handle errors appropriately" hand-waving (the non-fatal consent path is spelled out).

**Type consistency:** `buildConsentMeta` / `consentRows` signatures match between Task 2 (definition) and Task 3 (use); `signUp(..., accepted)` matches between Task 3 (definition) and Task 4 (call); reused styles (`checkbox`, `checkboxActive`, `checkmark`, `legalLink`) exist in the current `AuthScreen.js` stylesheet.
