const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

async function testPassword() {
  try {
    const user = await auth.getUserByEmail('ugurbal@barber.com');
    console.log(' User found:', user.uid);
    console.log('Email:', user.email);
    console.log('Display Name:', user.displayName);
    
    // Check if password is set
    console.log('\n Password provider:', user.providerData.map(p => p.providerId));
    
  } catch (error) {
    console.error(' Error:', error.message);
  }
}

testPassword().then(() => process.exit(0));
