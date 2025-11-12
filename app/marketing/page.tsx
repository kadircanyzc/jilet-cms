'use client'

import DashboardLayout from '@/components/DashboardLayout'
import AnalyticsCard from '@/components/AnalyticsCard'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy as fbOrderBy } from 'firebase/firestore'
import { MessageCircle, Star, TrendingUp, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react'

interface Review {
  id: string
  barberName: string
  userName: string
  rating: number
  comment: string
  date: string
  barberId: string
}

interface MarketingStats {
  totalReviews: number
  averageRating: number
  positiveReviews: number
  negativeReviews: number
  ratingTrend: number
}

export default function MarketingPage() {
  const [stats, setStats] = useState<MarketingStats>({
    totalReviews: 0,
    averageRating: 0,
    positiveReviews: 0,
    negativeReviews: 0,
    ratingTrend: 0,
  })
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRating, setFilterRating] = useState<number | null>(null)

  useEffect(() => {
    fetchMarketingData()
  }, [])

  const fetchMarketingData = async () => {
    try {
      console.log('📊 Fetching marketing data...')

      // Yorumları ana reviews koleksiyonundan çek
      const reviewsSnapshot = await getDocs(collection(db, 'reviews'))
      console.log('📝 Reviews found:', reviewsSnapshot.size)

      if (reviewsSnapshot.size === 0) {
        console.log('⚠️ No reviews found in reviews collection')
        setLoading(false)
        return
      }

      const now = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      let totalRating = 0
      let recentRatings = 0
      let recentCount = 0
      let previousRatings = 0
      let previousCount = 0

      // Önce tüm berberleri çek (barber adları için)
      const barbersSnapshot = await getDocs(collection(db, 'barbers'))
      const barbersMap = new Map()
      barbersSnapshot.docs.forEach(doc => {
        const data = doc.data()
        barbersMap.set(doc.id, data.name || data.shopName || 'Bilinmeyen Berber')
      })
      console.log('👨‍💼 Barbers loaded:', barbersMap.size)

      const reviewsData: Review[] = []

      for (const doc of reviewsSnapshot.docs) {
        const data = doc.data()
        const createdAt = data.createdAt?.toDate()

        totalRating += data.rating || 0

        // Son 30 gün
        if (createdAt && createdAt >= thirtyDaysAgo) {
          recentRatings += data.rating || 0
          recentCount++
        }

        // Önceki 30 gün (30-60 arası)
        if (createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo) {
          previousRatings += data.rating || 0
          previousCount++
        }

        // Berber adını Map'ten al
        const barberName = barbersMap.get(data.barberId) || 'Bilinmeyen Berber'

        reviewsData.push({
          id: doc.id,
          barberName,
          userName: data.userName || 'Anonim',
          rating: data.rating || 0,
          comment: data.comment || 'Yorum yok',
          date: createdAt ? createdAt.toLocaleDateString('tr-TR') : 'Bilinmiyor',
          barberId: data.barberId || '',
        })
      }

      // Ortalamalar
      const avgRating = totalRating / reviewsSnapshot.size
      const recentAvg = recentCount > 0 ? recentRatings / recentCount : 0
      const previousAvg = previousCount > 0 ? previousRatings / previousCount : 0

      // Trend hesaplama
      const ratingTrend = previousAvg > 0
        ? ((recentAvg - previousAvg) / previousAvg) * 100
        : recentAvg > 0 ? 100 : 0

      // Pozitif/Negatif
      const positiveReviews = reviewsData.filter(r => r.rating >= 4).length
      const negativeReviews = reviewsData.filter(r => r.rating <= 2).length

      setStats({
        totalReviews: reviewsSnapshot.size,
        averageRating: Math.round(avgRating * 10) / 10,
        positiveReviews,
        negativeReviews,
        ratingTrend: Math.round(ratingTrend * 10) / 10,
      })

      // Tarihe göre sırala (en yeni önce)
      reviewsData.sort((a, b) => {
        const dateA = new Date(a.date.split('.').reverse().join('-'))
        const dateB = new Date(b.date.split('.').reverse().join('-'))
        return dateB.getTime() - dateA.getTime()
      })

      setReviews(reviewsData)
    } catch (error) {
      console.error('❌ Error fetching marketing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReviews = filterRating
    ? reviews.filter(r => r.rating === filterRating)
    : reviews

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">📢 Pazarlama & Geri Bildirim</h1>
          <p className="text-muted-foreground mt-1">Müşteri deneyimi ve memnuniyet analizi</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <AnalyticsCard
            title="Toplam Yorum"
            value={loading ? '...' : stats.totalReviews.toLocaleString('tr-TR')}
            change={0}
            icon={MessageCircle}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <AnalyticsCard
            title="Ortalama Puan"
            value={loading ? '...' : stats.averageRating.toFixed(1)}
            change={loading ? 0 : stats.ratingTrend}
            icon={Star}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
          />
          <AnalyticsCard
            title="Pozitif Yorumlar (4+)"
            value={loading ? '...' : stats.positiveReviews.toLocaleString('tr-TR')}
            change={0}
            icon={ThumbsUp}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <AnalyticsCard
            title="Negatif Yorumlar (≤2)"
            value={loading ? '...' : stats.negativeReviews.toLocaleString('tr-TR')}
            change={0}
            icon={AlertTriangle}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
          />
        </div>

        {/* Reviews Table */}
        <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Tüm Kullanıcı Yorumları</h3>
                <p className="text-sm text-muted-foreground mt-1">Müşteri geri bildirimleri ve değerlendirmeler</p>
              </div>

              {/* Rating Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Filtrele:</span>
                <select
                  value={filterRating || ''}
                  onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                  className="px-3 py-2 border border-border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Tüm Puanlar</option>
                  <option value="5">5 Yıldız</option>
                  <option value="4">4 Yıldız</option>
                  <option value="3">3 Yıldız</option>
                  <option value="2">2 Yıldız</option>
                  <option value="1">1 Yıldız</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Berber
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Puan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Yorum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      {filterRating ? `${filterRating} yıldızlı yorum bulunamadı` : 'Henüz yorum yapılmamış'}
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{review.date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-card-foreground">{review.userName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{review.barberName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStars(review.rating)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground max-w-md truncate">
                          {review.comment}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Toplam <span className="font-medium text-foreground">{filteredReviews.length}</span> yorum gösteriliyor
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
