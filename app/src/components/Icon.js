import React from 'react';
import { Platform } from 'react-native';
import Svg, {
  Path, Circle, Rect, Line, Polyline, Polygon,
} from 'react-native-svg';
import { SymbolView } from 'expo-symbols';

// Map every icon name used in the app to its SF Symbol equivalent so iOS gets
// system-rendered glyphs. Android/web fall through to the SVG implementation below.
const SF_NAMES = {
  'arrow-left':    'arrow.left',
  'arrow-right':   'arrow.right',
  'alert-circle':  'exclamationmark.circle.fill',
  'bell':          'bell.fill',
  'camera':        'camera.fill',
  'car':           'car.fill',
  'help':          'questionmark.circle.fill',
  'mail':          'envelope.fill',
  'map':           'map.fill',
  'check':         'checkmark',
  'chevron-down':  'chevron.down',
  'chevron-left':  'chevron.left',
  'chevron-right': 'chevron.right',
  'chevron-up':    'chevron.up',
  'clock':         'clock.fill',
  'credit-card':   'creditcard.fill',
  'filter':        'line.3.horizontal.decrease',
  'heart':         'heart.fill',
  'home':          'house.fill',
  'info':          'info.circle',
  'key':           'key.fill',
  'layers':        'square.stack.3d.up.fill',
  'map-pin':       'mappin',
  'mic':           'mic.fill',
  'search':        'magnifyingglass',
  'shield':        'shield.fill',
  'star':          'star.fill',
  'trending-up':   'chart.line.uptrend.xyaxis',
  'user':          'person.fill',
  'wallet':        'wallet.pass.fill',
  'x':             'xmark',
  'zap':           'bolt.fill',
};

// Derive an SF Symbol weight from the SVG strokeWidth so existing callsites stay visually consistent.
function weightFromStroke(sw) {
  if (sw == null) return 'regular';
  if (sw >= 2.5) return 'bold';
  if (sw >= 2)   return 'semibold';
  if (sw >= 1.7) return 'medium';
  if (sw >= 1.4) return 'regular';
  return 'light';
}

const ICONS = {
  map: (c, sw) => (
    <>
      <Polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21 1 6" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Line x1="8" y1="3" x2="8" y2="18" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
      <Line x1="16" y1="6" x2="16" y2="21" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
    </>
  ),
  help: (c, sw) => (
    <>
      <Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={sw} fill="none"/>
      <Path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-.5.7-1.5 1.2-2 2" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Line x1="12" y1="17" x2="12.01" y2="17" stroke={c} strokeWidth={sw + 0.5} strokeLinecap="round"/>
    </>
  ),
  mail: (c, sw) => (
    <>
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={c} strokeWidth={sw} fill="none"/>
      <Polyline points="2 7 12 13 22 7" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  car: (c, sw) => (
    <>
      <Path d="M3 13l2-6a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 6v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2H6v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Line x1="3" y1="13" x2="21" y2="13" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
      <Circle cx="7.5" cy="16" r="1.2" stroke={c} strokeWidth={sw} fill="none"/>
      <Circle cx="16.5" cy="16" r="1.2" stroke={c} strokeWidth={sw} fill="none"/>
    </>
  ),
  key: (c, sw) => (
    <>
      <Circle cx="7.5" cy="15.5" r="3.5" stroke={c} strokeWidth={sw} fill="none"/>
      <Path d="M10 13l11-11M16 7l3 3M14 9l3 3" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'credit-card': (c, sw) => (
    <>
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={c} strokeWidth={sw} fill="none"/>
      <Line x1="2" y1="10" x2="22" y2="10" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
    </>
  ),
  info: (c, sw) => (
    <>
      <Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={sw} fill="none"/>
      <Line x1="12" y1="16" x2="12" y2="12" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
      <Line x1="12" y1="8" x2="12.01" y2="8" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
    </>
  ),
  home: (c, sw) => (
    <>
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Polyline points="9 22 9 12 15 12 15 22" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  search: (c, sw) => (
    <>
      <Circle cx="11" cy="11" r="8" stroke={c} strokeWidth={sw} fill="none"/>
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
    </>
  ),
  'map-pin': (c, sw, fill) => (
    <>
      <Path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z" stroke={c} strokeWidth={sw} fill={fill || 'none'} strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="10" r="3" stroke={c} strokeWidth={sw} fill="none"/>
    </>
  ),
  heart: (c, sw, fill) => (
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={c} strokeWidth={sw} fill={fill || 'none'} strokeLinecap="round" strokeLinejoin="round"/>
  ),
  user: (c, sw) => (
    <>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="7" r="4" stroke={c} strokeWidth={sw} fill="none"/>
    </>
  ),
  bell: (c, sw) => (
    <>
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'arrow-right': (c, sw) => (
    <>
      <Path d="M5 12h14" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="m12 5 7 7-7 7" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'arrow-left': (c, sw) => (
    <>
      <Path d="M19 12H5" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="m12 19-7-7 7-7" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  clock: (c, sw) => (
    <>
      <Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={sw} fill="none"/>
      <Path d="M12 6v6l4 2" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  car: (c, sw) => (
    <>
      <Path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.83-5.66A2 2 0 0 0 11.38 4H4a1 1 0 0 0-1 1v10h3" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="6.5" cy="16.5" r="2.5" stroke={c} strokeWidth={sw} fill="none"/>
      <Circle cx="16.5" cy="16.5" r="2.5" stroke={c} strokeWidth={sw} fill="none"/>
    </>
  ),
  star: (c, sw, fill) => (
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={c} strokeWidth={sw} fill={fill || 'none'} strokeLinecap="round" strokeLinejoin="round"/>
  ),
  shield: (c, sw) => (
    <>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="m9 12 2 2 4-4" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  check: (c, sw) => (
    <Path d="M20 6 9 17l-5-5" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  x: (c, sw) => (
    <>
      <Path d="M18 6 6 18" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="m6 6 12 12" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  zap: (c, sw, fill) => (
    <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke={c} strokeWidth={sw} fill={fill || 'none'} strokeLinecap="round" strokeLinejoin="round"/>
  ),
  wallet: (c, sw) => (
    <>
      <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  camera: (c, sw) => (
    <>
      <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="13" r="3" stroke={c} strokeWidth={sw} fill="none"/>
    </>
  ),
  mic: (c, sw) => (
    <>
      <Rect x="9" y="2" width="6" height="11" rx="3" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      <Line x1="12" y1="19" x2="12" y2="22" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
      <Line x1="8" y1="22" x2="16" y2="22" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
    </>
  ),
  filter: (c, sw) => (
    <>
      <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'chevron-right': (c, sw) => (
    <Path d="m9 18 6-6-6-6" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'chevron-up': (c, sw) => (
    <Path d="m18 15-6-6-6 6" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'chevron-down': (c, sw) => (
    <Path d="m6 9 6 6 6-6" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  layers: (c, sw) => (
    <>
      <Polygon points="12 2 2 7 12 12 22 7 12 2" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Polyline points="2 17 12 22 22 17" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Polyline points="2 12 12 17 22 12" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ),
  'bar-chart': (c, sw) => (
    <>
      <Line x1="12" y1="20" x2="12" y2="10" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
      <Line x1="18" y1="20" x2="18" y2="4"  stroke={c} strokeWidth={sw} strokeLinecap="round"/>
      <Line x1="6"  y1="20" x2="6"  y2="16" stroke={c} strokeWidth={sw} strokeLinecap="round"/>
    </>
  ),
};

function SvgIcon({ name, size, color, strokeWidth, fill }) {
  const draw = ICONS[name];
  if (!draw) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {draw(color, strokeWidth, fill)}
    </Svg>
  );
}

export default function Icon({ name, size = 24, color = '#17211F', strokeWidth = 1.5, fill }) {
  const sfName = SF_NAMES[name];
  if (Platform.OS === 'ios' && sfName) {
    return (
      <SymbolView
        name={sfName}
        size={size}
        tintColor={color}
        weight={weightFromStroke(strokeWidth)}
        fallback={<SvgIcon name={name} size={size} color={color} strokeWidth={strokeWidth} fill={fill} />}
      />
    );
  }
  return <SvgIcon name={name} size={size} color={color} strokeWidth={strokeWidth} fill={fill} />;
}
