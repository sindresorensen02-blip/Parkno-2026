import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';

// Sleek custom duration slider — thin track + small thumb. Drag anywhere on the
// track; the value snaps to `step`. Used on the payment page to pick how long to
// park (and recompute the total).
export default function DurationSlider({ value, min, max, step, onChange }) {
  const widthRef = useRef(0);
  const [pct, setPct] = useState((value - min) / (max - min));

  useEffect(() => { setPct((value - min) / (max - min)); }, [value, min, max]);

  const update = (x) => {
    const w = widthRef.current;
    if (!w) return;
    const p = Math.max(0, Math.min(1, x / w));
    const snapped = Math.round((min + p * (max - min)) / step) * step;
    const clamped = Math.max(min, Math.min(max, snapped));
    setPct((clamped - min) / (max - min));
    onChange(clamped);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => update(e.nativeEvent.locationX),
      onPanResponderMove: (e) => update(e.nativeEvent.locationX),
    })
  ).current;

  return (
    <View
      style={styles.touch}
      onLayout={(e) => { widthRef.current = e.nativeEvent.layout.width; }}
      {...pan.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>
      <View style={[styles.thumb, { left: `${pct * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  touch: { height: 34, justifyContent: 'center' },
  track: { height: 5, borderRadius: 3, backgroundColor: 'rgba(94,162,245,0.20)' },
  fill: { height: 5, borderRadius: 3, backgroundColor: '#5EA2F5' },
  thumb: {
    position: 'absolute',
    top: '50%', marginTop: -8, marginLeft: -8,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 3, borderColor: '#5EA2F5',
    shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 3,
  },
});
