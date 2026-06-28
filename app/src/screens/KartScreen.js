import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../context/SearchContext';
import { usePremium } from '../context/PremiumContext';
import { useActiveBooking } from '../context/ActiveBookingContext';
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

function fmtClock(iso) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

// Dark map theme (Google Maps style JSON) so the map blends into the #2B394C
// canvas — a Waymo-style dark basemap. Applied on Android/Google; on iOS Apple
// Maps we also pass userInterfaceStyle="dark".
const DARK_MAP = [
  { elementType: 'geometry', stylers: [{ color: '#2b394c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#2b394c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#98b6d8' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#3a4a5e' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#243042' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3b4c69' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#3a4c68' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6e809b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#50607a' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#162232' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a5a6e' }] },
];

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
  const { query } = useSearch();
  const { isPremium } = usePremium();
  // Single source of truth for the user's current session — covers both real
  // reservations and "demo" bookings made by reserving a placeholder spot.
  const { booking } = useActiveBooking();
  const mapRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [spots, setSpots] = useState(PLACEHOLDER_SPOTS);
  const [loading, setLoading] = useState(true);
  const [countdownText, setCountdownText] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);

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

  // Recompute the live countdown label every 30 s while a booking is active.
  // Expiry is handled by ActiveBookingContext, so we only format the label here.
  useEffect(() => {
    if (!booking) { setCountdownText(''); return; }

    const update = () => {
      const now = Date.now();
      const start = new Date(booking.starts_at).getTime();
      const end = new Date(booking.ends_at).getTime();

      const fmtMins = (ms) => {
        const m = Math.max(0, Math.round(ms / 60000));
        if (m < 60) return `${m} min`;
        const h = Math.floor(m / 60), rem = m % 60;
        return rem ? `${h} t ${rem} min` : `${h} t`;
      };

      if (now < start) setCountdownText(`Starter om ${fmtMins(start - now)}`);
      else setCountdownText(`${fmtMins(end - now)} igjen`);
    };

    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [booking]);

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
    // Duration (and therefore the total) is now chosen on the payment page, so
    // we just hand over the spot facts + price per hour.
    navigation.push(screen.checkout, {
      pricePerHour: spot.price,
      address: spot.address,
      area: spot.area,
      spotId: spot.id,
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
        customMapStyle={DARK_MAP}
        userInterfaceStyle="dark"
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
      >
        {visibleSpots.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            onPress={() => {
              // Center the pin in the visible area above the payment sheet, then
              // open the payment screen directly (skipping the spot card).
              mapRef.current?.animateToRegion({
                latitude: spot.latitude - 0.006,
                longitude: spot.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }, 350);
              openCheckout(spot);
            }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            // Order pins by latitude so the one lower on screen (further south)
            // draws on top. Each pin's shadow extends downward, so this keeps a
            // shadow tucked behind the neighbouring pin instead of over it. A
            // selected pin is bumped above everything.
            zIndex={(selected?.id === spot.id ? 1e9 : 0) + Math.round((100 - spot.latitude) * 100000)}
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
                  source={require('../../assets/parkno-pin.png')}
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

      {/* Top overlay: while a booking is active a hero card (~2× the search bar)
          takes the search bar's place; otherwise the search bar is shown. */}
      <View style={[styles.topOverlay, { top: insets.top + 12 }]}>
        {booking?.spots ? (
          <TouchableOpacity
            style={styles.hero}
            activeOpacity={0.9}
            onPress={() => navigation.push(screen.aktivParkering)}
          >
            <LinearGradient
              colors={['#4E96F0', '#5EA2F5', '#4E96F0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
            />
            <View style={styles.heroTopRow}>
              <View style={styles.heroStatus}>
                <View style={styles.heroDot} />
                <Text style={styles.heroStatusText}>AKTIV PARKERING</Text>
              </View>
              <Text style={styles.heroCountdown}>{countdownText}</Text>
            </View>
            <Text style={styles.heroAddress} numberOfLines={1}>{booking.spots.address}</Text>
            <View style={styles.heroBottomRow}>
              <Text style={styles.heroSub}>Avsluttes {fmtClock(booking.ends_at)}</Text>
              <View style={styles.heroCta}>
                <Text style={styles.heroCtaText}>Vis parkering</Text>
                <Icon name="arrow-right" size={15} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.searchRow}>
            {fromChooser && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
                <Icon name="arrow-left" size={18} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <SearchBar
                mode="map"
                loading={loading}
                placeholder={query?.trim() ? query : 'Hvor vil du parkere?'}
                onPress={() => navigation.push('Welcome', { focusSearch: true })}
              />
            </View>
          </View>
        )}
      </View>

      {/* Bottom spot card */}
      {selected && (
        <View style={[styles.spotCard, { bottom: insets.bottom + 90 }]}>
          <View style={[StyleSheet.absoluteFillObject, { borderRadius: 24, backgroundColor: '#3A4C68' }]} />
          <View style={styles.spotCardInner}>
            <View style={styles.spotCardLeft}>
              {selected.isLive && (
                <View style={styles.statusRow}>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                </View>
              )}
              <Text style={styles.spotAddress} numberOfLines={1}>{selected.address}</Text>
              {selected.area ? <Text style={styles.spotArea}>{selected.area}</Text> : null}
            </View>
            <View style={styles.spotCardRight}>
              <Text style={styles.spotPrice}>{selected.price}</Text>
              <Text style={styles.spotUnit}>kr/t</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            {/* Info button — opens LiveSpot as a read-only information page */}
            <TouchableOpacity
              style={styles.infoBtn}
              activeOpacity={0.85}
              onPress={() => openInfo(selected)}
            >
              <Icon name="info" size={18} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>

            {/* Primary action — duration + total are now chosen on the payment page */}
            <TouchableOpacity
              style={styles.reserveBtn}
              activeOpacity={0.88}
              onPress={() => openCheckout(selected)}
              disabled={!selected.available}
            >
              <LinearGradient
                colors={selected.available ? ['#4E96F0', '#5EA2F5', '#4E96F0'] : ['#6E809B', '#6E809B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
              />
              <Text style={styles.reserveBtnText}>Reserver</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  topOverlay: { position: 'absolute', left: 16, right: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  searchPin: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#4E96F0', alignItems: 'center', justifyContent: 'center' },

  filterScroll: { marginTop: 8 },
  filterContent: { gap: 6, paddingRight: 4 },
  filterChip: {
    height: 32, paddingHorizontal: 13, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  filterChipActive: { backgroundColor: '#5EA2F5', borderColor: '#5EA2F5' },
  filterChipText: { fontFamily: 'System', fontWeight: '700', fontSize: 12, color: '#FFFFFF' },
  filterChipTextActive: { color: '#fff' },

  locBtn: {
    position: 'absolute', right: 16,
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },

  // ── Pseudo-3D logo pin ───────────────────────────────────────────────
  pin3dWrap: {
    alignItems: 'center',
  },
  // No box-shadow on the chip itself: the logo is a transparent teardrop, so a
  // box-shadow would cast a square halo around it that fans out onto neighbouring
  // pins. Grounding comes entirely from the tight tip ellipse (pin3dShadow).
  pin3d: {
    width: 42, height: 42,
    alignItems: 'center', justifyContent: 'center',
  },
  pin3dSelected: {
    width: 52, height: 52,
  },
  pin3dHighlight: {
    position: 'absolute', top: 2, left: 6, right: 6, height: 12,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  // Drop shadow on the Image follows the teardrop's alpha silhouette (iOS), so it
  // hugs the pin shape instead of boxing it. Offset straight down + tight radius
  // so it stays under the pin and never reaches a neighbour.
  pin3dLogo: {
    width: 42, height: 42,
    shadowColor: '#0F2138', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30, shadowRadius: 4,
  },
  pin3dLogoSelected: { width: 52, height: 52 },
  // Soft floor shadow cast by the pin's *tip*. The parkno logo is a teardrop that
  // touches the ground at a single point, so the shadow is a small, tight ellipse
  // directly under that point — not a wide disc under the whole chip. Drawn as a
  // flat dark View (not a native shadow) because react-native-maps snapshots
  // markers to a bitmap, which strips shadowOpacity/elevation.
  //
  // Kept deliberately narrow (≈14px, well inside the 42px pin width) so it can
  // never spill sideways onto a neighbouring pin; draw order (zIndex by latitude)
  // keeps it behind the pin below it too.
  pin3dShadow: {
    position: 'absolute',
    bottom: 1, alignSelf: 'center',
    width: 14, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(6,14,26,0.38)',
  },
  pin3dShadowSelected: {
    bottom: 0,
    width: 17, height: 5, borderRadius: 2.5,
    backgroundColor: 'rgba(6,14,26,0.46)',
  },
  pin3dPrice: {
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, backgroundColor: '#5EA2F5',
    shadowColor: '#0F2138', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30, shadowRadius: 4, elevation: 5,
  },
  pin3dPriceSelected: {
    backgroundColor: '#4E96F0',
  },
  pin3dPriceText: {
    fontFamily: 'System', fontWeight: '800', fontSize: 11,
    color: '#fff', letterSpacing: -0.1,
  },

  spotCard: {
    position: 'absolute', left: 16, right: 16,
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.30, shadowRadius: 24, elevation: 8,
  },
  spotCardInner: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, paddingBottom: 12 },
  spotCardLeft: { flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#98B6D8', letterSpacing: 0.8, textTransform: 'uppercase' },
  liveBadge: { backgroundColor: '#4E96F0', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  liveBadgeText: { fontFamily: 'System', fontWeight: '700', fontSize: 9, color: '#fff', letterSpacing: 0.5 },
  spotAddress: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32 },
  spotArea: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 2 },
  spotCardRight: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  spotPrice: { fontFamily: 'System', fontWeight: '800', fontSize: 22, color: '#FFFFFF', letterSpacing: -0.44 },
  spotUnit: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: '#98B6D8' },

  // Duration slider inside the spot card
  sliderBlock: {
    marginHorizontal: 16, marginTop: 4, marginBottom: 12,
    paddingTop: 6, paddingBottom: 4,
  },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sliderLabel: {
    fontFamily: 'System', fontWeight: '700', fontSize: 10,
    color: '#98B6D8', letterSpacing: 1, textTransform: 'uppercase',
  },
  sliderDuration: {
    fontFamily: 'System', fontWeight: '800', fontSize: 17,
    color: '#FFFFFF', letterSpacing: -0.34,
  },
  dsTouch: { height: 34, justifyContent: 'center', marginTop: 8, marginBottom: 2 },
  dsTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(94,162,245,0.20)' },
  dsFill: { height: 5, borderRadius: 3, backgroundColor: '#5EA2F5' },
  dsThumb: {
    position: 'absolute',
    top: '50%', marginTop: -8, marginLeft: -8,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 3, borderColor: '#5EA2F5',
    shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 3,
  },
  sliderTicks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
  sliderTickText: { fontFamily: 'System', fontWeight: '600', fontSize: 10, color: '#98B6D8' },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 16,
  },
  infoBtn: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  reserveBtn: {
    flex: 1, height: 48,
    borderRadius: 14, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 14, gap: 10,
    shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 6,
  },
  reserveBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#fff', letterSpacing: -0.15 },
  reserveBtnBadge: {
    paddingHorizontal: 2, paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  reserveBtnBadgeText: { fontFamily: 'System', fontWeight: '800', fontSize: 13, color: '#fff', letterSpacing: -0.1 },

  // ── Active-booking hero (replaces the search bar, ~2× its height) ─────
  hero: {
    minHeight: 120, borderRadius: 22, overflow: 'hidden',
    paddingHorizontal: 18, paddingVertical: 16,
    justifyContent: 'space-between',
    shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34, shadowRadius: 20, elevation: 9,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroStatus: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  heroDot: {
    width: 9, height: 9, borderRadius: 5, backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 4,
  },
  heroStatusText: {
    fontFamily: 'System', fontWeight: '800', fontSize: 11,
    color: 'rgba(255,255,255,0.92)', letterSpacing: 1.2,
  },
  heroCountdown: {
    fontFamily: 'System', fontWeight: '800', fontSize: 13,
    color: '#FFFFFF', letterSpacing: -0.1,
  },
  heroAddress: {
    fontFamily: 'System', fontWeight: '800', fontSize: 22,
    color: '#FFFFFF', letterSpacing: -0.5, marginTop: 12,
  },
  heroBottomRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12,
  },
  heroSub: {
    fontFamily: 'System', fontWeight: '600', fontSize: 13,
    color: 'rgba(255,255,255,0.85)', letterSpacing: -0.1,
  },
  heroCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
  },
  heroCtaText: {
    fontFamily: 'System', fontWeight: '700', fontSize: 12.5,
    color: '#FFFFFF', letterSpacing: -0.1,
  },
});
