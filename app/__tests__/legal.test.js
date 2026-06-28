// Run with: npm test  (or: node --test __tests__/legal.test.js)
const { strict: assert } = require('node:assert');
const { test } = require('node:test');

const {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
  buildConsentMeta,
  consentRows,
} = require('../src/lib/legal.js');

test('versions are date-form strings', () => {
  assert.match(CURRENT_TERMS_VERSION, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(CURRENT_PRIVACY_VERSION, /^\d{4}-\d{2}-\d{2}$/);
});

test('buildConsentMeta returns ISO timestamps for both policies', () => {
  const now = new Date('2026-06-28T10:00:00.000Z');
  const meta = buildConsentMeta(now);
  assert.equal(meta.terms_accepted_at, '2026-06-28T10:00:00.000Z');
  assert.equal(meta.privacy_accepted_at, '2026-06-28T10:00:00.000Z');
});

test('buildConsentMeta carries policy versions for the trigger', () => {
  const meta = buildConsentMeta(new Date('2026-06-28T10:00:00.000Z'));
  assert.equal(meta.terms_version, CURRENT_TERMS_VERSION);
  assert.equal(meta.privacy_version, CURRENT_PRIVACY_VERSION);
});

test('consentRows produces one terms + one privacy row for the user', () => {
  const now = new Date('2026-06-28T10:00:00.000Z');
  const rows = consentRows('user-123', now);
  assert.equal(rows.length, 2);

  const terms = rows.find(r => r.kind === 'terms');
  const privacy = rows.find(r => r.kind === 'privacy');

  assert.deepEqual(terms, {
    user_id: 'user-123',
    kind: 'terms',
    version: CURRENT_TERMS_VERSION,
    accepted_at: '2026-06-28T10:00:00.000Z',
  });
  assert.deepEqual(privacy, {
    user_id: 'user-123',
    kind: 'privacy',
    version: CURRENT_PRIVACY_VERSION,
    accepted_at: '2026-06-28T10:00:00.000Z',
  });
});
