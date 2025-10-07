import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize (reuse if already initialized)
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore
export const firestore = getFirestore(app);

// Auth
export const auth = getAuth(app);

// Storage (export a single shared instance to avoid white-screen issues from multiple app contexts)
export const storage = getStorage(app);

// Messaging (safe check for browser support)
export const messaging = (async () => (await isSupported()) ? getMessaging(app) : null)();

// Google Maps API Key (for MapComponent.web.tsx)
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Helpers
export const getFirebaseAuth = () => auth;
export const getFirebaseDB = () => firestore;
export const getFirebaseMessaging = () => messaging;
export const getFirebaseStorage = () => storage;
