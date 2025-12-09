// Service Worker pour les notifications Firebase
// Ce fichier doit être à la racine publique pour Firebase

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC_oHqQRFPoJ2NmO-7OVCq3boYyc6VkFWE",
  authDomain: "icc-bfc-app-notifications.firebaseapp.com",
  projectId: "icc-bfc-app-notifications",
  storageBucket: "icc-bfc-app-notifications.firebasestorage.app",
  messagingSenderId: "673228594584",
  appId: "1:673228594584:web:f53ec58d5d78b7edf39fed",
  measurementId: "G-GW8V18FSX7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.notification_id || 'default',
    requireInteraction: true,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.');
  
  event.notification.close();
  
  // Ouvrir l'application ou une page spécifique
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
