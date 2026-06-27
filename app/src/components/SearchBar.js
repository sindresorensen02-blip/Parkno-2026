import React from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from './haptics';
import Icon from './Icon';

// The single parking search bar. It lives on the map (KartScreen); its leading
// symbol changes with `mode`:
//   • mode="map"  — magnifying glass; the whole bar is a button that opens the
//                   list (onPress). Static placeholder text, not editable.
//   • mode="back" — back arrow (onBack) that closes the list; static text, not
//                   editable. Used by the map while the list overlay is open, so
//                   the same bar simply swaps its symbol search → back.
//   • mode="list" — back arrow + a live TextInput (for screens that own the
//                   query inline).
//
// Every mode renders identical chrome (#3A4C68 pill, blue icon wrap).
const SearchBar = React.forwardRef(function SearchBar(
  { mode = 'map', value, onChangeText, onPress, onBack, loading = false, placeholder = 'Hvor vil du parkere?' },
  ref,
) {
  const isList = mode === 'list';
  const isBack = mode === 'back';
  const showBackArrow = isList || isBack;

  // Leading icon: back arrow (list/back) or magnifying glass (map).
  const Leading = showBackArrow ? (
    <TouchableOpacity onPress={onBack} style={s.iconWrap} hitSlop={8}>
      <Icon name="arrow-left" size={18} color="#5EA2F5" strokeWidth={2.2} />
    </TouchableOpacity>
  ) : (
    <View style={s.iconWrap}>
      <Icon name="search" size={18} color="#5EA2F5" strokeWidth={2.2} />
    </View>
  );

  // Trailing: clear-X when there's text (list), else a spinner (map loading) or
  // the forward arrow hint.
  const Trailing = isList && value?.length > 0 ? (
    <TouchableOpacity onPress={() => onChangeText?.('')} hitSlop={8}>
      <Icon name="x" size={18} color="#98B6D8" strokeWidth={2} />
    </TouchableOpacity>
  ) : loading ? (
    <ActivityIndicator size="small" color="#98B6D8" />
  ) : isBack ? null : (
    <Icon name="arrow-right" size={16} color="#6E809B" strokeWidth={2.2} />
  );

  const body = (
    <>
      {Leading}
      {isList ? (
        <TextInput
          keyboardAppearance="dark"
          ref={ref}
          style={s.value}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6E809B"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      ) : (
        <Text style={[s.value, isBack && { color: '#6E809B' }]} numberOfLines={1}>{placeholder}</Text>
      )}
      {Trailing}
    </>
  );

  // Only on the map (closed) is the whole bar a button that opens the list. In
  // back/list modes the bar is a plain container — the back arrow owns its tap.
  return mode === 'map' ? (
    <TouchableOpacity style={s.bar} activeOpacity={0.85} onPress={onPress}>{body}</TouchableOpacity>
  ) : (
    <View style={s.bar}>{body}</View>
  );
});

export default SearchBar;

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: 18, backgroundColor: '#3A4C68',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 4,
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(94,162,245,0.14)',
    borderWidth: 1, borderColor: 'rgba(94,162,245,0.32)',
    alignItems: 'center', justifyContent: 'center',
  },
  value: { flex: 1, minWidth: 0, fontFamily: 'System', fontWeight: '600', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.2, padding: 0 },
});
