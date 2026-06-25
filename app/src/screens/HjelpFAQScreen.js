import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, LayoutAnimation } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';

const FAQS = [
  {
    category: 'Reservasjon',
    items: [
      { q: 'Hvordan reserverer jeg en parkeringsplass?', a: 'Finn en ledig plass på kartet eller hjemskjermen, trykk på den og velg varighet. Bekreft med "Reserver nå" – du mottar en e-postbekreftelse umiddelbart.' },
      { q: 'Kan jeg avbestille en reservasjon?', a: 'Ja, du kan avbestille gratis inntil 15 minutter etter bestilling. Etter det belastes du for første time. Gå til Historikk og trykk "Avbestill" på reservasjonen.' },
      { q: 'Hva skjer om jeg trenger mer tid?', a: 'Du kan forlenge bookingen direkte fra plasskortet i appen – trykk "+ 30 min" eller "+ 1 time". Forlengelsen belastes automatisk.' },
      { q: 'Kan jeg planlegge parkering frem i tid?', a: 'Ja, på plasskortet bytter du fra "Nå" til "Planlegg" og velger dato og klokkeslett. Plassen reserveres og du varsles samme dag.' },
    ],
  },
  {
    category: 'Betaling',
    items: [
      { q: 'Hvilke betalingsmetoder støttes?', a: 'Vi støtter Visa, Mastercard og Vipps. Du kan legge til og administrere kort under Betalingsmetoder i profilen din.' },
      { q: 'Når belastes jeg?', a: 'Betalingen gjennomføres ved bestilling. Bookingavgiften på 18 % er inkludert i totalen du ser før du bekrefter.' },
      { q: 'Kan jeg få refusjon?', a: 'Refusjon gis ved tekniske problemer eller feil fra utleiers side. Kontakt hjelp@minplass.eu innen 24 timer etter parkering med ordrenummeret ditt.' },
      { q: 'Hva er bookingavgiften?', a: 'Bookingavgiften på 18 % dekker drift av plattformen, kundesupport og betalingssikkerhet. Den vises alltid tydelig i prisoppstillingen.' },
    ],
  },
  {
    category: 'Under parkeringen',
    items: [
      { q: 'Hvordan kontakter jeg utleieren?', a: 'Du finner kontaktinfo i reservasjonsbekreftelsen. Utleiere svarer typisk innen få minutter i åpningstid.' },
      { q: 'Hva gjør jeg om plassen er opptatt?', a: 'Kontakt utleier direkte via appen. Hjelper ikke det, send oss bilde på hjelp@minplass.eu – vi kontakter utleier og du belastes ikke for ubenyttet tid.' },
      { q: 'Appen viser at plassen er ledig, men den er opptatt?', a: 'Beklager! Trykk på "Meld problem" på reservasjonssiden. Vi refunderer ubenyttet tid og eskaler til utleier.' },
    ],
  },
  {
    category: 'Lei ut din plass',
    items: [
      { q: 'Hvordan legger jeg ut plassen min?', a: 'Gå til "Lei ut" i appen, fyll inn adresse, timepris og tilgjengelighet. Etter godkjenning er plassen synlig på kartet.' },
      { q: 'Når får jeg utbetalt?', a: 'Inntektene overføres til din registrerte bankkonto hver mandag. Du ser opptjent beløp og neste utbetaling i Hjem-fanen under Host-dashbordet.' },
      { q: 'Hva koster det å leie ut?', a: 'Parkno tar 20 % av leiebeløpet. Resten (80 % av subtotalen) utbetales til deg. Bookingavgiften betales av leietakeren.' },
      { q: 'Kan jeg nekte en reservasjon?', a: 'Du kan avvise innkommende reservasjoner i Innboks-fanen. Leietakeren varsles automatisk og belastes ikke.' },
    ],
  },
  {
    category: 'Konto og sikkerhet',
    items: [
      { q: 'Hvordan endrer jeg e-post eller passord?', a: 'Gå til Profil → Kontoinnstillinger. E-postendring krever bekreftelse til gammel adresse, passordendring sendes som en lenke.' },
      { q: 'Dataene mine – hvem ser dem?', a: 'Vi selger aldri data til tredjepart. Se vår personvernerklæring under Profil → Personvern for full oversikt over behandlingen.' },
      { q: 'Hvordan sletter jeg kontoen min?', a: 'Gå til Personvern → Slett konto. Alle data slettes permanent innen 30 dager. Aktive reservasjoner må avsluttes først.' },
    ],
  },
];

export default function HjelpFAQScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState('');

  const toggle = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(prev => prev === key ? null : key);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Hjelp & FAQ</Text>
          <View style={s.backBtn} />
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <LinearGradient colors={['#4E96F0', '#6FB1F7']} style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
            <Icon name="shield" size={26} color="#FFFFFF" strokeWidth={1.8} />
          </View>
          <Text style={s.heroTitle}>Hvordan kan vi hjelpe?</Text>
          <Text style={s.heroSub}>Her finner du svar på de vanligste spørsmålene.</Text>
        </View>

        {FAQS.map((cat) => (
          <View key={cat.category} style={s.section}>
            <Text style={s.sectionLabel}>{cat.category}</Text>
            <View style={s.card}>
              {cat.items.map((item, i) => {
                const key = `${cat.category}-${i}`;
                const isOpen = open === key;
                return (
                  <View key={key}>
                    {i > 0 && <View style={s.divider} />}
                    <TouchableOpacity style={s.qRow} onPress={() => toggle(key)} activeOpacity={0.75}>
                      <Text style={s.question}>{item.q}</Text>
                      <Icon name={isOpen ? 'x' : 'chevron-right'} size={16} color="#6E809B" strokeWidth={2} />
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={s.answerWrap}>
                        <Text style={s.answer}>{item.a}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity style={s.contactBtn} onPress={() => navigation.navigate('KontaktOss')} activeOpacity={0.85}>
          <Text style={s.contactBtnText}>Fant du ikke svaret? Kontakt oss</Text>
          <Icon name="chevron-right" size={16} color="#98B6D8" strokeWidth={2} />
        </TouchableOpacity>
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
  hero: { alignItems: 'center', marginBottom: 28 },
  heroIcon: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 20, color: '#FFFFFF', letterSpacing: -0.4, marginBottom: 6 },
  heroSub: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#98B6D8', textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  qRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  question: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#FFFFFF', flex: 1, lineHeight: 20, letterSpacing: -0.14 },
  answerWrap: { paddingHorizontal: 16, paddingBottom: 16 },
  answer: { fontFamily: 'System', fontWeight: '400', fontSize: 13, color: '#98B6D8', lineHeight: 20 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22 },
  contactBtnText: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#FFFFFF' },
});
