/**
 * FCM Token Kontrolü
 *
 * Bu script Firestore'daki tüm koleksiyonları kontrol ederek
 * kaç kullanıcının FCM token'a sahip olduğunu gösterir
 */

const admin = require('firebase-admin');

// Firebase Admin SDK'yı başlat
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkFCMTokens() {
  try {
    console.log('🔍 FCM Token Kontrolü Başlatılıyor...\n');

    // Users koleksiyonunu kontrol et
    const usersSnapshot = await db.collection('users').get();
    let usersWithToken = 0;
    let totalUsers = usersSnapshot.size;

    usersSnapshot.forEach(doc => {
      if (doc.data().fcmToken) {
        usersWithToken++;
        console.log(`✅ User: ${doc.data().name || doc.data().email} - Token: ${doc.data().fcmToken.substring(0, 20)}...`);
      }
    });

    console.log(`\n📊 Kullanıcılar: ${usersWithToken}/${totalUsers} FCM token'a sahip\n`);

    // Barbers koleksiyonunu kontrol et
    const barbersSnapshot = await db.collection('barbers').get();
    let barbersWithToken = 0;
    let totalBarbers = barbersSnapshot.size;

    barbersSnapshot.forEach(doc => {
      if (doc.data().fcmToken) {
        barbersWithToken++;
        console.log(`✅ Barber: ${doc.data().shopName || doc.data().name} - Token: ${doc.data().fcmToken.substring(0, 20)}...`);
      }
    });

    console.log(`\n📊 Berberler: ${barbersWithToken}/${totalBarbers} FCM token'a sahip\n`);

    // Employees koleksiyonunu kontrol et
    const employeesSnapshot = await db.collection('employees').get();
    let employeesWithToken = 0;
    let totalEmployees = employeesSnapshot.size;

    employeesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmToken) {
        employeesWithToken++;
        console.log(`✅ Employee: ${data.firstName} ${data.lastName} - Token: ${data.fcmToken.substring(0, 20)}...`);
      }
    });

    console.log(`\n📊 Çalışanlar: ${employeesWithToken}/${totalEmployees} FCM token'a sahip\n`);

    // Toplam özet
    const totalWithTokens = usersWithToken + barbersWithToken + employeesWithToken;
    const totalAll = totalUsers + totalBarbers + totalEmployees;

    console.log('═══════════════════════════════════════');
    console.log(`📱 TOPLAM: ${totalWithTokens}/${totalAll} FCM token'a sahip`);
    console.log('═══════════════════════════════════════\n');

    if (totalWithTokens === 0) {
      console.log('⚠️  Hiçbir kullanıcıda FCM token bulunamadı!');
      console.log('📝 FCM token alabilmek için:');
      console.log('   1. Mobil uygulamaya giriş yapın');
      console.log('   2. Bildirimlere izin verin');
      console.log('   3. Bu scripti tekrar çalıştırın\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

checkFCMTokens();
