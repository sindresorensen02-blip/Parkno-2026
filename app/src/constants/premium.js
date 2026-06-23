// ─────────────────────────────────────────────────────────────────────────────
// Parkno Premium — single source of truth for the paywall.
//
// Everything the paywall renders (plans, benefits, trial copy, FAQ, timeline,
// CTA copy) lives here so the page is easy to A/B test and maintain without
// touching UI code. To experiment, change values in this file only.
//
// ⚠️  PRICING IS PLACEHOLDER. Replace `priceAmount` / product ids with real
//     App Store / Google Play product data when billing is wired up.
// ─────────────────────────────────────────────────────────────────────────────

export const CURRENCY = 'kr';

// ── Trial / billing capability ───────────────────────────────────────────────
// The app currently has NO free trial and NO pre-billing reminder system
// (premium is a simple in-memory unlock — see PremiumContext). Keep this false
// so the paywall never makes a false promise. Flip `enabled` to true ONLY once
// a real trial + reminder exists; the copy/timeline adapt automatically.
export const TRIAL = {
  enabled: false,
  days: 7,
  remindersSupported: false,
};

// ── Plans ────────────────────────────────────────────────────────────────────
// Order here = render order. `recommended: true` marks the default-selected,
// low-risk entry point (weekly-first per UX guidance).
export const PLANS = [
  {
    id: 'weekly',
    productId: 'parkno_premium_weekly',     // TODO: real store product id
    name: 'Ukentlig',
    priceAmount: 15,
    period: 'uke',
    cadenceLabel: 'per uke',
    renewalLabel: 'Fornyes hver uke',
    valueLine: 'Mindre enn en kaffe – uten binding',
    badge: 'Lav terskel',
    recommended: true,
  },
  {
    id: 'monthly',
    productId: 'parkno_premium_monthly',    // TODO: real store product id
    name: 'Månedlig',
    priceAmount: 49,
    period: 'mnd',
    cadenceLabel: 'per måned',
    renewalLabel: 'Fornyes hver måned',
    valueLine: 'For deg som parkerer jevnlig',
    badge: null,
    recommended: false,
  },
  {
    id: 'yearly',
    productId: 'parkno_premium_yearly',     // TODO: real store product id
    name: 'Årlig',
    priceAmount: 449,
    period: 'år',
    cadenceLabel: 'per år',
    renewalLabel: 'Fornyes hvert år',
    valueLine: 'Best pris – spar ~24 % mot månedlig',
    badge: 'Spar mest',
    recommended: false,
  },
];

export const DEFAULT_PLAN_ID =
  (PLANS.find((p) => p.recommended) || PLANS[0]).id;

// ── Benefits ─────────────────────────────────────────────────────────────────
// `verified: true` = a benefit the app actually delivers today (do not change
// to true for something that isn't built — that's the honesty contract).
// The booking-fee waiver is real (see KartScreen / LiveSpotScreen / Premium).
export const BENEFITS = [
  {
    icon: 'wallet',
    title: 'Ingen bookingavgift',
    body: 'Slipp bookingavgiften på alle reservasjoner. Betaler seg fort tilbake hvis du parkerer ofte.',
    verified: true,
  },
  {
    icon: 'zap',
    title: 'Raskere reservasjon',
    body: 'Hopp rett til betaling fra kartet uten ekstra steg.',
    verified: true,
  },
  {
    icon: 'heart',
    title: 'Lagrede plasser',
    body: 'Rask tilgang til favorittplassene dine.',
    verified: true,
  },
  {
    icon: 'star',
    title: 'Prioritert tilgang til nye funksjoner',
    body: 'Få nye Parkno-funksjoner først.',
    verified: false,
  },
];

// ── Trial / billing timeline ─────────────────────────────────────────────────
// Two honest variants. The page picks one based on TRIAL.enabled so we never
// describe a flow the product doesn't support.
export const TIMELINE_WITH_TRIAL = [
  { icon: 'check',  title: 'I dag', body: 'Start Parkno Premium. Ingen betaling i dag.' },
  { icon: 'zap',    title: 'I prøveperioden', body: 'Bruk alle Premium-funksjoner fritt.' },
  { icon: 'bell',   title: 'Før belastning', body: 'Vi minner deg på før prøveperioden er over.' },
  { icon: 'wallet', title: 'Belastningsdag', body: 'Du belastes kun hvis du fortsetter.' },
];

export const TIMELINE_NO_TRIAL = [
  { icon: 'check',  title: 'I dag', body: 'Premium aktiveres med en gang.' },
  { icon: 'wallet', title: 'Betaling', body: 'Du belastes for valgt periode i dag.' },
  { icon: 'clock',  title: 'Fornyelse', body: 'Abonnementet fornyes automatisk per periode.' },
  { icon: 'shield', title: 'Full kontroll', body: 'Si opp når som helst – det gjelder fra neste periode.' },
];

// ── FAQ ──────────────────────────────────────────────────────────────────────
export const FAQ = [
  {
    q: 'Når blir jeg belastet?',
    a: TRIAL.enabled
      ? 'Ingenting belastes i dag. Du belastes først når prøveperioden er over, og kun hvis du ikke har sagt opp.'
      : 'Du belastes for valgt periode i dag når du aktiverer Premium. Deretter fornyes det automatisk hver periode til du sier opp.',
  },
  {
    q: 'Kan jeg si opp når som helst?',
    a: 'Ja. Du kan si opp når som helst. Oppsigelsen gjelder fra neste betalingsperiode – du beholder Premium ut perioden du har betalt for.',
  },
  {
    q: TRIAL.enabled ? 'Hva skjer etter prøveperioden?' : 'Hva skjer hvis jeg sier opp?',
    a: TRIAL.enabled
      ? 'Etter prøveperioden fortsetter abonnementet til valgt pris, med mindre du har sagt opp før den er over.'
      : 'Premium er aktivt ut perioden du har betalt for. Etter det går du tilbake til vanlig Parkno uten ekstra kostnad.',
  },
  {
    q: 'Hva er inkludert i Parkno Premium?',
    a: 'Du slipper bookingavgiften på alle reservasjoner, får raskere reservasjon og rask tilgang til lagrede plasser.',
  },
];

// ── Copy ─────────────────────────────────────────────────────────────────────
export const COPY = {
  eyebrow: 'PARKNO PREMIUM',
  heroTitle: 'Få mer ut av hver parkering',
  heroSubtitle:
    'Slipp bookingavgiften og reservér raskere – på hver eneste tur.',
  benefitsTitle: 'Dette får du',
  plansTitle: 'Velg periode',
  timelineTitle: TRIAL.enabled ? 'Slik fungerer prøveperioden' : 'Slik fungerer betalingen',
  faqTitle: 'Vanlige spørsmål',
  cancelReassurance: 'Ingen binding · Si opp når som helst',
  // CTA adapts to plan + trial in getCtaLabel()
};

// ── Helpers ──────────────────────────────────────────────────────────────────
export function formatPrice(amount) {
  return `${amount} ${CURRENCY}`;
}

export function getPlan(planId) {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
}

export function getCtaLabel(plan) {
  if (TRIAL.enabled) return 'Start gratis prøveperiode';
  if (!plan) return 'Start Parkno Premium';
  return `Fortsett med ${plan.name.toLowerCase()}`;
}

// Honest one-line billing summary shown right next to the CTA.
export function getBillingSummary(plan) {
  if (!plan) return '';
  const price = formatPrice(plan.priceAmount);
  if (TRIAL.enabled) {
    const reminder = TRIAL.remindersSupported
      ? ' Vi minner deg på før prøveperioden er over.'
      : '';
    return `Ingen betaling i dag. Etter ${TRIAL.days} dager belastes du ${price} ${plan.cadenceLabel}, med mindre du sier opp før.${reminder} Si opp når som helst.`;
  }
  return `Du belastes ${price} i dag, deretter ${price} ${plan.cadenceLabel}. ${plan.renewalLabel}. Si opp når som helst.`;
}

// ── Analytics ────────────────────────────────────────────────────────────────
// No analytics SDK exists in the app yet. This is the single wiring point:
// implement the body once a provider (PostHog/Amplitude/Segment/…) is added.
export const PREMIUM_EVENTS = {
  PAGE_VIEWED:      'premium_page_viewed',
  PLAN_SELECTED:    'premium_plan_selected',
  CTA_CLICKED:      'premium_cta_clicked',
  TRIAL_INFO_VIEWED:'premium_trial_info_viewed',
  PURCHASE_STARTED: 'premium_purchase_started',
};

export function trackPremiumEvent(event, props = {}) {
  // TODO(analytics): forward to the real analytics provider when one exists.
  // e.g. analytics.track(event, props)
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[analytics]', event, props);
  }
}
