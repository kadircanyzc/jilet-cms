// Check and fix all barber users
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

async function checkAndFixBarbers() {
  console.log('🔍 Checking all barbers...\n');

  try {
    // Get all barbers
    const barbersSnapshot = await db.collection('barbers').get();
    
    console.log(`Found ${barbersSnapshot.size} barbers\n`);

    for (const doc of barbersSnapshot.docs) {
      const barberData = doc.data();
      const barberId = doc.id;
      
      console.log(`📋 Barber: ${barberData.shopName || barberData.name}`);
      console.log(`   ID: ${barberId}`);
      console.log(`   Email: ${barberData.email}`);
      
      // Check if user exists in users collection
      const userDoc = await db.collection('users').doc(barberId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`   ✅ User exists - Role: ${userData.role}`);
      } else {
        console.log(`   ❌ User NOT found in users collection`);
        console.log(`   🔧 Creating user document...`);
        
        try {
          await db.collection('users').doc(barberId).set({
            email: barberData.email,
            name: barberData.ownerName || barberData.name,
            role: 'barber',
            barberId: barberId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`   ✅ User document created`);
        } catch (error) {
          console.log(`   ❌ Error creating user: ${error.message}`);
        }
      }
      
      console.log('');
    }

    console.log('🎉 Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndFixBarbers().then(() => process.exit(0));
