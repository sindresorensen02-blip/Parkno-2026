import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useBalance } from '../context/BalanceContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const KIND_LABEL = {
  redeem: 'Innløst gavekort',
  spend:  'Brukt på booking',
  refund: 'Refundert',
};

export default function SaldoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { balance, redeem, refresh } = useBalance();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [working, setWorking] = useState(false);
  const [tx, setTx] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('wallet_transactions')
      .select('id, amount, kind, ref, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setTx(data ?? []));
  }, [user, balance]);

  const onRedeem = async () => {
    if (working || !code.trim()) return;
    setWorking(true);
    const res = await redeem(code);
    setWorking(false);
    if (!res.ok) {
      const msg = res.error?.includes('invalid_or_used_code')
        ? 'Koden er ugyldig eller allerede brukt.'
        : 'Klarte ikke å innløse. Prøv igjen senere.';
      Alert.alert('Kunne ikke innløse', msg);
      return;
    }
    setCode('');
    Alert.alert('Gavekort innløst', `${res.amount} kr er lagt til saldoen din.`);
  };

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#2B394C', '#2B394C', '#2B394C']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn} hitSlop={8}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Saldo</Text>
          <View style={s.iconBtn} />
        </View>

        {/* Balance hero card */}
        <View style={s.balanceCard}>
          <LinearGradient
            colors={['#4E96F0', '#5EA2F5', '#4E96F0']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
          />
          <Text style={s.balanceLabel}>Tilgjengelig saldo</Text>
          <View style={s.balanceRow}>
            <Text style={s.balanceValue}>{balance}</Text>
            <Text style={s.balanceUnit}>kr</Text>
          </View>
          <Text style={s.balanceHint}>Brukes automatisk på neste reservasjon</Text>
        </View>

        {/* Redeem */}
        <Text style={s.sectionLabel}>Løs inn gavekort</Text>
        <View style={s.redeemRow}>
          <TextInput keyboardAppearance="dark"
            value={code}
            onChangeText={t => setCode(t.toUpperCase())}
            placeholder="Skriv inn kode"
            placeholderTextColor="#6E809B"
            style={s.input}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={32}
          />
          <TouchableOpacity
            style={[s.redeemBtn, (!code.trim() || working) && { opacity: 0.5 }]}
            onPress={onRedeem}
            disabled={working || !code.trim()}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#4E96F0', '#5EA2F5', '#4E96F0']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
            />
            {working ? <ActivityIndicator color="#fff" /> : <Text style={s.redeemBtnText}>Løs inn</Text>}
          </TouchableOpacity>
        </View>

        {/* History */}
        {tx.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { marginTop: 22 }]}>Bevegelser</Text>
            <View style={s.txList}>
              {tx.map((t, i) => (
                <View key={t.id} style={[s.txRow, i > 0 && s.txRowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txLabel}>{KIND_LABEL[t.kind] ?? t.kind}</Text>
                    <Text style={s.txMeta}>
                      {new Date(t.created_at).toLocaleDateString('nb-NO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {t.ref ? ` · ${t.ref}` : ''}
                    </Text>
                  </View>
                  <Text style={[s.txAmount, t.amount < 0 && { color: '#98B6D8' }]}>
                    {t.amount > 0 ? '+' : ''}{t.amount} kr
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {tx.length === 0 && (
          <Text style={s.emptyHint}>Ingen bevegelser ennå. Løs inn en kode for å fylle på saldoen.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32 },

  balanceCard: {
    borderRadius: 24, padding: 22, overflow: 'hidden', marginBottom: 24,
    shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32, shadowRadius: 24, elevation: 6,
  },
  balanceLabel: {
    fontFamily: 'System', fontWeight: '700', fontSize: 11,
    color: 'rgba(255,255,255,0.85)', letterSpacing: 1.2, textTransform: 'uppercase',
  },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 },
  balanceValue: { fontFamily: 'System', fontWeight: '800', fontSize: 48, color: '#fff', letterSpacing: -1.4 },
  balanceUnit:  { fontFamily: 'System', fontWeight: '600', fontSize: 18, color: 'rgba(255,255,255,0.85)' },
  balanceHint:  { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 10 },

  sectionLabel: {
    fontFamily: 'System', fontWeight: '700', fontSize: 11,
    color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase',
    marginBottom: 8, marginLeft: 4,
  },

  redeemRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1, height: 50, borderRadius: 14,
    backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#FFFFFF', letterSpacing: 2,
  },
  redeemBtn: {
    height: 50, paddingHorizontal: 22, borderRadius: 14, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30, shadowRadius: 12, elevation: 5,
  },
  redeemBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 14, color: '#fff', letterSpacing: -0.15 },

  txList: {
    backgroundColor: '#3A4C68', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
  },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, gap: 12 },
  txRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  txLabel:  { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14 },
  txMeta:   { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: '#98B6D8', marginTop: 2 },
  txAmount: { fontFamily: 'System', fontWeight: '800', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14 },

  emptyHint: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#98B6D8', textAlign: 'center', marginTop: 12 },
});
