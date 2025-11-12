'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { db, auth } from '@/lib/firebase'
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'

interface BarberFormData {
  shopName: string
  ownerName: string
  username: string
  email: string
  phone: string
  address: string
  city: string
  district: string
  password: string
  confirmPassword: string
  description: string
  startTime: string
  endTime: string
  latitude: string
  longitude: string
}

export default function AddBarberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<BarberFormData>({
    shopName: '',
    ownerName: '',
    username: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    password: '',
    confirmPassword: '',
    description: '',
    startTime: '09:00',
    endTime: '21:00',
    latitude: '',
    longitude: '',
  })
  const [geoloading, setGeoloading] = useState(false)

  const validateStrongPassword = (password: string) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/
    return strongPasswordRegex.test(password)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleGeocodeAddress = async () => {
    if (!formData.address || !formData.district || !formData.city) {
      setError('Lütfen önce adres bilgilerini doldurun!')
      return
    }

    setGeoloading(true)
    try {
      const fullAddress = `${formData.address}, ${formData.district}, ${formData.city}, Turkey`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: data[0].lat,
          longitude: data[0].lon,
        }))
        alert('Konum başarıyla bulundu!')
      } else {
        setError('Adres için konum bulunamadı. Lütfen koordinatları manuel girin.')
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      setError('Konum arama sırasında bir hata oluştu.')
    } finally {
      setGeoloading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.shopName || !formData.ownerName || !formData.username || !formData.email ||
        !formData.phone || !formData.address || !formData.city || !formData.district ||
        !formData.password || !formData.confirmPassword) {
      setError('Lütfen tüm zorunlu alanları doldurunuz!')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler uyuşmuyor!')
      return
    }

    if (!validateStrongPassword(formData.password)) {
      setError('Şifre en az 8 karakter içermeli ve en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter (@$!%*?&#) içermelidir.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Geçerli bir email adresi giriniz!')
      return
    }

    setLoading(true)

    try {
      // Check if username already exists
      const usernameQuery = query(
        collection(db, 'barbers'),
        where('username', '==', formData.username.toLowerCase())
      )
      const usernameSnapshot = await getDocs(usernameQuery)

      if (!usernameSnapshot.empty) {
        setError('Bu kullanıcı adı zaten kullanılıyor!')
        setLoading(false)
        return
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )
      const userId = userCredential.user.uid

      // Create barber document
      const barberData: any = {
        shopName: formData.shopName,
        name: formData.shopName,
        ownerName: formData.ownerName,
        username: formData.username.toLowerCase(),
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        role: 'barber',
        description: formData.description || '',
        services: [],
        employees: [],
        slots: {},
        closedDays: [],
        workingHours: {
          startTime: formData.startTime,
          endTime: formData.endTime
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
      }

      // Add coordinates if available
      if (formData.latitude && formData.longitude) {
        barberData.coordinates = {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        }
      }

      await setDoc(doc(db, 'barbers', userId), barberData)

      // Log the action
      await setDoc(doc(collection(db, 'logs')), {
        action: 'barber_created',
        targetType: 'barber',
        targetId: userId,
        targetName: formData.shopName,
        performedBy: 'admin',
        performedAt: new Date(),
        details: {
          shopName: formData.shopName,
          ownerName: formData.ownerName,
          city: formData.city,
        }
      })

      alert('Berber başarıyla kaydedildi!')
      router.push('/barbers')
    } catch (error: any) {
      console.error('Registration error:', error)

      if (error.code === 'auth/email-already-in-use') {
        setError('Bu email adresi zaten kullanılıyor!')
      } else if (error.code === 'auth/weak-password') {
        setError('Şifre çok zayıf!')
      } else {
        setError('Kayıt sırasında bir hata oluştu: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/barbers"
              className="p-2 hover:bg-accent rounded-[var(--radius)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Yeni Berber Ekle</h1>
              <p className="text-muted-foreground mt-1">Sisteme yeni berber kaydı oluştur</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-[var(--radius)] border border-border">
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-[var(--radius)] text-destructive">
                {error}
              </div>
            )}

            {/* İşletme Bilgileri */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground">İşletme Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    İşletme Adı <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Örn: Gençlik Berber"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    İşletme Sahibi <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Örn: Ali Kaya"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  İşletme Açıklaması
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="İşletme hakkında kısa açıklama..."
                />
              </div>
            </div>

            {/* Hesap Bilgileri */}
            <div className="space-y-4 border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-card-foreground">Hesap Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Kullanıcı Adı <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Örn: genclikberber"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    E-posta <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Şifre <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Güçlü şifre"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    En az 8 karakter, büyük harf, küçük harf, rakam ve özel karakter içermeli
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Şifre Tekrar <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Şifre tekrar"
                    required
                  />
                </div>
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="space-y-4 border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-card-foreground">İletişim & Adres</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Telefon <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0555 555 55 55"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Şehir <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Örn: İstanbul"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    İlçe <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Örn: Kadıköy"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Adres <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Cadde, sokak, bina no"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Çalışma Saatleri */}
            <div className="space-y-4 border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-card-foreground">Çalışma Saatleri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Başlangıç Saati
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bitiş Saati
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Konum Bilgileri */}
            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-card-foreground">Konum Bilgileri</h3>
                <button
                  type="button"
                  onClick={handleGeocodeAddress}
                  disabled={geoloading || !formData.address || !formData.city}
                  className="px-4 py-2 bg-blue-600 text-white rounded-[var(--radius)] hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {geoloading ? 'Aranıyor...' : '📍 Adresten Bul'}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Adresten otomatik konum bulmak için yukarıdaki butona tıklayın veya manuel koordinat girin
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Enlem (Latitude)
                  </label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Örn: 41.0082"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Boylam (Longitude)
                  </label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Örn: 28.9784"
                  />
                </div>
              </div>
              {formData.latitude && formData.longitude && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-[var(--radius)] text-sm text-green-800">
                  ✓ Konum belirlendi: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-muted border-t border-border flex items-center justify-between">
            <Link
              href="/barbers"
              className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-[var(--radius)] hover:bg-accent transition-colors"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 transition-opacity flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
