# Kestir CMS - Yönetim Paneli

Kestir Berber Randevu Sistemi için Next.js 14 ve Tailwind CSS ile geliştirilmiş web tabanlı yönetim paneli.

## 🚀 Hızlı Başlangıç

```bash
cd C:/Users/Public/kestir-cms
npm install
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacak.

## 📋 Özellikler

### ✅ Dashboard & Analytics
- **Gerçek zamanlı istatistikler**: Kullanıcı, berber, randevu sayıları
- **Kampanya analizi**: Conversion rates, trend grafikleri
- **Davranış analizi**: Kullanıcı aktiviteleri, conversion funnel
- **Responsive design**: Tüm cihazlarda optimize edilmiş görünüm

### ✅ Berber Yönetimi
- **CRUD işlemleri**: Berber ekleme, düzenleme, silme
- **Detaylı profil sayfaları**: Tüm berber bilgileri tek sayfada
- **Çalışan yönetimi**: Berberlere çalışan atama
- **Hizmet yönetimi**: Fiyat ve süre düzenlemeleri
- **Randevu takibi**: Berber bazlı randevu geçmişi
- **Arama ve filtreleme**: Hızlı erişim için gelişmiş arama

### ✅ Kullanıcı Yönetimi
- **Kullanıcı listesi**: Arama, filtreleme, sıralama
- **Detaylı profil sayfaları**: İstatistikler, randevu geçmişi
- **Profil düzenleme**: Tüm kullanıcı bilgilerini güncelleme
- **UTM parametreleri**: Pazarlama analizi için kaynak takibi
- **Aktif/Pasif durumu**: Kullanıcı hesap kontrolü
- **Güvenli silme**: Çift onay ile kullanıcı silme

### ✅ Bildirim Sistemi
- **Toplu bildirim gönderimi**: 6 farklı hedef seçeneği
  - Tüm Kullanıcılar
  - Tüm Berberler
  - Tüm Çalışanlar
  - Tüm Berber & Çalışanlar
  - Tüm Mobil Uygulama Kullanıcıları
  - Özel Seçim
- **Firebase Cloud Messaging (FCM)**: Push bildirim desteği
- **Batch processing**: 500 token/batch ile optimize edilmiş gönderim
- **Bildirim geçmişi**: Gönderilen tüm bildirimlerin kaydı
- **Canlı önizleme**: Alıcı sayısı ve mesaj ön görüntüleme
- **İstatistikler**: FCM token sayıları, aylık gönderim verileri
- **Yetki kontrolü**: Admin ve Super Admin yetkisi gerekli

### ✅ Güvenlik & Yetkilendirme
- **Role-based access control (RBAC)**:
  - Super Admin: Tam yetki
  - Admin: Yönetim işlemleri
  - Moderator: Görüntüleme ve düzenleme
  - Viewer: Sadece görüntüleme
- **Cookie-based authentication**: Güvenli oturum yönetimi
- **Middleware koruması**: Tüm route'lar korunuyor
- **Environment variables**: Hassas bilgiler gizli
- **Firebase Admin SDK**: Backend işlemler için

### ✅ API Endpoints
- **POST /api/notifications/send**: FCM bildirim gönderimi
  - Batch processing
  - Error handling
  - Detailed logging

## 🛠️ Teknoloji Stack

- **Frontend**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase Admin SDK
- **Database**: Cloud Firestore
- **Authentication**: Firebase Auth
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Vercel (önerilen)

## 📁 Proje Yapısı

```
kestir-cms/
├── app/
│   ├── api/
│   │   └── notifications/
│   │       └── send/
│   │           └── route.ts           # FCM API endpoint
│   ├── analytics/
│   │   ├── campaigns/                 # Kampanya analizi
│   │   └── behavior/                  # Davranış analizi
│   ├── barbers/
│   │   ├── [id]/                      # Berber detay sayfası
│   │   ├── add/                       # Berber ekleme
│   │   └── page.tsx                   # Berber listesi
│   ├── users/
│   │   ├── [id]/                      # Kullanıcı detay sayfası
│   │   └── page.tsx                   # Kullanıcı listesi
│   ├── notifications/
│   │   └── page.tsx                   # Bildirim paneli
│   ├── login/                         # Giriş sayfası
│   ├── settings/                      # Ayarlar
│   ├── layout.tsx                     # Root layout
│   └── page.tsx                       # Dashboard
├── components/
│   ├── AnalyticsCard.tsx              # İstatistik kartları
│   ├── Charts.tsx                     # Grafik bileşenleri
│   ├── DashboardLayout.tsx            # Layout wrapper
│   ├── DataTable.tsx                  # Tablo bileşeni
│   ├── Sidebar.tsx                    # Sidebar navigation
│   └── TopBar.tsx                     # Top navigation
├── contexts/
│   └── AuthContext.tsx                # Authentication context
├── lib/
│   └── firebase.ts                    # Firebase client config
├── scripts/
│   ├── create-admin.js                # Admin oluşturma scripti
│   ├── check-admin.js                 # Admin kontrolü
│   └── check-fcm-tokens.js            # FCM token kontrolü
├── middleware.ts                      # Route protection
├── FIREBASE_ADMIN_SETUP.md            # Firebase kurulum rehberi
├── NOTIFICATIONS_GUIDE.md             # Bildirim sistemi dokümantasyonu
└── .env.local                         # Environment variables (gitignore'da)
```

## 🔐 Firebase Admin SDK Kurulumu

### 1. Service Account Key Oluşturma

1. [Firebase Console](https://console.firebase.google.com/project/kestir-demo-1/settings/serviceaccounts/adminsdk) sayfasına git
2. "Generate new private key" butonuna tıkla
3. İndirilen JSON dosyasını aç

### 2. Environment Variables

`.env.local` dosyası oluştur:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"kestir-demo-1","private_key_id":"...","private_key":"...","client_email":"..."}
```

**ÖNEMLİ**: JSON içeriğini **tek satır** olarak yapıştırın!

### 3. Sunucuyu Yeniden Başlat

```bash
# Ctrl+C ile mevcut sunucuyu durdur
npm run dev
```

Terminal'de şu mesajı göreceksiniz:
```
✅ Firebase Admin SDK initialized successfully
```

Detaylı kurulum için: [FIREBASE_ADMIN_SETUP.md](FIREBASE_ADMIN_SETUP.md)

## 📊 Kullanım

### Admin Hesabı Oluşturma

```bash
node scripts/create-admin.js
```

### FCM Token Kontrolü

```bash
node scripts/check-fcm-tokens.js
```

### Bildirim Gönderme

1. CMS'e giriş yap: http://localhost:3000
2. Sidebar'dan "Bildirimler" sayfasına git
3. Hedef seç (Kullanıcılar, Berberler, Çalışanlar, vb.)
4. Başlık ve mesaj yaz
5. "Gönder" butonuna tıkla

## 🎨 Design System

- **Primary Color**: #F57C00 (Orange)
- **Background**: Dark mode destekli
- **Typography**: Inter font
- **Spacing**: Tailwind spacing scale
- **Components**: Shadcn/ui tarzı modern bileşenler

## 🔒 Güvenlik Notları

- ⚠️ `.env.local` dosyasını **asla** Git'e commit etmeyin
- `.gitignore` dosyasında `.env.local` bulunduğundan emin olun
- Service account key'i güvenli bir yerde saklayın
- Production'da environment variable'ları hosting sağlayıcınızın panelinden ayarlayın

## 🚀 Deployment

### Vercel (Önerilen)

```bash
npm run build
vercel
```

Environment variables'ları Vercel dashboard'dan ekleyin:
- `FIREBASE_SERVICE_ACCOUNT_KEY`

### Diğer Platform

```bash
npm run build
npm start
```

## 📝 Geliştirme Notları

### Firestore Collections

- `users`: Mobil app kullanıcıları
- `barbers`: Berber sahipleri
- `employees`: Berber çalışanları
- `notifications`: Bildirim kayıtları
- `notification_logs`: Toplu bildirim geçmişi
- `appointments`: Randevu kayıtları

### FCM Token Yapısı

Her kullanıcı/berber/çalışan dokümanında:
```typescript
{
  fcmToken: string,
  fcmTokenUpdatedAt: Timestamp
}
```

## 🐛 Sorun Giderme

### "Firebase Admin SDK not configured" Hatası

- `.env.local` dosyasının doğru konumda olduğundan emin olun
- JSON içeriğinin tek satırda ve doğru formatta olduğunu kontrol edin
- Sunucuyu yeniden başlatın

### "FCM token'a sahip kimse yok" Hatası

- Mobil uygulamadan giriş yapıldığından emin olun
- FCM token kontrolü yapın: `node scripts/check-fcm-tokens.js`
- Firestore'da `fcmToken` alanını kontrol edin

Detaylı sorun giderme için: [NOTIFICATIONS_GUIDE.md](NOTIFICATIONS_GUIDE.md)

## 📖 Dokümantasyon

- [Firebase Admin SDK Kurulum Rehberi](FIREBASE_ADMIN_SETUP.md)
- [Bildirim Sistemi Dokümantasyonu](NOTIFICATIONS_GUIDE.md)

## 🤝 Katkıda Bulunma

1. Bu repo'yu fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje Kestir Team'e aittir.

## 📞 İletişim

- **GitHub**: [@uur732](https://github.com/uur732)
- **Proje**: Kestir CMS
- **Versiyon**: 1.0.0

---

🤖 **Generated with [Claude Code](https://claude.com/claude-code)**

**Geliştirici**: Kestir Team
**Son Güncelleme**: 2025-01-12
