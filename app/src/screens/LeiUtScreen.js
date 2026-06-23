import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import Icon from '../components/Icon';
import { useSpots } from '../context/SpotsContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const TYPES = [
  { id: 'innkjorsel', label: 'Innkjørsel', icon: 'home' },
  { id: 'garasje',    label: 'Garasje',    icon: 'shield' },
  { id: 'utendors',   label: 'Utendørs',   icon: 'map-pin' },
  { id: 'innendors',  label: 'Innendørs',  icon: 'layers' },
];

const DAYS = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'];

const AMENITIES = [
  { id: 'covered',  label: 'Tak over' },
  { id: 'ev11',     label: 'Elbil 11kW' },
  { id: 'ev22',     label: 'Elbil 22kW' },
  { id: 'lit',      label: 'Belyst' },
  { id: 'camera',   label: 'Kamera' },
  { id: 'handicap', label: 'Handikap' },
  { id: 'wide',     label: 'Bred plass' },
];

const SUGGESTED = 45;

export default function LeiUtScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const isFirst = route?.params?.isFirst ?? false;

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [type, setType] = useState('');
  const [days, setDays] = useState(['Ma','Ti','On','To','Fr']);
  const [alwaysAvail, setAlwaysAvail] = useState(false);
  const [fromTime, setFromTime] = useState('08:00');
  const [toTime, setToTime] = useState('20:00');
  const [amenities, setAmenities] = useState([]);
  const [price, setPrice] = useState(String(SUGGESTED));
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(false);
  const [saving, setSaving]       = useState(false);
  const { fetchSpots } = useSpots();
  const { user } = useAuth();

  const toggleDay = (d) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleAmenity = (id) => setAmenities(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const canNext = () => {
    if (step === 1) return address.trim().length > 3 && type !== '';
    if (step === 2) return alwaysAvail || days.length > 0;
    if (step === 3) return true;
    if (step === 4) return Number(price) >= 20;
    return true;
  };

  const publish = async () => {
    if (saving) return;
    if (!user) {
      Alert.alert('Logg inn på nytt', 'Du må være innlogget for å publisere en plass.');
      return;
    }
    setSaving(true);
    try {
      const results = await Location.geocodeAsync(`${address.trim()}, Bergen, Norge`);
      const lat = results[0]?.latitude ?? null;
      const lng = results[0]?.longitude ?? null;
      const typeLabel = TYPES.find(t => t.id === type)?.label ?? type;

      const amenityLabels = amenities
        .map(id => AMENITIES.find(a => a.id === id)?.label)
        .filter(Boolean);

      const { error } = await supabase.from('spots').insert({
        owner_id:          user.id,
        title:             `${typeLabel} · ${address.trim()}`,
        address:           address.trim(),
        spot_type:         type,
        price_per_hour:    Number(price),
        amenities:         amenityLabels,
        active:            true,
        moderation_status: 'pending',
        available_days:    alwaysAvail ? DAYS : days,
        available_from:    alwaysAvail ? '00:00' : fromTime,
        available_to:      alwaysAvail ? '23:59' : toTime,
        lat,
        lng,
        description:       description.trim() || null,
      });

      if (error) throw error;

      await fetchSpots();
      setPublished(true);
    } catch (error) {
      setSaving(false);
      Alert.alert('Noe gikk galt', 'Kunne ikke publisere plassen. Sjekk adressen og prøv igjen.');
    }
  };

  if (published) {
    return (
      <View style={s.root}>
        <LinearGradient colors={['#F7F7F2', '#F7F7F2']} style={StyleSheet.absoluteFillObject} />
        <View style={s.successWrap}>
          <View style={s.successIconWrap}>
            <LinearGradient colors={['#10B981', '#14B8A6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 44 }]} />
            <Icon name="check" size={36} color="#fff" strokeWidth={2.5} />
          </View>
          <Text style={s.successTitle}>Plassen er sendt inn!</Text>
          <Text style={s.successSub}>{address} er under godkjenning. Vi varsler deg når den er live – vanligvis innen 24 timer.</Text>
          <View style={s.successCard}>
            <Row label="Type" value={TYPES.find(t => t.id === type)?.label ?? ''} />
            <View style={s.rowDivider} />
            <Row label="Tilgjengelighet" value={alwaysAvail ? 'Alltid ledig' : `${days.join(', ')} · ${fromTime}–${toTime}`} />
            <View style={s.rowDivider} />
            <Row label="Pris" value={`${price} kr/t`} />
          </View>
          <TouchableOpacity onPress={() => navigation.popToTop()} style={s.doneBtn}>
            <LinearGradient colors={['#10B981', '#14B8A6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]} />
            <Text style={s.doneBtnText}>Tilbake til oversikt</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#F7F7F2', '#F7F7F2']} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#111416" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{isFirst ? 'Lei ut en plass' : 'Lei ut en plass til'}</Text>
          <View style={s.backBtn} />
        </View>

        {/* Progress */}
        <View style={s.progressRow}>
          {[1,2,3,4].map(i => (
            <View key={i} style={[s.progressSegment, i <= step && s.progressSegmentActive]} />
          ))}
        </View>
        <Text style={s.stepLabel}>Steg {step} av 4</Text>

        {/* ── STEP 1: Lokasjon & type ── */}
        {step === 1 && (
          <>
            <SectionTitle>Hvor er plassen?</SectionTitle>
            <View style={s.card}>
              <View style={s.fieldWrap}>
                <View style={s.fieldIcon}><Icon name="map-pin" size={14} color="#7B8589" strokeWidth={1.8} /></View>
                <View style={s.fieldBody}>
                  <Text style={s.fieldLabel}>Adresse</Text>
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Gatenavn og nummer"
                    placeholderTextColor="#C4CACC"
                    style={s.fieldInput}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            <SectionTitle>Hva slags plass er det?</SectionTitle>
            <View style={s.typeGrid}>
              {TYPES.map(t => (
                <TouchableOpacity key={t.id} onPress={() => setType(t.id)} style={[s.typeCard, type === t.id && s.typeCardActive]} activeOpacity={0.8}>
                  {type === t.id && (
                    <LinearGradient colors={['#2F3437', '#111416']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]} />
                  )}
                  <View style={[s.typeIcon, type === t.id && s.typeIconActive]}>
                    <Icon name={t.icon} size={18} color={type === t.id ? '#fff' : '#111416'} strokeWidth={1.8} />
                  </View>
                  <Text style={[s.typeLabel, type === t.id && s.typeLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── STEP 2: Tilgjengelighet ── */}
        {step === 2 && (
          <>
            <SectionTitle>Tilgjengelighet</SectionTitle>
            <View style={s.card}>
              <View style={s.switchRow}>
                <View>
                  <Text style={s.switchLabel}>Alltid tilgjengelig</Text>
                  <Text style={s.switchHint}>24/7, alle dager</Text>
                </View>
                <Switch value={alwaysAvail} onValueChange={setAlwaysAvail} trackColor={{ false: '#E5E7EB', true: '#111416' }} thumbColor="#fff" />
              </View>
            </View>

            {!alwaysAvail && (
              <>
                <SectionTitle>Dager</SectionTitle>
                <View style={s.daysRow}>
                  {DAYS.map(d => (
                    <TouchableOpacity key={d} onPress={() => toggleDay(d)} style={[s.dayBtn, days.includes(d) && s.dayBtnActive]}>
                      <Text style={[s.dayText, days.includes(d) && s.dayTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <SectionTitle>Tidsrom</SectionTitle>
                <View style={s.timeCard}>
                  <View style={s.timeBlock}>
                    <Text style={s.timeLabel}>Fra</Text>
                    <TextInput value={fromTime} onChangeText={setFromTime} style={s.timeInput} keyboardType="numbers-and-punctuation" />
                  </View>
                  <View style={s.timeDash}><Text style={s.timeDashText}>–</Text></View>
                  <View style={s.timeBlock}>
                    <Text style={s.timeLabel}>Til</Text>
                    <TextInput value={toTime} onChangeText={setToTime} style={s.timeInput} keyboardType="numbers-and-punctuation" />
                  </View>
                </View>
              </>
            )}
          </>
        )}

        {/* ── STEP 3: Fasiliteter ── */}
        {step === 3 && (
          <>
            <SectionTitle>Fasiliteter (valgfritt)</SectionTitle>
            <Text style={s.stepHint}>Kryss av alt som gjelder for din plass.</Text>
            <View style={s.amenityGrid}>
              {AMENITIES.map(a => (
                <TouchableOpacity key={a.id} onPress={() => toggleAmenity(a.id)} style={[s.amenityBtn, amenities.includes(a.id) && s.amenityBtnActive]} activeOpacity={0.8}>
                  {amenities.includes(a.id) && <Icon name="check" size={12} color="#fff" strokeWidth={2.5} />}
                  <Text style={[s.amenityText, amenities.includes(a.id) && s.amenityTextActive]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionTitle>Beskrivelse (valgfritt)</SectionTitle>
            <View style={s.descCard}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Fortell leietakerne noe nyttig om plassen, innkjøring, porter osv."
                placeholderTextColor="#C4CACC"
                multiline
                numberOfLines={4}
                style={s.descInput}
                textAlignVertical="top"
              />
            </View>
          </>
        )}

        {/* ── STEP 4: Pris ── */}
        {step === 4 && (
          <>
            <SectionTitle>Sett timespris</SectionTitle>
            <Text style={s.stepHint}>Du kan endre prisen når som helst.</Text>

            <View style={s.priceCard}>
              <LinearGradient colors={['#2F3437', '#111416']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]} />
              <View style={s.priceBlob} />
              <View style={s.priceInner}>
                <Text style={s.priceCurrency}>kr</Text>
                <TextInput
                  value={price}
                  onChangeText={v => setPrice(v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  style={s.priceInput}
                  maxLength={4}
                />
                <Text style={s.priceUnit}>/t</Text>
              </View>
              <Text style={s.priceSuggested}>Anbefalt for {address.split(' ')[0] || 'ditt område'}: {SUGGESTED} kr/t</Text>
            </View>

            <View style={s.earningsCard}>
              <Text style={s.earningsTitle}>Estimert inntekt</Text>
              <View style={s.earningsRow}>
                <EarningBlock label="Per dag" value={`${Math.round(Number(price || 0) * 8)} kr`} />
                <EarningBlock label="Per uke" value={`${Math.round(Number(price || 0) * 8 * 5)} kr`} />
                <EarningBlock label="Per måned" value={`${Math.round(Number(price || 0) * 8 * 22)} kr`} />
              </View>
              <Text style={s.earningsNote}>Basert på 8 timer/dag, 5 dager/uke · Parkno tar 18%</Text>
            </View>
          </>
        )}

        {/* Navigation buttons */}
        <View style={s.navRow}>
          {step < 4 ? (
            <TouchableOpacity onPress={() => canNext() && setStep(s => s + 1)} style={[s.nextBtn, !canNext() && s.nextBtnDisabled]} activeOpacity={0.88}>
              <LinearGradient colors={canNext() ? ['#10B981', '#14B8A6', '#2563EB'] : ['#E5E7EB', '#E5E7EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]} />
              <Text style={[s.nextBtnText, !canNext() && s.nextBtnTextDisabled]}>Neste</Text>
              <Icon name="arrow-right" size={16} color={canNext() ? '#fff' : '#9CA3AF'} strokeWidth={2.5} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={publish} style={s.nextBtn} activeOpacity={0.88} disabled={saving}>
              <LinearGradient colors={['#10B981', '#14B8A6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]} />
              {saving
                ? <ActivityIndicator color="#fff" />
                : <><Text style={s.nextBtnText}>Publiser plass</Text><Icon name="check" size={16} color="#fff" strokeWidth={2.5} /></>
              }
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ children }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

function Row({ label, value }) {
  return (
    <View style={s.successRow}>
      <Text style={s.successRowLabel}>{label}</Text>
      <Text style={s.successRowValue}>{value}</Text>
    </View>
  );
}

function EarningBlock({ label, value }) {
  return (
    <View style={s.earningBlock}>
      <Text style={s.earningValue}>{value}</Text>
      <Text style={s.earningLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#111416', letterSpacing: -0.32 },

  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  progressSegment: { flex: 1, height: 3, borderRadius: 999, backgroundColor: 'rgba(17,20,22,0.1)' },
  progressSegmentActive: { backgroundColor: '#111416' },
  stepLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: '#7B8589', letterSpacing: 0.5, marginBottom: 24 },

  sectionTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#7B8589', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginLeft: 2 },
  stepHint: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#7B8589', marginBottom: 14, marginTop: -4 },

  card: { backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 22, overflow: 'hidden', marginBottom: 22 },
  fieldWrap: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  fieldIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(17,20,22,0.05)', alignItems: 'center', justifyContent: 'center' },
  fieldBody: { flex: 1 },
  fieldLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 10, color: '#7B8589', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  fieldInput: { fontFamily: 'System', fontWeight: '600', fontSize: 15, color: '#111416', letterSpacing: -0.15, padding: 0 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  typeCard: { width: '47%', padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'flex-start', gap: 10, overflow: 'hidden' },
  typeCardActive: { borderColor: 'transparent' },
  typeIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(17,20,22,0.06)', alignItems: 'center', justifyContent: 'center' },
  typeIconActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  typeLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#111416', letterSpacing: -0.14 },
  typeLabelActive: { color: '#fff' },

  switchRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  switchLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 15, color: '#111416', letterSpacing: -0.15 },
  switchHint: { fontFamily: 'System', fontWeight: '400', fontSize: 12, color: '#7B8589', marginTop: 2 },

  daysRow: { flexDirection: 'row', gap: 7, marginBottom: 22 },
  dayBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  dayBtnActive: { backgroundColor: '#111416', borderColor: '#111416' },
  dayText: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#7B8589' },
  dayTextActive: { color: '#fff' },

  timeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 18, padding: 16, marginBottom: 22 },
  timeBlock: { flex: 1, alignItems: 'center' },
  timeLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 10, color: '#7B8589', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  timeInput: { fontFamily: 'System', fontWeight: '800', fontSize: 22, color: '#111416', letterSpacing: -0.44, textAlign: 'center', padding: 0 },
  timeDash: { paddingHorizontal: 12 },
  timeDashText: { fontFamily: 'System', fontWeight: '800', fontSize: 22, color: 'rgba(17,20,22,0.2)' },

  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  amenityBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  amenityBtnActive: { backgroundColor: '#111416', borderColor: '#111416' },
  amenityText: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#111416' },
  amenityTextActive: { color: '#fff' },

  descCard: { backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 18, padding: 14, marginBottom: 22 },
  descInput: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: '#111416', minHeight: 100, lineHeight: 21 },

  priceCard: { borderRadius: 22, overflow: 'hidden', padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#111416', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.18, shadowRadius: 28, elevation: 8 },
  priceBlob: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(95,175,211,0.28)', top: -30, right: -30 },
  priceInner: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  priceCurrency: { fontFamily: 'System', fontWeight: '700', fontSize: 22, color: 'rgba(255,255,255,0.6)' },
  priceInput: { fontFamily: 'System', fontWeight: '800', fontSize: 64, color: '#fff', letterSpacing: -2, minWidth: 80, textAlign: 'center', padding: 0 },
  priceUnit: { fontFamily: 'System', fontWeight: '700', fontSize: 22, color: 'rgba(255,255,255,0.6)' },
  priceSuggested: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 12 },

  earningsCard: { backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 22, padding: 18, marginBottom: 22 },
  earningsTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#7B8589', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  earningBlock: { alignItems: 'center', gap: 4 },
  earningValue: { fontFamily: 'System', fontWeight: '800', fontSize: 18, color: '#111416', letterSpacing: -0.36 },
  earningLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: '#7B8589' },
  earningsNote: { fontFamily: 'System', fontWeight: '400', fontSize: 11, color: '#C4CACC', textAlign: 'center' },

  navRow: { marginTop: 4 },
  nextBtn: { height: 56, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 6 },
  nextBtnDisabled: { shadowOpacity: 0 },
  nextBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.16 },
  nextBtnTextDisabled: { color: '#9CA3AF' },

  // Success screen
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  successIconWrap: { width: 88, height: 88, borderRadius: 44, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 24, color: '#111416', letterSpacing: -0.48, marginBottom: 8, textAlign: 'center' },
  successSub: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: '#7B8589', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  successCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 22, padding: 4, marginBottom: 28 },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  successRowLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#7B8589' },
  successRowValue: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#111416', flex: 1, textAlign: 'right' },
  rowDivider: { height: 1, backgroundColor: 'rgba(17,20,22,0.05)', marginHorizontal: 14 },
  doneBtn: { height: 56, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', width: '100%', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 6 },
  doneBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.16 },
});
