# Parkno iOS — Product Requirements Document

**Status:** Draft v0.1
**Owner:** Sindre Sørensen
**Last updated:** 2026-05-05

---

## 1. Summary

Parkno is a peer-to-peer parking marketplace launching in **Bergen** as its
first market. Private space owners ("hosts") list driveways, garages, and
reserved spots; drivers reserve them by the hour. The iOS app is the primary
surface for both sides — hosts manage listings and earnings, drivers find and
arrive at a spot. Oslo and other Norwegian cities are planned for later
phases; Bergen is the launch wedge because of dense central neighborhoods
(Sentrum, Møhlenpris, Sandviken), constrained street parking, and a
manageable supply pool to seed liquidity.

This document scopes the **iOS native app** (iPhone, iOS 17+). The marketing
landing page (`index.html`) and any web surfaces are out of scope here.

## 2. Goals & non-goals

**Goals**
- Let a host go from install to a live, earning listing in under 10 minutes.
- Let a driver find, book, and arrive at a verified spot with minimal friction.
- Make payouts feel automatic and trustworthy (NOK, every Friday).
- Match the AirGlass visual system already established in the design kit.

**Non-goals (v1)**
- Markets outside Bergen (Oslo and other cities are post-launch expansion).
- Monthly/long-term leases (hourly + daily only).
- EV charging billing (we surface EV availability; the host owns the charger).
- Android, web app, or commercial fleet tooling.

## 3. Target users

| Persona | Need | Primary jobs |
|---|---|---|
| **Host — Sondre, 34, Møhlenpris** | Passive income from his unused driveway | List space, set availability, get paid |
| **Driver — Ellen, 29, commuter** | Reliable parking near her destination in Bergen Sentrum | Find a verified spot, reserve a window, arrive without friction |

Verified drivers only. Hosts are verified before going live (ID + address).

## 4. Success metrics (v1, 6 months post-launch)

- **800+ verified drivers** in Bergen (right-sized for launch market; the
  2,400+ figure used in marketing copy is the all-Norway aspirational target).
- **Median time-to-first-booking** for a new host: ≤ 8 minutes.
- **Average host earnings:** 1,240 kr / week on active listings.
- **Average host rating:** ≥ 4.9 ★.
- **Booking completion rate:** ≥ 95% (driver actually arrives + pays).
- **Crash-free sessions:** ≥ 99.7%.

## 5. Core user flows

### 5.1 Host onboarding ("List your space")
1. Sign up with Apple / phone number.
2. Identity check: BankID (Norway).
3. Add space: 3 photos, address (autocomplete), space type (driveway / garage /
   reserved bay), facilities (covered, EV 11kW, lit & gated, camera).
4. Set default availability and hourly price (suggested by ML based on
   neighborhood + facilities).
5. Submit. Verification within 1 hour. Listing goes live.

### 5.2 Driver booking
1. Open app → map of available spots near current location or destination.
2. Tap a spot → view photos, facilities, host rating, price.
3. Pick arrival window (chips: e.g. 13:00, 14:30, 16:00, 18:00). Conflicts are
   pre-locked, never shown as bookable.
4. Confirm + pay (Apple Pay default, card fallback). Reservation confirmed.
5. **Live spot screen** when arriving (≤ 8 min away): immersive cityscape
   header, address as headline, host name, arrival window, facility chips,
   circular CTA to "look around" / open camera framing.

### 5.3 Host earnings & management
- Dashboard: earnings this week / month / year, weekly bar chart.
- Per-listing rows: status (Active / Paused), bookings count, hourly price.
- Friday 09:00: automatic payout to Norwegian bank account in NOK. Full ledger
  visible.
- Push notification on each new booking.

## 6. Functional requirements

### 6.1 Authentication & identity
- Sign in with Apple, phone OTP.
- BankID verification gating host activation and high-value driver bookings.
- Driver: vehicle + license plate stored, plate visible to host on each booking.

### 6.2 Listings
- 3–8 photos, captioned address, space type, dimensions (height, length).
- Facility tags: `covered`, `ev_11kw`, `lit_gated`, `camera`, plus extensible
  list.
- Availability: weekly recurring schedule + one-off blackouts.
- Pricing: hourly base + automatic surge windows (rush hour, event days);
  override per slot.

### 6.3 Booking
- Time-window reservation (15-minute granularity).
- Conflict prevention is server-authoritative — taken slots are filtered
  before they reach the client.
- Cancellation policy: free until 1h before arrival, 50% within 1h, no refund
  after start.

### 6.4 Payments & payouts
- Apple Pay primary, Visa / Mastercard fallback.
- 12% Parkno fee on completed bookings; no listing fee.
- Payouts: weekly, Friday 09:00 Europe/Oslo, NOK only, to Norwegian IBAN.
- Full transaction ledger exportable as CSV.

### 6.5 Trust & safety
- Driver, vehicle, plate verified before first booking.
- Damage cover up to **1,000,000 kr** per booking, underwritten by insurance
  partner (TBD).
- Two-way ratings after each completed booking.
- In-app reporting + 24h support response SLA.

### 6.6 Live spot (arrival) experience
- Triggers when driver is ≤ 8 minutes from the spot (geofence).
- Full-bleed location backdrop (street-level imagery for the address).
- Header: status pill ("Reserved · 8 min away"), Parkno mark, host avatar.
- Mid-screen: arrival-window chips (host-defined). Taken windows greyed +
  struck through.
- Facility chip rail (frosted dark pill).
- Bottom: address as h1, host name + window + duration + price, circular
  "look around" action that zooms the backdrop.

### 6.7 Notifications
- Booking confirmed, booking starting in 10 min, host: new booking, host:
  payout sent, host: new review.
- Quiet hours respected (22:00–07:00 default, configurable).

## 7. Non-functional requirements

- **Performance:** cold start ≤ 1.5s on iPhone 14; map interactions at 60fps.
- **Offline:** booking history and active reservation viewable offline; new
  bookings require connectivity.
- **Localization:** Norwegian Bokmål primary, English secondary. NOK,
  24h time, comma decimals (1 240,50 kr).
- **Accessibility:** Dynamic Type up to XXL, VoiceOver labels on all
  interactive elements, contrast ratio ≥ 4.5:1 for body text.
- **Privacy:** background location only when an active booking is in the
  arrival window. GDPR + Norwegian data protection compliance.

## 8. Design system

The app uses the **AirGlass** system already defined in `colors_and_type.css`
and the `kit/` components. Key tokens:

- Surface gradient: `#F7F8F6 → #EDEFEF → #DDEAF0`.
- Glass recipe: `rgba(255,255,255,0.55)` + `blur(22px) saturate(140%)` +
  1px white-70 border.
- Brand accent: `--premium-blue #5FAFD3`; success `--fresh-green #9FD6B4`;
  charcoal foreground `#111416`.
- Type: Inter (display + text), JetBrains Mono for tabular numerics.
- Radii: pills `999px`, cards `28px`, hero `34px`.

The three reference screens (`WelcomeScreen`, `LiveSpotScreen`, `HostScreen`)
in `kit/Screens.jsx` are the canonical specs for v1 surfaces.

## 9. Architecture (proposed)

- **Native client:** Swift + SwiftUI, iOS 17+.
- **Backend:** TBD (likely Node/TypeScript or Kotlin), Postgres, Redis for
  hot booking conflicts.
- **Maps:** MapKit (no third-party fee), with Mapbox as fallback if richer
  styling becomes a constraint.
- **Payments:** Stripe Connect (host payouts) + Apple Pay.
- **Identity:** BankID via Norwegian provider (Signicat or Criipto).
- **Push:** APNs.

## 10. Open questions

1. Insurance partner for the 1,000,000 kr damage cover — committed?
2. Surge pricing — algorithmic or host-set only in v1?
3. Do we surface license-plate scanning (camera-based arrival check) at v1
   or v1.1?
4. Multi-listing hosts — UX for managing 5+ spaces (search/filter)?
5. Is BankID required for drivers, or only hosts + high-value bookings?

## 11. Milestones (proposed)

| Phase | Scope | Target |
|---|---|---|
| **M0** Design lock | Final screens for host onboarding, listing detail, booking, live spot, host dashboard | +2 weeks |
| **M1** Alpha | Internal Bergen dogfooding, 10 hosts / 30 drivers in Sentrum + Møhlenpris | +6 weeks |
| **M2** Closed beta | 100 hosts / 500 drivers in Bergen, real payouts | +10 weeks |
| **M3** Public launch | App Store, Bergen only, marketing site live | +14 weeks |
| **M4** Oslo expansion | Second-market rollout once Bergen unit economics stabilize | +6 months post-M3 |

## 12. Risks

- **Liquidity cold-start.** Need a critical mass of hosts in Bergen Sentrum,
  Møhlenpris, Sandviken, and around Bergen Storsenter / Bryggen before drivers
  see useful inventory. Mitigation: founder-led host recruitment in those
  neighborhoods pre-launch, plus partnerships with downtown employers whose
  staff need predictable parking.
- **Regulatory.** Renting private parking may interact with municipal
  regulations on commercial use of residential property. Need legal review
  before public launch.
- **Trust.** A single bad incident (damage, theft) can dominate narrative.
  Insurance + strict verification are non-negotiable.

---

*Source design bundle: `Parkno landing.html`, `colors_and_type.css`,
`kit/Screens.jsx` (Welcome / LiveSpot / Host).*
