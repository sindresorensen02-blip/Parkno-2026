import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function RedigerProfilScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile, updateProfile } = useAuth();

  const [navn, setNavn]       = useState(profile?.full_name ?? '');
  const [telefon, setTelefon] = useState(profile?.phone ?? '');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const initials = (profile?.full_name ?? user?.email ?? '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const save = async () => {
    setSaving(true);
    setError(null);
    const { error: err } = await updateProfile({
      full_name: navn.trim(),
      phone:     telefon.trim() || null,
    });
    setSaving(false);
    if (err) { setError('Noe gikk galt. Prøv igjen.'); return; }
    setSaved(true);
    setTimeout(() => { setSaved(false); navigation.goBack(); }, 900);
  };

  const changePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Tilgang nektet', 'Gi Parkno tilgang til bilder i Innstillinger for å endre profilbilde.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploadingPhoto(true);
    try {
      const uri  = result.assets[0].uri;
      const ext  = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const blob = await (await fetch(uri)).blob();

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: `image/${ext}` });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile({ avatar_url: publicUrl });
    } catch {
      Alert.alert('Feil', 'Kunne ikke laste opp bildet. Prøv igjen.');
    }
    setUploadingPhoto(false);
  };

  const sendPasswordReset = async () => {
    Alert.alert(
      'Endre passord',
      `Vi sender en tilbakestillingslenke til ${user?.email}.`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Send lenke',
          onPress: async () => {
            const { error: err } = await supabase.auth.resetPasswordForEmail(user?.email ?? '');
            if (err) {
              Alert.alert('Feil', 'Kunne ikke sende e-post. Prøv igjen.');
            } else {
              Alert.alert('Sendt!', 'Sjekk innboksen din for å opprette nytt passord.');
            }
          },
        },
      ],
    );
  };

  const hasChanges =
    navn.trim()    !== (profile?.full_name ?? '') ||
    telefon.trim() !== (profile?.phone ?? '');

  return (
    <View style={s.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Rediger profil</Text>
          <View style={s.backBtn} />
        </View>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <TouchableOpacity style={s.avatarWrap} onPress={changePhoto} activeOpacity={0.85}>
            {profile?.avatar_url
              ? <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFillObject} />
              : <LinearGradient colors={['#4E96F0', '#6FB1F7']} style={[StyleSheet.absoluteFillObject, { borderRadius: 52 }]} />
            }
            {!profile?.avatar_url && <Text style={s.avatarText}>{initials}</Text>}
            <View style={s.avatarOverlay}>
              {uploadingPhoto
                ? <ActivityIndicator color="#fff" size="small" />
                : <Icon name="camera" size={18} color="#fff" strokeWidth={2} />
              }
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.changePhotoBtn} onPress={changePhoto} activeOpacity={0.85}>
            <Text style={s.changePhotoText}>{uploadingPhoto ? 'Laster opp…' : 'Endre profilbilde'}</Text>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <Text style={s.sectionLabel}>Personlig informasjon</Text>
        <View style={s.card}>
          <Field label="Fullt navn" value={navn} onChangeText={setNavn} placeholder="Ditt navn" icon="user" />
          <View style={s.divider} />
          <View style={s.fieldWrap}>
            <View style={s.fieldIcon}><Icon name="bell" size={14} color="#98B6D8" strokeWidth={1.8} /></View>
            <View style={s.fieldBody}>
              <Text style={s.fieldLabel}>E-postadresse</Text>
              <Text style={s.fieldReadOnly}>{user?.email ?? '—'}</Text>
            </View>
            <View style={s.readOnlyBadge}><Text style={s.readOnlyText}>Låst</Text></View>
          </View>
          <View style={s.divider} />
          <Field label="Telefonnummer" value={telefon} onChangeText={setTelefon} placeholder="+47 000 00 000" icon="map-pin" keyboardType="phone-pad" />
        </View>

        <Text style={s.sectionLabel}>Sikkerhet</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.secRow} onPress={sendPasswordReset} activeOpacity={0.75}>
            <View style={s.secIcon}><Icon name="shield" size={15} color="#FFFFFF" strokeWidth={1.8} /></View>
            <View style={s.secText}>
              <Text style={s.secLabel}>Endre passord</Text>
              <Text style={s.secHint}>Sendes til {user?.email}</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#6E809B" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {error && <Text style={s.errorText}>{error}</Text>}

        <TouchableOpacity
          onPress={save}
          style={[s.saveBtn, (!hasChanges || saving) && s.saveBtnDisabled]}
          activeOpacity={0.88}
          disabled={!hasChanges || saving}
        >
          <LinearGradient
            colors={['#4E96F0', '#5EA2F5', '#4E96F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]}
          />
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.saveBtnText}>{saved ? 'Lagret ✓' : 'Lagre endringer'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, icon, keyboardType }) {
  return (
    <View style={s.fieldWrap}>
      <View style={s.fieldIcon}><Icon name={icon} size={14} color="#98B6D8" strokeWidth={1.8} /></View>
      <View style={s.fieldBody}>
        <Text style={s.fieldLabel}>{label}</Text>
        <TextInput keyboardAppearance="dark"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6E809B"
          style={s.fieldInput}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32 },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrap: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12 },
  avatarText: { fontFamily: 'System', fontWeight: '800', fontSize: 28, color: '#FFFFFF', zIndex: 1 },
  avatarOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, backgroundColor: 'rgba(17,20,22,0.45)', alignItems: 'center', justifyContent: 'center' },
  changePhotoBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(17,20,22,0.15)', backgroundColor: '#3A4C68' },
  changePhotoText: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#FFFFFF' },

  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22, overflow: 'hidden', marginBottom: 22 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginLeft: 56 },

  fieldWrap: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  fieldIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  fieldBody: { flex: 1 },
  fieldLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 10, color: '#98B6D8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  fieldInput: { fontFamily: 'System', fontWeight: '600', fontSize: 15, color: '#FFFFFF', letterSpacing: -0.15, padding: 0 },
  fieldReadOnly: { fontFamily: 'System', fontWeight: '600', fontSize: 15, color: '#98B6D8', letterSpacing: -0.15 },
  readOnlyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#50607A' },
  readOnlyText: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#98B6D8', letterSpacing: 0.4 },

  secRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  secIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  secText: { flex: 1 },
  secLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14 },
  secHint: { fontFamily: 'System', fontWeight: '400', fontSize: 12, color: '#98B6D8', marginTop: 1 },

  errorText: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#C53030', textAlign: 'center', marginBottom: 12 },

  saveBtn: { height: 56, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 6 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.16 },
});
