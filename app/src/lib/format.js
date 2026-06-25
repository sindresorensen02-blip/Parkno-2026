// Earnings/host formatting helpers. Currency uses a non-breaking thin space
// ( ) as the thousands separator, per the host design spec.
const THIN = ' ';

function formatKr(n) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  const grouped = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  return `kr ${sign}${grouped}`;
}

const MONTH_NAMES_NB = [
  'januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli',
  'august', 'september', 'oktober', 'november', 'desember',
];

// Month-over-month percentage change, rounded. null when there's no prior
// month to compare against (prev is 0 / falsy).
function trendPct(current, prev) {
  if (!prev) return null;
  return Math.round(((current - prev) / prev) * 100);
}

module.exports = { formatKr, MONTH_NAMES_NB, trendPct };
