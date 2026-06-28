import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, Image, ImageBackground } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { startVippsLogin } from '../lib/vippsAuth';

// ── Background ──────────────────────────────────────────────────────────────
// Drop a Parkno hero photo in here to use it as the full-bleed login backdrop —
// it's the only line you need to change. Until then we render a branded gradient
// placeholder (BrandBackdrop) so the layout is finished and the photo just slots
// in. e.g. const BG_IMAGE = require('../../assets/login-bg.jpg');
const BG_IMAGE = require('../../assets/login-bg.jpg');

// Branded stand-in for the hero photo: deep navy base, soft blue/green glows and
// a faint Parkno pin watermark. Reads as a real background and matches the app's
// dark palette, so swapping in a photo later changes nothing else.
function BrandBackdrop() {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={['#15233A', '#223247', '#15324A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.glow, styles.glowBlue]} />
      <View style={[styles.glow, styles.glowGreen]} />
      <Image
        source={require('../../assets/parkno-icon-opaque.png')}
        style={styles.watermark}
        resizeMode="contain"
      />
    </View>
  );
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, skipLogin } = useAuth();

  // 'landing' = the Peanut-style welcome with the login-method stack.
  // 'form'    = the email/password card, reached via "Fortsett med e-post".
  const [view, setView]         = useState('landing');
  const [mode, setMode]         = useState('login');   // 'login' | 'register'
  const [role, setRole]         = useState('sjåfør');  // 'sjåfør' | 'utleier'
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [vippsLoading, setVippsLoading] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [consentChecked, setConsentChecked] = useState(false);

  const onVippsLogin = async () => {
    setError('');
    setVippsLoading(true);
    const { error: err, cancelled } = await startVippsLogin();
    setVippsLoading(false);
    if (cancelled) return;
    if (err) setError(err);
    // On success the AuthContext onAuthStateChange handles routing.
  };

  const openForm = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setConsentChecked(false);
    setView('form');
  };

  const submit = async () => {
    setError('');
    setSuccess('');
    if (!email || !password) { setError('Fyll inn e-post og passord.'); return; }
    if (mode === 'register' && !fullName) { setError('Fyll inn fullt navn.'); return; }
    if (mode === 'register' && !consentChecked) {
      setError('Du må godta vilkårene og personvernreglene for å opprette konto.');
      return;
    }

    setLoading(true);
    const { data, error: err } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, fullName, role, consentChecked);

    setLoading(false);
    if (err) { setError(err.message); return; }

    if (mode === 'register' && data?.user && !data.session) {
      setSuccess('Sjekk e-posten din og klikk bekreftelseslenken for å aktivere kontoen.');
    }
  };

  return (
    <View style={styles.root}>
      {/* Full-bleed background — swap BG_IMAGE for a Parkno photo to replace it. */}
      {BG_IMAGE
        ? <ImageBackground source={BG_IMAGE} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        : <BrandBackdrop />}

      {/* Legibility scrim: light at the top so the hero shows through, deepening
          toward the bottom where the buttons / form sit. */}
      <LinearGradient
        colors={['rgba(13,21,34,0.30)', 'rgba(13,21,34,0.55)', 'rgba(13,21,34,0.92)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Blur the backdrop on the e-post screens (login + register), not the landing. */}
      {view !== 'landing' && (
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFillObject} />
      )}

      {view === 'landing' ? (
        <View style={[styles.landing, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
          {/* Hero — pin logo with the Parkno wordmark under it. Long-press to skip auth in dev. */}
          <View style={styles.hero}>
            <TouchableOpacity
              activeOpacity={__DEV__ ? 0.6 : 1}
              onLongPress={skipLogin}
              disabled={!__DEV__}
            >
              <Image source={require('../../assets/parkno-pin.png')} style={styles.heroLogo} resizeMode="contain" />
            </TouchableOpacity>
            {/* Wordmark — the exact "parkno" logotype from the website logo. */}
            <Image source={require('../../assets/parkno-wordmark.png')} style={styles.heroBrand} resizeMode="contain" />
            <Text style={styles.heroTagline}>
              Finn og lei parkering{'\n'}akkurat når du trenger den
            </Text>
          </View>

          {/* Login-method stack */}
          <View style={styles.stack}>
            <TouchableOpacity style={styles.vippsBtn} activeOpacity={0.85} onPress={onVippsLogin} disabled={vippsLoading}>
              {vippsLoading
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Image source={require('../../assets/vipps-logo.png')} style={styles.vippsLogo} resizeMode="contain" />
                    <Text style={styles.vippsText}>Logg inn med Vipps</Text>
                  </>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.bankidBtn} activeOpacity={0.85}>
              <Image source={require('../../assets/bankid-round.png')} style={styles.bankidLogo} resizeMode="contain" />
              <Text style={styles.bankidText}>Logg inn med BankID</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.emailBtn} activeOpacity={0.85} onPress={() => openForm('login')}>
              <BlurView intensity={30} tint="dark" style={styles.emailBlur}>
                <Icon name="mail" size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.emailText}>Fortsett med e-post</Text>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerLink} activeOpacity={0.7} onPress={() => openForm('register')}>
              <Text style={styles.registerText}>
                Ny her? <Text style={styles.registerTextStrong}>Opprett konto</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.legal}>
              Ved å fortsette godtar du{' '}
              <Text style={styles.legalLink}>vilkårene</Text> og{' '}
              <Text style={styles.legalLink}>personvernreglene</Text>.
            </Text>
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back to the landing stack */}
            <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => setView('landing')} hitSlop={10}>
              <Icon name="chevron-left" size={22} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.backText}>Tilbake</Text>
            </TouchableOpacity>

            <View style={styles.formHeader}>
              <Image source={require('../../assets/parkno-logo.png')} style={styles.formLogo} resizeMode="contain" />
              <Text style={styles.formTitle}>{mode === 'login' ? 'Velkommen tilbake' : 'Opprett konto'}</Text>
              <Text style={styles.formSub}>
                {mode === 'login' ? 'Logg inn med e-posten din' : 'Kom i gang med Parkno på et minutt'}
              </Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              {/* Fields */}
              {mode === 'register' && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Fullt navn</Text>
                  <TextInput keyboardAppearance="dark"
                    style={styles.input}
                    placeholder="Julia Metlicka"
                    placeholderTextColor="#9DB2CE"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>E-postadresse</Text>
                <TextInput keyboardAppearance="dark"
                  style={styles.input}
                  placeholder="deg@eksempel.no"
                  placeholderTextColor="#9DB2CE"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Passord</Text>
                <TextInput keyboardAppearance="dark"
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9DB2CE"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {/* Error / Success */}
              {!!error   && <Text style={styles.errorText}>{error}</Text>}
              {!!success && <Text style={styles.successText}>{success}</Text>}

              {mode === 'register' && (
                <TouchableOpacity
                  style={styles.consentRow}
                  activeOpacity={0.7}
                  onPress={() => setConsentChecked(v => !v)}
                >
                  <View style={[styles.checkbox, consentChecked && styles.checkboxActive]}>
                    {consentChecked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.consentText}>
                    Jeg godtar <Text style={styles.legalLink}>vilkårene</Text> og{' '}
                    <Text style={styles.legalLink}>personvernreglene</Text>.
                  </Text>
                </TouchableOpacity>
              )}

              {/* Submit */}
              <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85} onPress={submit} disabled={loading}>
                <LinearGradient
                  colors={['#4E96F0', '#3DC98A']}
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

              {mode === 'login' && (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>eller</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity style={styles.bankidBtnForm} activeOpacity={0.85}>
                    <Image source={require('../../assets/bankid-round.png')} style={styles.bankidLogo} resizeMode="contain" />
                    <Text style={styles.bankidText}>Logg inn med BankID</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Switch between login / create-account — its own tappable section. */}
            <TouchableOpacity
              style={styles.signupBar}
              activeOpacity={0.85}
              onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); setConsentChecked(false); }}
            >
              <View style={styles.signupTextWrap}>
                <Text style={styles.signupLabel}>
                  {mode === 'login' ? 'Har du ikke konto enda?' : 'Har du allerede en konto?'}
                </Text>
                <Text style={styles.signupCta}>
                  {mode === 'login' ? 'Opprett konto' : 'Logg inn i stedet'}
                </Text>
              </View>
              <View style={styles.signupArrow}>
                <LinearGradient
                  colors={['#4E96F0', '#3DC98A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]}
                />
                <Icon name="arrow-right" size={18} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#15233A' },

  // ── Backdrop placeholder ──────────────────────────────────────────────
  glow: { position: 'absolute', borderRadius: 999 },
  glowBlue: { width: 420, height: 420, backgroundColor: '#4E96F0', opacity: 0.22, top: -120, left: -120 },
  glowGreen: { width: 360, height: 360, backgroundColor: '#17E6A1', opacity: 0.16, bottom: 120, right: -120 },
  watermark: { position: 'absolute', width: 260, height: 260, alignSelf: 'center', top: '20%', opacity: 0.06, tintColor: '#FFFFFF' },

  // ── Landing (Peanut-style) ────────────────────────────────────────────
  landing: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },

  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroLogo: { width: 66, height: 84, marginBottom: 18 },
  heroBrand: { width: 164, height: 48, marginBottom: 2 },
  heroTagline: { fontFamily: 'System', fontWeight: '600', fontSize: 17, lineHeight: 25, color: 'rgba(255,255,255,0.82)', textAlign: 'center', marginTop: 14 },

  stack: { gap: 12 },
  vippsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 999, backgroundColor: '#FF5B24' },
  vippsText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.15 },
  vippsLogo: { width: 26, height: 26 },
  bankidBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 999, backgroundColor: '#39134C' },
  bankidLogo: { width: 30, height: 30 },
  bankidText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.15 },

  emailBtn: { height: 56, borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  emailBlur: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  emailText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.15 },

  registerLink: { alignItems: 'center', paddingVertical: 10, marginTop: 2 },
  registerText: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: 'rgba(255,255,255,0.72)' },
  registerTextStrong: { fontFamily: 'System', fontWeight: '700', color: '#FFFFFF' },

  legal: { fontFamily: 'System', fontWeight: '400', fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 16, marginTop: 4 },
  legalLink: { color: '#7FE3B8', fontFamily: 'System', fontWeight: '600' },

  // ── Form view ─────────────────────────────────────────────────────────
  scroll: { paddingHorizontal: 24, alignItems: 'stretch' },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: -4, marginBottom: 8, alignSelf: 'flex-start' },
  backText: { fontFamily: 'System', fontWeight: '600', fontSize: 15, color: '#FFFFFF' },

  formHeader: { alignItems: 'center', marginBottom: 22, marginTop: 8 },
  formLogo: { width: 56, height: 56, marginBottom: 12 },
  formTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 24, color: '#FFFFFF', letterSpacing: -0.5 },
  formSub: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  card: { backgroundColor: 'transparent', padding: 0 },

  // ── "No account yet" switch section ───────────────────────────────────
  signupBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingLeft: 20,
    paddingRight: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginTop: 16,
  },
  signupTextWrap: { gap: 2 },
  signupLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  signupCta: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.2 },
  signupArrow: { width: 40, height: 40, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },

  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  roleBtn: { flex: 1, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(17,20,22,0.08)' },
  roleBtnActive: { backgroundColor: '#5EA2F5', borderColor: '#5EA2F5' },
  roleBtnText: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#98B6D8' },
  roleBtnTextActive: { color: '#fff' },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#98B6D8', marginBottom: 6, letterSpacing: 0.2 },
  input: { height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 16, fontFamily: 'System', fontWeight: '500', fontSize: 15, color: '#FFFFFF' },

  errorText: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#F2A1A1', marginBottom: 12, textAlign: 'center' },
  successText: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#7FE3B8', marginBottom: 12, textAlign: 'center' },

  submitBtn: { height: 52, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 12, shadowColor: '#3DC98A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  submitText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.16 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.18)' },
  dividerText: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.4 },

  bankidBtnForm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 999, backgroundColor: '#39134C', marginBottom: 14 },

  loginFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14, paddingRight: 4 },
  consentText: { flex: 1, fontFamily: 'System', fontWeight: '500', fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 19 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#6E809B', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#5EA2F5', borderColor: '#5EA2F5' },
  checkmark: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  rememberText: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#98B6D8' },
  forgotBtn: { paddingVertical: 4 },
  forgotText: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#98B6D8' },
});
