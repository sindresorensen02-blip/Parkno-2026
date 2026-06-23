# Parkno iOS

React Native (Expo) app for Parkno, the Norwegian parking marketplace.

## Screens

- **WelcomeScreen** — Search and browse available parking spots with live availability, filters, and featured card
- **LiveSpotScreen** — Active parking session with countdown timer, progress ring, host messaging, extend/end bottom sheets
- **HostScreen** — Earnings dashboard with weekly bar chart, spot management, period switcher

## Stack

| Library | Purpose |
|---|---|
| Expo ~52 | Build toolchain, native APIs |
| React Native 0.76 | UI framework |
| React Navigation 6 | Stack navigation |
| expo-blur | Glass/frosted effects |
| expo-linear-gradient | Gradient backgrounds and cards |
| react-native-svg | Icon system |
| react-native-safe-area-context | Safe area insets |
| @expo-google-fonts/inter | Inter typeface |

## Getting started

```bash
# 1. Install Node.js (https://nodejs.org) and then:
npm install

# 2. Start Expo dev server
npx expo start

# 3. Open on device
# Press i for iOS Simulator
# Press a for Android Emulator
# Scan QR with Expo Go on a real device
```

## Project structure

```
src/
  theme.js          — Design tokens (colors, spacing, typography, shadows)
  components/
    Icon.js         — SVG icon library (30+ icons via react-native-svg)
    Primitives.js   — Core UI: GlassCard, PrimaryButton, FilterPill, SearchBar, badges
    BottomNav.js    — Floating frosted bottom navigation bar
  screens/
    WelcomeScreen.js  — Home / spot search
    LiveSpotScreen.js — Active session (timer, extend, message, end)
    HostScreen.js     — Host earnings dashboard
```

## Design system

Inherits the **AirGlass** design language from the MinPlass web landing page:
- Background: `#F4F3F2` warm off-white
- Primary text: `#17211F` deep charcoal
- Accent: `#4EA7B9` premium blue
- Available: `#9FD6B4` mint green
- CTA: `#EF8F7A` conversion coral
- Glass cards: `expo-blur` BlurView with white border
- Dark cards: `linear-gradient(#2F3437 → #111416)`
