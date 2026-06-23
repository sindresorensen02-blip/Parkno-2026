import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const CHANNELS = [
  { id: 'chat',  icon: 'bell',   label: 'Live chat',       hint: 'Typisk svar: 2 min',  available: true },
  { id: 'email', icon: 'layers', label: 'E-post',           hint: 'Svar innen 24 timer', available: true },
  { id: 'phone', icon: 'mic',    label: 'Ring oss',         hint: 'Man–fre 09:00–17:00', available: false },
];

const TOPICS = ['Reservasjon', 'Betaling', 'Teknisk problem', 'Utleier', 'Annet'];

export default function KontaktOssScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('chat');

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    await supabase.from('support_messages').insert({
      user_id: user?.id ?? null,
      channel: selectedChannel,
      topic: topic || null,
      message: message.trim(),
    });
    setSending(false);
    setSent(true);
    setTimeout(() => { setSent(false); setMessage(''); setTopic(''); }, 3000);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#F7F7F2', '#F7F7F2']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#111416" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Kontakt oss</Text>
          <View style={s.backBtn} />
        </View>

        {/* Contact channels */}
        <Text style={s.sectionLabel}>Velg kontaktmetode</Text>
        <View style={s.channels}>
          {CHANNELS.map((ch) => (
            <TouchableOpacity key={ch.id} onPress={() => ch.available && setSelectedChannel(ch.id)} style={[s.channelCard, selectedChannel === ch.id && s.channelCardActive, !ch.available && s.channelCardDisabled]} activeOpacity={ch.available ? 0.8 : 1}>
              {selectedChannel === ch.id && (
                <LinearGradient colors={['#2F3437', '#111416']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]} />
              )}
              <View style={[s.channelIcon, selectedChannel === ch.id && s.channelIconActive]}>
                <Icon name={ch.icon} size={16} color={selectedChannel === ch.id ? '#fff' : '#111416'} strokeWidth={1.8} />
              </View>
              <Text style={[s.channelLabel, selectedChannel === ch.id && s.channelLabelActive]}>{ch.label}</Text>
              <Text style={[s.channelHint, selectedChannel === ch.id && s.channelHintActive]}>{ch.hint}</Text>
              {!ch.available && <Text style={s.unavailableText}>Stengt</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Message form */}
        <Text style={s.sectionLabel}>Skriv til oss</Text>
        <View style={s.formCard}>
          {/* Topic */}
          <Text style={s.fieldLabel}>Tema</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.topicsRow} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
            {TOPICS.map(t => (
              <TouchableOpacity key={t} onPress={() => setTopic(t)} style={[s.topicBtn, topic === t && s.topicBtnActive]}>
                <Text style={[s.topicText, topic === t && s.topicTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={s.divider} />

          {/* Message */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>Melding</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Beskriv problemet ditt..."
            placeholderTextColor="#C4CACC"
            multiline
            numberOfLines={5}
            style={s.textArea}
            textAlignVertical="top"
          />
        </View>

        {sent ? (
          <View style={s.sentCard}>
            <Icon name="check" size={18} color="#1F6B47" strokeWidth={2.5} />
            <Text style={s.sentText}>Melding sendt! Vi svarer deg snart.</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={send} style={s.sendBtn} activeOpacity={0.88}>
            <LinearGradient colors={['#10B981', '#14B8A6', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]} />
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={s.sendBtnText}>Send melding</Text>}
          </TouchableOpacity>
        )}

        <View style={s.responseNote}>
          <Icon name="clock" size={12} color="#7B8589" strokeWidth={1.8} />
          <Text style={s.responseText}>Støttetid: mandag–fredag 09:00–17:00. Vi er stengt i helger og helligdager.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#111416', letterSpacing: -0.32 },
  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#7B8589', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  channels: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  channelCard: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', gap: 6, overflow: 'hidden' },
  channelCardActive: { borderColor: 'transparent' },
  channelCardDisabled: { opacity: 0.5 },
  channelIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(17,20,22,0.06)', alignItems: 'center', justifyContent: 'center' },
  channelIconActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  channelLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 12, color: '#111416', textAlign: 'center' },
  channelLabelActive: { color: '#fff' },
  channelHint: { fontFamily: 'System', fontWeight: '400', fontSize: 10, color: '#7B8589', textAlign: 'center' },
  channelHintActive: { color: 'rgba(255,255,255,0.6)' },
  unavailableText: { fontFamily: 'System', fontWeight: '700', fontSize: 9, color: '#DC2626', letterSpacing: 0.5, textTransform: 'uppercase' },
  formCard: { backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 22, padding: 16, marginBottom: 16 },
  fieldLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#7B8589', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  topicsRow: { marginBottom: 4 },
  topicBtn: { height: 32, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(17,20,22,0.05)', borderWidth: 1, borderColor: 'rgba(17,20,22,0.08)', alignItems: 'center', justifyContent: 'center' },
  topicBtnActive: { backgroundColor: '#111416', borderColor: '#111416' },
  topicText: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#111416' },
  topicTextActive: { color: '#fff' },
  divider: { height: 1, backgroundColor: 'rgba(17,20,22,0.06)', marginVertical: 4 },
  textArea: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: '#111416', minHeight: 110, paddingTop: 4, lineHeight: 21 },
  sentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: 'rgba(63,166,107,0.1)', borderWidth: 1, borderColor: 'rgba(63,166,107,0.25)', borderRadius: 16, marginBottom: 16 },
  sentText: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#1F6B47', flex: 1 },
  sendBtn: { height: 56, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 6 },
  sendBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.16 },
  responseNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 },
  responseText: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#7B8589', flex: 1, lineHeight: 17 },
});
