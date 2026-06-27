import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from '../components/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import EarningsChart from '../components/EarningsChart';
import { THREADS, initials } from './MeldingerScreen';
import { useSpots } from '../context/SpotsContext';

// Per-box accent colors (from the app palette) used to theme each placeholder.
const ACCENTS = {
  blue:   '#5EA2F5',
  green:  '#17E6A1',
  purple: '#C58BFF',
};

// Shared card header: title + forward arrow.
function CardHead({ title }) {
  return (
    <View style={styles.cardHead}>
      <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
      <Icon name="arrow-right" size={15} color="#98B6D8" strokeWidth={2.4} />
    </View>
  );
}

// Utbetalinger — mini list of payout rows (status dot + text bars).
function UtbetalingerPreview({ accent }) {
  return (
    <View style={styles.previewFill}>
      {[0.85, 0.68, 0.5].map((w, i) => (
        <View key={i} style={styles.listRow}>
          <View style={[styles.rowDot, { backgroundColor: accent }]} />
          <View style={styles.rowLines}>
            <View style={[styles.lineBar, { width: `${w * 100}%`, backgroundColor: 'rgba(255,255,255,0.22)' }]} />
            <View style={[styles.lineBar, styles.lineThin, { width: `${w * 62}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Meldinger — preview the first real conversation rows (avatar + name + message).
function MeldingerPreview() {
  return (
    <View style={styles.previewFill}>
      {THREADS.slice(0, 3).map((t) => (
        <View key={t.id} style={styles.msgRow}>
          <View style={[styles.avatar, { backgroundColor: hexA(t.accent, 0.22), borderColor: hexA(t.accent, 0.4) }]}>
            <Text style={[styles.avatarText, { color: t.accent }]}>{initials(t.name)}</Text>
          </View>
          <View style={styles.msgLines}>
            <Text style={[styles.msgName, t.unread && styles.msgNameUnread]} numberOfLines={1}>{t.name}</Text>
            <Text style={[styles.msgLast, t.unread && styles.msgLastUnread]} numberOfLines={1}>{t.last}</Text>
          </View>
          {t.unread && <View style={styles.msgUnreadDot} />}
        </View>
      ))}
    </View>
  );
}

// rgba() helper from a #RRGGBB hex + alpha.
function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// Aktivitet tab — currently just hosts the "Lei ut plassen din" card (moved here
// from the profile page) plus a top-left arrow back to the map.
export default function AktivitetScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { spots } = useSpots();
  const showHostInsights = spots.length > 0;

  return (
    <View style={styles.root}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#2B394C' }]} />

      <View style={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}>
        {/* Top-left back arrow */}
        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate('Kart')}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Icon name="arrow-left" size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>

        {/* Top row: Meldinger (left) + Innsikt card (right) */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.box} activeOpacity={0.9} onPress={() => navigation.navigate('Meldinger')}>
            <CardHead title="Meldinger" icon="mail" accent={ACCENTS.purple} />
            <MeldingerPreview accent={ACCENTS.purple} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.box}
            activeOpacity={0.9}
            onPress={() => {
              if (showHostInsights) navigation.navigate('Host');
              else navigation.navigate('LeiUt', { isFirst: false });
            }}
          >
            <View style={styles.insightHead}>
              <Text style={styles.cardTitle} numberOfLines={1}>{showHostInsights ? 'Innsikt' : 'Lei ut'}</Text>
              <Icon name="arrow-right" size={15} color="#98B6D8" strokeWidth={2.4} />
            </View>
            <View style={styles.insightGraph}>
              <EarningsChart preview />
            </View>
          </TouchableOpacity>
        </View>

        {/* Belønninger fills the rest of the screen */}
        <TouchableOpacity style={styles.bigBox} activeOpacity={0.9} onPress={() => navigation.navigate('Belonninger')}>
          <CardHead title="Belønninger" icon="wallet" accent={ACCENTS.green} />
          <UtbetalingerPreview accent={ACCENTS.green} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },

  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },

  // Two equal boxes spanning the full content width, aligned to both edges.
  // Fixed row height + align-stretch keeps both boxes the exact same size
  // regardless of their content.
  topRow: { flexDirection: 'row', alignItems: 'stretch', gap: 14, marginTop: 28, height: 200 },
  box: {
    flex: 1,
    borderRadius: 24, padding: 18, overflow: 'hidden',
    backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24, shadowRadius: 22, elevation: 8,
  },
  bigBox: {
    flex: 1, marginTop: 14, marginBottom: 0,
    borderRadius: 24, padding: 18, overflow: 'hidden',
    backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },

  // Card header: title + forward arrow.
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 17, color: '#FFFFFF', letterSpacing: -0.34, flexShrink: 1 },

  previewFill: { flex: 1, marginTop: 16, justifyContent: 'center', gap: 12 },

  // Reservasjoner — list rows.
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowDot: { width: 8, height: 8, borderRadius: 4 },
  rowLines: { flex: 1, gap: 6 },
  lineBar: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.22)' },
  lineThin: { height: 6, backgroundColor: 'rgba(152,182,216,0.22)' },

  // Meldinger — message rows.
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'System', fontWeight: '700', fontSize: 12 },
  msgLines: { flex: 1, gap: 1 },
  msgName: { fontFamily: 'System', fontWeight: '600', fontSize: 13, color: '#E6EEF8', letterSpacing: -0.2 },
  msgNameUnread: { fontWeight: '800', color: '#FFFFFF' },
  msgLast: { fontFamily: 'System', fontWeight: '400', fontSize: 11.5, color: '#6E809B' },
  msgLastUnread: { fontWeight: '600', color: '#98B6D8' },
  msgUnreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5EA2F5' },

  insightHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  insightGraph: { flex: 1, marginTop: 16 },
});
