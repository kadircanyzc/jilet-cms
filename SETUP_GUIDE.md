# 🚀 Kestir CMS - Kurulum ve Çalıştırma

## ⚡ Hızlı Başlangıç

### 1. Dependencies Yükle
```bash
npm install
```

### 2. Firebase Service Account Key Ayarla

`.env.local` dosyası oluştur ve Firebase Service Account Key'ini ekle:

```bash
# Windows PowerShell
Copy-Item .env.local.example .env.local
```

Firebase Console'dan service account key'ini al:
1. Firebase Console > Project Settings
2. Service Accounts tab
3. "Generate new private key" butonuna tıkla
4. İndirilen JSON dosyasının içeriğini `.env.local` dosyasına tek satır olarak yapıştır

**Örnek `.env.local`:**
```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"kestir-demo-1",...}
```

### 3. Development Server'ı Başlat
```bash
npm run dev
```

### 4. CMS'e Giriş Yap

1. Tarayıcıda http://localhost:3000/login aç
2. Admin email ve şifre ile giriş yap
3. Dashboard'a yönlendirileceksin

## 📋 Admin Kullanıcısı Oluşturma

Eğer admin kullanıcın yoksa, Firestore Console'dan manuel oluşturabilirsin:

1. Firebase Console > Firestore Database
2. `admins` collection'ına git
3. Yeni document ekle (Document ID = kullanıcı UID'i)
4. Fields:
   ```
   name: "Admin Name"
   email: "admin@example.com"
   role: "super_admin"
   createdAt: [Timestamp - Now]
   ```

## 🔐 Rol Sistemı

- **super_admin**: Tüm yetkilere sahip
- **admin**: Kullanıcı yönetimi, berber yönetimi, bildirim gönderme
- **moderator**: Görüntüleme ve engelleme yetkileri
- **viewer**: Sadece görüntüleme yetkisi

## 🛠️ Sorun Giderme

### "Lütfen giriş yapın" hatası
- Firebase Authentication'da kullanıcı oluşturulmuş olmalı
- `admins` collection'ında kullanıcı kaydı olmalı

### "Admin yetkisi gerekli" hatası
- Kullanıcı `admins` collection'ında değil
- Firestore'da admin kaydı oluştur

### "Firebase Admin SDK not initialized" hatası
- `.env.local` dosyası eksik veya hatalı
- Service Account Key doğru formatta değil
- Development server'ı yeniden başlat

### Permission Denied Hataları
- Tüm veri okuma/yazma işlemleri artık API üzerinden yapılıyor
- Client-side'da doğrudan Firestore okuma/yazma YOK
- Rules'a dokunulmadı, sadece client-side kod düzeltildi

## 📚 Dokümantasyon

- `FIREBASE_FIX_SUMMARY.md` - Firebase entegrasyon düzeltmeleri
- `FIREBASE_ADMIN_SETUP.md` - Firebase Admin SDK kurulum
- `FIREBASE_SERVICE_KEY_SETUP.md` - Service key ayarlama
- `NOTIFICATIONS_GUIDE.md` - Bildirim sistemi kullanımı

## 🎯 Özellikler

- ✅ Kullanıcı yönetimi (API based)
- ✅ Berber yönetimi (API based)
- ✅ Dashboard istatistikleri (API based)
- ✅ Rol tabanlı yetkilendirme
- ✅ Token based authentication
- ⏳ Bildirim sistemi (geliştirilecek)
- ⏳ Analytics sayfaları (geliştirilecek)

## 🔥 Firebase Yapısı

### Collections
- `users` - Uygulama kullanıcıları
- `admins` - CMS admin kullanıcıları
- `barbers` - Berber işletmeleri
- `employees` - Berber çalışanları
- `appointments` - Randevular
- `notifications` - Bildirimler
- `logs` - Sistem logları

### API Endpoints
- `GET /api/users` - Kullanıcıları listele
- `PATCH /api/users` - Kullanıcı engelle/engel kaldır
- `DELETE /api/users` - Kullanıcı sil
- `GET /api/dashboard/stats` - Dashboard istatistikleri
- `GET /api/admin/barber-stats` - Berber istatistikleri

## 🚀 Production Build

```bash
npm run build
npm run start
```

## 📞 Destek

Sorun yaşıyorsan:
1. Console loglarını kontrol et (Browser + Server)
2. Network tab'da API çağrılarını kontrol et
3. Firebase Console'da veri yapısını kontrol et
