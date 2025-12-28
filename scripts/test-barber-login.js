// Test barber login flow
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

async function testBarberLogin() {
  const username = 'ugurberber';
  
  console.log('🔍 Testing barber login flow for:', username);
  console.log('');
  
  try {
    // Step 1: Find barber by username
    console.log('1️⃣ Finding barber by username...');
    const barbersQuery = await db.collection('barbers')
      .where('username', '==', username.toLowerCase())
      .limit(1)
      .get();
    
    if (barbersQuery.empty) {
      console.log('❌ Barber not found');
      return;
    }
    
    const barberDoc = barbersQuery.docs[0];
    const barberData = barberDoc.data();
    const email = barberData.email;
    
    console.log('✅ Barber found:');
    console.log('   Doc ID:', barberDoc.id);
    console.log('   Email:', email);
    console.log('   Owner ID:', barberData.ownerId);
    console.log('');
    
    // Step 2: Check Firebase Auth
    console.log('2️⃣ Checking Firebase Auth...');
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ Auth user exists:');
    console.log('   UID:', userRecord.uid);
    console.log('');
    
    // Step 3: Check if UID matches
    console.log('3️⃣ Checking UID match...');
    if (barberDoc.id === userRecord.uid) {
      console.log('✅ Barber doc ID matches Auth UID');
    } else {
      console.log('❌ MISMATCH!');
      console.log('   Barber doc ID:', barberDoc.id);
      console.log('   Auth UID:', userRecord.uid);
    }
    console.log('');
    
    // Step 4: Check users collection
    console.log('4️⃣ Checking users collection...');
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('✅ Users doc exists:');
      console.log('   Role:', userData.role);
      console.log('   Barber ID:', userData.barberId);
    } else {
      console.log('❌ Users doc NOT found');
    }
    console.log('');
    
    // Step 5: Simulate BarberMainPage read
    console.log('5️⃣ Simulating BarberMainPage read...');
    try {
      const barberReadDoc = await db.collection('barbers').doc(userRecord.uid).get();
      if (barberReadDoc.exists) {
        console.log('✅ Can read barbers/' + userRecord.uid);
        console.log('   Shop Name:', barberReadDoc.data().shopName);
      } else {
        console.log('❌ Barber doc not found at barbers/' + userRecord.uid);
      }
    } catch (error) {
      console.log('❌ Error reading barber:', error.code, error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBarberLogin().then(() => process.exit(0));
