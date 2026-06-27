import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Linking, Image } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useActiveBooking } from '../context/ActiveBookingContext';
import { BOOKING_FEE_RATE } from '../constants/booking';

// Brand palette — mirrors BetalingPaakrevdScreen so this page reads as a sibling
// of the payment sheet (same canvas, cards, blue accent).
const C = {
  canvas:   '#2B394C',
  card:     '#3A4C68',
  card2:    '#3B4C69',
  white:    '#FFFFFF',
  muted:    '#98B6D8',
  blue:     '#5EA2F5',
  blueDeep: '#4E96F0',
  border:   'rgba(255,255,255,0.08)',
  danger:   '#EF8F7A',
};

function fmtClock(d) {
  return d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
}

export default function AktivParkeringScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { booking, isDemo, extend: extendBooking, endNow: endBooking } = useActiveBooking();
  const [extending, setExtending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [, force] = useState(0);

  // Re-render every 30 s so the countdown stays fresh.
  useEffect(() => {
    const t = setInterval(() => force(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const extend = async (extraMins) => {
    if (extending) return;
    setExtending(true);
    const res = await extendBooking(extraMins);
    setExtending(false);
    if (!res.ok) Alert.alert('Kunne ikke forlenge', 'Prøv igjen, eller velg et annet tidspunkt.');
  };

  const endNow = () => {
    if (ending) return;
    Alert.alert(
      'Avslutt parkering?',
      'Bookingen lukkes nå. Du blir ikke trukket for resterende tid.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Avslutt',
          style: 'destructive',
          onPress: async () => {
            setEnding(true);
            const res = await endBooking();
            setEnding(false);
            if (!res.ok) {
              Alert.alert('Noe gikk galt', 'Prøv igjen senere.');
              return;
            }
            if (navigation.canGoBack()) navigation.goBack();
          },
        },
      ],
    );
  };

  const openInMaps = () => {
    if (!booking?.spots?.address) return;
    const q = encodeURIComponent(`${booking.spots.address}, Bergen, Norge`);
    Linking.openURL(`maps://?daddr=${q}`);
  };

  // ─── Header (shared between empty + live states) ─────────────────────────────
  const Header = ({ pill }) => (
    <View style={s.header}>
      {navigation.canGoBack() ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn} hitSlop={8}>
          <Icon name="arrow-left" size={20} color={C.white} strokeWidth={2} />
        </TouchableOpacity>
      ) : (
        <View style={s.iconBtn} />
      )}
      <View style={s.headerCenter}>
        {pill ?? <Text style={s.headerTitle}>Aktiv parkering</Text>}
      </View>
      <View style={s.iconBtn} />
    </View>
  );

  if (!booking) {
    return (
      <View style={s.root}>
        <View style={[s.content, { paddingTop: insets.top + 16 }]}>
          <Header />
          <View style={s.emptyCard}>
            <Image source={require('../../assets/parkno-logo.png')} style={s.emptyLogo} resizeMode="contain" />
            <Text style={s.emptyTitle}>Ingen aktiv parkering</Text>
            <Text style={s.emptySub}>Når du har en bekreftet reservasjon, dukker den opp her med nedtelling og snarvei til å forlenge eller avslutte.</Text>
          </View>
        </View>
      </View>
    );
  }

  // ─── render the live session ─────────────────────────────────────────────────
  const now = Date.now();
  const start = new Date(booking.starts_at).getTime();
  const end = new Date(booking.ends_at).getTime();
  const totalMs = end - start;
  const remainingMs = Math.max(0, end - now);
  const elapsed = Math.min(1, Math.max(0, (now - start) / totalMs));
  const isPending = now < start;

  const remainingMins = Math.round(remainingMs / 60000);
  const startsInMins = Math.round((start - now) / 60000);

  const fmtMins = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} t ${m % 60} min`);
  const bigLabel = isPending ? fmtMins(startsInMins) : fmtMins(remainingMins);
  const bigSub = isPending ? 'til parkeringen starter' : 'igjen av parkeringen';

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Header
          pill={
            <View style={s.livePill}>
              <View style={s.liveDot} />
              <Text style={s.liveLabel}>{isPending ? 'PLANLAGT' : 'PÅGÅR NÅ'}</Text>
            </View>
          }
        />

        {/* Countdown hero — the signature gradient card (matches the payment
            premium banner's gradient family). */}
        <View style={s.heroCard}>
          <LinearGradient
            colors={['#4E96F0', '#5EA2F5', '#6FB1F7', '#7FBBF8']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
          />
          <Image source={require('../../assets/parkno-logo.png')} style={s.heroLogo} resizeMode="contain" />
          <Text style={s.heroLabel}>{bigSub}</Text>
          <Text style={s.heroValue}>{bigLabel}</Text>
          <Text style={s.heroEnds}>
            {isPending
              ? `Starter ${fmtClock(new Date(start))} · slutter ${fmtClock(new Date(end))}`
              : `Slutter ${fmtClock(new Date(end))}`}
          </Text>
          {!isPending && (
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${elapsed * 100}%` }]} />
            </View>
          )}
        </View>

        {/* Spot summary — mirrors the payment page's summary card (logo + address
            + a pill on the right). */}
        <View style={s.summaryCard}>
          <Image source={require('../../assets/parkno-logo.png')} style={s.summaryLogo} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={s.summaryLabel}>Plass</Text>
            <Text style={s.summaryAddress} numberOfLines={1}>{booking.spots?.address ?? 'Reservasjon'}</Text>
          </View>
          <TouchableOpacity style={s.mapsBtn} onPress={openInMaps} activeOpacity={0.85}>
            <Icon name="map" size={13} color={C.white} strokeWidth={2.2} />
            <Text style={s.mapsBtnText}>Kart</Text>
          </TouchableOpacity>
        </View>

        {/* Receipt-style start → end row (payment-page signature). */}
        <View style={s.timeRow}>
          <View style={s.timeBlock}>
            <Text style={s.timeLabel}>Start</Text>
            <Text style={s.timeValue}>{fmtClock(new Date(start))}</Text>
          </View>
          <View style={s.timeArrow}>
            <Icon name="chevron-right" size={16} color={C.white} strokeWidth={2.4} />
          </View>
          <View style={s.timeBlock}>
            <Text style={s.timeLabel}>Slutt</Text>
            <Text style={s.timeValue}>{fmtClock(new Date(end))}</Text>
          </View>
          <View style={s.timeDivider} />
          <View style={[s.timeBlock, { alignItems: 'flex-end' }]}>
            <Text style={s.timeLabel}>Totalt</Text>
            <Text style={s.timeValue}>{booking.total ?? 0} kr</Text>
          </View>
        </View>

        {/* Message host */}
        <TouchableOpacity
          style={s.actionPill}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Inboks', { spotId: booking.spots?.id, address: booking.spots?.address })}
        >
          <View style={s.actionPillIcon}>
            <Icon name="mail" size={16} color={C.blue} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.actionPillLabel}>Send melding</Text>
            <Text style={s.actionPillHint}>Til utleier</Text>
          </View>
          <Icon name="chevron-right" size={15} color={C.muted} strokeWidth={2.2} />
        </TouchableOpacity>

        {/* Extend */}
        {!isPending && (
          <>
            <Text style={s.sectionLabel}>Trenger du mer tid?</Text>
            <View style={s.extendRow}>
              {[{ mins: 30, label: '+ 30 min', hrs: 0.5 }, { mins: 60, label: '+ 1 time', hrs: 1 }].map((opt) => (
                <TouchableOpacity
                  key={opt.mins}
                  style={s.extendBtn}
                  onPress={() => extend(opt.mins)}
                  activeOpacity={0.88}
                  disabled={extending}
                >
                  {extending ? (
                    <ActivityIndicator size="small" color={C.blue} />
                  ) : (
                    <>
                      <Text style={s.extendBtnText}>{opt.label}</Text>
                      <Text style={s.extendBtnPrice}>
                        {Math.round((booking.spots?.price_per_hour ?? 0) * opt.hrs * (1 + BOOKING_FEE_RATE))} kr
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Pinned footer — end early, styled like the payment page's footer. */}
      {!isPending && (
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={s.endBtn} onPress={endNow} activeOpacity={0.85} disabled={ending}>
            {ending ? (
              <ActivityIndicator color={C.danger} />
            ) : (
              <>
                <Icon name="x" size={16} color={C.danger} strokeWidth={2.6} />
                <Text style={s.endBtnText}>Avslutt parkering</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  content: { paddingHorizontal: 20 },

  // ── Header ──────────────────────────────────────────────────────────
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: C.white, letterSpacing: -0.32 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue },
  liveLabel: { fontFamily: 'System', fontWeight: '800', fontSize: 10, color: C.white, letterSpacing: 1.2 },

  // ── Countdown hero ──────────────────────────────────────────────────
  heroCard: {
    borderRadius: 24, padding: 22, overflow: 'hidden', marginBottom: 14,
    shadowColor: C.blueDeep, shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.34, shadowRadius: 24, elevation: 8,
  },
  heroLogo: {
    position: 'absolute', top: 16, right: 16,
    width: 40, height: 40, tintColor: '#fff', opacity: 0.9,
  },
  heroLabel: {
    fontFamily: 'System', fontWeight: '800', fontSize: 11,
    color: 'rgba(255,255,255,0.9)', letterSpacing: 1.3, textTransform: 'uppercase',
  },
  heroValue: {
    fontFamily: 'System', fontWeight: '800', fontSize: 52,
    color: '#fff', letterSpacing: -1.6, marginTop: 6, lineHeight: 56,
  },
  heroEnds: {
    fontFamily: 'System', fontWeight: '600', fontSize: 13,
    color: 'rgba(255,255,255,0.88)', marginTop: 6,
  },
  progressTrack: {
    height: 6, borderRadius: 3, marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.24)', overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#fff' },

  // ── Spot summary card ───────────────────────────────────────────────
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 18,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    marginBottom: 12,
  },
  summaryLogo: { width: 40, height: 40 },
  summaryLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  summaryAddress: { fontFamily: 'System', fontWeight: '800', fontSize: 16, color: C.white, letterSpacing: -0.3, marginTop: 3 },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#50607A',
  },
  mapsBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 12, color: C.white, letterSpacing: -0.1 },

  // ── Start → End → Total receipt row ─────────────────────────────────
  timeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    marginBottom: 18,
  },
  timeBlock: { alignItems: 'flex-start' },
  timeLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: C.muted, letterSpacing: 1.1, textTransform: 'uppercase' },
  timeValue: { fontFamily: 'System', fontWeight: '800', fontSize: 20, color: C.white, letterSpacing: -0.4, marginTop: 4 },
  timeArrow: { width: 28, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  timeDivider: { flex: 1 },

  // ── Message-host action ─────────────────────────────────────────────
  actionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    marginBottom: 18,
  },
  actionPillIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(94,162,245,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionPillLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: C.white, letterSpacing: -0.15 },
  actionPillHint: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: C.muted, marginTop: 1 },

  // ── Extend ──────────────────────────────────────────────────────────
  sectionLabel: {
    fontFamily: 'System', fontWeight: '700', fontSize: 11,
    color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 10, marginLeft: 4,
  },
  extendRow: { flexDirection: 'row', gap: 10 },
  extendBtn: {
    flex: 1, height: 60, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', gap: 2,
    backgroundColor: 'rgba(94,162,245,0.12)',
    borderWidth: 1, borderColor: 'rgba(94,162,245,0.32)',
  },
  extendBtnText: { fontFamily: 'System', fontWeight: '800', fontSize: 17, color: C.blue, letterSpacing: -0.34 },
  extendBtnPrice: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: C.blue },

  // ── Pinned footer ───────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 20, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  endBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 54, borderRadius: 999,
    backgroundColor: 'rgba(239,143,122,0.12)',
    borderWidth: 1, borderColor: 'rgba(239,143,122,0.34)',
  },
  endBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: C.danger, letterSpacing: -0.15 },

  // ── Empty state ─────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 22, borderWidth: 1, borderColor: C.border,
    padding: 24, alignItems: 'center', marginTop: 60,
  },
  emptyLogo: { width: 56, height: 56, marginBottom: 14 },
  emptyTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 18, color: C.white, letterSpacing: -0.36, marginBottom: 6 },
  emptySub: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },
});
