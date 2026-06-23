import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useSpots } from '../context/SpotsContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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
      <LinearGradient colors={['#F7F7F2', '#F7F7F2']} style={StyleSheet.absoluteFillObject} />

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
            <LinearGradient colors={['#DCEBDF', '#9ECFE3']} style={[StyleSheet.absoluteFillObject, { borderRadius: 40 }]} />
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {SPOTS.length === 0 && !loadingE ? (
          /* ── Onboarding state (no spots yet) ── */
          <View style={styles.onboardCard}>
            <LinearGradient colors={['#10B981', '#14B8A6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
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
          /* ── Active host: period switcher + earnings card ── */
          <>
            <View style={styles.periodRow}>
              {PERIOD_META.map((p) => (
                <TouchableOpacity key={p.id} onPress={() => setPeriod(p.id)} style={[styles.periodBtn, period === p.id && styles.periodBtnActive]}>
                  <Text style={[styles.periodText, period === p.id && styles.periodTextActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.earningsCard}>
              <View style={styles.cardBlob} />
              <Text style={styles.cardLabel}>Inntekt {cur.heading}</Text>
              <View style={styles.cardValueRow}>
                {loadingE ? (
                  <ActivityIndicator color="#111416" style={{ marginVertical: 8 }} />
                ) : (
                  <>
                    <Text style={styles.cardValue}>{fmt(curAmt)}</Text>
                    <Text style={styles.cardUnit}>kr</Text>
                  </>
                )}
              </View>
              <Text style={styles.cardSub}>{loadingE ? '—' : subText}</Text>

              <View style={styles.barsContainer}>
                {dailyBars.map((h, i) => (
                  <View key={i} style={styles.barWrap}>
                    <View style={[styles.bar, { height: `${h}%`, backgroundColor: i === 6 ? '#10B981' : 'rgba(17,20,22,0.09)' }]} />
                  </View>
                ))}
              </View>
              <View style={styles.barLabels}>
                {BAR_DAYS.map((d, i) => (
                  <Text key={i} style={[styles.barLabel, { color: i === 6 ? '#10B981' : '#BCC5CB' }]}>{d}</Text>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Payout card */}
        {!payout.loading && (payout.queued > 0 || !profile?.bank_account) && (
          <View style={styles.payoutCard}>
            <LinearGradient colors={['#10B981', '#14B8A6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]} />
            {!profile?.bank_account ? (
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
            ) : (
              <>
                <View style={styles.payoutLeft}>
                  <Text style={styles.payoutLabel}>Neste utbetaling</Text>
                  <View style={styles.payoutAmtRow}>
                    <Text style={styles.payoutAmt}>{fmt(Math.round(payout.queued))}</Text>
                    <Text style={styles.payoutUnit}>kr</Text>
                  </View>
                  <Text style={styles.payoutSub}>
                    {payout.nextDate
                      ? payout.nextDate.toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'short' })
                      : '—'}
                  </Text>
                </View>
                {payoutCountdown && (
                  <View style={styles.payoutBadge}>
                    <Icon name="clock" size={12} color="#fff" strokeWidth={2} />
                    <Text style={styles.payoutBadgeText}>{payoutCountdown}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Inbox shortcut */}
        <TouchableOpacity style={styles.inboxRow} activeOpacity={0.85} onPress={() => navigation.push('Inboks')}>
          <View style={styles.inboxIcon}>
            <Icon name="bell" size={16} color="#111416" strokeWidth={1.8} />
          </View>
          <View style={styles.inboxText}>
            <Text style={styles.inboxLabel}>Innboks</Text>
            <Text style={styles.inboxHint}>Se reservasjoner for plassene dine</Text>
          </View>
          <Icon name="chevron-right" size={16} color="#C4CACC" strokeWidth={2} />
        </TouchableOpacity>

        {/* My spots */}
        {SPOTS.length > 0 && (
          <Text style={styles.sectionTitle}>Mine plasser</Text>
        )}
        {SPOTS.map((spot) => (
          <TouchableOpacity key={spot.id} style={styles.spotRow} activeOpacity={0.85} onPress={() => navigation.push('RedigerPlass', { spot })}>
            <View style={[styles.statusDotWrap, {
              backgroundColor: spot.moderation_status === 'pending'  ? 'rgba(245,158,11,0.12)'
                             : spot.moderation_status === 'rejected' ? 'rgba(239,68,68,0.08)'
                             : spot.active ? 'rgba(16,185,129,0.12)' : 'rgba(17,20,22,0.06)',
            }]}>
              <View style={[styles.statusDot, {
                backgroundColor: spot.moderation_status === 'pending'  ? '#F59E0B'
                               : spot.moderation_status === 'rejected' ? '#EF4444'
                               : spot.active ? '#10B981' : '#BCC5CB',
              }]} />
            </View>
            <View style={styles.spotInfo}>
              <Text style={styles.spotTitle}>{spot.title}</Text>
              <Text style={[styles.spotSub, spot.moderation_status === 'rejected' && { color: '#EF4444' }]}>{spot.sub}</Text>
            </View>
            <Text style={styles.spotPrice}>{spot.price} kr/t</Text>
            <Icon name="chevron-right" size={16} color="#C4CACC" />
          </TouchableOpacity>
        ))}

        {/* Add spot CTA */}
        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={() => navigation.push('LeiUt', { isFirst: SPOTS.length === 0 })}>
          <LinearGradient colors={['#10B981', '#14B8A6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]} />
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
  avatarWrap: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  avatarText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#111416', zIndex: 1 },
  heroText: { flex: 1 },
  heroName: { fontFamily: 'System', fontWeight: '800', fontSize: 18, color: '#111416', letterSpacing: -0.36 },
  heroSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#7B8589', marginTop: 2 },

  onboardCard: { borderRadius: 28, overflow: 'hidden', padding: 24, marginBottom: 20 },
  onboardBlob: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -60 },
  onboardTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 24, color: '#fff', letterSpacing: -0.48, marginBottom: 8 },
  onboardSub: { fontFamily: 'System', fontWeight: '400', fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20, marginBottom: 20 },
  onboardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 18 },
  onboardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  onboardIconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  onboardRowText: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#fff', flex: 1 },

  periodRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  periodBtn: { flex: 1, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  periodBtnActive: { backgroundColor: '#111416', borderColor: '#111416' },
  periodText: { fontFamily: 'System', fontWeight: '700', fontSize: 13, color: '#111416', letterSpacing: -0.13 },
  periodTextActive: { color: '#fff' },

  earningsCard: {
    borderRadius: 28, overflow: 'hidden', padding: 22, marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#111416', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 24, elevation: 4,
  },
  cardBlob: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(16,185,129,0.08)', top: -60, right: -60 },
  cardLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: '#7B8589', letterSpacing: 1, textTransform: 'uppercase' },
  cardValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8, marginBottom: 4 },
  cardValue: { fontFamily: 'System', fontWeight: '800', fontSize: 42, color: '#111416', letterSpacing: -1.26 },
  cardUnit: { fontFamily: 'System', fontWeight: '600', fontSize: 16, color: '#7B8589' },
  cardSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#7B8589', marginBottom: 20 },

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

  inboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', marginBottom: 14, shadowColor: '#111416', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  inboxIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(17,20,22,0.06)', alignItems: 'center', justifyContent: 'center' },
  inboxText: { flex: 1 },
  inboxLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#111416', letterSpacing: -0.14 },
  inboxHint: { fontFamily: 'System', fontWeight: '400', fontSize: 12, color: '#7B8589', marginTop: 2 },

  sectionTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#7B8589', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },

  spotRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', marginBottom: 8, shadowColor: '#111416', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statusDotWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  spotInfo: { flex: 1 },
  spotTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#111416', letterSpacing: -0.14 },
  spotSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#7B8589', marginTop: 2 },
  spotPrice: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#111416' },

  cta: { height: 56, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 6 },
  ctaText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.16 },
});
