import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const TAGS = ['Enkel å bruke', 'Rask', 'Pålitelig', 'God design', 'Bra utvalg', 'Trygg betaling'];

const LABELS = ['', 'Veldig dårlig', 'Dårlig', 'Ok', 'Bra', 'Fantastisk!'];

function Star({ filled, size = 40, onPress }) {
  const c = filled ? '#F59E0B' : '#E5E7EB';
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={filled ? '#F59E0B' : '#D1D5DB'} strokeWidth={1.5} fill={c} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </TouchableOpacity>
  );
}

export default function VurderAppenScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (t) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const submit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    await supabase.from('app_reviews').insert({
      user_id: user?.id ?? null,
      rating,
      tags: tags.length > 0 ? tags : null,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={s.root}>
        <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />
        <View style={s.thankYou}>
          <View style={s.checkCircle}>
            <LinearGradient colors={['#4E96F0', '#4E96F0']} style={[StyleSheet.absoluteFillObject, { borderRadius: 40 }]} />
            <Icon name="check" size={30} color="#fff" strokeWidth={2.5} />
          </View>
          <Text style={s.thankTitle}>Takk for tilbakemeldingen!</Text>
          <Text style={s.thankSub}>Din vurdering hjelper oss å gjøre Parkno bedre for alle.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.doneBtn}>
            <Text style={s.doneBtnText}>Tilbake til profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Vurder appen</Text>
          <View style={s.backBtn} />
        </View>

        {/* Stars */}
        <View style={s.starsSection}>
          <Text style={s.starsTitle}>Hva synes du om Parkno?</Text>
          <Text style={s.starsSub}>Din ærlige tilbakemelding betyr mye</Text>
          <View style={s.starsRow}>
            {[1,2,3,4,5].map(i => (
              <Star key={i} filled={i <= rating} size={44} onPress={() => setRating(i)} />
            ))}
          </View>
          {rating > 0 && (
            <Text style={s.ratingLabel}>{LABELS[rating]}</Text>
          )}
        </View>

        {/* Tags */}
        {rating >= 3 && (
          <>
            <Text style={s.sectionLabel}>Hva likte du best?</Text>
            <View style={s.tagsWrap}>
              {TAGS.map(t => (
                <TouchableOpacity key={t} onPress={() => toggleTag(t)} style={[s.tagBtn, tags.includes(t) && s.tagBtnActive]}>
                  {tags.includes(t) && <Icon name="check" size={11} color="#fff" strokeWidth={2.5} />}
                  <Text style={[s.tagText, tags.includes(t) && s.tagTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Comment */}
        <Text style={s.sectionLabel}>Fortell oss mer (valgfritt)</Text>
        <View style={s.commentCard}>
          <TextInput keyboardAppearance="dark"
            value={comment}
            onChangeText={setComment}
            placeholder={rating > 0 && rating <= 2 ? 'Hva kan vi forbedre?' : 'Hva likte du best?'}
            placeholderTextColor="#6E809B"
            multiline
            numberOfLines={4}
            style={s.commentInput}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity onPress={submit} style={[s.submitBtn, rating === 0 && s.submitBtnDisabled]} activeOpacity={0.88}>
          <LinearGradient colors={rating > 0 ? ['#4E96F0', '#5EA2F5', '#4E96F0'] : ['#E5E7EB', '#E5E7EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]} />
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={[s.submitBtnText, rating === 0 && s.submitBtnTextDisabled]}>Send vurdering</Text>}
        </TouchableOpacity>
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
  starsSection: { alignItems: 'center', marginBottom: 32 },
  starsTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 20, color: '#FFFFFF', letterSpacing: -0.4, marginBottom: 6 },
  starsSub: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#98B6D8', marginBottom: 20 },
  starsRow: { flexDirection: 'row', gap: 8 },
  ratingLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#F59E0B', marginTop: 14, letterSpacing: -0.15 },
  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  tagBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  tagBtnActive: { backgroundColor: '#5EA2F5', borderColor: '#5EA2F5' },
  tagText: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#FFFFFF' },
  tagTextActive: { color: '#fff' },
  commentCard: { backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 14, marginBottom: 20 },
  commentInput: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: '#FFFFFF', minHeight: 90, lineHeight: 21 },
  submitBtn: { height: 56, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 6 },
  submitBtnDisabled: { shadowOpacity: 0 },
  submitBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.16 },
  submitBtnTextDisabled: { color: '#9CA3AF' },
  thankYou: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  thankTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 22, color: '#FFFFFF', letterSpacing: -0.44, marginBottom: 10, textAlign: 'center' },
  thankSub: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: '#98B6D8', textAlign: 'center', lineHeight: 21, marginBottom: 32 },
  doneBtn: { height: 52, paddingHorizontal: 32, borderRadius: 999, backgroundColor: '#5EA2F5', alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#fff' },
});
