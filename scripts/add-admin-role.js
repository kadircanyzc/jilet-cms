const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in environment');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountKey);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function addAdminRole() {
  const userId = 'TwijD3gNMjSBdAgUAcViQnUG4Ir1'; // User ID from previous creation
  const email = 'newadmin@kestir.com';
  const name = 'New Admin User';
  const role = 'super_admin';

  try {
    console.log('🔥 Adding admin role to user...');

    // Create admin document in Firestore
    await db.collection('admins').doc(userId).set({
      name: name,
      email: email,
      role: role,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log('✅ Admin role added successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Email: newadmin@kestir.com');
    console.log('   Password: NewAdmin2026!');
    console.log('   Role: super_admin');
    console.log('\n🌐 Login URL: http://localhost:3001/login');
    console.log('\n⚠️  Save these credentials!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addAdminRole();
