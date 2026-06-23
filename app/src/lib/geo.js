// Geographic helpers — pure CommonJS so `node --test` can require them directly.

const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(a, b) {
  if (!a || !b) return Infinity;
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return Infinity;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Annotate each spot with `distanceFromSearchKm` relative to target and return a new array
// sorted ascending by that distance. Spots without coords land at the end.
function annotateAndSort(spots, target) {
  if (!target) return spots;
  return spots
    .map((s) => ({
      ...s,
      distanceFromSearchKm: haversineKm(target, { lat: s.latitude, lng: s.longitude }),
    }))
    .sort((a, b) => a.distanceFromSearchKm - b.distanceFromSearchKm);
}

function within(spots, radiusKm) {
  return spots.filter((s) => s.distanceFromSearchKm != null && s.distanceFromSearchKm <= radiusKm);
}

function formatDistanceKm(km) {
  if (km == null || !isFinite(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

module.exports = { haversineKm, annotateAndSort, within, formatDistanceKm };
