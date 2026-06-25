import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { TouchableOpacity, Pressable } from './haptics';

import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, shadow, accentGlow, accentGrad, typography } from '../theme';
import Icon from './Icon';

// ── Surface (was GlassCard) ───────────────────────────────────
// Dark elevated card. `strong` lifts it one surface level higher.
export function GlassCard({ children, style, padding = 20, radius = radii.card, strong = false, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.surfaceWrap, { borderRadius: radius }, style]}>
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: radius, backgroundColor: strong ? colors.surface2 : colors.surface1 }]} />
      <View style={[styles.surfaceInner, { padding, borderRadius: radius }]}>
        {children}
      </View>
    </Pressable>
  );
}
export const Surface = GlassCard;

// ── PrimaryButton (the single accent CTA per screen) ──────────
export function PrimaryButton({ children, onPress, full = false, icon, style, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.primaryBtn,
        full && styles.fullWidth,
        disabled && styles.disabledBtn,
        style,
      ]}
    >
      <LinearGradient
        colors={accentGrad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: radii.pill }]}
      />
      <Text style={styles.primaryBtnText}>{children}</Text>
      {icon && (
        <View style={styles.primaryBtnIcon}>
          {icon}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── OutlineButton (Waymo secondary — transparent + hairline) ──
export function OutlineButton({ children, onPress, full = false, icon, style, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.outlineBtn, full && styles.fullWidth, disabled && styles.disabledBtn, style]}
    >
      {icon}
      <Text style={styles.outlineBtnText}>{children}</Text>
    </TouchableOpacity>
  );
}

// ── GlassButton (subtle filled dark pill) ─────────────────────
export function GlassButton({ children, onPress, style, icon }) {
  return (
    <Pressable onPress={onPress} style={[styles.glassBtn, style]}>
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: radii.pill, backgroundColor: colors.surface2 }]} />
      <View style={styles.glassBtnInner}>
        {icon}
        <Text style={styles.glassBtnText}>{children}</Text>
      </View>
    </Pressable>
  );
}

// ── HostCTAButton (accent pill) ───────────────────────────────
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
        style,
      ]}
    >
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2, backgroundColor: colors.surface2 }]} />
      <View style={styles.iconBtnInner}>{children}</View>
    </Pressable>
  );
}

// ── FilterPill ────────────────────────────────────────────────
export function FilterPill({ children, active = false, onPress, icon, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive, style]}>
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
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: radii.pill, backgroundColor: colors.surface2 }]} />
      <View style={styles.searchBarInner}>
        <Icon name="search" size={20} color={colors.textTertiary} />
        <TextInput keyboardAppearance="dark"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
        />
        {voice && (
          <View style={styles.voiceBtn}>
            <Icon name="mic" size={16} color={colors.onAccent} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ── PriceBadge ────────────────────────────────────────────────
export function PriceBadge({ price, unit = 'kr/t', dark = true, style }) {
  return (
    <View style={[styles.priceBadge, style]}>
      <Text style={[styles.priceBadgeValue, styles.textWhite]}>{price}</Text>
      <Text style={[styles.priceBadgeUnit, styles.textWhiteMuted]}> {unit}</Text>
    </View>
  );
}

// ── RatingBadge ───────────────────────────────────────────────
export function RatingBadge({ rating, style }) {
  return (
    <View style={[styles.ratingBadge, style]}>
      <Icon name="star" size={12} color={colors.warning} fill={colors.warning} strokeWidth={0} />
      <Text style={styles.ratingText}> {rating}</Text>
    </View>
  );
}

// ── AvailabilityBadge ─────────────────────────────────────────
const AVAIL = {
  available: { label: 'Ledig',   dot: colors.success },
  premium:   { label: 'Premium', dot: colors.accent },
  booked:    { label: 'Opptatt', dot: colors.textTertiary },
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
  // Surface / GlassCard
  surfaceWrap: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow(1),
  },
  surfaceInner: {
    position: 'relative',
  },

  // PrimaryButton
  primaryBtn: {
    height: 56,
    paddingHorizontal: 22,
    borderRadius: radii.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...accentGlow(2),
  },
  primaryBtnText: {
    ...typography.bodyMd,
    color: colors.onAccent,
    fontFamily: 'System', fontWeight: '600',
    fontSize: 16,
    letterSpacing: -0.16,
    flex: 1,
  },
  primaryBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  disabledBtn: { opacity: 0.4 },

  // OutlineButton
  outlineBtn: {
    height: 56,
    paddingHorizontal: 22,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  outlineBtnText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontFamily: 'System', fontWeight: '600',
    fontSize: 16,
  },

  // GlassButton
  glassBtn: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textPrimary,
    fontFamily: 'System', fontWeight: '600',
    fontSize: 16,
  },

  // HostCTA
  hostCTA: {
    height: 56,
    paddingHorizontal: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...accentGlow(1),
  },
  hostCTAText: {
    ...typography.bodyMd,
    fontFamily: 'System', fontWeight: '700',
    fontSize: 16,
    color: colors.onAccent,
  },

  // IconButton
  iconBtn: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
  },
  filterPillActive: { backgroundColor: colors.accent },
  filterPillInactive: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textSecondary,
  },
  filterPillTextActive: { color: colors.onAccent },

  // SearchBar
  searchBar: {
    height: 56,
    borderRadius: radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textPrimary,
  },
  voiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
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
    backgroundColor: colors.surface2,
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
  textWhite: { color: colors.textPrimary },
  textWhiteMuted: { color: colors.textSecondary },

  // RatingBadge
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingText: {
    fontFamily: 'System', fontWeight: '700',
    fontSize: 12,
    color: colors.textPrimary,
  },

  // AvailabilityBadge
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  availDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  availText: {
    fontFamily: 'System', fontWeight: '600',
    fontSize: 12,
    color: colors.textPrimary,
  },
});
