import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabase';
import { notifyUser } from '../lib/notify';
import { useAuth } from '../context/AuthContext';

const STATUS_MAP = {
  completed: { label: 'Fullført', color: '#5EA2F5', bg: 'rgba(63,166,107,0.12)',  dot: '#5EA2F5' },
  cancelled:  { label: 'Avbrutt',  color: '#92400E', bg: 'rgba(217,119,6,0.12)',   dot: '#D97706' },
  confirmed:  { label: 'Kommende', color: '#1E40AF', bg: 'rgba(37,99,235,0.12)',   dot: '#4E96F0' },
  pending:    { label: 'Venter',   color: '#1E40AF', bg: 'rgba(37,99,235,0.12)',   dot: '#4E96F0' },
};

function fmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function minsToStr(mins) {
  if (!mins) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} t ${m}m` : `${h} t`;
}

export default function ReservasjonshistorikkScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [filter, setFilter] = useState('alle');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from('reservations')
      .select('*, spots(id, address, price_per_hour, amenities)')
      .eq('renter_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setHistory(data ?? []);
        setLoading(false);
      });
  }, [user]));

  const cancelBooking = (item) => {
    Alert.alert(
      'Avbestill reservasjon',
      `Er du sikker på at du vil avbestille parkeringen på ${item.spots?.address ?? 'denne plassen'}?`,
      [
        { text: 'Nei, behold', style: 'cancel' },
        {
          text: 'Ja, avbestill', style: 'destructive',
          onPress: async () => {
            await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', item.id);
            setHistory(prev => prev.map(h => h.id === item.id ? { ...h, status: 'cancelled' } : h));
            const { data: spot } = await supabase.from('spots').select('owner_id').eq('id', item.spot_id).maybeSingle();
            if (spot?.owner_id) {
              notifyUser(spot.owner_id, {
                title: 'Reservasjon avbestilt',
                body: `${item.spots?.address ?? 'Plass'} · ${new Date(item.starts_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}`,
              });
            }
          },
        },
      ],
    );
  };

  const FILTERS = ['alle', 'completed', 'cancelled', 'confirmed'];
  const FILTER_LABELS = { alle: 'Alle', completed: 'Fullført', cancelled: 'Avbrutt', confirmed: 'Kommende' };

  const filtered = filter === 'alle' ? history : history.filter(h => h.status === filter);
  const completedItems = history.filter(h => h.status === 'completed');
  const totalPaid = completedItems.reduce((sum, h) => sum + (h.total ?? 0), 0);
  const totalMins = completedItems.reduce((sum, h) => sum + (h.duration_mins ?? 0), 0);

  return (
    <View style={s.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          {navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Icon name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={s.backBtn} />
          )}
          <Text style={s.headerTitle}>Historikk</Text>
          <View style={s.backBtn} />
        </View>

        <View style={s.summaryCard}>
          <LinearGradient colors={['#98B6D8', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]} />
          <View style={s.blob} />
          <View style={s.summaryInner}>
            <View style={s.summaryBlock}>
              <Text style={s.summaryValue}>{completedItems.length}</Text>
              <Text style={s.summaryLabel}>Fullførte</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryBlock}>
              <Text style={s.summaryValue}>{minsToStr(totalMins)}</Text>
              <Text style={s.summaryLabel}>Totalt parkert</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryBlock}>
              <Text style={s.summaryValue}>{totalPaid} kr</Text>
              <Text style={s.summaryLabel}>Totalt betalt</Text>
            </View>
          </View>
        </View>

        <View style={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[s.filterBtn, filter === f && s.filterBtnActive]}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>{FILTER_LABELS[f]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color="#4EA7B9" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>Ingen reservasjoner enda</Text>
          </View>
        ) : (
          <View style={s.list}>
            {filtered.map((item, i) => {
              const st = STATUS_MAP[item.status] ?? STATUS_MAP.pending;
              return (
                <View key={item.id}>
                  {i > 0 && <View style={s.divider} />}
                  <TouchableOpacity
                    style={s.item}
                    activeOpacity={0.75}
                    onPress={() => item.spots && navigation.getParent()?.navigate('Kart', {
                      screen: 'LiveSpot',
                      params: { spot: { id: item.spots.id, address: item.spots.address, area: '', price: item.spots.price_per_hour, tags: item.spots.amenities ?? [], until: '', distanceKm: 99, distance: '', walk: '', featured: false, isLive: true } },
                    })}
                  >
                    <View style={s.itemLeft}>
                      <View style={s.itemIconWrap}>
                        <Icon name="map-pin" size={14} color="#FFFFFF" strokeWidth={1.8} />
                      </View>
                      <View style={s.itemInfo}>
                        <Text style={s.itemAddress}>{item.spots?.address ?? '—'}</Text>
                        <Text style={s.itemMeta}>{fmt(item.starts_at)} · {minsToStr(item.duration_mins)}</Text>
                        {['confirmed', 'pending'].includes(item.status) && new Date(item.starts_at) > new Date() && (
                          <TouchableOpacity onPress={() => cancelBooking(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={s.cancelLink}>Avbestill</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <View style={s.itemRight}>
                      <Text style={s.itemPrice}>{item.total ?? 0} kr</Text>
                      <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                        <View style={[s.statusDot, { backgroundColor: st.dot }]} />
                        <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32 },
  summaryCard: { borderRadius: 22, overflow: 'hidden', padding: 20, marginBottom: 18, shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 6 },
  blob: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(95,175,211,0.28)', top: -20, right: -20 },
  summaryInner: { flexDirection: 'row', alignItems: 'center' },
  summaryBlock: { flex: 1, alignItems: 'center', gap: 4 },
  summaryValue: { fontFamily: 'System', fontWeight: '800', fontSize: 20, color: '#fff', letterSpacing: -0.4 },
  summaryLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 10, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  summaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: { flex: 1, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  filterBtnActive: { backgroundColor: '#5EA2F5', borderColor: '#5EA2F5' },
  filterText: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: '#98B6D8' },
  filterTextActive: { color: '#fff' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: '#98B6D8' },
  list: { backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginLeft: 66 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#50607A', alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemAddress: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14 },
  itemMeta: { fontFamily: 'System', fontWeight: '400', fontSize: 11, color: '#98B6D8', marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 5 },
  itemPrice: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontFamily: 'System', fontWeight: '700', fontSize: 10, letterSpacing: 0.2 },
  cancelLink: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: '#EF4444', marginTop: 5 },
});
