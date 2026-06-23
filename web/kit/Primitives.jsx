// Primitives.jsx — Parkno AirGlass core components.

const mpStyles = {
  // Base
  font: {
    fontFamily: 'Inter, "SF Pro Display", -apple-system, system-ui, sans-serif',
    WebkitFontSmoothing: 'antialiased',
  },
  bgTint: {
    background: 'linear-gradient(180deg, #F7F8F6 0%, #EDEFEF 60%, #DDEAF0 100%)',
  },
  bgHero: {
    background: '#F7F8F6',
    position: 'relative',
    overflow: 'hidden',
  },
};

// AppBackground — full screen tinted bg with optional pastel blobs.
function AppBackground({ blobs = false, children, style = {} }) {
  return (
    <div style={{
      minHeight: '100%', width: '100%',
      ...(blobs ? mpStyles.bgHero : mpStyles.bgTint),
      ...mpStyles.font,
      position: 'relative',
      ...style,
    }}>
      {blobs && (
        <>
          <div style={{ position: 'absolute', width: 320, height: 320, top: -80, left: -80, borderRadius: '50%', background: '#DCEBDF', filter: 'blur(80px)', opacity: 0.7, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 280, height: 280, bottom: -60, right: -60, borderRadius: '50%', background: '#DDEAF0', filter: 'blur(80px)', opacity: 0.7, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 220, height: 220, top: '40%', right: -40, borderRadius: '50%', background: '#9ECFE3', filter: 'blur(90px)', opacity: 0.35, pointerEvents: 'none' }} />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>
    </div>
  );
}

// GlassCard
function GlassCard({ children, style = {}, padding = 20, radius = 28, strong = false, onClick }) {
  return (
    <div onClick={onClick} style={{
      borderRadius: radius,
      padding,
      background: strong ? 'rgba(247,248,246,0.78)' : 'rgba(255,255,255,0.6)',
      backdropFilter: strong ? 'blur(34px) saturate(160%)' : 'blur(22px) saturate(140%)',
      WebkitBackdropFilter: strong ? 'blur(34px) saturate(160%)' : 'blur(22px) saturate(140%)',
      border: '1px solid rgba(255,255,255,0.6)',
      boxShadow: strong ? '0 12px 28px rgba(17,20,22,0.08), 0 2px 6px rgba(17,20,22,0.04)' : '0 4px 12px rgba(17,20,22,0.06), 0 1px 2px rgba(17,20,22,0.04)',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

// PrimaryButton (charcoal pill)
function PrimaryButton({ children, onClick, full = false, icon, style = {}, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      height: 56, padding: '0 22px',
      borderRadius: 999,
      background: '#111416',
      color: '#fff',
      border: 'none',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 600, fontSize: 16,
      letterSpacing: '-0.01em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      width: full ? '100%' : undefined,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12,
      boxShadow: '0 12px 28px rgba(17,20,22,0.18), 0 2px 6px rgba(17,20,22,0.08)',
      ...style,
    }}>
      <span style={{ flex: full ? 1 : undefined, textAlign: full ? 'left' : 'center', display: 'inline-flex', alignItems: 'center', gap: 8 }}>{children}</span>
      {icon && <span style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>}
    </button>
  );
}

// GlassButton (frosted pill)
function GlassButton({ children, onClick, style = {}, icon }) {
  return (
    <button onClick={onClick} style={{
      height: 52, padding: '0 22px',
      borderRadius: 999,
      background: 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(22px) saturate(140%)',
      WebkitBackdropFilter: 'blur(22px) saturate(140%)',
      border: '1px solid rgba(255,255,255,0.65)',
      color: '#111416',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 600, fontSize: 16,
      cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 10, justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(17,20,22,0.06), 0 1px 2px rgba(17,20,22,0.04)',
      ...style,
    }}>
      {icon}
      {children}
    </button>
  );
}

// HostCTAButton — mint pill
function HostCTAButton({ children, onClick, full = false, style = {} }) {
  return (
    <button onClick={onClick} style={{
      height: 56, padding: '0 24px',
      borderRadius: 999,
      background: '#DCEBDF',
      color: '#111416',
      border: 'none',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 700, fontSize: 16,
      cursor: 'pointer',
      width: full ? '100%' : undefined,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      boxShadow: '0 4px 12px rgba(17,20,22,0.06), 0 1px 2px rgba(17,20,22,0.04)',
      ...style,
    }}>{children}</button>
  );
}

// IconButton
function IconButton({ children, onClick, size = 44, dark = false, style = {} }) {
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: 999,
      background: dark ? '#111416' : 'rgba(255,255,255,0.7)',
      backdropFilter: dark ? 'none' : 'blur(20px) saturate(140%)',
      WebkitBackdropFilter: dark ? 'none' : 'blur(20px) saturate(140%)',
      border: dark ? 'none' : '1px solid rgba(255,255,255,0.7)',
      color: dark ? '#fff' : '#111416',
      cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(17,20,22,0.06), 0 1px 2px rgba(17,20,22,0.04)',
      flexShrink: 0,
      padding: 0,
      ...style,
    }}>{children}</button>
  );
}

// FilterPill
function FilterPill({ children, active = false, onClick, icon, style = {} }) {
  return (
    <button onClick={onClick} style={{
      height: 38, padding: '0 16px',
      borderRadius: 999,
      background: active ? '#111416' : 'rgba(255,255,255,0.7)',
      backdropFilter: active ? 'none' : 'blur(18px) saturate(140%)',
      WebkitBackdropFilter: active ? 'none' : 'blur(18px) saturate(140%)',
      border: active ? 'none' : '1px solid rgba(255,255,255,0.7)',
      color: active ? '#fff' : '#111416',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 600, fontSize: 13,
      cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      boxShadow: '0 1px 2px rgba(17,20,22,0.04)',
      whiteSpace: 'nowrap', flexShrink: 0,
      ...style,
    }}>{icon}{children}</button>
  );
}

// SearchBar
function SearchBar({ value = '', placeholder = 'Where to?', onChange, voice = true, style = {} }) {
  return (
    <div style={{
      height: 56,
      borderRadius: 999,
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(22px) saturate(140%)',
      WebkitBackdropFilter: 'blur(22px) saturate(140%)',
      border: '1px solid rgba(255,255,255,0.65)',
      boxShadow: '0 4px 12px rgba(17,20,22,0.06), 0 1px 2px rgba(17,20,22,0.04)',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 8px 0 20px',
      ...style,
    }}>
      <Icon name="search" size={20} color="#7B8589" />
      <input
        value={value}
        onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, border: 0, background: 'transparent', outline: 'none',
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: 16, fontWeight: 500,
          color: '#111416',
        }}
      />
      {voice && (
        <button style={{ width: 40, height: 40, borderRadius: 999, background: '#111416', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="mic" size={16} color="#fff" />
        </button>
      )}
    </div>
  );
}

// Badges
function PriceBadge({ price, unit = 'kr/hr', dark = true, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 3,
      borderRadius: 999, padding: '8px 14px',
      background: dark ? '#111416' : 'rgba(255,255,255,0.7)',
      color: dark ? '#fff' : '#111416',
      backdropFilter: dark ? 'none' : 'blur(14px)',
      WebkitBackdropFilter: dark ? 'none' : 'blur(14px)',
      border: dark ? 'none' : '1px solid rgba(255,255,255,0.7)',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 700, fontSize: 14,
      fontFeatureSettings: '"tnum"',
      ...style,
    }}>
      {price}<span style={{ fontWeight: 500, opacity: 0.7, marginLeft: 4 }}>{unit}</span>
    </span>
  );
}

function RatingBadge({ rating, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      borderRadius: 999, padding: '5px 10px',
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.7)',
      color: '#111416',
      fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 700, fontSize: 12,
      ...style,
    }}>
      <Icon name="star" size={12} fill="#111416" color="#111416" strokeWidth={0} /> {rating}
    </span>
  );
}

function AvailabilityBadge({ status = 'available', style = {} }) {
  const config = {
    available: { label: 'Available', dot: '#9FD6B4' },
    premium:   { label: 'Premium',   dot: '#5FAFD3' },
    booked:    { label: 'Booked',    dot: '#7B8589' },
    new:       { label: 'New',       dot: null },
  }[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      borderRadius: 999, padding: '5px 11px',
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.7)',
      color: '#111416',
      fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600, fontSize: 12,
      ...style,
    }}>
      {config.dot && <span style={{ width: 7, height: 7, borderRadius: 999, background: config.dot }} />}
      {config.label}
    </span>
  );
}

window.AppBackground = AppBackground;
window.GlassCard = GlassCard;
window.PrimaryButton = PrimaryButton;
window.GlassButton = GlassButton;
window.HostCTAButton = HostCTAButton;
window.IconButton = IconButton;
window.FilterPill = FilterPill;
window.SearchBar = SearchBar;
window.PriceBadge = PriceBadge;
window.RatingBadge = RatingBadge;
window.AvailabilityBadge = AvailabilityBadge;
