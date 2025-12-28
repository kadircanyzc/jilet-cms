// Fix admin user - add to users collection
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(serviceAccountKey);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function fixAdmin() {
  const email = process.argv[2] || 'testadmin@kestir.com';
  
  console.log(`🔧 Fixing admin user: ${email}\n`);

  try {
    // Get user from Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;
    
    console.log('✅ Found user in Firebase Auth');
    console.log(`   UID: ${uid}\n`);

    // Add to users collection with admin role
    await db.collection('users').doc(uid).set({
      email: userRecord.email,
      name: userRecord.displayName || 'Admin User',
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Added user to Firestore users collection');
    console.log('   Role: admin\n');
    console.log('🎉 Admin user fixed! You can now use the CMS.');

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ User not found in Firebase Auth');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

fixAdmin().then(() => process.exit(0));
