import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Image, Animated, PanResponder, Dimensions } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import Icon from '../components/Icon';
import WheelPicker from '../components/WheelPicker';
import ReservationSuccess from '../components/ReservationSuccess';
import { useBalance } from '../context/BalanceContext';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { useActiveBooking } from '../context/ActiveBookingContext';
import { supabase } from '../lib/supabase';
import { BOOKING_FEE_RATE } from '../constants/booking';

function pad2(n) { return String(n).padStart(2, '0'); }
function formatDuration(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${h} t ${rem} min` : `${h} t`;
}

// Wheel-picker step + the full list of clock times for a single day, in
// `minutes since midnight`. Each option is { value, label: "HH:MM" }.
const TIME_STEP = 15;
function clockLabel(mins) {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}
const TIME_OPTIONS = Array.from(
  { length: (24 * 60) / TIME_STEP },
  (_, i) => ({ value: i * TIME_STEP, label: clockLabel(i * TIME_STEP) }),
);
// Round a Date's wall-clock time up to the next TIME_STEP boundary.
function nowRoundedToStep() {
  const d = new Date();
  const mins = d.getHours() * 60 + d.getMinutes();
  return Math.ceil(mins / TIME_STEP) * TIME_STEP % 1440;
}

// Brand palette (mirrors colors_and_type.css)
const C = {
  frost:    '#263548',
  silver:   '#2B394C',
  mist:     '#2B394C',
  mint:     '#3A4C68',
  charcoal: '#FFFFFF',
  soft:     '#98B6D8',
  muted:    '#98B6D8',
  green:    '#6FB1F7',
  ice:      '#7FBBF8',
  premium:  '#5EA2F5',
  coral:    '#EF8F7A',
  glass:    'rgba(255,255,255,0.62)',
  glassDim: 'rgba(247,248,246,0.72)',
  border:   'rgba(255,255,255,0.6)',
  hairline: 'rgba(23,33,31,0.08)',
};

const METHODS = [
  {
    id: 'applepay',
    label: 'Apple Pay',
    sub: 'Betal raskt og sikkert med Apple Pay',
    icon: 'credit-card',
    isApplePay: true,
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.10)',
    ctaGradient: ['#4E96F0', '#5EA2F5', '#4E96F0'],
    ctaShadow: '#4E96F0',
    recommended: true,
  },
  {
    id: 'vipps',
    label: 'Vipps',
    sub: 'Bekreft med Vipps på sekunder',
    icon: 'zap',
    accent: '#5EA2F5',
    accentSoft: 'rgba(94,162,245,0.14)',
    ctaGradient: ['#4E96F0', '#5EA2F5', '#6FB1F7'],
    ctaShadow: '#4E96F0',
  },
  {
    id: 'card',
    label: 'Bankkort',
    sub: 'Visa · Mastercard · BankAxept',
    icon: 'credit-card',
    accent: C.green,
    accentSoft: 'rgba(94,162,245,0.14)',
    ctaGradient: ['#4E96F0', '#5EA2F5', '#4E96F0'],
    ctaShadow: '#4E96F0',
  },
  {
    id: 'klarna',
    label: 'Klarna',
    sub: 'Betal senere · 14 dager rentefritt',
    icon: 'clock',
    accent: '#6FB1F7',
    accentSoft: 'rgba(94,162,245,0.14)',
    ctaGradient: ['#4E96F0', '#5EA2F5', '#6FB1F7'],
    ctaShadow: '#4E96F0',
  },
];

// Payment-method logos. All badges share the same 24px height as the Apple Pay
// badge so they line up as a consistent row. Brand marks are drawn as inline SVG
// (official Mastercard symbol, Vipps + Klarna wordmarks) — no image assets needed.

// Official Mastercard symbol: two interlocking circles (red + amber) with the
// blended overlap in the middle.
function MastercardMark() {
  return (
    <View style={[s.brandBadge, { backgroundColor: '#FFFFFF' }]}>
      <Svg width={26} height={16} viewBox="0 0 36 22">
        <Circle cx={13} cy={11} r={11} fill="#EB001B" />
        <Circle cx={23} cy={11} r={11} fill="#F79E1B" />
        <Path d="M18 2.2a11 11 0 0 0 0 17.6 11 11 0 0 0 0-17.6Z" fill="#FF5F00" />
      </Svg>
    </View>
  );
}

// Vipps wordmark: white "vipps" on the brand orange.
function VippsMark() {
  return (
    <View style={[s.brandBadge, { backgroundColor: '#FF5B24' }]}>
      <Text style={s.vippsWordmark}>vipps</Text>
    </View>
  );
}

// Klarna wordmark: black "Klarna" on the brand pink.
function KlarnaMark() {
  return (
    <View style={[s.brandBadge, { backgroundColor: '#FFB3C7' }]}>
      <Text style={s.klarnaWordmark}>Klarna</Text>
    </View>
  );
}

function MethodLogo({ method }) {
  if (method.isApplePay) {
    return <View style={s.applePayBadge}><Text style={s.applePayBadgeText}>{'\uF8FF'} Pay</Text></View>;
  }
  if (method.id === 'vipps')  return <VippsMark />;
  if (method.id === 'card')   return <MastercardMark />;
  if (method.id === 'klarna') return <KlarnaMark />;
  return (
    <View style={[s.payMethodIcon, { backgroundColor: method.accentSoft }]}>
      <Icon name={method.icon} size={16} color={method.accent} strokeWidth={2.2} />
    </View>
  );
}

export default function BetalingPaakrevdScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { pricePerHour, address, area, spotId } = route?.params ?? {};
  const { user } = useAuth();
  const { isPremium, toggle: togglePremium } = usePremium();

  // Start & end are clock times (minutes since midnight) chosen on the two
  // wheel pickers. Default: start at the next possible 15-min mark, end 3 hours
  // ahead of that.
  const initialStart = useMemo(() => nowRoundedToStep(), []);
  const [startMin, setStartMin] = useState(initialStart);
  const [endMin, setEndMin] = useState((initialStart + 180) % 1440);
  // Whether the user has actually picked a start time on the wheel. While false,
  // the reservation begins at the *exact current minute* (not the rounded wheel
  // value) so the live timer starts right now. The wheel still shows the rounded
  // default because its options only land on 15-min steps.
  const [startTouched, setStartTouched] = useState(false);
  const [selected, setSelected] = useState('applepay');
  const [processing, setProcessing] = useState(false);
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingExtras, setPendingExtras] = useState(null);

  const { balance, spend, refund } = useBalance();
  const { setDemoBooking } = useActiveBooking();

  // Duration is the gap between the two picked clock times. If the end time is
  // Anchor both times to a concrete Date relative to mount. When the user hasn't
  // touched the start wheel, the reservation starts at the exact current minute
  // (seconds zeroed) so the live countdown begins now; the end stays anchored to
  // the clock time shown on the end wheel. Once they pick a start time, honour
  // that 15-min clock value instead.
  const mountDay = useMemo(() => new Date(), []);
  const start = useMemo(() => {
    const d = new Date(mountDay);
    if (startTouched) {
      d.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
    } else {
      d.setSeconds(0, 0); // exact current minute
    }
    return d;
  }, [mountDay, startMin, startTouched]);

  const endsAt = useMemo(() => {
    const d = new Date(start);
    d.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
    // End is a clock time; if it lands at/before the start it's the next day.
    if (d.getTime() <= start.getTime()) d.setDate(d.getDate() + 1);
    return d;
  }, [start, endMin]);

  // Duration is the real elapsed window between the concrete start and end.
  const duration = Math.round((endsAt.getTime() - start.getTime()) / 60_000);

  const hasSummary = pricePerHour != null;
  const hours = duration / 60;
  const subtotal = Math.round((pricePerHour ?? 0) * hours);
  const standardFee = Math.round(subtotal * BOOKING_FEE_RATE);
  const bookingFee = isPremium ? 0 : standardFee;
  const total = subtotal + bookingFee;
  const startStr = clockLabel(startMin);
  const endStr = clockLabel(endMin);
  const durationStr = formatDuration(duration);
  const durationMins = duration;
  const startsAtIso = start.toISOString();
  const endsAtIso = endsAt.toISOString();

  // Premium savings for THIS booking (the booking fee they'd avoid).
  const premiumSavings = !isPremium ? bookingFee : 0;

  // Demo spots from BERGEN_SPOTS use short IDs like "p01" — they have no
  // matching row in supabase.spots, so we can't insert a reservation against
  // them. Treat anything that isn't a UUID as a demo spot.
  const isRealSpot = !!(spotId && String(spotId).length >= 32);
  const isSaldoSelected = selected === 'saldo';
  const saldoCanCover = hasSummary && balance >= total && total > 0;
  const balanceApplied = isSaldoSelected && hasSummary ? Math.min(balance, total) : 0;
  const remainingTotal = hasSummary ? Math.max(0, total - balanceApplied) : 0;

  const selectedMethod = METHODS.find(m => m.id === selected) ?? METHODS[0];
  const otherMethods = METHODS.filter(m => m.id !== selected);

  // Insert the actual reservation row so AktivParkering has data to render.
  const createReservation = async (paymentStatus) => {
    if (!user || !spotId || !startsAtIso || !endsAtIso) return { ok: false, error: 'missing_booking_data' };
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        spot_id:        spotId,
        renter_id:      user.id,
        starts_at:      startsAtIso,
        ends_at:        endsAtIso,
        duration_mins:  durationMins ?? null,
        price_subtotal: subtotal,
        booking_fee:    bookingFee,
        total,
        status:         'confirmed',
        payment_status: paymentStatus,
      })
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  };

  // Pass the booking inline so AktivParkering can render it without hitting DB.
  const demoBookingParam = () => ({
    id: `demo-${Date.now()}`,
    starts_at: startsAtIso,
    ends_at: endsAtIso,
    total,
    spots: {
      id: spotId,
      address: address ?? 'Reservasjon',
      price_per_hour: durationMins ? Math.round(subtotal / (durationMins / 60)) : 0,
    },
  });

  // Shows the success animation, then navigates to the live booking screen
  // after a brief celebratory beat. Extras are forwarded to AktivParkering
  // (e.g. demoBooking payload for demo spots).
  const celebrateAndGoToActive = (extras = {}) => {
    setPendingExtras(extras);
    setShowSuccess(true);
  };

  // Called by ReservationSuccess once the 3-stage animation has settled.
  const handleAnimationComplete = () => {
    // The booking is now live in ActiveBookingContext, and the map surfaces it via
    // the active-parking hero. Return to the map instead of stacking a near-
    // identical AktivParkering page on top — that double-up was what made the back
    // button loop ("same screen") and then error at the stack root. The dashboard
    // stays one tap away via the hero, where its back button returns here cleanly.
    if (navigation.popToTop) navigation.popToTop();
    else navigation.goBack();
  };

  const pay = async () => {
    if (processing) return;
    setProcessing(true);

    if (isSaldoSelected) {
      // 1. Deduct balance atomically on the server.
      const res = await spend(total, `booking:${address ?? 'spot'}`);
      if (!res.ok) {
        setProcessing(false);
        Alert.alert('Saldo kunne ikke brukes', 'Prøv igjen, eller velg en annen betalingsmåte.');
        return;
      }

      // 2. Real spots: insert reservation. Demo spots: skip and pass inline.
      if (isRealSpot) {
        const r = await createReservation('paid');
        setProcessing(false);
        if (!r.ok) {
          await refund(total, `refund:booking_failed:${address ?? 'spot'}`);
          Alert.alert(
            'Reservasjonen kunne ikke lagres',
            `Saldoen er tilbakeført.\n\nDetaljer: ${r.error ?? 'ukjent feil'}`,
          );
          return;
        }
        celebrateAndGoToActive();
        return;
      }

      setProcessing(false);
      setDemoBooking(demoBookingParam());
      celebrateAndGoToActive();
      return;
    }

    // Other payment methods: still mock the charge for now.
    setTimeout(async () => {
      if (isRealSpot) {
        const r = await createReservation('pending');
        setProcessing(false);
        if (!r.ok) {
          Alert.alert(
            'Noe gikk galt',
            `Klarte ikke å lagre reservasjonen.\n\nDetaljer: ${r.error ?? 'ukjent feil'}`,
          );
          return;
        }
        celebrateAndGoToActive();
      } else {
        setProcessing(false);
        setDemoBooking(demoBookingParam());
        celebrateAndGoToActive();
      }
    }, 650);
  };

  const ctaLabel = (() => {
    if (isSaldoSelected) return 'Betal med saldo';
    const m = METHODS.find(x => x.id === selected);
    if (!m) return 'Bekreft og betal';
    if (m.id === 'vipps')  return 'Betal med Vipps';
    if (m.id === 'klarna') return 'Betal med Klarna';
    return 'Betal med kort';
  })();

  // Swipe-to-dismiss. The sheet rides on translateY; the PanResponder is attached
  // to the grabber/header (not the ScrollView) so it never fights inner scrolling.
  // Drag down past a threshold (or flick fast) → slide off-screen and go back;
  // otherwise spring back to rest.
  const SCREEN_H = Dimensions.get('window').height;
  const translateY = useRef(new Animated.Value(0)).current;
  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_H,
      duration: 220,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  };
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy); // down only
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 110 || g.vy > 0.8) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={s.root}>
      {/* Tap-to-dismiss backdrop — the screen behind (map) shows through the top */}
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => navigation.goBack()} />

      {/* Bottom sheet — covers ~55% of the screen, Waymo-style. Rides on
          translateY so it can be swiped down to dismiss. */}
      <Animated.View style={[s.sheet, { transform: [{ translateY }] }]}>
        {/* Drag handle zone — owns the swipe-to-dismiss gesture. */}
        <View style={s.grabZone} {...panResponder.panHandlers}>
          <View style={s.grabber} />
        </View>

        <ScrollView
          style={s.sheetScroll}
          contentContainerStyle={[s.content, { paddingTop: 4, paddingBottom: 12 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn} hitSlop={8}>
            <Icon name="arrow-left" size={20} color={C.charcoal} strokeWidth={2} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Bekreft og betal</Text>
          </View>
          <View style={[s.iconBtn, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />
        </View>

        {/* Booking summary card — receipt-style with brand gradient + logo */}
        {hasSummary && (
          <View style={s.summaryCard}>
            <View style={s.summaryHead}>
              <Image
                source={require('../../assets/parkno-logo.png')}
                style={s.summaryLogo}
                resizeMode="contain"
              />
              <View style={{ flex: 1 }}>
                <Text style={s.summaryAddress}>{address ?? 'Reservasjon'}</Text>
                {!!area && <Text style={s.summaryArea}>{area}</Text>}
              </View>
              <View style={s.durationPill}>
                <Icon name="clock" size={11} color={C.charcoal} strokeWidth={2.2} />
                <Text style={s.durationPillText}>{durationStr}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Duration — pick start & end clock times on the two wheel pickers.
            The gap between them drives the total. */}
        {hasSummary && (
          <View style={s.durationCard}>
            <View style={s.wheelRow}>
              <View style={s.wheelCol}>
                <Text style={s.wheelLabel}>Fra</Text>
                <WheelPicker
                  items={TIME_OPTIONS}
                  value={startMin}
                  visible={3}
                  onChange={(v) => {
                    setStartMin(v);
                    setStartTouched(true); // honour the picked clock time from now on
                    // Keep the end at least one step ahead of the new start.
                    if (((endMin - v + 1440) % 1440 || 1440) < TIME_STEP) {
                      setEndMin((v + 60) % 1440);
                    }
                  }}
                />
              </View>
              <View style={s.wheelArrow}>
                <Icon name="chevron-right" size={18} color={C.charcoal} strokeWidth={2.4} />
              </View>
              <View style={s.wheelCol}>
                <Text style={s.wheelLabel}>Til</Text>
                <WheelPicker
                  items={TIME_OPTIONS}
                  value={endMin}
                  visible={3}
                  onChange={setEndMin}
                />
              </View>
            </View>
          </View>
        )}

        {/* Premium savings upsell — computed from the live booking fee */}
        {hasSummary && premiumSavings > 0 && (
          <TouchableOpacity
            style={s.premiumUpsell}
            activeOpacity={0.92}
            onPress={() => Alert.alert(
              'Parkno Premium',
              `Som Premium-medlem hadde du sluppet bookingavgiften på ${premiumSavings} kr på denne reservasjonen. Premium koster 49 kr/mnd og betaler seg fort tilbake hvis du parkerer ofte.`,
              [
                { text: 'Senere', style: 'cancel' },
                { text: 'Aktiver Premium', onPress: togglePremium },
              ],
            )}
          >
            <LinearGradient
              colors={['#4E96F0', '#5EA2F5', '#6FB1F7', '#7FBBF8']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]}
            />
            <Image
              source={require('../../assets/parkno-logo.png')}
              style={s.premiumUpsellLogo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={s.premiumUpsellEyebrow}>PARKNO PREMIUM</Text>
              <Text style={s.premiumUpsellTitle}>
                Spar <Text style={s.premiumUpsellAmount}>{premiumSavings} kr</Text> på denne bookingen
              </Text>
              <Text style={s.premiumUpsellSub}>Slipp bookingavgiften · 49 kr/mnd</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        )}

        {/* Full method list hidden — selection now happens via the compact
            payment bar that sits right above the CTA (Waymo-style). */}
        {false && (<>
        <View style={s.sectionHead}>
          <Text style={s.sectionOverline}>Velg betalingsmåte</Text>
          <View style={s.arrowDownWrap}>
            <Icon name="chevron-down" size={14} color={C.premium} strokeWidth={2.4} />
          </View>
        </View>
        <View style={s.methods}>
          {isSaldoSelected && (
            <TouchableOpacity activeOpacity={0.9} style={[s.methodBtn, s.methodBtnActive]}>
              <View style={[s.methodIcon, { backgroundColor: 'rgba(16,185,129,0.14)' }]}>
                <Icon name="wallet" size={20} color="#4E96F0" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.methodLabel}>Saldo</Text>
                <Text style={s.methodSub}>{balance} kr tilgjengelig</Text>
              </View>
              <View style={[s.radio, { borderColor: '#4E96F0', backgroundColor: '#4E96F0' }]}>
                <Icon name="check" size={12} color="#fff" strokeWidth={3} />
              </View>
            </TouchableOpacity>
          )}
          {METHODS.filter((m) => m.id === selected).map((m) => {
            const active = selected === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => setSelected(m.id)}
                activeOpacity={0.9}
                style={[s.methodBtn, active && s.methodBtnActive]}
              >
                <View style={[s.methodIcon, { backgroundColor: m.accentSoft }]}>
                  <Icon name={m.icon} size={20} color={m.accent} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.methodLabelRow}>
                    <Text style={s.methodLabel}>{m.label}</Text>
                    {m.recommended && (
                      <View style={s.recBadge}>
                        <Text style={s.recBadgeText}>Anbefalt</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.methodSub}>{m.sub}</Text>
                </View>
                <View style={[s.radio, active && { borderColor: m.accent, backgroundColor: m.accent }]}>
                  {active && <Icon name="check" size={12} color="#fff" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={() => setMethodsOpen(o => !o)}
            activeOpacity={0.85}
            style={s.methodsDropdownHeader}
          >
            <Text style={s.methodsDropdownLabel}>Andre betalingsmåter</Text>
            <View style={[s.saldoChevron, methodsOpen && s.saldoChevronOpen]}>
              <Icon name="chevron-down" size={15} color={C.charcoal} strokeWidth={2.4} />
            </View>
          </TouchableOpacity>

          {methodsOpen && (
            <View style={s.methodsDropdownBody}>
              {otherMethods.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => { setSelected(m.id); setMethodsOpen(false); }}
                  activeOpacity={0.9}
                  style={s.methodBtn}
                >
                  <View style={[s.methodIcon, { backgroundColor: m.accentSoft }]}>
                    <Icon name={m.icon} size={20} color={m.accent} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.methodLabelRow}>
                      <Text style={s.methodLabel}>{m.label}</Text>
                      {m.recommended && (
                        <View style={s.recBadge}>
                          <Text style={s.recBadgeText}>Anbefalt</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.methodSub}>{m.sub}</Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#6E809B" strokeWidth={2.2} />
                </TouchableOpacity>
              ))}
              {balance > 0 && !isSaldoSelected && (
                <TouchableOpacity
                  onPress={() => {
                    if (!saldoCanCover) return;
                    setSelected('saldo');
                    setMethodsOpen(false);
                  }}
                  activeOpacity={saldoCanCover ? 0.9 : 1}
                  disabled={!saldoCanCover}
                  style={[s.methodBtn, !saldoCanCover && { opacity: 0.55 }]}
                >
                  <View style={[s.methodIcon, { backgroundColor: 'rgba(16,185,129,0.14)' }]}>
                    <Icon name="wallet" size={20} color="#4E96F0" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.methodLabel}>Saldo</Text>
                    <Text style={s.methodSub}>
                      {saldoCanCover
                        ? `Dekker hele beløpet · ${balance - (hasSummary ? total : 0)} kr igjen etterpå`
                        : `Trenger ${hasSummary ? total - balance : 0} kr mer for å dekke`}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#6E809B" strokeWidth={2.2} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        </>)}

        {/* Saldo as a payment method — tucked into a collapsible dropdown
            at the bottom of the methods list. Hidden when user has no balance. */}
        {false && balance > 0 && (
          <View style={s.saldoDropdown}>
            <TouchableOpacity
              onPress={() => setSaldoOpen(o => !o)}
              activeOpacity={0.85}
              style={s.saldoDropdownHeader}
            >
              <View style={s.saldoHeaderIcon}>
                <Icon name="wallet" size={16} color={C.premium} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.saldoDropdownLabel}>Bruk saldo</Text>
                <Text style={s.saldoDropdownHint}>{balance} kr tilgjengelig</Text>
              </View>
              <View style={[s.saldoChevron, saldoOpen && s.saldoChevronOpen]}>
                <Icon name="chevron-down" size={15} color={C.charcoal} strokeWidth={2.4} />
              </View>
            </TouchableOpacity>

            {saldoOpen && (
              <TouchableOpacity
                onPress={() => saldoCanCover && setSelected('saldo')}
                activeOpacity={saldoCanCover ? 0.9 : 1}
                disabled={!saldoCanCover}
                style={[
                  s.methodBtn,
                  { marginTop: 10 },
                  isSaldoSelected && s.methodBtnActive,
                  !saldoCanCover && { opacity: 0.55 },
                ]}
              >
                <View style={[s.methodIcon, { backgroundColor: 'rgba(16,185,129,0.14)' }]}>
                  <Icon name="wallet" size={20} color="#4E96F0" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.methodLabelRow}>
                    <Text style={s.methodLabel}>Saldo</Text>
                  </View>
                  <Text style={s.methodSub}>
                    {saldoCanCover
                      ? `Dekker hele beløpet · ${balance - (hasSummary ? total : 0)} kr igjen etterpå`
                      : `Trenger ${hasSummary ? total - balance : 0} kr mer for å dekke`}
                  </Text>
                </View>
                <View style={[s.radio, isSaldoSelected && { borderColor: '#4E96F0', backgroundColor: '#4E96F0' }]}>
                  {isSaldoSelected && <Icon name="check" size={12} color="#fff" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        </ScrollView>

        {/* Pinned footer — payment method (Apple Pay / kort) + total + CTA,
            anchored to the bottom of the sheet like the reference design. */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        {/* Method picker — revealed only when the user taps the compact bar. */}
        {methodsOpen && (
          <View style={s.payPicker}>
            {METHODS.map((m) => {
              const active = m.id === selected;
              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.85}
                  onPress={() => { setSelected(m.id); setMethodsOpen(false); }}
                  style={[s.payPickerRow, active && s.payPickerRowActive]}
                >
                  <MethodLogo method={m} />
                  <Text style={s.payPickerLabel}>{m.label}</Text>
                  {active && <Icon name="check" size={16} color="#5EA2F5" strokeWidth={2.6} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Price breakdown — revealed by the arrow next to the total. */}
        {breakdownOpen && hasSummary && (
          <View style={s.breakdownBox}>
            <View style={s.breakdownRow}>
              <Text style={s.breakdownLabel}>Plass</Text>
              <Text style={s.breakdownValue}>{subtotal} kr</Text>
            </View>
            <View style={s.breakdownRow}>
              <Text style={s.breakdownLabel}>Bookingavgift</Text>
              <Text style={s.breakdownValue}>{bookingFee} kr</Text>
            </View>
          </View>
        )}

        {/* Compact payment bar — method on the left, total on the right, sitting
            directly above the CTA (Waymo-style). */}
        <View style={s.payRow}>
          <TouchableOpacity style={s.payMethod} activeOpacity={0.8} onPress={() => setMethodsOpen(o => !o)}>
            <MethodLogo method={selectedMethod} />
            <Text style={s.payMethodLabel}>{selectedMethod.label}</Text>
            <Icon name="chevron-down" size={16} color="#98B6D8" strokeWidth={2.4} />
          </TouchableOpacity>
          {hasSummary && (
            <TouchableOpacity style={s.payTotal} activeOpacity={0.8} onPress={() => setBreakdownOpen(o => !o)}>
              <Text style={s.payTotalLabel}>Totalt</Text>
              <Text style={s.payTotalText}>{total} kr</Text>
              <Icon name={breakdownOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#98B6D8" strokeWidth={2.4} />
            </TouchableOpacity>
          )}
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          onPress={pay}
          activeOpacity={0.92}
          disabled={processing}
          style={[
            s.cta,
            { shadowColor: isSaldoSelected ? '#4E96F0' : selectedMethod.ctaShadow },
            processing && { opacity: 0.75 },
          ]}
        >
          <LinearGradient
            colors={isSaldoSelected ? ['#4E96F0', '#5EA2F5', '#4E96F0'] : selectedMethod.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]}
          />
          {processing ? (
            <ActivityIndicator color={!isSaldoSelected && selectedMethod.ctaTextColor ? selectedMethod.ctaTextColor : '#fff'} />
          ) : (
            <>
              <Text style={[s.ctaText, !isSaldoSelected && selectedMethod.ctaTextColor && { color: selectedMethod.ctaTextColor }]}>
                {ctaLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Three-stage reservation animation. Mounts immediately on success,
          plays anticipation → reveal → celebration, then onComplete fires and
          we navigate to the live booking screen. */}
      {showSuccess && (
        <ReservationSuccess
          visible
          title="Reservasjon bekreftet"
          subtitle={address ? `${address}${durationStr ? ` · ${durationStr}` : ''}` : 'Plassen er din'}
          pendingTitle="Sikrer plassen…"
          pendingSubtitle={address ?? null}
          onComplete={handleAnimationComplete}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },

  // Bottom-sheet shell (Waymo-style) — tall enough that the whole page (summary,
  // upsell, the two time wheels) fits without the inner ScrollView scrolling.
  backdrop: { flex: 1 },
  sheet: {
    height: '57%',
    backgroundColor: '#2B394C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.30, shadowRadius: 24, elevation: 16,
  },
  // Full-width drag zone so the swipe-to-dismiss gesture has a generous target.
  grabZone: {
    alignItems: 'center',
    paddingTop: 8, paddingBottom: 6,
  },
  grabber: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sheetScroll: { flex: 1 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },

  content: { paddingHorizontal: 20 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  iconBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerOverline: {
    fontFamily: 'System', fontWeight: '600', fontSize: 10,
    letterSpacing: 1.4, textTransform: 'uppercase',
    color: C.premium, marginBottom: 2,
  },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: C.charcoal, letterSpacing: -0.32 },

  // ── Booking summary ─────────────────────────────────────────────
  summaryCard: {
    paddingHorizontal: 4,
    paddingTop: 2,
    marginBottom: 12,
  },
  summaryOrbA: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(147,214,227,0.18)',
    top: -120, right: -70,
  },
  summaryOrbB: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(139,207,176,0.14)',
    bottom: -90, left: -40,
  },
  summaryLogo: {
    width: 40, height: 40, tintColor: '#fff',
  },

  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryEyebrow: {
    fontFamily: 'System', fontWeight: '800', fontSize: 10,
    color: C.premium, letterSpacing: 1.4,
  },
  summaryAddress: { fontFamily: 'System', fontWeight: '800', fontSize: 17, color: C.charcoal, letterSpacing: -0.34, marginTop: 4 },
  summaryArea:    { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: C.muted, marginTop: 2 },
  durationPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(23,33,31,0.08)',
  },
  durationPillText: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: C.charcoal, letterSpacing: -0.1 },

  // Duration picker block — no card chrome, just the wheels.
  durationCard: {
    paddingHorizontal: 4, paddingTop: 2, paddingBottom: 2,
    marginBottom: 4,
  },

  // Two side-by-side wheel pickers (start | end)
  wheelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  wheelCol: { flex: 1, alignItems: 'center' },
  wheelLabel: {
    fontFamily: 'System', fontWeight: '700', fontSize: 10,
    color: '#98B6D8', letterSpacing: 1, textTransform: 'uppercase',
    marginBottom: 2,
  },
  // The arrow between the wheels — nudged down so it lines up with the centered
  // (selected) row of each wheel rather than the "Fra/Til" labels above them.
  wheelArrow: {
    width: 24, alignItems: 'center', justifyContent: 'center',
    marginTop: 14,
  },
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  priceLineLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: C.muted },
  priceLineValue: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: C.charcoal },
  totalLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  totalLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: C.charcoal, letterSpacing: -0.2 },
  totalValue: { fontFamily: 'System', fontWeight: '800', fontSize: 22, color: C.charcoal, letterSpacing: -0.44 },

  // ── Section pointing to payment buttons ─────────────────────────
  // "Bruk saldo" collapsible at the bottom of the methods list
  saldoDropdown: {
    marginTop: 12, marginBottom: 6,
  },
  saldoDropdownHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  saldoHeaderIcon: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: 'rgba(78,167,185,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  saldoDropdownLabel: {
    fontFamily: 'System', fontWeight: '700', fontSize: 13,
    color: C.charcoal, letterSpacing: -0.15,
  },
  saldoDropdownHint: {
    fontFamily: 'System', fontWeight: '500', fontSize: 11,
    color: C.muted, marginTop: 2,
  },
  saldoChevron: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#50607A',
    alignItems: 'center', justifyContent: 'center',
  },
  saldoChevronOpen: {
    backgroundColor: 'rgba(16,185,129,0.18)',
    transform: [{ rotate: '180deg' }],
  },

  // Premium upsell card (between booking summary and method picker)
  premiumUpsell: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 18, marginTop: 8, marginBottom: 8, overflow: 'hidden',
    shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32, shadowRadius: 18, elevation: 6,
  },
  premiumUpsellIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumUpsellLogo: { width: 46, height: 46, tintColor: '#fff' },
  premiumUpsellEyebrow: {
    fontFamily: 'System', fontWeight: '800', fontSize: 9,
    color: 'rgba(255,255,255,0.85)', letterSpacing: 1.4,
  },
  premiumUpsellTitle: {
    fontFamily: 'System', fontWeight: '700', fontSize: 14,
    color: '#fff', letterSpacing: -0.15, marginTop: 3, lineHeight: 19,
  },
  premiumUpsellAmount: {
    fontFamily: 'System', fontWeight: '800', color: '#FFE08A',
  },
  premiumUpsellSub: {
    fontFamily: 'System', fontWeight: '500', fontSize: 11,
    color: 'rgba(255,255,255,0.78)', marginTop: 3,
  },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 10, paddingLeft: 4,
  },
  sectionOverline: {
    fontFamily: 'System', fontWeight: '700', fontSize: 11,
    letterSpacing: 1.3, textTransform: 'uppercase',
    color: C.premium,
  },
  arrowDownWrap: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(78,167,185,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Payment method buttons ──────────────────────────────────────
  methods: { gap: 10, marginBottom: 18 },
  methodsDropdownHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#3B4C69',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  methodsDropdownLabel: { flex: 1, fontFamily: 'System', fontWeight: '700', fontSize: 13, color: C.charcoal, letterSpacing: -0.1 },
  methodsDropdownBody: { gap: 10 },
  methodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: C.glassDim,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  methodBtnActive: {
    borderColor: C.premium,
    backgroundColor: '#3A4C68',
    shadowColor: C.premium,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  methodIcon: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  methodLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  methodLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: C.charcoal, letterSpacing: -0.2 },
  methodSub:   { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: C.muted, marginTop: 2 },
  recBadge: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(239,143,122,0.16)',
  },
  recBadgeText: { fontFamily: 'System', fontWeight: '700', fontSize: 9, color: '#C85A3F', letterSpacing: 0.6, textTransform: 'uppercase' },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.8,
    borderColor: 'rgba(23,33,31,0.18)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  // ── Secure note ─────────────────────────────────────────────────
  secureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4, marginBottom: 18 },
  secureText: { flex: 1, fontFamily: 'System', fontWeight: '500', fontSize: 12, color: C.muted, lineHeight: 18 },

  // ── CTA ─────────────────────────────────────────────────────────
  cta: {
    height: 56, borderRadius: 999, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#4E96F0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.40,
    shadowRadius: 18,
    elevation: 6,
  },
  ctaText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#fff', letterSpacing: -0.2 },
  ctaBadge: {
    marginLeft: 12,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  ctaBadgeText: { fontFamily: 'System', fontWeight: '700', fontSize: 13, color: '#fff', letterSpacing: -0.1 },

  secondary: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  secondaryText: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: C.muted },

  // Compact Waymo-style payment bar (method left, total right, above the CTA)
  payRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, paddingHorizontal: 4,
  },
  payMethod: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payMethodIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  payMethodLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.2 },
  payTotal: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payTotalLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#98B6D8', letterSpacing: -0.1 },
  payTotalText: { fontFamily: 'System', fontWeight: '700', fontSize: 18, color: '#FFFFFF', letterSpacing: -0.3 },

  // Collapsible price breakdown (above the payment bar)
  breakdownBox: {
    backgroundColor: '#3A4C68', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 10,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  breakdownLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#98B6D8' },
  breakdownValue: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#FFFFFF' },

  applePayBadge: {
    width: 50, height: 24, backgroundColor: '#FFFFFF', borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  applePayBadgeText: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#000000', letterSpacing: -0.2 },

  // Brand logos (Vipps / Mastercard / Klarna) — identical 50×24 box to Apple Pay,
  // so all four badges line up at the same height and width.
  brandBadge: { width: 50, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  vippsWordmark: { fontFamily: 'System', fontWeight: '800', fontSize: 13, color: '#FFFFFF', letterSpacing: -0.3 },
  klarnaWordmark: { fontFamily: 'System', fontWeight: '800', fontSize: 12, color: '#0A0B09', letterSpacing: -0.2 },

  // Method picker revealed on tap
  payPicker: {
    backgroundColor: '#3A4C68', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 6, marginBottom: 12,
  },
  payPickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 10, paddingVertical: 12, borderRadius: 12,
  },
  payPickerRowActive: { backgroundColor: 'rgba(94,162,245,0.12)' },
  payPickerIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  payPickerLabel: { flex: 1, fontFamily: 'System', fontWeight: '600', fontSize: 15, color: '#FFFFFF', letterSpacing: -0.2 },
});
