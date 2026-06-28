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
