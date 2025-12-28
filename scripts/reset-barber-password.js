// Reset barber password for testing
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

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const auth = admin.auth();

async function resetPassword() {
  const username = process.argv[2] || 'ugurberber';
  const newPassword = process.argv[3] || 'Test123!';
  
  console.log('🔐 Resetting password for:', username);
  console.log('New password:', newPassword);
  console.log('');
  
  try {
    const db = admin.firestore();
    
    // Find barber by username
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
    
    console.log('✅ Found barber:');
    console.log('   ID:', barberDoc.id);
    console.log('   Email:', email);
    console.log('   Username:', barberData.username);
    console.log('');
    
    // Update password in Firebase Auth
    await auth.updateUser(barberDoc.id, {
      password: newPassword
    });
    
    console.log('✅ Password updated successfully!');
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Username:', barberData.username);
    console.log('   Password:', newPassword);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetPassword().then(() => process.exit(0));
