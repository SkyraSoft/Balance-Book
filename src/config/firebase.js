import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKxEmB6iTpwsJPRS9_LeTB-7EBucCiznc",
  authDomain: "balance-book-64d1b.firebaseapp.com",
  projectId: "balance-book-64d1b",
  storageBucket: "balance-book-64d1b.firebasestorage.app",
  messagingSenderId: "127535177104",
  appId: "1:127535177104:web:d59e36da977418e5862715",
  measurementId: "G-PV7S61Q2XP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with proper persistence per platform
const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' ? browserLocalPersistence : getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
