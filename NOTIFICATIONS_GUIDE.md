# Bildirim Gönderme Paneli - Kullanım Kılavuzu

## Genel Bakış

Kestir CMS'e eklenen kapsamlı bildirim gönderme paneli, admin ve super_admin kullanıcılarının kullanıcılara, berberlere ve çalışanlara toplu bildirim göndermesini sağlar.

## Özellikler

### 1. Hedef Kitle Seçimi

Panel 6 farklı hedef kitle seçeneği sunar:

- **Tüm Kullanıcılar**: Sadece normal kullanıcılara bildirim gönderir
- **Tüm Berberler**: Sadece berber hesaplarına bildirim gönderir
- **Tüm Çalışanlar**: Sadece çalışan hesaplarına bildirim gönderir
- **Tüm Berber ve Çalışanlar**: Hem berberlere hem çalışanlara gönderir
- **Tüm Uygulama Kullanıcıları**: Tüm kullanıcı türlerine (kullanıcı + berber + çalışan) gönderir
- **Özel Seçim**: Multi-select dropdown ile belirli kişileri seçerek gönderim yapar

### 2. Bildirim Formu

Form aşağıdaki alanları içerir:

- **Başlık** (Title): Maksimum 100 karakter
- **Mesaj** (Body): Maksimum 300 karakter, karakter sayacı ile
- **Bildirim Tipi**:
  - `general`: Genel bildirimler
  - `promotion`: Promosyon ve kampanya bildirimleri
  - `announcement`: Duyuru mesajları
  - `reminder`: Hatırlatma bildirimleri

### 3. Canlı Önizleme

Sağ tarafta bildiriminizin nasıl görüneceğini gösteren canlı önizleme kartı:
- Alıcı sayısı
- Bildirim başlığı ve mesajı
- Bildirim tipi badge'i
- Hedef kitle bilgisi

### 4. İstatistik Kartları

Üst kısımda 4 istatistik kartı:
- **Kullanıcı FCM Token**: FCM token'ı olan kullanıcı sayısı
- **Berber FCM Token**: FCM token'ı olan berber sayısı
- **Çalışan FCM Token**: FCM token'ı olan çalışan sayısı
- **Bu Ay Gönderilen**: Bu ay gönderilen toplam bildirim sayısı

### 5. Gönderim Geçmişi

En altta son gönderilen bildirimlerin listesi:
- Durum (başarılı/başarısız)
- Gönderim tarihi ve saati
- Bildirim başlığı
- Bildirim tipi
- Hedef kitle
- Alıcı sayısı
- Gönderen kişi

### 6. Onay Modalı

Bildirim göndermeden önce açılan onay modalı:
- Kaç kişiye gönderileceği
- Bildirim özeti (başlık, mesaj, tip, hedef)
- İptal ve Gönder butonları

## Teknik Detaylar

### Dosya Yapısı

```
kestir-cms/
├── app/
│   ├── notifications/
│   │   └── page.tsx                 # Ana bildirim paneli sayfası
│   └── api/
│       └── notifications/
│           └── send/
│               └── route.ts         # FCM gönderim API endpoint'i
├── components/
│   └── Sidebar.tsx                  # Bildirimler menü öğesi eklendi
├── contexts/
│   └── AuthContext.tsx              # Bildirim izinleri eklendi
└── lib/
    └── firebase.ts                  # Firebase yapılandırması
```

### Firebase Koleksiyonları

#### 1. `notification_logs` Collection

Gönderilen tüm bildirimlerin logları:

```typescript
{
  id: string,
  title: string,              // Bildirim başlığı
  body: string,               // Bildirim mesajı
  type: string,               // general, promotion, announcement, reminder
  target: string,             // Hedef kitle açıklaması
  recipientCount: number,     // Alıcı sayısı
  sentBy: string,             // Gönderen admin email
  sentAt: Timestamp,          // Gönderim zamanı
  status: 'success' | 'failed' // Durum
}
```

#### 2. `notifications` Collection

Her kullanıcı için oluşturulan bildirim kayıtları:

```typescript
{
  id: string,
  userId: string,             // Alıcı kullanıcı ID
  title: string,              // Bildirim başlığı
  body: string,               // Bildirim mesajı
  type: string,               // Bildirim tipi
  read: boolean,              // Okundu mu?
  createdAt: Timestamp        // Oluşturulma zamanı
}
```

### Backend API Endpoint

#### POST `/api/notifications/send`

FCM bildirimlerini göndermek için kullanılan endpoint.

**Request Body:**
```json
{
  "tokens": ["fcm_token_1", "fcm_token_2", ...],
  "title": "Bildirim Başlığı",
  "body": "Bildirim mesajı",
  "type": "general",
  "data": {
    // Opsiyonel ek data
  }
}
```

**Response:**
```json
{
  "success": true,
  "successCount": 150,
  "failureCount": 2,
  "totalCount": 152
}
```

**Not:** Şu anda bu endpoint mock response döndürüyor. Gerçek FCM gönderimi için Firebase Admin SDK implementasyonu gereklidir.

### Yetki Kontrolü

Bildirim gönderme özelliği sadece şu roller tarafından kullanılabilir:
- `super_admin`: Tüm yetkiler
- `admin`: Bildirim görüntüleme ve gönderme

Diğer roller (`moderator`, `viewer`) bu sayfaya erişemez ve "Yetkisiz Erişim" mesajı görür.

## Firebase Admin SDK Kurulumu

Gerçek FCM bildirimleri göndermek için aşağıdaki adımları takip edin:

### 1. Firebase Admin SDK Kurulumu

```bash
npm install firebase-admin
```

### 2. Service Account JSON Dosyası

1. Firebase Console'a gidin
2. Project Settings > Service Accounts
3. "Generate new private key" butonuna tıklayın
4. İndirilen JSON dosyasını güvenli bir yere kaydedin

### 3. Environment Variable Ayarı

`.env.local` dosyasına ekleyin:

```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

### 4. API Route Güncelleme

`app/api/notifications/send/route.ts` dosyasındaki yorumları kaldırın ve Firebase Admin SDK kodunu aktif edin.

## Kullanım Senaryoları

### Senaryo 1: Tüm Kullanıcılara Promosyon Gönderme

1. "Tüm Kullanıcılar" seçeneğini işaretleyin
2. Başlık: "Özel İndirim!"
3. Mesaj: "Bu hafta tüm randevularda %20 indirim!"
4. Tip: "promotion"
5. "Bildirim Gönder" butonuna tıklayın
6. Onay modalında bilgileri kontrol edin
7. "Gönder" butonuna tıklayın

### Senaryo 2: Belirli Berberlere Duyuru

1. "Özel Seçim" seçeneğini işaretleyin
2. Dropdown'dan berberleri seçin (Ctrl tuşu ile çoklu seçim)
3. Başlık: "Sistem Güncellemesi"
4. Mesaj: "Yarın saat 02:00-04:00 arası sistem bakımı yapılacaktır."
5. Tip: "announcement"
6. Gönder

### Senaryo 3: Tüm Uygulamaya Genel Bildirim

1. "Tüm Uygulama Kullanıcıları (Herkes)" seçeneğini işaretleyin
2. Başlık: "Yeni Özellik!"
3. Mesaj: "Artık randevularınızı tek tuşla iptal edebilirsiniz."
4. Tip: "general"
5. Gönder

## FCM Token Yönetimi

Kullanıcılar, berberler ve çalışanlar uygulamaya giriş yaptıklarında FCM token'ları Firestore'a kaydedilir:

```typescript
// users collection
{
  uid: string,
  email: string,
  name: string,
  fcmToken: string,  // <- FCM token
  createdAt: Timestamp
}

// barbers collection
{
  uid: string,
  email: string,
  name: string,
  shopName: string,
  role: 'barber' | 'employee',
  fcmToken: string,  // <- FCM token
  createdAt: Timestamp
}
```

## Hata Durumları

### 1. FCM Token Bulunmadı

Eğer hedef kullanıcılar arasında hiçbirinin FCM token'ı yoksa:
```
"Hedef kullanıcılar arasında FCM token'a sahip kimse bulunamadı!"
```

### 2. Form Validasyonu

- Başlık veya mesaj boş ise gönderim yapılmaz
- Özel seçimde en az 1 kişi seçilmelidir

### 3. API Hatası

FCM gönderimi başarısız olsa bile Firestore'a log kaydı yapılır ve kullanıcıya bilgi verilir.

## Performans Optimizasyonu

### Batch Processing

FCM gönderiminde her batch 500 token ile sınırlıdır:

```typescript
const batchSize = 500
for (let i = 0; i < tokens.length; i += batchSize) {
  const batch = tokens.slice(i, i + batchSize)
  await sendToFCM(batch)
}
```

### Firestore Sorgulama

İstatistikler ve kullanıcı listesi ilk yüklemede çekilir ve cache'lenir.

## Güvenlik

- Sadece `admin` ve `super_admin` rolleri erişebilir
- Firebase Admin SDK sunucu tarafında çalışır
- Service account key environment variable'da saklanır
- FCM token'lar şifrelenmemiş ancak private collection'larda saklanır

## Gelecek Geliştirmeler

1. **Zamanlanmış Bildirimler**: İleri bir tarihte gönderim
2. **Bildirim Şablonları**: Sık kullanılan bildirimler için şablonlar
3. **A/B Testing**: Farklı mesajları test etme
4. **Detaylı Analitik**: Açılma oranları, tıklanma istatistikleri
5. **Gelişmiş Filtreleme**: Şehir, yaş, cinsiyet gibi filtrelere göre gönderim
6. **Rich Notifications**: Resim, buton içeren bildirimler
7. **Toplu İçe Aktarma**: CSV ile kullanıcı listesi yükleme

## Sorun Giderme

### Bildirimler Gönderilmiyor

1. FCM token'ların doğru kaydedildiğini kontrol edin
2. Firebase Admin SDK'nın doğru yapılandırıldığını kontrol edin
3. Service account key'in geçerli olduğunu kontrol edin
4. Console'da hata loglarını inceleyin

### İstatistikler Yüklenmiyor

1. Firestore permissions'ları kontrol edin
2. Collection isimlerinin doğru olduğunu kontrol edin
3. Network tab'den API çağrılarını inceleyin

### Yetki Hatası

1. Kullanıcının `admin` veya `super_admin` rolüne sahip olduğunu kontrol edin
2. `admins` collection'ında kullanıcının kaydının olduğunu kontrol edin

## İletişim

Sorularınız için: [Kestir Destek Ekibi]

---

**Son Güncelleme:** 12 Kasım 2025
**Versiyon:** 1.0.0
