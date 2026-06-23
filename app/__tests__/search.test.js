// Run with: npm test  (or: node --test __tests__/search.test.js)
//
// Pure-JS tests for the search pipeline. The geocoder is injected as a fake so
// these tests never reach a native module.

const { strict: assert } = require('node:assert');
const { test } = require('node:test');

const { searchSpots, STATUS, bestFuzzyMatch } = require('../src/lib/search.js');
const { haversineKm, annotateAndSort, formatDistanceKm } = require('../src/lib/geo.js');

const SPOTS = [
  { id: 'a', address: 'Strandgaten 18',     area: 'Sentrum',       latitude: 60.3915, longitude: 5.3220 }, // ~0.05 km from center
  { id: 'b', address: 'Olav Kyrres gate 22', area: 'Sentrum',       latitude: 60.3950, longitude: 5.3270 }, // ~0.5 km
  { id: 'c', address: 'Sandviksveien 47',   area: 'Sandviken',     latitude: 60.4030, longitude: 5.3185 }, // ~1.4 km
  { id: 'd', address: 'Spelhaugen 8',       area: 'Fyllingsdalen', latitude: 60.3700, longitude: 5.2680 }, // ~4.5 km
  { id: 'e', address: 'Sandsliåsen 30',     area: 'Sandsli',       latitude: 60.3000, longitude: 5.2750 }, // ~11 km
];

function fakeGeocoder(table) {
  return {
    geocode: async (q) => {
      const key = q.toLowerCase().trim();
      for (const [needle, coord] of Object.entries(table)) {
        if (key.startsWith(needle.toLowerCase())) return coord;
      }
      return null;
    },
  };
}

test('exact address search returns matching spot first', async () => {
  const geocoder = fakeGeocoder({ 'strandgaten 18': { lat: 60.3915, lng: 5.3220 } });
  const result = await searchSpots({ query: 'Strandgaten 18', spots: SPOTS, geocoder });

  assert.equal(result.status, STATUS.FOUND);
  assert.equal(result.matchedSpots[0].id, 'a');
  assert.ok(result.matchedSpots[0].distanceFromSearchKm < 0.1);
});

test('partial address search resolves via geocoder', async () => {
  const geocoder = fakeGeocoder({ 'sandviksveien': { lat: 60.4030, lng: 5.3185 } });
  const result = await searchSpots({ query: 'sandviksveien', spots: SPOTS, geocoder });

  assert.equal(result.status, STATUS.FOUND);
  assert.equal(result.matchedSpots[0].id, 'c');
});

test('misspelled address falls back to fuzzy match (approximate)', async () => {
  const geocoder = fakeGeocoder({}); // geocoder never resolves anything
  const result = await searchSpots({ query: 'Strandgten 18', spots: SPOTS, geocoder });

  assert.equal(result.status, STATUS.APPROXIMATE);
  assert.equal(result.matchedSpots[0].id, 'a');
});

test('no geocode + no fuzzy match → empty', async () => {
  const geocoder = fakeGeocoder({});
  const result = await searchSpots({ query: 'qqqqqzzzzz', spots: SPOTS, geocoder });

  assert.equal(result.status, STATUS.EMPTY);
  assert.equal(result.matchedSpots.length, 0);
});

test('results are sorted by distance ascending', async () => {
  const geocoder = fakeGeocoder({ 'sentrum': { lat: 60.391, lng: 5.322 } });
  const result = await searchSpots({
    query: 'Sentrum', spots: SPOTS, geocoder, radii: [1, 3], approximateLimit: 5,
  });

  const ids = result.matchedSpots.map((s) => s.id);
  assert.equal(ids[0], 'a');
  assert.equal(ids[1], 'b');
  for (let i = 1; i < result.matchedSpots.length; i++) {
    assert.ok(
      result.matchedSpots[i].distanceFromSearchKm >= result.matchedSpots[i - 1].distanceFromSearchKm,
      `spot ${i} should be at least as far as ${i - 1}`,
    );
  }
});

test('expanding radius falls back to nearest-N when nothing is within range', async () => {
  const geocoder = fakeGeocoder({ 'middle of nowhere': { lat: 61.0, lng: 6.0 } });
  const result = await searchSpots({
    query: 'middle of nowhere', spots: SPOTS, geocoder, radii: [1, 3], approximateLimit: 3,
  });

  assert.equal(result.status, STATUS.APPROXIMATE);
  assert.equal(result.radiusKm, null);
  assert.equal(result.matchedSpots.length, 3);
});

test('empty query returns idle with all spots', async () => {
  const geocoder = fakeGeocoder({});
  const result = await searchSpots({ query: '   ', spots: SPOTS, geocoder });
  assert.equal(result.status, STATUS.IDLE);
  assert.equal(result.matchedSpots.length, SPOTS.length);
});

test('haversineKm: same point is zero', () => {
  assert.equal(haversineKm({ lat: 60, lng: 5 }, { lat: 60, lng: 5 }), 0);
});

test('haversineKm: roughly correct distance between two known Bergen points', () => {
  // Strandgaten 18 to Sandviksveien 47 is ~1.4 km
  const d = haversineKm({ lat: 60.3915, lng: 5.3220 }, { lat: 60.4030, lng: 5.3185 });
  assert.ok(d > 1.2 && d < 1.7, `expected ~1.4, got ${d}`);
});

test('annotateAndSort respects target', () => {
  const sorted = annotateAndSort(SPOTS, { lat: 60.391, lng: 5.322 });
  assert.equal(sorted[0].id, 'a');
  assert.equal(sorted[sorted.length - 1].id, 'e');
});

test('formatDistanceKm: sub-km formats as metres', () => {
  assert.equal(formatDistanceKm(0.4), '400 m');
});

test('formatDistanceKm: km uses Norwegian comma', () => {
  assert.equal(formatDistanceKm(1.2), '1,2 km');
});

test('fuzzy match handles diacritic-free spelling of Norwegian street', () => {
  const m = bestFuzzyMatch('Mohlenpris', [
    ...SPOTS,
    { id: 'm', address: 'Møhlenprisbakken 6', area: 'Møhlenpris', latitude: 60.385, longitude: 5.320 },
  ]);
  assert.ok(m);
  assert.equal(m.spot.id, 'm');
});
