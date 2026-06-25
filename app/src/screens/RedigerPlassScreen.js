import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Switch, Modal } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { useSpots } from '../context/SpotsContext';

export default function RedigerPlassScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { updateSpot, deleteSpot } = useSpots();
  const spot = route.params?.spot;

  const [price, setPrice] = useState(spot?.price ?? '');
  const [active, setActive] = useState(spot?.active ?? true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const save = () => {
    const activeLabel = active ? 'Aktiv' : 'Pause · gjenoppta';
    const reservations = spot.sub.match(/\d+ reservasjoner/)?.[0] ?? '0 reservasjoner';
    updateSpot(spot.id, {
      price,
      active,
      sub: active ? `Aktiv · ${reservations}` : 'Pause · gjenoppta',
    });
    navigation.goBack();
  };

  const confirmDelete = () => {
    deleteSpot(spot.id);
    setShowDeleteModal(false);
    navigation.popToTop();
  };

  if (!spot) return null;

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#2B394C', '#2B394C']} style={StyleSheet.absoluteFillObject} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rediger plass</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Spot title card */}
        <View style={styles.titleCard}>
          <View style={[styles.dot, { backgroundColor: active ? 'rgba(159,214,180,0.3)' : 'rgba(255,255,255,0.07)' }]}>
            <View style={[styles.dotInner, { backgroundColor: active ? '#5EA2F5' : '#98B6D8' }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.spotTitle}>{spot.title}</Text>
            <Text style={styles.spotSub}>{active ? spot.sub : 'Pause · gjenoppta'}</Text>
          </View>
        </View>

        {/* Active toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STATUS</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.rowLabel}>Aktiv utleie</Text>
                <Text style={styles.rowHint}>{active ? 'Plassen er synlig og kan reserveres' : 'Utleien er satt på pause'}</Text>
              </View>
              <Switch
                value={active}
                onValueChange={setActive}
                trackColor={{ false: 'rgba(17,20,22,0.12)', true: 'rgba(159,214,180,0.6)' }}
                thumbColor={active ? '#5EA2F5' : '#fff'}
              />
            </View>
          </View>
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRIS</Text>
          <View style={styles.card}>
            <Text style={styles.rowLabel}>Timespris</Text>
            <Text style={styles.rowHint}>Sett din ønskede pris per time</Text>
            <View style={styles.priceInputRow}>
              <TextInput keyboardAppearance="dark"
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#6E809B"
              />
              <Text style={styles.priceUnit}>kr / t</Text>
            </View>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={save}>
          <LinearGradient
            colors={['#5EA2F5', '#2F8055']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 999 }]}
          />
          <Text style={styles.saveBtnText}>Lagre endringer</Text>
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.85} onPress={() => setShowDeleteModal(true)}>
          <Text style={styles.deleteBtnText}>Slett annonse</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delete confirmation modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconWrap}>
              <Icon name="x" size={22} color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>Slett annonse?</Text>
            <Text style={styles.modalBody}>
              {spot.title} vil bli fjernet fra Parkno og ikke lenger være synlig for leietakere.
            </Text>
            <TouchableOpacity style={styles.modalDelete} activeOpacity={0.85} onPress={confirmDelete}>
              <Text style={styles.modalDeleteText}>Ja, slett</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} activeOpacity={0.85} onPress={() => setShowDeleteModal(false)}>
              <Text style={styles.modalCancelText}>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.32 },

  titleCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 24 },
  dot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dotInner: { width: 10, height: 10, borderRadius: 5 },
  spotTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#FFFFFF', letterSpacing: -0.15 },
  spotSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 2 },

  section: { marginBottom: 20 },
  sectionLabel: { fontFamily: 'System', fontWeight: '700', fontSize: 11, color: '#98B6D8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 22, padding: 18, shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontFamily: 'System', fontWeight: '600', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.14, marginBottom: 2 },
  rowHint: { fontFamily: 'System', fontWeight: '400', fontSize: 12, color: '#98B6D8', marginTop: 1 },

  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  priceInput: { flex: 1, height: 52, borderRadius: 14, backgroundColor: '#3B4C69', borderWidth: 1, borderColor: 'rgba(17,20,22,0.08)', paddingHorizontal: 16, fontFamily: 'System', fontWeight: '700', fontSize: 24, color: '#FFFFFF', letterSpacing: -0.48 },
  priceUnit: { fontFamily: 'System', fontWeight: '600', fontSize: 16, color: '#98B6D8' },

  saveBtn: { height: 56, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#5EA2F5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 6 },
  saveBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#fff', letterSpacing: -0.16 },

  deleteBtn: { height: 52, borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#DC2626', letterSpacing: -0.15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(17,20,22,0.5)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalBox: { width: '100%', backgroundColor: '#3A4C68', borderRadius: 28, padding: 28, alignItems: 'center' },
  modalIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 20, color: '#FFFFFF', letterSpacing: -0.4, marginBottom: 10, textAlign: 'center' },
  modalBody: { fontFamily: 'System', fontWeight: '400', fontSize: 14, color: '#98B6D8', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalDelete: { width: '100%', height: 52, borderRadius: 999, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  modalDeleteText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#fff', letterSpacing: -0.15 },
  modalCancel: { width: '100%', height: 52, borderRadius: 999, backgroundColor: '#50607A', alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontFamily: 'System', fontWeight: '700', fontSize: 15, color: '#FFFFFF', letterSpacing: -0.15 },
});
