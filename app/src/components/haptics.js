import React from 'react';
import {
  TouchableOpacity as RNTouchableOpacity,
  Pressable as RNPressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Light tactile tick fired on every button press. Wrapped in a try/catch-style
// `.catch` so it never throws on devices/emulators without a haptics engine.
function tick() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

// Drop-in replacements for react-native's TouchableOpacity / Pressable that add
// a haptic tick before the original onPress runs. JSX usage is unchanged — every
// screen simply imports these instead of the bare react-native components.
export const TouchableOpacity = React.forwardRef(function TouchableOpacity(
  { onPress, ...props }, ref,
) {
  const handlePress = onPress
    ? (e) => { tick(); onPress(e); }
    : undefined;
  return <RNTouchableOpacity ref={ref} {...props} onPress={handlePress} />;
});

export const Pressable = React.forwardRef(function Pressable(
  { onPress, ...props }, ref,
) {
  const handlePress = onPress
    ? (e) => { tick(); onPress(e); }
    : undefined;
  return <RNPressable ref={ref} {...props} onPress={handlePress} />;
});
