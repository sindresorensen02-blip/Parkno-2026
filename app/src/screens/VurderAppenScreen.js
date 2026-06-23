import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
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
        <LinearGradient colors={['#F7F7F2', '#F7F7F2']} style={StyleSheet.absoluteFillObject} />
        <View style={s.thankYou}>
          <View style={s.checkCircle}>
            <LinearGradient colors={['#10B981', '#2563EB']} style={[StyleSheet.absoluteFillObject, { borderRadius: 40 }]} />
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
      <LinearGradient colors={['#F7F7F2', '#F7F7F2']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Icon name="arrow-left" size={20} color="#111416" />
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
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={rating > 0 && rating <= 2 ? 'Hva kan vi forbedre?' : 'Hva likte du best?'}
            placeholderTextColor="#C4CACC"
            multiline
            numberOfLines={4}
            style={s.commentInput}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity onPress={submit} style={[s.submitBtn, rating === 0 && s.submitBtnDisabled]} activeOpacity={0.88}>
          <LinearGradient colors={rating > 0 ? ['#10B981', '#14B8A6', '#2563EB'] : ['#E5E7EB', '#E5E7EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]} />
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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#111416', letterSpacing: -0.32 },
  starsSection: { alignItems: 'center', marginBottom: 32 },
  starsTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 20, color: '#111416', letterSpacing: -0.4, marginBottom: 6 },
  starsSub: { fontFamily: 'System', fontWeight: '500', fontSize: 13, color: '#7B8589', marginBottom: 20 },
  starsRow: { flexDirection: 'row', gap: 8 },
  ratingLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#F59E0B', marginTop: 14, letterSpacing: -0.15 },
  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#7B8589', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  tagBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  tagBtnActive: { backgroundColor: '#111416', borderColor: '#111416' },
  tagText: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#111416' },
  tagTextActive: { color: '#fff' },
  commentCard: { backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', borderRadius: 18, padding: 14, marginBottom: 20 },
  commentInput: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: '#111416', minHeight: 90, lineHeight: 21 },
  submitBtn: { height: 56, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 6 },
  submitBtnDisabled: { shadowOpacity: 0 },
  submitBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.16 },
  submitBtnTextDisabled: { color: '#9CA3AF' },
  thankYou: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  thankTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 22, color: '#111416', letterSpacing: -0.44, marginBottom: 10, textAlign: 'center' },
  thankSub: { fontFamily: 'System', fontWeight: '500', fontSize: 14, color: '#7B8589', textAlign: 'center', lineHeight: 21, marginBottom: 32 },
  doneBtn: { height: 52, paddingHorizontal: 32, borderRadius: 999, backgroundColor: '#111416', alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#fff' },
});
