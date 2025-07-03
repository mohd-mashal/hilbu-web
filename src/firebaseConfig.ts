import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyDBtB9UwVqevdA83O4QBMBdLWxist0bUFI',
  authDomain: 'hilbu-43fe3.firebaseapp.com',
  projectId: 'hilbu-43fe3',
  storageBucket: 'hilbu-43fe3.appspot.com',
  messagingSenderId: '72954685761',
  appId: '1:72954685761:web:21d947e21c29c556bd19c0',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app); // Web uses getAuth directly (no AsyncStorage)
const db = getFirestore(app);
const messaging = getMessaging(app);

export const getFirebaseAuth = () => auth;
export const getFirebaseDB = () => db;
export const getFirebaseMessaging = () => messaging;
