import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Modal, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { TouchableOpacity, Pressable } from '../components/haptics';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BERGEN_SPOTS } from '../data/spots';
import { searchSpots, STATUS } from '../lib/search';
import { createExpoGeocoder } from '../lib/geocoding';
import { formatDistanceKm } from '../lib/geo';

const geocoder = createExpoGeocoder(Location.geocodeAsync);

const SPOTS = BERGEN_SPOTS;


const FILTERS = [
  { id: 'near',    label: '< 1 km'       },
  { id: 'ev',      label: 'Elbil lading' },
  { id: 'covered', label: 'Tak over'     },
  { id: 'indoor',  label: 'Innendørs'    },
  { id: 'lit',     label: 'Belyst'       },
  { id: 'camera',  label: 'Kamera'       },
  { id: 'cheap',   label: 'Under 40 kr'  },
];

const SORT_OPTIONS = [
  { id: 'distance',   label: 'Nærmest'      },
  { id: 'price_asc',  label: 'Billigst'     },
  { id: 'price_desc', label: 'Dyrest'       },
  { id: 'avail',      label: 'Lengst ledig' },
];

function matchesFilters(spot, activeFilters) {
  for (const fid of activeFilters) {
    if (fid === 'near'    && spot.distanceKm > 1.0) return false;
    if (fid === 'ev'      && !spot.tags.some(t => t.toLowerCase().startsWith('elbil'))) return false;
    if (fid === 'covered' && !spot.tags.includes('Tak over')) return false;
    if (fid === 'indoor'  && !spot.tags.includes('Innendørs')) return false;
    if (fid === 'lit'     && !spot.tags.includes('Belyst')) return false;
    if (fid === 'camera'  && !spot.tags.includes('Kamera')) return false;
    if (fid === 'cheap'   && spot.price >= 40) return false;
  }
  return true;
}

function applySort(list, sortBy) {
  const arr = [...list];
  if (sortBy === 'price_asc')  return arr.sort((a, b) => a.price - b.price);
  if (sortBy === 'price_desc') return arr.sort((a, b) => b.price - a.price);
  if (sortBy === 'avail')      return arr.sort((a, b) => b.until.localeCompare(a.until));
  return arr.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
}

export default function WelcomeScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [sortBy, setSortBy] = useState('distance');
  const [showSortModal, setShowSortModal] = useState(false);
  const [spots, setSpots] = useState(SPOTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const searchRef = useRef(null);

  const fetchSpots = () => {
    setRefreshing(true);
    supabase
      .from('spots')
      .select('*')
      .eq('active', true)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const liveSpots = data.map((s, i) => ({
            id: s.id,
            address: s.address,
            area: '',
            distanceKm: 99,
            distance: '',
            walk: '',
            price: s.price_per_hour,
            until: `Ledig til ${(s.available_to ?? '20:00').slice(0, 5)}`,
            tags: s.amenities ?? [],
            featured: i === 0,
          }));
          setSpots([...liveSpots, ...SPOTS]);
        }
        setRefreshing(false);
      });
  };

  useEffect(() => { fetchSpots(); }, []);

  useEffect(() => {
    if (route?.params?.focusSearch) {
      const t = setTimeout(() => searchRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [route?.params?.focusSearch]);

  useEffect(() => {
    return navigation.getParent()?.addListener('tabPress', () => {
      if ((navigation.getState()?.routes?.length ?? 1) > 1) navigation.popToTop();
    });
  }, [navigation]);

  const toggleFilter = (id) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Debounced fuzzy/geocoded search. Falls back to a substring filter
  // (the original behaviour) if the search module is still working or returns idle.
  const [searchResult, setSearchResult] = useState({ status: STATUS.IDLE, matchedSpots: spots, target: null, radiusKm: null });
  const [searching, setSearching] = useState(false);
  const searchTokenRef = useRef(0);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResult({ status: STATUS.IDLE, matchedSpots: spots, target: null, radiusKm: null });
      setSearching(false);
      return;
    }
    const token = ++searchTokenRef.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const result = await searchSpots({ query: q, spots, geocoder });
        if (token === searchTokenRef.current) {
          setSearchResult(result);
        }
      } finally {
        if (token === searchTokenRef.current) setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, spots]);

  const visibleSpots = useMemo(() => {
    let list = searchResult.matchedSpots.filter(s => matchesFilters(s, activeFilters));
    // When the user is searching we keep the proximity ordering from the pipeline.
    // Sorting only applies when no search is active.
    if (!searchQuery.trim()) list = applySort(list, sortBy);
    return list;
  }, [searchResult, activeFilters, sortBy, searchQuery]);

  const [ratingTarget, setRatingTarget]   = useState(null);
  const [ratingValue, setRatingValue]     = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submitting, setSubmitting]       = useState(false);

  useFocusEffect(useCallback(() => {
    if (!user) return;
    (async () => {
      const now    = new Date();
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { data: res } = await supabase
        .from('reservations')
        .select('id, ends_at, spot_id, spots(address)')
        .eq('renter_id', user.id)
        .in('status', ['confirmed', 'completed'])
        .lt('ends_at', now.toISOString())
        .gt('ends_at', cutoff.toISOString())
        .order('ends_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!res) return;
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('reservation_id', res.id)
        .maybeSingle();
      if (!existing) setRatingTarget(res);
    })();
  }, [user]));

  const submitRating = async () => {
    if (!ratingValue || !ratingTarget) return;
    setSubmitting(true);
    await supabase.from('reviews').insert({
      reservation_id: ratingTarget.id,
      spot_id:        ratingTarget.spot_id,
      renter_id:      user.id,
      rating:         ratingValue,
      comment:        ratingComment.trim() || null,
    });
    setSubmitting(false);
    setRatingTarget(null);
    setRatingValue(0);
    setRatingComment('');
  };

  const activeSortLabel = SORT_OPTIONS.find(o => o.id === sortBy)?.label ?? 'Nærmest';
  const hasFilters = activeFilters.size > 0;

  return (
    <View style={styles.root}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#2B394C' }]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 76 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchSpots} tintColor="#4E96F0" colors={['#4E96F0']} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
              <Icon name="arrow-left" size={20} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.heartBtn} onPress={() => navigation.push('Lagret')}>
              <Icon name="heart" size={18} color="#fff" strokeWidth={2.2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.push('Inboks')}>
              <Icon name="bell" size={18} color="#FFFFFF" />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.9}
          onPress={() => searchRef.current?.focus()}
        >
          <View style={styles.searchPin}>
            <Icon name="map-pin" size={15} color="#fff" />
          </View>
          <View style={styles.searchText}>
            <Text style={styles.searchLabel}>Hvor skal du?</Text>
            <TextInput keyboardAppearance="dark"
              ref={searchRef}
              style={styles.searchValue}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Adresse eller område..."
              placeholderTextColor="#BCC5CB"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Icon name="x" size={18} color="#98B6D8" strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <Icon name="search" size={18} color="#98B6D8" />
          )}
        </TouchableOpacity>

        {/* Filter dropdown */}
        <View style={styles.filtersWrapper}>
          <TouchableOpacity
            onPress={() => setShowSortModal(true)}
            style={[styles.filterDropdown, hasFilters && styles.filterDropdownActive]}
            activeOpacity={0.85}
          >
            <Icon name="filter" size={15} color={hasFilters ? '#fff' : '#98B6D8'} strokeWidth={2} />
            <Text style={[styles.filterDropdownText, hasFilters && styles.filterDropdownTextActive]}>
              {hasFilters ? `${activeFilters.size} filter aktive` : 'Filtrer og sorter'}
            </Text>
            <Icon name="chevron-down" size={16} color={hasFilters ? '#fff' : '#98B6D8'} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Search status banner */}
        {searching && (
          <View style={[styles.searchBanner, styles.searchBannerInfo]}>
            <ActivityIndicator size="small" color="#4E96F0" />
            <Text style={styles.searchBannerText}>Søker etter parkering i nærheten…</Text>
          </View>
        )}
        {!searching && searchResult.status === STATUS.APPROXIMATE && (
          <View style={[styles.searchBanner, styles.searchBannerWarn]}>
            <Icon name="info" size={14} color="#92400E" strokeWidth={2} />
            <Text style={[styles.searchBannerText, { color: '#92400E' }]}>
              Fant ikke akkurat denne adressen. Viser nærmeste plasser i stedet.
            </Text>
          </View>
        )}
        {!searching && searchResult.status === STATUS.EMPTY && (
          <View style={[styles.searchBanner, styles.searchBannerWarn]}>
            <Icon name="info" size={14} color="#92400E" strokeWidth={2} />
            <Text style={[styles.searchBannerText, { color: '#92400E' }]}>
              Ingen parkering funnet nær dette stedet.
            </Text>
          </View>
        )}

        {/* Section heading */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{visibleSpots.length} plasser</Text>
          <TouchableOpacity onPress={() => setShowSortModal(true)} style={styles.sortPill} activeOpacity={0.7} hitSlop={6}>
            <Text style={styles.sortPillText}>{activeSortLabel}</Text>
            <Icon name="chevron-down" size={13} color="#98B6D8" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* Spot cards */}
        {visibleSpots.length > 0 ? (
          visibleSpots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} onPress={() => navigation.push('LiveSpot', { spot })} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="search" size={32} color="#BCC5CB" />
            <Text style={styles.emptyText}>Ingen plasser matcher filteret</Text>
            <TouchableOpacity onPress={() => setActiveFilters(new Set())} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Nullstill filter</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Sort / filter modal */}
      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Sorter og filtrer</Text>

            <Text style={styles.modalSection}>Sorter etter</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.id} onPress={() => { setSortBy(opt.id); }} style={styles.sortOption}>
                <Text style={[styles.sortOptionText, sortBy === opt.id && styles.sortOptionTextActive]}>{opt.label}</Text>
                {sortBy === opt.id && <Icon name="check" size={16} color="#4E96F0" strokeWidth={2.5} />}
              </TouchableOpacity>
            ))}

            <Text style={[styles.modalSection, { marginTop: 20 }]}>Filtrer</Text>
            <View style={styles.filterGrid}>
              {FILTERS.map((f) => {
                const active = activeFilters.has(f.id);
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => toggleFilter(f.id)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {hasFilters && (
              <TouchableOpacity onPress={() => { setActiveFilters(new Set()); setShowSortModal(false); }} style={styles.clearAllBtn}>
                <Text style={styles.clearAllText}>Nullstill alle filtre</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Rating prompt */}
      <Modal visible={!!ratingTarget} transparent animationType="slide" onRequestClose={() => setRatingTarget(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setRatingTarget(null)}>
          <Pressable style={[styles.ratingSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.ratingIconWrap}>
              <LinearGradient colors={['#4E96F0', '#5EA2F5', '#4E96F0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
              <Icon name="map-pin" size={22} color="#fff" strokeWidth={2} />
            </View>
            <Text style={styles.ratingTitle}>Hvordan var parkeringen?</Text>
            <Text style={styles.ratingSub}>{ratingTarget?.spots?.address ?? ''}</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRatingValue(n)} activeOpacity={0.7} style={styles.starBtn}>
                  <Text style={[styles.starChar, n <= ratingValue && styles.starCharActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput keyboardAppearance="dark"
              style={styles.ratingInput}
              placeholder="Legg til kommentar (valgfritt)"
              placeholderTextColor="#BCC5CB"
              value={ratingComment}
              onChangeText={setRatingComment}
              multiline
              maxLength={200}
            />

            <TouchableOpacity
              onPress={submitRating}
              style={[styles.ratingSubmit, !ratingValue && { opacity: 0.4 }]}
              activeOpacity={0.88}
              disabled={!ratingValue || submitting}
            >
              <LinearGradient colors={['#4E96F0', '#5EA2F5', '#4E96F0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]} />
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.ratingSubmitText}>Send inn vurdering</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setRatingTarget(null)} style={styles.ratingSkip}>
              <Text style={styles.ratingSkipText}>Hopp over</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SpotCard({ spot, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.spotCard}>
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: 22, backgroundColor: '#3A4C68' }]} />
      <View style={styles.spotInner}>
        <View style={styles.spotRow}>
          <View style={styles.spotLeft}>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.untilText}>{spot.until}</Text>
            </View>
            <Text style={styles.addressText} numberOfLines={1}>{spot.address}</Text>
            <Text style={styles.metaText}>{[
              spot.area,
              spot.distanceFromSearchKm != null
                ? `${formatDistanceKm(spot.distanceFromSearchKm)} fra søk`
                : (spot.distance && spot.distance),
            ].filter(Boolean).join(' · ')}</Text>
            <View style={styles.tagRow}>
              {spot.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {spot.tags.length > 3 && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>+{spot.tags.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.spotRight}>
            <View style={styles.priceRow}>
              <Text style={styles.priceNum}>{spot.price}</Text>
              <Text style={styles.priceUnit}>kr/t</Text>
            </View>
            <View style={styles.arrowBtn}>
              <Icon name="arrow-right" size={14} color="#fff" strokeWidth={2.5} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { flex: 1 },
  logo: { width: 44, height: 44, borderRadius: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  heartBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4E96F0', alignItems: 'center', justifyContent: 'center', shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 9, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#2B394C' },
  greeting: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: '#98B6D8', letterSpacing: 0.8, textTransform: 'uppercase' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 18, color: '#FFFFFF', letterSpacing: -0.36 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 18, backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12,
    shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  searchPin: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4E96F0', alignItems: 'center', justifyContent: 'center' },
  searchText: { flex: 1, minWidth: 0 },
  searchLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase' },
  searchValue: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14, padding: 0 },

  filtersWrapper: { marginBottom: 18 },
  filterDropdown: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, height: 44, borderRadius: 14,
    backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  filterDropdownActive: { backgroundColor: '#4E96F0', borderColor: '#4E96F0' },
  filterDropdownText: { flex: 1, fontFamily: 'System', fontWeight: '700', fontSize: 13, color: '#98B6D8', letterSpacing: -0.13 },
  filterDropdownTextActive: { color: '#fff' },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 4 },
  filterChip: { height: 34, paddingHorizontal: 14, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(17,20,22,0.08)' },
  filterChipActive: { backgroundColor: '#4E96F0', borderColor: '#4E96F0' },
  filterText: { fontFamily: 'System', fontWeight: '700', fontSize: 13, color: '#98B6D8', letterSpacing: -0.13 },
  filterTextActive: { color: '#fff' },

  searchBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginBottom: 10 },
  searchBannerInfo: { backgroundColor: 'rgba(16,185,129,0.08)' },
  searchBannerWarn: { backgroundColor: 'rgba(245,158,11,0.10)' },
  searchBannerText: { flex: 1, fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#98B6D8', letterSpacing: -0.12 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase' },
  sortPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
  sortPillText: { fontFamily: 'System', fontWeight: '700', fontSize: 12, color: '#98B6D8', letterSpacing: -0.12 },

  spotCard: { borderRadius: 22, marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 2 },
  spotInner: { padding: 14 },
  spotRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  spotLeft: { flex: 1, minWidth: 0 },
  spotRight: { alignItems: 'flex-end', gap: 6 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4E96F0' },
  untilText: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#98B6D8', letterSpacing: 1, textTransform: 'uppercase' },
  addressText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32, marginTop: 4 },
  metaText: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 2 },

  tagRow: { flexDirection: 'row', gap: 5, marginTop: 8 },
  tag: { height: 22, paddingHorizontal: 8, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#50607A' },
  tagText: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#98B6D8', letterSpacing: -0.1 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  priceNum: { fontFamily: 'System', fontWeight: '800', fontSize: 18, color: '#fff', letterSpacing: -0.36 },
  priceUnit: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  arrowBtn: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)' },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontFamily: 'System', fontWeight: '600', fontSize: 15, color: '#98B6D8', marginTop: 12, marginBottom: 16 },
  clearBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(17,20,22,0.08)' },
  clearBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 13, color: '#FFFFFF' },

  ratingSheet: { backgroundColor: '#263548', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, alignItems: 'center' },
  ratingIconWrap: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  ratingTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 22, color: '#FFFFFF', letterSpacing: -0.44, marginBottom: 4, textAlign: 'center' },
  ratingSub: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#98B6D8', marginBottom: 22, textAlign: 'center' },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  starBtn: { padding: 4 },
  starChar: { fontSize: 38, color: 'rgba(17,20,22,0.15)' },
  starCharActive: { color: '#F59E0B' },
  ratingInput: { width: '100%', minHeight: 72, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'System', fontWeight: '400', fontSize: 14, color: '#FFFFFF', marginBottom: 14, textAlignVertical: 'top' },
  ratingSubmit: { width: '100%', height: 52, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  ratingSubmitText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#fff', letterSpacing: -0.15 },
  ratingSkip: { paddingVertical: 12 },
  ratingSkipText: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#98B6D8' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#3A4C68', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#50607A', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 18, color: '#FFFFFF', letterSpacing: -0.36, marginBottom: 20 },
  modalSection: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#98B6D8', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 },
  sortOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(17,20,22,0.06)' },
  sortOptionText: { fontFamily: 'System', fontWeight: '500', fontSize: 15, color: '#98B6D8' },
  sortOptionTextActive: { fontFamily: 'System', fontWeight: '700', color: '#FFFFFF' },
  clearAllBtn: { marginTop: 16, paddingVertical: 14, alignItems: 'center', borderRadius: 14, backgroundColor: 'rgba(229,62,62,0.08)' },
  clearAllText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#C53030' },
});
