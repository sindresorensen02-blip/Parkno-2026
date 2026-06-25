import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity } from './haptics';
import Icon from './Icon';
import { formatKr } from '../lib/format';

// Rich 126px host listing card: status, address/area, weekly earnings, price on
// the left 60%; photo (or empty state) on the right 40% with a forward arrow on
// the seam. System font (Hanken is earnings-only per the host design spec).
export default function HostSpotCard({ status, address, area, weekly, price, photoUrl, onPress, onMenu }) {
  const active = status === 'active';
  const weeklyNum = Number(weekly) || 0;

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={s.card}>
      {/* Left info */}
      <View style={s.info}>
        <View style={s.statusRow}>
          <View style={[s.dotGlow, { backgroundColor: active ? 'rgba(23,230,161,0.18)' : 'rgba(217,164,65,0.18)' }]}>
            <View style={[s.dot, { backgroundColor: active ? '#17E6A1' : '#D9A441' }]} />
          </View>
          <Text style={s.overline}>{active ? 'AKTIV' : 'PÅ PAUSE'}</Text>
        </View>

        <View>
          <Text style={s.address} numberOfLines={1}>{address}</Text>
          <Text style={s.area}>{area}</Text>
        </View>

        <Text>
          <Text style={[s.weeklyAmt, { color: weeklyNum > 0 ? '#17E6A1' : '#6E809B' }]}>{formatKr(weeklyNum)}</Text>
          <Text style={s.weeklyLabel}>  denne uken</Text>
        </Text>

        <View style={s.priceRow}>
          <Text style={s.priceVal}>{price}</Text>
          <Text style={s.priceUnit}> kr/t</Text>
        </View>
      </View>

      {/* Right photo / empty state */}
      <View style={s.photoWell}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={s.empty}>
            <Icon name="map-pin" size={26} color="#50607A" strokeWidth={2} />
          </View>
        )}
        {/* left-edge scrim so the seam reads */}
        <LinearGradient
          colors={['#3A4C68', 'rgba(58,76,104,0)']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={s.scrim}
        />
        {/* ••• menu — three inline dots (no icon for this in Icon.js) */}
        <TouchableOpacity onPress={onMenu} style={s.menu} hitSlop={8}>
          <View style={s.menuDot} /><View style={s.menuDot} /><View style={s.menuDot} />
        </TouchableOpacity>
      </View>

      {/* Forward arrow on the seam */}
      <View style={s.arrowWrap} pointerEvents="none">
        <LinearGradient colors={['#4E96F0', '#5EA2F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.arrowGrad}>
          <Icon name="arrow-right" size={16} color="#fff" strokeWidth={2.2} />
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    height: 126, borderRadius: 28, overflow: 'hidden', flexDirection: 'row',
    backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 26, elevation: 6,
  },
  info: { width: '60%', paddingVertical: 15, paddingHorizontal: 16, justifyContent: 'space-between' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dotGlow: { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  overline: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#98B6D8', letterSpacing: 0.8, textTransform: 'uppercase' },
  address: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.2 },
  area: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 2 },
  weeklyAmt: { fontFamily: 'System', fontWeight: '800', fontSize: 13, fontVariant: ['tabular-nums'] },
  weeklyLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: '#6E809B' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceVal: { fontFamily: 'System', fontWeight: '800', fontSize: 18, color: '#FFFFFF' },
  priceUnit: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#98B6D8' },

  photoWell: { width: '40%', backgroundColor: '#2F3D52' },
  empty: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scrim: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 40 },
  menu: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(15,22,34,0.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2.5 },
  menuDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#fff' },

  arrowWrap: { position: 'absolute', bottom: 14, left: '60%', marginLeft: -17 },
  arrowGrad: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
});
