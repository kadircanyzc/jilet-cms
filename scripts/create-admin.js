const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

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
const auth = getAuth(app);

async function createAdmin() {
  const email = 'newadmin@kestir.com';
  const password = 'NewAdmin2026!'; // Use this to login!
  const name = 'New Admin User';
  const role = 'super_admin';

  try {
    console.log('🔥 Creating admin user...');

    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    console.log('✅ Auth user created:', userId);

    // Create admin document
    await setDoc(doc(db, 'admins', userId), {
      name: name,
      email: email,
      role: role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Admin document created');
    console.log('\n📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', role);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n✅ Admin user created successfully!');

    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️  User already exists. Just creating admin document...');

      try {
        // If user exists, just try to add admin role
        const userId = 'YOUR_USER_ID_HERE'; // You need to get this manually
        await setDoc(doc(db, 'admins', userId), {
          name: name,
          email: email,
          role: role,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('✅ Admin role added!');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
      }
    } else {
      console.error('❌ Error creating admin:', error);
      process.exit(1);
    }
  }
}

createAdmin();
