// Service Firebase pour gérer les notifications push
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Configuration Firebase (sera remplacée avec les vraies clés)
const firebaseConfig = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "PLACEHOLDER_AUTH_DOMAIN",
  projectId: "PLACEHOLDER_PROJECT_ID",
  storageBucket: "PLACEHOLDER_STORAGE_BUCKET",
  messagingSenderId: "PLACEHOLDER_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID"
};

// VAPID Key (sera remplacée)
const vapidKey = "PLACEHOLDER_VAPID_KEY";

// Initialize Firebase
let app;
let messaging;

try {
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

/**
 * Demander la permission pour les notifications
 */
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      return true;
    } else {
      console.log('Notification permission denied.');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Obtenir le token FCM
 */
export const getFCMToken = async () => {
  try {
    if (!messaging) {
      throw new Error('Firebase messaging not initialized');
    }

    const currentToken = await getToken(messaging, { vapidKey });
    
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available.');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Enregistrer le token sur le serveur
 */
export const registerTokenOnServer = async (token) => {
  try {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/notifications/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        token,
        device_type: 'web'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to register token');
    }

    console.log('Token registered on server');
    return true;
  } catch (error) {
    console.error('Error registering token:', error);
    return false;
  }
};

/**
 * Initialiser les notifications push
 */
export const initializeNotifications = async () => {
  try {
    // Demander la permission
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission) {
      return { success: false, message: 'Permission refusée' };
    }

    // Obtenir le token
    const token = await getFCMToken();
    
    if (!token) {
      return { success: false, message: 'Token non disponible' };
    }

    // Enregistrer sur le serveur
    const registered = await registerTokenOnServer(token);
    
    if (!registered) {
      return { success: false, message: 'Erreur enregistrement serveur' };
    }

    return { success: true, token };
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Écouter les messages en foreground
 */
export const listenToForegroundMessages = (callback) => {
  if (!messaging) {
    console.error('Firebase messaging not initialized');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    
    // Appeler le callback avec les données
    if (callback) {
      callback(payload);
    }

    // Afficher une notification même en foreground
    if (payload.notification) {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/logo192.png'
      });
    }
  });
};

export default {
  requestNotificationPermission,
  getFCMToken,
  registerTokenOnServer,
  initializeNotifications,
  listenToForegroundMessages
};
