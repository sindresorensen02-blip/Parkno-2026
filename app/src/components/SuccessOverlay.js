import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from './Icon';

/**
 * Full-screen success animation shown between payment and the live booking
 * screen. The choreography:
 *   t=0     backdrop fades in (200ms)
 *   t=50    ring scales 0 → 1 with spring + pulses outward
 *   t=200   checkmark pops in (spring)
 *   t=500   title + subtitle fade up
 * Caller dismisses by unmounting after ~1.2s.
 */
export default function SuccessOverlay({ title = 'Reservasjon bekreftet', subtitle = 'Plassen er din' }) {
  const fade   = useRef(new Animated.Value(0)).current;
  const ring   = useRef(new Animated.Value(0)).current;
  const pulse  = useRef(new Animated.Value(0)).current;
  const check  = useRef(new Animated.Value(0)).current;
  const text   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(ring,  { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    // checkmark pops slightly after the ring lands
    setTimeout(() => {
      Animated.spring(check, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
    }, 200);

    // text fades up last
    setTimeout(() => {
      Animated.timing(text, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }, 480);
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.root, { opacity: fade }]}>
      <LinearGradient
        colors={['rgba(15, 56, 38, 0.92)', 'rgba(20, 56, 70, 0.94)', 'rgba(33, 30, 73, 0.92)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.center}>
        {/* outer pulse ring that fades + scales outward */}
        <Animated.View
          style={[
            styles.pulse,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.0] }) }],
            },
          ]}
        />

        {/* hero ring */}
        <Animated.View
          style={[
            styles.ring,
            { transform: [{ scale: ring }] },
          ]}
        >
          <LinearGradient
            colors={['#10B981', '#14B8A6', '#2563EB']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 80 }]}
          />
          <Animated.View
            style={{
              transform: [{ scale: check }],
              opacity: check,
            }}
          >
            <Icon name="check" size={64} color="#fff" strokeWidth={3} />
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View
        style={{
          opacity: text,
          transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          alignItems: 'center', paddingHorizontal: 28,
        }}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  pulse: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(16, 185, 129, 0.40)',
  },
  ring: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.7, shadowRadius: 30, elevation: 12,
  },
  title: {
    fontFamily: 'System', fontWeight: '800', fontSize: 24,
    color: '#fff', letterSpacing: -0.5, textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'System', fontWeight: '500', fontSize: 14,
    color: 'rgba(255,255,255,0.78)', marginTop: 6, textAlign: 'center',
  },
});
