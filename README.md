# Kestir CMS - Yönetim Paneli

Kestir Berber Randevu Sistemi için Next.js 14 ve Tailwind CSS ile geliştirilmiş web tabanlı yönetim paneli.

## 🚀 Kurulum

```bash
cd C:/Users/Public/kestir-cms
npm install
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacak.

## 📋 CMS Özellikleri

### ✅ Tamamlandı
- [x] Next.js 14 + TypeScript kurulumu
- [x] Tailwind CSS yapılandırması
- [x] Temel dashboard UI
- [x] Responsive design

### 🔄 Yapılacaklar

#### Dashboard
- [ ] Gerçek zamanlı istatistikler
- [ ] Randevu trend grafiği
- [ ] Son aktiviteler listesi
- [ ] Hızlı erişim butonları

#### Berber Yönetimi
- [ ] Berber listesi (tablo görünümü)
- [ ] Arama ve filtreleme
- [ ] Berber detayları modal
- [ ] Onaylama/reddetme işlemleri
- [ ] Durum güncelleme (aktif/pasif)

#### Kullanıcı Yönetimi
- [ ] Kullanıcı listesi
- [ ] Kullanıcı detayları
- [ ] Engelleme/aktif etme
- [ ] Kullanıcı silme

#### Randevu Yönetimi
- [ ] Randevu listesi
- [ ] Filtreleme (tarih, durum, berber)
- [ ] Randevu detayları
- [ ] İptal etme

#### İçerik Yönetimi
- [ ] Yorumlar
- [ ] Bildirimler
- [ ] İçerik moderasyonu

#### Raporlama
- [ ] Gelir raporları
- [ ] Randevu raporları
- [ ] Kullanıcı aktivite raporları
- [ ] Excel/PDF export

#### Ayarlar & Güvenlik
- [ ] Firebase Admin SDK entegrasyonu
- [ ] Admin authentication
- [ ] Role-based access control
- [ ] Uygulama ayarları

## 🛠️ Teknoloji Stack

- **Frontend:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Backend:** Firebase Admin SDK
- **Database:** Firebase Firestore
- **Auth:** Firebase Auth
- **Deployment:** Vercel (önerilir)

## 📁 Proje Yapısı

```
kestir-cms/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard ana sayfa
│   ├── globals.css         # Global styles
│   ├── barbers/            # Berber yönetimi
│   ├── users/              # Kullanıcı yönetimi
│   ├── appointments/       # Randevu yönetimi
│   └── settings/           # Ayarlar
├── components/             # Reusable components
├── lib/                    # Utility functions
│   └── firebase-admin.ts   # Firebase Admin setup
├── types/                  # TypeScript types
└── public/                 # Static assets
```

## 🔐 Firebase Admin Kurulumu (Sonraki Adım)

1. Firebase Console'dan service account key indir
2. `.env.local` dosyası oluştur:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

3. Firebase Admin SDK'yı yapılandır

## 📊 İhtiyaç Analizi

### A. Dashboard (Ana Sayfa)
- Toplam berber, kullanıcı, randevu sayıları
- Aktif, tamamlanan, iptal edilen randevular
- Trend grafikleri
- Son aktiviteler

### B. Berber Yönetimi
- Listeleme, detaylar, onaylama
- Durum güncelleme, silme
- Filtreleme ve sıralama

### C. Kullanıcı Yönetimi
- Kullanıcı listesi ve detayları
- Engelleme/aktif etme
- Kullanıcı silme

### D. Randevu Yönetimi
- Tüm randevuları görüntüleme
- Filtreleme (tarih, durum, berber)
- İptal etme

### E. İçerik Yönetimi
- Yorum moderasyonu
- Bildirim yönetimi

### F. Raporlama
- Gelir, randevu, aktivite raporları
- Excel/PDF export

## 🎨 Design System

- **Primary Color:** #F57C00 (Orange)
- **Font:** System UI fonts
- **Border Radius:** 0.5rem - 1rem
- **Shadows:** Subtle elevations

## 📝 Notlar

- CMS'in ilk versiyonu hazır
- Yarın Firebase entegrasyonu eklenecek
- Admin authentication yapılacak
- Gerçek verilerle bağlantı kurulacak

## 🚀 Deployment

```bash
npm run build
npm start
```

Vercel'e deploy:
```bash
vercel
```

---

**Geliştirici:** Kestir Team
**Versiyon:** 1.0.0 (Beta)
**Son Güncelleme:** 2025-01-02
