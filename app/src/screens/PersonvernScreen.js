import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const PRIVACY_POLICY = `Sist oppdatert: 12. mai 2026

Parkno AS («vi», «oss») er behandlingsansvarlig for personopplysningene vi samler inn når du bruker Parkno-appen.

1. Hvilke opplysninger samler vi inn?
• Navn, e-postadresse og telefonnummer (ved registrering)
• Posisjonsdata (for å vise ledige plasser i nærheten)
• Reservasjons- og betalingshistorikk
• Tekniske loggdata og enhetsinfo

2. Hvorfor samler vi inn data?
• For å levere parkeringstjenesten og administrere reservasjoner (avtalegrunnlag, GDPR art. 6 nr. 1 b)
• For å forbedre appen og analysere bruksmønstre (berettiget interesse, GDPR art. 6 nr. 1 f)
• For å sende markedsføring – kun med ditt samtykke (GDPR art. 6 nr. 1 a)

3. Deling med tredjeparter
Vi deler aldri dine data med annonsører. Vi benytter:
• Supabase (databaser og autentisering, EU-servere)
• Resend (e-postutsendelse)
• Expo / Apple Push Notification Service (varsler)

4. Lagringstid
Reservasjonsdata beholdes i 5 år av regnskaps- og skattemessige årsaker. Øvrige data slettes innen 30 dager etter at kontoen avsluttes.

5. Dine rettigheter
Du har rett til innsyn, retting, sletting, dataportabilitet og å protestere mot behandlingen. Send forespørsel til personvern@minplass.eu. Du kan også klage til Datatilsynet (datatilsynet.no).

6. Kontakt
Parkno AS · Bryggen 4, 5003 Bergen
E-post: personvern@minplass.eu`;

export default function PersonvernScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [posisjon, setPosisjon] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [markedsforing, setMarkedsforing] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [policyModal, setPolicyModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const requestDataExport = () => {
    Alert.alert(
      'Last ned mine data',
      `Vi sender en kopi av alle dine data til ${user?.email ?? 'e-postadressen din'} innen 24 timer. Kontakt personvern@minplass.eu for spørsmål.`,
      [{ text: 'OK' }],
    );
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      await supabase.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', user.id);
      await signOut();
      Alert.alert(
        'Konto slettet',
        'Kontoen din er markert for sletting. Alle data fjernes innen 30 dager.',
        [{ text: 'OK' }],
      );
    } catch {
      Alert.alert('Feil', 'Noe gikk galt. Kontakt personvern@minplass.eu.');
    }
    setDeleting(false);
    setDeleteModal(false);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Personvern</Text>
          <View style={s.backBtn} />
        </View>

        <Text style={s.sectionLabel}>Datadeling</Text>
        <View style={s.card}>
          <ToggleRow label="Posisjonsdata" hint="Brukes for å finne plasser i nærheten" value={posisjon} onToggle={() => setPosisjon(v => !v)} />
          <View style={s.divider} />
          <ToggleRow label="Bruksanalyse" hint="Hjelper oss å forbedre appen" value={analytics} onToggle={() => setAnalytics(v => !v)} />
          <View style={s.divider} />
          <ToggleRow label="Markedsføringscookies" hint="Tilpassede annonser og tilbud" value={markedsforing} onToggle={() => setMarkedsforing(v => !v)} />
        </View>

        <Text style={s.sectionLabel}>Dine data</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={() => setPolicyModal(true)}>
            <View style={s.rowIcon}><Icon name="clock" size={14} color="#FFFFFF" strokeWidth={1.8} /></View>
            <View style={s.rowText}>
              <Text style={s.rowLabel}>Behandlingsgrunnlag</Text>
              <Text style={s.rowHint}>Les vår personvernerklæring</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#6E809B" strokeWidth={2} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.row} onPress={requestDataExport}>
            <View style={s.rowIcon}><Icon name="layers" size={14} color="#FFFFFF" strokeWidth={1.8} /></View>
            <View style={s.rowText}>
              <Text style={s.rowLabel}>Last ned mine data</Text>
              <Text style={s.rowHint}>Eksporter alt vi har lagret om deg</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#6E809B" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Text style={s.sectionLabel}>Konto</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={() => setDeleteModal(true)}>
            <View style={[s.rowIcon, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
              <Icon name="x" size={14} color="#DC2626" strokeWidth={2} />
            </View>
            <View style={s.rowText}>
              <Text style={[s.rowLabel, { color: '#DC2626' }]}>Slett konto</Text>
              <Text style={s.rowHint}>Permanent sletting av alle data</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#6E809B" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={s.gdprNote}>
          <Icon name="shield" size={13} color="#3FA66B" strokeWidth={1.8} />
          <Text style={s.gdprText}>Dine data behandles i henhold til GDPR og norsk personvernlov.</Text>
        </View>
      </ScrollView>

      {/* Privacy policy modal */}
      <Modal visible={policyModal} transparent animationType="slide" onRequestClose={() => setPolicyModal(false)}>
        <View style={s.overlay}>
          <View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={s.sheetHandle} />
            <View style={s.policyHeader}>
              <Text style={s.sheetTitle}>Personvernerklæring</Text>
              <TouchableOpacity onPress={() => setPolicyModal(false)} style={s.policyClose}>
                <Icon name="x" size={16} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={s.policyScroll}>
              <Text style={s.policyText}>{PRIVACY_POLICY}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteModal} transparent animationType="slide" onRequestClose={() => setDeleteModal(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setDeleteModal(false)}>
          <TouchableOpacity activeOpacity={1} style={s.sheet} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <View style={s.deleteIcon}>
              <Icon name="x" size={22} color="#DC2626" strokeWidth={2} />
            </View>
            <Text style={s.sheetTitle}>Slett konto?</Text>
            <Text style={s.sheetBody}>Dette vil permanent slette alle dine data, reservasjoner og betalingsinformasjon. Handlingen kan ikke angres.</Text>
            <TouchableOpacity style={s.deleteBtn} activeOpacity={0.85} onPress={confirmDeleteAccount} disabled={deleting}>
              {deleting
                ? <ActivityIndicator color="#DC2626" size="small" />
                : <Text style={s.deleteBtnText}>Slett konto permanent</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeleteModal(false)} style={s.cancelBtn}>
              <Text style={s.cancelText}>Avbryt</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function ToggleRow({ label, hint, value, onToggle }) {
  return (
    <View style={s.row}>
      <View style={s.rowText}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowHint}>{hint}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: '#E5E7EB', true: '#FFFFFF' }} thumbColor="#fff" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32 },
  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22, overflow: 'hidden', marginBottom: 22 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginLeft: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#50607A', alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14 },
  rowHint: { fontFamily: 'System', fontWeight: '400', fontSize: 12, color: '#98B6D8', marginTop: 1 },
  gdprNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4, marginTop: 4 },
  gdprText: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', flex: 1, lineHeight: 17 },
  overlay: { flex: 1, backgroundColor: 'rgba(17,20,22,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#263548', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44, alignItems: 'center' },
  sheetHandle: { width: 40, height: 4, borderRadius: 999, backgroundColor: 'rgba(17,20,22,0.18)', marginBottom: 24 },
  deleteIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  sheetTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 20, color: '#FFFFFF', letterSpacing: -0.4, marginBottom: 10 },
  sheetBody: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#98B6D8', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  deleteBtn: { width: '100%', height: 52, borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  deleteBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#DC2626' },
  cancelBtn: { width: '100%', height: 52, borderRadius: 999, backgroundColor: '#5EA2F5', alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#fff' },
  policyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  policyClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  policyScroll: { width: '100%', maxHeight: 440 },
  policyText: { fontFamily: 'System', fontWeight: '400', fontSize: 13, color: '#98B6D8', lineHeight: 22 },
});
