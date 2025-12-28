// Check barber by username
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load .env.local
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
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function checkBarber() {
  const username = process.argv[2] || 'ugurberber';
  
  console.log(`🔍 Checking barber: ${username}\n`);

  try {
    // Find barber by username
    const barbersQuery = await db.collection('barbers')
      .where('username', '==', username.toLowerCase())
      .limit(1)
      .get();

    if (barbersQuery.empty) {
      console.log('❌ Barber not found with username:', username);
      return;
    }

    const barberDoc = barbersQuery.docs[0];
    const barberData = barberDoc.data();
    
    console.log('✅ Barber found in Firestore');
    console.log(`   ID: ${barberDoc.id}`);
    console.log(`   Shop Name: ${barberData.shopName}`);
    console.log(`   Username: ${barberData.username}`);
    console.log(`   Email: ${barberData.email}`);
    console.log(`   Owner Name: ${barberData.ownerName}\n`);

    // Check if user exists in Firebase Auth
    try {
      const userRecord = await auth.getUserByEmail(barberData.email);
      console.log('✅ User exists in Firebase Auth');
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Email: ${userRecord.email}`);
      console.log(`   Display Name: ${userRecord.displayName || 'N/A'}`);
      console.log(`   Created: ${new Date(userRecord.metadata.creationTime).toLocaleString()}\n`);
      
      console.log('💡 Login with:');
      console.log(`   Username: ${barberData.username}`);
      console.log(`   Password: [the password you set in CMS]`);
    } catch (error) {
      console.log('❌ User NOT found in Firebase Auth');
      console.log('   Email:', barberData.email);
    }

    // Check if user exists in users collection
    const userDoc = await db.collection('users').doc(barberDoc.id).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('\n✅ User doc exists in Firestore');
      console.log(`   Role: ${userData.role}`);
    } else {
      console.log('\n❌ User doc NOT found in Firestore users collection');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBarber().then(() => process.exit(0));
