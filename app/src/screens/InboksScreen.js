import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabase';
import { notifyUser } from '../lib/notify';
import { useAuth } from '../context/AuthContext';

const STATUS_META = {
  confirmed:  { label: 'Bekreftet',  dot: '#4E96F0', bg: 'rgba(16,185,129,0.1)',  text: '#065F46' },
  pending:    { label: 'Venter',     dot: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  text: '#92400E' },
  completed:  { label: 'Fullført',   dot: '#98B6D8', bg: 'rgba(255,255,255,0.07)',   text: '#98B6D8' },
  cancelled:  { label: 'Kansellert', dot: '#EF4444', bg: 'rgba(239,68,68,0.08)',  text: '#991B1B' },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
}
function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function InboksScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!user) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true); else setLoading(true);

    const { data: spotRows } = await supabase
      .from('spots')
      .select('id, address')
      .eq('owner_id', user.id);

    if (!spotRows || spotRows.length === 0) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const spotMap = Object.fromEntries(spotRows.map(s => [s.id, s.address]));
    const spotIds = spotRows.map(s => s.id);

    const { data: rows } = await supabase
      .from('reservations')
      .select('id, spot_id, renter_id, starts_at, ends_at, duration_mins, price_subtotal, total, status')
      .in('spot_id', spotIds)
      .order('starts_at', { ascending: false })
      .limit(60);

    if (!rows) { setLoading(false); setRefreshing(false); return; }

    // Fetch renter profiles in one query
    const renterIds = [...new Set(rows.map(r => r.renter_id).filter(Boolean))];
    const profileMap = {};
    if (renterIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', renterIds);
      (profiles ?? []).forEach(p => { profileMap[p.id] = p.full_name; });
    }

    setReservations(rows.map(r => ({
      ...r,
      spotAddress:  spotMap[r.spot_id] ?? 'Ukjent plass',
      renterName:   profileMap[r.renter_id] ?? 'Leietaker',
    })));
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const cancelReservation = (r) => {
    Alert.alert(
      'Avvis reservasjon',
      `Avvis ${r.renterName}s reservasjon på ${r.spotAddress}?`,
      [
        { text: 'Nei', style: 'cancel' },
        {
          text: 'Avvis', style: 'destructive',
          onPress: async () => {
            await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', r.id);
            setReservations(prev => prev.map(x => x.id === r.id ? { ...x, status: 'cancelled' } : x));
            notifyUser(r.renter_id, {
              title: 'Reservasjon avvist',
              body: `${r.spotAddress} · ${new Date(r.starts_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })} er dessverre avlyst av utleier.`,
            });
          },
        },
      ],
    );
  };

  const upcoming  = reservations.filter(r => new Date(r.starts_at) >= new Date() && r.status !== 'cancelled');
  const past      = reservations.filter(r => new Date(r.starts_at) <  new Date() || r.status === 'cancelled');

  return (
    <View style={s.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#4E96F0" />}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Innboks</Text>
          <View style={s.backBtn} />
        </View>

        {loading ? (
          <ActivityIndicator color="#4E96F0" style={{ marginTop: 60 }} />
        ) : reservations.length === 0 ? (
          <View style={s.empty}>
            <Icon name="bell" size={36} color="#BCC5CB" />
            <Text style={s.emptyTitle}>Ingen reservasjoner ennå</Text>
            <Text style={s.emptyHint}>Reservasjoner for plassene dine vises her</Text>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={s.section}>Kommende · {upcoming.length}</Text>
                {upcoming.map(r => <ReservationCard key={r.id} r={r} onCancel={() => cancelReservation(r)} />)}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={s.section}>Tidligere · {past.length}</Text>
                {past.map(r => <ReservationCard key={r.id} r={r} muted />)}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ReservationCard({ r, muted = false, onCancel }) {
  const meta = STATUS_META[r.status] ?? STATUS_META.pending;
  const hrs  = r.duration_mins ? `${Math.round(r.duration_mins / 60 * 10) / 10} t` : '—';
  const canCancel = onCancel && ['confirmed', 'pending'].includes(r.status) && new Date(r.starts_at) > new Date();

  return (
    <View style={[s.card, muted && s.cardMuted]}>
      {/* Renter avatar + name */}
      <View style={s.cardTop}>
        <View style={s.avatar}>
          <LinearGradient colors={['#4E96F0', '#6FB1F7']} style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]} />
          <Text style={s.avatarText}>{initials(r.renterName)}</Text>
        </View>
        <View style={s.cardInfo}>
          <Text style={s.renterName}>{r.renterName}</Text>
          <Text style={s.spotAddr} numberOfLines={1}>{r.spotAddress}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: meta.bg }]}>
          <View style={[s.statusDot, { backgroundColor: meta.dot }]} />
          <Text style={[s.statusText, { color: meta.text }]}>{meta.label}</Text>
        </View>
      </View>

      {/* Date / time / price row */}
      <View style={s.cardMeta}>
        <View style={s.metaItem}>
          <Icon name="clock" size={12} color="#98B6D8" strokeWidth={1.8} />
          <Text style={s.metaText}>{formatDate(r.starts_at)}</Text>
        </View>
        <View style={s.metaItem}>
          <Icon name="arrow-right" size={12} color="#98B6D8" strokeWidth={1.8} />
          <Text style={s.metaText}>{formatTime(r.starts_at)} – {formatTime(r.ends_at)}</Text>
        </View>
        <View style={s.metaItem}>
          <Icon name="wallet" size={12} color="#98B6D8" strokeWidth={1.8} />
          <Text style={s.metaText}>{r.price_subtotal ?? '—'} kr · {hrs}</Text>
        </View>
      </View>

      {canCancel && (
        <TouchableOpacity onPress={onCancel} style={s.cancelBtn}>
          <Icon name="x" size={13} color="#EF4444" strokeWidth={2.5} />
          <Text style={s.cancelBtnText}>Avvis reservasjon</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32 },

  section: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },

  card: {
    backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 22, padding: 16, marginBottom: 10,
    shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardMuted: { opacity: 0.7 },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#FFFFFF', zIndex: 1 },
  cardInfo: { flex: 1, minWidth: 0 },
  renterName: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#FFFFFF', letterSpacing: -0.15 },
  spotAddr: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 2 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: 'System', fontWeight: '700', fontSize: 11, letterSpacing: -0.1 },

  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(17,20,22,0.06)' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8' },

  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(239,68,68,0.12)' },
  cancelBtnText: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#EF4444' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32 },
  emptyHint: { fontFamily: 'System', fontWeight: '400', fontSize: 13, color: '#98B6D8' },
});
