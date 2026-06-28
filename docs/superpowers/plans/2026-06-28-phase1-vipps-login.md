# Phase 1 — Vipps Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Logg inn med Vipps" as a working full login method that creates/links a Supabase account, verifies the user's phone (`phone_verified_at`), and stores their Vipps identity (`vipps_sub`) — built stub-first against a mock Vipps.

**Architecture:** A Supabase edge function `vipps-login` brokers the Vipps OIDC flow server-side (holding the client secret + service-role key), doing auto-link-on-verified-email and minting a session. The app opens the Vipps authorize URL via `expo-web-browser`, posts the returned code to the function, and sets the returned session. The single swappable seam is `getVippsUserinfo(code)` (mock identity in stub mode).

**Tech Stack:** Supabase edge functions (Deno), `@supabase/supabase-js ^2` admin API, React Native / Expo 54, `expo-web-browser`, `node:test` for pure-JS logic.

## Global Constraints

- Provider is **Vipps**; stub-first — `getVippsUserinfo(code)` returns a fixed verified identity when `VIPPS_STUB === 'true'`; no live Vipps calls are required to build or test this phase.
- **Secrets server-only:** the Vipps client secret and the Supabase service-role key live ONLY in the `vipps-login` edge-function env. The app never holds them. `vippsConfig.js` (app) contains only public values + the `VIPPS_STUB` flag + the function URL.
- **Auto-link requires `email_verified === true`.** An unverified Vipps email NEVER links to an existing account.
- **`vipps_sub` is the durable identity key** — match it first on repeat logins; verified-email match is only the first-time link path.
- Phone from Vipps overwrites `profiles.phone` and stamps `phone_verified_at = now()`.
- Supabase session minting uses the v2 pattern: `admin.generateLink({ type: 'magiclink', email })` → `admin.verifyOtp`/token exchange to obtain `{ access_token, refresh_token }`. No direct "create session" admin call exists in v2.
- Norwegian UI copy, matching existing `setError` style.
- Edge function mirrors the structure of `app/supabase/functions/vipps-webhook/index.ts` (Deno.serve, service-role client, env via `Deno.env.get`).
- Builds on branch `phase0-consent` (Phase 0 not yet merged to main).

---

### Task 1: Add the `expo-web-browser` dependency

**Files:**
- Modify: `app/package.json`

**Interfaces:**
- Produces: `expo-web-browser` available for import in `src/lib/vippsAuth.js` (Task 4).

- [ ] **Step 1: Install the dependency**

Run: `cd app && npx expo install expo-web-browser`
(`expo install` picks the version compatible with Expo 54. If offline/unavailable, add `"expo-web-browser": "~14.0.0"` to `dependencies` in `app/package.json` manually and run `npm install`.)
Expected: `expo-web-browser` appears in `app/package.json` dependencies; `npm install` completes.

- [ ] **Step 2: Verify it resolves**

Run: `cd app && node -e "require.resolve('expo-web-browser'); console.log('resolved')"`
Expected: prints `resolved`.

- [ ] **Step 3: Commit**

```bash
git add app/package.json app/package-lock.json
git commit -m "build(app): add expo-web-browser for Vipps OIDC redirect"
```

---

### Task 2: `resolveAccount` + `getVippsUserinfo` stub — pure logic with tests

This task builds the testable core of the edge function as plain functions in a shared module the function imports, so the auto-link logic is unit-tested without a live Deno/Supabase runtime.

**Files:**
- Create: `app/supabase/functions/vipps-login/logic.js`
- Test: `app/supabase/functions/vipps-login/logic.test.js`

**Interfaces:**
- Produces:
  - `class VippsEmailUnverified extends Error` (name === `'VippsEmailUnverified'`).
  - `getVippsUserinfoStub() => { sub, phone_number, email, email_verified, name }` — the fixed stub identity.
  - `async resolveAccount(userinfo, db) => { userId, created }` where `db` is an injected adapter with:
    - `findProfileByVippsSub(sub) => userId | null`
    - `findAuthUserByEmail(email) => userId | null`
    - `createAuthUser(email, name) => userId`
    Logic: if `findProfileByVippsSub` hits → `{ userId, created:false }`. Else require `userinfo.email_verified === true` (throw `VippsEmailUnverified` if not). Then `findAuthUserByEmail`: hit → `{ userId, created:false }`; miss → `createAuthUser` → `{ userId, created:true }`.
- Consumed by: Task 3 (edge function wires real Supabase calls into the `db` adapter).

- [ ] **Step 1: Write the failing test**

Create `app/supabase/functions/vipps-login/logic.test.js`:

```js
// Run with: node --test app/supabase/functions/vipps-login/logic.test.js
const { strict: assert } = require('node:assert');
const { test } = require('node:test');

const {
  VippsEmailUnverified,
  getVippsUserinfoStub,
  resolveAccount,
} = require('./logic.js');

function makeDb(overrides = {}) {
  const calls = { created: [] };
  return {
    calls,
    findProfileByVippsSub: async () => null,
    findAuthUserByEmail: async () => null,
    createAuthUser: async (email, name) => { calls.created.push({ email, name }); return 'new-user'; },
    ...overrides,
  };
}

const VERIFIED = { sub: 'vipps-1', phone_number: '+4791234567', email: 'a@b.no', email_verified: true, name: 'Kari Nordmann' };

test('stub identity has the documented shape', () => {
  const u = getVippsUserinfoStub();
  for (const k of ['sub', 'phone_number', 'email', 'email_verified', 'name']) {
    assert.ok(k in u, `missing ${k}`);
  }
  assert.equal(u.email_verified, true);
});

test('existing vipps_sub short-circuits to that user', async () => {
  const db = makeDb({ findProfileByVippsSub: async () => 'linked-user' });
  const r = await resolveAccount(VERIFIED, db);
  assert.deepEqual(r, { userId: 'linked-user', created: false });
  assert.equal(db.calls.created.length, 0);
});

test('verified email matching an existing user links it', async () => {
  const db = makeDb({ findAuthUserByEmail: async () => 'email-user' });
  const r = await resolveAccount(VERIFIED, db);
  assert.deepEqual(r, { userId: 'email-user', created: false });
  assert.equal(db.calls.created.length, 0);
});

test('verified email with no match creates a user', async () => {
  const db = makeDb();
  const r = await resolveAccount(VERIFIED, db);
  assert.deepEqual(r, { userId: 'new-user', created: true });
  assert.deepEqual(db.calls.created, [{ email: 'a@b.no', name: 'Kari Nordmann' }]);
});

test('unverified email never links — throws VippsEmailUnverified', async () => {
  const db = makeDb();
  const unverified = { ...VERIFIED, email_verified: false };
  await assert.rejects(() => resolveAccount(unverified, db), (e) => e.name === 'VippsEmailUnverified');
  assert.equal(db.calls.created.length, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && node --test supabase/functions/vipps-login/logic.test.js`
Expected: FAIL — `Cannot find module './logic.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `app/supabase/functions/vipps-login/logic.js`:

```js
// Pure auth-resolution logic for the vipps-login edge function. Kept free of
// Deno/Supabase imports so it runs under node:test. The edge function injects a
// `db` adapter wrapping the real service-role Supabase calls.

class VippsEmailUnverified extends Error {
  constructor(message = 'Vipps email is not verified') {
    super(message);
    this.name = 'VippsEmailUnverified';
  }
}

// Fixed verified identity returned in stub mode (VIPPS_STUB === 'true').
function getVippsUserinfoStub() {
  return {
    sub: 'stub-vipps-sub-0001',
    phone_number: '+4791234567',
    email: 'stub.bruker@parkno.no',
    email_verified: true,
    name: 'Stub Bruker',
  };
}

// Resolve the userinfo to a Supabase auth user id, linking or creating as needed.
// db: { findProfileByVippsSub(sub), findAuthUserByEmail(email), createAuthUser(email, name) }
async function resolveAccount(userinfo, db) {
  const linked = await db.findProfileByVippsSub(userinfo.sub);
  if (linked) return { userId: linked, created: false };

  if (userinfo.email_verified !== true) {
    throw new VippsEmailUnverified();
  }

  const existing = await db.findAuthUserByEmail(userinfo.email);
  if (existing) return { userId: existing, created: false };

  const userId = await db.createAuthUser(userinfo.email, userinfo.name);
  return { userId, created: true };
}

module.exports = { VippsEmailUnverified, getVippsUserinfoStub, resolveAccount };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && node --test supabase/functions/vipps-login/logic.test.js`
Expected: PASS — 5 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add app/supabase/functions/vipps-login/logic.js app/supabase/functions/vipps-login/logic.test.js
git commit -m "feat(vipps): account-resolution logic + stub identity (tested)"
```

---

### Task 3: The `vipps-login` edge function

Wraps the Task 2 logic with real Supabase service-role calls, the stub/real userinfo seam, profile update, and session minting. Mirrors `vipps-webhook/index.ts`.

**Files:**
- Create: `app/supabase/functions/vipps-login/index.ts`

**Interfaces:**
- Consumes: `resolveAccount`, `getVippsUserinfoStub`, `VippsEmailUnverified` (from `./logic.js` — Deno imports the CJS module via `npm:`/relative; see note in Step 1).
- Produces: an HTTP endpoint accepting `POST { code }` and returning `200 { access_token, refresh_token }`, `401 { error: 'vipps_email_unverified' }`, or `500 { error }`.

- [ ] **Step 1: Write the edge function**

Create `app/supabase/functions/vipps-login/index.ts`:

```ts
// DEPLOY: supabase functions deploy vipps-login
//
// Brokers the Vipps OIDC login: exchanges the auth code for verified userinfo,
// resolves/creates the Supabase auth user (auto-link on verified email),
// updates the profile (vipps_sub, phone, phone_verified_at), and mints a
// session. All secrets (Vipps client secret, service-role key) stay here.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VippsEmailUnverified, getVippsUserinfoStub, resolveAccount } from './logic.js';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// STUB SEAM: in stub mode return the fixed identity; otherwise exchange the
// code with Vipps for real userinfo. Real branch is intentionally minimal —
// it is filled in at merchant-onboarding cutover.
async function getVippsUserinfo(code: string) {
  if (Deno.env.get('VIPPS_STUB') === 'true') {
    return getVippsUserinfoStub();
  }
  const tokenRes = await fetch(Deno.env.get('VIPPS_TOKEN_URL')!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: Deno.env.get('VIPPS_CLIENT_ID')!,
      client_secret: Deno.env.get('VIPPS_CLIENT_SECRET')!,
      redirect_uri: Deno.env.get('VIPPS_REDIRECT_URI')!,
    }),
  });
  if (!tokenRes.ok) throw new Error('vipps token exchange failed');
  const { access_token } = await tokenRes.json();
  const infoRes = await fetch(Deno.env.get('VIPPS_USERINFO_URL')!, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!infoRes.ok) throw new Error('vipps userinfo failed');
  return await infoRes.json();
}

// Adapter passed to resolveAccount: wraps real service-role queries.
function makeDb() {
  return {
    findProfileByVippsSub: async (sub: string) => {
      const { data } = await admin.from('profiles').select('id').eq('vipps_sub', sub).maybeSingle();
      return data?.id ?? null;
    },
    findAuthUserByEmail: async (email: string) => {
      // GoTrue admin: page through users and match email (v2 has no direct getByEmail).
      const { data } = await admin.auth.admin.listUsers();
      const u = data?.users?.find((x) => x.email?.toLowerCase() === email.toLowerCase());
      return u?.id ?? null;
    },
    createAuthUser: async (email: string, name: string) => {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name },
      });
      if (error) throw error;
      return data.user!.id;
    },
  };
}

// Mint a session for a resolved user via the v2 magic-link pattern: generate a
// magiclink, then verify its token hash to obtain access/refresh tokens.
async function issueSession(email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw error;
  const tokenHash = data.properties!.hashed_token;
  const { data: verified, error: vErr } = await admin.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  });
  if (vErr) throw vErr;
  return {
    access_token: verified.session!.access_token,
    refresh_token: verified.session!.refresh_token,
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  try {
    const { code } = await req.json();
    if (!code) return new Response(JSON.stringify({ error: 'missing code' }), { status: 400 });

    const userinfo = await getVippsUserinfo(code);
    const db = makeDb();
    const { userId } = await resolveAccount(userinfo, db);

    // Update profile: link identity + verify phone. Profile row exists via the
    // handle_new_user trigger when the user was just created.
    await admin.from('profiles').update({
      vipps_sub: userinfo.sub,
      phone: userinfo.phone_number,
      phone_verified_at: new Date().toISOString(),
    }).eq('id', userId);

    const session = await issueSession(userinfo.email);
    return new Response(JSON.stringify(session), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof VippsEmailUnverified) {
      return new Response(JSON.stringify({ error: 'vipps_email_unverified' }), { status: 401 });
    }
    console.error('vipps-login error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
```

Note on the import: Supabase edge runtime resolves a relative `./logic.js` (CommonJS `module.exports`) as a module; the named imports work because the runtime interops the default export. The same `logic.js` is what `node:test` exercises in Task 2.

- [ ] **Step 2: Static check the function file**

This file imports Deno/remote URLs and cannot run under node. Verify by inspection:
- `getVippsUserinfo` returns the stub when `VIPPS_STUB==='true'` and otherwise does token→userinfo.
- `resolveAccount` is called with the `makeDb()` adapter whose method names exactly match the adapter contract from Task 2 (`findProfileByVippsSub`, `findAuthUserByEmail`, `createAuthUser`).
- The catch block maps `VippsEmailUnverified` → 401 `vipps_email_unverified`, everything else → 500.
Run: `cd app && node -e "require('./supabase/functions/vipps-login/logic.js'); console.log('logic import ok')"`
Expected: `logic import ok` (confirms the shared module the function depends on loads; the .ts itself is Deno-only).

- [ ] **Step 3: Commit**

```bash
git add app/supabase/functions/vipps-login/index.ts
git commit -m "feat(vipps): vipps-login edge function (stub seam, auto-link, session mint)"
```

---

### Task 4: App-side `vippsConfig.js` + `vippsAuth.js`

**Files:**
- Create: `app/src/lib/vippsConfig.js`
- Create: `app/src/lib/vippsAuth.js`

**Interfaces:**
- Consumes: `expo-web-browser` (Task 1), `supabase` client (`../lib/supabase`).
- Produces: `async startVippsLogin() => { error?: string, cancelled?: boolean }` — runs the redirect, posts the code, sets the session on success.

- [ ] **Step 1: Create the config**

Create `app/src/lib/vippsConfig.js`:

```js
// Public Vipps Login config (NO secrets — client secret lives in the edge fn).
// Values are placeholders until the Vipps merchant account is live; the flow is
// exercised in stub mode where the code value is irrelevant.
export const VIPPS_STUB = true;

// The deployed vipps-login edge function URL.
export const LOGIN_FN_URL =
  `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/vipps-login`;

// OIDC authorize endpoint + app redirect target (real values at cutover).
export const CLIENT_ID = process.env.EXPO_PUBLIC_VIPPS_CLIENT_ID || 'stub-client-id';
export const AUTHORIZE_URL =
  process.env.EXPO_PUBLIC_VIPPS_AUTHORIZE_URL || 'https://stub.vipps/authorize';
export const REDIRECT_URI =
  process.env.EXPO_PUBLIC_VIPPS_REDIRECT_URI || 'parkno://vipps-callback';
```

- [ ] **Step 2: Create the auth helper**

Create `app/src/lib/vippsAuth.js`:

```js
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { VIPPS_STUB, LOGIN_FN_URL, CLIENT_ID, AUTHORIZE_URL, REDIRECT_URI } from './vippsConfig';

// Drive the Vipps OIDC redirect, exchange the code via the edge function, and
// set the resulting Supabase session. Returns { error } / { cancelled } / {}.
export async function startVippsLogin() {
  let code = 'stub-code';

  // In stub mode we skip the real browser round-trip — the edge function
  // ignores the code and returns the stub identity. In real mode we open Vipps.
  if (!VIPPS_STUB) {
    const authUrl =
      `${AUTHORIZE_URL}?client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&response_type=code&scope=openid%20name%20phoneNumber%20email` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
    if (result.type === 'cancel' || result.type === 'dismiss') return { cancelled: true };
    if (result.type !== 'success' || !result.url) return { error: 'Vipps-innlogging ble avbrutt.' };
    const returned = new URL(result.url).searchParams.get('code');
    if (!returned) return { error: 'Mangler kode fra Vipps.' };
    code = returned;
  }

  let res;
  try {
    res = await fetch(LOGIN_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ code }),
    });
  } catch {
    return { error: 'Kunne ikke nå Vipps-tjenesten. Prøv igjen.' };
  }

  if (res.status === 401) return { error: 'Kunne ikke verifisere Vipps-kontoen din.' };
  if (!res.ok) return { error: 'Kunne ikke logge inn med Vipps. Prøv igjen.' };

  const { access_token, refresh_token } = await res.json();
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return { error: 'Kunne ikke opprette økt. Prøv igjen.' };
  return {};
}
```

- [ ] **Step 3: Verify config module loads under node**

Run: `cd app && node -e "process.env.EXPO_PUBLIC_SUPABASE_URL='http://x'; const c=require('./src/lib/vippsConfig.js'); console.log(c.VIPPS_STUB, !!c.LOGIN_FN_URL)"`
Expected: prints `true true`. (vippsConfig is plain JS with no RN imports. `vippsAuth.js` imports expo-web-browser and is NOT node-runnable — do not run it.)

- [ ] **Step 4: Commit**

```bash
git add app/src/lib/vippsConfig.js app/src/lib/vippsAuth.js
git commit -m "feat(app): Vipps OIDC config + startVippsLogin helper (stub-aware)"
```

---

### Task 5: Wire the "Logg inn med Vipps" button into AuthScreen

**Files:**
- Modify: `app/src/screens/AuthScreen.js`

**Interfaces:**
- Consumes: `startVippsLogin` from `../lib/vippsAuth`.
- Produces: a Vipps button on the landing stack that runs the flow and surfaces errors; on success the existing `onAuthStateChange` in `AuthContext` picks up the new session and routes the user in (no extra navigation needed).

- [ ] **Step 1: Import the helper and add loading/error state**

Read `app/src/screens/AuthScreen.js` fully first (line numbers shift from earlier phases). Add near the top imports:

```js
import { startVippsLogin } from '../lib/vippsAuth';
```

Add state next to the existing `const [loading, setLoading] = useState(false);`:

```js
  const [vippsLoading, setVippsLoading] = useState(false);
```

- [ ] **Step 2: Add the handler**

Add inside the component, near the other handlers (e.g. after `openForm`):

```js
  const onVippsLogin = async () => {
    setError('');
    setVippsLoading(true);
    const { error: err, cancelled } = await startVippsLogin();
    setVippsLoading(false);
    if (cancelled) return;
    if (err) setError(err);
    // On success the AuthContext onAuthStateChange handles routing.
  };
```

- [ ] **Step 3: Add the button to the landing stack**

In the landing `stack` View, immediately ABOVE the existing BankID button (`styles.bankidBtn`), add:

```jsx
            <TouchableOpacity style={styles.vippsBtn} activeOpacity={0.85} onPress={onVippsLogin} disabled={vippsLoading}>
              {vippsLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.vippsText}>Logg inn med Vipps</Text>}
            </TouchableOpacity>
```

- [ ] **Step 4: Add the styles**

In the StyleSheet, near `bankidBtn`, add (Vipps brand orange `#FF5B24`):

```js
  vippsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 999, backgroundColor: '#FF5B24' },
  vippsText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.15 },
```

- [ ] **Step 5: Manual verification (no RN component harness)**

Run: `cd app && npm start`, then in the app:
1. On the landing screen, confirm the orange "Logg inn med Vipps" button appears above BankID.
2. (Requires the `vipps-login` function deployed with `VIPPS_STUB=true`, or a locally served function.) Tap it → expect to be logged in as the stub user; the profile shows phone `+4791234567` and a set `phone_verified_at`.
3. If the function isn't deployed yet, confirm tapping surfaces the Norwegian "Kunne ikke nå Vipps-tjenesten" error rather than crashing.

Expected: button renders; tapping drives the flow or fails gracefully in Norwegian.

- [ ] **Step 6: Commit**

```bash
git add app/src/screens/AuthScreen.js
git commit -m "feat(app): add Logg inn med Vipps button to auth landing"
```

---

## Self-Review

**Spec coverage:**
- Server-side broker edge function → Task 3 ✓
- `getVippsUserinfo` stub seam → Task 2 (stub) + Task 3 (seam) ✓
- `resolveAccount` auto-link, vipps_sub-first, verified-email gate, create-on-miss → Task 2 ✓
- Unverified email never links (`VippsEmailUnverified` → 401) → Task 2 test + Task 3 mapping ✓
- Profile update (vipps_sub, phone, phone_verified_at) → Task 3 ✓
- Session mint via v2 generateLink+verifyOtp → Task 3 `issueSession` ✓
- App config without secrets + redirect helper → Task 4 ✓
- Vipps button on landing, Norwegian errors, cancel handling → Task 4 + Task 5 ✓
- `expo-web-browser` dependency → Task 1 ✓
- Stub-first (VIPPS_STUB) end to end → Tasks 2,3,4 ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; the real-Vipps branch in Task 3 is complete (not a stub-comment), gated behind `VIPPS_STUB`.

**Type consistency:** The `db` adapter method names (`findProfileByVippsSub`, `findAuthUserByEmail`, `createAuthUser`) match between Task 2 (definition/tests) and Task 3 (`makeDb`). `resolveAccount(userinfo, db) => { userId, created }`, `getVippsUserinfoStub()` shape, and `startVippsLogin() => { error?, cancelled? }` are consistent across tasks 2→3 and 4→5. `VippsEmailUnverified.name === 'VippsEmailUnverified'` is asserted in Task 2 and switched on in Task 3.

**Known follow-up (not blocking this plan):** `findAuthUserByEmail` uses `listUsers()` (first page) — fine for stub/small scale, but at production scale needs pagination or a profiles-email lookup. Flagged for the final review / real-cutover.
