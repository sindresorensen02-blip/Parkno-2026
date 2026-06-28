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
