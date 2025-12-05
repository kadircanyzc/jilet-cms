// Create admin using Firebase Admin SDK (server-side)
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Read .env.local file
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');

    // Extract FIREBASE_SERVICE_ACCOUNT_KEY
    const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(.+)/);
    if (!match) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
      process.exit(1);
    }

    const serviceAccountKey = match[1].trim();

    const serviceAccount = JSON.parse(serviceAccountKey);

    // Fix private_key if it has escaped newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    process.exit(1);
  }
}

async function createAdmin() {
  const email = 'admin2@kestir.com';
  const password = 'Admin2024!';
  const name = 'Admin User 2';
  const role = 'super_admin';

  try {
    console.log('🔥 Creating admin user...');

    // Create auth user
    let userId;
    try {
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
      });
      userId = userRecord.uid;
      console.log('✅ Auth user created:', userId);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Email already exists, getting user...');
        const userRecord = await admin.auth().getUserByEmail(email);
        userId = userRecord.uid;
        console.log('✅ Found existing user:', userId);
      } else {
        throw error;
      }
    }

    // Create admin document using Admin SDK
    await admin.firestore().collection('admins').doc(userId).set({
      name: name,
      email: email,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Admin document created in Firestore');
    console.log('\n📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role:', role);
    console.log('🆔 User ID:', userId);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n✅ Admin user created successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
