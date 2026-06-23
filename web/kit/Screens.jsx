// Screens.jsx — Parkno marketing site screens
// Three connected screens shown inside one iPhone:
//   1. Welcome / pitch (host-focused landing)
//   2. LiveSpot (the immersive "your spot is ready" interactive screen)
//   3. HostEarnings (the dashboard the marketing site is selling)

// ────────────────────────────────────────────────────────────
// 1. Welcome — host-focused pitch screen
// ────────────────────────────────────────────────────────────
function WelcomeScreen({ go, density = 'roomy', promptApp = () => {} }) {
  const isCompact = density === 'compact';
  const padTop = isCompact ? 60 : 76;

  const spots = [
    {
      id: 'strand',
      address: 'Strandgaten 12',
      area: 'Møhlenpris',
      distance: '0,4 km',
      walk: '5 min',
      price: 45,
      until: 'Ledig til 18:00',
      tags: ['Tak over', 'Elbil 11kW'],
      featured: true,
    },
    {
      id: 'sandviks',
      address: 'Sandviksveien 47',
      area: 'Sandviken',
      distance: '0,9 km',
      walk: '11 min',
      price: 38,
      until: 'Ledig til 20:30',
      tags: ['Belyst', 'Kamera'],
    },
    {
      id: 'nygaard',
      address: 'Nygårdsgaten 8',
      area: 'Sentrum',
      distance: '1,2 km',
      walk: '14 min',
      price: 55,
      until: 'Ledig til 17:00',
      tags: ['Innendørs'],
    },
  ];

  return (
    <AppBackground blobs={true}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: `${padTop}px 20px ${isCompact ? 24 : 36}px` }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="assets/parkno-logo-icon.png" alt="" aria-hidden="true" style={{
            width: 62, height: 62,
            display: 'block', objectFit: 'contain', objectPosition: 'center',
            flexShrink: 0,
            margin: '-13px 0',
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#7B8589', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Hei Ellen</span>
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: '#111416' }}>
              Finn en plass
            </span>
          </div>
          <button onClick={promptApp} style={{
            marginLeft: 'auto',
            width: 40, height: 40, borderRadius: 999,
            background: 'linear-gradient(135deg,#DCEBDF,#9ECFE3)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#111416', fontSize: 13,
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: '0 4px 12px rgba(17,20,22,0.12)',
            cursor: 'pointer', padding: 0,
          }}>EH</button>
        </div>

        {/* Search / address */}
        <button onClick={promptApp} style={{
          marginTop: 18, textAlign: 'left', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px',
          borderRadius: 18,
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(22px) saturate(140%)',
          WebkitBackdropFilter: 'blur(22px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 6px 16px rgba(17,20,22,0.06)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 999,
            background: '#111416',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(17,20,22,0.22)',
          }}>
            <Icon name="map-pin" size={15} color="#fff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7B8589', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Hvor skal du?</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111416', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Møhlenpris, Bergen</span>
          </div>
          <Icon name="search" size={18} color="#7B8589" />
        </button>

        {/* Filter chips */}
        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'Nå', active: true },
            { label: '< 1 km' },
            { label: 'Elbil' },
            { label: 'Tak over' },
          ].map((f) => (
            <button key={f.label} onClick={promptApp} style={{
              height: 30, padding: '0 12px', borderRadius: 999,
              display: 'inline-flex', alignItems: 'center',
              fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
              background: f.active ? '#111416' : 'rgba(255,255,255,0.72)',
              color: f.active ? '#fff' : '#2F3437',
              border: f.active ? 'none' : '1px solid rgba(255,255,255,0.8)',
              cursor: 'pointer',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Section heading */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7B8589' }}>
            Ledige nå · 12 plasser
          </span>
          <button onClick={promptApp} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            fontSize: 12, fontWeight: 600, color: '#5FAFD3',
          }}>Se kart</button>
        </div>

        {/* Spot list — fills mid section */}
        <div style={{
          flex: 1, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10,
          overflow: 'hidden',
        }}>
          {spots.map((s) => (
            <button key={s.id} onClick={promptApp} style={{
              position: 'relative', overflow: 'hidden',
              borderRadius: 22,
              padding: '14px 16px',
              background: s.featured
                ? 'linear-gradient(135deg, #2F3437 0%, #111416 100%)'
                : 'rgba(255,255,255,0.72)',
              color: s.featured ? '#fff' : '#111416',
              border: s.featured ? 'none' : '1px solid rgba(255,255,255,0.8)',
              boxShadow: s.featured
                ? '0 14px 28px rgba(17,20,22,0.18)'
                : '0 6px 14px rgba(17,20,22,0.05)',
              backdropFilter: s.featured ? 'none' : 'blur(20px) saturate(140%)',
              WebkitBackdropFilter: s.featured ? 'none' : 'blur(20px) saturate(140%)',
              cursor: 'pointer', textAlign: 'left',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              {s.featured && (
                <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: 999, background: 'rgba(95,175,211,0.32)', filter: 'blur(40px)', top: -60, right: -50 }} />
              )}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: 999,
                      background: '#9FD6B4',
                      boxShadow: '0 0 0 3px rgba(159,214,180,0.25)',
                    }} />
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: s.featured ? 'rgba(255,255,255,0.7)' : '#7B8589',
                    }}>{s.until}</span>
                  </div>
                  <div style={{
                    marginTop: 4,
                    fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{s.address}</div>
                  <div style={{
                    marginTop: 2,
                    fontSize: 12, fontWeight: 500,
                    color: s.featured ? 'rgba(255,255,255,0.7)' : '#7B8589',
                  }}>{s.area} · {s.distance} · {s.walk} gange</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {s.tags.map((t) => (
                      <span key={t} style={{
                        height: 22, padding: '0 8px', borderRadius: 999,
                        display: 'inline-flex', alignItems: 'center',
                        fontSize: 10, fontWeight: 700, letterSpacing: '-0.01em',
                        background: s.featured ? 'rgba(255,255,255,0.14)' : 'rgba(17,20,22,0.06)',
                        color: s.featured ? 'rgba(255,255,255,0.85)' : '#2F3437',
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"' }}>{s.price}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: s.featured ? 'rgba(255,255,255,0.6)' : '#7B8589' }}>kr/t</span>
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: 999,
                    background: s.featured ? 'linear-gradient(135deg, #10B981 0%, #14B8A6 45%, #2563EB 100%)' : '#111416',
                    color: '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: s.featured ? '0 6px 14px rgba(37,99,235,0.4)' : '0 4px 10px rgba(17,20,22,0.2)',
                  }}>
                    <Icon name="arrow" size={14} color="#fff" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PrimaryButton
            full
            onClick={() => go('live')}
            icon={<Icon name="arrow" size={16} color="#fff" />}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 45%, #2563EB 100%)',
              boxShadow: '0 12px 28px rgba(37,99,235,0.34), 0 2px 6px rgba(17,20,22,0.08)',
            }}
          >
            Reserver Strandgaten 12
          </PrimaryButton>
        </div>
      </div>
    </AppBackground>
  );
}

// ────────────────────────────────────────────────────────────
// 2. LiveSpot — immersive "you've arrived" interactive screen
//    This is the marketing site's interactive demo.
// ────────────────────────────────────────────────────────────
function LiveSpotScreen({ go, density = 'roomy', demoPhase = null, promptApp = () => {} }) {
  const isCompact = density === 'compact';
  // Active parking session — interactive state
  const [totalMinutes, setTotalMinutes] = React.useState(150); // 2,5 t opprinnelig
  const [remainingMinutes, setRemainingMinutes] = React.useState(83); // 1t 23m igjen
  const [sheet, setSheet] = React.useState(null); // 'message' | 'end' | 'extend' | null
  const [toast, setToast] = React.useState(null);
  const [presetIdx, setPresetIdx] = React.useState(1); // selected reply preset
  const [extendIdx, setExtendIdx] = React.useState(1); // selected extend option
  const [messageSent, setMessageSent] = React.useState(false);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const progress = Math.max(0, Math.min(1, (totalMinutes - remainingMinutes) / totalMinutes));
  const remH = Math.floor(remainingMinutes / 60);
  const remM = remainingMinutes % 60;

  // End time derived from remaining minutes (assume "now" = 15:37 mock)
  const nowMinutes = 15 * 60 + 37;
  const endTotal = nowMinutes + remainingMinutes;
  const endsAt = `${String(Math.floor(endTotal / 60) % 24).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;

  // Circular timer ring math
  const ringSize = 168;
  const stroke = 10;
  const r = (ringSize - stroke) / 2;
  const C = 2 * Math.PI * r;
  const dash = C * (1 - progress);

  const replyPresets = [
    'Hei! Er det greit at jeg blir litt lenger?',
    'Tusen takk for plassen — alt går fint.',
    'Jeg er litt forsinket, kommer om 10 min.',
  ];
  const extendOptions = [
    { mins: 30, price: 22 },
    { mins: 60, price: 45 },
    { mins: 120, price: 90 },
  ];

  const closeSheet = () => setSheet(null);

  return (
    <AppBackground>
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        padding: `${isCompact ? 60 : 76}px 20px ${isCompact ? 24 : 36}px`,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconButton onClick={() => go('welcome')}><Icon name="arrow-left" size={20} /></IconButton>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7B8589', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Aktiv parkering</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111416', letterSpacing: '-0.01em' }}>Strandgaten 12</span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 999,
            background: 'rgba(159,214,180,0.22)',
            border: '1px solid rgba(159,214,180,0.4)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#3FA66B', boxShadow: '0 0 0 3px rgba(63,166,107,0.2)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1F6B47', letterSpacing: '-0.01em' }}>Parkert</span>
          </div>
        </div>

        {/* Hero countdown card */}
        <div style={{
          marginTop: 18,
          position: 'relative', overflow: 'hidden',
          borderRadius: 28, padding: '22px 22px 24px',
          background: 'linear-gradient(135deg, #2F3437 0%, #111416 100%)',
          color: '#fff',
          boxShadow: '0 22px 44px rgba(17,20,22,0.22)',
        }}>
          <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: 999, background: 'rgba(95,175,211,0.32)', filter: 'blur(50px)', top: -80, right: -70 }} />
          <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: 999, background: 'rgba(159,214,180,0.22)', filter: 'blur(45px)', bottom: -60, left: -40 }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Ring + numbers */}
            <div style={{ position: 'relative', width: ringSize, height: ringSize, flexShrink: 0 }}>
              <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={ringSize/2} cy={ringSize/2} r={r} stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} fill="none" />
                <circle
                  cx={ringSize/2} cy={ringSize/2} r={r}
                  stroke="#9FD6B4" strokeWidth={stroke} fill="none"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={dash}
                  style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.2,.7,.2,1)' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Igjen</span>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 3, fontFeatureSettings: '"tnum"' }}>
                  <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em' }}>{remH}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>t</span>
                  <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginLeft: 2 }}>{remM}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>m</span>
                </div>
              </div>
            </div>

            {/* Detail column */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Slutt</div>
                <div style={{ marginTop: 2, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"' }}>{endsAt}</div>
              </div>
              <button onClick={() => setSheet('extend')} style={{
                marginTop: 2,
                height: 36, padding: '0 14px', borderRadius: 999,
                background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 45%, #2563EB 100%)',
                color: '#fff', border: 'none',
                font: '700 12px/1 Inter, system-ui, sans-serif', letterSpacing: '-0.01em',
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 8px 18px rgba(37,99,235,0.34)',
                alignSelf: 'flex-start',
              }}>
                <Icon name="zap" size={12} color="#fff" />
                Forleng tid
              </button>
            </div>
          </div>
        </div>

        {/* Host (utleier) card */}
        <div style={{
          marginTop: 12,
          padding: '12px 14px',
          borderRadius: 22,
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(255,255,255,0.8)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          boxShadow: '0 6px 14px rgba(17,20,22,0.05)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 999,
            background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 45%, #2563EB 100%)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: '#fff', fontSize: 13,
            border: '2px solid rgba(255,255,255,0.85)',
            flexShrink: 0,
          }}>SH</div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7B8589' }}>Utleier</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111416', letterSpacing: '-0.01em' }}>Sondre H.</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#7B8589', marginTop: 2 }}>4,9 ★ · svarer typisk på 3 min</span>
          </div>
          <button onClick={() => { setMessageSent(false); setSheet('message'); }} style={{
            height: 38, padding: '0 14px', borderRadius: 999,
            background: '#111416', color: '#fff', border: 'none',
            font: '700 12px/1 Inter, system-ui, sans-serif', letterSpacing: '-0.01em',
            cursor: 'pointer', flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: '0 6px 14px rgba(17,20,22,0.22)',
          }}>
            <Icon name="bell" size={13} color="#fff" />
            Send melding
          </button>
        </div>

        {/* Action grid — fills remaining space */}
        <div style={{
          flex: 1, marginTop: 12,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          {[
            { id: 'nav',   icon: 'map-pin', label: 'Naviger',     hint: 'Åpne i kart' },
            { id: 'photo', icon: 'camera',  label: 'Bevis',       hint: 'Foto av plassen' },
            { id: 'rules', icon: 'shield',  label: 'Husregler',   hint: 'Vis betingelser' },
            { id: 'help',  icon: 'layers',  label: 'Få hjelp',    hint: 'Parkno-support' },
          ].map((a) => (
            <button key={a.id} onClick={promptApp} style={{
              minHeight: 0,
              padding: '14px 14px',
              borderRadius: 22,
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(255,255,255,0.8)',
              backdropFilter: 'blur(20px) saturate(140%)',
              WebkitBackdropFilter: 'blur(20px) saturate(140%)',
              boxShadow: '0 4px 12px rgba(17,20,22,0.04)',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
              textAlign: 'left',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 999, background: '#111416',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={a.icon} size={15} color="#fff" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111416', letterSpacing: '-0.01em' }}>{a.label}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#7B8589' }}>{a.hint}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom — end parking */}
        <button onClick={() => setSheet('end')} style={{
          marginTop: 12,
          height: 52, borderRadius: 999,
          background: 'rgba(37,99,235,0.10)',
          border: '1px solid rgba(37,99,235,0.4)',
          color: '#1E40AF',
          font: '700 14px/1 Inter, system-ui, sans-serif', letterSpacing: '-0.01em',
          cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Icon name="x" size={14} color="#1E40AF" />
          Avslutt parkering
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', top: 28, left: 0, right: 0, zIndex: 60,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            padding: '10px 16px', borderRadius: 999,
            background: 'rgba(17,20,22,0.92)', color: '#fff',
            font: '600 12px/1 Inter, system-ui, sans-serif', letterSpacing: '-0.01em',
            boxShadow: '0 12px 28px rgba(17,20,22,0.3)',
          }}>{toast}</div>
        </div>
      )}

      {/* Bottom sheet overlay */}
      {sheet && (
        <div onClick={closeSheet} style={{
          position: 'absolute', inset: 0, zIndex: 70,
          background: 'rgba(17,20,22,0.45)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%',
            background: '#F8FAF7', color: '#111416',
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: '16px 18px 22px',
            boxShadow: '0 -20px 40px rgba(17,20,22,0.18)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            <div style={{
              width: 40, height: 4, borderRadius: 999,
              background: 'rgba(17,20,22,0.18)', margin: '0 auto 14px',
            }} />

            {sheet === 'message' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7B8589' }}>Til utleier · Sondre H.</div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4 }}>Send melding</div>

                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {replyPresets.map((p, i) => {
                    const on = i === presetIdx;
                    return (
                      <button key={i} onClick={() => setPresetIdx(i)} style={{
                        textAlign: 'left',
                        padding: '12px 14px', borderRadius: 16,
                        background: on ? '#111416' : 'rgba(17,20,22,0.04)',
                        color: on ? '#fff' : '#111416',
                        border: on ? 'none' : '1px solid rgba(17,20,22,0.06)',
                        font: '600 13px/1.4 Inter, system-ui, sans-serif',
                        letterSpacing: '-0.01em', cursor: 'pointer',
                      }}>{p}</button>
                    );
                  })}
                </div>

                {messageSent ? (
                  <div style={{
                    marginTop: 14, padding: '10px 14px', borderRadius: 14,
                    background: 'rgba(63,166,107,0.14)', color: '#1F6B47',
                    border: '1px solid rgba(63,166,107,0.3)',
                    font: '700 13px/1 Inter, system-ui, sans-serif',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}>
                    <Icon name="shield" size={13} color="#1F6B47" />
                    Sendt — Sondre er varslet
                  </div>
                ) : null}

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={closeSheet} style={{
                    flex: 1, height: 48, borderRadius: 999,
                    background: 'transparent', border: '1px solid rgba(17,20,22,0.12)',
                    color: '#2F3437', font: '700 14px/1 Inter, system-ui, sans-serif',
                    cursor: 'pointer',
                  }}>Avbryt</button>
                  <button onClick={() => {
                    setMessageSent(true);
                    setToast('Melding sendt til Sondre H.');
                    setTimeout(closeSheet, 800);
                  }} style={{
                    flex: 2, height: 48, borderRadius: 999,
                    background: '#111416', color: '#fff', border: 'none',
                    font: '700 14px/1 Inter, system-ui, sans-serif', cursor: 'pointer',
                    boxShadow: '0 8px 18px rgba(17,20,22,0.22)',
                  }}>Send melding</button>
                </div>
              </div>
            )}

            {sheet === 'extend' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7B8589' }}>Forleng parkering</div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4 }}>Hvor mye lenger?</div>
                <div style={{ fontSize: 12, color: '#7B8589', marginTop: 4 }}>Slutt nå: {endsAt}</div>

                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {extendOptions.map((opt, i) => {
                    const on = i === extendIdx;
                    return (
                      <button key={i} onClick={() => setExtendIdx(i)} style={{
                        padding: '14px 10px', borderRadius: 18,
                        background: on ? '#111416' : 'rgba(17,20,22,0.04)',
                        color: on ? '#fff' : '#111416',
                        border: on ? 'none' : '1px solid rgba(17,20,22,0.06)',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}>
                        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
                          {opt.mins >= 60 ? `${opt.mins / 60} t` : `${opt.mins} min`}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: on ? 'rgba(255,255,255,0.7)' : '#7B8589' }}>+{opt.price} kr</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={closeSheet} style={{
                    flex: 1, height: 48, borderRadius: 999,
                    background: 'transparent', border: '1px solid rgba(17,20,22,0.12)',
                    color: '#2F3437', font: '700 14px/1 Inter, system-ui, sans-serif',
                    cursor: 'pointer',
                  }}>Avbryt</button>
                  <button onClick={() => {
                    const opt = extendOptions[extendIdx];
                    setRemainingMinutes((m) => m + opt.mins);
                    setTotalMinutes((t) => t + opt.mins);
                    setToast(`Forlenget med ${opt.mins >= 60 ? `${opt.mins / 60} t` : `${opt.mins} min`}`);
                    closeSheet();
                  }} style={{
                    flex: 2, height: 48, borderRadius: 999,
                    background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 45%, #2563EB 100%)',
                    color: '#fff', border: 'none',
                    font: '800 14px/1 Inter, system-ui, sans-serif', cursor: 'pointer',
                    boxShadow: '0 10px 22px rgba(37,99,235,0.36)',
                  }}>Bekreft +{extendOptions[extendIdx].price} kr</button>
                </div>
              </div>
            )}

            {sheet === 'end' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1E40AF' }}>Avslutt nå</div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4 }}>Avslutte parkering?</div>
                <p style={{ fontSize: 13, color: '#2F3437', margin: '8px 0 0', lineHeight: 1.45 }}>
                  Du har {remH}t {remM}m igjen. Vi avslutter sesjonen og sender kvittering.
                </p>

                <div style={{
                  marginTop: 14, padding: '12px 14px', borderRadius: 16,
                  background: 'rgba(17,20,22,0.04)', border: '1px solid rgba(17,20,22,0.06)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#7B8589', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Å betale</span>
                  <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', fontFeatureSettings: '"tnum"' }}>112 kr</span>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={closeSheet} style={{
                    flex: 1, height: 48, borderRadius: 999,
                    background: 'transparent', border: '1px solid rgba(17,20,22,0.12)',
                    color: '#2F3437', font: '700 14px/1 Inter, system-ui, sans-serif',
                    cursor: 'pointer',
                  }}>Behold</button>
                  <button onClick={() => {
                    setToast('Parkering avsluttet · kvittering på vei');
                    closeSheet();
                    setTimeout(() => go('host'), 800);
                  }} style={{
                    flex: 2, height: 48, borderRadius: 999,
                    background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 45%, #2563EB 100%)',
                    color: '#fff', border: 'none',
                    font: '800 14px/1 Inter, system-ui, sans-serif', cursor: 'pointer',
                    boxShadow: '0 10px 22px rgba(37,99,235,0.32)',
                  }}>Avslutt og betal</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppBackground>
  );
}

// ────────────────────────────────────────────────────────────
// 3. Host — earnings dashboard (sells the host product)
// ────────────────────────────────────────────────────────────
function HostScreen({ go, density = 'roomy', promptApp = () => {} }) {
  const isCompact = density === 'compact';
  const [period, setPeriod] = React.useState('week');

  const periods = [
    { id: 'week',  label: 'Uke',   heading: 'denne uken',    value: '1 240',  total: '4 820 kr / måned' },
    { id: 'month', label: 'Måned', heading: 'denne måneden', value: '4 820',  total: '54 600 kr / år' },
    { id: 'year',  label: 'År',    heading: 'i år',          value: '54 600', total: '4 utleiere i ditt nabolag' },
  ];
  const cur = periods.find(p => p.id === period);

  return (
    <AppBackground>
      <div style={{ padding: `${isCompact ? 60 : 70}px 20px ${isCompact ? 28 : 40}px`, display: 'flex', flexDirection: 'column', gap: isCompact ? 18 : 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton onClick={() => go('welcome')}><Icon name="arrow-left" size={20} /></IconButton>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111416', letterSpacing: '-0.01em' }}>Utleier</div>
          <IconButton onClick={promptApp}><Icon name="bell" size={18} /></IconButton>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7B8589' }}>
            Inntekt · {cur.heading}
          </div>
          <h1 style={{
            font: `700 ${isCompact ? 36 : 42}px/1.02 Inter, system-ui, sans-serif`,
            letterSpacing: '-0.03em', color: '#111416', margin: '6px 0 0',
            fontFeatureSettings: '"tnum"',
          }}>{cur.value} kr<br/><span style={{ color: '#7B8589', fontWeight: 600 }}>{cur.heading}.</span></h1>
        </div>

        {/* period switcher */}
        <div style={{ display: 'flex', gap: 6 }}>
          {periods.map(p => {
            const on = p.id === period;
            return (
              <button key={p.id} onClick={() => setPeriod(p.id)} style={{
                flex: 1, height: 38, borderRadius: 999,
                background: on ? '#111416' : 'rgba(255,255,255,0.7)',
                color: on ? '#fff' : '#111416',
                backdropFilter: on ? 'none' : 'blur(18px)',
                WebkitBackdropFilter: on ? 'none' : 'blur(18px)',
                border: on ? 'none' : '1px solid rgba(255,255,255,0.7)',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                letterSpacing: '-0.01em',
              }}>{p.label}</button>
            );
          })}
        </div>

        {/* big dark earning card */}
        <div style={{
          borderRadius: 34, padding: isCompact ? 18 : 22, color: '#fff',
          background: 'linear-gradient(135deg, #2F3437 0%, #111416 100%)',
          boxShadow: '0 24px 48px rgba(17,20,22,0.18)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: 999, background: 'rgba(95,175,211,0.32)', filter: 'blur(50px)', top: -70, right: -70 }} />
          <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: 999, background: 'rgba(159,214,180,0.22)', filter: 'blur(40px)', bottom: -40, left: -30 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Trend · {cur.total}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
              <span style={{
                fontSize: isCompact ? 38 : 46, fontWeight: 800, letterSpacing: '-0.03em',
                fontFeatureSettings: '"tnum"',
              }}>{cur.value}</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}>kr</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: isCompact ? 14 : 20, alignItems: 'flex-end', height: isCompact ? 48 : 64 }}>
            {[36, 48, 22, 60, 44, 86, 52].map((h, i) => (
              <div key={i} style={{
                flex: 1, height: `${h}%`, borderRadius: 6,
                background: i === 5 ? '#9FD6B4' : 'rgba(255,255,255,0.22)',
                transition: 'height 380ms cubic-bezier(.2,.7,.2,1)',
              }}/>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontFeatureSettings: '"tnum"' }}>
            {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', color: i === 5 ? '#9FD6B4' : 'rgba(255,255,255,0.5)' }}>{d}</div>
            ))}
          </div>
        </div>

        <ParkingRow title="Innkjørsel · Møhlenpris" sub="Aktiv · 8 reservasjoner" price="45"
          onClick={() => go('edit', { spot: 'mohlenpris' })} />
        <ParkingRow title="Garasje · Sandviken" sub="Pause · gjenoppta" price="75"
          onClick={() => go('edit', { spot: 'sandviken' })} />

        <HostCTAButton full onClick={() => go('welcome')}>Lei ut en plass til</HostCTAButton>
      </div>
    </AppBackground>
  );
}

// ────────────────────────────────────────────────────────────
// 4. Rewards — premium 3-zone light-scan reward reveal
//    Tap → a bright beam scans green / yellow / red, accelerates,
//    decelerates dramatically, and lands on the weighted outcome.
//
//    REWARD_TIERS + the weights below are the single source of truth.
//    pickRewardOutcome() and the award step are DEMO client logic:
//    this site has no backend. When one exists, replace pickRewardOutcome()
//    with a server draw and award points server-side (see ONBOARDING notes).
// ────────────────────────────────────────────────────────────

// Visual order is left → right. weight = probability (sums to 1).
const REWARD_TIERS = [
  { id: 'green',  points: 1000, weight: 0.10, label: 'Toppgevinst', tag: 'Sjelden',
    accent: '#34D399', soft: '52,211,153' },
  { id: 'yellow', points: 300,  weight: 0.30, label: 'Bonus',       tag: 'Vanlig',
    accent: '#FBBF24', soft: '251,191,36' },
  { id: 'red',    points: 50,   weight: 0.60, label: 'Startpoeng',  tag: 'Oftest',
    accent: '#FB7185', soft: '251,113,133' },
];

// DEMO ONLY — weighted client-side draw.
// Replace with e.g.  const tier = await api.drawReward()  when a backend exists,
// and award the points on the server so the client cannot be trusted.
function pickRewardOutcome() {
  const r = Math.random();
  let acc = 0;
  for (const tier of REWARD_TIERS) {
    acc += tier.weight;
    if (r <= acc) return tier;
  }
  return REWARD_TIERS[REWARD_TIERS.length - 1];
}

// Optional Higgsfield ambient master. Drop these files into /assets to enable a
// cinematic loop behind the idle state — the DOM scene below always drives the
// actual (deterministic) outcome, so the page works with or without the video.
const REVEAL_VIDEO = {
  webm: 'assets/rewards-reveal-master.webm',
  mp4: 'assets/rewards-reveal-master.mp4',
  poster: 'assets/rewards-reveal-poster.png',
};

// Build the beam timing: fast constant flashes, then an eased decel tail.
// The number of steps is tuned so the final lit zone === the chosen tier.
function buildScanSequence(targetIdx) {
  const FAST_COUNT = 21;
  const FAST_MS = 68;
  const SLOW_COUNT = 13;
  const delays = [];
  for (let i = 0; i < FAST_COUNT; i++) delays.push(FAST_MS);
  for (let i = 0; i < SLOW_COUNT; i++) {
    const t = (i + 1) / SLOW_COUNT;
    const eased = Math.pow(t, 2.4);              // dramatic ease-out
    delays.push(Math.round(88 + eased * (560 - 88)));
  }
  // highlight at step n === n % 3; pad the head so the last step lands on target
  const landing = (delays.length - 1) % REWARD_TIERS.length;
  const pad = ((targetIdx - landing) % REWARD_TIERS.length + REWARD_TIERS.length) % REWARD_TIERS.length;
  for (let k = 0; k < pad; k++) delays.unshift(FAST_MS);
  return { delays, slowFrom: delays.length - SLOW_COUNT };
}

function RewardsScreen({ go, density = 'roomy', promptApp = () => {} }) {
  const isCompact = density === 'compact';
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // State machine: idle → starting → flashing → slowing → revealed → awarded
  const [status, setStatus] = React.useState('idle');
  const [highlight, setHighlight] = React.useState(-1);
  const [stepMs, setStepMs] = React.useState(68);
  const [outcome, setOutcome] = React.useState(null);
  const [shownPoints, setShownPoints] = React.useState(0);
  // DEMO points wallet — swap for the app's real points store when available.
  const [balance, setBalance] = React.useState(250);
  const [videoOk, setVideoOk] = React.useState(true);

  const timersRef = React.useRef([]);
  const rafRef = React.useRef(0);
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };
  React.useEffect(() => clearTimers, []);

  // Inject keyframes once.
  React.useEffect(() => {
    const id = 'parkno-rewards-kf';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent =
      '@keyframes pkBeamFlick{0%,100%{opacity:.9}50%{opacity:1}}' +
      '@keyframes pkBurst{0%{opacity:.9;transform:scale(.3)}70%{opacity:.5}100%{opacity:0;transform:scale(2.4)}}' +
      '@keyframes pkRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}' +
      '@keyframes pkWinPulse{0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,.10),0 18px 44px rgba(0,0,0,.5)}50%{box-shadow:0 0 0 1px rgba(255,255,255,.18),0 0 30px var(--pk-win)}}';
    document.head.appendChild(el);
  }, []);

  const countUp = (to) => {
    const start = performance.now();
    const dur = 760;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setShownPoints(Math.round(eased * to));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const finish = (tier) => {
    setStatus('revealed');
    setHighlight(REWARD_TIERS.indexOf(tier));
    countUp(tier.points);
  };

  const reveal = () => {
    if (status !== 'idle' && status !== 'revealed' && status !== 'awarded') return;
    clearTimers();
    setShownPoints(0);

    // ── Server boundary: replace pickRewardOutcome() with a verified draw ──
    const tier = pickRewardOutcome();
    setOutcome(tier);
    const targetIdx = REWARD_TIERS.indexOf(tier);

    if (reduceMotion) {
      // Accessible fallback: no flashing — gentle settle on the winner.
      setStatus('revealed');
      setHighlight(targetIdx);
      countUp(tier.points);
      return;
    }

    setStatus('starting');
    setHighlight(-1);
    timersRef.current.push(setTimeout(() => {
      setStatus('flashing');
      const { delays, slowFrom } = buildScanSequence(targetIdx);
      let step = 0;
      const run = () => {
        setHighlight(step % REWARD_TIERS.length);
        setStepMs(delays[step]);
        if (step === slowFrom) setStatus('slowing');
        if (step >= delays.length - 1) {
          timersRef.current.push(setTimeout(() => finish(tier), 420));
          return;
        }
        const d = delays[step];
        step += 1;
        timersRef.current.push(setTimeout(run, d));
      };
      run();
    }, 280));
  };

  const claim = () => {
    if (status !== 'revealed' || !outcome) return;
    // DEMO award. With a backend, the server adds the points; the client only
    // reflects the returned balance.
    setBalance((b) => b + outcome.points);
    setStatus('awarded');
  };

  const replay = () => {
    clearTimers();
    setOutcome(null);
    setHighlight(-1);
    setShownPoints(0);
    setStatus('idle');
  };

  const scanning = status === 'flashing' || status === 'slowing';
  const beamPos = ['16.667%', '50%', '83.333%'];

  const Zone = ({ tier, idx }) => {
    const active = highlight === idx && (scanning || status === 'starting');
    const isWinner = (status === 'revealed' || status === 'awarded') && outcome && outcome.id === tier.id;
    const dimmed = (status === 'revealed' || status === 'awarded') && !isWinner;
    const lit = active || isWinner;
    return (
      <div style={{
        flex: 1, position: 'relative', borderRadius: 22,
        padding: isCompact ? '18px 8px' : '22px 8px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        background: lit
          ? `linear-gradient(180deg, rgba(${tier.soft},0.30) 0%, rgba(${tier.soft},0.08) 100%)`
          : 'rgba(255,255,255,0.045)',
        border: `1px solid ${lit ? tier.accent + '88' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isWinner
          ? `0 0 0 1px ${tier.accent}66, 0 0 34px rgba(${tier.soft},0.55)`
          : active
            ? `0 0 26px rgba(${tier.soft},0.5)`
            : 'inset 0 1px 1px rgba(255,255,255,0.04)',
        opacity: dimmed ? 0.4 : 1,
        transform: isWinner ? 'translateY(-4px) scale(1.04)' : 'none',
        transition: 'background 220ms ease, border-color 220ms ease, box-shadow 260ms ease, opacity 360ms ease, transform 420ms cubic-bezier(.2,.7,.2,1)',
        ...(isWinner ? { ['--pk-win']: `rgba(${tier.soft},0.55)`, animation: reduceMotion ? 'none' : 'pkWinPulse 1.8s ease-in-out infinite' } : {}),
      }}>
        <div style={{
          width: isCompact ? 30 : 34, height: isCompact ? 30 : 34, borderRadius: 999,
          background: lit ? tier.accent : `rgba(${tier.soft},0.18)`,
          boxShadow: lit ? `0 0 16px ${tier.accent}, 0 0 30px rgba(${tier.soft},0.6)` : 'none',
          transition: 'background 200ms ease, box-shadow 200ms ease',
        }} />
        <span style={{
          fontSize: isCompact ? 19 : 22, fontWeight: 800, letterSpacing: '-0.02em',
          color: lit ? '#fff' : 'rgba(255,255,255,0.55)', fontFeatureSettings: '"tnum"',
          transition: 'color 200ms ease',
        }}>{tier.points}</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: lit ? tier.accent : 'rgba(255,255,255,0.35)', transition: 'color 200ms ease' }}>
          {tier.label}
        </span>
        {isWinner && !reduceMotion && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 22, pointerEvents: 'none',
            background: `radial-gradient(circle at 50% 45%, rgba(${tier.soft},0.5), transparent 70%)`,
            animation: 'pkBurst 900ms ease-out 1 forwards',
          }} />
        )}
      </div>
    );
  };

  const statusLabel = status === 'starting' ? 'Klargjør …'
    : status === 'flashing' ? 'Trekker …'
    : status === 'slowing' ? 'Nesten der …' : '';

  return (
    <AppBackground>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 80% at 70% 18%, #2B2F45 0%, #16181F 55%, #0C0D11 100%)',
      }} />
      {/* Optional Higgsfield ambient loop (idle only). Falls back silently. */}
      {videoOk && status === 'idle' && !reduceMotion && (
        <video
          autoPlay muted loop playsInline preload="none"
          poster={REVEAL_VIDEO.poster}
          onError={() => setVideoOk(false)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: 0.28, pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
        >
          <source src={REVEAL_VIDEO.webm} type="video/webm" />
          <source src={REVEAL_VIDEO.mp4} type="video/mp4" />
        </video>
      )}

      <div style={{
        position: 'relative', zIndex: 1,
        height: '100%', display: 'flex', flexDirection: 'column',
        padding: `${isCompact ? 60 : 76}px 20px ${isCompact ? 24 : 36}px`,
        color: '#fff',
      }}>
        {/* Header + live balance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconButton onClick={() => go('welcome')} dark style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </IconButton>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Parkno-fordeler</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Din belønning</span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <Icon name="star" size={13} color="#FBBF24" fill="#FBBF24" strokeWidth={0} />
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em', fontFeatureSettings: '"tnum"' }}>
              {balance}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>poeng</span>
          </div>
        </div>

        {/* Stage */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              {status === 'idle' ? 'Daglig trekning'
                : scanning || status === 'starting' ? statusLabel
                : 'Resultat'}
            </span>
          </div>

          {/* Beam track + three zones */}
          <div style={{ position: 'relative' }}>
            {(scanning || status === 'starting') && (
              <div style={{
                position: 'absolute', top: -10, bottom: -10,
                left: beamPos[Math.max(0, highlight)],
                width: 4, marginLeft: -2, borderRadius: 999,
                background: 'linear-gradient(180deg, rgba(255,255,255,0), #fff 50%, rgba(255,255,255,0))',
                boxShadow: '0 0 18px rgba(255,255,255,0.9), 0 0 42px rgba(120,200,255,0.6)',
                opacity: highlight < 0 ? 0 : 1,
                transition: `left ${Math.max(60, stepMs)}ms cubic-bezier(.3,.1,.3,1), opacity 200ms ease`,
                animation: 'pkBeamFlick 220ms steps(2) infinite',
                pointerEvents: 'none', zIndex: 3,
              }} />
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              {REWARD_TIERS.map((tier, idx) => (
                <Zone key={tier.id} tier={tier} idx={idx} />
              ))}
            </div>
          </div>

          <p style={{
            textAlign: 'center', margin: 0, padding: '0 14px',
            fontSize: 12, fontWeight: 500, lineHeight: 1.5, color: 'rgba(255,255,255,0.45)',
          }}>
            {status === 'idle'
              ? 'Du parkerte 5 ganger denne måneden. Trekk dagens belønning.'
              : status === 'revealed' || status === 'awarded'
                ? 'Belønningen er klar.'
                : 'Lyset finner belønningen din …'}
          </p>
        </div>

        {/* Action zone */}
        <div style={{ minHeight: isCompact ? 150 : 170, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {(status === 'idle') && (
            <PrimaryButton
              full
              onClick={reveal}
              icon={<Icon name="zap" size={16} color="#fff" />}
              style={{
                background: 'linear-gradient(135deg, #34D399 0%, #14B8A6 55%, #2563EB 100%)',
                boxShadow: '0 14px 30px rgba(20,184,166,0.36)',
              }}
            >
              Avslør belønning
            </PrimaryButton>
          )}

          {(status === 'starting' || scanning) && (
            <PrimaryButton full disabled icon={<Icon name="zap" size={16} color="#fff" />}>
              {statusLabel}
            </PrimaryButton>
          )}

          {status === 'revealed' && outcome && (
            <div style={{ animation: reduceMotion ? 'none' : 'pkRise 460ms cubic-bezier(.2,.7,.2,1) both' }}>
              <div style={{
                borderRadius: 24, padding: '16px 18px',
                background: `linear-gradient(135deg, rgba(${outcome.soft},0.18) 0%, rgba(${outcome.soft},0.05) 100%)`,
                border: `1px solid rgba(${outcome.soft},0.34)`,
                boxShadow: '0 16px 38px rgba(0,0,0,0.45)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: outcome.accent,
                    boxShadow: `0 0 0 4px rgba(${outcome.soft},0.22)` }} />
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: outcome.accent }}>
                    {outcome.tag} · {outcome.label}
                  </span>
                </div>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', fontFeatureSettings: '"tnum"' }}>
                    {shownPoints}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>poeng</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                  Du vant {outcome.points} poeng.
                </p>
              </div>
              <PrimaryButton
                full
                onClick={claim}
                icon={<Icon name="check" size={16} color="#fff" />}
                style={{
                  marginTop: 10,
                  background: `linear-gradient(135deg, ${outcome.accent} 0%, #14B8A6 60%, #2563EB 100%)`,
                  boxShadow: `0 14px 30px rgba(${outcome.soft},0.4)`,
                }}
              >
                Krev belønningen
              </PrimaryButton>
            </div>
          )}

          {status === 'awarded' && outcome && (
            <div style={{ animation: reduceMotion ? 'none' : 'pkRise 420ms cubic-bezier(.2,.7,.2,1) both' }}>
              <div style={{
                borderRadius: 24, padding: '16px 18px',
                background: 'linear-gradient(135deg, rgba(52,211,153,0.16) 0%, rgba(52,211,153,0.05) 100%)',
                border: '1px solid rgba(52,211,153,0.32)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 999, flexShrink: 0,
                  background: 'rgba(52,211,153,0.22)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="check" size={18} color="#34D399" />
                </div>
                <div style={{ flex: 1, lineHeight: 1.3 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em', color: '#fff' }}>
                    {outcome.points} poeng lagt til
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                    Ny saldo: {balance} poeng
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={replay} style={{
                  flex: 1, height: 52, borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
                  color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
                  font: '700 14px/1 Inter, system-ui, sans-serif', letterSpacing: '-0.01em',
                }}>Spill igjen</button>
                <PrimaryButton
                  onClick={promptApp}
                  icon={<Icon name="arrow" size={16} color="#fff" />}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #34D399 0%, #14B8A6 55%, #2563EB 100%)',
                    boxShadow: '0 14px 30px rgba(20,184,166,0.34)',
                  }}
                >
                  Fortsett
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppBackground>
  );
}

// ────────────────────────────────────────────────────────────
// 5. Edit space — the "Prishelse" (price health) metric
//
//    Metric definition (defensible, not arbitrary):
//      fill(p)    = expected weekly occupancy 0..1, linear demand that
//                   decays from `floor` (≈full) to `ceiling` (≈empty).
//      revenue(p) = p · fill(p)            — what the host actually earns.
//      score      = 100 · revenue(p) / max_q revenue(q)
//                   i.e. how close this price is to the revenue-optimal
//                   price for the spot. 100 = leaving nothing on the table.
//
//    The shape naturally separates the two failure modes the host cares
//    about: priced below optimum → full but underpaid ("for lav"),
//    priced above optimum → empty ("for høy"). One number, both stories.
// ────────────────────────────────────────────────────────────

// Per-spot demand band. `optimal` is derived numerically so the copy and
// the gauge always agree with the model — never hand-tuned.
const SPACE_SPOTS = {
  mohlenpris: { id: 'mohlenpris', title: 'Innkjørsel · Møhlenpris', sub: 'Aktiv · 8 reservasjoner', price: 45, floor: 18, ceiling: 104 },
  sandviken:  { id: 'sandviken',  title: 'Garasje · Sandviken',     sub: 'Pause · gjenoppta',       price: 75, floor: 30, ceiling: 120 },
};

function spotFill(spot, p) {
  const t = (p - spot.floor) / (spot.ceiling - spot.floor);
  return Math.max(0.04, Math.min(1, 1 - t));
}
function spotRevenue(spot, p) {
  return p * spotFill(spot, p);
}
// Sample the curve to find the revenue-optimal price + its revenue.
function spotOptimal(spot) {
  let best = { price: spot.floor, rev: 0 };
  for (let p = spot.floor; p <= spot.ceiling; p += 1) {
    const rev = spotRevenue(spot, p);
    if (rev > best.rev) best = { price: p, rev };
  }
  return best;
}
function priceHealth(spot, price) {
  const opt = spotOptimal(spot);
  const score = Math.round(100 * Math.min(1, spotRevenue(spot, price) / opt.rev));
  const side = price < opt.price ? 'low' : 'high';
  let zone;
  if (score >= 92) zone = {
    key: 'perfect', color: '#10B981', soft: '16,185,129',
    title: 'Perfekt pris', note: 'Maks inntekt for området akkurat nå.' };
  else if (score >= 78) zone = {
    key: 'good', color: '#34D399', soft: '52,211,153',
    title: 'Bra pris', note: 'Tett på det optimale — lite å hente.' };
  else if (score >= 55) zone = side === 'low'
    ? { key: 'low', color: '#F59E0B', soft: '245,158,11',
        title: 'Litt lav', note: 'Du kan ta mer uten å miste bookinger.' }
    : { key: 'high', color: '#F59E0B', soft: '245,158,11',
        title: 'Litt høy', note: 'Noen vil velge en billigere plass.' };
  else zone = side === 'low'
    ? { key: 'tooLow', color: '#FB7185', soft: '251,113,133',
        title: 'For lav', note: 'Du gir bort inntekt hver uke.' }
    : { key: 'tooHigh', color: '#FB7185', soft: '251,113,133',
        title: 'For høy', note: 'Plassen blir stående tom.' };
  return { score, zone, side, optimal: opt.price, fill: spotFill(spot, price), revenue: spotRevenue(spot, price) };
}

// Animated 180° segmented arc. Sweeps lit ticks up to `value`, recolouring
// to the live zone, and eases between values when the price changes.
function PriceHealthGauge({ value, color, soft, label, sub }) {
  const TICKS = 44;
  const [shown, setShown] = React.useState(0);
  const rafRef = React.useRef(0);
  const fromRef = React.useRef(0);
  React.useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const reduce = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = fromRef.current;
    const to = value;
    if (reduce) { fromRef.current = to; setShown(to); return; }
    const start = performance.now();
    const dur = 720;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (to - from) * eased;
      setShown(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  const W = 260, H = 150, cx = W / 2, cy = 138, R = 112;
  const litCount = (shown / 100) * TICKS;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}
      role="img" aria-label={`Prishelse ${Math.round(value)} av 100`}>
      {Array.from({ length: TICKS }).map((_, i) => {
        const a = Math.PI + (i / (TICKS - 1)) * Math.PI; // 180° → 360°
        const x1 = cx + Math.cos(a) * (R - 16);
        const y1 = cy + Math.sin(a) * (R - 16);
        const x2 = cx + Math.cos(a) * R;
        const y2 = cy + Math.sin(a) * R;
        const lit = i < Math.floor(litCount);
        const edge = i === Math.floor(litCount) && litCount % 1 > 0;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={lit || edge ? color : 'rgba(255,255,255,0.12)'}
            strokeOpacity={edge ? (litCount % 1) : 1}
            strokeWidth={lit || edge ? 6 : 5} strokeLinecap="round"
            style={{
              transition: 'stroke 260ms ease',
              filter: lit ? `drop-shadow(0 0 5px rgba(${soft},0.65))` : 'none',
            }} />
        );
      })}
      <text x={cx} y={cy - 34} textAnchor="middle"
        style={{ font: '800 38px Inter, system-ui, sans-serif', letterSpacing: '-0.03em' }}
        fill="#fff">{Math.round(shown)}<tspan style={{ font: '600 15px Inter' }} fill="rgba(255,255,255,0.5)"> /100</tspan></text>
      <text x={cx} y={cy - 12} textAnchor="middle"
        style={{ font: '700 13px Inter, system-ui, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}
        fill={color}>{label}</text>
      {sub && <text x={cx} y={cy + 6} textAnchor="middle"
        style={{ font: '500 11px Inter, system-ui, sans-serif' }}
        fill="rgba(255,255,255,0.55)">{sub}</text>}
    </svg>
  );
}

function EditSpaceScreen({ go, density = 'roomy', routeParams }) {
  const isCompact = density === 'compact';
  const spot = SPACE_SPOTS[(routeParams && routeParams.spot)] || SPACE_SPOTS.mohlenpris;
  const [price, setPrice] = React.useState(spot.price);
  const min = Math.max(5, spot.floor - 5);
  const max = spot.ceiling - 4;
  const h = priceHealth(spot, price);

  return (
    <AppBackground>
      <div style={{ padding: `${isCompact ? 60 : 70}px 20px ${isCompact ? 28 : 40}px`, display: 'flex', flexDirection: 'column', gap: isCompact ? 16 : 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton onClick={() => go('host')}><Icon name="arrow-left" size={20} /></IconButton>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111416', letterSpacing: '-0.01em' }}>Rediger plass</div>
          <div style={{ width: 44 }} />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7B8589' }}>{spot.sub}</div>
          <h1 style={{ font: `700 ${isCompact ? 24 : 28}px/1.1 Inter, system-ui, sans-serif`, letterSpacing: '-0.02em', color: '#111416', margin: '6px 0 0' }}>{spot.title}</h1>
        </div>

        {/* Prishelse — dark card matching the earnings card */}
        <div style={{
          borderRadius: 34, padding: isCompact ? 18 : 22, color: '#fff',
          background: 'linear-gradient(135deg, #2F3437 0%, #111416 100%)',
          boxShadow: '0 24px 48px rgba(17,20,22,0.18)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: 999, background: `rgba(${h.zone.soft},0.30)`, filter: 'blur(54px)', top: -80, right: -60, transition: 'background 360ms ease' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Prishelse</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>Anbefalt {h.optimal} kr</div>
            </div>
            <div style={{ marginTop: 6 }}>
              <PriceHealthGauge value={h.score} color={h.zone.color} soft={h.zone.soft}
                label={h.zone.title} sub={h.zone.note} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              {[
                { k: 'Estimert belegg', v: `${Math.round(h.fill * 100)} %` },
                { k: 'Estimert inntekt', v: `${Math.round(h.revenue * 7)} kr/uke` },
              ].map((m) => (
                <div key={m.k} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{m.k}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4, fontFeatureSettings: '"tnum"' }}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Price control */}
        <GlassCard padding={18} radius={26}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7B8589', letterSpacing: '-0.01em' }}>Din pris</div>
            <div style={{ fontFeatureSettings: '"tnum"' }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#111416', letterSpacing: '-0.02em' }}>{price}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#7B8589' }}> kr/t</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <button onClick={() => setPrice((p) => Math.max(min, p - 1))} aria-label="Senk pris" style={stepBtn}>−</button>
            <input type="range" min={min} max={max} value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              style={{ flex: 1, accentColor: h.zone.color, height: 4 }} />
            <button onClick={() => setPrice((p) => Math.min(max, p + 1))} aria-label="Øk pris" style={stepBtn}>+</button>
          </div>
          <button onClick={() => setPrice(h.optimal)} style={{
            width: '100%', marginTop: 14, height: 40, borderRadius: 999,
            background: 'rgba(16,185,129,0.12)', color: '#0F9D6E', border: '1px solid rgba(16,185,129,0.28)',
            font: '700 13px/1 Inter, system-ui, sans-serif', cursor: 'pointer', letterSpacing: '-0.01em',
          }}>Bruk anbefalt pris · {h.optimal} kr/t</button>
        </GlassCard>

        <HostCTAButton full onClick={() => go('host')}>Lagre endringer</HostCTAButton>
      </div>
    </AppBackground>
  );
}

const stepBtn = {
  width: 40, height: 40, borderRadius: 14, flexShrink: 0,
  background: '#fff', color: '#111416', border: '1px solid rgba(17,20,22,0.10)',
  font: '700 20px/1 Inter, system-ui, sans-serif', cursor: 'pointer',
};

window.WelcomeScreen = WelcomeScreen;
window.LiveSpotScreen = LiveSpotScreen;
window.HostScreen = HostScreen;
window.RewardsScreen = RewardsScreen;
window.EditSpaceScreen = EditSpaceScreen;
