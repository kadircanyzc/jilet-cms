'use client'

import DashboardLayout from '@/components/DashboardLayout'
import AnalyticsCard from '@/components/AnalyticsCard'
import { ViewsChart, ContentDistributionChart } from '@/components/Charts'
import DataTable from '@/components/DataTable'
import { Eye, FileText, Users, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

interface DashboardStats {
  totalBarbers: number
  totalUsers: number
  totalAppointments: number
  activeUsers: number
  barbersChange: number
  usersChange: number
  appointmentsChange: number
  activeUsersChange: number
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBarbers: 0,
    totalUsers: 0,
    totalAppointments: 0,
    activeUsers: 0,
    barbersChange: 0,
    usersChange: 0,
    appointmentsChange: 0,
    activeUsersChange: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('📊 Starting to fetch dashboard stats...')

        const now = new Date()
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

        // Toplam Berberler
        console.log('👨‍💼 Fetching barbers...')
        const barbersSnapshot = await getDocs(collection(db, 'barbers'))
        const totalBarbers = barbersSnapshot.size
        console.log('✅ Barbers fetched:', totalBarbers)

        // Son 30 gün içinde eklenen berberler
        const recentBarbers = barbersSnapshot.docs.filter(doc => {
          const data = doc.data()
          const createdAt = data.createdAt?.toDate()
          return createdAt && createdAt >= thirtyDaysAgo
        }).length

        // Önceki 30 gün (30-60 gün arası)
        const previousBarbers = barbersSnapshot.docs.filter(doc => {
          const data = doc.data()
          const createdAt = data.createdAt?.toDate()
          return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo
        }).length

        const barbersChange = previousBarbers > 0
          ? ((recentBarbers - previousBarbers) / previousBarbers) * 100
          : recentBarbers > 0 ? 100 : 0

        // Toplam Kullanıcılar
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const totalUsers = usersSnapshot.size

        const recentUsers = usersSnapshot.docs.filter(doc => {
          const data = doc.data()
          const createdAt = data.createdAt?.toDate()
          return createdAt && createdAt >= thirtyDaysAgo
        }).length

        const previousUsers = usersSnapshot.docs.filter(doc => {
          const data = doc.data()
          const createdAt = data.createdAt?.toDate()
          return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo
        }).length

        const usersChange = previousUsers > 0
          ? ((recentUsers - previousUsers) / previousUsers) * 100
          : recentUsers > 0 ? 100 : 0

        // Toplam Randevular
        const appointmentsSnapshot = await getDocs(collection(db, 'appointments'))
        const totalAppointments = appointmentsSnapshot.size

        const recentAppointments = appointmentsSnapshot.docs.filter(doc => {
          const data = doc.data()
          const createdAt = data.createdAt?.toDate()
          return createdAt && createdAt >= thirtyDaysAgo
        })

        const previousAppointments = appointmentsSnapshot.docs.filter(doc => {
          const data = doc.data()
          const createdAt = data.createdAt?.toDate()
          return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo
        })

        const appointmentsChange = previousAppointments.length > 0
          ? ((recentAppointments.length - previousAppointments.length) / previousAppointments.length) * 100
          : recentAppointments.length > 0 ? 100 : 0

        // Aktif Kullanıcılar (son 30 gün içinde randevu alanlar)
        const activeUserIds = new Set(recentAppointments.map(doc => doc.data().userId))
        const activeUsers = activeUserIds.size

        // Önceki 30 gün aktif kullanıcılar
        const previousActiveUserIds = new Set(previousAppointments.map(doc => doc.data().userId))
        const previousActiveUsers = previousActiveUserIds.size

        const activeUsersChange = previousActiveUsers > 0
          ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100
          : activeUsers > 0 ? 100 : 0

        setStats({
          totalBarbers,
          totalUsers,
          totalAppointments,
          activeUsers,
          barbersChange: Math.round(barbersChange * 10) / 10,
          usersChange: Math.round(usersChange * 10) / 10,
          appointmentsChange: Math.round(appointmentsChange * 10) / 10,
          activeUsersChange: Math.round(activeUsersChange * 10) / 10,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Kestir yönetim panelinize hoş geldiniz</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <AnalyticsCard
            title="Toplam Randevular"
            value={loading ? '...' : stats.totalAppointments.toLocaleString('tr-TR')}
            change={loading ? 0 : stats.appointmentsChange}
            icon={Eye}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <AnalyticsCard
            title="Toplam Berberler"
            value={loading ? '...' : stats.totalBarbers.toLocaleString('tr-TR')}
            change={loading ? 0 : stats.barbersChange}
            icon={FileText}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <AnalyticsCard
            title="Toplam Kullanıcılar"
            value={loading ? '...' : stats.totalUsers.toLocaleString('tr-TR')}
            change={loading ? 0 : stats.usersChange}
            icon={Users}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <AnalyticsCard
            title="Aktif Kullanıcılar (30 gün)"
            value={loading ? '...' : stats.activeUsers.toLocaleString('tr-TR')}
            change={loading ? 0 : stats.activeUsersChange}
            icon={TrendingUp}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ViewsChart />
          </div>
          <div>
            <ContentDistributionChart />
          </div>
        </div>

        {/* Data Table */}
        <DataTable />
      </div>
    </DashboardLayout>
  )
}
