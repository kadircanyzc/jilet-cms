// Check admins in Firestore
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

async function checkAdmins() {
  try {
    console.log('🔍 Checking admins collection...\n');

    const adminsSnapshot = await admin.firestore().collection('admins').get();

    console.log(`Found ${adminsSnapshot.size} admin(s):\n`);

    adminsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('---');
      console.log('User ID:', doc.id);
      console.log('Email:', data.email);
      console.log('Name:', data.name);
      console.log('Role:', data.role);
      console.log('Created:', data.createdAt?.toDate());
      console.log('');
    });

    // Check specific admin
    const targetAdmin = 'LK8Pmn6WDRecA3F9CkPQPxzqIGI2';
    const adminDoc = await admin.firestore().collection('admins').doc(targetAdmin).get();

    if (adminDoc.exists) {
      console.log('✅ Target admin exists:', targetAdmin);
      console.log('Data:', adminDoc.data());
    } else {
      console.log('❌ Target admin NOT found:', targetAdmin);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdmins();
