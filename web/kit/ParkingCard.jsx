// ParkingCard.jsx — listing card variants

function ParkingCard({ tone = 'mint', overline, title, price, unit = 'kr/t', meta, badge, onOpen }) {
  const bg = tone === 'mist' ? '#DDEAF0' : tone === 'silver' ? '#EDEFEF' : '#DCEBDF';
  return (
    <div style={{
      borderRadius: 28,
      padding: 20,
      background: bg,
      boxShadow: '0 4px 12px rgba(17,20,22,0.06), 0 1px 2px rgba(17,20,22,0.04)',
      display: 'flex', flexDirection: 'column', gap: 8,
      position: 'relative',
      minHeight: 200,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {badge && <div style={{ position: 'absolute', top: 16, right: 16 }}>{badge}</div>}
      {overline && <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(47,52,55,0.7)' }}>{overline}</div>}
      <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.025em', color: '#111416', whiteSpace: 'pre-line' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', color: '#111416', fontFeatureSettings: '"tnum"' }}>{price}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(47,52,55,0.7)' }}>{unit}</span>
      </div>
      {meta && <div style={{ fontSize: 13, color: 'rgba(47,52,55,0.7)', marginTop: 'auto' }}>{meta}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: meta ? 8 : 'auto' }}>
        <IconButton size={36}><Icon name="heart" size={16} /></IconButton>
        <IconButton size={36}><Icon name="share" size={16} /></IconButton>
        <button onClick={onOpen} style={{
          marginLeft: 'auto', width: 36, height: 36, borderRadius: 999,
          background: '#111416', color: '#fff', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name="arrow" size={16} color="#fff" /></button>
      </div>
    </div>
  );
}

// Compact horizontal list row variant
function ParkingRow({ title, sub, price, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: 14,
      borderRadius: 22,
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.6)',
      boxShadow: '0 1px 2px rgba(17,20,22,0.04)',
      cursor: 'pointer',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 18,
        background: 'linear-gradient(135deg,#DCEBDF,#DDEAF0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name="car" size={24} color="#111416" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111416' }}>{title}</div>
        <div style={{ fontSize: 13, color: '#7B8589', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111416', fontFeatureSettings: '"tnum"' }}>{price}</div>
        <div style={{ fontSize: 11, color: '#7B8589' }}>kr/t</div>
      </div>
    </div>
  );
}

window.ParkingCard = ParkingCard;
window.ParkingRow = ParkingRow;
