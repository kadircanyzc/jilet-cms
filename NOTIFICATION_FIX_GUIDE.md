# 🔔 Bildirim Sistemi Düzeltme Rehberi

## 🔴 Sorun Nedir?

CMS'ten gönderdiğiniz bildirimler Firestore'a kaydediliyor ama kullanıcıların telefonlarına **push notification** olarak gitmiyor.

**Sebep:** Firebase Cloud Functions kurulu değil!

## ✅ Çözüm: Cloud Function Kurulumu

### 1️⃣ Firebase CLI Kurulumu

```bash
npm install -g firebase-tools
```

### 2️⃣ Firebase'e Giriş

```bash
firebase login
```

### 3️⃣ CMS Klasöründe Functions Başlat

```bash
cd C:\Users\Public\kestir-cms
firebase init functions
```

**Seçenekler:**
- "Use an existing project" → kestir-demo-1 seçin
- Language: **JavaScript**
- ESLint: **Yes**
- Install dependencies: **Yes**

### 4️⃣ Cloud Function Kodunu Ekleyin

`kestir-cms/functions/index.js` dosyasını açın ve şu kodu ekleyin:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Firestore'a yeni notification eklendiğinde otomatik push notification gönder
 */
exports.sendPushNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    try {
      const notification = snap.data();
      const recipientId = notification.recipientId;

      console.log('📬 New notification created for:', recipientId);

      if (!recipientId) {
        console.error('❌ No recipientId found');
        return null;
      }

      // FCM token'ı al - users, barbers veya employees koleksiyonundan
      let fcmToken = null;
      let userDoc = null;

      // Önce users koleksiyonunda ara
      userDoc = await admin.firestore().collection('users').doc(recipientId).get();
      if (userDoc.exists && userDoc.data().fcmToken) {
        fcmToken = userDoc.data().fcmToken;
        console.log('✅ FCM token found in users collection');
      }

      // Users'ta yoksa barbers'ta ara
      if (!fcmToken) {
        userDoc = await admin.firestore().collection('barbers').doc(recipientId).get();
        if (userDoc.exists && userDoc.data().fcmToken) {
          fcmToken = userDoc.data().fcmToken;
          console.log('✅ FCM token found in barbers collection');
        }
      }

      // Barbers'ta yoksa employees'ta ara
      if (!fcmToken) {
        userDoc = await admin.firestore().collection('employees').doc(recipientId).get();
        if (userDoc.exists && userDoc.data().fcmToken) {
          fcmToken = userDoc.data().fcmToken;
          console.log('✅ FCM token found in employees collection');
        }
      }

      if (!fcmToken) {
        console.error('❌ No FCM token found for user:', recipientId);
        return null;
      }

      // Push notification mesajını hazırla
      const message = {
        notification: {
          title: notification.title || 'Yeni Bildirim',
          body: notification.body || '',
        },
        data: notification.data || {},
        token: fcmToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          }
        }
      };

      // Push notification gönder
      const response = await admin.messaging().send(message);
      console.log('✅ Push notification sent successfully:', response);

      return response;
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return null;
    }
  });

/**
 * CMS'ten manuel bildirim gönderme fonksiyonu
 */
exports.sendCustomNotification = functions.https.onCall(async (data, context) => {
  try {
    const { recipientId, title, body, customData } = data;

    // Firestore'a notification ekle
    await admin.firestore().collection('notifications').add({
      recipientId: recipientId,
      title: title,
      body: body,
      data: customData || {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Notification created successfully' };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### 5️⃣ Deploy Cloud Functions

```bash
cd functions
npm install firebase-admin firebase-functions
cd ..
firebase deploy --only functions
```

### 6️⃣ Test Edin

1. CMS'ten bir bildirim gönderin
2. Firebase Console → Functions sekmesine gidin
3. `sendPushNotification` function'ının loglarını kontrol edin
4. Kullanıcının telefonuna bildirim gelmeli!

---

## 🎯 Nasıl Çalışıyor?

```
CMS Panel
  ↓
Firestore'a "notification" eklenir
  ↓
Cloud Function tetiklenir (onCreate)
  ↓
Kullanıcının FCM token'ı bulunur
  ↓
Push Notification gönderilir
  ↓
Kullanıcının telefonuna bildirim gelir! 📱
```

---

## 🐛 Sorun Giderme

### Bildirim hala gelmiyor?

1. **FCM token kontrolü:**
```javascript
// Firebase Console → Firestore → users/[userId]
// fcmToken alanı var mı kontrol edin
```

2. **Cloud Function logları:**
```bash
firebase functions:log
```

3. **Manuel test:**
Firebase Console → Cloud Messaging → "Send test message"

### Function deploy olmuyorsa:

```bash
# Billing aktif mi kontrol edin
firebase projects:list

# Billing plan upgrade (Blaze plan gerekli)
```

---

## 💡 Alternatif: Admin SDK ile Doğrudan Gönderme

Cloud Functions yerine CMS backend'den doğrudan gönderebilirsiniz:

`kestir-cms/app/api/send-notification/route.ts` oluşturun:

```typescript
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

export async function POST(request: Request) {
  try {
    const { recipientId, title, body } = await request.json();

    // FCM token al
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(recipientId)
      .get();

    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      return NextResponse.json(
        { error: 'No FCM token found' },
        { status: 404 }
      );
    }

    // Push notification gönder
    await admin.messaging().send({
      notification: { title, body },
      token: fcmToken,
      android: {
        priority: 'high',
        notification: {
          sound: 'default'
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
```

---

## 📞 Yardım

Sorun devam ederse:
1. Firebase Console → Functions → Logs
2. CMS Console → Network tab
3. Mobile App → adb logcat | grep FCM

**Önemli:** Firebase Blaze (Pay as you go) planı gereklidir!
