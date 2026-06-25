import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, Easing, StyleSheet, Text, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from './Icon';

/**
 * ReservationSuccess — Apple-style three-stage confirmation.
 *
 * The Apple aesthetic this targets:
 *   • one focal element at a time
 *   • smooth ease-out curves; springs are critically damped (no wobble)
 *   • soft, single-color glows; no particles, streaks, or flashes
 *   • slow, deliberate timing — animations breathe
 *
 *   1. ANTICIPATION (~480 ms)  — slim accent ring scales up from 0
 *   2. REVEAL       (~520 ms)  — disc fills with gradient, checkmark draws in
 *   3. CELEBRATION  (~700 ms)  — one quiet outward ripple, title fades up
 *
 * Then onComplete() fires.
 *
 * Honours OS Reduce Motion: snaps to the resolved state and fires onComplete
 * after a short delay so flows depending on the callback still progress.
 */

const STAGES = {
  ANTICIPATION: 'anticipation',
  REVEAL:       'reveal',
  CELEBRATION:  'celebration',
  DONE:         'done',
};

const DEFAULT_TIMINGS = {
  anticipation: 480,
  reveal:       520,
  celebration:  700,
};

// Apple's default ease curve. Used for the slow, dignified portions of the
// animation (ring scale-in, fill fade, title rise).
const APPLE_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

export default function ReservationSuccess({
  visible          = true,
  onComplete       = () => {},
  title            = 'Reservasjon bekreftet',
  subtitle         = 'Plassen er din',
  pendingTitle     = 'Sikrer plassen…',
  pendingSubtitle,
  accentColor      = '#5EA2F5',                     // Parkno accent blue
  accentGradient   = ['#4E96F0', '#5EA2F5', '#6FB1F7'],
  backdropColors   = ['rgba(20, 28, 40, 0.90)', 'rgba(31, 42, 57, 0.94)'],
  size             = 140,
  timings          = DEFAULT_TIMINGS,
}) {
  const [stage, setStage] = useState(STAGES.ANTICIPATION);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Animated values — kept minimal on purpose.
  const backdrop = useRef(new Animated.Value(0)).current;   // overlay opacity
  const ring     = useRef(new Animated.Value(0)).current;   // stage 1: outline ring scale
  const fill     = useRef(new Animated.Value(0)).current;   // stage 2: gradient fill opacity
  const check    = useRef(new Animated.Value(0)).current;   // stage 2: checkmark scale/opacity
  const settle   = useRef(new Animated.Value(0)).current;   // stage 3: gentle settle pop
  const ripple   = useRef(new Animated.Value(0)).current;   // stage 3: outward ripple
  const text     = useRef(new Animated.Value(0)).current;   // stage 3: title fade-up

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    if (!visible) return;

    // Backdrop fades in always — quick but soft.
    Animated.timing(backdrop, { toValue: 1, duration: 240, easing: APPLE_EASE, useNativeDriver: true }).start();

    if (reduceMotion) {
      ring.setValue(1); fill.setValue(1); check.setValue(1); text.setValue(1);
      setStage(STAGES.CELEBRATION);
      const t = setTimeout(() => { setStage(STAGES.DONE); onComplete(); }, 500);
      return () => clearTimeout(t);
    }

    // ── STAGE 1: ANTICIPATION ────────────────────────────────────────
    setStage(STAGES.ANTICIPATION);
    Animated.timing(ring, {
      toValue: 1,
      duration: timings.anticipation,
      easing: APPLE_EASE,
      useNativeDriver: true,
    }).start();

    // ── STAGE 2: REVEAL ──────────────────────────────────────────────
    const stage2 = setTimeout(() => {
      setStage(STAGES.REVEAL);
      Animated.parallel([
        Animated.timing(fill, {
          toValue: 1,
          duration: timings.reveal,
          easing: APPLE_EASE,
          useNativeDriver: true,
        }),
        // Critically-damped spring — the check arrives without wobbling.
        Animated.spring(check, {
          toValue: 1,
          friction: 9,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    }, timings.anticipation);

    // ── STAGE 3: CELEBRATION ─────────────────────────────────────────
    const stage3 = setTimeout(() => {
      setStage(STAGES.CELEBRATION);

      // Subtle settle pop on the disc (Apple Pay tick gives a tiny breath).
      Animated.sequence([
        Animated.timing(settle, { toValue: 1, duration: 160, easing: APPLE_EASE, useNativeDriver: true }),
        Animated.spring(settle, { toValue: 0, friction: 7, tension: 90, useNativeDriver: true }),
      ]).start();

      // One slow ripple expanding outward — the only "celebration" effect.
      Animated.timing(ripple, {
        toValue: 1,
        duration: timings.celebration,
        easing: APPLE_EASE,
        useNativeDriver: true,
      }).start();

      // Title fades up with a small translate.
      Animated.timing(text, {
        toValue: 1, duration: 380, easing: APPLE_EASE, useNativeDriver: true,
      }).start();
    }, timings.anticipation + timings.reveal);

    const done = setTimeout(() => {
      setStage(STAGES.DONE);
      onComplete();
    }, timings.anticipation + timings.reveal + timings.celebration);

    return () => {
      clearTimeout(stage2);
      clearTimeout(stage3);
      clearTimeout(done);
    };
  }, [visible, reduceMotion]);

  if (!visible) return null;

  const showPending = stage === STAGES.ANTICIPATION;

  // disc scale combines the reveal pop + the celebration settle
  const discScale = Animated.add(
    ring,
    settle.interpolate({ inputRange: [0, 1], outputRange: [0, 0.035] }),
  );

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={showPending ? pendingTitle : title}
      style={[StyleSheet.absoluteFillObject, styles.root, { opacity: backdrop }]}
    >
      <LinearGradient
        colors={backdropColors}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.hero}>
        {/* Stage 3 ripple — one slow, soft expanding ring */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ripple,
            {
              width: size, height: size, borderRadius: size / 2,
              borderColor: accentColor,
              opacity: ripple.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.45, 0] }),
              transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
            },
          ]}
        />

        {/* Disc: starts as a thin ring outline, fills with gradient on reveal */}
        <Animated.View
          style={[
            styles.disc,
            {
              width: size, height: size, borderRadius: size / 2,
              shadowColor: accentColor,
              transform: [{ scale: discScale }],
              opacity: ring,
            },
          ]}
        >
          {/* outline ring visible during anticipation, fades as fill comes in */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: size / 2,
                borderWidth: 2.5,
                borderColor: accentColor,
                opacity: fill.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              },
            ]}
          />

          {/* gradient fill */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { opacity: fill, borderRadius: size / 2, overflow: 'hidden' },
            ]}
          >
            <LinearGradient
              colors={accentGradient}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* subtle glossy top — Apple iconography has this soft top-light */}
            <View style={styles.gloss} />
          </Animated.View>

          {/* checkmark */}
          <Animated.View style={{ transform: [{ scale: check }], opacity: check }}>
            <Icon
              name="check"
              size={Math.round(size * 0.46)}
              color="#fff"
              strokeWidth={3.4}
            />
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.titleWrap,
          {
            opacity: showPending ? backdrop : text,
            transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          },
        ]}
      >
        <Text style={styles.title}>{showPending ? pendingTitle : title}</Text>
        {(showPending ? pendingSubtitle : subtitle) ? (
          <Text style={styles.subtitle}>{showPending ? pendingSubtitle : subtitle}</Text>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', justifyContent: 'center', marginBottom: 32 },

  ripple: {
    position: 'absolute',
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  disc: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 12,
  },
  gloss: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: '55%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 999, borderTopRightRadius: 999,
  },

  titleWrap: { alignItems: 'center', paddingHorizontal: 32 },
  title: {
    fontFamily: 'System', fontWeight: '700', fontSize: 22,
    color: '#fff', letterSpacing: -0.4, textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'System', fontWeight: '500', fontSize: 14,
    color: 'rgba(255,255,255,0.62)', marginTop: 6, textAlign: 'center',
  },
});
