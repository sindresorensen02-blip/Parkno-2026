import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { supabase } from '../lib/supabase';
import { BERGEN_SPOTS } from '../data/spots';
import { BOOKING_FEE_RATE } from '../constants/booking';

function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }

function formatDuration(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${h} t ${rem} min` : `${h} t`;
}

const PLACEHOLDER_SPOTS = BERGEN_SPOTS;


const MAP_FILTERS = [
  { key: 'ledig',     label: 'Ledig nå',   match: (s) => s.available },
  { key: 'elbil',     label: 'Elbil',       match: (s) => s.tags.some(t => t.toLowerCase().includes('elbil')) },
  { key: 'tak',       label: 'Tak over',    match: (s) => s.tags.some(t => t.toLowerCase().includes('tak')) },
  { key: 'billig',    label: 'Under 40 kr', match: (s) => s.price < 40 },
  { key: 'innendors', label: 'Innendørs',   match: (s) => s.tags.some(t => t.toLowerCase().includes('innend')) },
];

const BERGEN = {
  latitude: 60.3913,
  longitude: 5.3221,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function KartScreen({ navigation, route }) {
  const fromChooser = route?.params?.fromChooser;
  // KartScreen is rendered in two stacks: as "KartRoot" inside KartStack (prefixed
  // child routes), and as "ParkerKart" inside HjemStack (unprefixed children).
  // Pick the right screen name when pushing so it resolves in the local stack.
  const inKartStack = route?.name === 'KartRoot';
  const screen = {
    livespot:       inKartStack ? 'KartLiveSpot'         : 'LiveSpot',
    checkout:       inKartStack ? 'KartBetalingPaakrevd' : 'BetalingPaakrevd',
    aktivParkering: inKartStack ? 'KartAktivParkering'   : 'AktivParkering',
  };
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const mapRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [spots, setSpots] = useState(PLACEHOLDER_SPOTS);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null);
  const [countdownText, setCountdownText] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [stayMins, setStayMins] = useState(60); // how long the user wants to stay (slider value)

  useEffect(() => {
    supabase
      .from('spots')
      .select('id, address, price_per_hour, amenities, available_to, active, lat, lng, spot_type')
      .eq('active', true)
      .eq('moderation_status', 'approved')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const live = data.map(s => ({
            id: s.id,
            address: s.address,
            area: '',
            price: s.price_per_hour,
            available: s.active,
            latitude: s.lat,
            longitude: s.lng,
            tags: s.amenities ?? [],
            until: `Ledig til ${(s.available_to ?? '20:00').slice(0, 5)}`,
            isLive: true,
          }));
          setSpots([...live, ...PLACEHOLDER_SPOTS]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch the next/active booking within 24 h and subscribe to changes
  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const now = new Date().toISOString();
      const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('reservations')
        .select('id, starts_at, ends_at, spots(id, address, price_per_hour, amenities)')
        .eq('renter_id', user.id)
        .in('status', ['confirmed', 'pending'])
        .gte('ends_at', now)
        .lte('starts_at', in24h)
        .order('starts_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      setActiveBooking(data ?? null);
    };

    fetch();

    const channel = supabase
      .channel(`kart-booking-${user.id}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `renter_id=eq.${user.id}` }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Recompute countdown label every 30 s
  useEffect(() => {
    if (!activeBooking) { setCountdownText(''); return; }

    const update = () => {
      const now = Date.now();
      const start = new Date(activeBooking.starts_at).getTime();
      const end = new Date(activeBooking.ends_at).getTime();

      const fmtMins = (ms) => {
        const m = Math.round(ms / 60000);
        if (m < 60) return `${m} min`;
        const h = Math.floor(m / 60), rem = m % 60;
        return rem ? `${h} t ${rem} min` : `${h} t`;
      };

      if (now < start) {
        setCountdownText(`Starter om ${fmtMins(start - now)}`);
      } else if (now <= end) {
        setCountdownText(`Aktiv · ${fmtMins(end - now)} igjen`);
      } else {
        setActiveBooking(null);
      }
    };

    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [activeBooking]);

  const focusSpot = (spot) => {
    setSelected(spot);
    mapRef.current?.animateToRegion({
      latitude: spot.latitude - 0.004,
      longitude: spot.longitude,
      latitudeDelta: 0.018,
      longitudeDelta: 0.018,
    }, 400);
  };

  const resetView = () => {
    setSelected(null);
    mapRef.current?.animateToRegion(BERGEN, 400);
  };

  const buildSpotPayload = (spot) => ({
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
    isLive: spot.isLive ?? false,
  });

  // Info-only route — opens LiveSpot as an information page about the spot.
  const openInfo = (spot) => {
    navigation.push(screen.livespot, { spot: buildSpotPayload(spot) });
  };

  // Fast booking path — jumps straight from the map to the checkout page,
  // skipping LiveSpot entirely. Uses the slider's duration as the booking
  // window starting now.
  const openCheckout = (spot) => {
    const hours = stayMins / 60;
    const subtotal = Math.round(spot.price * hours);
    const standardFee = Math.round(subtotal * BOOKING_FEE_RATE);
    const bookingFee = isPremium ? 0 : standardFee;
    const total = subtotal + bookingFee;

    const now = new Date();
    const endsAt = new Date(now.getTime() + stayMins * 60_000);
    const startStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const endStr = `${pad(endsAt.getHours())}:${pad(endsAt.getMinutes())}`;

    navigation.push(screen.checkout, {
      // pricing
      total,
      subtotal,
      bookingFee,
      // display
      durationStr: formatDuration(stayMins),
      startStr,
      endStr,
      address: spot.address,
      area: spot.area,
      // booking facts (for the actual reservation insert on payment)
      spotId: spot.id,
      startsAtIso: now.toISOString(),
      endsAtIso:  endsAt.toISOString(),
      durationMins: stayMins,
    });
  };

  const visibleSpots = activeFilter
    ? spots.filter(MAP_FILTERS.find(f => f.key === activeFilter).match)
    : spots;

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={BERGEN}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
      >
        {visibleSpots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            onPress={() => focusSpot(spot)}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <View style={styles.pin3dWrap}>
              {/* soft floor shadow — the disc the pin "stands on" */}
              <View style={[
                styles.pin3dShadow,
                selected?.id === spot.id && styles.pin3dShadowSelected,
              ]} />

              {/* 3D-ish chip: gradient base, tilted, drop shadow */}
              <View style={[
                styles.pin3d,
                selected?.id === spot.id && styles.pin3dSelected,
              ]}>
                <LinearGradient
                  colors={['transparent', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                {/* top highlight — gives the chip a 3D bevel */}
                <View style={[
                  styles.pin3dHighlight,
                  selected?.id === spot.id && { backgroundColor: 'transparent' },
                ]} />
                <Image
                  source={require('../../assets/parkno-logo.png')}
                  style={[
                    styles.pin3dLogo,
                    selected?.id === spot.id && styles.pin3dLogoSelected,
                  ]}
                  resizeMode="contain"
                />
              </View>

            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top overlay: search bar + filter chips + booking banner */}
      <View style={[styles.topOverlay, { top: insets.top + 12 }]}>
        <View style={styles.searchRow}>
          {fromChooser && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
              <Icon name="arrow-left" size={18} color="#111416" strokeWidth={2} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.searchBar, { flex: 1 }]}
            activeOpacity={0.85}
            onPress={() => fromChooser
              ? navigation.push('Welcome', { focusSearch: true })
              : navigation.navigate('Hjem', { screen: 'Welcome', params: { focusSearch: true } })}
          >
            <Image
              source={require('../../assets/parkno-logo.png')}
              style={styles.searchLogo}
              resizeMode="contain"
            />
            <Text style={styles.searchValue}>Bergen, Norge</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#7B8589" />
            ) : (
              <Icon name="search" size={16} color="#7B8589" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {MAP_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(activeFilter === f.key ? null : f.key)}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeBooking?.spots && (
          <TouchableOpacity
            style={styles.bookingBanner}
            activeOpacity={0.88}
            onPress={() => navigation.push(screen.aktivParkering)}
          >
            <LinearGradient
              colors={['#10B981', '#14B8A6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
            />
            <View style={styles.bookingBannerDot} />
            <View style={styles.bookingBannerBody}>
              <Text style={styles.bookingBannerCountdown}>{countdownText}</Text>
              <Text style={styles.bookingBannerAddress} numberOfLines={1}>{activeBooking.spots.address}</Text>
            </View>
            <Icon name="arrow-right" size={16} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom spot card with duration slider */}
      {selected && (() => {
        const hours = stayMins / 60;
        const subtotal = Math.round(selected.price * hours);
        const total = Math.round(subtotal * (1 + BOOKING_FEE_RATE));
        return (
          <View style={[styles.spotCard, { bottom: insets.bottom + 90 }]}>
            <View style={[StyleSheet.absoluteFillObject, { borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.97)' }]} />
            <View style={styles.spotCardInner}>
              <View style={styles.spotCardLeft}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: selected.available ? '#8BCFB0' : '#73817D' }]} />
                  <Text style={styles.statusText}>{selected.available ? 'Ledig nå' : 'Opptatt'}</Text>
                  {selected.isLive && (
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveBadgeText}>LIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.spotAddress} numberOfLines={1}>{selected.address}</Text>
                {selected.area ? <Text style={styles.spotArea}>{selected.area}</Text> : null}
              </View>
              <View style={styles.spotCardRight}>
                <Text style={styles.spotPrice}>{selected.price}</Text>
                <Text style={styles.spotUnit}>kr/t</Text>
              </View>
            </View>

            {/* Duration slider — pick how long to stay */}
            <View style={styles.sliderBlock}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Hvor lenge?</Text>
                <Text style={styles.sliderDuration}>{formatDuration(stayMins)}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={30}
                maximumValue={480}
                step={30}
                value={stayMins}
                onValueChange={setStayMins}
                minimumTrackTintColor="#4EA7B9"
                maximumTrackTintColor="rgba(78,167,185,0.20)"
                thumbTintColor="#4EA7B9"
              />
              <View style={styles.sliderTicks}>
                <Text style={styles.sliderTickText}>30m</Text>
                <Text style={styles.sliderTickText}>8 t</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              {/* Info button — opens LiveSpot as a read-only information page */}
              <TouchableOpacity
                style={styles.infoBtn}
                activeOpacity={0.85}
                onPress={() => openInfo(selected)}
              >
                <Icon name="info" size={18} color="#17211F" strokeWidth={2} />
              </TouchableOpacity>

              {/* Primary action — bypasses LiveSpot and jumps straight to checkout */}
              <TouchableOpacity
                style={styles.reserveBtn}
                activeOpacity={0.88}
                onPress={() => openCheckout(selected)}
                disabled={!selected.available}
              >
                <LinearGradient
                  colors={selected.available ? ['#10B981', '#14B8A6', '#2563EB'] : ['#C6CFC9', '#C6CFC9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
                />
                <Text style={styles.reserveBtnText}>Reserver</Text>
                <View style={styles.reserveBtnBadge}>
                  <Text style={styles.reserveBtnBadgeText}>{total} kr</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  topOverlay: { position: 'absolute', left: 16, right: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#111416', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#111416', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  searchPin: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  searchLogo: { width: 32, height: 32 },
  searchValue: { flex: 1, fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#111416', letterSpacing: -0.14 },

  filterScroll: { marginTop: 8 },
  filterContent: { gap: 6, paddingRight: 4 },
  filterChip: {
    height: 32, paddingHorizontal: 13, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#111416', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  filterChipActive: { backgroundColor: '#111416', borderColor: '#111416' },
  filterChipText: { fontFamily: 'System', fontWeight: '700', fontSize: 12, color: '#111416' },
  filterChipTextActive: { color: '#fff' },

  locBtn: {
    position: 'absolute', right: 16,
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#111416', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },

  // ── Pseudo-3D logo pin ───────────────────────────────────────────────
  pin3dWrap: {
    alignItems: 'center',
  },
  pin3d: {
    width: 42, height: 42,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F2138',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 7,
    elevation: 7,
  },
  pin3dSelected: {
    width: 52, height: 52,
    shadowOpacity: 0.42,
    shadowRadius: 9,
    elevation: 9,
  },
  pin3dHighlight: {
    position: 'absolute', top: 2, left: 6, right: 6, height: 12,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  pin3dLogo: { width: 42, height: 42 },
  pin3dLogoSelected: { width: 52, height: 52 },
  pin3dShadow: {
    position: 'absolute',
    width: 0, height: 0, borderRadius: 0,
    backgroundColor: 'transparent',
    bottom: -3, alignSelf: 'center',
    transform: [{ scaleX: 1.4 }],
  },
  pin3dShadowSelected: {
    width: 0, height: 0,
    backgroundColor: 'transparent',
  },
  pin3dPrice: {
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, backgroundColor: '#17211F',
    shadowColor: '#0F2138', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30, shadowRadius: 4, elevation: 5,
  },
  pin3dPriceSelected: {
    backgroundColor: '#10B981',
  },
  pin3dPriceText: {
    fontFamily: 'System', fontWeight: '800', fontSize: 11,
    color: '#fff', letterSpacing: -0.1,
  },

  spotCard: {
    position: 'absolute', left: 16, right: 16,
    borderRadius: 24, overflow: 'hidden',
    shadowColor: '#111416', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 6,
  },
  spotCardInner: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, paddingBottom: 12 },
  spotCardLeft: { flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#7B8589', letterSpacing: 0.8, textTransform: 'uppercase' },
  liveBadge: { backgroundColor: '#10B981', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  liveBadgeText: { fontFamily: 'System', fontWeight: '700', fontSize: 9, color: '#fff', letterSpacing: 0.5 },
  spotAddress: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#111416', letterSpacing: -0.32 },
  spotArea: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#7B8589', marginTop: 2 },
  spotCardRight: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  spotPrice: { fontFamily: 'System', fontWeight: '800', fontSize: 22, color: '#111416', letterSpacing: -0.44 },
  spotUnit: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: '#7B8589' },

  // Duration slider inside the spot card
  sliderBlock: {
    marginHorizontal: 16, marginTop: 4, marginBottom: 12,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(78,167,185,0.06)',
    borderWidth: 1, borderColor: 'rgba(78,167,185,0.16)',
  },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sliderLabel: {
    fontFamily: 'System', fontWeight: '700', fontSize: 10,
    color: '#73817D', letterSpacing: 1, textTransform: 'uppercase',
  },
  sliderDuration: {
    fontFamily: 'System', fontWeight: '800', fontSize: 17,
    color: '#17211F', letterSpacing: -0.34,
  },
  slider: { width: '100%', height: 30, marginTop: 2 },
  sliderTicks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
  sliderTickText: { fontFamily: 'System', fontWeight: '600', fontSize: 10, color: '#73817D' },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 16,
  },
  infoBtn: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(78,167,185,0.10)',
    borderWidth: 1, borderColor: 'rgba(78,167,185,0.30)',
  },
  reserveBtn: {
    flex: 1, height: 48,
    borderRadius: 14, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 14, gap: 10,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 6,
  },
  reserveBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#fff', letterSpacing: -0.15 },
  reserveBtnBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  reserveBtnBadgeText: { fontFamily: 'System', fontWeight: '800', fontSize: 13, color: '#fff', letterSpacing: -0.1 },

  bookingBanner: {
    marginTop: 8,
    height: 56, borderRadius: 14, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, gap: 10,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  bookingBannerDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  bookingBannerBody: { flex: 1 },
  bookingBannerCountdown: {
    fontFamily: 'System', fontWeight: '700', fontSize: 10,
    color: 'rgba(255,255,255,0.8)', letterSpacing: 0.3, textTransform: 'uppercase',
  },
  bookingBannerAddress: {
    fontFamily: 'System', fontWeight: '700', fontSize: 13,
    color: '#fff', letterSpacing: -0.13, marginTop: 1,
  },
});
