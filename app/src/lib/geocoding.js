// Geocoder abstraction. The default implementation wraps `expo-location.geocodeAsync`,
// but search.js never imports it directly — the geocoder is always injected, which keeps
// the search pipeline testable without touching native modules.

// Tagged country/city bias appended to every query so partial inputs ("strandgaten")
// still resolve to the right city.
const DEFAULT_BIAS = ', Bergen, Norge';

// expoGeocode is dependency-injected so tests don't pull in expo-location.
function createExpoGeocoder(expoGeocode, { bias = DEFAULT_BIAS } = {}) {
  return {
    async geocode(query) {
      const q = (query ?? '').trim();
      if (!q) return null;
      try {
        // Try with the city bias first (handles partial street names).
        const biased = await expoGeocode(`${q}${bias}`);
        if (biased && biased.length) {
          return { lat: biased[0].latitude, lng: biased[0].longitude };
        }
        // Fall back to raw query in case the user typed a full address themselves.
        const raw = await expoGeocode(q);
        if (raw && raw.length) {
          return { lat: raw[0].latitude, lng: raw[0].longitude };
        }
      } catch {
        // Geocoder unavailable (offline, permission, simulator) — caller will
        // fall back to local fuzzy matching.
      }
      return null;
    },
  };
}

// Convenience: a no-op geocoder. Useful when the device geocoder is known to be
// unavailable; search.js will then rely entirely on its local fuzzy fallback.
function createNullGeocoder() {
  return { geocode: async () => null };
}

module.exports = { createExpoGeocoder, createNullGeocoder };
