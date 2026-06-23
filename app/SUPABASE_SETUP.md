# MinPlass — Supabase Manual Setup Steps

These are the steps that cannot be done via SQL migrations. Complete them in order after running all migrations.

---

## 1. Run the migrations

Paste each file from `supabase/migrations/` into the Supabase **SQL Editor** in filename order:

1. `20260510000001_init.sql`
2. `20260511000001_add_roles_payments_reviews_saved.sql`
3. `20260511000002_storage_buckets.sql`
4. `20260511000003_double_booking_prevention.sql`
5. `20260511000004_performance_indexes.sql`
6. `20260511000005_spot_rating_denorm.sql`
7. `20260511000006_reservation_total_fn.sql`
8. `20260511000007_security_hardening.sql`
9. `20260511000008_realtime.sql`

---

## 2. Enable email confirmation

**Dashboard → Authentication → Providers → Email**
- Toggle **Confirm email** ON
- Users must verify their address before they can sign in

---

## 3. Verify storage buckets

**Dashboard → Storage**
- Confirm `avatars` and `spot-photos` buckets exist
- If they weren't created by the migration, create them manually:
  - `avatars`: Public, 2 MB limit
  - `spot-photos`: Public, 5 MB limit

---

## 4. Set the Vipps webhook secret

**Dashboard → Edge Functions → vipps-webhook → Secrets**
- Add secret: `VIPPS_WEBHOOK_SECRET` = (get this from your Vipps developer dashboard)

---

## 5. Deploy the Edge Function

Run from your project root:
```bash
supabase functions deploy vipps-webhook
```

Then in the Vipps developer portal, register the webhook URL:
```
https://<your-project-ref>.supabase.co/functions/v1/vipps-webhook
```

---

## 6. Enable Realtime FULL mode for reservations

**Dashboard → Database → Replication**
- Find the `reservations` table under `supabase_realtime`
- Set replication mode to **FULL** (required to receive both old and new row values in subscription events)

---

## 7. Apple Pay domain verification

Apple Pay requires a domain verification file served at:
```
https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association
```
Download this file from your Apple Developer account and serve it from your Vercel/web project. This is separate from the mobile app.

---

## 8. Environment variables for the app

Create `/MinPlass-IOS/.env` with:
```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Both values are in: **Dashboard → Settings → API**
