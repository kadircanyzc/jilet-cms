import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
      try {
        // Parse JSON service account
        const serviceAccount = JSON.parse(serviceAccountKey);

        // Fix private_key if it has escaped newlines
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });

        console.log('✅ Firebase Admin SDK initialized successfully');
      } catch (parseError) {
        console.error('❌ Firebase Admin SDK initialization error:', parseError);
        console.error('❌ Check your FIREBASE_SERVICE_ACCOUNT_KEY format in .env.local');
        console.error('❌ Firebase Admin SDK not initialized');
      }
    } else {
      console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
      console.warn('⚠️  Push notifications will NOT work!');
      console.warn('⚠️  Follow FIREBASE_SERVICE_KEY_SETUP.md to configure');
    }
  } catch (error) {
    console.error('❌ Unexpected error during Firebase Admin initialization:', error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminMessaging = admin.messaging();
export default admin;
