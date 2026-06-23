import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { useBalance } from '../context/BalanceContext';
import { useSpots } from '../context/SpotsContext';
import { supabase } from '../lib/supabase';

const SECTIONS = [
  {
    title: 'Konto',
    rows: [
      { icon: 'wallet',      label: 'Saldo',                hint: 'Gavekort og innskudd',     screen: 'Saldo', balanceRow: true },
      { icon: 'user',        label: 'Rediger profil',       hint: 'Navn, bilde, kontaktinfo', screen: 'RedigerProfil' },
      { icon: 'credit-card', label: 'Betalingsmetoder',      hint: 'Kort og Vipps',            screen: 'Betalingsmetoder' },
      { icon: 'clock',       label: 'Reservasjonshistorikk', hint: 'Tidligere og aktive',      screen: 'Reservasjonshistorikk' },
    ],
  },
  {
    title: 'Preferanser',
    rows: [
      { icon: 'bell',   label: 'Varsler',    hint: 'Push og e-post',   screen: 'Varsler' },
      { icon: 'shield', label: 'Personvern', hint: 'Data og samtykke', screen: 'Personvern' },
    ],
  },
  {
    title: 'Support',
    rows: [
      { icon: 'help', label: 'Hjelp & FAQ',  hint: 'Vanlige spørsmål',  screen: 'HjelpFAQ' },
      { icon: 'mail', label: 'Kontakt oss',  hint: 'Chat eller e-post', screen: 'KontaktOss' },
      { icon: 'star', label: 'Vurder appen', hint: 'Del din mening',    screen: 'VurderAppen' },
    ],
  },
];

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const { isPremium } = usePremium();
  const { balance } = useBalance();
  const { spots } = useSpots();
  const [activeBookings, setActiveBookings] = useState([]);
  const [demoHasSpot, setDemoHasSpot] = useState(false);
  const showHostInsights = demoHasSpot || spots.length > 0;

  // Live: pick up every active or upcoming-soon reservation for this user.
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const now = new Date().toISOString();
      const soon = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('reservations')
        .select('id, starts_at, ends_at, total, spots(address, price_per_hour)')
        .eq('renter_id', user.id)
        .in('status', ['confirmed', 'pending'])
        .gte('ends_at', now)
        .lte('starts_at', soon)
        .order('starts_at', { ascending: true });
      setActiveBookings(data ?? []);
    };
    load();
    const ch = supabase
      .channel(`profile-active-${user.id}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `renter_id=eq.${user.id}` }, load)
      .subscribe();
    const tick = setInterval(load, 60000);
    return () => { supabase.removeChannel(ch); clearInterval(tick); };
  }, [user]);

  const initials = (profile?.full_name ?? user?.email ?? 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const memberYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : '—';

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#F7F7F2', '#F7F7F2']} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={20} color="#111416" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
          <Text style={styles.headerTitle}>Min profil</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Avatar + name */}
        <View style={styles.heroSection}>
          <View style={styles.avatarOuter}>
            <LinearGradient colors={['#DCEBDF', '#9ECFE3']} style={[StyleSheet.absoluteFillObject, { borderRadius: 52 }]} />
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.heroName}>{profile?.full_name ?? '—'}</Text>
          <Text style={styles.heroEmail}>{user?.email ?? ''}</Text>
          <View style={styles.memberBadge}>
            <View style={styles.memberDot} />
            <Text style={styles.memberText}>Medlem siden {memberYear}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.rentCard}
          activeOpacity={0.88}
          onPress={() => {
            if (showHostInsights) navigation.getParent()?.navigate('Hjem', { screen: 'Host' });
            else navigation.getParent()?.navigate('Hjem', { screen: 'LeiUt', params: { isFirst: false } });
          }}
        >
          <LinearGradient
            colors={showHostInsights ? ['#10B981', '#14B8A6', '#2563EB'] : ['#17211F', '#2F5D49']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
          />
          <View style={styles.rentOrbA} />
          <View style={styles.rentOrbB} />
          <Image
            source={require('../../assets/parkno-logo.png')}
            style={styles.rentLogo}
            resizeMode="contain"
          />
          <View style={styles.rentText}>
            <Text style={styles.rentEyebrow}>{showHostInsights ? 'PUBLISERT' : 'TILGJENGELIG'}</Text>
            <Text style={styles.rentTitle}>{showHostInsights ? 'Innsikt' : 'Lei ut plassen din'}</Text>
            <Text style={styles.rentHint}>
              {showHostInsights
                ? 'Se inntekt, reservasjoner og utbetalinger for plassene dine.'
                : 'Publiser parkeringsplassen og tjen penger når den står ledig.'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.rentChip}
            activeOpacity={0.78}
            onPress={(event) => {
              event.stopPropagation?.();
              setDemoHasSpot(v => !v);
            }}
          >
            <Text style={styles.rentChipText}>{showHostInsights ? 'På' : 'Av'}</Text>
          </TouchableOpacity>
          <Icon name="arrow-right" size={18} color="rgba(255,255,255,0.9)" strokeWidth={2.4} />
        </TouchableOpacity>

        {/* Active parkings — only when user has live/upcoming bookings */}
        {activeBookings.length > 0 && (
          <View style={styles.activeWrap}>
            <Text style={styles.activeSectionLabel}>Aktive parkeringer</Text>
            {activeBookings.map((b) => {
              const now = Date.now();
              const start = new Date(b.starts_at).getTime();
              const end = new Date(b.ends_at).getTime();
              const isLive = now >= start && now <= end;
              const remainingMs = Math.max(0, end - now);
              const startsInMs = Math.max(0, start - now);
              const fmt = (ms) => {
                const m = Math.round(ms / 60000);
                if (m < 60) return `${m} min`;
                const h = Math.floor(m / 60), rem = m % 60;
                return rem ? `${h} t ${rem} min` : `${h} t`;
              };
              const label = isLive ? `Aktiv · ${fmt(remainingMs)} igjen` : `Starter om ${fmt(startsInMs)}`;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={styles.activeCard}
                  activeOpacity={0.92}
                  onPress={() => navigation.getParent()?.navigate('Hjem', { screen: 'AktivParkering' })}
                >
                  <LinearGradient
                    colors={isLive ? ['#10B981', '#14B8A6', '#2563EB'] : ['#4EA7B9', '#93D6E3']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]}
                  />
                  <View style={styles.activeLiveDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeStatus}>{label}</Text>
                    <Text style={styles.activeAddress} numberOfLines={1}>{b.spots?.address ?? 'Reservasjon'}</Text>
                  </View>
                  <Icon name="arrow-right" size={16} color="rgba(255,255,255,0.9)" strokeWidth={2.4} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Premium card — vivid multi-stop gradient, accent orbs, brand logo */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => navigation.navigate('ParknoPremium')} style={styles.premiumCard}>
          <LinearGradient
            colors={isPremium
              ? ['#10B981', '#14B8A6', '#2563EB', '#7C3AED']
              : ['#FF8A5B', '#EF4444', '#7C3AED', '#2563EB']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
          />
          {/* decorative orbs */}
          <View style={styles.premiumOrbA} />
          <View style={styles.premiumOrbB} />

          <Image
            source={require('../../assets/parkno-logo.png')}
            style={styles.premiumLogo}
            resizeMode="contain"
          />
          <View style={styles.premiumBody}>
            <Text style={styles.premiumEyebrow}>{isPremium ? 'AKTIV' : 'TILGJENGELIG'}</Text>
            <Text style={styles.premiumTitle}>Parkno Premium</Text>
            <Text style={styles.premiumSub}>
              {isPremium ? 'Ingen bookingavgift på reservasjoner' : 'Slipp bookingavgiften · 49 kr/mnd'}
            </Text>
          </View>
          <Icon name="chevron-right" size={18} color="rgba(255,255,255,0.85)" strokeWidth={2.4} />
        </TouchableOpacity>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.rows.map((row, i) => (
                <React.Fragment key={row.label}>
                  <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => row.screen && navigation.navigate(row.screen)}>
                    <View style={styles.rowIconWrap}>
                      <Icon name={row.icon} size={15} color="#111416" strokeWidth={1.8} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel}>{row.label}</Text>
                      <Text style={styles.rowHint}>{row.hint}</Text>
                    </View>
                    {row.balanceRow ? (
                      <Text style={styles.rowBalance}>{balance} kr</Text>
                    ) : (
                      <Icon name="chevron-right" size={16} color="#C4CACC" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                  {i < section.rows.length - 1 && <View style={styles.rowDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={signOut}>
          <Text style={styles.logoutText}>Logg ut</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Parkno · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#111416', letterSpacing: -0.32 },

  heroSection: { alignItems: 'center', marginBottom: 24 },
  avatarOuter: { width: 104, height: 104, borderRadius: 52, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.95)', marginBottom: 14, shadowColor: '#111416', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 6 },
  avatarText: { fontFamily: 'System', fontWeight: '800', fontSize: 34, color: '#111416', zIndex: 1 },
  heroName: { fontFamily: 'System', fontWeight: '800', fontSize: 22, color: '#111416', letterSpacing: -0.44, marginBottom: 4 },
  heroEmail: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#7B8589', marginBottom: 10 },
  memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(159,214,180,0.2)', borderWidth: 1, borderColor: 'rgba(159,214,180,0.4)' },
  memberDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3FA66B' },
  memberText: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#1F6B47' },

  rentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 24, padding: 18, marginBottom: 28, overflow: 'hidden',
    shadowColor: '#2F5D49', shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.36, shadowRadius: 22, elevation: 8,
  },
  rentOrbA: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -80, right: -50,
  },
  rentOrbB: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.10)',
    bottom: -70, left: -30,
  },
  rentLogo: { width: 52, height: 52, tintColor: '#fff' },
  rentText: { flex: 1 },
  rentEyebrow: { fontFamily: 'System', fontWeight: '700', fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2 },
  rentTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 17, color: '#fff', letterSpacing: -0.34 },
  rentHint: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: 'rgba(255,255,255,0.76)', lineHeight: 17, marginTop: 3 },
  rentChip: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  rentChipText: { fontFamily: 'System', fontWeight: '800', fontSize: 10, color: '#fff', letterSpacing: 0.5 },

  // Active parkings section
  activeWrap: { marginBottom: 16, gap: 8 },
  activeSectionLabel: {
    fontFamily: 'System', fontWeight: '700', fontSize: 11,
    color: '#7B8589', letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 4, marginLeft: 4,
  },
  activeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30, shadowRadius: 14, elevation: 6,
  },
  activeLiveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  activeStatus: { fontFamily: 'System', fontWeight: '800', fontSize: 13, color: '#fff', letterSpacing: -0.13 },
  activeAddress: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  premiumCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18, borderRadius: 24, overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.36, shadowRadius: 22, elevation: 8,
  },
  premiumOrbA: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -80, right: -50,
  },
  premiumOrbB: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.10)',
    bottom: -70, left: -30,
  },
  premiumLogo: { width: 52, height: 52, tintColor: '#fff' },
  premiumBody: { flex: 1 },
  premiumEyebrow: { fontFamily: 'System', fontWeight: '700', fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2 },
  premiumTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 16, color: '#fff', letterSpacing: -0.32, marginTop: 2 },
  premiumSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 2 },

  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#7B8589', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 22, overflow: 'hidden', shadowColor: '#111416', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },

  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  rowIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(17,20,22,0.06)', alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#111416', letterSpacing: -0.14 },
  rowHint: { fontFamily: 'System', fontWeight: '400', fontSize: 12, color: '#7B8589', marginTop: 1 },
  rowBalance: { fontFamily: 'System', fontWeight: '800', fontSize: 15, color: '#10B981', letterSpacing: -0.2 },
  rowDivider: { height: 1, backgroundColor: 'rgba(17,20,22,0.05)', marginLeft: 66 },

  logoutBtn: { height: 52, borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoutText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#DC2626', letterSpacing: -0.15 },

  version: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: '#C4CACC', textAlign: 'center', marginBottom: 8 },
});
