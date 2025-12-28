// Test direct Firebase Auth with password
const admin = require('firebase-admin');
const https = require('https');
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

async function testDirectAuth() {
  const email = 'ugurbal@barber.com';
  const password = 'Test123!';
  const apiKey = 'AIzaSyDvHXqfYhep4VnaoitI-I72mjG8iuhusi0';

  console.log('🔐 Testing Firebase Auth REST API...');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('');

  const requestData = JSON.stringify({
    email: email,
    password: password,
    returnSecureToken: true
  });

  try {
    const authResponse = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'identitytoolkit.googleapis.com',
        path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': requestData.length
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('Response status:', res.statusCode);
          console.log('Response data:', data);
          
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            const errorData = JSON.parse(data);
            console.log('');
            console.log('❌ AUTH FAILED');
            console.log('Error code:', errorData.error?.code);
            console.log('Error message:', errorData.error?.message);
            reject(new Error(errorData.error?.message || 'Auth failed'));
          }
        });
      });

      req.on('error', (e) => {
        console.error('Request error:', e);
        reject(e);
      });
      
      req.write(requestData);
      req.end();
    });

    console.log('');
    console.log('✅ AUTH SUCCESS!');
    console.log('User ID:', authResponse.localId);
    console.log('Email:', authResponse.email);
    console.log('ID Token (first 50 chars):', authResponse.idToken.substring(0, 50) + '...');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
  }
}

testDirectAuth().then(() => process.exit(0));
