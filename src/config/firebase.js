import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCeAIzojhuqv_Kerms46Y5XZ8V-lZe5CTc",
  authDomain: "balancebook-b0fb0.firebaseapp.com",
  projectId: "balancebook-b0fb0",
  storageBucket: "balancebook-b0fb0.firebasestorage.app",
  messagingSenderId: "951317980572",
  appId: "1:951317980572:web:0584744324e08a58aed459",
  measurementId: "G-98L4SEJKZC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with React Native Persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
