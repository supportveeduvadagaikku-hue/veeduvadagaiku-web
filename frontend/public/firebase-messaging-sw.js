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
 * Background message handler (fires when app is in background or closed).
 * This is the ONLY place we show a notification — the generic `push` event
 * is intentionally NOT registered to prevent duplicate notifications.
 */
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Veedu Vadagaikku Alert';
  const body  = payload.notification?.body  || payload.data?.body  || 'New property update.';
  const url   = payload.data?.url || '/owner/properties';

  // Use a fixed tag based on title+property so identical alerts collapse into one
  const tag = payload.data?.tag || payload.data?.notificationId
    || `veedu-${(payload.data?.title || title).replace(/\s+/g, '-').toLowerCase().slice(0, 40)}`;

  self.registration.showNotification(title, {
    body,
    icon:    '/logo-emblem.png',   // 512×512 website logo
    badge:   '/logo-emblem.png',   // small monochrome badge on status bar
    image:   '/logo-emblem.png',   // expanded image inside notification
    vibrate: [200, 100, 200],
    data:    { url },
    tag,                           // collapses duplicate notifications with same tag
    renotify: false,               // don't re-buzz if collapsed
  });
});

// Click handler — open / focus the app page linked in the notification
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
