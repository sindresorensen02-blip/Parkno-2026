// Prishelse — the price-health metric for a host's spot.
//
// It is not an arbitrary 0–100. It is grounded in a revenue model so the
// number means something the host can act on:
//
//   fill(p)    = expected occupancy 0..1. Linear demand that decays from a
//                low price (≈always booked) to a high price (≈never booked),
//                anchored to what comparable spots in the same area charge.
//   revenue(p) = p · fill(p)            — what the host actually earns.
//   score      = 100 · revenue(p) / max_q revenue(q)
//                i.e. how close this price is to the revenue-optimal price.
//
// The curve shape separates the two mistakes a host makes, from one number:
//   • priced below optimum → spot is full but underpaid  → "For lav"
//   • priced above optimum → spot sits empty             → "For høy"
//   • at the optimum                                     → "Perfekt pris"

import { BERGEN_SPOTS } from '../data/spots';

// Host spot titles look like "Innkjørsel · Møhlenpris" — area is the tail.
export function areaFromTitle(title) {
  const parts = String(title || '').split('·');
  return parts.length > 1 ? parts[parts.length - 1].trim() : '';
}

// What comparable spots in this area charge. Falls back to the whole city
// when the area is too thin to be a reliable signal.
function areaMarket(area) {
  const inArea = BERGEN_SPOTS.filter((s) => s.area === area);
  const pool = inArea.length >= 3 ? inArea : BERGEN_SPOTS;
  const prices = pool.map((s) => s.price).sort((a, b) => a - b);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const hi = prices[Math.min(prices.length - 1, Math.floor(prices.length * 0.9))];
  return { mean, hi };
}

function band(market) {
  // Demand reaches ≈full at `low`, ≈empty at `high`. With linear demand the
  // revenue-optimal price is high/2, so high = 2·mean puts the sweet spot
  // right at the going local rate.
  const low = Math.max(1, market.mean * 0.4);
  const high = market.mean * 2;
  return { low, high };
}

function fillAt(b, p) {
  const t = (p - b.low) / (b.high - b.low);
  return Math.max(0.04, Math.min(1, 1 - t));
}

export function priceHealth(spot, priceOverride) {
  const price = Number(priceOverride ?? spot?.price ?? 0) || 0;
  const market = areaMarket(areaFromTitle(spot?.title));
  const b = band(market);

  let opt = { price: Math.round(b.low), rev: 0 };
  for (let p = Math.round(b.low); p <= Math.round(b.high); p += 1) {
    const rev = p * fillAt(b, p);
    if (rev > opt.rev) opt = { price: p, rev };
  }

  const fill = fillAt(b, price);
  const revenue = price * fill;
  const score = opt.rev > 0 ? Math.round(100 * Math.min(1, revenue / opt.rev)) : 0;
  const side = price < opt.price ? 'low' : 'high';

  let zone;
  if (score >= 92) {
    zone = { key: 'perfect', color: '#10B981', soft: '16,185,129',
      title: 'Perfekt pris', note: 'Maks inntekt for området akkurat nå.' };
  } else if (score >= 78) {
    zone = { key: 'good', color: '#34D399', soft: '52,211,153',
      title: 'Bra pris', note: 'Tett på det optimale — lite å hente.' };
  } else if (score >= 55) {
    zone = side === 'low'
      ? { key: 'low', color: '#F59E0B', soft: '245,158,11',
          title: 'Litt lav', note: 'Du kan ta mer uten å miste bookinger.' }
      : { key: 'high', color: '#F59E0B', soft: '245,158,11',
          title: 'Litt høy', note: 'Noen vil velge en billigere plass.' };
  } else {
    zone = side === 'low'
      ? { key: 'tooLow', color: '#FB7185', soft: '251,113,133',
          title: 'For lav', note: 'Du gir bort inntekt hver uke.' }
      : { key: 'tooHigh', color: '#FB7185', soft: '251,113,133',
          title: 'For høy', note: 'Plassen blir stående tom.' };
  }

  return {
    score,
    zone,
    side,
    optimal: opt.price,
    fill,
    areaMean: Math.round(market.mean),
    // Slider bounds that keep the spot inside a sensible range.
    min: Math.max(5, Math.round(b.low * 0.6)),
    max: Math.round(b.high * 0.95),
  };
}
