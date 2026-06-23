# Parkno iOS — Release PRD (App Store Public Launch)

**Status:** Draft v1.0 — release readiness
**Owner:** Sindre Sørensen
**Created:** 2026-06-19
**Target:** **Public App Store launch (Norway), Bergen-only inventory**
**Proposed launch date:** **Fri 2026-08-22** — *gated on §7; date moves before scope does*
**Supersedes:** the launch framing in `PRD-PRODUCTION.md` (concierge web funnel, target
2026-06-05 — now past). Vision/`PRD.md` and `MinPlass-IOS/PRD_CONTINUATION.md`
remain the long-range product and backend references. This document scopes **only
what it takes to put the native Parkno iOS app live on the App Store** for real,
paying users.

---

## 1. Summary

Parkno is a peer-to-peer parking marketplace for **Bergen**. The native iOS app
(Expo / React Native, in `MinPlass-IOS/`) is the launch surface for both sides:
hosts list private spaces, drivers find and book them by the hour.

The app is **UX-complete and demo-functional today** — ~25 screens, brand system,
map, geofenced arrival alerts, booking flow, wallet, reviews, host dashboard, a
Premium paywall, and a substantial Supabase schema. What it is **not** yet is
**transactional**: no real money moves, no host gets paid, and identity is
email-only. This PRD defines the gap between "great demo" and "a public app that
safely takes and moves money," and the path to close it.

This is an honest scope: a direct public launch means real strangers paying real
NOK and real hosts receiving payouts. The bar is correctness of the money and
trust layers, not more screens.

## 2. Current state — what is real vs. what is mocked

This is the most important section. Build the launch from the truth, not the demo.

### ✅ Built and real
- **Front end:** ~25 screens, Parkno brand (`app.json` name `Parkno`, slug `parkno`),
  three-tab navigation, error boundary, glass/AirGlass design system.
- **Auth:** Supabase email/password sign-up + sign-in (`AuthContext`). Email
  confirmation toggle documented. `skipLogin` dev bypass is `__DEV__`-gated, so it
  does **not** ship in a production build (verify in release build anyway).
- **Spots & booking UI:** map (`KartScreen`), live spot (`LiveSpotScreen`),
  booking summary + confirm, active-parking screen, reservation history.
- **Reservations:** real rows inserted into Supabase `reservations` for real
  (UUID) spots; double-booking prevention + conflict-hardening migrations exist.
- **Wallet (saldo):** the **only real value transfer** — `spend_balance` /
  `redeem_gift_card` RPCs move balance server-side with non-negative enforcement.
- **Geofencing:** background location + proximity push via `expo-notifications`.
- **Schema:** 15+ migrations — profiles, spots, reservations, reviews, saved,
  notification prefs, support, spot moderation, wallet + gift cards.
- **Vipps webhook + booking-email Edge Functions** exist as scaffolding.

### ⚠️ Mocked, placeholder, or missing — **these block a paid public launch**
- **Payments are not real.** In `BetalingPaakrevdScreen`, Vipps / card / Klarna
  all hit `// still mock the charge for now` — a `setTimeout`, then a reservation
  written with `payment_status: 'pending'`. **No charge occurs.** Shipping a
  "Betal med Vipps" button that doesn't charge is both inoperable and an App Store
  rejection (misleading UI).
- **Host payouts do not exist.** No earnings ledger, no payout batch, no transfer
  rail. Hosts cannot be paid.
- **Premium is fake.** `PremiumContext` is an in-memory `useState(false)` toggle;
  `premium.js` pricing is explicitly placeholder; no StoreKit / IAP / RevenueCat.
- **Booking fee is wrong and client-side.** `constants/booking.js` hardcodes
  `BOOKING_FEE_RATE = 0.18`; the vision PRD says **12%**. A client-side fee is
  editable by users and disagrees with the marketing number. Must be one
  server-authoritative value.
- **No identity verification.** Email/password only — no BankID, no phone OTP, no
  plate/vehicle capture gating bookings. Hosts receiving money are unverified.
- **No crash/error reporting** (no Sentry). The `ErrorBoundary` renders the raw
  error message + stack to the end user — unacceptable in production.
- **No analytics** — `trackPremiumEvent` and the funnel events are stubs.
- **Demo inventory** — `BERGEN_SPOTS` demo spots (`p01`…) must never appear as
  bookable inventory in a production build.
- **Bundle identifier mismatch** — `eu.minplass.app` under a `Parkno` brand. This
  is permanent once shipped; decide now (§13).

## 3. Launch definition

> **Parkno is "launched" when:** the Parkno iOS app is live on the Norwegian App
> Store; a verified driver in Bergen can find a spot, book a real time window, and
> **pay real money** that the system captures; the host is a **verified** account
> who can **receive a real payout**; cancellation/refund works; and there is no
> mocked money path, no demo inventory, and no fake Premium anywhere in the
> shipped build.

If those hold on launch day, we launched. Everything in `PRD_CONTINUATION.md`
beyond this (disputes UI, fraud queue, admin console depth, surge, PostGIS,
Oslo) is post-launch.

## 4. In scope (this launch)

| Area | What ships |
|---|---|
| **Real payment capture** | Vipps (primary, NO market fit) + card via one PSP; authorize→capture; remove all mocks |
| **Host payouts** | Earnings ledger + a real payout rail (Vipps payout / PSP connected accounts); weekly NOK payout |
| **Server-authoritative fee** | Single source of truth (12% decided), computed server-side; client constant deleted |
| **Identity & trust** | Host verification before listing/payout; driver phone verification + vehicle/plate before first booking |
| **Premium done right** | Either ship real StoreKit IAP, or **cut Premium from v1** (recommended — see §13) |
| **Production safety** | Sentry crash/error reporting; production-safe error screen; remove demo inventory; release-build audit |
| **App Store compliance** | Account deletion in-app, privacy labels + policy URL, support URL, screenshots, review notes/demo account |
| **Legal minimum** | Privacy policy + terms (NO/GDPR), insurance wording, data deletion/export path |
| **Ops visibility** | Uptime on healthz + Supabase, payment-failure alerting, basic funnel analytics |

## 5. Explicitly out of scope (post-launch / `PRD_CONTINUATION.md`)

In-app messaging · disputes UI + fraud queue · damage-claims flow · full admin
console · surge pricing · PostGIS geo-search · search ranking · Skatteetaten tax
reporting · Android · Oslo. Manual/founder-operated fallbacks are acceptable for
the lowest-frequency events (disputes, damage) at launch volume, **documented as
an ops runbook**, not built as UI.

## 6. Functional requirements

### 6.1 Payments [P0]
- Replace the mocked `pay()` path. Real flow: app requests an intent from a
  Supabase Edge Function → PSP authorizes → capture on confirm (or at session
  start) → reservation marked `paid` only on confirmed capture.
- **Vipps** is the primary rail (dominant in Norway); one card fallback. Drop
  Klarna for v1 unless its flow is genuinely wired.
- The wallet (`saldo`) path already works and stays; `redeem`/`spend`/`refund`
  remain server-enforced.
- Payment failure must be loud and safe: no reservation is confirmed without a
  captured (or wallet-debited) payment; failed payments roll back cleanly (the
  wallet refund pattern in `BetalingPaakrevdScreen` is the model).

### 6.2 Fee — single source of truth [P0]
- Decide **12% vs 18%** (§13) and store it in a server-side config (e.g.
  `platform_config` per `PRD_CONTINUATION.md §1.1`).
- Delete `BOOKING_FEE_RATE` from the client. Fee and total are computed
  server-side (`calculate_reservation_total()`); the app only displays them.

### 6.3 Host payouts [P0]
- Earnings ledger row per completed reservation (gross, platform fee, VAT,
  net). Payout batch on a weekly cadence (Friday 09:00 Europe/Oslo).
- A real payout rail to a Norwegian account. Reconciliation visible to the host
  on the existing earnings dashboard (replace the hardcoded bar chart with real
  data).

### 6.4 Identity & trust [P0]
- **Host:** must be verified before a listing goes live or any payout is sent.
  BankID is the long-term answer; for launch a **manual concierge verification**
  (ID + bank account, founder-operated) is acceptable **if** a DB gate enforces
  `active = false` until approved (`PRD_CONTINUATION.md §1.6`).
- **Driver:** phone (SMS OTP) verification + at least one vehicle/plate on file
  before first booking. Plate visible to the host on the booking.
- Demo inventory removed; only verified, real spots are bookable in production.

### 6.5 Cancellation & refunds [P0]
- Enforce the policy server-side (`cancel_reservation` RPC, `PRD_CONTINUATION.md
  §1.3`): full refund > 1h before start, 50% within 1h, none after start. The
  refund must actually move money back (PSP refund or wallet credit).

### 6.6 Premium [P0 decision]
- **Recommended: cut Premium from v1.** It is fake today, and a digital
  feature-unlock sold outside Apple IAP is an App Store 3.1.1 risk. Ship the
  fee-waiver value later as real StoreKit IAP. If kept, it **must** be real
  StoreKit IAP with the placeholder pricing replaced and the in-memory toggle
  removed.

### 6.7 Notifications [P1]
- The proximity/arrival push works. Wire booking-confirmed and host-new-booking
  pushes to real events; respect quiet hours (prefs table exists). Toggles in
  `VarslerScreen` must actually gate sends.

### 6.8 Account deletion & privacy [P0 — App Store mandatory]
- In-app account deletion (Apple Guideline 5.1.1(v)) from `PersonvernScreen`:
  delete/anonymize PII, retain financial records per Norwegian regnskapsloven.
- Data export path (can be founder-operated at launch if documented).

## 7. Launch-gate checklist (all ✅ before submission)

**Money**
- [ ] No mocked payment path anywhere in the release build; real capture works end-to-end.
- [ ] Booking fee is server-authoritative; client constant deleted; value matches marketing copy.
- [ ] Host payout proven: at least one real test payout reaches a real account.
- [ ] Cancellation issues a real refund (PSP or wallet) per policy.

**Trust & identity**
- [ ] Host verification gate enforced at the DB; unverified hosts cannot list or be paid.
- [ ] Driver phone + vehicle/plate required before first booking.
- [ ] No demo/`BERGEN_SPOTS` inventory in the production build.

**Production safety**
- [ ] Sentry (or equivalent) capturing crashes + JS errors; production error screen replaces the raw-stack `ErrorBoundary`.
- [ ] `skipLogin`/dev bypass confirmed absent from the release build.
- [ ] Uptime + payment-failure alerting live; basic funnel analytics reporting.

**App Store**
- [ ] In-app account deletion works.
- [ ] Privacy policy URL + support URL live; privacy "nutrition labels" completed honestly (location, payments, contact).
- [ ] Premium decision resolved (cut, or real IAP) — no non-IAP digital unlock.
- [ ] Screenshots, app description (NO + EN), demo reviewer account + review notes prepared.
- [ ] Bundle identifier decision locked (§13); EAS production build + TestFlight internal QA pass green.

**Legal**
- [ ] Privacy + terms reviewed for GDPR/Norwegian law (or risk accepted in writing by owner).
- [ ] Insurance wording does not advertise an unbound figure.

## 8. Non-functional requirements

- **Performance:** cold start ≤ 2.5s on iPhone 12; map at 60fps; no jank on the booking flow.
- **Reliability:** crash-free sessions ≥ 99.5%; payment success rate tracked, alert > 1% failure.
- **Accessibility:** Dynamic Type, VoiceOver labels on interactive elements, contrast ≥ 4.5:1, `prefers-reduced-motion` honored.
- **Localization:** Norwegian Bokmål primary (already the app's language), English where Apple requires; NOK, 24h, comma decimals.
- **Privacy:** background location only during an active booking's arrival window; no logging of plate/precise location; secrets server-side only (service-role key never in the app).
- **Security:** all fee/payment math server-side; auth tokens in `expo-secure-store`; RLS audit before public data exists (`PRD_CONTINUATION.md §1.4`).

## 9. Release plan

Today = Fri 2026-06-19. Target submission build ~2 weeks before launch to absorb
App Store review. TestFlight is used for internal QA only — the **goal is public
launch**, not a public beta.

| Phase | Window | Goal |
|---|---|---|
| **W1–2** Money layer | Jun 23 – Jul 4 | Real payment capture (Vipps + card), server-side fee, wallet untouched. Mocks deleted. |
| **W3** Payouts & cancel | Jul 7 – Jul 11 | Earnings ledger + payout rail; real refund on cancellation. |
| **W4** Trust & identity | Jul 14 – Jul 18 | Host verification gate, driver phone+plate, demo inventory removed. |
| **W5** Production safety | Jul 21 – Jul 25 | Sentry, production error screen, analytics, alerting; Premium cut or real IAP. |
| **W6** Compliance & legal | Jul 28 – Aug 1 | Account deletion, privacy labels/policy/terms, insurance wording, store assets. |
| **W7** Harden & submit | Aug 4 – Aug 8 | EAS prod build, TestFlight internal QA, bug bash, **submit for review**. |
| **W8** Review & launch | Aug 11 – Aug 22 | Address review feedback; **public launch Fri 2026-08-22**. |

## 10. Success metrics (first 30 days post-launch)

- **Activation:** ≥ 10 verified hosts live; ≥ 10 completed, **paid** bookings in Bergen.
- **Money correctness:** zero payment/payout reconciliation errors; ≥ 1 clean weekly payout cycle.
- **Reliability:** crash-free sessions ≥ 99.5%; payment success ≥ 98%; App Store rating ≥ 4.5.
- **Funnel:** install → first booking ≥ 8% for users who reach the map.
- **Trust:** zero unresolved safety incidents; refund/cancellation works as specified.

## 11. Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Shipping mocked payments | Critical | §7 gate blocks submission until real capture proven end-to-end |
| App Store rejection (Premium non-IAP / misleading payment UI) | High | Cut Premium from v1; ensure every payment button charges; prepare review notes + demo account |
| Host payout rail underestimated | High | Lock the rail in W1 (decision in §13); a manual/concierge payout for the first cycle is an acceptable bridge if logged |
| Identity/fraud with unverified hosts taking money | High | DB-enforced host verification gate + manual review at launch volume |
| Liquidity cold-start (no supply) | High | Founder-recruited Bergen hosts during W1–6 so launch has real inventory |
| Insurance not bound | High | Copy states cover is via partner per terms; never advertise an unbound figure |
| 8-week date slips | Medium | §7 gate slips the **date**, never the money/trust scope |

## 12. Rollback

- **App:** App Store has no instant rollback. Mitigate with TestFlight internal QA
  (§9 W7), a staged/phased release in App Store Connect, and a feature flag (remote
  config) to disable booking/payment server-side if a money bug appears post-launch.
- **Backend:** Supabase migrations are forward-only; keep each release's migrations
  reversible where feasible and rehearse a `kill-switch` flag that puts the app in
  read-only "midlertidig utilgjengelig" mode without a store update.

## 13. Open decisions (close before W1 ends)

1. **Payment + payout rail:** Vipps ePayment + Vipps payouts vs a PSP (Stripe/Adyen)
   with connected accounts. This is the single biggest unknown — decide first.
2. **Fee rate:** 12% (vision PRD / marketing) vs 18% (current code). Pick one; it
   becomes the server config value and the public number.
3. **Premium in v1:** cut (recommended) vs ship real StoreKit IAP.
4. **Host verification for launch:** manual concierge vs BankID (Criipto/Signicat)
   from day one.
5. **Bundle identifier:** keep `eu.minplass.app` or migrate to `app.parkno.*`
   before first submission (cannot change after launch).
6. **Insurance wording sign-off** owner + deadline.

---

*Source of truth for current state: the `MinPlass-IOS/` Expo app (App.js, AuthContext,
PremiumContext, BalanceContext, BetalingPaakrevdScreen, constants/booking.js,
constants/premium.js) and the `supabase/migrations/`. Long-range product and backend
detail: `PRD.md` and `MinPlass-IOS/PRD_CONTINUATION.md`.*
