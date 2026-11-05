/* Firebase web configuration is public client configuration, not a server secret. */
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDSsxg-z2fIhYVX5YqrqELlGt7RS8Xdxwg',
  authDomain: 'veeduvadagaiku-66d6a.firebaseapp.com',
  projectId: 'veeduvadagaiku-66d6a',
  storageBucket: 'veeduvadagaiku-66d6a.firebasestorage.app',
  messagingSenderId: '444607450174',
  appId: '1:444607450174:web:320f8f5efc54ee4a38d56f',
});

const messaging = firebase.messaging();

/**
 * In-memory dedup: track tags shown in the last 30 seconds.
 * This prevents the same message received via two FCM tokens (old + new token
 * still stored in DB) from producing duplicate OS notifications on one device.
 */
const recentlyShownTags = new Map(); // tag -> timestamp (ms)

function wasRecentlyShown(tag) {
  const ts = recentlyShownTags.get(tag);
  if (!ts) return false;
  if (Date.now() - ts < 30000) return true; // 30-second dedup window
  recentlyShownTags.delete(tag);
  return false;
}

function markShown(tag) {
  recentlyShownTags.set(tag, Date.now());
  // Housekeeping — cap map size to avoid memory leak in long-lived SW
  if (recentlyShownTags.size > 100) {
    const cutoff = Date.now() - 60000;
    for (const [k, v] of recentlyShownTags) {
      if (v < cutoff) recentlyShownTags.delete(k);
    }
  }
}

/**
 * Background message handler — fires when the app tab is hidden or closed.
 * This is the ONLY handler that calls showNotification().
 * The raw 'push' event is NOT registered so Firebase handles dedup internally.
 */
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Veedu Vadagaikku';
  const body  = payload.notification?.body  || payload.data?.body  || 'New property update.';
  const url   = payload.data?.url || '/owner/properties';

  // Stable tag collapses identical alerts in the OS tray
  const tag = payload.data?.tag || payload.data?.notificationId
    || `veedu-${(payload.data?.title || title).replace(/\s+/g, '-').toLowerCase().slice(0, 40)}`;

  // 1. In-memory dedup (catches second FCM delivery within 30 s)
  if (wasRecentlyShown(tag)) {
    console.log('[SW] Duplicate suppressed (in-memory):', tag);
    return; // ← return here is safe; onBackgroundMessage does NOT need waitUntil
  }

  markShown(tag);

  // 2. OS-tray dedup: if a notification with this tag already sits in the tray, skip
  //    (uses a self-contained promise chain — no event.waitUntil needed here)
  self.registration.getNotifications({ tag }).then((existing) => {
    if (existing.length > 0) {
      console.log('[SW] Duplicate suppressed (tray):', tag);
      return;
    }
    return self.registration.showNotification(title, {
      body,
      icon:     '/logo-emblem.png',
      badge:    '/logo-emblem.png',
      vibrate:  [200, 100, 200],
      data:     { url },
      tag,
      renotify: false,
    });
  });
});

// Notification click — navigate to the linked page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || '/owner/properties',
    self.location.origin
  ).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.startsWith(self.location.origin));
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
