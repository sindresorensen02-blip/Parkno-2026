import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';

// Skeleton conversation data. Replace with a real messages source later.
// Exported so the Aktivitet "Meldinger" box can preview the same threads.
export const THREADS = [
  { id: '1', name: 'Mathias Berg',    last: 'Takk! Da sees vi i morgen kl 09.',     date: '2t',     unread: true,  online: true,  accent: '#5EA2F5' },
  { id: '2', name: 'Ingrid Solheim',  last: 'Er plassen ledig hele helgen?',         date: '5t',     unread: true,  online: false, accent: '#17E6A1' },
  { id: '3', name: 'Jonas Haugen',    last: 'Du: Ja, det går fint 👍',               date: 'i går',  unread: false, online: true,  accent: '#C58BFF' },
  { id: '4', name: 'Sara Lien',       last: 'Perfekt, jeg reserverer nå.',           date: 'i går',  unread: false, online: false, accent: '#D9A441' },
  { id: '5', name: 'Anders Vik',      last: 'Du: Plassen er i bakgården til venstre.', date: '3. jun', unread: false, online: false, accent: '#5EA2F5' },
  { id: '6', name: 'Emma Dahl',       last: 'Tusen takk for sist!',                  date: '1. jun', unread: false, online: false, accent: '#17E6A1' },
];

export function initials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function MeldingerScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={s.root}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#2B394C' }]} />

      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: back arrow + title */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={8}>
            <Icon name="arrow-left" size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={s.title}>Meldinger</Text>
        </View>

        {/* Conversation rows */}
        {THREADS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={s.row}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Melding', { thread: t })}
          >
            {/* Avatar + online dot */}
            <View style={s.avatarWrap}>
              <View style={[s.avatar, { backgroundColor: hexA(t.accent, 0.22), borderColor: hexA(t.accent, 0.4) }]}>
                <Text style={[s.avatarText, { color: t.accent }]}>{initials(t.name)}</Text>
              </View>
              {t.online && <View style={s.onlineDot} />}
            </View>

            {/* Name + last message */}
            <View style={s.rowMid}>
              <Text style={[s.name, t.unread && s.nameUnread]} numberOfLines={1}>{t.name}</Text>
              <Text style={[s.preview, t.unread && s.previewUnread]} numberOfLines={1}>{t.last}</Text>
            </View>

            {/* Date + unread dot */}
            <View style={s.rowEnd}>
              <Text style={[s.date, t.unread && s.dateUnread]}>{t.date}</Text>
              {t.unread && <View style={s.unreadDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// rgba() from #RRGGBB hex + alpha.
function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  title: { fontFamily: 'System', fontWeight: '800', fontSize: 23, color: '#FFFFFF', letterSpacing: -0.5 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },

  avatarWrap: { width: 52, height: 52 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'System', fontWeight: '700', fontSize: 16 },
  onlineDot: { position: 'absolute', right: 1, bottom: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: '#17E6A1', borderWidth: 2.5, borderColor: '#2B394C' },

  rowMid: { flex: 1, gap: 3 },
  name: { fontFamily: 'System', fontWeight: '600', fontSize: 16, color: '#E6EEF8', letterSpacing: -0.2 },
  nameUnread: { fontWeight: '800', color: '#FFFFFF' },
  preview: { fontFamily: 'System', fontWeight: '400', fontSize: 13.5, color: '#6E809B' },
  previewUnread: { fontWeight: '600', color: '#98B6D8' },

  rowEnd: { alignItems: 'flex-end', gap: 7, paddingLeft: 4 },
  date: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#6E809B' },
  dateUnread: { color: '#5EA2F5', fontWeight: '700' },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#5EA2F5' },
});
