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
