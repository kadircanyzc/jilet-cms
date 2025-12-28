# ⚠️ HATA: Firebase API Key Geçersiz

## 🔴 Mevcut Sorun

Console'da görünen hata:
```
Sign in error: FirebaseError: Firebase: Error (auth/api-key-not-valid)
Login error: FirebaseError: Firebase: Error (auth/api-key-not-valid)
```

**Sebep**: `lib/firebase.ts` dosyasındaki Firebase config bilgileri yanlış veya placeholder.

## ✅ Çözüm Adımları

### 1. Firebase Console'a Git
https://console.firebase.google.com/project/kestir-demo-1/settings/general

### 2. Web App Config'ini Bul

1. **Project Settings** (Sol üst, dişli ikonu)
2. **General** tab
3. Aşağı kaydır, **"Your apps"** bölümüne git
4. Web app (</> ikonu) bul
5. Eğer yoksa, **"Add app"** > **Web** tıkla ve bir web app oluştur

### 3. Config Object'i Kopyala

Firebase Console'da göreceğin config şuna benzer:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC_XXXXXXXXXXXXXXXXXXXXX-XXXXXXX",
  authDomain: "kestir-demo-1.firebaseapp.com",
  projectId: "kestir-demo-1",
  storageBucket: "kestir-demo-1.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxx"
};
```

### 4. Config'i CMS'e Yapıştır

`lib/firebase.ts` dosyasını aç ve `firebaseConfig` object'ini değiştir:

```typescript
const firebaseConfig = {
  apiKey: "BURAYA_FIREBASE_CONSOLE_DAN_KOPYALA",
  authDomain: "kestir-demo-1.firebaseapp.com",
  projectId: "kestir-demo-1",
  storageBucket: "kestir-demo-1.firebasestorage.app",
  messagingSenderId: "BURAYA_FIREBASE_CONSOLE_DAN_KOPYALA",
  appId: "BURAYA_FIREBASE_CONSOLE_DAN_KOPYALA"
};
```

### 5. Server'ı Yeniden Başlat

```bash
# Terminal'de Ctrl+C ile durdur
# Sonra tekrar çalıştır
npm run dev
```

### 6. Tekrar Giriş Yap

http://localhost:3001/login sayfasını yenile ve giriş yap.

## 🔍 Kontrol Listesi

- [ ] Firebase Console'da web app oluşturdun mu?
- [ ] apiKey doğru mu? (AIzaSy ile başlamalı)
- [ ] messagingSenderId sayı mı? (12 haneli)
- [ ] appId doğru mu? (1:xxxxx:web:xxxxx formatında)
- [ ] Server yeniden başlatıldı mı?

## ⚠️ GÜVENLİK NOTU

- API Key public olabilir (client-side'da kullanılır)
- Ama Firestore Rules güvenliği sağlar
- Service Account Key'i (.env.local) ASLA commit etme!

## 📞 Hala Çalışmıyorsa

1. Firebase Console'da Authentication aktif mi?
2. Email/Password sign-in method açık mı?
3. Web app doğru project'e ait mi?
4. Browser console'da başka hata var mı?
