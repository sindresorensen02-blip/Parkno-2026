import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useActiveBooking } from '../context/ActiveBookingContext';
import { BERGEN_SPOTS } from '../data/spots';
import AktivParkeringScreen from './AktivParkeringScreen';

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'God natt';
  if (h < 12) return 'God morgen';
  if (h < 18) return 'God ettermiddag';
  if (h < 23) return 'God kveld';
  return 'God natt';
}

// Stock car/parking photos (Unsplash) used as card placeholders.
const CARD_IMAGES = [
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=600&q=70',
];

const FILTERS = [
  { id: 'near',  label: 'Nærmest' },
  { id: 'cheap', label: 'Billigst' },
  { id: 'ev',    label: 'Elbil' },
];

function spotPayload(spot) {
  return {
    id: spot.id,
    address: spot.address,
    area: spot.area,
    price: spot.price,
    tags: spot.tags ?? [],
    until: spot.until ?? '',
    distanceKm: spot.distanceKm ?? 99,
    distance: spot.distance ?? '',
    walk: spot.walk ?? '',
    featured: false,
    isLive: false,
  };
}

export default function HjemScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { booking } = useActiveBooking();
  const [filter, setFilter] = useState('near');

  const fullName = profile?.full_name ?? '';
  const firstName = fullName.split(' ')[0] ?? '';
  const initials = fullName
    ? fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : 'P';

  const places = useMemo(() => {
    let list = BERGEN_SPOTS.filter((s) => s.available);
    if (filter === 'ev') {
      list = list.filter((s) => (s.tags ?? []).some((t) => t.startsWith('Elbil')));
    }
    list = [...list].sort((a, b) =>
      filter === 'cheap' ? a.price - b.price : a.distanceKm - b.distanceKm
    );
    return list.slice(0, 6);
  }, [filter]);

  // When there's a live/upcoming booking, the home tab becomes the dashboard.
  if (booking) {
    return <AktivParkeringScreen navigation={navigation} route={{ params: {} }} />;
  }

  const openMap = () => navigation.getParent()?.navigate('Kart');
  const openSpot = (spot) => navigation.push('LiveSpot', { spot: spotPayload(spot) });
  const openProfile = () => navigation.getParent()?.navigate('Profil');
  const openSaved = () => navigation.push('Lagret');

  return (
    <View style={styles.root}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#F7F7F2' }]} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: greeting + avatar */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{timeGreeting()}, {firstName || 'velkommen'} 👋</Text>
            <Text style={styles.subGreeting}>Finn ledig parkering i Bergen</Text>
          </View>
          <TouchableOpacity onPress={openProfile} activeOpacity={0.8} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* Search + filter button */}
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={openMap} activeOpacity={0.85} style={styles.searchField}>
            <Icon name="search" size={18} color="rgba(17,20,22,0.4)" strokeWidth={2.2} />
            <Text style={styles.searchText}>Søk etter sted</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openMap} activeOpacity={0.85} style={styles.filterBtn}>
            <Icon name="filter" size={18} color="#111416" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* Section header */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Populære plasser</Text>
          <TouchableOpacity onPress={openMap} activeOpacity={0.7}>
            <Text style={styles.sectionLink}>Se alle</Text>
          </TouchableOpacity>
        </View>

        {/* Segmented filter chips */}
        <View style={styles.chips}>
          {FILTERS.map((f) => {
            const on = f.id === filter;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.8}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Horizontal place cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardRow}
        >
          {places.map((spot, i) => (
            <TouchableOpacity
              key={spot.id}
              onPress={() => openSpot(spot)}
              activeOpacity={0.9}
              style={styles.card}
            >
              <Image
                source={{ uri: CARD_IMAGES[i % CARD_IMAGES.length] }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
                resizeMode="cover"
              />

              {/* Favorite button */}
              <TouchableOpacity
                onPress={openSaved}
                activeOpacity={0.8}
                style={styles.heartBtn}
                hitSlop={8}
              >
                <Icon name="heart" size={16} color="#fff" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Bottom info overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(17,20,22,0.55)']}
                style={styles.cardOverlay}
              >
                <Text style={styles.cardTitle} numberOfLines={1}>{spot.address}</Text>
                <View style={styles.cardMetaRow}>
                  <View style={styles.cardMeta}>
                    <Icon name="map-pin" size={12} color="rgba(255,255,255,0.85)" strokeWidth={2.2} />
                    <Text style={styles.cardMetaText} numberOfLines={1}>{spot.area}</Text>
                  </View>
                  <View style={styles.cardPrice}>
                    <Text style={styles.cardPriceText}>{spot.price} kr/t</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick actions (kept) */}
        <Text style={styles.quickLabel}>Hurtighandlinger</Text>
        <View style={styles.quickRow}>
          <QuickPill icon="heart" label="Lagret" color="#EF4444" onPress={openSaved} />
          <QuickPill icon="map" label="Kart" color="#10B981" onPress={openMap} />
          <QuickPill
            icon="mail"
            label="Kontakt"
            color="#2563EB"
            onPress={() => navigation.getParent()?.navigate('Profil', { screen: 'KontaktOss' })}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function QuickPill({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78} style={styles.quickPill}>
      <View style={styles.quickIcon}>
        <Icon name={icon} size={15} color={color} strokeWidth={2.2} />
      </View>
      <Text style={styles.quickPillLabel} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  greeting: {
    fontFamily: 'System', fontWeight: '800',
    fontSize: 20, color: '#111416', letterSpacing: -0.4,
  },
  subGreeting: {
    fontFamily: 'System', fontWeight: '500',
    fontSize: 13, color: '#7B8589', marginTop: 3,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#111416',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'System', fontWeight: '800',
    fontSize: 14, color: '#fff', letterSpacing: -0.2,
  },

  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(17,20,22,0.06)',
  },
  searchText: {
    fontFamily: 'System', fontWeight: '500',
    fontSize: 14, color: 'rgba(17,20,22,0.4)', letterSpacing: -0.2,
  },
  filterBtn: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: 'rgba(17,20,22,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'System', fontWeight: '800',
    fontSize: 18, color: '#111416', letterSpacing: -0.4,
  },
  sectionLink: {
    fontFamily: 'System', fontWeight: '600',
    fontSize: 13, color: '#7B8589', letterSpacing: -0.2,
  },

  chips: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  chipOn: { backgroundColor: '#111416' },
  chipText: {
    fontFamily: 'System', fontWeight: '600',
    fontSize: 13, color: 'rgba(17,20,22,0.45)', letterSpacing: -0.2,
  },
  chipTextOn: { color: '#fff', fontWeight: '700' },

  cardRow: { gap: 14, paddingRight: 4, paddingBottom: 4 },
  card: {
    width: 200,
    height: 260,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E3E6E2',
    shadowColor: '#111416',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  heartBtn: {
    position: 'absolute',
    top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  cardOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
  },
  cardTitle: {
    fontFamily: 'System', fontWeight: '800',
    fontSize: 16, color: '#fff', letterSpacing: -0.3,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  cardMetaText: {
    fontFamily: 'System', fontWeight: '500',
    fontSize: 12, color: 'rgba(255,255,255,0.85)',
  },
  cardPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardPriceText: {
    fontFamily: 'System', fontWeight: '800',
    fontSize: 12, color: '#fff', letterSpacing: -0.2,
  },

  quickLabel: {
    fontFamily: 'System', fontWeight: '700',
    fontSize: 11, color: '#7B8589',
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginTop: 28, marginBottom: 12, marginLeft: 4,
  },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,20,22,0.06)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  quickIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(17,20,22,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  quickPillLabel: {
    fontFamily: 'System', fontWeight: '700',
    fontSize: 12, color: '#111416', letterSpacing: -0.12,
  },
});
