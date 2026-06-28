# Phase 1 — Vipps Login (verified phone + identity)

**Date:** 2026-06-28
**Status:** Approved design, pending spec review
**Provider stack:** Vipps (locked in Phase 0).
**Build depth:** Stub-first — the entire flow is built and testable against a mock Vipps that returns a fixed verified identity; real Vipps client credentials swap in when the merchant account is live.

## Context

parkno is a two-sided Norwegian parking marketplace on Supabase + React Native/Expo. Phase 0 (consent + profile schema) is done and live: `profiles` already has the stub columns `vipps_sub` and `phone_verified_at`. Today the `phone` field is free-text and unverified (set on `RedigerProfilScreen.js`); nothing populates `phone_verified_at` or `vipps_sub`.

This phase delivers the **🟡 Verified phone** field from the onboarding rollout — and because Vipps Login is BankID-backed, it also captures **verified identity** (`vipps_sub`) and the verified **phone** in one flow, pre-staging Phase 3 KYC.

## Decisions (locked during brainstorming)

1. **Vipps as a full login method** — a new user can create an account purely via Vipps; an existing user can also sign in with it. (Not merely a "link Vipps" action on an existing session.)
2. **Auto-link on matching verified email** — one person, one account. If Vipps returns a verified email matching an existing account, link and log into that account.
3. **Stub-first** — `getVippsUserinfo(code)` is the single swappable seam; everything else is real.

## Goals

1. Add "Logg inn med Vipps" to the auth landing as a working sign-in method.
2. On success: resolve/create the Supabase auth user, set `vipps_sub`, overwrite `phone`, stamp `phone_verified_at = now()`, and establish a Supabase session in the app.
3. Keep all secrets server-side; the app never holds the Vipps client secret or the service-role key.

## Non-Goals

- No Vipps **payments** (Phase 2/3).
- No KYC decision logic — we capture `vipps_sub` but do not set `kyc_status` in this phase.
- No removal/disabling of email/password or the (still non-functional) BankID button.
- No "unlink Vipps" management UI.

## Architecture — server-side broker

Vipps Login is OIDC; Supabase has no native Vipps provider and OIDC token exchange needs the Vipps **client secret**, so a thin app-side OAuth call is not viable. A Supabase **edge function** brokers the flow (same trust boundary as the existing `vipps-webhook`).

```
App: tap "Logg inn med Vipps"
  → open Vipps OIDC authorize URL (expo-web-browser) → user approves in Vipps
  → Vipps redirects to the app's redirect URI with an auth code
  → App POSTs { code } to edge function `vipps-login`
       ├─ getVippsUserinfo(code)  → { sub, phone_number, email, email_verified, name }
       │     (STUB seam: mock identity in stub mode; real token+userinfo exchange in prod)
       ├─ resolveAccount(userinfo) → userId
       │     ├─ match by vipps_sub               → existing linked user
       │     ├─ else if email_verified && email matches an auth user → link that user
       │     └─ else create a new auth user (admin API)
       ├─ update profile: vipps_sub, phone, phone_verified_at = now()
       └─ issueSession(userId) → { access_token, refresh_token }
  → App: supabase.auth.setSession(tokens) → logged in, phone verified
```

**Trust boundary:** client secret + service-role key live ONLY in `vipps-login` env vars. The app handles the redirect and the returned session, nothing else.

## Components

### App (React Native)
- **`AuthScreen.js`** — add a "Logg inn med Vipps" button on the landing stack (Vipps orange, Vipps logo), wired to `startVippsLogin()`. Email/BankID buttons unchanged.
- **`src/lib/vippsAuth.js`** (new) — `startVippsLogin()`:
  1. builds the authorize URL from `vippsConfig`,
  2. opens it via `expo-web-browser` `openAuthSessionAsync`,
  3. parses the returned `code`,
  4. POSTs `{ code }` to the `vipps-login` function URL,
  5. on success calls `supabase.auth.setSession({ access_token, refresh_token })`,
  6. returns `{ error }` on failure (cancel → `{ cancelled: true }`, no error).
- **`src/lib/vippsConfig.js`** (new) — `CLIENT_ID`, `AUTHORIZE_URL`, `REDIRECT_URI`, `LOGIN_FN_URL`, `VIPPS_STUB` (bool). No secrets.

### Server (Supabase edge function `vipps-login`)
Mirrors `vipps-webhook` structure (Deno, service-role client). Internal units:
- **`getVippsUserinfo(code)`** — STUB seam. `VIPPS_STUB === 'true'` → return a fixed verified identity. Else → POST code to Vipps token endpoint with client_id/secret, then GET userinfo. Returns `{ sub, phone_number, email, email_verified, name }`.
- **`resolveAccount(userinfo, supabaseAdmin)`** — returns `{ userId, created }`:
  - find profile by `vipps_sub = sub` → use it;
  - else if `email_verified === true`, look up an auth user with that email → link (will set `vipps_sub` in the profile step);
  - else if `email_verified === true` and no user → create auth user via admin API;
  - else (email NOT verified and no `vipps_sub` match) → throw `VippsEmailUnverified` (do NOT link).
- **`issueSession(userId, supabaseAdmin)`** — generate a session for the resolved user, return `{ access_token, refresh_token }`.
- Orchestration: after `resolveAccount`, update the profile (`vipps_sub`, `phone`, `phone_verified_at = now()`), then `issueSession`. Profile update happens only after the user is resolved/created.

## Data flow & the auto-link rule (security-critical)

- **Auto-link requires `email_verified === true`.** An unverified Vipps email never links to an existing account — prevents linking into an account whose email the Vipps user doesn't control.
- **`vipps_sub` is the durable key.** Second and later logins match by `vipps_sub` first (already-linked → straight in); verified-email match is only the first-time link path.
- **Phone** from Vipps overwrites the unverified free-text `phone` and stamps `phone_verified_at = now()`.

## Error handling

- User cancels in Vipps → app returns to landing quietly (`{ cancelled: true }`), no error UI.
- Token/userinfo exchange fails or Vipps down → Norwegian error on the auth screen: "Kunne ikke logge inn med Vipps. Prøv igjen." Email login remains available.
- Email collision but **unverified** (`VippsEmailUnverified`) → app shows "Kunne ikke verifisere Vipps-kontoen din." No silent merge.
- The edge function resolves/creates the auth user before touching the profile, so a profile-update failure cannot orphan a half-linked account; it returns a 500 and the app surfaces the generic Vipps error.

## Testing

Pure logic (Deno test / node:test style, mirroring `legal.js`):
- `resolveAccount`: (a) `vipps_sub` match short-circuits; (b) verified-email match links; (c) verified-email no-match creates; (d) **unverified email does NOT link and throws** `VippsEmailUnverified`.
- `getVippsUserinfo` stub returns the documented identity shape.

Edge-function wiring is exercised in stub mode (no live Vipps). App `vippsAuth.js` redirect handling is verified manually (RN + browser redirect; no component harness exists), as in Phase 0.

## Files Touched

- `app/supabase/functions/vipps-login/index.ts` (new)
- `app/src/lib/vippsAuth.js` (new)
- `app/src/lib/vippsConfig.js` (new)
- `app/src/screens/AuthScreen.js` (add the Vipps login button + handler wiring)
- Tests: `app/supabase/functions/vipps-login/resolveAccount.test.*` (or a `node:test` equivalent for the pure logic)

## Stub → real cutover (later)

When the Vipps merchant account is live: set the real `CLIENT_ID`/`AUTHORIZE_URL`/`REDIRECT_URI` in `vippsConfig`, set the edge-function env (`VIPPS_CLIENT_SECRET`, token/userinfo URLs), and flip `VIPPS_STUB=false`. No structural change — only `getVippsUserinfo` changes behavior.
