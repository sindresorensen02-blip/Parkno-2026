# Parkno — Production Launch PRD (3-Week Plan)

**Status:** Approved for execution
**Owner:** Sindre Sørensen
**Created:** 2026-05-15
**Launch target:** **Friday 2026-06-05, 09:00 Europe/Oslo** (T+21 days)
**Companion doc:** `PRD.md` (native iOS app — *deferred, not in this launch*)

---

## 1. Why this PRD exists

`PRD.md` scopes the full native iOS marketplace. That is a multi-month build
(BankID, Stripe Connect payouts, insurance underwriting, conflict-safe
booking). **None of it can ship in 3 weeks.**

This PRD scopes what we *can* ship in 3 weeks and what is genuinely worth
launching now: a **production-grade public presence + a working liquidity
funnel**, operated as a **concierge MVP**. We capture host and driver demand,
verify and match the first transactions by hand, and prove Bergen unit
economics *before* committing native-app engineering. The interactive demo on
the landing page sells the eventual product; humans deliver it on day one.

This is a deliberate scope cut, not a downgrade. The launch goal is
**validated demand + the first 10 real paid parking transactions in Bergen**,
not a feature-complete app.

## 2. Launch definition

> **Parkno is "launched" when:** the production domain is live behind a
> CDN/WAF over HTTPS; a visitor in Bergen can register as a driver or
> pre-register a space as a host; submissions reliably reach the founder; and
> the concierge process can take a host from signup to a paid booking without
> any native app.

If those are true on 2026-06-05, we launched. Everything else is enhancement.

## 3. In scope (this launch)

| Area | What ships |
|---|---|
| **Marketing site** | `index.html` landing, production-hardened, real copy, SEO/OG, analytics, error reporting |
| **Driver waitlist** | `register.html` flow → verified lead captured to a real datastore + founder notification |
| **Host pre-registration** | Host intent form: address area, space type, photos-by-email prompt, availability, expected price |
| **Interactive demo** | The 4 phone screens (Welcome / LiveSpot / Host / **Rewards**) as the product sell — already built |
| **Concierge ops** | Documented manual playbook: verify → match → take payment (Vipps/manual invoice) → confirm → collect rating |
| **Trust surface** | Public pages: how it works, pricing/fee (12%), insurance statement, privacy, terms, contact, English summary |
| **Legal minimum** | Privacy policy + terms reviewed for Norwegian/GDPR; data-deletion contact path |
| **Ops instrumentation** | Uptime monitoring, form-submission alerting, conversion funnel analytics |

## 4. Explicitly out of scope (deferred to native build)

Native iOS/Android app · in-app booking engine · automated BankID ·
Stripe Connect / automated payouts · real-time map of live inventory ·
in-app messaging · automated insurance binding · surge pricing ·
self-serve listing publishing. **Server-authoritative booking and payments
do not exist in this launch — all money and matching is concierge-operated and
manually logged.**

## 5. Users & the day-one journey

| Persona | Day-one experience (concierge) |
|---|---|
| **Driver — Ellen** | Lands on site → submits driver registration → receives confirmation + "we'll match you" → founder matches her to a host spot over email/Vipps within SLA |
| **Host — Sondre** | Lands on site → host pre-registration → founder calls/emails to verify ID + address, collects photos, sets price → spot is "live" in the founder's concierge sheet |
| **Founder (ops)** | Runs the concierge playbook: a single source-of-truth sheet of hosts, drivers, matches, payments, payouts, ratings |

## 6. Functional requirements

### 6.1 Lead capture (P0)
- Driver and host forms submit to a **real, durable backend** (not a
  client-only stub). Acceptable for 3-week scope: a serverless function +
  managed store (e.g. Vercel/Cloudflare function → Airtable/Supabase/Sheets
  API) or a vetted form provider (Formspree/Basin) — chosen Day 1–2.
- Every submission triggers a founder notification (email + optional
  push/SMS) within 1 minute.
- Required fields — driver: name, phone, email, neighborhood, vehicle + plate,
  consent checkbox. Host: name, phone, email, space address/area, space type,
  availability pattern, expected hourly price, consent checkbox.
- Spam/abuse controls: honeypot + rate limit + (if needed) Turnstile/hCaptcha.
- Confirmation state shown to user; confirmation email sent.
- The existing BankID/Criipto stub stays a **clearly-labelled stub**; identity
  is verified manually in the concierge step for launch.

### 6.2 Production hardening (P0)
- HTTPS only; HSTS; security headers from `_headers`/`vercel.json` verified
  live.
- CDN/WAF in front with DDoS mitigation, bot filtering, rate controls
  (per `LAUNCH_SECURITY.md` P0).
- Replace browser-side Babel with the existing esbuild build so CSP can drop
  `unsafe-eval`; self-host or pin third-party scripts.
- `healthz.html` wired to uptime monitoring; alert on downtime.
- All asset references resolve (no 404s — verified post-rebrand).

### 6.3 Content & trust (P0)
- Final Norwegian Bokmål copy across landing + register + login; English
  summary link works.
- Pages/sections: how it works, pricing (12% fee, no listing fee), insurance
  statement (cover amount + "underwritten by partner — see terms"), privacy,
  terms, contact (`kontakt@parkno.no`).
- OG/Twitter cards, favicon, canonical, sitemap, robots, JSON-LD org —
  validated with real `parkno.no` URLs.

### 6.4 Analytics & funnel (P1)
- Privacy-preserving analytics (Plausible/Umami/GA4-consent-mode).
- Funnel events: `landing_view → register_start → register_submit →
  confirmed`; host vs driver split.
- Error reporting (Sentry or equivalent) on the bundled JS.

### 6.5 Concierge operations (P0 — process, not code)
- Written playbook: verification script, matching rules, payment method
  (Vipps business / manual invoice), payout method/cadence, rating collection,
  incident/escalation contact.
- Single ops datastore (the lead store doubles as CRM) with states:
  `new → contacted → verified → live(host)/matched(driver) → booked → paid →
  paid-out → rated`.
- Manual SLA: first response ≤ 4 working hours; host verify ≤ 24h;
  driver match attempt ≤ 24h.

## 7. Non-functional requirements

- **Performance:** landing LCP ≤ 2.5s on 4G mid-tier Android; bundle
  cache-busted; images responsive.
- **Accessibility:** keyboard-navigable forms, labelled inputs, visible focus,
  `prefers-reduced-motion` respected (Rewards screen already complies),
  contrast ≥ 4.5:1.
- **Localization:** Norwegian Bokmål primary, English summary; NOK, 24h time,
  comma decimals.
- **Privacy/GDPR:** explicit consent on forms; documented data deletion/export
  via contact; no logging of plate/precise location; data-processing note in
  privacy policy.
- **Resilience:** if the form backend is down, submissions must fail loudly to
  the user (no silent data loss) and ideally fall back to a `mailto:`.

## 8. Three-week plan

Today = Thu 2026-05-15. Launch = Fri 2026-06-05, 09:00.

### Week 1 — Foundations & de-risk (May 15–22)
**Goal: every launch-blocking unknown is decided and the funnel works end-to-end in staging.**
- Day 1–2: Pick + provision form backend, CDN/WAF, analytics, monitoring,
  error reporting. Register/confirm `parkno.no` DNS + TLS.
- Day 2–3: Build real driver + host submission (function + store +
  notification + confirmation email). Replace Babel with esbuild build in the
  deploy pipeline.
- Day 4–5: Spam controls, security headers verified live, CSP tightened
  (drop `unsafe-eval`). Wire `healthz` monitoring.
- Day 5: Draft concierge playbook + ops sheet schema.
- **Week 1 exit criteria:** a test driver and a test host submission travel
  from the staging site to the ops store and fire founder alerts; site scores
  green on headers/HTTPS scanners.

### Week 2 — Content, trust, polish (May 23–29)
**Goal: production-quality content and the concierge can actually operate.**
- Final copy (NO + EN summary), pricing/insurance/privacy/terms pages,
  SEO/OG/JSON-LD with real URLs.
- Legal review of privacy + terms (start Day 1 of week 2 — external
  dependency, longest pole).
- Accessibility + performance pass (Lighthouse ≥ 90 perf/a11y/SEO on landing).
- Concierge dry run: founder takes a friendly test host from signup →
  "verified/live", a test driver → matched → simulated Vipps payment →
  rating, using only the playbook.
- **Week 2 exit criteria:** legal sign-off received or risk explicitly
  accepted; concierge dry run completed without improvisation.

### Week 3 — Hardening, soft launch, go-live (May 30–Jun 5)
**Goal: launch with no P0 open and a real first transaction proven.**
- Mon–Tue: Bug bash, cross-browser/device, load sanity behind WAF, rollback
  rehearsal.
- Wed (**soft launch, Jun 3**): publish to production, invite a closed batch
  (founder-recruited Bergen hosts from Møhlenpris/Sentrum/Sandviken + their
  drivers). Monitor funnel + errors live. **Get the first real paid booking.**
- Thu: Fix soft-launch findings; freeze.
- **Fri 2026-06-05 09:00 — Public launch.** Remove gate, announce.
- **Week 3 exit criteria:** see §9.

## 9. Launch-gate checklist (all must be ✅ on Jun 5)

- [ ] HTTPS + HSTS + security headers live; site behind CDN/WAF with DDoS/bot
      controls.
- [ ] No `unsafe-eval`; JS served from esbuild build, not browser Babel.
- [ ] Driver + host forms persist to durable store + alert founder + send
      confirmation; failure is loud (no silent loss).
- [ ] Spam protection active; tested.
- [ ] Privacy + terms published and legally reviewed (or risk formally
      accepted in writing by owner).
- [ ] All pages/assets 200 (post-rebrand link check passes); OG/JSON-LD valid
      on `parkno.no`.
- [ ] Analytics funnel + error reporting + uptime monitoring all reporting.
- [ ] Concierge playbook complete; ops sheet live; SLAs defined.
- [ ] **≥ 1 real, paid, concierge-operated Bergen booking completed during
      soft launch.**
- [ ] Rollback rehearsed and documented.

## 10. Success metrics (first 30 days post-launch)

- **Demand:** ≥ 150 driver registrations and ≥ 25 host pre-registrations in
  Bergen.
- **Activation:** ≥ 10 hosts concierge-verified "live"; ≥ 10 completed paid
  bookings.
- **Funnel:** landing → register submit conversion ≥ 6%.
- **Trust:** zero unresolved safety incidents; first-response SLA met ≥ 90%.
- **Reliability:** uptime ≥ 99.9%; crash-free JS sessions ≥ 99.5%.
- **Signal for go/no-go on native build:** ≥ 70% of matched drivers say they'd
  book again (concierge-collected).

## 11. Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Legal review slips past launch | High | Start Day 1 of Week 2; pre-draft from templates; owner can accept documented risk to hold the date |
| No backend today → silent data loss on forms | High | Real store by end of Week 1; loud failure + `mailto:` fallback; tested in Week 1 exit |
| Liquidity cold-start (no hosts = no drivers) | High | Founder-led pre-recruitment of Bergen hosts *during* Weeks 1–2 so soft launch has supply |
| Concierge doesn't scale | Medium (accepted) | Intentional for launch; volume cap; native build is the scale answer |
| Insurance not bound | High | Launch copy states cover is via partner per terms; **do not advertise an unbound figure** — legal to confirm wording |
| 3-week date is aggressive | Medium | Scope is already cut to the funnel; §9 gate can slip launch by days, not scope creep |
| Demo mistaken for a working app | Medium | Clear "Kommer i appen / bli varslet" framing on every booking-style CTA (existing app-prompt pattern) |

## 12. Rollback

Static site behind CDN — rollback = redeploy previous build + purge cache
(< 5 min, rehearsed in Week 3). Form backend: feature-flag the endpoint to the
`mailto:` fallback if the store/notifier fails. No database migrations exist,
so rollback is non-destructive.

## 13. Open decisions (close by end of Week 1)

1. Form backend + store: serverless+Supabase vs Airtable vs Formspree — pick one.
2. Payment rail for concierge bookings: Vipps business vs manual invoice.
3. Host/CDN: confirm Vercel vs Cloudflare (affects which `_headers`/
   `vercel.json` path is authoritative).
4. Insurance wording sign-off owner + deadline.
5. Soft-launch invite list (named Bergen hosts) — owner to supply.

---

*Scope intentionally excludes the native app (`PRD.md`). This launch validates
demand and proves Bergen unit economics with a concierge MVP; native
engineering is gated on the §10 go/no-go signal.*
