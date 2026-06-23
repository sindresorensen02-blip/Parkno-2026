import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';

// iOS 26 / iPadOS 26 "Liquid Glass" tab bar:
// a floating translucent capsule with a detached glass accessory button.

const TABS = [
  { id: 'Hjem',   icon: 'home', label: 'Hjem' },
  { id: 'Kart',   icon: 'map',  label: 'Kart' },
  { id: 'Profil', icon: 'user', label: 'Profil' },
];

const TINT = '#2563EB'; // app accent — active tab adopts this

export default function BottomNav({ activeTab = 'home', onTabPress, onLeiUtPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {/* Primary tab bar — floating glass capsule */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 70 : 90}
        tint="systemChromeMaterialLight"
        style={styles.tabBar}
      >
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabPress && onTabPress(tab.id)}
              style={[styles.tab, active && styles.tabActive]}
              activeOpacity={0.7}
            >
              <Icon
                name={tab.icon}
                size={22}
                color={active ? TINT : 'rgba(17,20,22,0.5)'}
                strokeWidth={active ? 2.4 : 1.8}
              />
              {active && <Text style={styles.tabLabel}>{tab.label}</Text>}
            </TouchableOpacity>
          );
        })}
      </BlurView>

      {/* Detached glass accessory — iOS 26 tab bar accessory button */}
      <TouchableOpacity
        onPress={() => onLeiUtPress && onLeiUtPress()}
        activeOpacity={0.75}
        style={styles.accessoryWrap}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 90}
          tint="systemChromeMaterialLight"
          style={styles.accessory}
        >
          <Icon name="key" size={22} color={TINT} strokeWidth={2.4} />
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const HAIRLINE = 'rgba(255,255,255,0.55)';
const GLASS_SHADOW = {
  shadowColor: '#111416',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.16,
  shadowRadius: 20,
  elevation: 12,
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // The floating glass capsule
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: HAIRLINE,
    ...GLASS_SHADOW,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  // Active tab gets a soft glass highlight behind it
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 18,
  },
  tabLabel: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 14,
    color: TINT,
    letterSpacing: -0.2,
  },
  // Detached accessory button
  accessoryWrap: {
    borderRadius: 999,
    ...GLASS_SHADOW,
  },
  accessory: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: HAIRLINE,
  },
});
