# HostScreen Upgrade — Inntekt (Earnings) + Mine spots

**Date:** 2026-06-25
**Author:** Sindre (with Claude)
**Status:** Approved design — pending spec review

## Context

A handoff doc (`app/README.md`) describes building two host-side screens — **Inntekt**
(earnings dashboard with an interactive monthly bar chart) and **Mine spots** (rich listing
cards) — in a dedicated 2-tab shell, from `design/*.dc.html` references.

The repo state differs from the handoff:

- The referenced `design/` folder and `.dc.html` files **do not exist**.
- A working [`HostScreen.js`](../../../app/src/screens/HostScreen.js) already exists — a single
  scrolling earnings dashboard (profile hero, Uke/Måned/År period switcher, weekly bar chart,
  payout card, inbox shortcut, "Mine plasser" list, "Lei ut" CTA), wired to **live Supabase
  data**.
- Navigation is a **3-tab** app (Kart / Aktivitet / Profil). `Host` is a pushed screen inside
  the Kart stack, not a tab. There is no 2-tab host shell.
- The design tokens in [`theme.js`](../../../app/src/theme.js) already match the handoff exactly
  (`#2B394C` bg, `#3A4C68` cards, etc.).

## Decisions

Resolved with the user before design:

1. **Scope:** *Upgrade the existing HostScreen in place.* Keep the 3-tab navigation and the
   existing push entry. Do NOT add a new 2-tab shell or duplicate host UI.
2. **Data:** *Static first, wire later.* Build with the handoff's exact hardcoded numbers so the
   UI is pixel-faithful; wire to Supabase in a later pass.
3. **Font:** *Add Hanken Grotesk* for the earnings section only; the rest of the app stays System.
4. **Layout:** *Keep one scrolling screen.* No internal sub-tabs — earnings section on top, spot
   cards below, in the existing single HostScreen `ScrollView`.
5. **Chart depth:** *Visual chart, no projections.* Build styled tappable bars + selection +
   dynamic headline + trend chip + month pills, but **drop** the projection ghost/actual split
   and the dashed goal line for now (switchable on later via props).
6. **Photos:** Real listing photos exist in the `spot-photos` storage bucket, but the in-app
   spot object does not surface them yet. Static build uses handoff photo values; real-photo
   binding is part of the later wiring pass.

## Architecture

Upgrade [`app/src/screens/HostScreen.js`](../../../app/src/screens/HostScreen.js) in place. Same
shell: `View > LinearGradient > ScrollView`, same `useSafeAreaInsets` top/bottom padding, same
push entry from "Lei ut" / `Host` route. Two reusable pieces are extracted into components so the
screen file stays focused:

- **`app/src/components/EarningsChart.js`** — self-contained interactive monthly bar chart:
  owns its data, `selectedMonthIndex` state, headline, trend chip, value chip, month-pill row,
  and YTD link.
- **`app/src/components/HostSpotCard.js`** — the 126px rich spot card (status, address/area,
  weekly earnings, price, photo well / empty-state, ••• menu, forward arrow).

HostScreen composes, top → bottom:

1. Profile hero (keep existing).
2. `<EarningsChart />` (replaces the current period-switcher + simple bar chart).
3. Payouts — "Kommende" section (upgrade the existing payout card into the handoff's payout rows).
4. `<HostSpotCard />` list (replaces the current simple `spotRow` list).
5. "Lei ut" CTA (keep existing).

The inbox shortcut row is retained between payouts and the spot list (not in the handoff, but a
real existing feature — keep it).

## Component 1 — EarningsChart

**File:** `app/src/components/EarningsChart.js`

Static data (handoff, kr):

```
Jan 1850 · Feb 2640 · Mar 3200 · Apr 3740 · Mai 4280 · Jun 2480 · Jul 0
MAX = 5000
```

Per the "visual chart, no projections" decision, all 7 months render as styled bars:

- **done** months (Jan–Mai): solid green bar, height = `value / 5000`.
- **current/future** months (Jun, Jul): faint ghost track (`rgba(152,182,216,0.13)`) at
  height = `value / 5000`. No separate projected-vs-actual fill; no dashed goal line.

Retained from the handoff:

- **Selection:** `selectedMonthIndex`, defaults to last completed month (index 4 = Mai). Tapping
  a bar column OR a month pill selects it.
- **Headline** (3 lines, Hanken 41/800): verb (white) / amount (green, tabular) / period (white),
  driven by the selected month's type:
  - done → `Du tjente` / amount / `i <month>`
  - progress → `Du har tjent` / amount / `i <month> så langt`
  - ghost → `På vei mot` / projection / `i <month>`
  - Full Norwegian month names: januar, februar, mars, april, mai, juni, juli.
- **Trend chip:** inline pill `+N % mot <prevMonth>`, up = green `#19C98C` on
  `rgba(14,158,110,0.18)`. Computed from selected vs previous month. Hidden for the first month
  and for months with no prior comparison.
- **Floating value chip:** small green chip (`kr 4 280`) above the selected bar.
- **Month-pill row:** `Jan…Jul`, all 13/600; selected = white pill (`#FFFFFF` bg, `#2B394C`
  text), others tertiary text on transparent.
- **Y-axis labels** (`kr 5 000` / `kr 2 500` / `kr 0`) + 3 gridlines, in a 44px left gutter.
- **YTD link:** underlined `kr 18 190 hittil i år` + chevron-right. No-op for now.

**Equal columns:** each bar column is `flex:1, minWidth:0` with `gap:16`, so the first bar's left
edge and last bar's right edge align with the gridline ends. Bar heights animate via
`LayoutAnimation` on selection (optional, cheap; degrade gracefully if unavailable).

**Currency formatting:** `kr ` + integer with a non-breaking thin space thousands separator
(`4280 → "kr 4 280"`). Single helper, reused by chip/headline/YTD.

**Future-proofing props:** `showProjection` and `showGoal` props default `false`. When the
dropped projection track + goal line are wanted later, flip these without a rewrite. Also accepts
an optional `data` prop so live data can replace the static array later.

## Component 2 — HostSpotCard

**File:** `app/src/components/HostSpotCard.js`

The 126px split card per handoff. Radius 28, surface `#3A4C68`, border `rgba(255,255,255,0.08)`,
soft shadow. Horizontal split:

- **Left info (60%, padding 15×16, space-between column):**
  - Status row: 8px dot with 3px glow ring + overline (`AKTIV` / `PÅ PAUSE`, secondary,
    uppercase). Active dot `#17E6A1`, paused `#D9A441`.
  - Address (16/700 white, single-line ellipsis) + area (12/500 secondary).
  - Weekly earnings: `kr 1 540` (13/800, green `#17E6A1` if > 0 else tertiary) + `denne uken`
    (11/500 tertiary).
  - Price: value (18/800 white) + `kr/t` (12/600 secondary).
- **Right photo (40%, bg `#2F3D52`):** `Image` cover when `photoUrl` set; otherwise the empty
  state (diagonal hairline texture + centered `#50607A` location-pin). Left-edge scrim gradient
  over the photo for the seam. Top-right ••• menu button (30px round, `rgba(15,22,34,0.42)` +
  blur + hairline, 3 white dots).
- **Forward arrow:** absolute, bottom 14, centered on the 60% seam. 34px round, blue gradient
  (`#4E96F0→#5EA2F5`), white arrow-right, blue shadow.

**Props:** `{ status: 'active'|'paused', address, area, weekly, price, photoUrl, onPress, onMenu }`.
Pressed state dims card to `opacity 0.88`.

Static build data (handoff):

```
1. Møhlenprisbakken 12 · Møhlenpris · active · 35 kr/t · 1540 · (photo)
2. Nygårdsgaten 7      · Nygård     · paused · 28 kr/t · 0    · (photo)
3. Sandviksveien 44    · Sandviken  · active · 22 kr/t · 720  · (no photo → empty state)
```

Card uses the system font (per handoff — Hanken is earnings-only). Tap → existing `RedigerPlass`;
••• and arrow → `RedigerPlass` for now (later: edit/pause action sheet).

**Later-wiring note (not changed now):** `normalise()` in
[`SpotsContext.js:103`](../../../app/src/context/SpotsContext.js#L103) currently drops address,
area, and photos — it returns only `title/sub/price/active/moderation_status`. When wiring real
data it must also surface `address`, `area`, `photo_url` (first image in the `spot-photos`
bucket for the spot), and a computed `weekly` total. Leave a `// TODO: wire HostSpotCard` marker;
do not modify `normalise()` in this pass.

## Payouts — "Kommende"

Replace the single payout card with the handoff's "Kommende" section: a 7px full-bleed divider
band, a `Kommende` header (19/700), then payout rows. Each row (space-between): left overline
`PLANLAGT` over date (16/600 white); right amount (18/700 white, tabular). Rows separated by a
hairline, last row borderless.

Static rows (handoff): `Planlagt · 15. juni → kr 1 920`, `Planlagt · 1. juli → kr 2 480`.

## Font loading (Hanken Grotesk)

The app currently loads **no** custom fonts. Add:

- Dependency: `@expo-google-fonts/hanken-grotesk` (weights 600/700/800).
- In [`App.js`](../../../app/App.js): `useFonts({ HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold, HankenGrotesk_800ExtraBold })` and gate render until loaded (return the
  existing `ActivityIndicator` loading view while `!fontsLoaded`). Keep `<StatusBar>` and all
  context providers intact.

EarningsChart references the Hanken family names directly. No other screen changes font.

## Out of scope (this pass)

- Wiring chart/cards/payouts to Supabase (separate later pass).
- Projection ghost/actual split and dashed goal line (props exist, default off).
- Real photo binding (empty-state + static photo values only).
- ••• action sheet, YTD summary screen, period selector ("2026" pill).
- Any change to the 3-tab navigation or a 2-tab host shell.

## Testing

- Manual: run the app (`npx expo start`), open Host via "Lei ut", verify:
  - Chart renders 7 bars, Mai selected by default; tapping bars/pills updates headline + trend +
    value chip + selected pill.
  - Hanken font visibly loads on the headline; rest of app unaffected.
  - Three spot cards render with correct status dots, weekly colors (green > 0, tertiary at 0),
    and the third card shows the empty-state photo well.
  - Payout rows render with hairlines, last row borderless.
- The existing `__tests__/search.test.js` must still pass (`npm test`); no logic it covers is
  touched.

## Files

- **New:** `app/src/components/EarningsChart.js`, `app/src/components/HostSpotCard.js`
- **Modified:** `app/src/screens/HostScreen.js` (compose new components, drop old chart/spotRow),
  `app/App.js` (font loading), `app/package.json` (Hanken dependency)
- **Unchanged (noted for later):** `app/src/context/SpotsContext.js`
