// BottomNav.jsx — floating frosted pill nav

function FloatingBottomNav({ active = 'home', onChange }) {
  const items = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'search', icon: 'search' },
    { id: 'map', icon: 'map-pin' },
    { id: 'saved', icon: 'heart' },
    { id: 'me', icon: 'user' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 24,
      display: 'flex', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 30,
    }}>
      <div style={{
        pointerEvents: 'auto',
        background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 45%, #2563EB 100%)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        border: '1px solid rgba(37,99,235,0.45)',
        boxShadow: '0 18px 40px rgba(37,99,235,0.26), 0 4px 10px rgba(17,20,22,0.06)',
        borderRadius: 32,
        padding: 8,
        display: 'inline-flex', gap: 4,
      }}>
        {items.map(it => {
          const on = active === it.id;
          return (
            <button key={it.id} onClick={() => onChange && onChange(it.id)} style={{
              height: 48, minWidth: 48, padding: it.label && on ? '0 16px' : 0,
              borderRadius: 999,
              background: on ? '#F8FAF7' : 'transparent',
              color: '#111416',
              border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600, fontSize: 13,
            }}>
              <Icon name={it.icon} size={22} fill={on && it.icon === 'heart' ? 'currentColor' : 'none'} />
              {on && it.label && <span>{it.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

window.FloatingBottomNav = FloatingBottomNav;
