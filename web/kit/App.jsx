// App.jsx - mounts the Parkno phone demo used on the landing page.

const SCREEN_MAP = {
  welcome: WelcomeScreen,
  live: LiveSpotScreen,
  host: HostScreen,
  rewards: RewardsScreen,
  edit: EditSpaceScreen,
};

const DEMO_PHASES = [
  {
    id: 'available',
    status: 'Ledig plass',
    detail: 'Klar for reservasjon',
    body: 'Utleier Sondre H · ledig fra 14:30 · 2,5 t · 112 kr',
  },
  {
    id: 'reserved',
    status: 'Reservert',
    detail: '14:30 → 17:00',
    body: 'Utleier Sondre H · reservert 14:30 · 2,5 t · 112 kr',
  },
  {
    id: 'driver',
    status: 'Sjåfør på vei',
    detail: '8 min unna',
    body: 'Ellen H. er på vei · Tesla Model Y · NN 12 345',
  },
  {
    id: 'paid',
    status: 'Betaling bekreftet',
    detail: '112 kr mottatt',
    body: 'Betalingen er bekreftet · reservasjonen er låst',
  },
  {
    id: 'payout',
    status: 'Utbetaling fredag',
    detail: '09:00 · NOK',
    body: '98 kr utbetales automatisk fredag kl. 09:00',
  },
];

function App() {
  const [screen, setScreenState] = React.useState('welcome');
  const [demoPhase, setDemoPhaseState] = React.useState(null);
  const [routeParams, setRouteParams] = React.useState(null);
  const [appPromptOpen, setAppPromptOpen] = React.useState(false);
  const density = 'compact';

  const goToScreen = (id, params = null) => {
    setDemoPhaseState(null);
    setRouteParams(params);
    setScreenState(id);
  };

  const promptApp = () => setAppPromptOpen(true);
  const closePrompt = () => setAppPromptOpen(false);

  React.useEffect(() => {
    window.setScreen = (id) => {
      goToScreen(id);
      const phone = document.getElementById('phone-mount');
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (phone) phone.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    };

    window.setDemoPhase = (id) => {
      const next = DEMO_PHASES.find((phase) => phase.id === id) || DEMO_PHASES[0];
      setScreenState('live');
      setDemoPhaseState(next);
    };

    window.__promptApp = () => setAppPromptOpen(true);

    window.__parknoAppReady = true;
    window.dispatchEvent(new CustomEvent('parkno:app-ready'));
  }, []);

  React.useEffect(() => {
    const buttons = document.querySelectorAll('.phone-screen-tabs button[data-screen]');
    const handler = (event) => {
      const id = event.currentTarget.getAttribute('data-screen');
      goToScreen(id);
    };
    buttons.forEach((button) => button.addEventListener('click', handler));
    return () => buttons.forEach((button) => button.removeEventListener('click', handler));
  }, []);

  React.useEffect(() => {
    const buttons = document.querySelectorAll('.phone-screen-tabs button[data-screen]');
    buttons.forEach((button) => {
      const isActive = button.getAttribute('data-screen') === screen;
      button.classList.toggle('on', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });
  }, [screen]);

  const Current = SCREEN_MAP[screen] || WelcomeScreen;

  return (
    <IOSDevice width={360} height={760}>
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <Current go={goToScreen} density={density} demoPhase={demoPhase} routeParams={routeParams} promptApp={promptApp} />
        {appPromptOpen && <AppPromptOverlay onClose={closePrompt} />}
      </div>
    </IOSDevice>
  );
}

function AppPromptOverlay({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 200,
      background: 'rgba(17,20,22,0.5)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        background: '#F8FAF7', color: '#111416',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '16px 18px 22px',
        boxShadow: '0 -20px 40px rgba(17,20,22,0.18)',
      }}>
        <div style={{
          width: 40, height: 4, borderRadius: 999,
          background: 'rgba(17,20,22,0.18)', margin: '0 auto 14px',
        }} />

        <img src="assets/parkno-logo-icon.png" alt="Parkno" style={{
          width: 180, height: 180, display: 'block',
          objectFit: 'contain', objectPosition: 'center',
          marginBottom: -16, marginLeft: -32, marginTop: -40,
        }} />

        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Last ned appen</div>
        <p style={{ fontSize: 14, color: '#2F3437', margin: '8px 0 0', lineHeight: 1.45 }}>
          Denne funksjonen er kun tilgjengelig i Parkno-appen. Last ned for å reservere, sende meldinger og styre parkeringen din.
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{
            flex: 1, height: 52, borderRadius: 999,
            background: '#111416', color: '#fff', border: 'none',
            font: '700 14px/1 Inter, system-ui, sans-serif', letterSpacing: '-0.01em',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 18px rgba(17,20,22,0.22)',
          }}>
            <svg width="14" height="16" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            App Store
          </button>
          <button onClick={onClose} style={{
            flex: 1, height: 52, borderRadius: 999,
            background: '#111416', color: '#fff', border: 'none',
            font: '700 14px/1 Inter, system-ui, sans-serif', letterSpacing: '-0.01em',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 18px rgba(17,20,22,0.22)',
          }}>
            <svg width="14" height="16" viewBox="0 0 24 24" fill="#fff">
              <path d="M3.18 23.07c-.65-.36-1.05-1.07-1.05-1.91V2.84c0-.84.4-1.55 1.05-1.91L13.5 12 3.18 23.07zM14.93 13.43l3.27-3.27 4.69 2.7c.84.48.84 1.78 0 2.26l-4.69 2.7-3.27-3.39zm-1.36-1.43L4.45 2.65c.15-.04.31-.06.47-.06.27 0 .53.07.78.21l10.7 6.16-2.83 3.04zm0 0l2.83 3.04-10.7 6.16c-.25.14-.51.21-.78.21-.16 0-.32-.02-.47-.06L13.57 12z"/>
            </svg>
            Google Play
          </button>
        </div>

        <button onClick={onClose} style={{
          width: '100%', marginTop: 8, height: 44,
          background: 'transparent', border: 0,
          font: '600 13px/1 Inter, system-ui, sans-serif', color: '#7B8589',
          cursor: 'pointer',
        }}>Ikke nå</button>
      </div>
    </div>
  );
}

const root = document.getElementById('phone-mount');
ReactDOM.createRoot(root).render(<App />);
