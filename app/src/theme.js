// Parkno — Waymo-grade dark design tokens (React Native)
// Palette lifted directly from the Waymo app spec: two-level dark background
// (lighter page + darker nav), #3A4C68 cards, white primary / blue-gray
// secondary text, blue link accent, green status accent.
export const colors = {
  // ── Backgrounds (two-level, like Waymo) ────────────────────────────
  bgApp:        '#2B394C',   // page background
  navBg:        '#1F2A39',   // bottom-nav background (darker, anchors bottom)

  // ── Surfaces ───────────────────────────────────────────────────────
  surface1:     '#3A4C68',   // cards
  surface2:     '#3B4C69',   // secondary cards / grouped rows
  surface3:     '#50607A',   // controls / toggle track / inputs / pressed

  // ── Borders / hairlines ────────────────────────────────────────────
  border:       'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',

  // ── Text ───────────────────────────────────────────────────────────
  textPrimary:   '#FFFFFF',
  textSecondary: '#98B6D8',
  textTertiary:  '#6E809B',
  onAccent:      '#FFFFFF',

  // ── Accents ────────────────────────────────────────────────────────
  accent:       '#5EA2F5',                    // link / active blue
  accentSoft:   'rgba(94,162,245,0.14)',
  accentBorder: 'rgba(94,162,245,0.32)',
  accentGlow:   'rgba(94,162,245,0.35)',
  purple:       '#C58BFF',                    // special accent (avatar outline)
  beta:         '#E9FFAC',                    // beta label background

  // ── Functional status ──────────────────────────────────────────────
  success:      '#17E6A1',                    // Waymo accent green
  warning:      '#D9A441',
  danger:       '#E2675E',

  // ── Controls ───────────────────────────────────────────────────────
  toggleTrack:  '#50607A',
  toggleKnob:   '#FFFFFF',

  // ── Back-compat aliases (old token names → new values) ─────────────
  bgCard:       '#3A4C68',
  bgCardSolid:  '#3A4C68',
  bgMint:       '#3A4C68',
  bgMist:       '#2B394C',
  bgSilver:     '#2B394C',
  fg1:          '#FFFFFF',
  fg2:          '#98B6D8',
  fg3:          '#6E809B',
  onDark:       '#FFFFFF',
  charcoal:     '#3A4C68',
  charcoalMid:  '#3B4C69',
  accentBlue:   '#5EA2F5',
  freshGreen:   '#17E6A1',
  iceBlue:      '#5EA2F5',
  coral:        '#E2675E',
  mintGreen:    '#17E6A1',
};

// Single restrained accent gradient — reserved for ONE primary CTA per screen.
export const accentGrad = ['#4E96F0', '#5EA2F5'];

export const radii = {
  xs:   8,
  sm:   12,
  md:   18,
  lg:   26,
  card: 28,
  hero: 34,
  pill: 999,
};

export const spacing = {
  s1:  4,
  s2:  8,
  s3:  12,
  s4:  16,
  s5:  20,
  s6:  24,
  s7:  32,
  s8:  40,
  s9:  56,
  s10: 72,
};

// Soft dark elevation — depth without bright drop-shadows on the dark canvas.
export function shadow(level = 1) {
  const levels = {
    1: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 },  shadowOpacity: 0.18, shadowRadius: 6,  elevation: 2 },
    2: { shadowColor: '#000000', shadowOffset: { width: 0, height: 6 },  shadowOpacity: 0.24, shadowRadius: 14, elevation: 6 },
    3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.30, shadowRadius: 24, elevation: 12 },
    4: { shadowColor: '#000000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.38, shadowRadius: 40, elevation: 20 },
  };
  return levels[level] || levels[1];
}

// Accent glow — for the single highlighted CTA per screen.
export function accentGlow(level = 2) {
  const levels = {
    1: { shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 6 },  shadowOpacity: 0.30, shadowRadius: 14, elevation: 6 },
    2: { shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.38, shadowRadius: 22, elevation: 8 },
  };
  return levels[level] || levels[1];
}

export const typography = {
  display1: { fontFamily: 'System', fontWeight: '700', fontSize: 44, lineHeight: 48, letterSpacing: -1.0 },
  display2: { fontFamily: 'System', fontWeight: '700', fontSize: 36, lineHeight: 40, letterSpacing: -0.8 },
  h1:       { fontFamily: 'System', fontWeight: '600', fontSize: 28, lineHeight: 33, letterSpacing: -0.5 },
  h2:       { fontFamily: 'System', fontWeight: '600', fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  h3:       { fontFamily: 'System', fontWeight: '600', fontSize: 18, lineHeight: 24 },
  body:     { fontFamily: 'System', fontWeight: '400', fontSize: 16, lineHeight: 23 },
  bodyMd:   { fontFamily: 'System', fontWeight: '500', fontSize: 16, lineHeight: 23 },
  callout:  { fontFamily: 'System', fontWeight: '500', fontSize: 15, lineHeight: 21 },
  caption:  { fontFamily: 'System', fontWeight: '500', fontSize: 13, lineHeight: 18 },
  overline: { fontFamily: 'System', fontWeight: '600', fontSize: 11, lineHeight: 14, letterSpacing: 0.88, textTransform: 'uppercase' },
  price:    { fontFamily: 'System', fontWeight: '700', fontSize: 22, lineHeight: 24, letterSpacing: -0.5 },
  priceLg:  { fontFamily: 'System', fontWeight: '700', fontSize: 32, lineHeight: 34, letterSpacing: -0.8 },
};
