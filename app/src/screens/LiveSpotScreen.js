import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, ActivityIndicator, Linking, Alert } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { supabase } from '../lib/supabase';
import { notifyUser } from '../lib/notify';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { BOOKING_FEE_RATE } from '../constants/booking';

const DURATIONS = [
  { label: '30m',     hours: 0.5  },
  { label: '1 t',     hours: 1    },
  { label: '2 t',     hours: 2    },
  { label: 'Tilpass', hours: null },
];

const TAG_ICON_MAP = {
  'Tak over':  'shield',
  'Innendørs': 'layers',
  'Kamera':    'camera',
};
function tagIcon(tag) {
  if (tag.toLowerCase().startsWith('elbil')) return 'zap';
  if (tag.toLowerCase().includes('belyst')) return 'star';
  return TAG_ICON_MAP[tag] ?? 'map-pin';
}

function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }

export default function LiveSpotScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const spot = route?.params?.spot ?? {
    address: 'Strandgaten 12',
    area: 'Møhlenpris',
    distance: '0,4 km',
    walk: '5 min',
    price: 45,
    until: 'Ledig til 18:00',
    tags: ['Tak over', 'Elbil 11kW'],
  };
  const { user } = useAuth();

  // Duration preselected from a previous screen (e.g. map slider). Maps to one
  // of the DURATIONS presets if it matches, otherwise falls back to "Tilpass".
  const initialMins = route?.params?.initialMins;
  const presetIdx = initialMins != null
    ? DURATIONS.findIndex(d => d.hours !== null && Math.round(d.hours * 60) === initialMins)
    : -1;

  // ── state ──────────────────────────────────────────────────────────────────
  const [durationIdx, setDurationIdx]   = useState(presetIdx >= 0 ? presetIdx : (initialMins != null ? 3 : 1));
  const [startNow, setStartNow]         = useState(true);
  const [customMins, setCustomMins]     = useState(initialMins ?? 90);
  const [planDate, setPlanDate]         = useState(0);
  const [planHour, setPlanHour]         = useState(() => (new Date().getHours() + 1) % 24);
  const [planMinute, setPlanMinute]     = useState(0);
  const [reserving, setReserving]       = useState(false);
  const [confirmed, setConfirmed]       = useState(false);
  const [isSaved, setIsSaved]           = useState(false);
  const [reservationId, setReservationId] = useState(null);
  const [availability, setAvailability] = useState({ isOccupied: false, nextOccupiedAt: null, loadingAvail: true });
  const [activeReservation, setActiveReservation] = useState(null);
  const [extending, setExtending]                 = useState(false);
  const [timeOpen, setTimeOpen]                   = useState(false);

  const isRealSpot = !!(spot.id && String(spot.id).length > 10);

  // ── effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !isRealSpot) return;
    supabase
      .from('saved_spots')
      .select('id')
      .eq('user_id', user.id)
      .eq('spot_id', spot.id)
      .maybeSingle()
      .then(({ data }) => setIsSaved(!!data));
  }, [user, spot.id]);

  // Real-time availability
  useEffect(() => {
    if (!isRealSpot) { setAvailability({ isOccupied: false, nextOccupiedAt: null, loadingAvail: false }); return; }

    const loadAvailability = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('reservations')
        .select('starts_at, ends_at')
        .eq('spot_id', spot.id)
        .in('status', ['confirmed', 'pending'])
        .gte('ends_at', now)
        .order('starts_at', { ascending: true });

      const nowMs = Date.now();
      const active = (data ?? []).find(r => new Date(r.starts_at).getTime() <= nowMs && new Date(r.ends_at).getTime() > nowMs);
      const next   = (data ?? []).find(r => new Date(r.starts_at).getTime() > nowMs);

      setAvailability({
        isOccupied:      !!active,
        nextOccupiedAt:  active ? new Date(active.ends_at) : (next ? new Date(next.starts_at) : null),
        loadingAvail:    false,
      });
    };

    loadAvailability();

    const channel = supabase
      .channel(`avail-${spot.id}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `spot_id=eq.${spot.id}` },
        () => loadAvailability())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [spot.id, isRealSpot]);

  // Active reservation for this user/spot (enables extend UI)
  useEffect(() => {
    if (!user || !isRealSpot) return;
    const loadActive = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('reservations')
        .select('id, starts_at, ends_at, total')
        .eq('spot_id', spot.id)
        .eq('renter_id', user.id)
        .eq('status', 'confirmed')
        .lte('starts_at', now)
        .gte('ends_at', now)
        .maybeSingle();
      setActiveReservation(data ?? null);
    };
    loadActive();
    const interval = setInterval(loadActive, 30000);
    return () => clearInterval(interval);
  }, [user, spot.id, isRealSpot]);

  // ── availability derived ───────────────────────────────────────────────────
  const { isOccupied, nextOccupiedAt, loadingAvail } = availability;
  const availUntilText = (() => {
    if (loadingAvail) return '…';
    if (!isRealSpot)  return spot.until || 'Ledig nå';
    const fmt = (d) => d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
    if (isOccupied)   return nextOccupiedAt ? `Opptatt til ${fmt(nextOccupiedAt)}` : 'Opptatt';
    if (nextOccupiedAt) return `Ledig til ${fmt(nextOccupiedAt)}`;
    return 'Ledig nå';
  })();

  // ── derived values (all computed before reserve) ───────────────────────────
  const { isPremium } = usePremium();
  const isCustom        = DURATIONS[durationIdx].hours === null;
  const hours           = isCustom ? customMins / 60 : DURATIONS[durationIdx].hours;
  const subtotal        = Math.round(spot.price * hours);
  const standardFee     = Math.round(subtotal * BOOKING_FEE_RATE);
  const bookingFee      = isPremium ? 0 : standardFee;
  const premiumSavings  = standardFee; // what Premium saves on this booking
  const total           = subtotal + bookingFee;

  const now    = new Date();
  const startH = startNow ? now.getHours()   : planHour;
  const startM = startNow ? now.getMinutes() : planMinute;
  const startStr     = `${pad(startH)}:${pad(startM)}`;
  const endTotalMins = Math.round(startH * 60 + startM + hours * 60);
  const endStr       = `${pad(Math.floor(endTotalMins / 60) % 24)}:${pad(endTotalMins % 60)}`;

  const durationStr = hours < 1
    ? `${Math.round(hours * 60)}m`
    : Number.isInteger(hours)
      ? `${hours} t`
      : `${Math.floor(hours)} t ${Math.round((hours % 1) * 60)}m`;

  const priceLabel = hours < 1
    ? `${Math.round(hours * 60)} min × ${spot.price} kr/t`
    : `${durationStr} × ${spot.price} kr/t`;

  // ── smart time chips ───────────────────────────────────────────────────────
  const smartChips = useMemo(() => {
    const h    = new Date().getHours();
    const isWE = [0, 6].includes(new Date().getDay());
    const chips = [];

    if (nextOccupiedAt && !isOccupied) {
      const mins = Math.floor((nextOccupiedAt - new Date()) / 60000);
      if (mins >= 30 && mins <= 720) {
        const t = mins < 60 ? `${mins} min` : mins % 60 === 0 ? `${mins / 60} t` : `${Math.floor(mins / 60)} t ${mins % 60} m`;
        chips.push({ label: `Til opptatt · ${t}`, mins, highlight: true });
      }
    }

    if      (h >= 7  && h < 10) { chips.push({ label: 'Morgen · 2 t', mins: 120 });      chips.push({ label: 'Formiddag · 4 t', mins: 240 }); }
    else if (h >= 10 && h < 12) { chips.push({ label: 'Formiddag · 2 t', mins: 120 });   chips.push({ label: 'Halv dag · 4 t', mins: 240 }); }
    else if (h >= 12 && h < 14) { chips.push({ label: 'Lunsj · 1 t', mins: 60 });        chips.push({ label: 'Lunsj · 1,5 t', mins: 90 }); }
    else if (h >= 14 && h < 17) { chips.push({ label: 'Ettermiddag · 2 t', mins: 120 }); chips.push({ label: 'Halv dag · 3 t', mins: 180 }); }
    else if (h >= 17 && h < 20) { chips.push({ label: 'Middag · 2 t', mins: 120 });      chips.push({ label: 'Kveld · 3 t', mins: 180 }); }
    else                         { chips.push({ label: 'Kveld · 2 t', mins: 120 });       chips.push({ label: 'Natt · 4 t', mins: 240 }); }

    if (isWE) chips.push({ label: 'Heldags · 8 t', mins: 480 });

    return chips.slice(0, 4);
  }, [nextOccupiedAt, isOccupied]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const toggleSave = async () => {
    if (!user || !isRealSpot) return;
    if (isSaved) {
      await supabase.from('saved_spots').delete().eq('user_id', user.id).eq('spot_id', spot.id);
      setIsSaved(false);
    } else {
      await supabase.from('saved_spots').insert({ user_id: user.id, spot_id: spot.id });
      setIsSaved(true);
    }
  };

  const openInMaps = () => {
    const q = encodeURIComponent(`${spot.address}, Bergen, Norge`);
    Linking.openURL(`maps://?daddr=${q}`);
  };

  const applyChip = (mins) => {
    const match = DURATIONS.findIndex(d => d.hours !== null && Math.round(d.hours * 60) === mins);
    if (match >= 0) { setDurationIdx(match); }
    else            { setDurationIdx(3); setCustomMins(mins); }
  };

  const extendBooking = async (extraMins) => {
    if (!activeReservation || extending) return;
    setExtending(true);
    const newEndsAt = new Date(new Date(activeReservation.ends_at).getTime() + extraMins * 60 * 1000);

    // Check that the extended window doesn't overlap another reservation
    const { data: available } = await supabase.rpc('check_spot_availability_excluding', {
      p_spot_id:    spot.id,
      p_starts_at:  activeReservation.starts_at,
      p_ends_at:    newEndsAt.toISOString(),
      p_exclude_id: activeReservation.id,
    });
    if (!available) {
      setExtending(false);
      Alert.alert('Kan ikke forlenge', 'En annen reservasjon starter før den forlengede sluttiden.', [{ text: 'OK' }]);
      return;
    }

    const extraCost = Math.round(spot.price * (extraMins / 60) * (1 + BOOKING_FEE_RATE));
    const { error } = await supabase
      .from('reservations')
      .update({ ends_at: newEndsAt.toISOString(), total: (activeReservation.total ?? 0) + extraCost })
      .eq('id', activeReservation.id);
    if (!error) setActiveReservation(prev => ({ ...prev, ends_at: newEndsAt.toISOString() }));
    setExtending(false);
  };

  const reserve = async () => {
    if (!user || !isRealSpot) { setConfirmed(true); return; }
    setReserving(true);

    const startsAt = (() => {
      if (startNow) return new Date();
      const d = new Date();
      d.setDate(d.getDate() + planDate);
      d.setHours(planHour, planMinute, 0, 0);
      return d;
    })();
    const endsAt = new Date(startsAt.getTime() + hours * 60 * 60 * 1000);

    // Pre-flight availability check before hitting the insert
    const { data: available } = await supabase.rpc('check_spot_availability', {
      p_spot_id:   spot.id,
      p_starts_at: startsAt.toISOString(),
      p_ends_at:   endsAt.toISOString(),
    });
    if (!available) {
      setReserving(false);
      Alert.alert(
        'Plassen er opptatt',
        'Noen andre reserverte denne plassen akkurat nå. Velg et annet tidspunkt.',
        [{ text: 'OK' }],
      );
      return;
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        spot_id:        spot.id,
        renter_id:      user.id,
        starts_at:      startsAt.toISOString(),
        ends_at:        endsAt.toISOString(),
        duration_mins:  Math.round(hours * 60),
        price_subtotal: subtotal,
        booking_fee:    bookingFee,
        total,
        status:         'confirmed',
        payment_status: 'pending',
      })
      .select('id')
      .single();

    setReserving(false);
    if (error) {
      const isConflict = error.message?.includes('tilgjengelig') || error.code === 'P0001' || error.code === '23P01';
      Alert.alert(
        isConflict ? 'Plassen er opptatt' : 'Noe gikk galt',
        isConflict
          ? 'Plassen ble reservert av noen andre i samme øyeblikk. Velg et annet tidspunkt.'
          : 'Reservasjonen kunne ikke fullføres. Prøv igjen.',
        [{ text: 'OK' }],
      );
      return;
    }
    if (true) {
      setReservationId(data?.id ?? null);
      setConfirmed(true);

      // Notify the host
      const { data: spotRow } = await supabase
        .from('spots')
        .select('owner_id')
        .eq('id', spot.id)
        .maybeSingle();
      if (spotRow?.owner_id) {
        notifyUser(spotRow.owner_id, {
          title: 'Ny reservasjon!',
          body: `${spot.address} · ${startStr}–${endStr} (${durationStr})`,
          data: { reservationId: data?.id, spotId: spot.id },
        });
      }

      // Send booking confirmation email (fire-and-forget)
      if (user?.email) {
        supabase.functions.invoke('send-booking-email', {
          body: {
            renterEmail: user.email,
            renterName:  user.user_metadata?.full_name ?? '',
            address:     spot.address,
            startStr,
            endStr,
            durationStr,
            total,
            refLabel:    data?.id ? `#${String(data.id).slice(0, 8).toUpperCase()}` : null,
          },
        });
      }
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  const amenities = (spot.tags ?? []).length > 0 ? spot.tags : [];
  const refLabel  = reservationId ? `#${String(reservationId).slice(0, 8).toUpperCase()}` : null;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#2B394C', '#2B394C', '#2B394C']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 76 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerMid}>
            <Text style={styles.headerSub}>{[spot.area, spot.distance].filter(Boolean).join(' · ')}</Text>
            <Text style={styles.headerTitle}>{spot.address}</Text>
          </View>
          <TouchableOpacity onPress={toggleSave} style={[styles.availBadge, isOccupied && !isSaved && styles.availBadgeOccupied]}>
            <Icon name="heart" size={14} color={isSaved ? '#EF8F7A' : isOccupied ? '#B45309' : '#5EA2F5'} />
            <Text style={[styles.availText, isSaved && { color: '#EF8F7A' }, isOccupied && !isSaved && { color: '#B45309' }]}>
              {isSaved ? 'Lagret' : isOccupied ? 'Opptatt' : 'Ledig'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Host card — moved to the top so users see who they're booking from first */}
        <View style={styles.hostCard}>
          <View style={styles.hostAvatar}>
            <LinearGradient colors={['#5EA2F5', '#7FBBF8', '#6FB1F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]} />
            <Text style={styles.hostAvatarText}>SH</Text>
          </View>
          <View style={styles.hostInfo}>
            <Text style={styles.hostLabel}>Utleier</Text>
            <Text style={styles.hostName}>Sondre H.</Text>
            <Text style={styles.hostMeta}>4,9 ★ · 60 anmeldelser · svarer på 3 min</Text>
          </View>
        </View>

        {/* Compact meta strip — replaces the large hero card */}
        <View style={styles.metaStrip}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{spot.price}<Text style={styles.metaUnit}> kr/t</Text></Text>
          </View>
          {spot.walk ? (
            <>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Icon name="map-pin" size={12} color="#4EA7B9" strokeWidth={2.2} />
                <Text style={styles.metaText}>{spot.walk}</Text>
              </View>
            </>
          ) : null}
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Icon name="clock" size={12} color={isOccupied ? '#D97706' : '#5EA2F5'} strokeWidth={2.2} />
            <Text style={[styles.metaText, isOccupied && { color: '#D97706' }]} numberOfLines={1}>
              {availUntilText}
            </Text>
          </View>
        </View>

        {/* About this spot — informational copy */}
        <Text style={styles.sectionLabel}>Om plassen</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoBody}>
            Trygg og lett tilgjengelig parkering i {spot.area || 'Bergen'}. Plassen er
            tilgjengelig under oppgitte tider, og du får parkeringsanvisning i appen
            når du har reservert.
          </Text>
        </View>

        {/* Amenities */}
        {amenities.length > 0 && (
          <View style={styles.amenitiesGrid}>
            {amenities.map((tag) => (
              <View key={tag} style={styles.amenityCard}>
                <View style={styles.amenityIcon}>
                  <Icon name={tagIcon(tag)} size={14} color="#FFFFFF" />
                </View>
                <Text style={styles.amenityLabel}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Extend booking banner — shown when user has a running booking */}
        {activeReservation && (
          <View style={styles.extendBanner}>
            <LinearGradient colors={['rgba(78,167,185,0.14)', 'rgba(139,207,176,0.10)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]} />
            <View style={styles.extendBannerTop}>
              <View style={styles.extendLiveDot} />
              <Text style={styles.extendTitle}>Booking aktiv</Text>
              <Text style={styles.extendUntil}>
                Slutter {new Date(activeReservation.ends_at).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={styles.extendSub}>Trenger du mer tid?</Text>
            <View style={styles.extendBtns}>
              <TouchableOpacity onPress={() => extendBooking(30)} style={styles.extendBtn} activeOpacity={0.85} disabled={extending}>
                {extending
                  ? <ActivityIndicator size="small" color="#4EA7B9" />
                  : <Text style={styles.extendBtnText}>+ 30 min</Text>
                }
                <Text style={styles.extendBtnPrice}>{Math.round(spot.price * 0.5 * (1 + BOOKING_FEE_RATE))} kr</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => extendBooking(60)} style={styles.extendBtn} activeOpacity={0.85} disabled={extending}>
                {extending
                  ? <ActivityIndicator size="small" color="#4EA7B9" />
                  : <Text style={styles.extendBtnText}>+ 1 time</Text>
                }
                <Text style={styles.extendBtnPrice}>{Math.round(spot.price * 1 * (1 + BOOKING_FEE_RATE))} kr</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Single CTA — sends the user to the map tab so they can pick a
            duration with the pin slider and reserve. Booking logic does not
            live on this info page anymore. */}
        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate('Kart')}
          style={[styles.cta, isOccupied && { opacity: 0.45 }]}
          activeOpacity={0.88}
          disabled={isOccupied}
        >
          <LinearGradient colors={['#4E96F0', '#5EA2F5', '#4E96F0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]} />
          <Text style={styles.ctaText}>Velg tid på kart</Text>
          <View style={styles.ctaBadge}>
            <Icon name="map-pin" size={14} color="#fff" strokeWidth={2.4} />
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* Confirmation modal */}
      <Modal visible={confirmed} transparent animationType="slide" onRequestClose={() => setConfirmed(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setConfirmed(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.confirmIcon}>
              <LinearGradient colors={['#5EA2F5', '#7FBBF8', '#6FB1F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
              <Icon name="check" size={26} color="#fff" strokeWidth={2.5} />
            </View>
            <Text style={styles.confirmTitle}>Reservasjon bekreftet!</Text>
            <Text style={styles.confirmSub}>{spot.address} · {startStr}–{endStr}</Text>
            {refLabel && (
              <View style={styles.refBadge}>
                <Text style={styles.refText}>Bestillingsnr. {refLabel}</Text>
              </View>
            )}
            <View style={styles.confirmRow}>
              <View style={styles.confirmBlock}>
                <Text style={styles.confirmBlockLabel}>Betalt</Text>
                <Text style={styles.confirmBlockValue}>{total} kr</Text>
              </View>
              <View style={styles.confirmBlock}>
                <Text style={styles.confirmBlockLabel}>Varighet</Text>
                <Text style={styles.confirmBlockValue}>{durationStr}</Text>
              </View>
              <View style={styles.confirmBlock}>
                <Text style={styles.confirmBlockLabel}>Slutter</Text>
                <Text style={styles.confirmBlockValue}>{endStr}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={openInMaps} style={styles.mapsBtn} activeOpacity={0.88}>
              <Icon name="map-pin" size={16} color="#4EA7B9" strokeWidth={2} />
              <Text style={styles.mapsBtnText}>Åpne i Kart</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setConfirmed(false); navigation.goBack(); }} style={styles.doneBtn} activeOpacity={0.88}>
              <Text style={styles.doneBtnText}>Tilbake til forsiden</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerMid: { flex: 1 },
  headerSub: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: '#98B6D8', letterSpacing: 0.2 },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32, marginTop: 1 },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(139,207,176,0.25)', borderWidth: 1, borderColor: 'rgba(139,207,176,0.45)' },
  availBadgeOccupied: { backgroundColor: 'rgba(217,119,6,0.12)', borderColor: 'rgba(217,119,6,0.3)' },
  availText: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#5EA2F5' },

  // Compact meta strip — replaces the old hero card (~200px → ~44px)
  metaStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 16, marginBottom: 22,
    backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  metaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  metaValue: { fontFamily: 'System', fontWeight: '800', fontSize: 15, color: '#FFFFFF', letterSpacing: -0.3 },
  metaUnit: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: '#98B6D8', letterSpacing: 0 },
  metaText: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#98B6D8', letterSpacing: -0.1 },
  metaDivider: { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.08)' },

  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },

  // "Om plassen" info block
  infoCard: {
    backgroundColor: '#3A4C68',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 18,
  },
  infoBody: {
    fontFamily: 'System', fontWeight: '500', fontSize: 14,
    color: '#98B6D8', lineHeight: 21, letterSpacing: -0.1,
  },

  // Collapsible time/duration dropdown
  timeDropdownHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    marginBottom: 12,
  },
  timeDropdownLabel: {
    fontFamily: 'System', fontWeight: '700', fontSize: 11,
    color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase',
  },
  timeDropdownSummary: {
    fontFamily: 'System', fontWeight: '700', fontSize: 14,
    color: '#FFFFFF', letterSpacing: -0.2, marginTop: 3,
  },
  timeDropdownChevron: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#50607A',
  },
  timeDropdownChevronOpen: {
    backgroundColor: 'rgba(78,167,185,0.18)',
    transform: [{ rotate: '180deg' }],
  },
  timeDropdownBody: {
    backgroundColor: '#3B4C69',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    padding: 14, paddingTop: 16,
    marginBottom: 14,
  },

  startRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  startBtn: { flex: 1, height: 44, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  startBtnActive: { backgroundColor: '#5EA2F5', borderColor: '#5EA2F5' },
  startText: { fontFamily: 'System', fontWeight: '700', fontSize: 13, color: '#98B6D8' },
  startTextActive: { color: '#fff' },

  timePicker: { backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22, padding: 18, marginBottom: 22, gap: 16 },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateChip: { flex: 1, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#50607A', borderWidth: 1, borderColor: 'transparent' },
  dateChipActive: { backgroundColor: '#5EA2F5', borderColor: '#5EA2F5' },
  dateChipText: { fontFamily: 'System', fontWeight: '700', fontSize: 13, color: '#98B6D8' },
  dateChipTextActive: { color: '#fff' },
  timeStepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  timeStepper: { alignItems: 'center', gap: 6 },
  stepBtn: { width: 44, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontFamily: 'System', fontWeight: '800', fontSize: 40, color: '#FFFFFF', letterSpacing: -1, lineHeight: 46 },
  timePickerColon: { fontFamily: 'System', fontWeight: '800', fontSize: 40, color: '#FFFFFF', letterSpacing: -1, marginBottom: 4 },

  smartChipScroll: { marginBottom: 10 },
  smartChipContent: { gap: 8, paddingRight: 4 },
  smartChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  smartChipHighlight: { backgroundColor: 'rgba(78,167,185,0.12)', borderColor: 'rgba(78,167,185,0.32)' },
  smartChipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#5EA2F5' },
  smartChipText: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#FFFFFF' },
  smartChipTextHighlight: { color: '#5EA2F5' },

  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  durationBtn: { flex: 1, paddingVertical: 12, borderRadius: 18, alignItems: 'center', gap: 3, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  durationBtnActive: { backgroundColor: '#5EA2F5', borderColor: '#5EA2F5' },
  durationText: { fontFamily: 'System', fontWeight: '800', fontSize: 15, color: '#FFFFFF', letterSpacing: -0.3 },
  durationTextActive: { color: '#fff' },
  durationPrice: { fontFamily: 'System', fontWeight: '500', fontSize: 10, color: '#98B6D8' },
  durationPriceActive: { color: 'rgba(255,255,255,0.65)' },

  sliderCard: { backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 16, marginBottom: 14 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  sliderDuration: { fontFamily: 'System', fontWeight: '800', fontSize: 22, color: '#FFFFFF', letterSpacing: -0.44 },
  sliderPrice: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#98B6D8', letterSpacing: -0.32 },
  slider: { width: '100%', height: 36 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  sliderLabelText: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: '#98B6D8' },

  // Single total card — replaces the old multi-row price breakdown.
  // Breakdown collapsed into a single hint line so the eye lands on `total`.
  totalCard: {
    backgroundColor: '#3A4C68',
    borderRadius: 22, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 3,
  },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  totalLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 12, color: '#98B6D8', letterSpacing: 0.6, textTransform: 'uppercase' },
  totalHint: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 4 },
  totalHintMuted: { color: '#98B6D8' },
  totalHintWaived: { color: '#5EA2F5', fontFamily: 'System', fontWeight: '700' },
  totalValue: { fontFamily: 'System', fontWeight: '800', fontSize: 28, color: '#FFFFFF', letterSpacing: -0.6 },

  feeWaived: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  feeWaivedStrike: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#6E809B', textDecorationLine: 'line-through' },
  feeWaivedNew: { fontFamily: 'System', fontWeight: '700', fontSize: 13, color: '#5EA2F5' },

  // Active state — premium-blue → ice-blue, refined check
  savingsBannerActive: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 18, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 16, elevation: 5,
  },
  savingsActiveIcon: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  savingsBadge: { backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  savingsBadgeText: { fontFamily: 'System', fontWeight: '800', fontSize: 9, color: '#fff', letterSpacing: 1 },
  savingsBannerTextActive: { flex: 1, fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#fff', letterSpacing: -0.13 },
  savingsBannerAmountActive: { fontFamily: 'System', fontWeight: '800', color: '#fff' },

  // Upsell — deep charcoal, premium-blue glow, coral accent
  savingsBannerUpsell: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 18,
    borderRadius: 22, marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.30, shadowRadius: 22, elevation: 7,
  },
  savingsOrbBlue: {
    position: 'absolute',
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(78,167,185,0.22)',
    top: -110, right: -70,
  },
  savingsOrbCoral: {
    position: 'absolute',
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(239,143,122,0.14)',
    bottom: -80, left: -30,
  },
  savingsHairline: {
    position: 'absolute',
    top: 0, left: 16, right: 16, height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  savingsUpsellIcon: {
    width: 46, height: 46, borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 5,
  },
  savingsUpsellBody: { flex: 1 },
  savingsUpsellBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(147,214,227,0.32)',
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 999, marginBottom: 5,
  },
  savingsUpsellBadgeDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: '#7FBBF8',
  },
  savingsUpsellBadgeText: { fontFamily: 'System', fontWeight: '800', fontSize: 9, color: '#7FBBF8', letterSpacing: 1.4 },
  savingsUpsellTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#fff', letterSpacing: -0.14, lineHeight: 19 },
  savingsUpsellAmount: { fontFamily: 'System', fontWeight: '800', color: '#EF8F7A' },
  savingsUpsellSub: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: 'rgba(255,255,255,0.62)', marginTop: 3, letterSpacing: 0.1 },
  savingsUpsellCta: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 3,
  },

  hostCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 14 },
  hostAvatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  hostAvatarText: { fontFamily: 'System', fontWeight: '800', fontSize: 13, color: '#fff', zIndex: 1 },
  hostInfo: { flex: 1 },
  hostLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#98B6D8', letterSpacing: 1, textTransform: 'uppercase' },
  hostName: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14 },
  hostMeta: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: '#98B6D8', marginTop: 2 },
  hostRating: { alignItems: 'flex-end', gap: 2 },
  hostRatingNum: { fontFamily: 'System', fontWeight: '800', fontSize: 18, color: '#FFFFFF', letterSpacing: -0.36 },
  hostRatingSub: { fontFamily: 'System', fontWeight: '500', fontSize: 10, color: '#98B6D8' },

  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  amenityCard: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  amenityIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#50607A', alignItems: 'center', justifyContent: 'center' },
  amenityLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#FFFFFF' },

  extendBanner: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(78,167,185,0.28)', padding: 16, marginBottom: 14 },
  extendBannerTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  extendLiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5EA2F5' },
  extendTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#FFFFFF', flex: 1 },
  extendUntil: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#98B6D8' },
  extendSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginBottom: 12, marginLeft: 16 },
  extendBtns: { flexDirection: 'row', gap: 10 },
  extendBtn: { flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: 'rgba(78,167,185,0.12)', borderWidth: 1, borderColor: 'rgba(78,167,185,0.32)' },
  extendBtnText: { fontFamily: 'System', fontWeight: '800', fontSize: 17, color: '#5EA2F5', letterSpacing: -0.34 },
  extendBtnPrice: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: '#5EA2F5' },

  cta: { height: 56, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, gap: 12, shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.36, shadowRadius: 26, elevation: 8 },
  ctaText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', flex: 1, letterSpacing: -0.16 },
  ctaBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)' },
  ctaBadgeText: { fontFamily: 'System', fontWeight: '800', fontSize: 13, color: '#fff' },

  overlay: { flex: 1, backgroundColor: 'rgba(17,20,22,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#263548', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, alignItems: 'center' },
  sheetHandle: { width: 40, height: 4, borderRadius: 999, backgroundColor: 'rgba(17,20,22,0.18)', marginBottom: 24 },
  confirmIcon: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 22, color: '#FFFFFF', letterSpacing: -0.44, marginBottom: 6 },
  confirmSub: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#98B6D8', marginBottom: 12 },
  refBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(78,167,185,0.12)', borderWidth: 1, borderColor: 'rgba(78,167,185,0.28)', marginBottom: 18 },
  refText: { fontFamily: 'System', fontWeight: '700', fontSize: 12, color: '#5EA2F5', letterSpacing: 0.4 },
  confirmRow: { flexDirection: 'row', width: '100%', backgroundColor: '#3B4C69', borderRadius: 18, padding: 16, marginBottom: 22 },
  confirmBlock: { flex: 1, alignItems: 'center', gap: 4 },
  confirmBlockLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 10, color: '#98B6D8', letterSpacing: 0.8, textTransform: 'uppercase' },
  confirmBlockValue: { fontFamily: 'System', fontWeight: '800', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32 },
  mapsBtn: { width: '100%', height: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(78,167,185,0.12)', borderWidth: 1, borderColor: 'rgba(78,167,185,0.28)', marginBottom: 10 },
  mapsBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#5EA2F5', letterSpacing: -0.15 },
  doneBtn: { width: '100%', height: 52, borderRadius: 999, backgroundColor: '#5EA2F5', alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#fff', letterSpacing: -0.15 },
});

