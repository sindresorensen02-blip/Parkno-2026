import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import EarningsChart from '../components/EarningsChart';
import HostSpotCard from '../components/HostSpotCard';
import { useSpots } from '../context/SpotsContext';
import { useAuth } from '../context/AuthContext';
import { formatKr } from '../lib/format';

// TODO: wire HostSpotCard — normalise() in SpotsContext drops address/area/photos.
// Static host listings + payouts (handoff data). Replace with live data later.
const STATIC_SPOTS = [
  { id: '1', address: 'Møhlenprisbakken 12', area: 'Møhlenpris', status: 'active', price: 35, weekly: 1540, photoUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400' },
  { id: '2', address: 'Nygårdsgaten 7',      area: 'Nygård',     status: 'paused', price: 28, weekly: 0,    photoUrl: 'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=400' },
  { id: '3', address: 'Sandviksveien 44',    area: 'Sandviken',  status: 'active', price: 22, weekly: 720,  photoUrl: null },
];

export default function HostScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { spots: SPOTS } = useSpots();
  const { user, profile } = useAuth();

  const [loadingE, setLoadingE]   = useState(true);

  // Gates the onboarding vs active layout until we know whether the user has
  // any spots. (Earnings figures are static in this pass — see EarningsChart.)
  useEffect(() => {
    if (!user) { setLoadingE(false); return; }
    setLoadingE(false);
  }, [user]);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'deg';

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 4, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: back button left, name · Utleier right */}
        <View style={styles.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{firstName}</Text>
            <Text style={styles.heroSub}>Utleier</Text>
          </View>
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

        {/* My spots */}
        <Text style={styles.spotsTitle}>Mine plasser</Text>
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

  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, paddingHorizontal: 2 },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  heroText: { alignItems: 'flex-end' },
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

  spotsTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 23, color: '#FFFFFF', letterSpacing: -0.5, marginTop: 24 },
  spotsSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12.5, color: '#98B6D8', marginTop: 2, marginBottom: 16 },

  cta: { height: 56, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 6 },
  ctaText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.16 },
});
