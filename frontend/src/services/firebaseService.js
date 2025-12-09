// Service Firebase pour gérer les notifications push
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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

// VAPID Key (clé publique Web Push)
const vapidKey = "BP__eZMG9I9rb5augPteT6oV498jxWndzSJNX774cf7GBm7HcjNT7R6_4FOB0-cmGWXWGUmYY9zTlpRFIsNts08";

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
 * Vérifier si on est sur iOS
 */
const isIOS = () => {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Vérifier si on est en mode standalone (PWA installée)
 */
const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

/**
 * Demander la permission pour les notifications
 */
export const requestNotificationPermission = async () => {
  try {
    // Sur iOS, vérifier si l'app est installée
    if (isIOS() && !isStandalone()) {
      console.log('iOS: App must be installed on home screen first');
      return false;
    }

    // Vérifier si les notifications sont supportées
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

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
    // Sur iOS, vérifier d'abord que l'app est installée
    if (isIOS() && !isStandalone()) {
      return { 
        success: false, 
        message: 'Sur iPhone : Installez l\'app sur votre écran d\'accueil d\'abord (bouton Partager → Sur l\'écran d\'accueil)' 
      };
    }

    // Vérifier le support des notifications
    if (!('Notification' in window)) {
      return { 
        success: false, 
        message: 'Les notifications ne sont pas supportées sur cet appareil' 
      };
    }

    // Demander la permission
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission) {
      if (Notification.permission === 'denied') {
        return { 
          success: false, 
          message: 'Permission refusée. Réinitialisez les permissions dans les paramètres de votre navigateur.' 
        };
      }
      return { success: false, message: 'Permission refusée' };
    }

    // Obtenir le token
    const token = await getFCMToken();
    
    if (!token) {
      return { success: false, message: 'Impossible d\'obtenir le token FCM' };
    }

    // Enregistrer sur le serveur
    const registered = await registerTokenOnServer(token);
    
    if (!registered) {
      return { success: false, message: 'Erreur lors de l\'enregistrement du token' };
    }

    return { success: true, token };
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return { success: false, message: error.message || 'Erreur inconnue' };
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
