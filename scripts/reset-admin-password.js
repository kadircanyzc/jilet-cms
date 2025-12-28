// Admin şifre sıfırlama scripti
const admin = require('firebase-admin');

// Service account key yoksa initialize etme
if (!admin.apps.length) {
  console.log('⚠️  Firebase Admin SDK başlatılamıyor - .env.local dosyası gerekli');
  console.log('📋 Manuel olarak Firebase Console\'dan şifre sıfırlayabilirsin:');
  console.log('');
  console.log('1. Firebase Console > Authentication > Users');
  console.log('2. admin@kestir.com veya admin2@kestir.com kullanıcısını bul');
  console.log('3. Sağdaki (...) menüye tıkla');
  console.log('4. "Reset password" seç');
  console.log('5. Email gönder VEYA manuel şifre belirle');
  console.log('');
  console.log('📧 Alternatif: Login sayfasında "Forgot Password" linki eklenebilir');
  process.exit(0);
}

async function resetAdminPassword() {
  try {
    const email = process.argv[2] || 'admin@kestir.com';
    const newPassword = process.argv[3] || 'Admin123!';

    console.log(`🔐 ${email} için şifre sıfırlanıyor...`);

    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Update password
    await admin.auth().updateUser(user.uid, {
      password: newPassword
    });

    console.log(`✅ Şifre başarıyla değiştirildi!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Yeni Şifre: ${newPassword}`);
    console.log('');
    console.log('🎯 Şimdi login sayfasında bu bilgilerle giriş yapabilirsin!');

  } catch (error) {
    console.error('❌ Hata:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('');
      console.log('⚠️  Kullanıcı bulunamadı. Mevcut admin kullanıcıları:');
      console.log('   - admin@kestir.com');
      console.log('   - admin2@kestir.com');
      console.log('');
      console.log('💡 Kullanım: node scripts/reset-admin-password.js EMAIL ŞIFRE');
      console.log('   Örnek: node scripts/reset-admin-password.js admin@kestir.com NewPass123!');
    }
  } finally {
    process.exit(0);
  }
}

resetAdminPassword();
