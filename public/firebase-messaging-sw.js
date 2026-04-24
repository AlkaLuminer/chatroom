// public/firebase-messaging-sw.js
// This file MUST be in the /public folder so it can be served at the root.
// Firebase Cloud Messaging uses it to handle background push notifications.

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// ⚠️ Replace with your actual Firebase config values
// These must be hardcoded here (service workers can't access env variables)
firebase.initializeApp({
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "New Message", {
    body:  body  || "You have a new message",
    icon:  icon  || "/logo192.png",
    badge: "/logo192.png",
    data:  payload.data,
  });
});

// Handle notification click → open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
