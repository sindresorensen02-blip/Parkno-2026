# Parkno — Design System

> The current, dark "Waymo-grade" visual language for the Parkno parking
> marketplace. This supersedes the old light **MinPlass / Parkno AirGlass**
> glass system (still archived under `web/colors_and_type.css` and
> `web/kit/`). Where the two disagree, **this document wins.**
>
> **Source of truth:** in the Parkno codebase, tokens live in `app/src/theme.js`
> and components in `app/src/components/Primitives.js`. This document mirrors
> those files; all values are inlined below, so it stands on its own as the
> design reference.

---

## 1. Direction

Dark, calm, and depth-driven — modelled on the Waymo app. A two-level dark
canvas, restrained elevation (soft black shadows, never bright glows except on
one CTA), a single blue accent, and line-icon navigation that **dissolves into
the background** rather than sitting on a solid bar.

Rules of thumb:
- **One accent CTA per screen.** The blue gradient + glow is a scarce resource.
- **Depth comes from surface levels and soft black shadow**, not from borders or
  bright color. Borders are near-invisible white hairlines.
- **No glass / backdrop-blur.** The old AirGlass frosted look is gone; surfaces
  are solid dark fills.

---

## 2. Color

All values from `app/src/theme.js`.

### Backgrounds (two-level)
| Token | Hex | Use |
|---|---|---|
| `bgApp` | `#2B394C` | Page background |
| `navBg` | `#1F2A39` | Bottom-nav background (darker, anchors the bottom) |

### Surfaces (elevation by lightening)
| Token | Hex | Use |
|---|---|---|
| `surface1` | `#3A4C68` | Cards (default) |
| `surface2` | `#3B4C69` | Secondary cards, grouped rows, pills, inputs |
| `surface3` | `#50607A` | Controls, toggle track, pressed states |

### Borders
| Token | Value | Use |
|---|---|---|
| `border` | `rgba(255,255,255,0.08)` | Default hairline on surfaces |
| `borderStrong` | `rgba(255,255,255,0.14)` | Outline buttons, emphasis |

### Text
| Token | Hex | Use |
|---|---|---|
| `textPrimary` | `#FFFFFF` | Headlines, primary body |
| `textSecondary` | `#98B6D8` | Secondary text, captions, meta |
| `textTertiary` | `#6E809B` | Placeholders, disabled, faint meta |
| `onAccent` | `#FFFFFF` | Text/icons on the blue accent |

### Accent & specials
| Token | Hex / value | Use |
|---|---|---|
| `accent` | `#5EA2F5` | Links, active state, the one CTA |
| `accentSoft` | `rgba(94,162,245,0.14)` | Accent fill tint |
| `accentBorder` | `rgba(94,162,245,0.32)` | Accent outline |
| `accentGlow` | `rgba(94,162,245,0.35)` | Glow color behind the CTA |
| `purple` | `#C58BFF` | Special accent (e.g. avatar outline) |
| `beta` | `#E9FFAC` | Beta label background |

### Status
| Token | Hex | Use |
|---|---|---|
| `success` | `#17E6A1` | Available / positive |
| `warning` | `#D9A441` | Caution, star rating fill |
| `danger` | `#E2675E` | Errors, destructive |

### The accent gradient
```js
export const accentGrad = ['#4E96F0', '#5EA2F5']; // left → right
```
Reserved for **one** primary CTA per screen. Don't reuse it on secondary
buttons, chips, or decorative fills.

> **Back-compat aliases** (`bgCard`, `bgMint`, `fg1`, `freshGreen`, `iceBlue`,
> `coral`, …) exist in `theme.js` only so old AirGlass-era code keeps compiling.
> They are **deprecated** — do not use them in new code; reference the real
> tokens above.

---

## 3. Typography

> **Reality check:** App.js loads **Hanken Grotesk** (600/700/800), but it is
> currently applied only in `EarningsChart.js`.
> Every other screen uses `fontFamily: 'System'` (San Francisco on iOS). The
> type scale below is the shared scale from `theme.js`; treat **System** as the
> default app face and **Hanken Grotesk** as the intentional exception for the
> earnings/data display. Pick one direction before shipping — don't let it drift.

Scale (`typography` in `app/src/theme.js`, all `fontFamily: 'System'`):

| Token | Size / line-height | Weight | Tracking |
|---|---|---|---|
| `display1` | 44 / 48 | 700 | -1.0 |
| `display2` | 36 / 40 | 700 | -0.8 |
| `h1` | 28 / 33 | 600 | -0.5 |
| `h2` | 22 / 28 | 600 | -0.4 |
| `h3` | 18 / 24 | 600 | — |
| `body` | 16 / 23 | 400 | — |
| `bodyMd` | 16 / 23 | 500 | — |
| `callout` | 15 / 21 | 500 | — |
| `caption` | 13 / 18 | 500 | — |
| `overline` | 11 / 14 | 600 | +0.88, UPPERCASE |
| `price` | 22 / 24 | 700 | -0.5 |
| `priceLg` | 32 / 34 | 700 | -0.8 |

Prices and numeric data are heavy (700–800) and tight; meta/overlines are small,
spaced, and uppercase in `textSecondary`/`textTertiary`.

---

## 4. Radii

| Token | Value |
|---|---|
| `xs` | 8 |
| `sm` | 12 |
| `md` | 18 |
| `lg` | 26 |
| `card` | 28 |
| `hero` | 34 |
| `pill` | 999 |

Cards default to `card` (28). All buttons, chips, badges, search bar, and the
mic/voice button are full `pill`.

---

## 5. Spacing

4 px base, 8 px rhythm.

| Token | px |  | Token | px |
|---|---|---|---|---|
| `s1` | 4  |  | `s6`  | 24 |
| `s2` | 8  |  | `s7`  | 32 |
| `s3` | 12 |  | `s8`  | 40 |
| `s4` | 16 |  | `s9`  | 56 |
| `s5` | 20 |  | `s10` | 72 |

Card padding defaults to 20. Screen horizontal padding is typically 16.

---

## 6. Elevation

Depth on a dark canvas = **soft black shadow**, not light. `shadow(level)` in
`app/src/theme.js`:

| Level | Offset Y | Opacity | Radius | Use |
|---|---|---|---|---|
| 1 | 2  | 0.18 | 6  | Cards, resting surfaces |
| 2 | 6  | 0.24 | 14 | Raised / sheets |
| 3 | 12 | 0.30 | 24 | Modals, popovers |
| 4 | 20 | 0.38 | 40 | Full-screen overlays |

**Accent glow** (`accentGlow(level)`) is blue (`#5EA2F5`), reserved for the
single highlighted CTA: level 1 (subtle) and level 2 (the main button). Never
glow more than one element per screen.

---

## 7. Components

From `app/src/components/Primitives.js`.
Names are kept from the AirGlass era for compatibility, but the look is dark.

| Component | What it is now |
|---|---|
| `GlassCard` / `Surface` | Solid dark card on `surface1` (or `surface2` when `strong`), hairline border, `shadow(1)`, radius 28, padding 20. **Not glass.** |
| `PrimaryButton` | The accent CTA. 56 tall, pill, `accentGrad` fill, `accentGlow(2)`, white 16/600 label, optional trailing icon chip. One per screen. |
| `OutlineButton` | Secondary. 56 tall, transparent, `borderStrong` hairline, white label. |
| `GlassButton` | Subtle filled dark pill on `surface2`, 52 tall. |
| `HostCTAButton` | Solid `accent` pill (no gradient), 56 tall, 700 label, `accentGlow(1)`. |
| `IconButton` | Round `surface2` button, default 44, hairline border. |
| `FilterPill` | 38 tall pill. Active = solid `accent` + white; inactive = `surface2` + `textSecondary`. |
| `SearchBar` | 56 pill on `surface2`, search icon, dark-keyboard input, optional blue mic button. Placeholder `Hvor skal du?`. |
| `PriceBadge` | `surface2` pill, value 14/700 white + unit 12/500 muted. Default unit `kr/t`. |
| `RatingBadge` | `surface2` pill, warning-colored star + value. |
| `AvailabilityBadge` | `surface2` pill with status dot. `Ledig` (success) / `Premium` (accent) / `Opptatt` (tertiary) / `Ny` (no dot). |

### Bottom navigation
Not a solid bar. Content **dissolves into the canvas** via a multi-stop fade
gradient (`navBg` `#1F2A39`, 0→100% over a ~68 px eased ramp), then a solid
`navBg` panel begins mid-icon. Three line-icon + label tabs (Kart / Aktivitet /
Profil). Selection is shown by **color + stroke weight only** (active =
`textPrimary` + stroke 2 + weight 600; inactive = `textSecondary` + stroke 1.8 +
weight 500) — no pill, no gradient. See
`app/src/components/BottomNav.js`.

### Maps
The map uses a custom dark Google Maps theme tuned to blend into `#2B394C`
(water `#162232`, roads `#3b4c69`, labels `#98b6d8`). Search/spot pins use the
accent blue. See the `mapStyle` JSON in
`app/src/screens/KartScreen.js`.

---

## 8. What changed from AirGlass

For anyone holding the old design in their head:

| | Old (AirGlass / MinPlass) | Now (Parkno) |
|---|---|---|
| Theme | Light "frost white" + pastel | **Dark navy** (`#2B394C`) |
| Surfaces | Frosted glass, backdrop-blur | **Solid dark** fills (`#3A4C68`) |
| Accent | Mint/teal (`#8BCFB0`, `#4EA7B9`) | **Blue** (`#5EA2F5`) |
| Text | Charcoal on light | White / `#98B6D8` on dark |
| Font | Inter | **System** (+ Hanken Grotesk for data) |
| Nav | Floating glass bar | **Dissolving** line-icon tabs |
| Shadows | Bright, layered | Soft black; one blue glow per screen |

The token *names* (radii, spacing, component names like `GlassCard`) were
deliberately preserved across the pivot, so most differences are in **values**,
not structure.

---

## 9. Design principles

The *why* behind the look. Reach for these when designing a new screen — they
matter more than any single token.

1. **Depth, not color.** Hierarchy comes from surface level (`surface1` →
   `surface2` → `surface3`) and soft black shadow. Don't reach for bright color
   or heavy borders to separate things. Borders are near-invisible white
   hairlines (`rgba(255,255,255,0.08)`), there to *catch light*, not to divide.
2. **One accent per screen.** The blue gradient + blue glow (`accentGrad` +
   `accentGlow`) marks the single most important action. If two things glow,
   neither reads as primary. Everything else is `surface2` pills, outlines, or
   plain text.
3. **The canvas is continuous.** Nothing sits on a hard bar. The bottom nav
   *dissolves* into the background via a fade gradient; cards float on the
   `#2B394C` canvas with shadow, not on panels. Avoid full-bleed dividers and
   solid headers.
4. **Numbers are the hero.** Prices and earnings are the heaviest type on
   screen (700–800, tight tracking, `tabular-nums`), often tinted `success`
   green when positive, `textTertiary` when zero. Lead with the number.
5. **Calm and restrained.** Muted blue-grays (`#98B6D8`, `#6E809B`) for
   everything secondary; saturated color (blue/green/purple) only as a small
   accent. The screen should feel quiet.
6. **Show, don't empty.** Empty/loading areas are filled with skeleton previews
   (see below), not blank space or "No data yet" text.

---

## 10. Signature patterns

These are the recurring moves that make a screen *look like Parkno*. A generic
dark theme won't have these — reproduce them.

### Skeleton content previews
Card bodies that would hold a list are filled with fake content bars instead of
real data or an empty state — it communicates "there's content here" at a glance.
Pattern: decreasing-width bars, the first row brightest.
```js
{[0.85, 0.68, 0.5].map((w, i) => (
  <View style={styles.listRow}>
    <View style={[styles.rowDot, { backgroundColor: accent }]} />
    <View style={styles.rowLines}>
      <View style={[styles.lineBar, { width: `${w * 100}%` }]} />        {/* rgba(255,255,255,0.22) */}
      <View style={[styles.lineThin, { width: `${w * 62}%` }]} />        {/* rgba(152,182,216,0.22) */}
    </View>
  </View>
))}
```
Building blocks: `lineBar` (h7, `rgba(255,255,255,0.22)`), `lineThin` (h6,
`rgba(152,182,216,0.22)`), `bubble` (h14, accent-tinted), `avatar` (34 circle,
accent-tinted fill + border). See
`AktivitetScreen.js`.

### Per-card accent theming
Each card picks **one** accent from `{ blue #5EA2F5, green #17E6A1, purple
#C58BFF }` and applies it to its dot / avatar / bubble via a small alpha helper —
fills at ~0.16–0.22, borders at ~0.4. Don't mix two accents inside one card.
```js
function hexA(hex, a) {  // #RRGGBB + alpha → rgba()
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
```

### Card header
Title (17/800, `-0.34` tracking, white) on the left, a small forward arrow
(`arrow-right`, size 15, `#98B6D8`, stroke 2.4) on the right — `space-between`.
This is the standard "this card is tappable / leads somewhere" header.

### Tile grid layout
Screens compose from tiles, not long scrolls: a `topRow` of two equal squares
(`flexDirection: 'row'`, `alignItems: 'stretch'`, fixed `height`, `gap: 14`) and
a `bigBox` (`flex: 1`) filling the rest. `borderRadius: 24`, `padding: 18`.

### Status dot with glow halo
A colored dot inside a larger same-color low-alpha halo, beside an uppercase
overline label:
```
[ dotGlow 14px @0.18 alpha  →  dot 8px solid ]  AKTIV / PÅ PAUSE
```
green `#17E6A1` = active, amber `#D9A441` = paused. See
`HostSpotCard.js`.

### Accent arrow on a seam
On split cards (info | photo), a 34px `accentGrad` circle with `arrow-right`
sits on the seam with a blue shadow — the one bit of bright color on the card.

### Screen scaffold
```js
<View style={styles.root}>
  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#2B394C' }]} />
  <View style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100, paddingHorizontal: 20 }}>
    {/* top-left back arrow: 40×40, arrow-left, white, stroke 2 */}
    ...
  </View>
</View>
```
Always pad `insets.bottom + 100` so content clears the dissolving nav. Back is a
plain top-left arrow, never a labeled header bar.

---

## 11. Copy & language

- **UI copy is Norwegian (Bokmål)**, always. Default to it — don't write English
  labels. Examples in use: `Meldinger`, `Belønninger`, `Innsikt`, `Lei ut`,
  `Aktiv`, `På pause`, `denne uken`, placeholder `Hvor skal du?`.
- **Currency:** Norwegian kroner. Hourly price unit is `kr/t` (kroner per time).
  Format amounts with `formatKr()` from `lib/format.js`.
- **Overlines/status are UPPERCASE** (`AKTIV`, `PÅ PAUSE`) with positive letter
  spacing; everything else is sentence case.
- Tone: short, concrete, calm. Labels are nouns (`Innsikt`, not "View your
  insights").

---

## 12. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use one `accentGrad` CTA + one `accentGlow` per screen | Put the blue gradient on two buttons, or glow several elements |
| Separate surfaces with `surface1/2/3` levels + `shadow()` | Use bright borders or saturated fills to create depth |
| Fill empty card bodies with skeleton previews | Leave blank space or write "No data yet" |
| Let the bottom nav dissolve into the canvas | Add a solid divider/bar under it or a solid top header |
| Keep one accent color per card (dot/avatar/bubble) | Mix blue + green + purple inside a single card |
| Lead with the number (heavy, tight, `tabular-nums`) | Bury price/earnings in body-weight text |
| Pad `insets.bottom + 100` to clear the nav | Let content scroll under the fade and get clipped |
| Write Norwegian copy and `kr/t` | Default to English labels or `$`/`/hr` |
| Use muted blue-grays for secondary text | Use pure gray or low-contrast white for meta |

> **Token discipline note:** Several screens currently hardcode hex values
> (`'#3A4C68'`, `'rgba(255,255,255,0.08)'`, `['#4E96F0','#5EA2F5']`) inline
> rather than importing from `theme.js`. That's the existing
> reality, so the values above are written out for copy-paste — but **prefer
> importing the tokens** (`colors`, `radii`, `accentGrad`, `shadow`) in new code
> so a future palette change stays one-file.

---

## How to use this

This document is the Parkno design system, loaded as project knowledge. When
designing any UI for Parkno, follow it — match the **principles** (§9),
**signature patterns** (§10), and **copy conventions** (§11), not just the color
tokens. Sections 9–12 are what make output look like *this* app rather than
generic dark mode. When in doubt, default to: dark navy canvas, one blue accent
per screen, depth from surface levels + soft shadow, and Norwegian copy.
