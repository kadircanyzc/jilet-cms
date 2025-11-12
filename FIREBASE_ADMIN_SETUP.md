# Firebase Admin SDK Kurulum Rehberi

Firebase Admin SDK başarıyla kuruldu ve API endpoint'i aktif hale getirildi. Şimdi sadece Firebase servis hesabı anahtarını yapılandırmanız gerekiyor.

## Adım 1: Firebase Servis Hesabı Anahtarı Oluşturma

1. **Firebase Console'a gidin:**
   - [https://console.firebase.google.com/project/kestir-demo-1/settings/serviceaccounts/adminsdk](https://console.firebase.google.com/project/kestir-demo-1/settings/serviceaccounts/adminsdk)

2. **Yeni özel anahtar oluşturun:**
   - Sayfanın alt kısmında "Generate new private key" (Yeni özel anahtar oluştur) butonuna tıklayın
   - Açılan popup'ta "Generate key" butonuna tıklayın
   - Bir JSON dosyası bilgisayarınıza indirilecek (örnek: `kestir-demo-1-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`)

3. **JSON dosyasını açın:**
   - İndirilen JSON dosyasını bir metin editörü ile açın
   - İçeriği kopyalayın (tüm JSON içeriğini)

## Adım 2: Environment Variable Yapılandırması

1. **`.env.local` dosyasını açın:**
   - Dosya yolu: `C:\Users\Public\kestir-cms\.env.local`
   - Bu dosya zaten oluşturulmuş durumda

2. **Firebase servis hesabı anahtarını yapıştırın:**
   - JSON içeriğini **tek satır** olarak yapıştırın (newline karakterleri olmadan)
   - Örnek format:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"kestir-demo-1","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...xyz\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@kestir-demo-1.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40kestir-demo-1.iam.gserviceaccount.com"}
```

3. **Dosyayı kaydedin**

## Adım 3: CMS Sunucusunu Yeniden Başlatma

Environment variable değişiklikleri için sunucunun yeniden başlatılması gerekiyor:

1. **Çalışan CMS sunucusunu durdurun:**
   - Terminal'de `Ctrl+C` tuşlarına basın

2. **Sunucuyu yeniden başlatın:**
   ```bash
   cd C:\Users\Public\kestir-cms
   npm run dev
   ```

3. **Başlatma loglarını kontrol edin:**
   - Terminal'de `✅ Firebase Admin SDK initialized successfully` mesajını görmelisiniz
   - Eğer hata görüyorsanız, `.env.local` dosyasındaki JSON formatını kontrol edin

## Adım 4: Test Etme

1. **CMS Bildirimler sayfasına gidin:**
   - [http://localhost:3000/notifications](http://localhost:3000/notifications)

2. **Test bildirimi gönderin:**
   - Hedef seçin (örn: "Tüm Kullanıcılar")
   - Başlık ve içerik yazın
   - "Gönder" butonuna tıklayın

3. **Sonuçları kontrol edin:**
   - Başarılı gönderim için bildirim sayısını göreceksiniz
   - Geçmiş gönderimler tablosunda kaydı görebilirsiniz

## Sorun Giderme

### Hata: "Firebase Admin SDK not configured"

**Çözüm:**
- `.env.local` dosyasının doğru konumda olduğundan emin olun
- JSON içeriğinin tek satırda ve doğru formatta olduğunu kontrol edin
- Sunucuyu yeniden başlatmayı deneyin

### Hata: "Invalid service account"

**Çözüm:**
- Firebase Console'dan yeni bir anahtar indirin
- JSON içeriğini tekrar kopyalayıp yapıştırın
- Tırnak işaretlerinin ve özel karakterlerin doğru kopyalandığından emin olun

### Bildirimler gönderilmiyor

**Kontrol listesi:**
1. Firebase Admin SDK başarıyla başlatıldı mı? (Terminal loglarını kontrol edin)
2. FCM token'ları veritabanında mevcut mu? (Kullanıcılar giriş yaptı mı?)
3. Hedef kullanıcılar doğru seçildi mi?
4. Firebase Console'da Cloud Messaging API'si aktif mi?

## Güvenlik Notları

⚠️ **ÖNEMLİ:**
- `.env.local` dosyasını **asla** Git'e commit etmeyin
- `.gitignore` dosyasında `.env.local` bulunduğundan emin olun
- Servis hesabı anahtarını güvenli bir yerde saklayın
- Production ortamında environment variable'ı hosting sağlayıcınızın panelinden ayarlayın

## Yapılan Değişiklikler

### 1. Kurulum
- ✅ `firebase-admin` paketi yüklendi
- ✅ `.env.local` dosyası oluşturuldu (template ile)

### 2. API Endpoint Güncellemeleri
- ✅ `app/api/notifications/send/route.ts` güncellendi
- ✅ Firebase Admin SDK import edildi
- ✅ Initialization kodu aktif edildi
- ✅ FCM gönderim fonksiyonları aktif edildi
- ✅ Batch processing (500 token/batch) eklendi
- ✅ Error handling ve logging eklendi

### 3. Özellikler
- ✅ Toplu bildirim gönderimi (bulk notification)
- ✅ 500'lük batch'ler halinde işleme (FCM limiti)
- ✅ Android öncelik ve ses ayarları
- ✅ Başarı/hata sayaçları
- ✅ Detaylı console logging

## Sonraki Adımlar

1. Firebase servis hesabı anahtarını yapılandırın (yukarıdaki adımlar)
2. CMS sunucusunu yeniden başlatın
3. Test bildirimi gönderin
4. Mobil uygulamada bildirimi kontrol edin

Herhangi bir sorun yaşarsanız, terminal loglarını kontrol edin ve hata mesajlarını paylaşın.
