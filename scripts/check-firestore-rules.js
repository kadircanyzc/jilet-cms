// Check current Firestore rules via Admin SDK
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

async function checkRules() {
  try {
    console.log('🔍 Checking Firestore connection...\n');

    // Try to read admins collection
    const adminsSnapshot = await admin.firestore().collection('admins').limit(1).get();
    console.log('✅ Can read admins collection via Admin SDK');
    console.log('   Admin count:', adminsSnapshot.size);

    console.log('\n📋 Note: Admin SDK bypasses Firestore rules.');
    console.log('   The issue is with client-side Firebase SDK rules.\n');

    console.log('🔧 To fix this, you MUST update Firestore rules in Firebase Console:');
    console.log('   https://console.firebase.google.com/project/kestir-demo-1/firestore/rules\n');

    console.log('⚠️  Make sure you clicked "Publish" button after pasting the rules!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRules();
