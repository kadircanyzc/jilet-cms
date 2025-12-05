# 📱 UYGULAMAYI YÜKLEYEN HERKESE BİLDİRİM GÖNDERME

## ❓ Sorun

Şu anda CMS'teki "Tüm Uygulama Kullanıcıları" seçeneği sadece **FCM token'ı olan** (giriş yapmış) kullanıcılara gönderim yapıyor.

Siz **uygulamayı yükleyen herkese** (giriş yapmasa bile) bildirim göndermek istiyorsunuz.

---

## ✅ Çözüm: Firebase Topics

Firebase Topics kullanarak uygulamayı yükleyen herkese bildirim gönderebilirsiniz.

### 🔧 Nasıl Çalışır?

1. Kullanıcı uygulamayı yükler
2. Uygulama açıldığında otomatik olarak bir "topic"e (konu) abone olur
3. CMS'ten o topic'e bildirim gönderirsiniz
4. **Giriş yapmamış bile olsa** uygulama bildirim alır! ✅

---

## 📱 Mobil Uygulama Tarafı (React Native)

### Adım 1: Uygulama Açıldığında Topic'e Abone Ol

`App.js` veya `index.js` dosyasına ekleyin:

\`\`\`javascript
import messaging from '@react-native-firebase/messaging';

// Uygulama başlatıldığında
useEffect(() => {
  // "all_users" topic'ine abone ol
  messaging()
    .subscribeToTopic('all_users')
    .then(() => console.log('✅ Subscribed to all_users topic'))
    .catch(error => console.error('❌ Topic subscription error:', error));

  // Bildirim izni iste
  requestNotificationPermission();
}, []);

async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('✅ Notification permission granted');
  }
}
\`\`\`

### Adım 2: Kullanıcı Tiplerine Göre Topic'ler

Farklı kullanıcı tipleri için farklı topic'ler:

\`\`\`javascript
// Login sonrası
if (userType === 'user') {
  messaging().subscribeToTopic('all_customers');
} else if (userType === 'barber') {
  messaging().subscribeToTopic('all_barbers');
} else if (userType === 'employee') {
  messaging().subscribeToTopic('all_employees');
}

// Herkese bildirim için ortak topic
messaging().subscribeToTopic('all_app_users');
\`\`\`

---

## 🖥️ CMS Tarafı

### Adım 1: Topic'e Bildirim Gönderen API Oluştur

\`app/api/notifications/send-topic/route.ts\` dosyası oluşturun:

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, title, body: messageBody, type = 'general' } = body;

    console.log('📬 Sending notification to topic:', topic);

    // Validate
    if (!topic || !title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, title, body' },
        { status: 400 }
      );
    }

    // Send to topic
    const message = {
      notification: {
        title,
        body: messageBody,
      },
      data: {
        type,
      },
      topic: topic,  // Topic name
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
    };

    const response = await adminMessaging.send(message);
    console.log('✅ Topic notification sent:', response);

    return NextResponse.json({
      success: true,
      messageId: response,
      topic,
      message: \`Notification sent to topic: \${topic}\`
    });

  } catch (error: any) {
    console.error('❌ Error sending topic notification:', error);

    return NextResponse.json(
      {
        error: 'Failed to send notification',
        message: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
\`\`\`

### Adım 2: CMS Bildirim Panelinde Topic Seçeneği Ekle

\`app/notifications/page.tsx\` dosyasını güncelleyin:

Hedef seçeneklerine ekleyin:
\`\`\`typescript
const TARGET_OPTIONS = [
  { value: 'all_app_users_topic', label: 'Tüm Uygulama Kullanıcıları (Topic - Giriş Gerekmez)' },
  { value: 'all_customers_topic', label: 'Tüm Müşteriler (Topic)' },
  { value: 'all_barbers_topic', label: 'Tüm Berberler (Topic)' },
  { value: 'all_employees_topic', label: 'Tüm Çalışanlar (Topic)' },
  // ... mevcut seçenekler
];
\`\`\`

Gönderme fonksiyonuna ekleyin:
\`\`\`typescript
const handleSendNotification = async () => {
  // Topic-based notification
  if (target.endsWith('_topic')) {
    const topicName = target.replace('_topic', '');

    const response = await fetch('/api/notifications/send-topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topicName,
        title,
        body,
        type: notificationType,
      }),
    });

    // ... handle response
  } else {
    // Token-based notification (mevcut kod)
    // ...
  }
};
\`\`\`

---

## 📊 Topic'ler vs Token'lar

| Özellik | FCM Tokens | Firebase Topics |
|---------|-----------|----------------|
| **Giriş Gerekir mi?** | ✅ Evet | ❌ Hayır |
| **Hedefleme** | Bireysel kullanıcılar | Kullanıcı grupları |
| **Esneklik** | Yüksek | Orta |
| **Kurulum** | Karmaşık | Kolay |
| **Maliyet** | Daha yüksek (çok token) | Daha düşük |
| **Uygulama Açılmalı mı?** | Hayır | Hayır (bir kez abone oldu mu yeter) |

---

## 🎯 Önerilen Strateji

### 1. Topic'leri Kullan (Genel Bildirimler)

Şunlar için topic kullan:
- ✅ Kampanya duyuruları
- ✅ Uygulama güncellemeleri
- ✅ Genel bilgilendirmeler
- ✅ Sistem bakım bildirimleri

### 2. Token'ları Kullan (Kişiye Özel)

Şunlar için token kullan:
- ✅ Randevu onayları
- ✅ Randevu hatırlatmaları
- ✅ Kişiye özel mesajlar
- ✅ Doğrulama kodları

---

## 🚀 Hızlı Başlangıç

### Mobil Uygulamada (5 dakika)

1. \`App.js\` dosyasını aç
2. Yukarıdaki \`useEffect\` kodunu ekle
3. Uygulamayı yeniden başlat
4. Konsol'da "Subscribed to all_users topic" mesajını gör ✅

### CMS'te (10 dakika)

1. \`app/api/notifications/send-topic/route.ts\` dosyasını oluştur
2. Yukarıdaki kodu yapıştır
3. Bildirim panelinde topic seçeneği ekle
4. Test et! ✅

---

## 🧪 Test Etme

### Manuel Test

Firebase Console'dan manuel topic bildirimi gönder:

1. https://console.firebase.google.com/project/kestir-demo-1/notification
2. "New notification" tıkla
3. Başlık ve mesaj yaz
4. Target → "Topic" seç
5. Topic name: \`all_app_users\`
6. Send test message veya Publish

---

## 💡 Sonuç

**Token sistemi** zaten çalışıyor ama kullanıcılar giriş yapmalı.

**Topic sistemi** eklerseniz, giriş yapmadan da bildirim gönderebilirsiniz!

İkisini de kullanmanızı öneririm:
- **Token**: Kişiye özel (randevu, hatırlatma)
- **Topic**: Genel duyurular (kampanya, güncelleme)

Hangisini eklememi istersiniz? 🚀
