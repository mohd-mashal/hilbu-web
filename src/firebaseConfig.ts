import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDBtB9UwVqevdA83O4QBMBdLWxist0bUFI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hilbu-43fe3.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hilbu-43fe3',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hilbu-43fe3.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '72954685761',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:72954685761:web:21d947e21c29c556bd19c0',
};

// Initialize Firebase app (reuse if already initialized)
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore
export const firestore = getFirestore(app);

// Auth
export const auth = getAuth(app);

// Messaging (safe check for browser support)
export const messaging = (async () => (await isSupported()) ? getMessaging(app) : null)();

// Google Maps API Key (for use in MapComponent)
export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBIyXPWImQssjM92ny50LCeoGLjnsQFujQ';

// Export helpers
export const getFirebaseAuth = () => auth;
export const getFirebaseDB = () => firestore;
export const getFirebaseMessaging = () => messaging;
