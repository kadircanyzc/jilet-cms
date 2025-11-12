'use client'

import DashboardLayout from '@/components/DashboardLayout'
import AnalyticsCard from '@/components/AnalyticsCard'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { Scissors, Star, TrendingUp, Users, Calendar, Award, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BarberStats {
  totalBarbers: number
  totalEmployees: number
  avgAppointmentsPerBarber: number
  avgOccupancyRate: number
  topRatedCount: number
  newBarbersThisMonth: number
  barbersChange: number
  employeesChange: number
}

interface TopBarber {
  id: string
  name: string
  appointmentCount: number
  rating: number
  city: string
}

interface BarberItem {
  id: string
  name: string
  email?: string
  phone?: string
  city?: string
  district?: string
  rating?: number
  active?: boolean
  createdAt?: any
}

export default function BarbersPage() {
  const router = useRouter()
  const [stats, setStats] = useState<BarberStats>({
    totalBarbers: 0,
    totalEmployees: 0,
    avgAppointmentsPerBarber: 0,
    avgOccupancyRate: 0,
    topRatedCount: 0,
    newBarbersThisMonth: 0,
    barbersChange: 0,
    employeesChange: 0,
  })
  const [topBarbers, setTopBarbers] = useState<TopBarber[]>([])
  const [allBarbers, setAllBarbers] = useState<BarberItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBarberStats = async () => {
      try {
        const now = new Date()
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

        // Toplam Berberler
        const barbersSnapshot = await getDocs(
          query(collection(db, 'barbers'), where('role', '==', 'barber'))
        )
        const totalBarbers = barbersSnapshot.size

        // Yeni berberler (son 30 gün)
        const newBarbers = barbersSnapshot.docs.filter(doc => {
          const data = doc.data()
          const createdAt = data.createdAt?.toDate()
          return createdAt && createdAt >= thirtyDaysAgo
        }).length

        const previousNewBarbers = barbersSnapshot.docs.filter(doc => {
          const data = doc.data()
          const createdAt = data.createdAt?.toDate()
          return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo
        }).length

        const barbersChange = previousNewBarbers > 0
          ? ((newBarbers - previousNewBarbers) / previousNewBarbers) * 100
          : newBarbers > 0 ? 100 : 0

        // Toplam Çalışanlar/Ustalar
        const employeesSnapshot = await getDocs(collection(db, 'employees'))
        const totalEmployees = employeesSnapshot.size

        const newEmployees = employeesSnapshot.docs.filter(doc => {
          const data = doc.data()
          const createdAt = data.createdAt?.toDate()
          return createdAt && createdAt >= thirtyDaysAgo
        }).length

        const previousNewEmployees = employeesSnapshot.docs.filter(doc => {
          const data = doc.data()
          const createdAt = data.createdAt?.toDate()
          return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo
        }).length

        const employeesChange = previousNewEmployees > 0
          ? ((newEmployees - previousNewEmployees) / previousNewEmployees) * 100
          : newEmployees > 0 ? 100 : 0

        // Randevular
        const appointmentsSnapshot = await getDocs(collection(db, 'appointments'))

        // Berber başına ortalama randevu
        const avgAppointmentsPerBarber = totalBarbers > 0
          ? Math.round(appointmentsSnapshot.size / totalBarbers)
          : 0

        // En çok randevu alan berberleri bul
        const barberAppointments = new Map<string, number>()
        appointmentsSnapshot.docs.forEach(doc => {
          const data = doc.data()
          const barberId = data.barberId
          if (barberId) {
            barberAppointments.set(barberId, (barberAppointments.get(barberId) || 0) + 1)
          }
        })

        // En çok randevu alan top 5 berber
        const sortedBarbers = Array.from(barberAppointments.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)

        const topBarbersData: TopBarber[] = []
        for (const [barberId, count] of sortedBarbers) {
          const barberDoc = barbersSnapshot.docs.find(doc => doc.id === barberId)
          if (barberDoc) {
            const data = barberDoc.data()
            topBarbersData.push({
              id: barberId,
              name: data.name || data.shopName || 'İsimsiz Berber',
              appointmentCount: count,
              rating: data.rating || 4.5,
              city: data.city || 'Belirtilmemiş',
            })
          }
        }

        setTopBarbers(topBarbersData)

        // All barbers for the list
        const allBarbersData: BarberItem[] = barbersSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || data.shopName || 'İsimsiz Berber',
            email: data.email || '',
            phone: data.phone || '',
            city: data.city || '',
            district: data.district || '',
            rating: data.rating || 0,
            active: data.active !== false,
            createdAt: data.createdAt,
          }
        })

        // Sort by creation date (newest first)
        allBarbersData.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(0)
          const bDate = b.createdAt?.toDate?.() || new Date(0)
          return bDate.getTime() - aDate.getTime()
        })

        setAllBarbers(allBarbersData)

        // 4+ yıldızlı berberler
        const topRatedCount = barbersSnapshot.docs.filter(doc => {
          const rating = doc.data().rating || 0
          return rating >= 4.0
        }).length

        // Doluluk oranı (son 30 gün için)
        const recentAppointments = appointmentsSnapshot.docs.filter(doc => {
          const data = doc.data()
          const createdAt = data.createdAt?.toDate()
          return createdAt && createdAt >= thirtyDaysAgo
        }).length

        // Ortalama doluluk oranı (her berber için maksimum 100 randevu varsayımı)
        const maxPossibleAppointments = totalBarbers * 100
        const avgOccupancyRate = maxPossibleAppointments > 0
          ? Math.round((recentAppointments / maxPossibleAppointments) * 100)
          : 0

        setStats({
          totalBarbers,
          totalEmployees,
          avgAppointmentsPerBarber,
          avgOccupancyRate,
          topRatedCount,
          newBarbersThisMonth: newBarbers,
          barbersChange: Math.round(barbersChange * 10) / 10,
          employeesChange: Math.round(employeesChange * 10) / 10,
        })
      } catch (error) {
        console.error('Error fetching barber stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBarberStats()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">💈 Berber Analitiği</h1>
            <p className="text-muted-foreground mt-1">Platformunuzdaki tüm berber ve çalışan istatistikleri</p>
          </div>
          <a
            href="/barbers/add"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 transition-opacity flex items-center space-x-2"
          >
            <span className="text-lg">+</span>
            <span>Yeni Berber Ekle</span>
          </a>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <AnalyticsCard
            title="Toplam Berberler"
            value={loading ? '...' : stats.totalBarbers.toLocaleString('tr-TR')}
            change={loading ? 0 : stats.barbersChange}
            icon={Scissors}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <AnalyticsCard
            title="Toplam Ustalar"
            value={loading ? '...' : stats.totalEmployees.toLocaleString('tr-TR')}
            change={loading ? 0 : stats.employeesChange}
            icon={Users}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <AnalyticsCard
            title="Berber Başına Ort. Randevu"
            value={loading ? '...' : stats.avgAppointmentsPerBarber.toLocaleString('tr-TR')}
            change={0}
            icon={Calendar}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <AnalyticsCard
            title="Ortalama Doluluk Oranı"
            value={loading ? '...' : `${stats.avgOccupancyRate}%`}
            change={0}
            icon={TrendingUp}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
          <AnalyticsCard
            title="4+ Yıldızlı Berberler"
            value={loading ? '...' : stats.topRatedCount.toLocaleString('tr-TR')}
            change={0}
            icon={Star}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
          />
          <AnalyticsCard
            title="Yeni Berber (30 Gün)"
            value={loading ? '...' : stats.newBarbersThisMonth.toLocaleString('tr-TR')}
            change={loading ? 0 : stats.barbersChange}
            icon={Award}
            iconColor="text-pink-600"
            iconBgColor="bg-pink-100"
          />
        </div>

        {/* Top Barbers Table */}
        <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-card-foreground">En Çok Randevu Alan Berberler</h3>
            <p className="text-sm text-muted-foreground mt-1">Platformdaki en aktif berberlerin listesi</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Sıra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Berber Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Şehir
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Puan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Randevu Sayısı
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : topBarbers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Henüz randevu alınmamış
                    </td>
                  </tr>
                ) : (
                  topBarbers.map((barber, index) => (
                    <tr key={barber.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-2xl font-bold ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                            index === 2 ? 'text-orange-600' : 'text-muted-foreground'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-card-foreground">{barber.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{barber.city}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">{barber.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-primary">
                          {barber.appointmentCount.toLocaleString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => router.push(`/barbers/${barber.id}`)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-[var(--radius)] hover:bg-blue-200 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Detay</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Barbers Table */}
        <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-card-foreground">Tüm Berberler</h3>
            <p className="text-sm text-muted-foreground mt-1">Platformdaki tüm berberlerin listesi</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Berber Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    İletişim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Konum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Puan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : allBarbers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Henüz berber bulunmuyor
                    </td>
                  </tr>
                ) : (
                  allBarbers.map((barber) => (
                    <tr key={barber.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-card-foreground">{barber.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {barber.email && <div>{barber.email}</div>}
                          {barber.phone && <div>{barber.phone}</div>}
                          {!barber.email && !barber.phone && '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {barber.city && barber.district ? `${barber.district}, ${barber.city}` :
                           barber.city || barber.district || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">
                            {barber.rating ? barber.rating.toFixed(1) : '0.0'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          barber.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {barber.active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => router.push(`/barbers/${barber.id}`)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-[var(--radius)] hover:bg-blue-200 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Detay</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
