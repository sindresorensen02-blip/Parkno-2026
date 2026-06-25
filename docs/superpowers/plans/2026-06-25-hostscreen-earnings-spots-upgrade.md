# HostScreen Earnings + Spots Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing host dashboard with an interactive monthly earnings chart, a "Kommende" payouts section, and rich 126px spot cards — all static-data, pixel-faithful to the handoff.

**Architecture:** Extract two focused components (`EarningsChart`, `HostSpotCard`) and compose them inside the existing single-scroll [`HostScreen.js`](../../../app/src/screens/HostScreen.js). Keep the 3-tab navigation and push entry. Add Hanken Grotesk font loading in `App.js` for the earnings section only. Data is hardcoded per the handoff this pass; Supabase wiring is a later pass.

**Tech Stack:** Expo 54, React Native 0.81, React 19, expo-linear-gradient, react-native-svg, react-native-safe-area-context, @expo-google-fonts/hanken-grotesk (new).

## Global Constraints

- Background `#2B394C`, card surface `#3A4C68`, photo-well `#2F3D52`. Text: primary `#FFFFFF`, secondary `#98B6D8`, tertiary `#6E809B`. Money green `#0E9E6E`/bars, bright green `#19C98C` (positive trend text), status active `#17E6A1`, paused `#D9A441`, blue gradient `#4E96F0→#5EA2F5`.
- Currency format: `kr ` + integer with a NON-BREAKING THIN SPACE (` `) thousands separator. `4280 → "kr 4 280"`, `18190 → "kr 18 190"`.
- Norwegian full month names: januar, februar, mars, april, mai, juni, juli.
- Hanken Grotesk is used in `EarningsChart` ONLY. Every other component/screen stays `fontFamily: 'System'`.
- Touchables come from `../components/haptics` (NOT bare react-native) — drop-in `TouchableOpacity`.
- Icons come from `../components/Icon` via `<Icon name="..." />`. Available names: arrow-left, arrow-right, bar-chart, bell, chevron-down, chevron-left, chevron-right, chevron-up, map-pin, trending-up, zap (full list in `Icon.js`). There is NO `plus`, NO `more`/`dots`, NO `location-pin` icon — use `map-pin` for the pin, and draw the ••• menu as three inline `<View>` dots.
- Numeric values use `fontVariant: ['tabular-nums']` where the handoff specifies tabular figures.
- Tests: `npm test` (runs `node --test __tests__/search.test.js`) must still pass after every task.

---

### Task 1: Currency + month formatting helpers

**Files:**
- Create: `app/src/lib/format.js`
- Test: `app/__tests__/format.test.js`

**Interfaces:**
- Produces: `formatKr(n: number) => string` (e.g. `"kr 4 280"`, thin-space separated, ` `), `MONTH_NAMES_NB: string[]` (index 0 = "januar" … 6 = "juli").

- [ ] **Step 1: Write the failing test**

```js
// app/__tests__/format.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { formatKr, MONTH_NAMES_NB } = require('../src/lib/format.js');

test('formatKr adds thin-space thousands separator with kr prefix', () => {
  assert.strictEqual(formatKr(4280), 'kr 4 280');
  assert.strictEqual(formatKr(18190), 'kr 18 190');
  assert.strictEqual(formatKr(0), 'kr 0');
});

test('MONTH_NAMES_NB maps index to Norwegian month name', () => {
  assert.strictEqual(MONTH_NAMES_NB[0], 'januar');
  assert.strictEqual(MONTH_NAMES_NB[4], 'mai');
  assert.strictEqual(MONTH_NAMES_NB[6], 'juli');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && node --test __tests__/format.test.js`
Expected: FAIL — `Cannot find module '../src/lib/format.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// app/src/lib/format.js
// Earnings/host formatting helpers. Currency uses a non-breaking thin space
// ( ) as the thousands separator, per the host design spec.
const THIN = ' ';

export function formatKr(n) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  const grouped = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  return `kr ${sign}${grouped}`;
}

export const MONTH_NAMES_NB = [
  'januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli',
  'august', 'september', 'oktober', 'november', 'desember',
];
```

> Note: `app/babel.config.js` uses `babel-preset-expo`, and the test runner imports this file directly via `node --test`. ESM `export` works here because the project's `package.json`/expo toolchain transpiles; if `node --test` rejects `export`, change the two `export` keywords to `module.exports = { formatKr, MONTH_NAMES_NB }` and a `const` declaration. Run Step 2 first to see which form the runner accepts and match the existing `__tests__/search.test.js` style.

- [ ] **Step 3b: Match existing test module style**

Run: `cat app/__tests__/search.test.js | head -5` and `head -5 app/src/` source it imports.
If the existing tests use `require`/`module.exports`, convert `format.js` to CommonJS:

```js
// app/src/lib/format.js (CommonJS variant — use only if require-style is the project convention)
const THIN = ' ';
function formatKr(n) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  const grouped = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
  return `kr ${sign}${grouped}`;
}
const MONTH_NAMES_NB = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'];
module.exports = { formatKr, MONTH_NAMES_NB };
```

Then ensure `EarningsChart` imports it accordingly. RN/Metro handles both `import` and `require`, so the consuming component is unaffected.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && node --test __tests__/format.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/format.js app/__tests__/format.test.js
git commit -m "feat: add kr currency + Norwegian month formatting helpers"
```

---

### Task 2: Trend calculation helper

**Files:**
- Modify: `app/src/lib/format.js`
- Test: `app/__tests__/format.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `trendPct(current: number, prev: number) => number|null` — percentage change rounded to integer, `null` when `prev` is `0` or falsy (no comparison possible).

- [ ] **Step 1: Write the failing test (append to format.test.js)**

```js
const { trendPct } = require('../src/lib/format.js');

test('trendPct returns rounded percentage change', () => {
  assert.strictEqual(trendPct(4280, 3740), 14);   // +14%
  assert.strictEqual(trendPct(2640, 1850), 43);   // +43%
});

test('trendPct returns null when no prior month to compare', () => {
  assert.strictEqual(trendPct(1850, 0), null);
  assert.strictEqual(trendPct(1850, undefined), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && node --test __tests__/format.test.js`
Expected: FAIL — `trendPct is not a function`

- [ ] **Step 3: Add implementation to format.js**

```js
// append to app/src/lib/format.js (match the module style chosen in Task 1)
export function trendPct(current, prev) {
  if (!prev) return null;
  return Math.round(((current - prev) / prev) * 100);
}
// CommonJS: add trendPct to module.exports
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && node --test __tests__/format.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/format.js app/__tests__/format.test.js
git commit -m "feat: add trendPct helper for earnings month-over-month"
```

---

### Task 3: Load Hanken Grotesk font

**Files:**
- Modify: `app/package.json`
- Modify: `app/App.js:203-262` (RootNavigator) and the import block near the top.

**Interfaces:**
- Produces: global availability of font families `HankenGrotesk_600SemiBold`, `HankenGrotesk_700Bold`, `HankenGrotesk_800ExtraBold` once the app has rendered past its loading gate.

- [ ] **Step 1: Install the font package**

Run: `cd app && npm install @expo-google-fonts/hanken-grotesk`
Expected: package added to `dependencies` in `package.json`.

- [ ] **Step 2: Add useFonts gate to RootNavigator**

In `app/App.js`, add to the import block (near the other imports, after line 27):

```js
import { useFonts, HankenGrotesk_600SemiBold, HankenGrotesk_700Bold, HankenGrotesk_800ExtraBold } from '@expo-google-fonts/hanken-grotesk';
```

Inside `RootNavigator()` (currently starts at line 203), add near the top of the function body, before the existing `if (loading)` block:

```js
const [fontsLoaded] = useFonts({
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
});
```

Then extend the existing loading guard so it also waits for fonts. Replace:

```js
  if (loading) {
```

with:

```js
  if (loading || !fontsLoaded) {
```

(The existing returned `<View>…<ActivityIndicator/></View>` loading view is reused as-is.)

- [ ] **Step 3: Verify the app boots with fonts loaded**

Run: `cd app && npx expo start` (or note for manual run). Expected: app reaches the dashboard without a font-related red screen; `useFonts` resolves.
If unable to run interactively, verify statically: `grep -n "fontsLoaded\|HankenGrotesk" app/App.js` shows the hook and guard present.

- [ ] **Step 4: Commit**

```bash
git add app/package.json app/package-lock.json app/App.js
git commit -m "feat: load Hanken Grotesk font for earnings section"
```

---

### Task 4: HostSpotCard component

**Files:**
- Create: `app/src/components/HostSpotCard.js`

**Interfaces:**
- Consumes: `formatKr` from `../lib/format`, `Icon` from `./Icon`, `TouchableOpacity` from `./haptics`.
- Produces: default export `HostSpotCard` with props `{ status: 'active'|'paused', address: string, area: string, weekly: number, price: number|string, photoUrl?: string, onPress?: fn, onMenu?: fn }`.

- [ ] **Step 1: Create the component**

```jsx
// app/src/components/HostSpotCard.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity } from './haptics';
import Icon from './Icon';
import { formatKr } from '../lib/format';

// Rich 126px host listing card: status, address/area, weekly earnings, price on
// the left 60%; photo (or empty state) on the right 40% with a forward arrow on
// the seam. System font (Hanken is earnings-only per the host design spec).
export default function HostSpotCard({ status, address, area, weekly, price, photoUrl, onPress, onMenu }) {
  const active = status === 'active';
  const weeklyNum = Number(weekly) || 0;

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={s.card}>
      {/* Left info */}
      <View style={s.info}>
        <View style={s.statusRow}>
          <View style={[s.dotGlow, { backgroundColor: active ? 'rgba(23,230,161,0.18)' : 'rgba(217,164,65,0.18)' }]}>
            <View style={[s.dot, { backgroundColor: active ? '#17E6A1' : '#D9A441' }]} />
          </View>
          <Text style={s.overline}>{active ? 'AKTIV' : 'PÅ PAUSE'}</Text>
        </View>

        <View>
          <Text style={s.address} numberOfLines={1}>{address}</Text>
          <Text style={s.area}>{area}</Text>
        </View>

        <Text style={s.weekly}>
          <Text style={[s.weeklyAmt, { color: weeklyNum > 0 ? '#17E6A1' : '#6E809B' }]}>{formatKr(weeklyNum)}</Text>
          <Text style={s.weeklyLabel}>  denne uken</Text>
        </Text>

        <View style={s.priceRow}>
          <Text style={s.priceVal}>{price}</Text>
          <Text style={s.priceUnit}> kr/t</Text>
        </View>
      </View>

      {/* Right photo / empty state */}
      <View style={s.photoWell}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={s.empty}>
            <Icon name="map-pin" size={26} color="#50607A" strokeWidth={2} />
          </View>
        )}
        {/* left-edge scrim so the seam reads */}
        <LinearGradient
          colors={['#3A4C68', 'rgba(58,76,104,0)']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={s.scrim}
        />
        {/* ••• menu — three inline dots (no icon for this in Icon.js) */}
        <TouchableOpacity onPress={onMenu} style={s.menu} hitSlop={8}>
          <View style={s.menuDot} /><View style={s.menuDot} /><View style={s.menuDot} />
        </TouchableOpacity>
      </View>

      {/* Forward arrow on the seam */}
      <View style={s.arrowWrap} pointerEvents="none">
        <LinearGradient colors={['#4E96F0', '#5EA2F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.arrowGrad}>
          <Icon name="arrow-right" size={16} color="#fff" strokeWidth={2.2} />
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    height: 126, borderRadius: 28, overflow: 'hidden', flexDirection: 'row',
    backgroundColor: '#3A4C68', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 26, elevation: 6,
  },
  info: { width: '60%', paddingVertical: 15, paddingHorizontal: 16, justifyContent: 'space-between' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dotGlow: { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  overline: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#98B6D8', letterSpacing: 0.8, textTransform: 'uppercase' },
  address: { fontFamily: 'System', fontWeight: '700', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.2 },
  area: { fontFamily: 'System', fontWeight: '500', fontSize: 12, color: '#98B6D8', marginTop: 2 },
  weekly: { },
  weeklyAmt: { fontFamily: 'System', fontWeight: '800', fontSize: 13, fontVariant: ['tabular-nums'] },
  weeklyLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 11, color: '#6E809B' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceVal: { fontFamily: 'System', fontWeight: '800', fontSize: 18, color: '#FFFFFF' },
  priceUnit: { fontFamily: 'System', fontWeight: '600', fontSize: 12, color: '#98B6D8' },

  photoWell: { width: '40%', backgroundColor: '#2F3D52' },
  empty: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scrim: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 40 },
  menu: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(15,22,34,0.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2.5 },
  menuDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#fff' },

  arrowWrap: { position: 'absolute', bottom: 14, left: '60%', marginLeft: -17 },
  arrowGrad: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', shadowColor: '#4E96F0', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
});
```

- [ ] **Step 2: Verify it imports cleanly**

Run: `cd app && node -e "require('@babel/core').transformFileSync('src/components/HostSpotCard.js', { presets: ['babel-preset-expo'] }); console.log('ok')"`
Expected: prints `ok` (compiles without syntax errors).
If `@babel/core` direct transform is awkward, instead run `npx expo start` and confirm no red screen once Task 6 mounts the card.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/HostSpotCard.js
git commit -m "feat: add HostSpotCard rich listing card component"
```

---

### Task 5: EarningsChart component

**Files:**
- Create: `app/src/components/EarningsChart.js`

**Interfaces:**
- Consumes: `formatKr`, `MONTH_NAMES_NB`, `trendPct` from `../lib/format`; `Icon` from `./Icon`; `TouchableOpacity` from `./haptics`.
- Produces: default export `EarningsChart` with props `{ data?: Array<{label,value,type}>, showProjection?: boolean, showGoal?: boolean, onYtdPress?: fn }`. Defaults to the static handoff data and `showProjection=false`, `showGoal=false`.

- [ ] **Step 1: Create the component**

```jsx
// app/src/components/EarningsChart.js
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

export default function EarningsChart({ data = DEFAULT_DATA, showProjection = false, showGoal = false, onYtdPress }) {
  const [selected, setSelected] = useState(() => lastDoneIndex(data));
  const sel = data[selected];

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
  const pct = prev ? trendPct(sel.type === 'ghost' ? (sel.proj ?? 0) : sel.value, prev.type === 'ghost' ? (prev.proj ?? 0) : prev.value) : null;
  const showTrend = pct !== null && selected > 0;

  const ytd = data.filter(d => d.type !== 'ghost').reduce((sum, d) => sum + d.value, 0);

  return (
    <View>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.sectionTitle}>Inntekt</Text>
        <TouchableOpacity style={s.yearPill}>
          <Text style={s.yearText}>2026</Text>
          <Icon name="chevron-down" size={14} color="#6E809B" strokeWidth={2} />
        </TouchableOpacity>
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
              const isSel = i === selected;
              const hPct = Math.max(2, (d.value / MAX) * 100);
              const ghostPct = Math.max(2, ((d.proj ?? d.value) / MAX) * 100);
              const isSolid = d.type === 'done';
              return (
                <TouchableOpacity key={d.label} style={s.col} activeOpacity={0.9} onPress={() => select(i)}>
                  {isSel && (
                    <View style={s.valueChip}>
                      <Text style={s.valueChipText}>{formatKr(d.type === 'ghost' ? (d.proj ?? 0) : d.value)}</Text>
                    </View>
                  )}
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
                  <Text style={[s.monthText, isSel && s.monthTextSel]}>{d.label}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontFamily: HANKEN_700, fontSize: 19, color: '#FFFFFF' },
  yearPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(152,182,216,0.18)' },
  yearText: { fontFamily: HANKEN_700, fontSize: 13, color: '#FFFFFF' },

  headline: { marginTop: 4, marginBottom: 12 },
  hVerb: { fontFamily: HANKEN_800, fontSize: 41, lineHeight: 43, letterSpacing: -1.4, color: '#FFFFFF' },
  hAmount: { fontFamily: HANKEN_800, fontSize: 41, lineHeight: 43, letterSpacing: -1.4, color: '#0E9E6E', fontVariant: ['tabular-nums'] },
  hPeriod: { fontFamily: HANKEN_800, fontSize: 41, lineHeight: 43, letterSpacing: -1.4, color: '#FFFFFF' },

  trendChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(14,158,110,0.18)', marginBottom: 18 },
  trendText: { fontFamily: HANKEN_700, fontSize: 12.5, color: '#19C98C' },

  chartRow: { flexDirection: 'row', height: 206 },
  yAxis: { width: 44, justifyContent: 'space-between', paddingRight: 6, paddingVertical: 0 },
  yLabel: { fontFamily: HANKEN_600, fontSize: 10, color: '#6E809B', textAlign: 'right' },
  plot: { flex: 1, position: 'relative' },
  gridline: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(152,182,216,0.13)' },
  baseline: { backgroundColor: 'rgba(152,182,216,0.24)' },
  goalLine: { position: 'absolute', left: 0, right: 0, height: 0, borderTopWidth: 1, borderColor: 'rgba(152,182,216,0.45)', borderStyle: 'dashed' },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  col: { flex: 1, minWidth: 0, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  solidBar: { width: '100%', borderRadius: 9, backgroundColor: '#0E9E6E' },
  ghostBar: { width: '100%', borderRadius: 9, backgroundColor: 'rgba(152,182,216,0.13)' },
  valueChip: { position: 'absolute', top: 0, alignSelf: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, backgroundColor: '#0E9E6E' },
  valueChipText: { fontFamily: HANKEN_800, fontSize: 11, color: '#FFFFFF', fontVariant: ['tabular-nums'] },

  monthRow: { flexDirection: 'row', marginTop: 8 },
  monthGutter: { width: 44 },
  monthLabels: { flex: 1, flexDirection: 'row', gap: 16 },
  monthCell: { flex: 1, minWidth: 0, alignItems: 'center' },
  monthPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'transparent' },
  monthPillSel: { backgroundColor: '#FFFFFF' },
  monthText: { fontFamily: HANKEN_600, fontSize: 13, color: '#6E809B' },
  monthTextSel: { color: '#2B394C' },

  ytd: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 18 },
  ytdText: { fontFamily: HANKEN_700, fontSize: 14.5, color: '#FFFFFF', textDecorationLine: 'underline' },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `cd app && node -e "require('@babel/core').transformFileSync('src/components/EarningsChart.js', { presets: ['babel-preset-expo'] }); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/EarningsChart.js
git commit -m "feat: add interactive EarningsChart component (static data)"
```

---

### Task 6: Compose components into HostScreen + add Kommende payouts

**Files:**
- Modify: `app/src/screens/HostScreen.js`

**Interfaces:**
- Consumes: `EarningsChart` (default export), `HostSpotCard` (default export), `formatKr` from `../lib/format`.
- Produces: the upgraded host dashboard (no new exports).

- [ ] **Step 1: Add imports**

In `app/src/screens/HostScreen.js`, after the existing `Icon` import (line 6), add:

```js
import EarningsChart from '../components/EarningsChart';
import HostSpotCard from '../components/HostSpotCard';
import { formatKr } from '../lib/format';
```

- [ ] **Step 2: Add static spot + payout data**

Below the imports (after line ~22), add module-level constants:

```js
// Static host listings + payouts (handoff data). Replace with live data later.
const STATIC_SPOTS = [
  { id: '1', address: 'Møhlenprisbakken 12', area: 'Møhlenpris', status: 'active', price: 35, weekly: 1540, photoUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400' },
  { id: '2', address: 'Nygårdsgaten 7',      area: 'Nygård',     status: 'paused', price: 28, weekly: 0,    photoUrl: 'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=400' },
  { id: '3', address: 'Sandviksveien 44',    area: 'Sandviken',  status: 'active', price: 22, weekly: 720,  photoUrl: null },
];
const STATIC_PAYOUTS = [
  { id: 'p1', date: '15. juni', amount: 1920 },
  { id: 'p2', date: '1. juli',  amount: 2480 },
];
```

- [ ] **Step 3: Replace the earnings block with EarningsChart**

In the active-host branch (currently the `<>…</>` containing `styles.periodRow` and `styles.earningsCard`, lines ~193–232), replace that entire fragment with:

```jsx
<EarningsChart onYtdPress={() => {}} />
```

(Removes the period switcher and the old `earningsCard` chart; the `EarningsChart` self-contains its own header/chart/labels.)

- [ ] **Step 4: Replace the payout card with a Kommende section**

Replace the existing payout-card block (the `{!payout.loading && (...) && (<View style={styles.payoutCard}>…</View>)}` block, lines ~234–272) with:

```jsx
{/* Full-bleed divider band */}
<View style={styles.dividerBand} />

{/* Kommende (upcoming payouts) */}
<Text style={styles.kommendeTitle}>Kommende</Text>
<View style={styles.payoutList}>
  {STATIC_PAYOUTS.map((p, i) => (
    <View key={p.id} style={[styles.payoutRow, i < STATIC_PAYOUTS.length - 1 && styles.payoutRowBorder]}>
      <View>
        <Text style={styles.payoutOverline}>PLANLAGT</Text>
        <Text style={styles.payoutDate}>{p.date}</Text>
      </View>
      <Text style={styles.payoutAmount}>{formatKr(p.amount)}</Text>
    </View>
  ))}
</View>
```

- [ ] **Step 5: Replace the spot list with HostSpotCard**

Replace the existing "My spots" block — the `{SPOTS.length > 0 && (<Text style={styles.sectionTitle}>Mine plasser</Text>)}` and the `{SPOTS.map((spot) => ( <TouchableOpacity … styles.spotRow …> ))}` (lines ~286–310) — with:

```jsx
<Text style={styles.spotsTitle}>Mine spots</Text>
<Text style={styles.spotsSub}>
  {STATIC_SPOTS.filter(s => s.status === 'active').length} aktive · {formatKr(STATIC_SPOTS.reduce((sum, s) => sum + s.weekly, 0))} denne uken
</Text>
{STATIC_SPOTS.map((spot) => (
  <HostSpotCard
    key={spot.id}
    status={spot.status}
    address={spot.address}
    area={spot.area}
    weekly={spot.weekly}
    price={spot.price}
    photoUrl={spot.photoUrl}
    onPress={() => navigation.push('RedigerPlass', { spot })}
    onMenu={() => navigation.push('RedigerPlass', { spot })}
  />
))}
```

- [ ] **Step 6: Add the new styles**

Append these keys to the existing `StyleSheet.create({…})` object in `HostScreen.js`:

```js
  dividerBand: { height: 7, borderRadius: 999, backgroundColor: 'rgba(152,182,216,0.16)', marginHorizontal: -20, marginTop: 24, marginBottom: 20 },
  kommendeTitle: { fontFamily: 'System', fontWeight: '700', fontSize: 19, color: '#FFFFFF', marginBottom: 10 },
  payoutList: { marginBottom: 24 },
  payoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  payoutRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(152,182,216,0.16)' },
  payoutOverline: { fontFamily: 'System', fontWeight: '700', fontSize: 10, color: '#6E809B', letterSpacing: 0.8, textTransform: 'uppercase' },
  payoutDate: { fontFamily: 'System', fontWeight: '600', fontSize: 16, color: '#FFFFFF', marginTop: 2 },
  payoutAmount: { fontFamily: 'System', fontWeight: '700', fontSize: 18, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  spotsTitle: { fontFamily: 'System', fontWeight: '800', fontSize: 23, color: '#FFFFFF', letterSpacing: -0.5 },
  spotsSub: { fontFamily: 'System', fontWeight: '500', fontSize: 12.5, color: '#98B6D8', marginTop: 2, marginBottom: 16 },
```

> Leave the now-unused old style keys (`periodRow`, `earningsCard`, `barsContainer`, `spotRow`, etc.) in place for this task to keep the diff focused; Task 7 removes dead code. Also leave a `// TODO: wire HostSpotCard — normalise() in SpotsContext drops address/area/photos` comment above `STATIC_SPOTS`.

- [ ] **Step 7: Run the app and verify**

Run: `cd app && npx expo start` → open Host (via "Lei ut" / tab → Host push).
Expected:
- Chart shows 7 bars, **Mai** selected by default, Hanken headline `Du tjente / kr 4 280 / i mai`.
- Tapping bars/pills updates headline, trend chip, value chip, and selected pill.
- "Kommende" shows two payout rows (15. juni → kr 1 920, 1. juli → kr 2 480), first row hairline, last borderless.
- Three spot cards: card 1 & 3 active green dot, card 2 paused amber + `kr 0` tertiary weekly, card 3 empty-state photo well (pin).

If non-interactive, statically verify: `grep -n "EarningsChart\|HostSpotCard\|Kommende\|STATIC_SPOTS" app/src/screens/HostScreen.js`.

- [ ] **Step 8: Run existing tests**

Run: `cd app && npm test`
Expected: PASS (search.test.js + format.test.js).

- [ ] **Step 9: Commit**

```bash
git add app/src/screens/HostScreen.js
git commit -m "feat: compose EarningsChart, HostSpotCard, Kommende into HostScreen"
```

---

### Task 7: Remove dead styles/code from HostScreen

**Files:**
- Modify: `app/src/screens/HostScreen.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: cleaner HostScreen with no unused chart/period/spotRow code.

- [ ] **Step 1: Identify dead code**

The old earnings used: `BAR_DAYS`, `PERIOD_META`, `period` state, `dailyBars` state, `fmt()` (now superseded by `formatKr` for new code — KEEP `fmt` only if still referenced elsewhere; check with grep), and styles `periodRow`, `periodBtn`, `periodBtnActive`, `periodText`, `periodTextActive`, `earningsCard`, `cardBlob`, `cardLabel`, `cardValueRow`, `cardValue`, `cardUnit`, `cardSub`, `barsContainer`, `barWrap`, `bar`, `barLabels`, `barLabel`, `spotRow`, `statusDotWrap`, `statusDot`, `spotInfo`, `spotTitle`, `spotSub`, `spotPrice`, `sectionTitle`.

Run: `cd app && grep -nE "PERIOD_META|BAR_DAYS|dailyBars|periodRow|earningsCard|barsContainer|styles.spotRow|styles.sectionTitle" src/screens/HostScreen.js`
Note every match. Only remove a symbol if it has ZERO remaining usages after Task 6's edits.

- [ ] **Step 2: Remove the confirmed-dead constants, state, and styles**

Delete `BAR_DAYS` and `PERIOD_META` constants, the `period`/`dailyBars`/`setDailyBars` state and the `setDailyBars(...)` line inside the earnings `useEffect`, and the dead style keys listed in Step 1 that grep confirmed unused. Keep the earnings `useEffect` data-fetch and `payout` logic intact (still used by the later-wiring pass and the hero) — only remove the `dailyBars` computation lines.

> If removing `dailyBars` from the `useEffect` is entangled with the earnings query, it is acceptable to leave the `useEffect` as-is for now and only remove the unused styles + `BAR_DAYS`/`PERIOD_META`/`period`. Prefer a smaller safe diff over an aggressive one.

- [ ] **Step 3: Verify no broken references**

Run: `cd app && node -e "require('@babel/core').transformFileSync('src/screens/HostScreen.js', { presets: ['babel-preset-expo'] }); console.log('ok')"`
Expected: `ok` (no reference errors).
Run: `cd app && grep -nE "styles\.(periodRow|earningsCard|barsContainer|spotRow|barLabel)" src/screens/HostScreen.js`
Expected: NO output (all removed).

- [ ] **Step 4: Run tests + app smoke**

Run: `cd app && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/screens/HostScreen.js
git commit -m "refactor: remove dead earnings/spot-row code from HostScreen"
```

---

## Self-Review

**Spec coverage:**
- Inntekt interactive chart (visual, no projections) → Task 5 ✓ (goal/projection behind `showGoal`/`showProjection` defaults-off props ✓)
- Dynamic headline + trend chip + value chip + month pills + YTD → Task 5 ✓
- Hanken Grotesk font (earnings only) → Task 3 + Task 5 family names ✓
- Currency thin-space + Norwegian months → Task 1 ✓
- HostSpotCard (status/address/area/weekly/price/photo/empty/menu/arrow) → Task 4 ✓
- Kommende payouts section → Task 6 ✓
- Compose in single-scroll HostScreen, keep 3-tab nav → Task 6 ✓
- Static data per handoff → Task 5 DEFAULT_DATA + Task 6 STATIC_SPOTS/PAYOUTS ✓
- normalise() left unchanged with TODO marker → Task 6 Step 6 ✓
- Dead code cleanup → Task 7 ✓

**Placeholder scan:** No "TBD"/"implement later". The only `// TODO` is the deliberate later-wiring marker required by the spec. Module-style fallback (Task 1 Step 3b) is a concrete either/or, not a placeholder.

**Type consistency:** `formatKr`/`MONTH_NAMES_NB`/`trendPct` defined in Tasks 1–2, consumed with matching signatures in Tasks 5–6. `EarningsChart`/`HostSpotCard` default exports match their import sites in Task 6. Icon names (`map-pin`, `arrow-right`, `chevron-down`, `chevron-right`, `trending-up`) all confirmed present in `Icon.js`; ••• drawn as inline Views (no missing icon).

**Open risk:** `node --test` ESM vs CommonJS for `format.js` — handled explicitly in Task 1 Step 3b by matching the existing test file's module style.
