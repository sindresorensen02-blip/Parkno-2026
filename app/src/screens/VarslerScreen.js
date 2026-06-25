import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const GROUPS = [
  {
    title: 'Bookingvarsler',
    rows: [
      { id: 'confirm',  label: 'Bookingbekreftelse',       hint: 'Når reservasjon er godkjent',  default: true  },
      { id: 'reminder', label: 'Påminnelse 30 min før',    hint: 'Før parkeringen starter',      default: true  },
      { id: 'end',      label: 'Parkering avsluttes',      hint: '10 minutter før tid utløper',  default: true  },
    ],
  },
  {
    title: 'Kommunikasjon',
    rows: [
      { id: 'message',  label: 'Meldinger fra utleier',    hint: 'Direkte meldinger',            default: true  },
      { id: 'review',   label: 'Be om vurdering',          hint: 'Etter fullført parkering',     default: false },
    ],
  },
  {
    title: 'Markedsføring',
    rows: [
      { id: 'offers',   label: 'Tilbud og rabatter',       hint: 'Spesialtilbud i ditt område',  default: false },
      { id: 'news',     label: 'Nyheter og oppdateringer', hint: 'Parkno-nyheter',             default: false },
      { id: 'email',    label: 'E-postvarsler',            hint: 'Ukentlig oppsummering',        default: true  },
    ],
  },
];

const DEFAULTS = {};
GROUPS.forEach(g => g.rows.forEach(r => { DEFAULTS[r.id] = r.default; }));

async function registerPushToken(userId) {
  try {
    const Notifications = require('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (token) {
      await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
  } catch {
    // expo-notifications not installed yet — silently skip
  }
}

export default function VarslerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [toggles, setToggles] = useState(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const saveTimer = useRef(null);

  // Load saved prefs from Supabase
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from('profiles')
      .select('notification_prefs')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.notification_prefs && Object.keys(data.notification_prefs).length > 0) {
          setToggles({ ...DEFAULTS, ...data.notification_prefs });
        }
        setLoading(false);
      });

    registerPushToken(user.id);
  }, [user]);

  // Debounced save — 800 ms after last toggle
  const persistPrefs = (next) => {
    if (!user) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase
        .from('profiles')
        .update({ notification_prefs: next })
        .eq('id', user.id);
    }, 800);
  };

  const toggle = (id) => {
    setToggles(prev => {
      const next = { ...prev, [id]: !prev[id] };
      persistPrefs(next);
      return next;
    });
  };

  const allOn = Object.values(toggles).every(Boolean);
  const toggleAll = () => {
    const next = {};
    Object.keys(toggles).forEach(k => { next[k] = !allOn; });
    setToggles(next);
    persistPrefs(next);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Varsler</Text>
          <View style={s.backBtn} />
        </View>

        {loading ? (
          <ActivityIndicator color="#4E96F0" style={{ marginTop: 60 }} />
        ) : (
          <>
            <View style={s.masterCard}>
              <View style={s.masterLeft}>
                <Text style={s.masterLabel}>Alle varsler</Text>
                <Text style={s.masterHint}>{allOn ? 'Alle varsler er på' : 'Noen varsler er av'}</Text>
              </View>
              <Switch
                value={allOn}
                onValueChange={toggleAll}
                trackColor={{ false: '#E5E7EB', true: '#4E96F0' }}
                thumbColor="#fff"
              />
            </View>

            {GROUPS.map((group) => (
              <View key={group.title} style={s.section}>
                <Text style={s.sectionLabel}>{group.title}</Text>
                <View style={s.card}>
                  {group.rows.map((row, i) => (
                    <View key={row.id}>
                      {i > 0 && <View style={s.divider} />}
                      <View style={s.row}>
                        <View style={s.rowText}>
                          <Text style={s.rowLabel}>{row.label}</Text>
                          <Text style={s.rowHint}>{row.hint}</Text>
                        </View>
                        <Switch
                          value={toggles[row.id]}
                          onValueChange={() => toggle(row.id)}
                          trackColor={{ false: '#E5E7EB', true: '#4E96F0' }}
                          thumbColor="#fff"
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </>
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
  masterCard: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22, marginBottom: 24 },
  masterLeft: { flex: 1 },
  masterLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#FFFFFF', letterSpacing: -0.15 },
  masterHint: { fontFamily: 'System', fontWeight: '400', fontSize: 12, color: '#98B6D8', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginLeft: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  rowText: { flex: 1 },
  rowLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14 },
  rowHint: { fontFamily: 'System', fontWeight: '400', fontSize: 12, color: '#98B6D8', marginTop: 1 },
});
