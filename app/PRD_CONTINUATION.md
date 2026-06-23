# MinPlass — Production Roadmap
### Continuation of PRD v0.1 · Systems & Product Architecture Review
**Status:** Draft v1.0  
**Owner:** Sindre Sørensen  
**Last updated:** 2026-05-12  
**Prerequisite:** Read PRD v0.1 first. This document picks up from M1 Alpha and maps every missing capability to a delivery phase.

---

## How to read this document

Each phase maps to a milestone in PRD v0.1 and adds the infrastructure, backend, and product work required to safely reach it. Items are ordered within each phase by risk — legal and financial blockers first, then operational, then product experience.

A **P0** item means the phase cannot ship without it.  
A **P1** item means it should ship with the phase but won't cause a launch block.  
A **P2** item is scheduled for that phase but can slip one phase if needed.

---

---

# PHASE 1 — Pre-Money Safety
### Target: M1 Alpha (internal dogfooding, 10 hosts / 30 drivers)
### Constraint: No real money changes hands yet, but the system must be safe enough to begin.

The goal of Phase 1 is not features. It is correctness. Every piece of infrastructure that would cause financial loss, legal exposure, or an unrecoverable data state if absent at launch must be resolved here.

---

## 1.1 Fix the Fee Discrepancy [P0]

**Problem:** PRD §6.4 states a 12% MinPlass commission. Migration `20260511000006` calculates 18%. The mobile app hardcodes `BOOKING_FEE_RATE = 0.18`. Three sources disagree.

**Required:**
- Create a `platform_config` table as the single source of truth:
```sql
CREATE TABLE platform_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO platform_config VALUES ('booking_fee_rate', '0.12', now());
```
- Update `calculate_reservation_total()` to read from this table.
- Remove `BOOKING_FEE_RATE` from the mobile app entirely. Fee must be calculated server-side only — a client-side constant is both wrong and a security risk (users can modify it).
- Decide: 12% or 18%? Document in PRD §6.4 and enforce in one place.

---

## 1.2 Real Payment Processing — Stripe Connect [P0]

**Problem:** `payment_status` is a text flag. No money actually moves. No host has a payment account.

**Architecture:**
- Integrate **Stripe Connect** (Express accounts for hosts — fastest onboarding, Stripe handles host KYC).
- Add to `profiles` table:
```sql
ALTER TABLE profiles ADD COLUMN
  stripe_account_id text,
  stripe_onboarding_complete boolean DEFAULT false,
  bank_account_last4 text;
```
- Payment flow:
  1. Driver books → app calls a Supabase Edge Function `create-payment-intent` → returns a `client_secret`
  2. App uses Stripe SDK to present Apple Pay / card sheet
  3. Stripe authorizes (holds funds) — does NOT capture yet
  4. On session start (or immediately for now) → Edge Function `capture-payment`
  5. On session complete → Edge Function `release-to-host` (transfers minus platform fee to host's Stripe account)
- The `payment_reference` column already exists in the schema — populate it with the Stripe `PaymentIntent.id`.

**Never:** touch raw card numbers. All card data stays in Stripe's vault.

---

## 1.3 Cancellation Policy Enforcement [P0]

**Problem:** PRD §6.3 defines a cancellation policy. Zero code enforces it. A user can cancel after arrival with no consequence.

**Required:** A `cancel_reservation` RPC:
```sql
CREATE OR REPLACE FUNCTION cancel_reservation(
  p_reservation_id uuid,
  p_cancelled_by uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_starts_at timestamptz;
  v_total numeric;
  v_refund_amount numeric;
  v_refund_type text;
BEGIN
  SELECT starts_at, total INTO v_starts_at, v_total
  FROM reservations WHERE id = p_reservation_id;

  IF now() < v_starts_at - interval '1 hour' THEN
    v_refund_amount := v_total;
    v_refund_type := 'full';
  ELSIF now() < v_starts_at THEN
    v_refund_amount := v_total * 0.5;
    v_refund_type := 'partial';
  ELSE
    v_refund_amount := 0;
    v_refund_type := 'none';
  END IF;

  UPDATE reservations
  SET status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = p_cancelled_by,
      refund_amount = v_refund_amount
  WHERE id = p_reservation_id;

  RETURN jsonb_build_object(
    'refund_type', v_refund_type,
    'refund_amount', v_refund_amount
  );
END;
$$;
```
- Add `cancelled_at`, `cancelled_by`, `refund_amount` columns to `reservations`.
- The Edge Function that calls this RPC must also trigger the Stripe refund via `stripe.refunds.create()`.

---

## 1.4 RLS Security Audit [P0]

Current policies expose PII to any authenticated user. Required fixes before any real user data exists:

| Table | Current | Fix |
|---|---|---|
| `profiles` | Full row readable by any authenticated user | Restrict to `id, full_name, avatar_url` for public. Own full profile only via separate policy. |
| `spots` | `owner_id` is publicly readable | Mask or restrict owner_id on public read policy |
| `reservations` | No column-level restriction | Hosts can see bookings on their spots but not the renter's `renter_id` directly — return only what the host needs |
| `reviews` | No UPDATE policy | Add: reviewer can update their own review within 48h of creation |

Apply principle of least privilege. Run a full RLS test suite before M2.

---

## 1.5 Schema Additions for Phase 1 [P1]

These columns are needed for Phase 1 flows but involve simple migrations:

```sql
-- Reservations
ALTER TABLE reservations ADD COLUMN
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES profiles,
  refund_amount numeric(10,2) DEFAULT 0,
  session_started_at timestamptz,
  session_ended_at timestamptz;

-- Spots
ALTER TABLE spots ADD COLUMN
  verification_status text DEFAULT 'pending'
    CHECK (verification_status IN ('pending','approved','rejected')),
  rejection_reason text;

-- Profiles
ALTER TABLE profiles ADD COLUMN
  phone text,
  phone_verified boolean DEFAULT false,
  bankid_verified boolean DEFAULT false,
  bankid_reference text,
  bankid_verified_at timestamptz,
  stripe_account_id text,
  stripe_onboarding_complete boolean DEFAULT false,
  expo_push_token text,
  device_fingerprint text;
```

---

## 1.6 Spot Goes Live Gate [P1]

Currently any user can create a spot and it's immediately active. Add a DB-level gate:

```sql
CREATE OR REPLACE FUNCTION enforce_host_verification()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT (SELECT bankid_verified FROM profiles WHERE id = NEW.owner_id) THEN
    RAISE EXCEPTION 'Host must complete BankID verification before listing a spot.';
  END IF;
  NEW.verification_status := 'pending';
  NEW.active := false;
  RETURN NEW;
END;
$$;

CREATE TRIGGER spot_verification_gate
BEFORE INSERT ON spots
FOR EACH ROW EXECUTE FUNCTION enforce_host_verification();
```

Spots only become `active = true` when an admin (or admin Edge Function) sets `verification_status = 'approved'`.

---

## 1.7 Advisory Lock on Concurrent Bookings [P1]

The current double-booking check has a race condition under concurrent load. Replace client-side booking with a server-side RPC:

```sql
CREATE OR REPLACE FUNCTION create_reservation(
  p_spot_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_payment_intent_id text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_spot_id::text));

  IF NOT check_spot_availability(p_spot_id, p_starts_at, p_ends_at) THEN
    RAISE EXCEPTION 'Spot is no longer available for this time window.';
  END IF;

  INSERT INTO reservations (spot_id, renter_id, starts_at, ends_at, ...)
  VALUES (p_spot_id, auth.uid(), p_starts_at, p_ends_at, ...)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
```

The mobile app calls `supabase.rpc('create_reservation', {...})` instead of `.from('reservations').insert()`.

---

---

# PHASE 2 — Launch-Ready
### Target: M2 Closed Beta → M3 Public Launch (100 hosts / 500 drivers, real payouts)
### Constraint: Real money moves. Real users. The platform must be operationally reliable.

Phase 2 builds the operational backbone — jobs that run without human intervention, notifications that actually send, and the minimum admin tooling to operate the marketplace.

---

## 2.1 Background Job Infrastructure [P0]

None of the following currently run automatically. Without them, money gets stuck and sessions never close.

Create these as Supabase **pg_cron** jobs:

```sql
-- Auto-complete sessions past their end time
SELECT cron.schedule(
  'auto-complete-reservations',
  '*/5 * * * *',
  $$
    UPDATE reservations
    SET status = 'completed', session_ended_at = now()
    WHERE status = 'confirmed'
      AND ends_at < now()
      AND session_ended_at IS NULL;
  $$
);

-- Expire pending reservations (payment never completed)
SELECT cron.schedule(
  'expire-pending-reservations',
  '*/15 * * * *',
  $$
    UPDATE reservations
    SET status = 'cancelled', cancelled_at = now()
    WHERE status = 'pending'
      AND created_at < now() - interval '30 minutes';
  $$
);

-- Friday payouts at 09:00 Oslo time
SELECT cron.schedule(
  'weekly-host-payouts',
  '0 9 * * 5',  -- Friday 09:00 UTC (adjust for Europe/Oslo +1/+2)
  $$ SELECT trigger_payout_batch(); $$
);

-- Booking reminders (calls Edge Function to send push)
SELECT cron.schedule(
  'booking-reminders',
  '*/10 * * * *',
  $$ SELECT trigger_booking_reminders(); $$
);
```

The `trigger_payout_batch()` and `trigger_booking_reminders()` are Edge Functions that handle the Stripe and Expo Push APIs respectively.

---

## 2.2 Earnings Ledger [P0]

The host dashboard shows hardcoded earnings. The payout system has nowhere to record what was paid out to whom.

```sql
CREATE TABLE earnings_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES profiles NOT NULL,
  reservation_id uuid REFERENCES reservations NOT NULL,
  gross_amount numeric(10,2) NOT NULL,
  platform_fee numeric(10,2) NOT NULL,
  vat_amount numeric(10,2) NOT NULL DEFAULT 0,
  net_payout numeric(10,2) NOT NULL,
  payout_batch_id uuid,
  paid_out_at timestamptz,
  stripe_transfer_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE payout_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processed_at timestamptz DEFAULT now(),
  total_hosts int,
  total_amount numeric(10,2),
  status text DEFAULT 'processing'
    CHECK (status IN ('processing','completed','failed'))
);
```

A row in `earnings_ledger` is created when a reservation completes. A row in `payout_batches` is created each Friday when the cron job fires. Hosts see their real earnings — not hardcoded bar charts.

---

## 2.3 Push Notification System [P0]

`VarslerScreen` toggles currently do nothing. Implement end-to-end:

**Frontend:**
- On login: `const token = await Notifications.getExpoPushTokenAsync()` then `supabase.from('profiles').update({ expo_push_token: token.data })`
- Request permissions on first booking (contextual, higher acceptance than on launch)

**Backend — notification_preferences table:**
```sql
CREATE TABLE notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles,
  booking_confirmed boolean DEFAULT true,
  booking_reminder boolean DEFAULT true,
  session_starting boolean DEFAULT true,
  host_new_booking boolean DEFAULT true,
  payout_sent boolean DEFAULT true,
  review_received boolean DEFAULT true,
  marketing boolean DEFAULT false,
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '07:00'
);
```

**Backend — send_push Edge Function:**
```typescript
const message = {
  to: expoToken,
  sound: 'default',
  title: 'MinPlass',
  body: messageBody,
  data: { screen: 'Reservasjonshistorikk', id: reservationId },
};
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  body: JSON.stringify(message),
});
```

**Notification events to implement in Phase 2:**

| Event | Trigger | Quiet hours? |
|---|---|---|
| Booking confirmed | `reservations` INSERT with status=confirmed | No |
| Starts in 10 min | pg_cron every 10 min | No |
| Payout sent | payout_batches status→completed | No |
| Host: new booking | `reservations` INSERT | Yes |
| Review received | `reviews` INSERT | Yes |

---

## 2.4 In-App Messaging (Reservation-Scoped) [P1]

Drivers can't contact hosts to say "gate code?" or "I can't find it." This causes booking failures and bad reviews.

```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations NOT NULL,
  sender_id uuid REFERENCES profiles NOT NULL,
  body text NOT NULL CHECK (char_length(body) <= 1000),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS: only renter and spot owner of that reservation can read/write
CREATE POLICY "reservation participants" ON messages
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      JOIN spots s ON s.id = r.spot_id
      WHERE r.id = reservation_id
        AND (r.renter_id = auth.uid() OR s.owner_id = auth.uid())
    )
  );
```

Messages are scoped to a reservation — neither party can message the other outside an active booking. Frontend: a chat view accessible from the Live Spot screen, with a Realtime subscription on `messages` filtered by `reservation_id`.

---

## 2.5 GDPR Minimum Compliance [P1]

Required before any member of the public signs up. Norwegian law (Personopplysningsloven + GDPR) mandates these.

**Schema additions:**
```sql
ALTER TABLE profiles ADD COLUMN
  gdpr_deletion_requested_at timestamptz,
  gdpr_deleted_at timestamptz,
  marketing_consent boolean DEFAULT false,
  marketing_consent_updated_at timestamptz,
  terms_accepted_at timestamptz,
  terms_version text;
```

**`gdpr_anonymize_user` function:**
When a user deletes their account, PII must be erased but financial records kept for 5 years (Norwegian regnskapsloven):
```sql
CREATE OR REPLACE FUNCTION gdpr_anonymize_user(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET
    full_name = '[Slettet bruker]',
    phone = null,
    avatar_url = null,
    bankid_reference = null,
    expo_push_token = null,
    gdpr_deleted_at = now()
  WHERE id = p_user_id;

  -- Reservations and earnings rows are kept for accounting
  -- but renter identity is obscured from host-facing queries
  UPDATE reservations SET renter_id = null
  WHERE renter_id = p_user_id
    AND ends_at < now() - interval '5 years';
END;
$$;
```

**Data export endpoint:** A Supabase Edge Function `gdpr-export` that returns all the user's reservations, reviews, saved spots, and profile data as a JSON download. Trigger from PersonvernScreen.

---

## 2.6 Phone Verification [P1]

Email alone allows mass fake accounts. Add SMS OTP via Supabase Auth (built-in) or Twilio:
- On signup: optional phone entry + OTP
- Required before first booking (driver) or listing (host)
- `profiles.phone_verified` set to `true` after OTP confirmed
- Gate on `create_reservation` RPC: `phone_verified = true` required

---

## 2.7 Spot Availability Calendar [P1]

Currently there's no way to see which time slots are booked on a given spot. Required for the "conflicts are pre-locked, never shown as bookable" requirement in PRD §5.2.

```sql
CREATE OR REPLACE FUNCTION get_spot_availability(
  p_spot_id uuid,
  p_date_from date,
  p_date_to date
) RETURNS TABLE(slot_start timestamptz, slot_end timestamptz, is_available boolean)
LANGUAGE sql STABLE AS $$
  -- Generate 15-minute slots and LEFT JOIN reservations
  -- Return false for any slot with an overlapping confirmed/pending reservation
  -- Also check spot_blackouts table
$$;
```

The LiveSpotScreen time picker uses this RPC to grey out unavailable windows before showing them to the user.

---

## 2.8 One-Off Blackouts [P2]

PRD §6.2 requirement — hosts need to block dates without deleting their listing.

```sql
CREATE TABLE spot_blackouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id uuid REFERENCES spots NOT NULL,
  blackout_start timestamptz NOT NULL,
  blackout_end timestamptz NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);
```

`check_spot_availability()` and `get_spot_availability()` must both query this table. RedigerPlassScreen gets a calendar picker for adding/removing blackout dates.

---

---

# PHASE 3 — Trust & Operations at Scale
### Target: M3 Public Launch → M4 Oslo Expansion
### Constraint: Unknown users. Real disputes. Fraud is now a real threat.

Phase 3 builds the internal tools and trust infrastructure needed to operate a public marketplace safely. You cannot run a two-sided marketplace with real money and anonymous users without this layer.

---

## 3.1 Admin Dashboard [P0]

There is currently no way for MinPlass staff to intervene in any situation. This must exist before public launch.

**Required capabilities (MVP admin):**
- User search by email / phone / name
- View any user's reservations, reviews, and linked spots
- Suspend / ban a user account (add `profiles.account_status: enum(active, suspended, banned)` — gate on all booking and listing flows)
- Approve / reject pending spot listings with a note
- Override a reservation status (e.g., mark disputed booking as refunded)
- View the fraud queue (flagged events from §3.3)
- View financial summary: daily GMV, platform fees, pending payouts

**Implementation:** A Next.js app (separate from the iOS app) that uses the Supabase service role key. Never expose the service role key to the mobile app.

---

## 3.2 Dispute Resolution System [P0]

When a host claims a driver didn't show up, or a driver claims the spot wasn't available, there is currently no mechanism to handle it.

```sql
CREATE TYPE dispute_status AS ENUM
  ('open','under_review','resolved_host','resolved_renter','escalated');

CREATE TABLE disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations UNIQUE NOT NULL,
  opened_by uuid REFERENCES profiles NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) <= 2000),
  evidence_urls text[],
  status dispute_status DEFAULT 'open',
  resolution_notes text,
  resolved_by uuid REFERENCES profiles,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Payout hold logic:** When a dispute is `open` or `under_review`, the host's `earnings_ledger` row for that reservation must have `paid_out_at = null` until the dispute resolves. The Friday payout job skips any ledger rows linked to open disputes.

**SLA:** 48h initial response, 14-day maximum resolution — tracked via `created_at` and admin dashboard alerting.

---

## 3.3 Fraud Detection — Account & Booking Signals [P1]

A `fraud_signals` table captures events for manual review:

```sql
CREATE TABLE fraud_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles,
  signal_type text NOT NULL,
  detail jsonb,
  reviewed boolean DEFAULT false,
  reviewed_by uuid REFERENCES profiles,
  created_at timestamptz DEFAULT now()
);
```

Triggers that insert fraud signals:

| Signal | Trigger condition |
|---|---|
| `new_account_large_booking` | Account < 24h old + booking total > 500 kr |
| `self_booking` | `renter_id = spot.owner_id` |
| `duplicate_device` | `device_fingerprint` already exists on another `user_id` |
| `duplicate_listing_location` | New spot within 10m of existing active spot from different owner |
| `rapid_review_swap` | Host reviews renter AND renter reviews host within 60 seconds of each other |
| `cancelled_review` | Review submitted for a cancelled reservation |

These are DB triggers and Edge Function webhooks. The admin dashboard surfaces the fraud queue.

---

## 3.4 Damage Claims System [P1]

PRD §6.5 mentions 1M kr damage cover. There is no mechanism to file or process a claim.

```sql
CREATE TYPE claim_status AS ENUM
  ('submitted','under_review','approved','rejected','paid');

CREATE TABLE damage_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations UNIQUE NOT NULL,
  reported_by uuid REFERENCES profiles NOT NULL,
  description text NOT NULL,
  photo_urls text[] NOT NULL,
  amount_claimed numeric(10,2),
  amount_approved numeric(10,2),
  status claim_status DEFAULT 'submitted',
  insurer_reference text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
```

Frontend: A "Rapporter skade" button visible on completed reservations in Reservasjonshistorikk, within 24h of session end only. Uploads photos to Supabase Storage `damage-claims/` bucket.

---

## 3.5 Vehicle Registry [P1]

PRD §6.1 requires driver vehicle and license plate storage. Currently absent from the schema entirely.

```sql
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles NOT NULL,
  plate_number text NOT NULL,
  make text,
  model text,
  color text,
  verified boolean DEFAULT false,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plate_number)
);
```

- Gate on `create_reservation`: user must have at least one vehicle on file.
- Plate number visible to host on their booking confirmation (read-only).
- Verification options: photo upload reviewed by admin, or future Statens Vegvesen API integration.

---

## 3.6 Review Integrity Constraints [P1]

Add to `reviews` table:

```sql
-- Only allow reviews on completed reservations
ALTER TABLE reviews ADD CONSTRAINT
  review_requires_completion CHECK (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE id = reservation_id AND status = 'completed'
    )
  );

-- Reviews expire if not submitted within 14 days of completion
ALTER TABLE reviews ADD COLUMN expires_at timestamptz
  GENERATED ALWAYS AS (created_at + interval '14 days') STORED;
```

Add an `is_flagged` column for admin moderation. Flag trigger: if a review is submitted within 30 seconds of the other party's review (mutual inflation signal from §3.3).

---

## 3.7 Rate Limiting at the Edge [P2]

The DB-level rate limit (10 bookings/hour) is a last resort. Production needs layered limits at the API gateway:

**Supabase Edge Function rate limiter using Upstash Redis:**
```typescript
const rateLimit = await redis.incr(`ratelimit:${userId}:booking`);
await redis.expire(`ratelimit:${userId}:booking`, 3600);
if (rateLimit > 10) {
  return new Response('Too many requests', { status: 429 });
}
```

Per-endpoint limits:
| Endpoint | Limit |
|---|---|
| `POST /auth/signup` | 3 req/min per IP |
| `POST /auth/token` (login) | 5 req/min per IP, lock 15 min after 5 failures |
| `rpc/create_reservation` | 3 req/min per user |
| `rpc/cancel_reservation` | 2 req/min per user |
| All other authenticated | 60 req/min per user |

---

---

# PHASE 4 — Scale Infrastructure
### Target: Oslo Expansion and beyond
### Constraint: Bergen patterns established. Volume is now unpredictable.

Phase 4 is about the system surviving 10x traffic and operating across multiple cities without manual intervention.

---

## 4.1 PostGIS Geospatial Search [P0 for Oslo]

The current map loads all active spots and filters client-side. At Oslo scale (10,000+ spots) this is unusable.

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Replace lat/lng columns with a geography point
ALTER TABLE spots ADD COLUMN location geography(Point, 4326);
UPDATE spots SET location = ST_MakePoint(lng, lat)::geography;

-- Spatial index
CREATE INDEX spots_location_idx ON spots USING GIST(location);

-- Geo search RPC
CREATE OR REPLACE FUNCTION find_spots_near(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision DEFAULT 2.0,
  p_limit int DEFAULT 50
) RETURNS SETOF spots LANGUAGE sql STABLE AS $$
  SELECT * FROM spots
  WHERE active = true
    AND verification_status = 'approved'
    AND ST_DWithin(
      location,
      ST_MakePoint(p_lng, p_lat)::geography,
      p_radius_km * 1000
    )
  ORDER BY ST_Distance(location, ST_MakePoint(p_lng, p_lat)::geography)
  LIMIT p_limit;
$$;
```

This replaces the `select('*').eq('active', true)` call in KartScreen with `rpc('find_spots_near', { lat, lng, radius_km: 2 })`.

---

## 4.2 Search Ranking Algorithm [P1]

Currently spots return ordered by `created_at DESC` — newest listing first. This actively hurts quality. Replace with a ranking expression:

```sql
ORDER BY
  (avg_rating * LEAST(review_count, 20) / 20.0) * 0.35   -- quality weight
  + (1.0 / GREATEST(distance_m, 1) * 1000) * 0.40         -- proximity weight
  + (CASE WHEN available_now THEN 1.0 ELSE 0.0 END) * 0.25 -- availability weight
DESC
```

Where `available_now` is derived from a sub-query against `reservations` for the current time window. This ranks a nearby, highly-rated, currently-available spot above a newly-listed distant one.

---

## 4.3 Surge Pricing [P1]

PRD §6.2 mentions "automatic surge windows." Architecture:

```sql
CREATE TABLE surge_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id uuid REFERENCES spots,          -- null = applies to all spots
  area text,                               -- or by Bergen neighborhood
  day_of_week int CHECK (day_of_week BETWEEN 0 AND 6),
  hour_from int CHECK (hour_from BETWEEN 0 AND 23),
  hour_to int CHECK (hour_to BETWEEN 0 AND 23),
  multiplier numeric(4,2) DEFAULT 1.0 CHECK (multiplier BETWEEN 1.0 AND 3.0),
  label text,                              -- e.g. "Rushtid", "Kamp på Brann Stadion"
  active boolean DEFAULT true
);
```

`calculate_reservation_total()` takes an optional `starts_at` parameter and applies any matching surge multiplier to the base price before calculating fees. The LiveSpotScreen shows a "Rushtid · 1.5×" chip when surge applies.

---

## 4.4 Tax Reporting — Skatteetaten [P1]

From 2023, Norwegian digital platforms are legally required to report host earnings to Skatteetaten annually for income exceeding NOK 10,000. This is not optional.

**Required:**
- A `tax_reports` table aggregating `earnings_ledger` per host per calendar year
- An annual pg_cron job (1st January 00:01) that generates report rows
- An admin export function producing the Skatteetaten XML/CSV format
- In-app: hosts see a "Skatterapport 2026" section in their profile showing their annual gross, net, and platform fees (this also reduces support tickets at tax time)

---

## 4.5 Monitoring & Alerting [P0 — should have been Phase 1]

The system has no visibility into what's happening in production. This is a critical gap.

**Required before Oslo launch:**

| Tool | Purpose |
|---|---|
| **Sentry** (React Native SDK) | Crash reporting, error tracking, user impact |
| **Supabase Dashboard** | Built-in query performance, API request logs |
| **Better Uptime / UptimeRobot** | Ping `/healthz` every 60s, alert if down |
| **pg_stat_statements** | Surface queries taking >100ms |
| **Custom metrics view** | Daily GMV, bookings/day, cancellation rate, dispute rate |

**Alert thresholds:**
- Payment failure rate > 1% → immediate PagerDuty
- Error rate > 0.5% → Slack alert
- DB CPU > 80% for 5 min → Slack alert
- Any `fraud_signals` with `signal_type = 'self_booking'` → immediate review

---

## 4.6 Database Connection Pooling [P1]

Supabase direct connections are limited. At Oslo scale, spikes will exhaust them.

- Switch all app connections from the direct URL (`db.xxx.supabase.co:5432`) to the **pooler URL** (`aws-0-eu-central-1.pooler.supabase.com:6543`) in transaction mode
- Edge Functions use direct connections only for operations that require them (long transactions, LISTEN/NOTIFY)
- Monitor `pg_stat_activity` — alert if active connections exceed 80% of limit

---

---

# CROSS-CUTTING CONCERNS (all phases)

## Security Standards to Apply Continuously

**Secrets management:**
- All secrets in Supabase Vault (`supabase secrets set KEY=value`), never in `.env` files committed to git
- Rotate Vipps webhook secret and Stripe signing secret quarterly and after any team member departure
- Never log secrets, tokens, or PII to console or Sentry

**Mobile security (apply from Phase 1):**
- Store auth tokens in `expo-secure-store`, never AsyncStorage
- All fee and business logic calculations performed server-side — never trust a value from the app
- Deep link parameters validated server-side before any action is taken
- No PII in Sentry breadcrumbs or logs

**PCI DSS posture:**
- MinPlass never stores, logs, or transmits raw card numbers — all card data handled by Stripe SDK on device
- Annual SAQ-A self-assessment once payment volume warrants it
- Quarterly review of who has access to the Stripe dashboard

---

# PHASED DELIVERY SUMMARY

| Phase | When | P0 items | Outcome |
|---|---|---|---|
| **1** | Pre-Alpha → Alpha | Fee fix, Stripe Connect, cancel RPC, RLS audit, booking RPC with advisory lock, spot gate | Safe to test with real money internally |
| **2** | Alpha → Closed Beta | pg_cron jobs, earnings ledger, push notifications, GDPR minimum, phone verification, availability calendar | Safe for 100 hosts / 500 drivers with real payouts |
| **3** | Closed Beta → Public Launch | Admin dashboard, dispute system, fraud signals, damage claims, vehicle registry | Safe for unknown public users |
| **4** | Public → Oslo | PostGIS, search ranking, surge pricing, tax reporting, monitoring | Safe at city scale |

---

*This document should be reviewed at the start of each phase. Items marked P2 in one phase that were not completed should automatically become P1 in the next phase.*

*Open questions from PRD v0.1 §10 that affect this roadmap: insurance partner (blocks damage claims in Phase 3), BankID provider selection (blocks Phase 1 spot gate), surge pricing owner (affects Phase 4 design).*
