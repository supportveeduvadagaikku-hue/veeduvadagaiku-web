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

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Veedu Vadagaikku Alert';
  const body = payload.notification?.body || payload.data?.body || 'New property update.';
  const url = payload.data?.url || '/owner/properties';

  const options = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: { url },
    tag: payload.data?.notificationId || 'veedu-alert',
    renotify: true,
  };

  self.registration.showNotification(title, options);
});

// Generic push handler to guarantee mobile OS notification even if onBackgroundMessage is skipped
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.notification?.title || data.data?.title || 'Veedu Vadagaikku Alert';
    const body = data.notification?.body || data.data?.body || 'New property update.';
    const url = data.data?.url || data.notification?.click_action || '/owner/properties';

    const options = {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      data: { url },
      tag: data.data?.notificationId || 'veedu-alert',
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // Fallback for plain text payload
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Veedu Vadagaikku Alert', {
        body: text,
        icon: '/favicon.ico',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/owner/properties', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.startsWith(self.location.origin));
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
