// Check if admin user exists in Firestore using Admin SDK
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

async function checkAdmin() {
  const email = process.argv[2] || 'testadmin@kestir.com';
  
  console.log(`🔍 Checking admin: ${email}\n`);

  try {
    // Check in Firebase Auth
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ User exists in Firebase Auth');
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   Display Name: ${userRecord.displayName || 'N/A'}\n`);

    // Check in Firestore users collection
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('✅ User exists in Firestore');
      console.log(`   Email: ${userData.email}`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   Name: ${userData.name || 'N/A'}\n`);
      
      if (userData.role === 'admin') {
        console.log('✅ User is an ADMIN');
      } else {
        console.log(`❌ User is NOT an admin - Role: ${userData.role}`);
        console.log('\n💡 To fix, run:');
        console.log(`   node scripts/create-admin-server.js ${email}`);
      }
    } else {
      console.log('❌ User NOT found in Firestore users collection');
      console.log('\n💡 To fix, run:');
      console.log(`   node scripts/create-admin-server.js ${email}`);
    }

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ User not found in Firebase Auth');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

checkAdmin().then(() => process.exit(0));
