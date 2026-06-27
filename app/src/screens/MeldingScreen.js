import React from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';

// Skeleton message thread. `me: true` = sent by the current user.
const MESSAGES = [
  { id: 'm1', me: false, text: 'Hei! Er parkeringsplassen ledig i morgen?',        time: '08:42' },
  { id: 'm2', me: true,  text: 'Hei! Ja, den er ledig hele dagen.',                 time: '08:45' },
  { id: 'm3', me: false, text: 'Supert. Hvor finner jeg den?',                      time: '08:46' },
  { id: 'm4', me: true,  text: 'Plassen er i bakgården til venstre, nummer 12.',    time: '08:47' },
  { id: 'm5', me: false, text: 'Takk! Da sees vi i morgen kl 09.',                  time: '08:49' },
];

function initials(name) {
  return (name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function MeldingScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const thread = route?.params?.thread ?? { name: 'Melding', accent: '#5EA2F5', online: false };

  return (
    <View style={s.root}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#2B394C' }]} />

      {/* Header: back + avatar + name */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={8}>
          <Icon name="arrow-left" size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <View style={[s.avatar, { backgroundColor: hexA(thread.accent, 0.22), borderColor: hexA(thread.accent, 0.4) }]}>
          <Text style={[s.avatarText, { color: thread.accent }]}>{initials(thread.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerName} numberOfLines={1}>{thread.name}</Text>
          <Text style={s.headerStatus}>{thread.online ? 'Aktiv nå' : 'Aktiv nylig'}</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        contentContainerStyle={[s.messages, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {MESSAGES.map((m) => (
          <View key={m.id} style={[s.bubbleRow, m.me ? s.bubbleRowMe : s.bubbleRowThem]}>
            <View style={[s.bubble, m.me ? s.bubbleMe : s.bubbleThem]}>
              <Text style={[s.bubbleText, m.me && s.bubbleTextMe]}>{m.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Composer (skeleton — non-functional) */}
      <View style={[s.composer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            placeholder="Skriv en melding…"
            placeholderTextColor="#6E809B"
            editable={false}
          />
        </View>
        <View style={s.sendBtn}>
          <Icon name="arrow-right" size={18} color="#FFFFFF" strokeWidth={2.4} />
        </View>
      </View>
    </View>
  );
}

function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(152,182,216,0.12)' },
  backBtn: { width: 36, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'System', fontWeight: '700', fontSize: 13 },
  headerName: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.3 },
  headerStatus: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 1 },

  messages: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  bubbleThem: { backgroundColor: '#3A4C68', borderTopLeftRadius: 6 },
  bubbleMe: { backgroundColor: '#5EA2F5', borderTopRightRadius: 6 },
  bubbleText: { fontFamily: 'System', fontWeight: '500', fontSize: 15, color: '#E6EEF8', lineHeight: 20 },
  bubbleTextMe: { color: '#FFFFFF' },

  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(152,182,216,0.12)' },
  inputWrap: { flex: 1, backgroundColor: '#3A4C68', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, height: 44, justifyContent: 'center' },
  input: { fontFamily: 'System', fontSize: 15, color: '#FFFFFF', padding: 0 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#5EA2F5', alignItems: 'center', justifyContent: 'center' },
});
