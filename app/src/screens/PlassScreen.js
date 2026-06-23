import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';

const CATEGORIES = [
  { id: 'indoor',   icon: 'layers',  label: 'Innendørs' },
  { id: 'ev',       icon: 'zap',     label: 'Elbil' },
  { id: 'covered',  icon: 'shield',  label: 'Tak over' },
  { id: 'camera',   icon: 'camera',  label: 'Kamera' },
];

const NEARBY = [
  { id: 'a', address: 'Strandgaten 12',  area: 'Møhlenpris', price: 45, distance: '0,4 km', available: true },
  { id: 'b', address: 'Nygårdsgaten 8',  area: 'Sentrum',    price: 55, distance: '1,2 km', available: true },
  { id: 'c', address: 'Bryggen 3',       area: 'Bryggen',    price: 65, distance: '1,8 km', available: false },
];

export default function PlassScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState(null);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#F7F7F2', '#F7F7F2']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Finn en plass</Text>
        <Text style={styles.sub}>Ledige plasser nær deg</Text>

        <View style={styles.searchBar}>
          <View style={styles.searchPin}><Icon name="search" size={16} color="#fff" /></View>
          <Text style={styles.searchText}>Søk adresse eller område…</Text>
        </View>

        <View style={styles.filterRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c.id} onPress={() => setActiveFilter(activeFilter === c.id ? null : c.id)} style={[styles.filterChip, activeFilter === c.id && styles.filterChipActive]}>
              <Icon name={c.icon} size={13} color={activeFilter === c.id ? '#fff' : '#2F3437'} />
              <Text style={[styles.filterText, activeFilter === c.id && styles.filterTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Nær deg · {NEARBY.length} plasser</Text>

        {NEARBY.map((s) => (
          <TouchableOpacity key={s.id} style={styles.card} activeOpacity={0.85}>
            <View style={styles.cardLeft}>
              <View style={[styles.dot, { backgroundColor: s.available ? '#9FD6B4' : '#7B8589' }]} />
              <View>
                <Text style={styles.cardAddress}>{s.address}</Text>
                <Text style={styles.cardMeta}>{s.area} · {s.distance}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cardPrice}>{s.price} kr/t</Text>
              <Text style={[styles.cardAvail, { color: s.available ? '#3FA66B' : '#7B8589' }]}>{s.available ? 'Ledig' : 'Opptatt'}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontFamily: 'System', fontWeight: '800', fontSize: 26, color: '#111416', letterSpacing: -0.52 },
  sub: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: '#7B8589', marginTop: 2, marginBottom: 18 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  searchPin: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#111416', alignItems: 'center', justifyContent: 'center' },
  searchText: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: '#7B8589' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  filterChipActive: { backgroundColor: '#111416', borderColor: '#111416' },
  filterText: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#2F3437' },
  filterTextActive: { color: '#fff' },
  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#7B8589', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardAddress: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#111416', letterSpacing: -0.15 },
  cardMeta: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#7B8589', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardPrice: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#111416', letterSpacing: -0.15 },
  cardAvail: { fontFamily: 'System', fontWeight: '600', fontSize: 11, marginTop: 2 },
});
