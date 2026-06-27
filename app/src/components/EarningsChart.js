import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutAnimation, UIManager, Platform } from 'react-native';
import { TouchableOpacity } from './haptics';
import Icon from './Icon';
import { formatKr, MONTH_NAMES_NB, trendPct } from '../lib/format';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MAX = 5000;
// type: 'done' (completed) | 'progress' (current) | 'ghost' (future)
const DEFAULT_DATA = [
  { label: 'Jan', monthIndex: 0, value: 1850, type: 'done' },
  { label: 'Feb', monthIndex: 1, value: 2640, type: 'done' },
  { label: 'Mar', monthIndex: 2, value: 3200, type: 'done' },
  { label: 'Apr', monthIndex: 3, value: 3740, type: 'done' },
  { label: 'Mai', monthIndex: 4, value: 4280, type: 'done' },
  { label: 'Jun', monthIndex: 5, value: 2480, type: 'progress', proj: 4200 },
  { label: 'Jul', monthIndex: 6, value: 0,    type: 'ghost',    proj: 4600 },
];

// Last completed (done) month — default selection.
function lastDoneIndex(data) {
  for (let i = data.length - 1; i >= 0; i--) if (data[i].type === 'done') return i;
  return data.length - 1;
}

const YEARS = [2026, 2025];

export default function EarningsChart({ data = DEFAULT_DATA, showProjection = false, showGoal = false, onYtdPress, preview = false }) {
  const [selected, setSelected] = useState(() => lastDoneIndex(data));
  const [year, setYear] = useState(YEARS[0]);
  const [yearOpen, setYearOpen] = useState(false);
  const sel = data[selected];

  // Compact, non-interactive bars-only render for embedding in a small card.
  if (preview) {
    return (
      <View style={s.previewBars}>
        {data.map((d) => {
          const hPct = Math.max(6, (d.value / MAX) * 100);
          const isSolid = d.type === 'done';
          return (
            <View key={d.label} style={s.previewCol}>
              <View
                style={[
                  isSolid ? s.solidBar : s.ghostBar,
                  { height: `${hPct}%`, borderRadius: 3 },
                ]}
              />
            </View>
          );
        })}
      </View>
    );
  }

  const select = (i) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(280, 'easeInEaseOut', 'scaleY'));
    setSelected(i);
  };

  // Headline copy by selected month type.
  const monthName = MONTH_NAMES_NB[sel.monthIndex];
  const headline =
    sel.type === 'done'     ? { verb: 'Du tjente',    amount: sel.value, period: `i ${monthName}` }
  : sel.type === 'progress' ? { verb: 'Du har tjent', amount: sel.value, period: `i ${monthName} så langt` }
  :                           { verb: 'På vei mot',   amount: sel.proj ?? sel.value, period: `i ${monthName}` };

  const prev = data[selected - 1];
  const selBasis = sel.type === 'ghost' ? (sel.proj ?? 0) : sel.value;
  const prevBasis = prev ? (prev.type === 'ghost' ? (prev.proj ?? 0) : prev.value) : 0;
  const pct = prev ? trendPct(selBasis, prevBasis) : null;
  const showTrend = pct !== null && selected > 0;

  const ytd = data.filter(d => d.type !== 'ghost').reduce((sum, d) => sum + d.value, 0);

  return (
    <View>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.sectionTitle}>Innsikt</Text>
        <View style={s.yearWrap}>
          <TouchableOpacity style={s.yearPill} onPress={() => setYearOpen(o => !o)}>
            <Text style={s.yearText}>{year}</Text>
            <Icon name={yearOpen ? 'chevron-up' : 'chevron-down'} size={14} color="#6E809B" strokeWidth={2} />
          </TouchableOpacity>
          {yearOpen && (
            <View style={s.yearMenu}>
              {YEARS.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[s.yearOption, y === year && s.yearOptionActive]}
                  onPress={() => { setYear(y); setYearOpen(false); }}
                >
                  <Text style={[s.yearOptionText, y === year && s.yearOptionTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Headline */}
      <View style={s.headline}>
        <Text style={s.hVerb}>{headline.verb}</Text>
        <Text style={s.hAmount}>{formatKr(headline.amount)}</Text>
        <Text style={s.hPeriod}>{headline.period}</Text>
      </View>

      {/* Trend chip */}
      {showTrend && (
        <View style={s.trendChip}>
          <Icon name="trending-up" size={13} color="#19C98C" strokeWidth={2.2} />
          <Text style={s.trendText}>{pct >= 0 ? '+' : ''}{pct} % mot {prev.label}</Text>
        </View>
      )}

      {/* Chart */}
      <View style={s.chartRow}>
        {/* Y axis gutter */}
        <View style={s.yAxis}>
          <Text style={s.yLabel}>{formatKr(5000)}</Text>
          <Text style={s.yLabel}>{formatKr(2500)}</Text>
          <Text style={s.yLabel}>{formatKr(0)}</Text>
        </View>

        {/* Plot */}
        <View style={s.plot}>
          {/* gridlines */}
          <View style={[s.gridline, { top: 0 }]} />
          <View style={[s.gridline, { top: '50%' }]} />
          <View style={[s.gridline, s.baseline, { bottom: 0 }]} />

          {/* goal line (off by default) */}
          {showGoal && (
            <View style={[s.goalLine, { bottom: `${(4000 / MAX) * 100}%` }]} />
          )}

          {/* bars */}
          <View style={s.bars}>
            {data.map((d, i) => {
              const hPct = Math.max(2, (d.value / MAX) * 100);
              const ghostPct = Math.max(2, ((d.proj ?? d.value) / MAX) * 100);
              const isSolid = d.type === 'done';
              return (
                <TouchableOpacity key={d.label} style={s.col} activeOpacity={0.9} onPress={() => select(i)}>
                  {/* ghost track for non-done months */}
                  {!isSolid && <View style={[s.ghostBar, { height: `${ghostPct}%` }]} />}
                  {/* solid green bar for done months */}
                  {isSolid && <View style={[s.solidBar, { height: `${hPct}%` }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Month labels */}
      <View style={s.monthRow}>
        <View style={s.monthGutter} />
        <View style={s.monthLabels}>
          {data.map((d, i) => {
            const isSel = i === selected;
            return (
              <TouchableOpacity key={d.label} style={s.monthCell} activeOpacity={0.9} onPress={() => select(i)}>
                <View style={[s.monthPill, isSel && s.monthPillSel]}>
                  <Text numberOfLines={1} style={[s.monthText, isSel && s.monthTextSel]}>{d.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* YTD link */}
      <TouchableOpacity style={s.ytd} onPress={onYtdPress}>
        <Text style={s.ytdText}>{formatKr(ytd)} hittil i år</Text>
        <Icon name="chevron-right" size={15} color="#FFFFFF" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const HANKEN_800 = 'HankenGrotesk_800ExtraBold';
const HANKEN_700 = 'HankenGrotesk_700Bold';
const HANKEN_600 = 'HankenGrotesk_600SemiBold';

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, zIndex: 10 },
  sectionTitle: { fontFamily: HANKEN_700, fontSize: 19, color: '#FFFFFF' },
  yearWrap: { position: 'relative', zIndex: 10 },
  yearPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(152,182,216,0.18)' },
  yearText: { fontFamily: HANKEN_700, fontSize: 13, color: '#FFFFFF' },
  yearMenu: { position: 'absolute', top: 38, right: 0, minWidth: 96, borderRadius: 14, backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(152,182,216,0.18)', paddingVertical: 4, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 },
  yearOption: { paddingHorizontal: 14, paddingVertical: 9 },
  yearOptionActive: { backgroundColor: 'rgba(255,255,255,0.06)' },
  yearOptionText: { fontFamily: HANKEN_700, fontSize: 14, color: '#98B6D8' },
  yearOptionTextActive: { color: '#FFFFFF' },

  headline: { marginTop: 4, marginBottom: 12 },
  hVerb: { fontFamily: HANKEN_800, fontSize: 41, lineHeight: 43, letterSpacing: -1.4, color: '#FFFFFF' },
  hAmount: { fontFamily: HANKEN_800, fontSize: 41, lineHeight: 43, letterSpacing: -1.4, color: '#0E9E6E', fontVariant: ['tabular-nums'] },
  hPeriod: { fontFamily: HANKEN_800, fontSize: 41, lineHeight: 43, letterSpacing: -1.4, color: '#FFFFFF' },

  trendChip: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(14,158,110,0.18)', marginBottom: 18 },
  trendText: { fontFamily: HANKEN_700, fontSize: 12.5, color: '#19C98C' },

  chartRow: { flexDirection: 'row', height: 206 },
  yAxis: { width: 44, justifyContent: 'space-between', paddingRight: 6 },
  yLabel: { fontFamily: HANKEN_600, fontSize: 10, color: '#6E809B', textAlign: 'right' },
  plot: { flex: 1, position: 'relative' },
  gridline: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(152,182,216,0.13)' },
  baseline: { backgroundColor: 'rgba(152,182,216,0.24)' },
  goalLine: { position: 'absolute', left: 0, right: 0, height: 0, borderTopWidth: 1, borderColor: 'rgba(152,182,216,0.45)', borderStyle: 'dashed' },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  col: { flex: 1, minWidth: 0, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  previewBars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  previewCol: { flex: 1, minWidth: 0, height: '100%', justifyContent: 'flex-end' },
  solidBar: { width: '100%', borderRadius: 9, backgroundColor: '#0E9E6E' },
  ghostBar: { width: '100%', borderRadius: 9, backgroundColor: 'rgba(152,182,216,0.13)' },

  monthRow: { flexDirection: 'row', marginTop: 8 },
  monthGutter: { width: 44 },
  monthLabels: { flex: 1, flexDirection: 'row', gap: 16 },
  monthCell: { flex: 1, minWidth: 0, alignItems: 'center' },
  monthPill: { paddingHorizontal: 2, paddingVertical: 3, borderRadius: 999, backgroundColor: 'transparent' },
  monthPillSel: { backgroundColor: '#FFFFFF' },
  monthText: { fontFamily: HANKEN_600, fontSize: 13, color: '#6E809B' },
  monthTextSel: { color: '#2B394C' },

  ytd: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  ytdText: { fontFamily: HANKEN_700, fontSize: 14.5, color: '#FFFFFF', textDecorationLine: 'underline' },
});
