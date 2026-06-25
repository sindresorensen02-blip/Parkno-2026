import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

function formatBankAccount(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0,4)}.${d.slice(4)}`;
  return `${d.slice(0,4)}.${d.slice(4,6)}.${d.slice(6)}`;
}

const CARDS = [
  { id: '1', type: 'Visa',       last4: '4242', expires: '08/26', default: true },
  { id: '2', type: 'Mastercard', last4: '8821', expires: '11/25', default: false },
];

export default function BetalingsmetodeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState(CARDS);
  const [vipps, setVipps] = useState(true);
  const { user } = useAuth();
  const [bankAccount, setBankAccount]   = useState('');
  const [editingBank, setEditingBank]   = useState(false);
  const [bankInput, setBankInput]       = useState('');
  const [savingBank, setSavingBank]     = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('bank_account').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.bank_account) setBankAccount(data.bank_account);
      });
  }, [user]);

  const saveBank = async () => {
    const digits = bankInput.replace(/\D/g, '');
    if (digits.length !== 11) return;
    setSavingBank(true);
    const formatted = formatBankAccount(digits);
    await supabase.from('profiles').update({ bank_account: formatted }).eq('id', user.id);
    setBankAccount(formatted);
    setEditingBank(false);
    setSavingBank(false);
  };

  const setDefault = (id) => setCards(prev => prev.map(c => ({ ...c, default: c.id === id })));
  const remove = (id) => setCards(prev => prev.filter(c => c.id !== id));

  return (
    <View style={s.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Betalingsmetoder</Text>
          <View style={s.backBtn} />
        </View>

        {/* Payout bank account */}
        <Text style={s.sectionLabel}>Utbetaling</Text>
        <View style={s.cardList}>
          <View style={s.cardRow}>
            <View style={[s.cardIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <Icon name="trending-up" size={16} color="#4E96F0" strokeWidth={2} />
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardNumber}>Bankkonto</Text>
              {editingBank ? (
                <TextInput keyboardAppearance="dark"
                  value={bankInput}
                  onChangeText={v => setBankInput(formatBankAccount(v))}
                  placeholder="XXXX.XX.XXXXX"
                  placeholderTextColor="#6E809B"
                  keyboardType="number-pad"
                  style={s.bankInput}
                  autoFocus
                  maxLength={13}
                />
              ) : (
                <Text style={s.cardExpiry}>
                  {bankAccount ? bankAccount : 'Ikke lagt til ennå'}
                </Text>
              )}
            </View>
            {editingBank ? (
              <TouchableOpacity onPress={saveBank} style={s.actionBtn} disabled={savingBank}>
                {savingBank
                  ? <ActivityIndicator size="small" color="#4E96F0" />
                  : <Text style={[s.actionBtnText, { color: '#4E96F0' }]}>Lagre</Text>
                }
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => { setBankInput(bankAccount); setEditingBank(true); }} style={s.actionBtn}>
                <Text style={s.actionBtnText}>{bankAccount ? 'Endre' : 'Legg til'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={s.secureNote}>
          <Icon name="shield" size={13} color="#3FA66B" strokeWidth={1.8} />
          <Text style={s.secureText}>Utbetalinger skjer til din registrerte bankkonto hver mandag.</Text>
        </View>
        <View style={{ height: 22 }} />

        <Text style={s.sectionLabel}>Lagrede kort</Text>
        <View style={s.cardList}>
          {cards.map((card, i) => (
            <View key={card.id}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.cardRow}>
                <View style={s.cardIcon}>
                  <Text style={s.cardTypeText}>{card.type === 'Visa' ? 'VISA' : 'MC'}</Text>
                </View>
                <View style={s.cardInfo}>
                  <View style={s.cardTopRow}>
                    <Text style={s.cardNumber}>{card.type} •••• {card.last4}</Text>
                    {card.default && (
                      <View style={s.defaultBadge}><Text style={s.defaultText}>Standard</Text></View>
                    )}
                  </View>
                  <Text style={s.cardExpiry}>Utløper {card.expires}</Text>
                </View>
                <View style={s.cardActions}>
                  {!card.default && (
                    <TouchableOpacity onPress={() => setDefault(card.id)} style={s.actionBtn}>
                      <Text style={s.actionBtnText}>Sett standard</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => remove(card.id)} style={s.removeBtn}>
                    <Icon name="x" size={14} color="#DC2626" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>Digital betaling</Text>
        <View style={s.cardList}>
          <View style={s.cardRow}>
            <View style={[s.cardIcon, { backgroundColor: 'rgba(255,91,36,0.12)' }]}>
              <Text style={[s.cardTypeText, { color: '#4E96F0', fontSize: 11 }]}>Vipps</Text>
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardNumber}>Vipps</Text>
              <Text style={s.cardExpiry}>{vipps ? 'Tilkoblet · +47 456 78 901' : 'Ikke tilkoblet'}</Text>
            </View>
            <TouchableOpacity onPress={() => setVipps(v => !v)} style={[s.vippsToggle, vipps && s.vippsToggleActive]}>
              <Text style={[s.vippsToggleText, vipps && s.vippsToggleTextActive]}>{vipps ? 'Koble fra' : 'Koble til'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={s.addBtn}
          activeOpacity={0.85}
          onPress={() => Alert.alert(
            'Kortbetaling kommer snart',
            'Vi jobber med å integrere kortbetaling. I mellomtiden kan du betale via Vipps.',
            [{ text: 'OK' }],
          )}
        >
          <View style={s.addBtnIcon}><Icon name="wallet" size={16} color="#FFFFFF" strokeWidth={1.8} /></View>
          <Text style={s.addBtnText}>Legg til nytt kort</Text>
          <Icon name="chevron-right" size={16} color="#98B6D8" strokeWidth={2} />
        </TouchableOpacity>

        <View style={s.secureNote}>
          <Icon name="shield" size={13} color="#3FA66B" strokeWidth={1.8} />
          <Text style={s.secureText}>Kortinformasjonen din er kryptert og trygt lagret.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32 },
  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  cardList: { backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22, overflow: 'hidden', marginBottom: 22 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginLeft: 66 },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  cardIcon: { width: 44, height: 30, borderRadius: 6, backgroundColor: '#50607A', alignItems: 'center', justifyContent: 'center' },
  cardTypeText: { fontFamily: 'System', fontWeight: '800', fontSize: 10, color: '#FFFFFF', letterSpacing: 0.5 },
  cardInfo: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardNumber: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14 },
  cardExpiry: { fontFamily: 'System', fontWeight: '400', fontSize: 12, color: '#98B6D8', marginTop: 2 },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(63,166,107,0.15)', borderWidth: 1, borderColor: 'rgba(63,166,107,0.3)' },
  defaultText: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#5EA2F5' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(17,20,22,0.15)' },
  actionBtnText: { fontFamily: 'System', fontWeight: '600', fontSize: 11, color: '#FFFFFF' },
  removeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(239,68,68,0.08)', alignItems: 'center', justifyContent: 'center' },
  vippsToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(17,20,22,0.15)' },
  vippsToggleActive: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' },
  vippsToggleText: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#FFFFFF' },
  vippsToggleTextActive: { color: '#DC2626' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22, marginBottom: 16 },
  addBtnIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#50607A', alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#FFFFFF', flex: 1 },
  bankInput: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#FFFFFF', padding: 0, marginTop: 2, letterSpacing: 1 },
  secureNote: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  secureText: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', flex: 1, lineHeight: 17 },
});
