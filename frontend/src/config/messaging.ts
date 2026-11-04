import { getMessaging, getToken, isSupported, onMessage, type MessagePayload } from 'firebase/messaging';
import app from './firebase';

export async function enableBrowserPush(): Promise<string> {
  const userAgent = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isIOS && !isInstalled) {
    throw new Error('On iPhone/iPad, add this website to your Home Screen, open it from the new icon, then enable alerts.');
  }
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    throw new Error('This browser does not support push notifications.');
  }
  const vapidKey =
    import.meta.env.VITE_FIREBASE_VAPID_KEY ||
    'BOasshgnL37xxy8KFi2oM2KPSfgHxSGxNftoxom4xNDuzLem3Wt-7Xlzgiu5SpeU4ADWOz5GyQHjE-Gjq2IFu0U';
  if (!vapidKey) {
    throw new Error('Browser alerts need the Firebase Web Push certificate key configured first.');
  }
  if (!(await isSupported())) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Browser notification permission was not granted.');

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  return getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration });
}

export async function listenForPushMessages(callback: (payload: MessagePayload) => void) {
  if (!(await isSupported())) return () => undefined;
  return onMessage(getMessaging(app), callback);
}
