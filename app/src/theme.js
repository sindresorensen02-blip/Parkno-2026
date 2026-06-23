// Parkno AirGlass design tokens — React Native
export const colors = {
  bgApp:        '#F4F3F2',
  bgCard:       'rgba(255,255,255,0.72)',
  bgCardSolid:  '#FFFFFF',
  bgMint:       '#DDEFE7',
  bgMist:       '#D8EEF2',
  bgSilver:     '#EAF0EC',

  fg1:          '#17211F',
  fg2:          '#34413E',
  fg3:          '#73817D',
  onDark:       '#FFFFFF',

  charcoal:     '#111416',
  charcoalMid:  '#2F3437',
  accentBlue:   '#4EA7B9',
  freshGreen:   '#8BCFB0',
  iceBlue:      '#93D6E3',
  coral:        '#EF8F7A',
  mintGreen:    '#9FD6B4',
};

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

// iOS-style shadow helper
export function shadow(level = 1) {
  const levels = {
    1: { shadowColor: '#111416', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4,  elevation: 2 },
    2: { shadowColor: '#111416', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 14, elevation: 6 },
    3: { shadowColor: '#111416', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 12 },
    4: { shadowColor: '#111416', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.18, shadowRadius: 40, elevation: 20 },
  };
  return levels[level] || levels[1];
}

export const typography = {
  display1: { fontFamily: 'System', fontWeight: '800', fontSize: 44, lineHeight: 46, letterSpacing: -1.1 },
  display2: { fontFamily: 'System', fontWeight: '700',      fontSize: 36, lineHeight: 39, letterSpacing: -0.9 },
  h1:       { fontFamily: 'System', fontWeight: '700',      fontSize: 28, lineHeight: 32, letterSpacing: -0.56 },
  h2:       { fontFamily: 'System', fontWeight: '600',  fontSize: 22, lineHeight: 28, letterSpacing: -0.44 },
  h3:       { fontFamily: 'System', fontWeight: '600',  fontSize: 18, lineHeight: 24 },
  body:     { fontFamily: 'System', fontWeight: '400',   fontSize: 16, lineHeight: 23 },
  bodyMd:   { fontFamily: 'System', fontWeight: '500',    fontSize: 16, lineHeight: 23 },
  callout:  { fontFamily: 'System', fontWeight: '500',    fontSize: 15, lineHeight: 21 },
  caption:  { fontFamily: 'System', fontWeight: '500',    fontSize: 13, lineHeight: 18 },
  overline: { fontFamily: 'System', fontWeight: '600',  fontSize: 11, lineHeight: 14, letterSpacing: 0.88, textTransform: 'uppercase' },
  price:    { fontFamily: 'System', fontWeight: '800', fontSize: 22, lineHeight: 24, letterSpacing: -0.55 },
  priceLg:  { fontFamily: 'System', fontWeight: '800', fontSize: 32, lineHeight: 34, letterSpacing: -0.8 },
};
