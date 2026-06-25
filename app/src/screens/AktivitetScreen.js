import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useSpots } from '../context/SpotsContext';

// Aktivitet tab — currently just hosts the "Lei ut plassen din" card (moved here
// from the profile page) plus a top-left arrow back to the map.
export default function AktivitetScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { spots } = useSpots();
  const showHostInsights = spots.length > 0;

  return (
    <View style={styles.root}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#2B394C' }]} />

      <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
        {/* Top-left arrow */}
        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate('Kart')}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Icon name="arrow-left" size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>

        {/* Lei ut plassen din (moved from Profil) */}
        <TouchableOpacity
          style={styles.rentCard}
          activeOpacity={0.9}
          onPress={() => {
            if (showHostInsights) navigation.getParent()?.navigate('Kart', { screen: 'Host' });
            else navigation.getParent()?.navigate('Kart', { screen: 'LeiUt', params: { isFirst: false } });
          }}
        >
          <LinearGradient
            colors={showHostInsights ? ['#4E96F0', '#5EA2F5', '#4E96F0'] : ['#4E96F0', '#5EA2F5']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
          />
          <View style={styles.rentOrbA} />
          <View style={styles.rentOrbB} />
          <Image
            source={require('../../assets/parkno-logo.png')}
            style={styles.rentLogo}
            resizeMode="contain"
          />
          <View style={styles.rentText}>
            <Text style={styles.rentEyebrow}>{showHostInsights ? 'PUBLISERT' : 'TILGJENGELIG'}</Text>
            <Text style={styles.rentTitle}>{showHostInsights ? 'Innsikt' : 'Lei ut plassen din'}</Text>
            <Text style={styles.rentHint}>
              {showHostInsights
                ? 'Se inntekt, reservasjoner og utbetalinger for plassene dine.'
                : 'Publiser parkeringsplassen og tjen penger når den står ledig.'}
            </Text>
          </View>
          <Icon name="arrow-right" size={18} color="rgba(255,255,255,0.9)" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },

  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center', marginBottom: 20 },

  rentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 24, padding: 18, overflow: 'hidden',
    shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.36, shadowRadius: 22, elevation: 8,
  },
  rentOrbA: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.12)', top: -80, right: -50 },
  rentOrbB: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.10)', bottom: -70, left: -30 },
  rentLogo: { width: 52, height: 52, tintColor: '#fff' },
  rentText: { flex: 1 },
  rentEyebrow: { fontFamily: 'System', fontWeight: '700', fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2 },
  rentTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 17, color: '#fff', letterSpacing: -0.34 },
  rentHint: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: 'rgba(255,255,255,0.76)', lineHeight: 17, marginTop: 3 },
});
