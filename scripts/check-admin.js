const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyDvHXqfYhep4VnaoitI-I72mjG8iuhusi0",
  authDomain: "kestir-demo-1.firebaseapp.com",
  projectId: "kestir-demo-1",
  storageBucket: "kestir-demo-1.firebasestorage.app",
  messagingSenderId: "78222840817",
  appId: "1:78222840817:web:test"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAdmins() {
  try {
    console.log('🔍 Checking all admins...\n');

    const adminsSnapshot = await getDocs(collection(db, 'admins'));

    console.log(`Found ${adminsSnapshot.size} admin(s):\n`);

    adminsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📧 Email: ${data.email}`);
      console.log(`👤 Name: ${data.name}`);
      console.log(`🔑 Role: ${data.role}`);
      console.log(`🆔 UID: ${doc.id}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdmins();
