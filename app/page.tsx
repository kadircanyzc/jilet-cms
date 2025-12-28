'use client'

import DashboardLayout from '@/components/DashboardLayout'
import AnalyticsCard from '@/components/AnalyticsCard'
import { ViewsChart, ContentDistributionChart } from '@/components/Charts'
import DataTable from '@/components/DataTable'
import { Eye, FileText, Users, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'

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

        const user = auth.currentUser;
        if (!user) {
          console.error('No authenticated user');
          window.location.href = '/login';
          return;
        }

        const token = await user.getIdToken();
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401 || response.status === 403) {
            console.error('Auth error, redirecting to login');
            window.location.href = '/login';
            return;
          }
          throw new Error(errorData.error || 'Failed to fetch dashboard stats');
        }

        const data = await response.json();
        setStats(data.stats);
        console.log('✅ Dashboard stats loaded successfully');
      } catch (error: any) {
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
