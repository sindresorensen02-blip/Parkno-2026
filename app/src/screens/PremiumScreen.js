import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { usePremium } from '../context/PremiumContext';

// Plans ordered cheapest → best value. `per` is the unit shown next to the price.
const PLANS = [
  { id: 'weekly',  label: 'Ukentlig',  price: 19,  per: 'uke', note: 'Si opp når som helst' },
  { id: 'monthly', label: 'Månedlig',  price: 49,  per: 'mnd', note: 'Faktureres månedlig', save: 'Populær', popular: true },
  { id: 'yearly',  label: 'Årlig',     price: 399, per: 'år',  note: 'Kun 33 kr/mnd',       save: 'Spar 32%' },
];

export default function PremiumScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isPremium, setIsPremium } = usePremium();
  const [selected, setSelected] = useState('monthly');

  const plan = PLANS.find(p => p.id === selected);

  const handleSubscribe = () => {
    setIsPremium(true);
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />

      {/* Bottom nav bar is absolute (~62px + safe area); reserve that space so the CTA clears it */}
      <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 74 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient
            colors={isPremium
              ? ['#4E96F0', '#5EA2F5', '#4E96F0', '#4E96F0']
              : ['#4E96F0', '#5EA2F5', '#6FB1F7', '#7FBBF8']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
          />
          <View style={styles.heroOrbA} />
          <View style={styles.heroOrbB} />
          <Image source={require('../../assets/parkno-logo.png')} style={styles.heroLogo} resizeMode="contain" />
          <Text style={styles.heroEyebrow}>{isPremium ? 'AKTIVT ABONNEMENT' : 'PARKNO PREMIUM'}</Text>
          <Text style={styles.heroTitle}>{isPremium ? 'Du er Premium' : 'Park smartere, betal mindre'}</Text>
          <Text style={styles.heroSub}>
            {isPremium
              ? 'Alle premium-fordeler er aktive. Takk for støtten.'
              : 'Lås opp alle fordeler og slipp bookingavgiften.'}
          </Text>
          {!isPremium && (
            <View style={styles.trialPill}>
              <Icon name="zap" size={11} color="#fff" strokeWidth={2.4} fill="#fff" />
              <Text style={styles.trialPillText}>7 dager gratis · ingen betaling nå</Text>
            </View>
          )}
        </View>

        {/* Plans / active state — flexes to fill remaining space */}
        <View style={styles.middle}>
          {isPremium ? (
            <View style={styles.activeCard}>
              <Icon name="check" size={24} color="#4E96F0" strokeWidth={2.5} />
              <Text style={styles.activeText}>Premium er aktivt på kontoen din.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Velg abonnement</Text>
              <View style={styles.plans}>
                {PLANS.map((p) => {
                  const active = p.id === selected;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.9}
                      onPress={() => setSelected(p.id)}
                      style={[styles.planCard, active && styles.planCardActive]}
                    >
                      <View style={[styles.radio, active && styles.radioActive]}>
                        {active && <View style={styles.radioDot} />}
                      </View>
                      <View style={styles.planMain}>
                        <View style={styles.planTopline}>
                          <Text style={styles.planLabel}>{p.label}</Text>
                          {p.save && (
                            <View style={[styles.saveBadge, p.popular && styles.saveBadgePopular]}>
                              <Text style={[styles.saveBadgeText, p.popular && styles.saveBadgeTextPopular]}>
                                {p.save}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.planNote}>{p.note}</Text>
                      </View>
                      <View style={styles.planPriceWrap}>
                        <Text style={styles.planPrice}>{p.price} kr</Text>
                        <Text style={styles.planPer}>/{p.per}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* CTA */}
        {isPremium ? (
          <TouchableOpacity activeOpacity={0.85} onPress={() => setIsPremium(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Avslutt Premium</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.9} onPress={handleSubscribe} style={styles.ctaBtn}>
            <LinearGradient
              colors={['#4E96F0', '#4E96F0']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]}
            />
            <Text style={styles.ctaText}>Start 7 dager gratis</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.fineprint}>
          {isPremium
            ? 'Fornyes automatisk · si opp når som helst'
            : `Gratis i 7 dager, deretter ${plan.price} kr/${plan.per} · si opp når som helst`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 40, height: 40 },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32 },

  hero: {
    borderRadius: 24, padding: 20, marginTop: 12, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  heroOrbA: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.13)', top: -80, right: -50 },
  heroOrbB: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.10)', bottom: -70, left: -30 },
  heroLogo: { width: 40, height: 40, tintColor: '#fff', marginBottom: 10 },
  heroEyebrow: { fontFamily: 'System', fontWeight: '700', fontSize: 9, color: 'rgba(255,255,255,0.72)', letterSpacing: 1.3 },
  heroTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 22, color: '#fff', letterSpacing: -0.5, marginTop: 5, lineHeight: 26 },
  heroSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12.5, color: 'rgba(255,255,255,0.82)', lineHeight: 18, marginTop: 6 },
  trialPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  trialPillText: { fontFamily: 'System', fontWeight: '700', fontSize: 11.5, color: '#fff', letterSpacing: -0.1 },

  middle: { flex: 1, justifyContent: 'center' },
  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  plans: { gap: 9 },
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: '#3A4C68', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18, paddingVertical: 14, paddingHorizontal: 15,
  },
  planCardActive: { borderColor: '#4E96F0', backgroundColor: 'rgba(94,162,245,0.10)' },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: '#6E809B', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#4E96F0' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#4E96F0' },
  planMain: { flex: 1 },
  planTopline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#FFFFFF', letterSpacing: -0.2 },
  saveBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.12)' },
  saveBadgePopular: { backgroundColor: 'rgba(124,58,237,0.12)' },
  saveBadgeText: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#0F9D63', letterSpacing: 0.2 },
  saveBadgeTextPopular: { color: '#4E96F0' },
  planNote: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 2 },
  planPriceWrap: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { fontFamily: 'System', fontWeight: '800', fontSize: 18, color: '#FFFFFF', letterSpacing: -0.3 },
  planPer: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#98B6D8', marginLeft: 1 },

  activeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: 18, padding: 18,
  },
  activeText: { flex: 1, fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#0F9D63', letterSpacing: -0.14 },

  ctaBtn: {
    height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 8,
    shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.32, shadowRadius: 16, elevation: 8,
  },
  ctaText: { fontFamily: 'System', fontWeight: '800', fontSize: 16, color: '#fff', letterSpacing: -0.2 },
  cancelBtn: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', marginTop: 8 },
  cancelText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#DC2626', letterSpacing: -0.15 },
  fineprint: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: '#A0A8AB', textAlign: 'center', marginTop: 10 },
});
