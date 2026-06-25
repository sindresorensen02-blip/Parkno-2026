// Run with: node --test __tests__/format.test.js
//
// Pure-JS tests for the host earnings formatting helpers.

const { strict: assert } = require('node:assert');
const { test } = require('node:test');

const { formatKr, MONTH_NAMES_NB, trendPct } = require('../src/lib/format.js');

test('formatKr adds thin-space thousands separator with kr prefix', () => {
  assert.strictEqual(formatKr(4280), 'kr 4 280');
  assert.strictEqual(formatKr(18190), 'kr 18 190');
  assert.strictEqual(formatKr(0), 'kr 0');
});

test('MONTH_NAMES_NB maps index to Norwegian month name', () => {
  assert.strictEqual(MONTH_NAMES_NB[0], 'januar');
  assert.strictEqual(MONTH_NAMES_NB[4], 'mai');
  assert.strictEqual(MONTH_NAMES_NB[6], 'juli');
});

test('trendPct returns rounded percentage change', () => {
  assert.strictEqual(trendPct(4280, 3740), 14);
  assert.strictEqual(trendPct(2640, 1850), 43);
});

test('trendPct returns null when no prior month to compare', () => {
  assert.strictEqual(trendPct(1850, 0), null);
  assert.strictEqual(trendPct(1850, undefined), null);
});
