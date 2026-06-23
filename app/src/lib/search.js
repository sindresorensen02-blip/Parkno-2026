// Search pipeline — pure CommonJS, no React Native imports.
//
// Flow:
//   1. Empty query → status 'idle', return all spots unchanged.
//   2. Geocode the query via the injected geocoder.
//   3. If geocoding fails, run a local fuzzy match against spot.address + spot.area
//      and use the best match's coordinates as the target.
//   4. With a target, sort all spots by distance and apply an expanding radius:
//        1 km (status 'found') → 3 km (status 'found') → nearest 10 (status 'approximate').
//   5. If we never resolved a target, return status 'empty'.

const { annotateAndSort, haversineKm, within } = require('./geo');

const RADII_KM = [1, 3];
const APPROXIMATE_LIMIT = 10;

const STATUS = {
  IDLE:        'idle',
  SEARCHING:   'searching',
  FOUND:       'found',
  APPROXIMATE: 'approximate',
  EMPTY:       'empty',
};

// --- fuzzy matching (used only when geocoding returns nothing) ---

function normalize(s) {
  return (s ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')                            // strip combining diacritics
    .replace(/ø/g, 'o').replace(/å/g, 'a').replace(/æ/g, 'ae')  // Norwegian → ASCII
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s) {
  const n = normalize(s);
  return n ? n.split(' ') : [];
}

// Iterative Levenshtein with an early-exit cap; cheap on short address tokens.
function levenshtein(a, b, cap = 3) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;

  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > cap) return cap + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// Score a spot against the query. Higher is a better match. 0 = no match.
function fuzzyScore(query, spot) {
  const qTokens = tokens(query);
  if (!qTokens.length) return 0;

  const haystackTokens = tokens(`${spot.address} ${spot.area ?? ''}`);
  if (!haystackTokens.length) return 0;

  const haystack = haystackTokens.join(' ');
  let score = 0;

  if (haystack.includes(qTokens.join(' '))) score += 50;

  for (const q of qTokens) {
    let bestForToken = 0;
    for (const h of haystackTokens) {
      if (h === q)                                        { bestForToken = Math.max(bestForToken, 20); continue; }
      if (h.startsWith(q) || q.startsWith(h))             { bestForToken = Math.max(bestForToken, 14); continue; }
      if (h.includes(q) || q.includes(h))                 { bestForToken = Math.max(bestForToken, 10); continue; }
      if (q.length >= 4 && h.length >= 4) {
        const cap = q.length >= 6 ? 2 : 1;
        const d = levenshtein(q, h, cap);
        if (d <= cap) bestForToken = Math.max(bestForToken, 8 - d);
      }
    }
    score += bestForToken;
  }
  return score;
}

function bestFuzzyMatch(query, spots) {
  let best = null;
  let bestScore = 0;
  for (const s of spots) {
    const score = fuzzyScore(query, s);
    if (score > bestScore) {
      best = s;
      bestScore = score;
    }
  }
  // Require a minimum confidence so random short queries don't snap to a random spot.
  return bestScore >= 10 ? { spot: best, score: bestScore } : null;
}

// --- main search ---

async function searchSpots({
  query,
  spots,
  geocoder,
  radii = RADII_KM,
  approximateLimit = APPROXIMATE_LIMIT,
}) {
  const q = (query ?? '').trim();
  if (!q) {
    return { status: STATUS.IDLE, target: null, radiusKm: null, matchedSpots: spots };
  }

  let target = await geocoder.geocode(q);
  let usedFuzzy = false;

  if (!target) {
    const fuzzy = bestFuzzyMatch(q, spots);
    if (fuzzy) {
      target = { lat: fuzzy.spot.latitude, lng: fuzzy.spot.longitude };
      usedFuzzy = true;
    }
  }

  if (!target) {
    return { status: STATUS.EMPTY, target: null, radiusKm: null, matchedSpots: [] };
  }

  const sorted = annotateAndSort(spots, target);

  for (const radiusKm of radii) {
    const hits = within(sorted, radiusKm);
    if (hits.length > 0) {
      return {
        status:       usedFuzzy ? STATUS.APPROXIMATE : STATUS.FOUND,
        target,
        radiusKm,
        matchedSpots: hits,
      };
    }
  }

  return {
    status:       STATUS.APPROXIMATE,
    target,
    radiusKm:     null,
    matchedSpots: sorted.slice(0, approximateLimit),
  };
}

module.exports = {
  searchSpots,
  STATUS,
  RADII_KM,
  APPROXIMATE_LIMIT,
  bestFuzzyMatch,
  fuzzyScore,
  haversineKm,
};
