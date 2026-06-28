// Current policy versions. Bumping a version forces fresh consent capture on
// next signup; existing public.consents rows remain as history.
const CURRENT_TERMS_VERSION = '2026-06-28';
const CURRENT_PRIVACY_VERSION = '2026-06-28';

// Consent fields to embed in supabase signUp metadata. The handle_new_user
// trigger reads these to (a) denormalize the timestamps onto the profiles row
// and (b) insert the authoritative public.consents audit rows in the same
// transaction (security definer, so it works even before email confirmation
// when no client session exists yet). Versions travel in metadata so this
// module stays the single source of truth.
function buildConsentMeta(now = new Date()) {
  const iso = now.toISOString();
  return {
    terms_accepted_at: iso,
    privacy_accepted_at: iso,
    terms_version: CURRENT_TERMS_VERSION,
    privacy_version: CURRENT_PRIVACY_VERSION,
  };
}

module.exports = {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
  buildConsentMeta,
};
