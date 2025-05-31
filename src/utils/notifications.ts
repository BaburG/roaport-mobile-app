import * as Notifications from 'expo-notifications';

export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput = null
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger,
  });
}

export async function sendImmediateNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

export async function scheduleNotificationInSeconds(
  title: string,
  body: string,
  seconds: number
) {
  await scheduleLocalNotification(title, body, {
    seconds,
    repeats: false
  } as Notifications.TimeIntervalTriggerInput);
}

export async function scheduleNotificationInMinutes(
  title: string,
  body: string,
  minutes: number
) {
  await scheduleLocalNotification(title, body, {
    seconds: minutes * 60,
    repeats: false
  } as Notifications.TimeIntervalTriggerInput);
}

export async function scheduleNotificationInHours(
  title: string,
  body: string,
  hours: number
) {
  await scheduleLocalNotification(title, body, {
    seconds: hours * 3600,
    repeats: false
  } as Notifications.TimeIntervalTriggerInput);
}

export async function scheduleNotificationAtDate(
  title: string,
  body: string,
  date: Date
) {
  await scheduleLocalNotification(title, body, {
    type: 'date',
    date,
    repeats: false
  } as Notifications.DateTriggerInput);
} 