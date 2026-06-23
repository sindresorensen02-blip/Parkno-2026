import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, ScrollView,
  Platform, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, skipLogin } = useAuth();

  const [mode, setMode]         = useState('login');   // 'login' | 'register'
  const [role, setRole]         = useState('sjåfør');  // 'sjåfør' | 'utleier'
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const submit = async () => {
    setError('');
    setSuccess('');
    if (!email || !password) { setError('Fyll inn e-post og passord.'); return; }
    if (mode === 'register' && !fullName) { setError('Fyll inn fullt navn.'); return; }

    setLoading(true);
    const { data, error: err } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, fullName, role);

    setLoading(false);
    if (err) { setError(err.message); return; }

    if (mode === 'register' && data?.user && !data.session) {
      setSuccess('Sjekk e-posten din og klikk bekreftelseslenken for å aktivere kontoen.');
    }
  };

  return (
    <View style={styles.root}>
      {/* Background blobs */}
      <LinearGradient colors={['#F7F7F2', '#F7F7F2']} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <TouchableOpacity onPress={skipLogin} activeOpacity={__DEV__ ? 0.6 : 1} disabled={!__DEV__}>
              <Image source={require('../../assets/parkno-logo.png')} style={styles.logoImage} resizeMode="contain" />
            </TouchableOpacity>
            <Text style={styles.brandName}>Parkno</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Mode toggle */}
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
                onPress={() => { setMode('login'); setError(''); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>Logg inn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
                onPress={() => { setMode('register'); setError(''); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeBtnText, mode === 'register' && styles.modeBtnTextActive]}>Registrer</Text>
              </TouchableOpacity>
            </View>

            {/* Role toggle */}
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'sjåfør' && styles.roleBtnActive]}
                onPress={() => setRole('sjåfør')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleBtnText, role === 'sjåfør' && styles.roleBtnTextActive]}>Sjåfør</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'utleier' && styles.roleBtnActive]}
                onPress={() => setRole('utleier')}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleBtnText, role === 'utleier' && styles.roleBtnTextActive]}>Utleier</Text>
              </TouchableOpacity>
            </View>

            {/* BankID */}
            <TouchableOpacity style={styles.bankidBtn} activeOpacity={0.85}>
              <View style={styles.bankidIcon}>
                <Text style={styles.bankidIconText}>B</Text>
              </View>
              <Text style={styles.bankidText}>Logg inn med BankID</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>eller</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Fields */}
            {mode === 'register' && (
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Fullt navn</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Julia Metlicka"
                  placeholderTextColor="#C4CACC"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>E-postadresse</Text>
              <TextInput
                style={styles.input}
                placeholder="deg@eksempel.no"
                placeholderTextColor="#C4CACC"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Passord</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#C4CACC"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Error / Success */}
            {!!error   && <Text style={styles.errorText}>{error}</Text>}
            {!!success && <Text style={styles.successText}>{success}</Text>}

            {/* Submit */}
            <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85} onPress={submit} disabled={loading}>
              <LinearGradient
                colors={['#4EA7B9', '#3D8FA0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]}
              />
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>{mode === 'login' ? 'Logg inn' : 'Opprett konto'}</Text>
              }
            </TouchableOpacity>

            {mode === 'login' && (
              <View style={styles.loginFooterRow}>
                <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(v => !v)} activeOpacity={0.7}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberText}>Husk meg</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.forgotBtn}
                  activeOpacity={0.7}
                  onPress={async () => {
                    if (!email.trim()) { setError('Skriv inn e-postadressen din først.'); return; }
                    setLoading(true);
                    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
                    setLoading(false);
                    if (err) { setError(err.message); return; }
                    setSuccess(`Tilbakestillingslenke sendt til ${email.trim()}`);
                  }}
                >
                  <Text style={styles.forgotText}>Glemt passord?</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.footer}>
            Ved å fortsette godtar du{' '}
            <Text style={styles.footerLink}>vilkårene</Text> og{' '}
            <Text style={styles.footerLink}>personvernreglene</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, alignItems: 'stretch' },

  blob: { position: 'absolute', borderRadius: 999, opacity: 0.55 },
  blob1: { width: 320, height: 320, backgroundColor: '#EF8F7A', top: -80, right: -100, opacity: 0.18 },
  blob2: { width: 260, height: 260, backgroundColor: '#5FAFD3', bottom: 80, left: -80, opacity: 0.2 },
  blob3: { width: 200, height: 200, backgroundColor: '#9FD6B4', top: '40%', right: -60, opacity: 0.18 },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  logoImage: { width: 48, height: 48 },
  brandName: { fontFamily: 'System', fontWeight: '800', fontSize: 24, color: '#111416', letterSpacing: -0.48 },

  card: { backgroundColor: 'rgba(255,255,255,0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 28, padding: 22, shadowColor: '#111416', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 32, elevation: 8 },

  modeRow: { flexDirection: 'row', backgroundColor: 'rgba(17,20,22,0.06)', borderRadius: 999, padding: 3, marginBottom: 20 },
  modeBtn: { flex: 1, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  modeBtnActive: { backgroundColor: '#fff', shadowColor: '#111416', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  modeBtnText: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#7B8589' },
  modeBtnTextActive: { color: '#111416', fontFamily: 'System', fontWeight: '700' },

  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  roleBtn: { flex: 1, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(17,20,22,0.05)', borderWidth: 1, borderColor: 'rgba(17,20,22,0.08)' },
  roleBtnActive: { backgroundColor: '#111416', borderColor: '#111416' },
  roleBtnText: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#7B8589' },
  roleBtnTextActive: { color: '#fff' },

  bankidBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 999, backgroundColor: '#39134C', marginBottom: 20 },
  bankidIcon: { width: 26, height: 26, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  bankidIconText: { fontFamily: 'System', fontWeight: '800', fontSize: 14, color: '#fff' },
  bankidText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#fff', letterSpacing: -0.15 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(17,20,22,0.08)' },
  dividerText: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#7B8589' },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#7B8589', marginBottom: 6, letterSpacing: 0.2 },
  input: { height: 50, borderRadius: 14, backgroundColor: 'rgba(17,20,22,0.04)', borderWidth: 1, borderColor: 'rgba(17,20,22,0.1)', paddingHorizontal: 16, fontFamily: 'System', fontWeight: '500', fontSize: 15, color: '#111416' },

  errorText: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#DC2626', marginBottom: 12, textAlign: 'center' },
  successText: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#1F6B47', marginBottom: 12, textAlign: 'center' },

  submitBtn: { height: 52, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 12, shadowColor: '#4EA7B9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  submitText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.16 },

  loginFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#C4CACC', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#4EA7B9', borderColor: '#4EA7B9' },
  checkmark: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  rememberText: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#7B8589' },
  forgotBtn: { paddingVertical: 4 },
  forgotText: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#7B8589' },

  footer: { fontFamily: 'System', fontWeight: '400', fontSize: 11, color: '#7B8589', textAlign: 'center', marginTop: 24, lineHeight: 16 },
  footerLink: { color: '#4EA7B9', fontFamily: 'System', fontWeight: '600' },
});
