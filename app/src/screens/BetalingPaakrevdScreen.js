import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import ReservationSuccess from '../components/ReservationSuccess';
import { useBalance } from '../context/BalanceContext';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { useActiveBooking } from '../context/ActiveBookingContext';
import { supabase } from '../lib/supabase';

// Brand palette (mirrors colors_and_type.css)
const C = {
  frost:    '#F8FAF7',
  silver:   '#EAF0EC',
  mist:     '#D8EEF2',
  mint:     '#DDEFE7',
  charcoal: '#17211F',
  soft:     '#34413E',
  muted:    '#73817D',
  green:    '#8BCFB0',
  ice:      '#93D6E3',
  premium:  '#4EA7B9',
  coral:    '#EF8F7A',
  glass:    'rgba(255,255,255,0.62)',
  glassDim: 'rgba(247,248,246,0.72)',
  border:   'rgba(255,255,255,0.6)',
  hairline: 'rgba(23,33,31,0.08)',
};

const METHODS = [
  {
    id: 'vipps',
    label: 'Vipps',
    sub: 'Bekreft med Vipps på sekunder',
    icon: 'zap',
    accent: '#FF5B24',                       // Vipps brand orange
    accentSoft: 'rgba(255,91,36,0.12)',
    ctaGradient: ['#FF8A5B', '#FF5B24', '#E0490F'],
    ctaShadow: '#FF5B24',
    recommended: true,
  },
  {
    id: 'card',
    label: 'Bankkort',
    sub: 'Visa · Mastercard · BankAxept',
    icon: 'credit-card',
    accent: C.green,
    accentSoft: 'rgba(139,207,176,0.18)',
    ctaGradient: ['#10B981', '#14B8A6', '#2563EB'],
    ctaShadow: '#10B981',
  },
  {
    id: 'klarna',
    label: 'Klarna',
    sub: 'Betal senere · 14 dager rentefritt',
    icon: 'clock',
    accent: '#FFB3C7',                       // Klarna brand pink
    accentSoft: 'rgba(255,179,199,0.25)',
    ctaGradient: ['#FFB3C7', '#FFB3C7', '#FFB3C7'],
    ctaShadow: '#FFB3C7',
    ctaTextColor: '#17120F',                 // Klarna's signature black text on pink
  },
];

export default function BetalingPaakrevdScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const {
    total,
    subtotal,
    bookingFee,
    durationStr,
    startStr,
    endStr,
    address,
    area,
    spotId,
    startsAtIso,
    endsAtIso,
    durationMins,
  } = route?.params ?? {};
  const { user } = useAuth();
  const { isPremium, toggle: togglePremium } = usePremium();

  // Premium savings for THIS booking. If the user isn't premium yet, the
  // booking fee is the saving they'd get; if they're already premium the fee
  // is 0 and we don't show the upsell.
  const premiumSavings = !isPremium ? (bookingFee ?? 0) : 0;

  const [selected, setSelected] = useState('vipps');
  const [processing, setProcessing] = useState(false);
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingExtras, setPendingExtras] = useState(null);

  const { balance, spend, refund } = useBalance();
  const { setDemoBooking } = useActiveBooking();

  // Demo spots from BERGEN_SPOTS use short IDs like "p01" — they have no
  // matching row in supabase.spots, so we can't insert a reservation against
  // them. Treat anything that isn't a UUID as a demo spot.
  const isRealSpot = !!(spotId && String(spotId).length >= 32);

  const hasSummary = typeof total === 'number';
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
    const target = route?.name?.startsWith('Kart') ? 'KartAktivParkering' : 'AktivParkering';
    if (navigation.replace) navigation.replace(target, pendingExtras ?? {});
    else { navigation.popToTop(); navigation.navigate(target, pendingExtras ?? {}); }
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

  return (
    <View style={s.root}>
      {/* Brand background gradient */}
      <LinearGradient
        colors={[C.frost, C.silver, C.mist]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn} hitSlop={8}>
            <Icon name="arrow-left" size={20} color={C.charcoal} strokeWidth={2} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerOverline}>Steg 2 av 2</Text>
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
                <Text style={s.summaryEyebrow}>RESERVASJON</Text>
                <Text style={s.summaryAddress}>{address ?? 'Reservasjon'}</Text>
                {!!area && <Text style={s.summaryArea}>{area}</Text>}
              </View>
              <View style={s.durationPill}>
                <Icon name="clock" size={11} color={C.charcoal} strokeWidth={2.2} />
                <Text style={s.durationPillText}>{durationStr}</Text>
              </View>
            </View>

            <View style={s.summaryTimeRow}>
              <Text style={s.summaryTimeText}>{startStr}</Text>
              <View style={s.timeArrow}>
                <Icon name="chevron-right" size={14} color={C.charcoal} strokeWidth={2.4} />
              </View>
              <Text style={s.summaryTimeText}>{endStr}</Text>
            </View>

            <View style={s.summaryDivider} />

            <View style={s.priceLine}>
              <Text style={s.priceLineLabel}>Plass</Text>
              <Text style={s.priceLineValue}>{subtotal} kr</Text>
            </View>
            <View style={s.priceLine}>
              <Text style={s.priceLineLabel}>Bookingavgift</Text>
              <Text style={s.priceLineValue}>{bookingFee} kr</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.priceLine}>
              <Text style={s.totalLabel}>Totalt</Text>
              <Text style={s.totalValue}>{total} kr</Text>
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
              colors={['#FF8A5B', '#EF4444', '#7C3AED', '#2563EB']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]}
            />
            <View style={s.premiumUpsellOrb} />
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
            <View style={s.premiumUpsellCta}>
              <Icon name="arrow-right" size={14} color="#17211F" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>
        )}

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
                <Icon name="wallet" size={20} color="#10B981" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.methodLabel}>Saldo</Text>
                <Text style={s.methodSub}>{balance} kr tilgjengelig</Text>
              </View>
              <View style={[s.radio, { borderColor: '#10B981', backgroundColor: '#10B981' }]}>
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
                  <Icon name="chevron-right" size={16} color="#C4CACC" strokeWidth={2.2} />
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
                    <Icon name="wallet" size={20} color="#10B981" strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.methodLabel}>Saldo</Text>
                    <Text style={s.methodSub}>
                      {saldoCanCover
                        ? `Dekker hele beløpet · ${balance - (hasSummary ? total : 0)} kr igjen etterpå`
                        : `Trenger ${hasSummary ? total - balance : 0} kr mer for å dekke`}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#C4CACC" strokeWidth={2.2} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

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
                  <Icon name="wallet" size={20} color="#10B981" strokeWidth={2.2} />
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
                <View style={[s.radio, isSaldoSelected && { borderColor: '#10B981', backgroundColor: '#10B981' }]}>
                  {isSaldoSelected && <Icon name="check" size={12} color="#fff" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Secure note */}
        <View style={s.secureRow}>
          <Icon name="shield" size={13} color={C.premium} strokeWidth={2} />
          <Text style={s.secureText}>
            Du belastes først når reservasjonen er bekreftet. Alle betalinger er kryptert.
          </Text>
        </View>

        {/* Primary CTA — matches the brand colour of the selected payment method
            (Vipps orange, BankID purple, card = bright nav green/teal/blue). */}
        <TouchableOpacity
          onPress={pay}
          activeOpacity={0.92}
          disabled={processing}
          style={[
            s.cta,
            { shadowColor: isSaldoSelected ? '#10B981' : selectedMethod.ctaShadow },
            processing && { opacity: 0.75 },
          ]}
        >
          <LinearGradient
            colors={isSaldoSelected ? ['#10B981', '#14B8A6', '#2563EB'] : selectedMethod.ctaGradient}
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
              {hasSummary && (
                <View style={[s.ctaBadge, !isSaldoSelected && selectedMethod.ctaTextColor && { backgroundColor: 'rgba(23,18,15,0.12)' }]}>
                  <Text style={[s.ctaBadgeText, !isSaldoSelected && selectedMethod.ctaTextColor && { color: selectedMethod.ctaTextColor }]}>
                    {total} kr
                  </Text>
                </View>
              )}
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={s.secondary} activeOpacity={0.7}>
          <Text style={s.secondaryText}>Avbryt</Text>
        </TouchableOpacity>
      </ScrollView>

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
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.glass,
    borderWidth: 1, borderColor: C.border,
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
    backgroundColor: '#fff',
    borderRadius: 24, overflow: 'hidden',
    padding: 20, paddingTop: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(23,33,31,0.06)',
    shadowColor: '#111416',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
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
    width: 40, height: 40,
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
    backgroundColor: 'rgba(23,33,31,0.05)',
    borderWidth: 1, borderColor: 'rgba(23,33,31,0.08)',
  },
  durationPillText: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: C.charcoal, letterSpacing: -0.1 },

  summaryTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 4, marginLeft: 52 },
  summaryTimeText: { fontFamily: 'System', fontWeight: '800', fontSize: 20, color: C.charcoal, letterSpacing: -0.4 },
  timeArrow: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(23,33,31,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  summaryDivider: { height: 1, backgroundColor: 'rgba(23,33,31,0.08)', marginVertical: 14 },
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  priceLineLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: C.muted },
  priceLineValue: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: C.charcoal },
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
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
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
    backgroundColor: 'rgba(23,33,31,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  saldoChevronOpen: {
    backgroundColor: 'rgba(16,185,129,0.18)',
    transform: [{ rotate: '180deg' }],
  },

  // Premium upsell card (between booking summary and method picker)
  premiumUpsell: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 18, marginBottom: 22, overflow: 'hidden',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32, shadowRadius: 18, elevation: 6,
  },
  premiumUpsellOrb: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -80, right: -40,
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
  premiumUpsellCta: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 3,
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
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  methodsDropdownLabel: { flex: 1, fontFamily: 'System', fontWeight: '700', fontSize: 13, color: C.charcoal, letterSpacing: -0.1 },
  methodsDropdownBody: { gap: 10 },
  methodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: C.glassDim,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  methodBtnActive: {
    borderColor: C.premium,
    backgroundColor: '#FFFFFF',
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
    shadowColor: '#10B981',
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
});
