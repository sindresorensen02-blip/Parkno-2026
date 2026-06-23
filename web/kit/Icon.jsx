// Icon.jsx — Lucide-style icons used in the Parkno kit.
// Stroke 1.5, currentColor. Names match Lucide where possible.

const ICONS = {
  home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></>,
  search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  'map-pin': <><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
  heart: <path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.07a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.07a5.5 5.5 0 0 0 0-7.78Z"/>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  arrow: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
  'arrow-left': <><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
  car: <><path d="M14 16H9m-3 0H4l1.4-5.4A2 2 0 0 1 7.3 9h9.4a2 2 0 0 1 1.9 1.6L20 16h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></>,
  star: <path d="M12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7Z"/>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54Z"/>,
  plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  'chevron-right': <path d="m9 18 6-6-6-6"/>,
  key: <><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2 11.5 11.5"/><path d="m15.5 7.5 4 4"/></>,
  layers: <><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></>,
  share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></>,
  camera: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></>,
  wallet: <><path d="M19 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 14h.01"/><path d="M21 12V9a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2 2 2 0 0 1 2-2h14"/></>,
  zap: <path d="M13 2 3 14h9l-1 8 10-12h-9z"/>,
  check: <path d="m20 6-11 11-5-5"/>,
  x: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
  mic: <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M19 11a7 7 0 0 1-14 0"/><path d="M12 19v3"/></>,
  sliders: <><path d="M4 21V14"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M2 14h4"/><path d="M10 8h4"/><path d="M18 16h4"/></>,
};

function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 1.5, fill = 'none', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      {ICONS[name] || null}
    </svg>
  );
}

window.Icon = Icon;
