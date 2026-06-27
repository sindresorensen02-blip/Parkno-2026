import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

// An iOS-style wheel picker driven by a snapping ScrollView. Swipe up/down to
// scroll; the list snaps to `ITEM_HEIGHT` so one option always lands centered.
// The centered item is rendered bold/white (the "selected number"); neighbours
// fade and shrink toward the edges to give the curved-drum look.
//
// `items` is an array of { value, label }. `value` is the currently selected
// value; `onChange(value)` fires once per new centered item (with a haptic tick).

const ITEM_HEIGHT = 40;

export default function WheelPicker({ items, value, onChange, width = 110, visible = 3 }) {
  // `visible` is the number of rows shown (odd keeps one row exactly centered).
  const VISIBLE = visible % 2 === 0 ? visible + 1 : visible;
  const PAD = Math.floor(VISIBLE / 2);
  const scrollRef = useRef(null);
  const lastIndex = useRef(0);
  const [ready, setReady] = useState(false);

  const selectedIndex = Math.max(0, items.findIndex((it) => it.value === value));

  // Seed scroll position at the selected row so its number renders full-white on
  // first paint — without this, scrollY starts at 0 and the interpolation dims
  // the centered row until the user scrolls.
  const scrollY = useRef(new Animated.Value(selectedIndex * ITEM_HEIGHT)).current;

  // Jump to the selected row on mount and whenever `value` changes from outside
  // (e.g. the end time snapping forward when the start passes it).
  useEffect(() => {
    lastIndex.current = selectedIndex;
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: ready });
  }, [selectedIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMomentumEnd = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (clamped !== lastIndex.current) {
      lastIndex.current = clamped;
      Haptics.selectionAsync().catch(() => {});
      onChange(items[clamped].value);
    }
  };

  return (
    <View style={[styles.wrap, { width, height: ITEM_HEIGHT * VISIBLE }]}>
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        scrollEventThrottle={16}
        onLayout={() => {
          if (!ready) {
            scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
            setReady(true);
          }
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * PAD }}
      >
        {items.map((it, i) => {
          // Distance (in rows) of this item from the centered position.
          const inputRange = [
            (i - 2) * ITEM_HEIGHT,
            (i - 1) * ITEM_HEIGHT,
            i * ITEM_HEIGHT,
            (i + 1) * ITEM_HEIGHT,
            (i + 2) * ITEM_HEIGHT,
          ];
          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.18, 0.4, 1, 0.4, 0.18],
            extrapolate: 'clamp',
          });
          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.74, 0.86, 1, 0.86, 0.74],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View key={it.value} style={[styles.item, { opacity, transform: [{ scale }] }]}>
              <Text style={styles.itemText}>{it.label}</Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Mirrors the bold white "summaryTimeText" look so the numbers keep their
  // current styling.
  itemText: {
    fontFamily: 'System',
    fontWeight: '800',
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
});
