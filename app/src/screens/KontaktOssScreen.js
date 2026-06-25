import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';

const SUPPORT_EMAIL = 'kontakt@parkno.no';

export default function KontaktOssScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const openEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Kontakt oss</Text>
          <View style={s.backBtn} />
        </View>

        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Icon name="layers" size={26} color="#FFFFFF" strokeWidth={1.6} />
          </View>
          <Text style={s.heroTitle}>Vi er her for å hjelpe</Text>
          <Text style={s.heroSubtitle}>Send oss en e-post, så svarer vi deg så raskt vi kan – vanligvis innen 24 timer.</Text>
        </View>

        <TouchableOpacity style={s.emailCard} onPress={openEmail} activeOpacity={0.85}>
          <View style={s.emailIcon}>
            <Icon name="layers" size={18} color="#fff" strokeWidth={1.8} />
          </View>
          <View style={s.emailTextWrap}>
            <Text style={s.emailLabel}>E-POST</Text>
            <Text style={s.emailValue}>{SUPPORT_EMAIL}</Text>
          </View>
          <Icon name="arrow-right" size={18} color="#98B6D8" strokeWidth={1.8} />
        </TouchableOpacity>

        <View style={s.responseNote}>
          <Icon name="clock" size={12} color="#98B6D8" strokeWidth={1.8} />
          <Text style={s.responseText}>Støttetid: mandag–fredag 09:00–17:00. Vi er stengt i helger og helligdager.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32 },
  hero: { alignItems: 'center', marginBottom: 28, paddingHorizontal: 12 },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#50607A', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  heroTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 22, color: '#FFFFFF', letterSpacing: -0.4, marginBottom: 8, textAlign: 'center' },
  heroSubtitle: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: '#98B6D8', textAlign: 'center', lineHeight: 21 },
  emailCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 22, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 20 },
  emailIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#5EA2F5', alignItems: 'center', justifyContent: 'center' },
  emailTextWrap: { flex: 1 },
  emailLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#98B6D8', letterSpacing: 1, marginBottom: 4 },
  emailValue: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#FFFFFF', letterSpacing: -0.2 },
  responseNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 },
  responseText: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', flex: 1, lineHeight: 17 },
});
