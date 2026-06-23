import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export const GEOFENCE_TASK = 'minplass-proximity';

TaskManager.defineTask(GEOFENCE_TASK, ({ data: { eventType, region }, error }) => {
  if (error || eventType !== Location.GeofencingEventType.Enter) return;
  try {
    const spot = JSON.parse(region.identifier);
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Du er nær parkeringsplassen',
        body: `${spot.address} · Åpne Parkno for detaljer`,
        data: { spot },
        sound: true,
      },
      trigger: null,
    });
  } catch {}
});
