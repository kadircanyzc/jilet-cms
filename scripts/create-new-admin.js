// Yeni admin kullanıcısı oluşturma scripti
const admin = require('firebase-admin');

// .env.local'daki service account key ile initialize et
if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.log('❌ FIREBASE_SERVICE_ACCOUNT_KEY bulunamadı!');
      console.log('');
      console.log('📋 Manuel olarak Firebase Console\'dan kullanıcı oluştur:');
      console.log('');
      console.log('=== ADIM 1: Firebase Authentication\'da Kullanıcı Oluştur ===');
      console.log('1. https://console.firebase.google.com/project/kestir-demo-1/authentication/users');
      console.log('2. "Add user" butonuna tıkla');
      console.log('3. Email: test@admin.com');
      console.log('4. Password: TestAdmin123!');
      console.log('5. "Add user" ile kaydet');
      console.log('6. UID\'yi kopyala (örn: abc123xyz...)');
      console.log('');
      console.log('=== ADIM 2: Firestore\'da Admin Kaydı Oluştur ===');
      console.log('1. https://console.firebase.google.com/project/kestir-demo-1/firestore/data');
      console.log('2. "admins" collection\'ına git (yoksa oluştur)');
      console.log('3. "Add document" tıkla');
      console.log('4. Document ID: [Adım 1\'deki UID\'yi yapıştır]');
      console.log('5. Fields ekle:');
      console.log('   - name (string): "Test Admin"');
      console.log('   - email (string): "test@admin.com"');
      console.log('   - role (string): "super_admin"');
      console.log('   - createdAt (timestamp): [now]');
      console.log('6. "Save" tıkla');
      console.log('');
      console.log('✅ Artık test@admin.com / TestAdmin123! ile giriş yapabilirsin!');
      process.exit(0);
    }

    const serviceAccount = JSON.parse(serviceAccountKey);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('❌ Firebase Admin başlatılamadı:', error.message);
    process.exit(1);
  }
}

async function createAdminUser() {
  try {
    const email = process.argv[2] || 'test@admin.com';
    const password = process.argv[3] || 'TestAdmin123!';
    const name = process.argv[4] || 'Test Admin';

    console.log(`👤 Yeni admin kullanıcısı oluşturuluyor...`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    console.log(`✅ Authentication kullanıcısı oluşturuldu!`);
    console.log(`🆔 UID: ${userRecord.uid}`);

    // Create admin record in Firestore
    await admin.firestore().collection('admins').doc(userRecord.uid).set({
      name: name,
      email: email,
      role: 'super_admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Firestore admin kaydı oluşturuldu!`);
    console.log('');
    console.log('🎉 Başarılı! Şimdi giriş yapabilirsin:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('❌ Hata:', error.message);
    
    if (error.code === 'auth/email-already-exists') {
      console.log('');
      console.log('⚠️  Bu email zaten kullanılıyor.');
      console.log('💡 Farklı bir email dene:');
      console.log('   node scripts/create-admin.js yeni@email.com Sifre123!');
    }
  } finally {
    process.exit(0);
  }
}

createAdminUser();
