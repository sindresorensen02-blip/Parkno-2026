import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Pressable,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, shadow, typography } from '../theme';
import Icon from './Icon';

// ── GlassCard ─────────────────────────────────────────────────
export function GlassCard({ children, style, padding = 20, radius = radii.card, strong = false, onPress }) {
  const intensity = strong ? 60 : 40;
  return (
    <Pressable onPress={onPress} style={[styles.glassWrap, { borderRadius: radius }, style]}>
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.72)' }]} />
      <View style={[styles.glassInner, { padding, borderRadius: radius }]}>
        {children}
      </View>
    </Pressable>
  );
}

// ── PrimaryButton (charcoal pill) ─────────────────────────────
export function PrimaryButton({ children, onPress, full = false, icon, style, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      style={[
        styles.primaryBtn,
        full && styles.fullWidth,
        disabled && styles.disabledBtn,
        style,
      ]}
    >
      <Text style={styles.primaryBtnText}>{children}</Text>
      {icon && (
        <View style={styles.primaryBtnIcon}>
          {icon}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── GlassButton (frosted pill) ────────────────────────────────
export function GlassButton({ children, onPress, style, icon }) {
  return (
    <Pressable onPress={onPress} style={[styles.glassBtn, style]}>
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.72)' }]} />
      <View style={styles.glassBtnInner}>
        {icon}
        <Text style={styles.glassBtnText}>{children}</Text>
      </View>
    </Pressable>
  );
}

// ── HostCTAButton (mint pill) ─────────────────────────────────
export function HostCTAButton({ children, onPress, full = false, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.hostCTA, full && styles.fullWidth, style]}
    >
      <Text style={styles.hostCTAText}>{children}</Text>
    </TouchableOpacity>
  );
}

// ── IconButton ────────────────────────────────────────────────
export function IconButton({ children, onPress, size = 44, dark = false, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.iconBtn,
        { width: size, height: size, borderRadius: size / 2 },
        dark ? styles.iconBtnDark : styles.iconBtnLight,
        style,
      ]}
    >
      {!dark && (
        <View style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2, backgroundColor: 'rgba(255,255,255,0.72)' }]} />
      )}
      <View style={styles.iconBtnInner}>{children}</View>
    </Pressable>
  );
}

// ── FilterPill ────────────────────────────────────────────────
export function FilterPill({ children, active = false, onPress, icon, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive, style]}>
      {!active && (
        <View style={[StyleSheet.absoluteFillObject, { borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.72)' }]} />
      )}
      <View style={styles.filterPillInner}>
        {icon}
        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{children}</Text>
      </View>
    </Pressable>
  );
}

// ── SearchBar ─────────────────────────────────────────────────
export function SearchBar({ value = '', placeholder = 'Hvor skal du?', onChangeText, voice = true, style }) {
  return (
    <Pressable style={[styles.searchBar, style]}>
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.72)' }]} />
      <View style={styles.searchBarInner}>
        <Icon name="search" size={20} color={colors.fg3} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.fg3}
          style={styles.searchInput}
        />
        {voice && (
          <View style={styles.voiceBtn}>
            <Icon name="mic" size={16} color="#fff" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ── PriceBadge ────────────────────────────────────────────────
export function PriceBadge({ price, unit = 'kr/t', dark = true, style }) {
  return (
    <View style={[styles.priceBadge, dark ? styles.priceBadgeDark : styles.priceBadgeLight, style]}>
      <Text style={[styles.priceBadgeValue, dark ? styles.textWhite : styles.textDark]}>{price}</Text>
      <Text style={[styles.priceBadgeUnit, dark ? styles.textWhiteMuted : styles.textDarkMuted]}> {unit}</Text>
    </View>
  );
}

// ── RatingBadge ───────────────────────────────────────────────
export function RatingBadge({ rating, style }) {
  return (
    <View style={[styles.ratingBadge, style]}>
      <Icon name="star" size={12} color={colors.fg1} fill={colors.fg1} strokeWidth={0} />
      <Text style={styles.ratingText}> {rating}</Text>
    </View>
  );
}

// ── AvailabilityBadge ─────────────────────────────────────────
const AVAIL = {
  available: { label: 'Ledig',   dot: '#9FD6B4' },
  premium:   { label: 'Premium', dot: '#5FAFD3' },
  booked:    { label: 'Opptatt', dot: '#7B8589' },
  new:       { label: 'Ny',      dot: null },
};
export function AvailabilityBadge({ status = 'available', style }) {
  const cfg = AVAIL[status] || AVAIL.available;
  return (
    <View style={[styles.availBadge, style]}>
      {cfg.dot && <View style={[styles.availDot, { backgroundColor: cfg.dot }]} />}
      <Text style={styles.availText}>{cfg.label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // GlassCard
  glassWrap: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...shadow(1),
  },
  glassInner: {
    position: 'relative',
  },

  // PrimaryButton
  primaryBtn: {
    height: 56,
    paddingHorizontal: 22,
    borderRadius: radii.pill,
    backgroundColor: colors.charcoal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...shadow(3),
  },
  primaryBtnText: {
    ...typography.bodyMd,
    color: '#fff',
    fontFamily: 'System', fontWeight: '600',
    fontSize: 16,
    letterSpacing: -0.16,
    flex: 1,
  },
  primaryBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  disabledBtn: { opacity: 0.4 },

  // GlassButton
  glassBtn: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    ...shadow(1),
  },
  glassBtnInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  glassBtnText: {
    ...typography.bodyMd,
    color: colors.fg1,
    fontFamily: 'System', fontWeight: '600',
    fontSize: 16,
  },

  // HostCTA
  hostCTA: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: radii.pill,
    backgroundColor: '#DCEBDF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(1),
  },
  hostCTAText: {
    ...typography.bodyMd,
    fontFamily: 'System', fontWeight: '700',
    fontSize: 16,
    color: colors.fg1,
  },

  // IconButton
  iconBtn: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(1),
  },
  iconBtnDark: { backgroundColor: colors.charcoal },
  iconBtnLight: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  iconBtnInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // FilterPill
  filterPill: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    overflow: 'hidden',
    flexShrink: 0,
    ...shadow(1),
  },
  filterPillActive: { backgroundColor: colors.charcoal },
  filterPillInactive: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  filterPillInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPillText: {
    fontFamily: 'System', fontWeight: '600',
    fontSize: 13,
    color: colors.fg1,
  },
  filterPillTextActive: { color: '#fff' },

  // SearchBar
  searchBar: {
    height: 56,
    borderRadius: radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    ...shadow(1),
  },
  searchBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'System', fontWeight: '500',
    fontSize: 16,
    color: colors.fg1,
  },
  voiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // PriceBadge
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 3,
  },
  priceBadgeDark: { backgroundColor: colors.charcoal },
  priceBadgeLight: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  priceBadgeValue: {
    fontFamily: 'System', fontWeight: '700',
    fontSize: 14,
  },
  priceBadgeUnit: {
    fontFamily: 'System', fontWeight: '500',
    fontSize: 12,
    opacity: 0.7,
  },
  textWhite: { color: '#fff' },
  textDark:  { color: colors.fg1 },
  textWhiteMuted: { color: 'rgba(255,255,255,0.7)' },
  textDarkMuted:  { color: 'rgba(23,33,31,0.7)' },

  // RatingBadge
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  ratingText: {
    fontFamily: 'System', fontWeight: '700',
    fontSize: 12,
    color: colors.fg1,
  },

  // AvailabilityBadge
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  availDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  availText: {
    fontFamily: 'System', fontWeight: '600',
    fontSize: 12,
    color: colors.fg1,
  },
});
