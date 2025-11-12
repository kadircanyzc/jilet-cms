const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function testFirebase() {
  try {
    console.log('🔥 Testing Firebase connection to kestir-demo-1...\n');

    // Test barbers collection
    const barbersSnapshot = await getDocs(collection(db, 'barbers'));
    console.log('👨‍💼 Barbers count:', barbersSnapshot.size);
    if (barbersSnapshot.size > 0) {
      const firstBarber = barbersSnapshot.docs[0].data();
      console.log('   First barber sample:', {
        id: barbersSnapshot.docs[0].id,
        name: firstBarber.name,
        shopName: firstBarber.shopName,
        role: firstBarber.role
      });
    }

    // Test users collection
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log('\n👥 Users count:', usersSnapshot.size);

    // Test appointments collection
    const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
    console.log('\n📅 Appointments count:', appointmentsSnapshot.size);

    // Test reviews collection
    const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
    console.log('\n⭐ Reviews count:', reviewsSnapshot.size);
    if (reviewsSnapshot.size > 0) {
      const firstReview = reviewsSnapshot.docs[0].data();
      console.log('   First review sample:', {
        id: reviewsSnapshot.docs[0].id,
        userName: firstReview.userName,
        rating: firstReview.rating,
        comment: firstReview.comment,
        barberId: firstReview.barberId
      });
    }

    console.log('\n✅ Firebase test completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    process.exit(1);
  }
}

testFirebase();
