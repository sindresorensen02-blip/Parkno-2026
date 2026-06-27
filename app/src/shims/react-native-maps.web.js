import React from 'react';
import { View } from 'react-native';

// Web shim for react-native-maps, which has no web implementation and would
// otherwise crash the web bundle on import. On web we render the map as a plain
// dark surface (the #2B394C canvas) so the rest of the screen — search bar,
// overlays — loads for previews/mockups. Native is unaffected (Metro only picks
// this file for platform "web").
const MapView = React.forwardRef(function MapView({ style, children }, ref) {
  return (
    <View ref={ref} style={[{ backgroundColor: '#2B394C' }, style]}>
      {children}
    </View>
  );
});

// Markers/overlays just render their children (the pin views) inline.
export const Marker = ({ children }) => <View>{children}</View>;
export const Callout = ({ children }) => <View>{children}</View>;
export const Polygon = () => null;
export const Polyline = () => null;
export const Circle = () => null;
export const PROVIDER_GOOGLE = undefined;
export const PROVIDER_DEFAULT = undefined;

export default MapView;
