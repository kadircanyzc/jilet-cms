# 🔒 Firestore Rules Düzeltmesi

## ❌ Sorun
CMS login yaparken Firestore'da "Missing or insufficient permissions" hatası alıyorsunuz.

## ✅ Çözüm
Firestore Security Rules'ı güncelleyip admins koleksiyonuna erişim izni vermemiz gerekiyor.

---

## 📋 Adım 1: Firebase Console'a Git

1. https://console.firebase.google.com/project/kestir-demo-1/firestore/rules adresini açın
2. Giriş yapın

---

## 📋 Adım 2: Rules'ı Güncelle

Aşağıdaki güncel rules'ı kopyalayıp Firebase Console'daki "Rules" sekmesine yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      // Users can read and write their own data
      allow read, write: if isOwner(userId);
    }

    // Barbers collection
    match /barbers/{barberId} {
      // Anyone can read barber data (for discovering barbers)
      allow read: if true;

      // Only the barber owner can write
      allow write: if isOwner(barberId);

      // Barber slots subcollection
      match /slots/{slotId} {
        // Anyone can read slots (for booking)
        allow read: if true;

        // Only barber owner can write slots
        allow write: if isOwner(barberId);
      }

      // Barber employees subcollection
      match /employees/{employeeId} {
        // Anyone authenticated can read employees (for selection during booking)
        allow read: if isSignedIn();

        // Only barber owner can write employees
        allow write: if isOwner(barberId);
      }

      // Barber services subcollection
      match /services/{serviceId} {
        // Anyone can read services (for booking)
        allow read: if true;

        // Only barber owner can write services
        allow write: if isOwner(barberId);
      }
    }

    // Employees collection (top-level for employees)
    match /employees/{employeeId} {
      // Anyone can read (for app to find employees)
      allow read: if true;

      // Employee can write their own data
      allow write: if isOwner(employeeId);
    }

    // Appointments collection
    match /appointments/{appointmentId} {
      // Allow read if user is involved in the appointment
      allow read: if isSignedIn() && (
        resource.data.userId == request.auth.uid ||
        resource.data.barberId == request.auth.uid ||
        resource.data.employeeId == request.auth.uid
      );

      // Allow create for authenticated users
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;

      // Allow update for involved parties
      allow update: if isSignedIn() && (
        resource.data.userId == request.auth.uid ||
        resource.data.barberId == request.auth.uid ||
        resource.data.employeeId == request.auth.uid
      );

      // Allow delete for appointment owner or barber
      allow delete: if isSignedIn() && (
        resource.data.userId == request.auth.uid ||
        resource.data.barberId == request.auth.uid
      );
    }

    // Favorites collection
    match /favorites/{favoriteId} {
      // Users can read and write their own favorites
      allow read, write: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
    }

    // Reviews collection
    match /reviews/{reviewId} {
      // Anyone can read reviews
      allow read: if true;

      // Only the review author can write
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }

    // Notifications collection - UPDATED FOR CMS
    match /notifications/{notificationId} {
      // Users can read their own notifications (check both userId and recipientId)
      allow read: if isSignedIn() && (
        resource.data.userId == request.auth.uid ||
        resource.data.recipientId == request.auth.uid
      );

      // Allow creation from anywhere (Cloud Functions, Admin SDK, CMS)
      allow create: if true;

      // Users can update their own notifications (mark as read)
      allow update: if isSignedIn() && (
        resource.data.userId == request.auth.uid ||
        resource.data.recipientId == request.auth.uid
      );
    }

    // Admins collection - CMS admin users - FIXED!
    match /admins/{adminId} {
      // Allow read for authenticated users (to check admin status during login)
      allow read: if isSignedIn();

      // Allow create for new admins (initial setup or admin creation via Admin SDK)
      allow create: if true;

      // Allow update/delete only for the admin themselves
      allow update, delete: if isSignedIn() && request.auth.uid == adminId;
    }

    // Default: deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 📋 Adım 3: Publish

1. "Publish" butonuna tıklayın
2. Birkaç saniye bekleyin
3. "Rules published successfully" mesajını görmelisiniz

---

## 🧪 Adım 4: Test Edin

1. CMS'e geri dönün: http://localhost:3002/login
2. Sayfayı yenileyin (F5)
3. Tekrar giriş yapın:
   - Email: `admin2@kestir.com`
   - Şifre: `Admin2024!`
4. Artık çalışmalı! ✅

---

## 🔍 Değişiklikler

### 1. **Admins Koleksiyonu**
- ✅ `allow create: if true;` - Admin SDK ile admin oluşturma
- ✅ `allow read: if isSignedIn();` - Login sırasında admin kontrolü
- ✅ `allow update, delete: if isSignedIn() && request.auth.uid == adminId;` - Sadece kendi bilgilerini güncelleyebilir

### 2. **Notifications Koleksiyonu**
- ✅ `allow create: if true;` - CMS'ten bildirim gönderimi
- ✅ `recipientId` kontrolü eklendi - Bildirimleri doğru kişiler okuyabilir

### 3. **Employees Koleksiyonu (Top-level)**
- ✅ Çalışanlar için top-level koleksiyon eklendi
- ✅ Herkes okuyabilir, sadece sahibi yazabilir

---

## ⚡ Hızlı Erişim

**Firebase Console Rules:**
https://console.firebase.google.com/project/kestir-demo-1/firestore/rules

**Firebase Console Firestore Data:**
https://console.firebase.google.com/project/kestir-demo-1/firestore/data

---

## 💡 Sorun Devam Ederse

1. Browser cache'i temizleyin (Ctrl+Shift+Delete)
2. Incognito modda deneyin
3. Firebase Console'da rules'ın publish olduğundan emin olun
4. CMS'i yeniden başlatın (Ctrl+C, sonra `npm run dev`)
