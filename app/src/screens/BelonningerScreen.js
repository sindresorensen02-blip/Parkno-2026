import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

const ACCENT = '#17E6A1';   // Belønninger green (matches the Aktivitet card)
const BALANCE = 240;        // skeleton poeng balance
const NEXT_TIER = 500;      // poeng to next reward

// Skeleton reward tiers. Replace with real rewards later.
const REWARDS = [
  { id: '1', title: 'Belønning 1', sub: 'Lås opp med poeng', cost: 150, icon: 'star' },
  { id: '2', title: 'Belønning 2', sub: 'Lås opp med poeng', cost: 300, icon: 'zap' },
  { id: '3', title: 'Belønning 3', sub: 'Lås opp med poeng', cost: 500, icon: 'shield' },
  { id: '4', title: 'Belønning 4', sub: 'Lås opp med poeng', cost: 750, icon: 'heart' },
];

export default function BelonningerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'deg';
  const pct = Math.min(1, BALANCE / NEXT_TIER);

  return (
    <View style={s.root}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#2B394C' }]} />

      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={8}>
            <Icon name="arrow-left" size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={s.title}>Belønninger</Text>
        </View>

        {/* Points balance hero */}
        <View style={s.hero}>
          <View style={s.heroOrbA} />
          <View style={s.heroOrbB} />
          <Text style={s.heroEyebrow}>DINE POENG</Text>
          <View style={s.heroBalanceRow}>
            <Text style={s.heroBalance}>{BALANCE}</Text>
            <Text style={s.heroUnit}>poeng</Text>
          </View>
          <Text style={s.heroName}>Hei, {firstName} 👋</Text>

          {/* Progress to next reward */}
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${pct * 100}%` }]} />
          </View>
          <Text style={s.progressLabel}>{NEXT_TIER - BALANCE} poeng til neste belønning</Text>
        </View>

        {/* Rewards list */}
        <Text style={s.sectionTitle}>Tilgjengelige belønninger</Text>
        {REWARDS.map((r) => {
          const locked = BALANCE < r.cost;
          return (
            <TouchableOpacity key={r.id} style={s.card} activeOpacity={0.88}>
              <View style={[s.cardIcon, { backgroundColor: hexA(ACCENT, 0.16) }]}>
                <Icon name={r.icon} size={20} color={ACCENT} strokeWidth={2} />
              </View>
              <View style={s.cardMid}>
                <Text style={s.cardTitle}>{r.title}</Text>
                <Text style={s.cardSub}>{r.sub}</Text>
              </View>
              <View style={s.cardEnd}>
                <Text style={s.cardCost}>{r.cost}</Text>
                <View style={[s.redeemBtn, locked ? s.redeemLocked : s.redeemReady]}>
                  {locked
                    ? <Icon name="key" size={13} color="#6E809B" strokeWidth={2} />
                    : <Text style={s.redeemText}>Løs inn</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// rgba() from #RRGGBB hex + alpha.
function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  title: { fontFamily: 'System', fontWeight: '800', fontSize: 23, color: '#FFFFFF', letterSpacing: -0.5 },

  // Points balance hero
  hero: {
    borderRadius: 28, overflow: 'hidden', padding: 24, marginBottom: 24,
    backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.24, shadowRadius: 22, elevation: 8,
  },
  heroOrbA: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(23,230,161,0.10)', top: -90, right: -60 },
  heroOrbB: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(23,230,161,0.07)', bottom: -80, left: -40 },
  heroEyebrow: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#98B6D8', letterSpacing: 1.4, textTransform: 'uppercase' },
  heroBalanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  heroBalance: { fontFamily: 'System', fontWeight: '800', fontSize: 48, color: ACCENT, letterSpacing: -1.6, fontVariant: ['tabular-nums'] },
  heroUnit: { fontFamily: 'System', fontWeight: '600', fontSize: 16, color: '#98B6D8' },
  heroName: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#E6EEF8', marginTop: 4, marginBottom: 20 },

  progressTrack: { height: 8, borderRadius: 999, backgroundColor: 'rgba(152,182,216,0.16)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: ACCENT },
  progressLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 10 },

  sectionTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 17, color: '#FFFFFF', letterSpacing: -0.34, marginBottom: 12 },

  // Reward card
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, padding: 16, marginBottom: 12,
    backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  cardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardMid: { flex: 1 },
  cardTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#FFFFFF', letterSpacing: -0.2 },
  cardSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 2 },
  cardEnd: { alignItems: 'flex-end', gap: 8 },
  cardCost: { fontFamily: 'System', fontWeight: '800', fontSize: 16, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  redeemBtn: { minWidth: 64, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  redeemReady: { backgroundColor: ACCENT },
  redeemLocked: { backgroundColor: 'rgba(152,182,216,0.12)' },
  redeemText: { fontFamily: 'System', fontWeight: '700', fontSize: 12.5, color: '#0B1F1A' },
});
