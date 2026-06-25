import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import EarningsChart from '../components/EarningsChart';
import HostSpotCard from '../components/HostSpotCard';
import { useSpots } from '../context/SpotsContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatKr } from '../lib/format';

// TODO: wire HostSpotCard — normalise() in SpotsContext drops address/area/photos.
// Static host listings + payouts (handoff data). Replace with live data later.
const STATIC_SPOTS = [
  { id: '1', address: 'Møhlenprisbakken 12', area: 'Møhlenpris', status: 'active', price: 35, weekly: 1540, photoUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400' },
  { id: '2', address: 'Nygårdsgaten 7',      area: 'Nygård',     status: 'paused', price: 28, weekly: 0,    photoUrl: 'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=400' },
  { id: '3', address: 'Sandviksveien 44',    area: 'Sandviken',  status: 'active', price: 22, weekly: 720,  photoUrl: null },
];
const STATIC_PAYOUTS = [
  { id: 'p1', date: '15. juni', amount: 1920 },
  { id: 'p2', date: '1. juli',  amount: 2480 },
];

const BAR_DAYS = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

function fmt(n) {
  if (n === 0) return '0';
  return Math.round(n).toLocaleString('nb-NO').replace(/ /g, ' ');
}

const PERIOD_META = [
  { id: 'week',  label: 'Uke',   heading: 'denne uken'    },
  { id: 'month', label: 'Måned', heading: 'denne måneden' },
  { id: 'year',  label: 'År',    heading: 'i år'          },
];

export default function HostScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState('week');
  const { spots: SPOTS } = useSpots();
  const { user, profile } = useAuth();

  const [earnings, setEarnings]   = useState({ week: 0, month: 0, year: 0 });
  const [dailyBars, setDailyBars] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [loadingE, setLoadingE]   = useState(true);
  const [payout, setPayout]       = useState({ queued: 0, nextDate: null, loading: true });

  useEffect(() => {
    if (!user) { setLoadingE(false); return; }

    const run = async () => {
      const { data: spotRows } = await supabase
        .from('spots')
        .select('id')
        .eq('owner_id', user.id);

      if (!spotRows || spotRows.length === 0) {
        setLoadingE(false);
        return;
      }

      const spotIds = spotRows.map(s => s.id);
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const { data: rows } = await supabase
        .from('reservations')
        .select('starts_at, price_subtotal, status')
        .in('spot_id', spotIds)
        .in('status', ['confirmed', 'completed'])
        .gte('starts_at', yearStart.toISOString());

      if (!rows) { setLoadingE(false); return; }

      const weekStart = new Date(now);
      const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
      weekStart.setDate(now.getDate() - dow);
      weekStart.setHours(0, 0, 0, 0);

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const dailyMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dailyMap[d.toISOString().slice(0, 10)] = 0;
      }

      let week = 0, month = 0, year = 0;
      for (const r of rows) {
        const amt  = r.price_subtotal ?? 0;
        const date = new Date(r.starts_at);
        year  += amt;
        if (date >= monthStart) month += amt;
        if (date >= weekStart)  week  += amt;
        const key = date.toISOString().slice(0, 10);
        if (key in dailyMap) dailyMap[key] += amt;
      }

      setEarnings({ week, month, year });

      const vals = Object.values(dailyMap);
      const max  = Math.max(...vals, 1);
      setDailyBars(vals.map(v => Math.round((v / max) * 86) + 6));
      setLoadingE(false);
    };

    run();
  }, [user]);

  useEffect(() => {
    if (!user) { setPayout(prev => ({ ...prev, loading: false })); return; }

    const run = async () => {
      const { data: spotRows } = await supabase.from('spots').select('id').eq('owner_id', user.id);
      if (!spotRows?.length) { setPayout({ queued: 0, nextDate: null, loading: false }); return; }

      const spotIds = spotRows.map(s => s.id);
      const now = new Date();
      const dow = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - dow);
      lastMonday.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('reservations')
        .select('price_subtotal')
        .in('spot_id', spotIds)
        .in('status', ['confirmed', 'completed'])
        .gte('starts_at', lastMonday.toISOString());

      const queued = (data ?? []).reduce((sum, r) => sum + (r.price_subtotal ?? 0), 0);

      const daysUntilMonday = ((8 - now.getDay()) % 7) || 7;
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(10, 0, 0, 0);

      setPayout({ queued, nextDate: nextMonday, loading: false });
    };

    run();
  }, [user]);

  const cur     = PERIOD_META.find(p => p.id === period);
  const curAmt  = earnings[period];
  const subText = period === 'week'  ? `${fmt(earnings.month)} kr denne måneden`
                : period === 'month' ? `${fmt(earnings.year)} kr i år`
                : `${SPOTS.length} plasser aktive`;

  const initials = (profile?.full_name ?? 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const firstName = profile?.full_name?.split(' ')[0] ?? 'deg';

  const payoutCountdown = (() => {
    if (!payout.nextDate) return null;
    const days = Math.ceil((payout.nextDate - new Date()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'I dag';
    if (days === 1) return 'I morgen';
    return `Om ${days} dager`;
  })();

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile hero */}
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{firstName}</Text>
            <Text style={styles.heroSub}>Utleier</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Profil')} activeOpacity={0.85} style={styles.avatarWrap}>
            <LinearGradient colors={['#4E96F0', '#6FB1F7']} style={[StyleSheet.absoluteFillObject, { borderRadius: 40 }]} />
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {SPOTS.length === 0 && !loadingE ? (
          /* ── Onboarding state (no spots yet) ── */
          <View style={styles.onboardCard}>
            <LinearGradient colors={['#4E96F0', '#5EA2F5', '#4E96F0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
            <View style={styles.onboardBlob} />
            <Text style={styles.onboardTitle}>Lei ut plassen din</Text>
            <Text style={styles.onboardSub}>Tjen penger på parkeringsplassen du ikke bruker — uten noe styr.</Text>
            <View style={styles.onboardDivider} />
            {[
              { icon: 'trending-up', text: 'Tjen 1 500–4 000 kr/mnd i Bergen' },
              { icon: 'sliders',     text: 'Du bestemmer når og hvem som parkerer' },
              { icon: 'shield',      text: 'Sikker betaling og forsikring inkludert' },
            ].map((row) => (
              <View key={row.icon} style={styles.onboardRow}>
                <View style={styles.onboardIconWrap}>
                  <Icon name={row.icon} size={14} color="#fff" strokeWidth={2} />
                </View>
                <Text style={styles.onboardRowText}>{row.text}</Text>
              </View>
            ))}
          </View>
        ) : (
          /* ── Active host: interactive earnings chart ── */
          <EarningsChart onYtdPress={() => {}} />
        )}

        {/* Bank-account setup prompt (still real — needed to receive payouts) */}
        {!payout.loading && !profile?.bank_account && (
          <View style={styles.payoutCard}>
            <LinearGradient colors={['#4E96F0', '#5EA2F5', '#4E96F0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]} />
            <TouchableOpacity style={styles.payoutSetupRow} activeOpacity={0.85} onPress={() => navigation.getParent()?.navigate('Profil', { screen: 'Betalingsmetoder' })}>
              <View style={styles.payoutSetupIcon}>
                <Icon name="alert-circle" size={18} color="#fff" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payoutSetupTitle}>Legg til bankkonto</Text>
                <Text style={styles.payoutSetupSub}>Påkrevd for å motta utbetalinger</Text>
              </View>
              <Icon name="chevron-right" size={16} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        {/* Full-bleed divider band */}
        <View style={styles.dividerBand} />

        {/* Kommende (upcoming payouts) */}
        <Text style={styles.kommendeTitle}>Kommende</Text>
        <View style={styles.payoutList}>
          {STATIC_PAYOUTS.map((p, i) => (
            <View key={p.id} style={[styles.payoutRow, i < STATIC_PAYOUTS.length - 1 && styles.payoutRowBorder]}>
              <View>
                <Text style={styles.payoutOverline}>PLANLAGT</Text>
                <Text style={styles.payoutDate}>{p.date}</Text>
              </View>
              <Text style={styles.payoutAmount}>{formatKr(p.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Inbox shortcut */}
        <TouchableOpacity style={styles.inboxRow} activeOpacity={0.85} onPress={() => navigation.push('Inboks')}>
          <View style={styles.inboxIcon}>
            <Icon name="bell" size={16} color="#FFFFFF" strokeWidth={1.8} />
          </View>
          <View style={styles.inboxText}>
            <Text style={styles.inboxLabel}>Innboks</Text>
            <Text style={styles.inboxHint}>Se reservasjoner for plassene dine</Text>
          </View>
          <Icon name="chevron-right" size={16} color="#6E809B" strokeWidth={2} />
        </TouchableOpacity>

        {/* My spots */}
        <Text style={styles.spotsTitle}>Mine spots</Text>
        <Text style={styles.spotsSub}>
          {STATIC_SPOTS.filter(sp => sp.status === 'active').length} aktive · {formatKr(STATIC_SPOTS.reduce((sum, sp) => sum + sp.weekly, 0))} denne uken
        </Text>
        {STATIC_SPOTS.map((spot) => (
          <HostSpotCard
            key={spot.id}
            status={spot.status}
            address={spot.address}
            area={spot.area}
            weekly={spot.weekly}
            price={spot.price}
            photoUrl={spot.photoUrl}
            onPress={() => navigation.push('RedigerPlass', { spot })}
            onMenu={() => navigation.push('RedigerPlass', { spot })}
          />
        ))}

        {/* Add spot CTA */}
        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={() => navigation.push('LeiUt', { isFirst: SPOTS.length === 0 })}>
          <LinearGradient colors={['#4E96F0', '#5EA2F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]} />
          <Icon name="zap" size={18} color="#fff" strokeWidth={2} />
          <Text style={styles.ctaText}>{SPOTS.length === 0 ? 'Lei ut en plass' : 'Lei ut en plass til'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22, paddingHorizontal: 2 },
  avatarWrap: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)' },
  avatarText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', zIndex: 1 },
  heroText: { flex: 1 },
  heroName: { fontFamily: 'System', fontWeight: '800', fontSize: 18, color: '#FFFFFF', letterSpacing: -0.36 },
  heroSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 2 },

  onboardCard: { borderRadius: 28, overflow: 'hidden', padding: 24, marginBottom: 20 },
  onboardBlob: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -60 },
  onboardTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 24, color: '#fff', letterSpacing: -0.48, marginBottom: 8 },
  onboardSub: { fontFamily: 'System', fontWeight: '400', fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20, marginBottom: 20 },
  onboardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 18 },
  onboardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  onboardIconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  onboardRowText: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#fff', flex: 1 },

  periodRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  periodBtn: { flex: 1, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  periodBtnActive: { backgroundColor: '#5EA2F5', borderColor: '#5EA2F5' },
  periodText: { fontFamily: 'System', fontWeight: '700', fontSize: 13, color: '#FFFFFF', letterSpacing: -0.13 },
  periodTextActive: { color: '#fff' },

  earningsCard: {
    borderRadius: 28, overflow: 'hidden', padding: 22, marginBottom: 20,
    backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 24, elevation: 4,
  },
  cardBlob: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(16,185,129,0.08)', top: -60, right: -60 },
  cardLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: '#98B6D8', letterSpacing: 1, textTransform: 'uppercase' },
  cardValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8, marginBottom: 4 },
  cardValue: { fontFamily: 'System', fontWeight: '800', fontSize: 42, color: '#FFFFFF', letterSpacing: -1.26 },
  cardUnit: { fontFamily: 'System', fontWeight: '600', fontSize: 16, color: '#98B6D8' },
  cardSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginBottom: 20 },

  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 60 },
  barWrap: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6 },
  barLabels: { flexDirection: 'row', marginTop: 8, gap: 6 },
  barLabel: { flex: 1, fontFamily: 'System', fontWeight: '600', fontSize: 10, textAlign: 'center' },

  payoutCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, overflow: 'hidden', padding: 20, marginBottom: 14 },
  payoutLeft: { flex: 1 },
  payoutLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase' },
  payoutAmtRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 4 },
  payoutAmt: { fontFamily: 'System', fontWeight: '800', fontSize: 34, color: '#fff', letterSpacing: -0.68 },
  payoutUnit: { fontFamily: 'System', fontWeight: '600', fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  payoutSub: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3, textTransform: 'capitalize' },
  payoutBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)' },
  payoutBadgeText: { fontFamily: 'System', fontWeight: '700', fontSize: 12, color: '#fff' },
  payoutSetupRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  payoutSetupIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  payoutSetupTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#fff', letterSpacing: -0.14 },
  payoutSetupSub: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  inboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 14, shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  inboxIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#50607A', alignItems: 'center', justifyContent: 'center' },
  inboxText: { flex: 1 },
  inboxLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14 },
  inboxHint: { fontFamily: 'System', fontWeight: '400', fontSize: 12, color: '#98B6D8', marginTop: 2 },

  sectionTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },

  dividerBand: { height: 7, borderRadius: 999, backgroundColor: 'rgba(152,182,216,0.16)', marginHorizontal: -20, marginTop: 24, marginBottom: 20 },
  kommendeTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 19, color: '#FFFFFF', marginBottom: 10 },
  payoutList: { marginBottom: 24 },
  payoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  payoutRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(152,182,216,0.16)' },
  payoutOverline: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#6E809B', letterSpacing: 0.8, textTransform: 'uppercase' },
  payoutDate: { fontFamily: 'System', fontWeight: '600', fontSize: 16, color: '#FFFFFF', marginTop: 2 },
  payoutAmount: { fontFamily: 'System', fontWeight: '700', fontSize: 18, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  spotsTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 23, color: '#FFFFFF', letterSpacing: -0.5 },
  spotsSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12.5, color: '#98B6D8', marginTop: 2, marginBottom: 16 },

  spotRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 8, shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statusDotWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  spotInfo: { flex: 1 },
  spotTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14 },
  spotSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 2 },
  spotPrice: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#FFFFFF' },

  cta: { height: 56, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 6 },
  ctaText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.16 },
});
