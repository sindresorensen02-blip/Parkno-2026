import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { GEOFENCE_TASK } from '../tasks/geofenceTask';

const GEOFENCE_RADIUS_M = 600; // ~8 min walking distance

export function useProximityAlerts() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || Platform.OS !== 'ios') return;
    let active = true;

    (async () => {
      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      if (!active || fg !== 'granted') return;

      const { status: bg } = await Location.requestBackgroundPermissionsAsync();
      if (!active || bg !== 'granted') return;

      await Notifications.requestPermissionsAsync();

      const now = new Date();
      const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data } = await supabase
        .from('reservations')
        .select('id, spots(id, address, area, price, latitude, longitude)')
        .eq('renter_id', user.id)
        .eq('status', 'confirmed')
        .gte('starts_at', now.toISOString())
        .lte('starts_at', cutoff.toISOString());

      if (!active) return;

      const regions = (data ?? [])
        .map(r => r.spots)
        .filter(s => s?.latitude != null && s?.longitude != null)
        .map(s => ({
          identifier: JSON.stringify({ id: s.id, address: s.address, area: s.area, price: s.price }),
          latitude: s.latitude,
          longitude: s.longitude,
          radius: GEOFENCE_RADIUS_M,
          notifyOnEnter: true,
          notifyOnExit: false,
        }));

      if (regions.length > 0) {
        await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
      }
    })();

    return () => {
      active = false;
      Location.stopGeofencingAsync(GEOFENCE_TASK).catch(() => {});
    };
  }, [user?.id]);
}
