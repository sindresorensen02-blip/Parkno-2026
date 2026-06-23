import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function LagretScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState({}); // { [spotId]: 'free' | 'occupied' }

  const checkAvailability = useCallback(async (spotIds) => {
    if (!spotIds.length) return;
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('reservations')
      .select('spot_id')
      .in('spot_id', spotIds)
      .in('status', ['confirmed', 'pending'])
      .lte('starts_at', now)
      .gte('ends_at', now);
    const occupied = new Set((data ?? []).map(r => r.spot_id));
    setAvailability(prev => {
      const next = { ...prev };
      spotIds.forEach(id => { next[id] = occupied.has(id) ? 'occupied' : 'free'; });
      return next;
    });
  }, []);

  const fetchSaved = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('saved_spots')
      .select('id, spot_id, spots(id, address, price_per_hour, amenities)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSaved(data ?? []);
    setLoading(false);
    const ids = (data ?? []).map(s => s.spot_id).filter(Boolean);
    checkAvailability(ids);
  }, [user, checkAvailability]);

  useFocusEffect(useCallback(() => { fetchSaved(); }, [fetchSaved]));

  // Realtime availability updates
  useEffect(() => {
    if (!saved.length) return;
    const spotIds = saved.map(s => s.spot_id).filter(Boolean);
    const channel = supabase
      .channel('lagret-avail')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' },
        () => checkAvailability(spotIds))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [saved, checkAvailability]);

  const unsave = async (savedId) => {
    await supabase.from('saved_spots').delete().eq('id', savedId);
    setSaved(prev => prev.filter(s => s.id !== savedId));
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#F7F7F2', '#F7F7F2']} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <Icon name="arrow-left" size={20} color="#111416" strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Lagret</Text>
            <Text style={styles.sub}>Dine favorittsplasser</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#4EA7B9" style={{ marginTop: 60 }} />
        ) : saved.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Icon name="heart" size={28} color="#7B8589" /></View>
            <Text style={styles.emptyLabel}>Ingen lagrede plasser</Text>
            <Text style={styles.emptySub}>Trykk ♥ på en plass for å lagre den her</Text>
          </View>
        ) : (
          saved.map((s) => {
            const spot = s.spots;
            if (!spot) return null;
            return (
              <TouchableOpacity
                key={s.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.push('LiveSpot', {
                  spot: { id: spot.id, address: spot.address, area: '', price: spot.price_per_hour, tags: spot.amenities ?? [], until: '', distanceKm: 99, distance: '', walk: '', featured: false, isLive: true },
                })}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardAddress}>{spot.address}</Text>
                    <View style={styles.cardMetaRow}>
                      <Text style={styles.cardMeta}>{spot.price_per_hour} kr/t</Text>
                      {availability[spot.id] && (
                        <View style={[styles.availBadge, availability[spot.id] === 'occupied' && styles.availBadgeOccupied]}>
                          <View style={[styles.availDot, availability[spot.id] === 'occupied' && styles.availDotOccupied]} />
                          <Text style={[styles.availText, availability[spot.id] === 'occupied' && styles.availTextOccupied]}>
                            {availability[spot.id] === 'occupied' ? 'Opptatt' : 'Ledig nå'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity style={styles.heartBtn} onPress={() => unsave(s.id)}>
                    <Icon name="heart" size={16} color="#EF8F7A" />
                  </TouchableOpacity>
                </View>
                {(spot.amenities ?? []).length > 0 && (
                  <View style={styles.tagRow}>
                    {spot.amenities.map((t) => (
                      <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'System', fontWeight: '800', fontSize: 26, color: '#111416', letterSpacing: -0.52 },
  sub: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: '#7B8589', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  emptyLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 17, color: '#111416', letterSpacing: -0.34 },
  emptySub: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#7B8589', textAlign: 'center', paddingHorizontal: 20 },
  card: { padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardAddress: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#111416', letterSpacing: -0.15 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  cardMeta: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#7B8589' },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  availBadgeOccupied: { backgroundColor: 'rgba(217,119,6,0.1)', borderColor: 'rgba(217,119,6,0.25)' },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  availDotOccupied: { backgroundColor: '#D97706' },
  availText: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#0D7A55' },
  availTextOccupied: { color: '#92400E' },
  heartBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239,143,122,0.12)', alignItems: 'center', justifyContent: 'center' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(17,20,22,0.06)' },
  tagText: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: '#2F3437' },
});
