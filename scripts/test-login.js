// Test Firebase Auth login
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyDvHXqfYhep4VnaoitI-I72mjG8iuhusi0",
  authDomain: "kestir-demo-1.firebaseapp.com",
  projectId: "kestir-demo-1",
  storageBucket: "kestir-demo-1.firebasestorage.app",
  messagingSenderId: "78222840817",
  appId: "1:78222840817:web:test"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testLogin() {
  const email = 'admin2@kestir.com';
  const password = 'Admin2024!';

  try {
    console.log('🔐 Testing login with:', email);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Login successful!');
    console.log('User ID:', userCredential.user.uid);
    console.log('Email:', userCredential.user.email);

    const token = await userCredential.user.getIdToken();
    console.log('✅ ID Token obtained (first 50 chars):', token.substring(0, 50) + '...');

    process.exit(0);
  } catch (error) {
    console.error('❌ Login failed:', error.code, error.message);
    process.exit(1);
  }
}

testLogin();
