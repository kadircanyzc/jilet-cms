import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDvHXqfYhep4VnaoitI-I72mjG8iuhusi0",
  authDomain: "kestir-demo-1.firebaseapp.com",
  projectId: "kestir-demo-1",
  storageBucket: "kestir-demo-1.firebasestorage.app",
  messagingSenderId: "78222840817",
  appId: "1:78222840817:web:PLACEHOLDER",
  measurementId: "G-PLACEHOLDER"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
