import * as Notifications from 'expo-notifications';

// Local notifications for an active parking session:
//  • a lock-screen "Aktiv parkering" notice that mirrors the on-map hero
//    (address + how long is left / when it ends), shown when the phone is
//    backgrounded while a booking is live, and
//  • a "15 minutter igjen" reminder fired 15 minutes before the booking ends.
//
// All of these are local (scheduled on-device), so they work even while the
// app is closed and the phone is locked — no server/push round-trip needed.

function clock(d) {
  return d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
}

function fmtMins(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem ? `${h} t ${rem} min` : `${h} t`;
}

// A one-shot time-interval trigger. Falls back to the raw string value if the
// SchedulableTriggerInputTypes enum isn't present in this SDK version.
function timeIntervalTrigger(seconds) {
  return {
    type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
    seconds: Math.max(1, Math.round(seconds)),
    repeats: false,
  };
}

async function ensurePermission() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  } catch {
    return false;
  }
}

// Schedules the "15 minutes left" reminder. Returns the notification id, or null
// if it couldn't/shouldn't be scheduled (no permission, or the booking ends in
// 15 minutes or less so the moment is already gone).
export async function scheduleReminder(booking) {
  if (!booking?.ends_at) return null;
  const end = new Date(booking.ends_at).getTime();
  const now = Date.now();
  const reminderAt = end - 15 * 60 * 1000;
  if (reminderAt <= now + 3000) return null;
  if (!(await ensurePermission())) return null;

  const address = booking.spots?.address ?? 'parkeringsplassen';
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '15 minutter igjen',
        body: `Parkeringen på ${address} utløper ${clock(new Date(end))}. Forleng i appen om du trenger mer tid.`,
        data: { type: 'parking-reminder' },
        sound: true,
      },
      trigger: timeIntervalTrigger((reminderAt - now) / 1000),
    });
  } catch {
    return null;
  }
}

// Presents the "Aktiv parkering" notice immediately — call this when the app is
// backgrounded so it lands on the lock screen / notification tray, mirroring the
// on-map hero. Returns the notification id, or null.
export async function presentActiveParkingNotice(booking) {
  if (!booking?.ends_at) return null;
  if (!(await ensurePermission())) return null;

  const address = booking.spots?.address ?? 'parkeringsplassen';
  const start = new Date(booking.starts_at).getTime();
  const end = new Date(booking.ends_at).getTime();
  const now = Date.now();

  const body = now < start
    ? `${address} · starter ${clock(new Date(start))}`
    : `${address} · ${fmtMins(end - now)} igjen, slutter ${clock(new Date(end))}`;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Aktiv parkering',
        body,
        data: { type: 'active-parking' },
        sound: false,
      },
      trigger: null,
    });
  } catch {
    return null;
  }
}

// Cancels a scheduled notification and clears it from the tray if it was already
// presented. Safe to call with a null/undefined id.
export async function cancelNotif(id) {
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  await Notifications.dismissNotificationAsync(id).catch(() => {});
}
