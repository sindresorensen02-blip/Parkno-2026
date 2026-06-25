import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from './haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import Icon from './Icon';

const TABS = [
  { id: 'Kart',      icon: 'map',   label: 'Kart' },
  { id: 'Aktivitet', icon: 'clock', label: 'Aktivitet' },
  { id: 'Profil',    icon: 'user',  label: 'Profil' },
];

// Waymo-style nav: no solid bar. Content dissolves into the canvas via a fade
// gradient, then a row of line-icon + label tabs sits on the bg. Selection is
// shown by color + stroke weight only — no pill, no gradient.
export default function BottomNav({ activeTab = 'Kart', onTabPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      {/* Fade overlay — content dissolves into the bar, reaching full nav bg at
          ~the vertical middle of the tab icons. Multi-stop smoothstep curve so
          the ramp is eased at both ends (no visible seam, top or bottom). */}
      <LinearGradient
        colors={[
          'rgba(31,42,57,0)',
          'rgba(31,42,57,0.10)',
          'rgba(31,42,57,0.28)',
          'rgba(31,42,57,0.50)',
          'rgba(31,42,57,0.72)',
          'rgba(31,42,57,0.90)',
          'rgba(31,42,57,1)',
        ]}
        locations={[0, 0.2, 0.35, 0.5, 0.65, 0.8, 1]}
        style={styles.fade}
        pointerEvents="none"
      />
      <View style={styles.bar} />
      <View style={styles.inner}>
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          const tint = active ? colors.textPrimary : colors.textSecondary;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabPress && onTabPress(tab.id)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Icon
                name={tab.icon}
                size={24}
                color={tint}
                strokeWidth={active ? 2 : 1.8}
              />
              <Text style={[styles.tabLabel, { color: tint, fontWeight: active ? '600' : '500' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
  },
  // Fade runs from 40px above the bar down to ~the icon middle (top: 28), where
  // the solid bar begins — so the dissolve lands on the middle of the symbols.
  // The longer ramp + eased stops keep the transition soft.
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -40,
    height: 68,
  },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 28,
    bottom: 0,
    backgroundColor: colors.navBg,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  tabLabel: {
    fontFamily: 'System',
    fontSize: 11,
    letterSpacing: 0.1,
  },
});
