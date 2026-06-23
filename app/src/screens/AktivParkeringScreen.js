import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useActiveBooking } from '../context/ActiveBookingContext';
import { BOOKING_FEE_RATE } from '../constants/booking';

function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }
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

  if (!booking) {
    return (
      <View style={s.root}>
        <LinearGradient colors={['#F8FAF7', '#EAF0EC', '#D8EEF2']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFillObject} />
        <View style={[s.emptyWrap, { paddingTop: insets.top + 20 }]}>
          <View style={s.header}>
            {navigation.canGoBack() ? (
              <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn} hitSlop={8}>
                <Icon name="arrow-left" size={20} color="#17211F" />
              </TouchableOpacity>
            ) : (
              <View style={s.iconBtn} />
            )}
            <Text style={s.headerTitle}>Aktiv parkering</Text>
            <View style={s.iconBtn} />
          </View>
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}><Icon name="map-pin" size={26} color="#4EA7B9" strokeWidth={2} /></View>
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

  const bigLabel = isPending
    ? (startsInMins < 60 ? `${startsInMins} min` : `${Math.floor(startsInMins / 60)} t ${startsInMins % 60} min`)
    : (remainingMins < 60 ? `${remainingMins} min` : `${Math.floor(remainingMins / 60)} t ${remainingMins % 60} min`);

  const bigSub = isPending ? 'til parkeringen starter' : 'igjen av parkeringen';

  return (
    <View style={s.root}>
      <LinearGradient colors={['#F8FAF7', '#EAF0EC', '#D8EEF2']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          {navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn} hitSlop={8}>
              <Icon name="arrow-left" size={20} color="#17211F" />
            </TouchableOpacity>
          ) : (
            <View style={s.iconBtn} />
          )}
          <View style={s.headerCenter}>
            <View style={s.liveDotWrap}>
              <View style={s.liveDot} />
              <Text style={s.liveLabel}>{isPending ? 'PLANLAGT' : 'PÅGÅR NÅ'}</Text>
            </View>
          </View>
          <View style={s.iconBtn} />
        </View>

        {/* Big countdown card */}
        <View style={s.countdownCard}>
          <LinearGradient
            colors={isPending ? ['#4EA7B9', '#93D6E3'] : ['#10B981', '#14B8A6', '#2563EB']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
          />
          <Text style={s.countdownLabel}>{bigSub}</Text>
          <Text style={s.countdownValue}>{bigLabel}</Text>
          <Text style={s.countdownEnds}>
            {isPending
              ? `Starter ${fmtClock(new Date(start))} · slutter ${fmtClock(new Date(end))}`
              : `Slutter ${fmtClock(new Date(end))}`}
          </Text>

          {/* Progress bar */}
          {!isPending && (
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${elapsed * 100}%` }]} />
            </View>
          )}
        </View>

        {/* Spot card */}
        <View style={s.spotCard}>
          <View style={s.spotIcon}>
            <Icon name="map-pin" size={18} color="#4EA7B9" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.spotLabel}>Plass</Text>
            <Text style={s.spotAddress}>{booking.spots?.address ?? 'Reservasjon'}</Text>
          </View>
          <TouchableOpacity style={s.mapsBtn} onPress={openInMaps} activeOpacity={0.85}>
            <Icon name="map" size={14} color="#17211F" strokeWidth={2} />
            <Text style={s.mapsBtnText}>Kart</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statBlock}>
            <Text style={s.statLabel}>Start</Text>
            <Text style={s.statValue}>{fmtClock(new Date(start))}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBlock}>
            <Text style={s.statLabel}>Slutt</Text>
            <Text style={s.statValue}>{fmtClock(new Date(end))}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBlock}>
            <Text style={s.statLabel}>Totalt</Text>
            <Text style={s.statValue}>{booking.total ?? 0} kr</Text>
          </View>
        </View>

        {/* Quick actions row — message host */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={s.actionPill}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Inboks', { spotId: booking.spots?.id, address: booking.spots?.address })}
          >
            <View style={s.actionPillIcon}>
              <Icon name="mail" size={16} color="#4EA7B9" strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.actionPillLabel}>Send melding</Text>
              <Text style={s.actionPillHint}>Til utleier</Text>
            </View>
            <Icon name="chevron-right" size={15} color="#73817D" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* Extend */}
        {!isPending && (
          <>
            <Text style={s.sectionLabel}>Trenger du mer tid?</Text>
            <View style={s.extendRow}>
              <TouchableOpacity style={s.extendBtn} onPress={() => extend(30)} activeOpacity={0.88} disabled={extending}>
                {extending
                  ? <ActivityIndicator size="small" color="#4EA7B9" />
                  : <>
                      <Text style={s.extendBtnText}>+ 30 min</Text>
                      <Text style={s.extendBtnPrice}>
                        {Math.round((booking.spots?.price_per_hour ?? 0) * 0.5 * (1 + BOOKING_FEE_RATE))} kr
                      </Text>
                    </>
                }
              </TouchableOpacity>
              <TouchableOpacity style={s.extendBtn} onPress={() => extend(60)} activeOpacity={0.88} disabled={extending}>
                {extending
                  ? <ActivityIndicator size="small" color="#4EA7B9" />
                  : <>
                      <Text style={s.extendBtnText}>+ 1 time</Text>
                      <Text style={s.extendBtnPrice}>
                        {Math.round((booking.spots?.price_per_hour ?? 0) * 1 * (1 + BOOKING_FEE_RATE))} kr
                      </Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* End early */}
        {!isPending && (
          <TouchableOpacity style={s.endBtn} onPress={endNow} activeOpacity={0.85} disabled={ending}>
            {ending
              ? <ActivityIndicator color="#B33A3A" />
              : (
                <>
                  <Icon name="x" size={15} color="#B33A3A" strokeWidth={2.4} />
                  <Text style={s.endBtnText}>Avslutt parkering</Text>
                </>
              )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#17211F', letterSpacing: -0.32 },
  liveDotWrap: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  liveLabel: { fontFamily: 'System', fontWeight: '800', fontSize: 10, color: '#17211F', letterSpacing: 1.2 },

  // Countdown hero card
  countdownCard: {
    borderRadius: 28, padding: 24, overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.32, shadowRadius: 26, elevation: 8,
  },
  countdownLabel: {
    fontFamily: 'System', fontWeight: '700', fontSize: 11,
    color: 'rgba(255,255,255,0.88)', letterSpacing: 1.2, textTransform: 'uppercase',
  },
  countdownValue: {
    fontFamily: 'System', fontWeight: '800', fontSize: 56,
    color: '#fff', letterSpacing: -1.8, marginTop: 4, lineHeight: 60,
  },
  countdownEnds: {
    fontFamily: 'System', fontWeight: '600', fontSize: 13,
    color: 'rgba(255,255,255,0.85)', marginTop: 4,
  },
  progressTrack: {
    height: 6, borderRadius: 3, marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: '#fff',
  },

  // Spot row
  spotCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
    marginBottom: 14,
  },
  spotIcon: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(78,167,185,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  spotLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#73817D', letterSpacing: 1.2, textTransform: 'uppercase' },
  spotAddress: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#17211F', letterSpacing: -0.2, marginTop: 2 },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(23,33,31,0.06)',
  },
  mapsBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 12, color: '#17211F', letterSpacing: -0.1 },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
    marginBottom: 22,
  },
  statBlock: { flex: 1, alignItems: 'center' },
  statLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#73817D', letterSpacing: 1.1, textTransform: 'uppercase' },
  statValue: { fontFamily: 'System', fontWeight: '800', fontSize: 17, color: '#17211F', letterSpacing: -0.34, marginTop: 4 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(23,33,31,0.10)' },

  sectionLabel: {
    fontFamily: 'System', fontWeight: '700', fontSize: 11,
    color: '#73817D', letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 10, marginLeft: 4,
  },

  actionsRow: { marginBottom: 18 },
  actionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
  },
  actionPillIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(78,167,185,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionPillLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#17211F', letterSpacing: -0.15 },
  actionPillHint: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: '#73817D', marginTop: 1 },
  extendRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  extendBtn: {
    flex: 1, height: 60, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', gap: 2,
    backgroundColor: 'rgba(78,167,185,0.12)',
    borderWidth: 1, borderColor: 'rgba(78,167,185,0.32)',
  },
  extendBtnText: { fontFamily: 'System', fontWeight: '800', fontSize: 17, color: '#2F6573', letterSpacing: -0.34 },
  extendBtnPrice: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: '#4EA7B9' },

  endBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: 999,
    backgroundColor: 'rgba(220,80,80,0.10)',
    borderWidth: 1, borderColor: 'rgba(220,80,80,0.28)',
    marginTop: 4,
  },
  endBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#B33A3A', letterSpacing: -0.15 },

  // Empty state
  emptyWrap: { flex: 1, paddingHorizontal: 20 },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
    padding: 22, alignItems: 'center', marginTop: 60,
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: 'rgba(78,167,185,0.14)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 18, color: '#17211F', letterSpacing: -0.36, marginBottom: 6 },
  emptySub: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#73817D', textAlign: 'center', lineHeight: 19 },
});
