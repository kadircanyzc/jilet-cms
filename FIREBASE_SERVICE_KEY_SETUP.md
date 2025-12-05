# 🔑 Firebase Service Account Key Kurulumu

## ⚡ HIZLI ADIMLAR (5 Dakika):

### 1️⃣ Firebase Console'a Git
https://console.firebase.google.com/project/kestir-demo-1/settings/serviceaccounts/adminsdk

### 2️⃣ "Generate New Private Key" Butonuna Tıkla
![Firebase Service Account](https://i.imgur.com/example.png)

- "Generate New Private Key" butonuna bas
- Onay popup'ında "Generate Key" butonuna bas
- Bir JSON dosyası indirilecek (örn: `kestir-demo-1-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`)

### 3️⃣ JSON Dosyasını Aç ve İçeriğini Kopyala
Dosya şöyle görünecek:
```json
{
  "type": "service_account",
  "project_id": "kestir-demo-1",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@kestir-demo-1.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 4️⃣ JSON'u TEK SATIRA Dönüştür

**ÖNEMLİ:** JSON'u tek satıra çevir (newline karakterlerini kaldır)

**Kolay Yöntem:**
1. https://www.textfixer.com/tools/remove-line-breaks.php adresine git
2. JSON içeriğini yapıştır
3. "Remove Line Breaks" butonuna bas
4. Sonucu kopyala

**VEYA Manuel:**
Tüm satır sonlarını ve gereksiz boşlukları kaldır.

**Sonuç şöyle olmalı:**
```
{"type":"service_account","project_id":"kestir-demo-1","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvQ...\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-xxxxx@kestir-demo-1.iam.gserviceaccount.com",...}
```

### 5️⃣ .env.local Dosyasını Düzenle

`C:\Users\Public\kestir-cms\.env.local` dosyasını aç:

**ÖNCEDEN:**
```bash
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"kestir-demo-1",...}
```

**SONRASINDA:**
```bash
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"kestir-demo-1","private_key_id":"GERÇEK_DEĞER","private_key":"-----BEGIN PRIVATE KEY-----\\nGERÇEK_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-xxxxx@kestir-demo-1.iam.gserviceaccount.com",...}
```

⚠️ **DİKKAT:** Tüm JSON'u tek satıra yapıştır, tırnak işaretleri içinde OLMASIN!

### 6️⃣ CMS'i Yeniden Başlat

Terminal'de Ctrl+C ile durdur, sonra:
```bash
cd C:\Users\Public\kestir-cms
npm run dev
```

### 7️⃣ Test Et

1. CMS'i aç: http://localhost:3000
2. "Bildirimler" sayfasına git
3. Bir test bildirimi gönder
4. Telefonunda bildirim geldi mi kontrol et! 📱

---

## ✅ Doğrulama

CMS'i başlattığında terminal'de şunu görmelisin:
```
✅ Firebase Admin initialized with service account
```

Eğer şunu görürsen:
```
⚠️  FIREBASE_SERVICE_ACCOUNT_KEY not found in environment
```

.env.local dosyasını kontrol et!

---

## 🐛 Sorun Giderme

### Hata: "Invalid service account"
- JSON'u doğru kopyaladığından emin ol
- Tek satırda olduğundan emin ol
- Tırnak işaretleri içinde OLMASIN

### Hata: "Unexpected token"
- JSON'da `\n` karakterlerinin `\\n` olarak escape edildiğinden emin ol
- Online JSON validator kullan: https://jsonlint.com/

### Bildirim gitmiyor ama hata yok
- Kullanıcının FCM token'ı var mı kontrol et (Firestore → users → [userId] → fcmToken)
- Kullanıcı uygulamaya giriş yaptı mı?
- Bildirim izni verildi mi?

---

## 📱 Son Kontroller

1. ✅ Service Account Key indirildi
2. ✅ JSON tek satıra çevrildi
3. ✅ .env.local'e eklendi
4. ✅ CMS yeniden başlatıldı
5. ✅ Terminal'de "Firebase Admin initialized" yazısı göründü
6. ✅ Test bildirimi gönderildi
7. ✅ Telefonda bildirim alındı! 🎉

---

## 🔒 Güvenlik Notları

⚠️ **ÇOK ÖNEMLİ:**
- Service Account Key'i **ASLA** git'e commit etme!
- `.env.local` dosyası `.gitignore`'da olmalı
- Bu key ile **TÜM Firebase projesine** tam erişim var
- Sızdırılırsa hemen revoke et ve yenisini oluştur

---

Tamamlandı mı? Test etmeye hazır mısın? 🚀
