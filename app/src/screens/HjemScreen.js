import React from 'react';
import KartScreen from './KartScreen';

// The home tab is the map. An active/upcoming booking no longer takes over the
// whole tab — instead it surfaces as a hero card at the top of the map (in place
// of the search bar). Tapping that hero opens the active-parking dashboard.
//
// KartScreen branches its nested navigation on route.name: as "HjemRoot" it
// targets the unprefixed routes (LiveSpot / BetalingPaakrevd / AktivParkering)
// which are exactly the screens registered in HjemStack.
export default function HjemScreen({ navigation, route }) {
  return <KartScreen navigation={navigation} route={route} />;
}
