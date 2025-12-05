// Add a test FCM token to admin user for testing
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extract FIREBASE_SERVICE_ACCOUNT_KEY
const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(.+)/);
const serviceAccount = JSON.parse(match[1].trim());
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function addTestToken() {
  try {
    const adminId = 'LK8Pmn6WDRecA3F9CkPQPxzqIGI2'; // Your admin user ID

    // Test FCM token (this won't actually send, but will show in CMS)
    const testToken = 'test-fcm-token-' + Date.now();

    await admin.firestore().collection('admins').doc(adminId).update({
      fcmToken: testToken,
      fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Test FCM token added to admin user');
    console.log('   Token:', testToken);
    console.log('\n💡 Now you can see the token count in CMS!');
    console.log('   Refresh the CMS page to see the updated count.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTestToken();
