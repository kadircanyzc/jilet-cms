'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, Target, Plus, Trash2, Send } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Campaign {
  id: string
  name: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  startDate: any
  endDate: any
  targetSegment: string
  message: string
  createdAt: any
}

interface CampaignStats {
  campaignName: string
  userCount: number
  conversionRate: number
  source: string
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export default function CampaignsPage() {
  const { user, hasPermission } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [campaignStats, setCampaignStats] = useState<CampaignStats[]>([])
  const [platformStats, setPlatformStats] = useState<any[]>([])
  const [conversionTrend, setConversionTrend] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    endDate: '',
    targetSegment: 'all',
    message: '',
  })

  useEffect(() => {
    fetchCampaigns()
    fetchCampaignStats()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const campaignsSnapshot = await getDocs(
        query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'))
      )
      const campaignsData: Campaign[] = campaignsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Campaign))

      setCampaigns(campaignsData)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaignStats = async () => {
    try {
      // Fetch users with UTM parameters
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Fetch appointments for conversion tracking
      const appointmentsSnapshot = await getDocs(collection(db, 'appointments'))
      const appointments = appointmentsSnapshot.docs.map(doc => doc.data())

      // Group by campaign
      const campaignMap = new Map<string, { users: number, conversions: number, source: string }>()

      users.forEach((user: any) => {
        if (user.utmCampaign) {
          const key = user.utmCampaign
          if (!campaignMap.has(key)) {
            campaignMap.set(key, { users: 0, conversions: 0, source: user.utmSource || 'unknown' })
          }
          const stats = campaignMap.get(key)!
          stats.users++

          // Check if user has made a booking (conversion)
          const hasBooking = appointments.some((apt: any) => apt.userId === user.id)
          if (hasBooking) {
            stats.conversions++
          }
        }
      })

      // Convert to array for charts
      const statsArray: CampaignStats[] = Array.from(campaignMap.entries()).map(([name, data]) => ({
        campaignName: name,
        userCount: data.users,
        conversionRate: data.users > 0 ? (data.conversions / data.users) * 100 : 0,
        source: data.source,
      }))

      setCampaignStats(statsArray)

      // Platform stats (pie chart)
      const platformMap = new Map<string, number>()
      users.forEach((user: any) => {
        if (user.utmSource) {
          platformMap.set(user.utmSource, (platformMap.get(user.utmSource) || 0) + 1)
        }
      })

      const platformArray = Array.from(platformMap.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))

      setPlatformStats(platformArray)

      // Conversion trend (last 7 days mock data - in production, filter by date)
      const trendData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })

        // Calculate conversions for this day (simplified)
        const dayConversions = Math.floor(Math.random() * 20) + 10
        trendData.push({
          date: dateStr,
          conversions: dayConversions,
        })
      }

      setConversionTrend(trendData)

    } catch (error) {
      console.error('Error fetching campaign stats:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await addDoc(collection(db, 'campaigns'), {
        name: formData.name,
        utmSource: formData.utmSource,
        utmMedium: formData.utmMedium,
        utmCampaign: formData.utmCampaign,
        startDate: new Date(),
        endDate: new Date(formData.endDate),
        targetSegment: formData.targetSegment,
        message: formData.message,
        createdAt: new Date(),
        createdBy: user?.email || 'admin',
      })

      alert('Kampanya başarıyla oluşturuldu!')
      setShowAddForm(false)
      setFormData({
        name: '',
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        endDate: '',
        targetSegment: 'all',
        message: '',
      })
      fetchCampaigns()
      fetchCampaignStats()
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Kampanya oluşturulurken bir hata oluştu!')
    }
  }

  const handleDelete = async (campaignId: string, campaignName: string) => {
    if (!confirm(`"${campaignName}" kampanyasını silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'campaigns', campaignId))
      alert('Kampanya silindi!')
      fetchCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('Kampanya silinirken bir hata oluştu!')
    }
  }

  const canManage = hasPermission('*') || hasPermission('admin')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">📊 Pazarlama & Kampanya Performansı</h1>
            <p className="text-muted-foreground mt-1">UTM takibi, kampanya yönetimi ve performans analizi</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 transition-opacity flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Kampanya</span>
            </button>
          )}
        </div>

        {/* Add Campaign Form */}
        {showAddForm && (
          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Yeni Kampanya Oluştur</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Kampanya Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Örn: Yaz Kampanyası 2024"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bitiş Tarihi *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    UTM Source *
                  </label>
                  <input
                    type="text"
                    value={formData.utmSource}
                    onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Örn: instagram, google, tiktok"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    UTM Medium *
                  </label>
                  <input
                    type="text"
                    value={formData.utmMedium}
                    onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Örn: social, cpc, email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    UTM Campaign *
                  </label>
                  <input
                    type="text"
                    value={formData.utmCampaign}
                    onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Örn: summer_sale_2024"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hedef Segment
                  </label>
                  <select
                    value={formData.targetSegment}
                    onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Tüm Kullanıcılar</option>
                    <option value="new">Yeni Kullanıcılar</option>
                    <option value="active">Aktif Kullanıcılar</option>
                    <option value="inactive">Pasif Kullanıcılar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Kampanya Mesajı
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Kullanıcılara gönderilecek mesaj..."
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 transition-opacity"
                >
                  Kampanya Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-[var(--radius)] hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[var(--radius)] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Aktif Kampanyalar</p>
                <p className="text-3xl font-bold mt-1">{campaigns.filter(c => new Date(c.endDate?.toDate?.() || c.endDate) > new Date()).length}</p>
              </div>
              <Target className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-[var(--radius)] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Toplam Kullanıcı (UTM)</p>
                <p className="text-3xl font-bold mt-1">{campaignStats.reduce((sum, c) => sum + c.userCount, 0)}</p>
              </div>
              <Users className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-[var(--radius)] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Ort. Dönüşüm Oranı</p>
                <p className="text-3xl font-bold mt-1">
                  {campaignStats.length > 0
                    ? (campaignStats.reduce((sum, c) => sum + c.conversionRate, 0) / campaignStats.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-200" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign User Count Bar Chart */}
          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">📈 Kampanya Bazlı Kullanıcı Sayısı</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="campaignName" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="userCount" fill="#3b82f6" name="Kullanıcı Sayısı" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Performance Pie Chart */}
          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">🔹 Platform Bazlı Performans</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion Trend Line Chart */}
          <div className="bg-card border border-border rounded-[var(--radius)] p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">🔄 Dönüşüm Oranı Trendi (Son 7 Gün)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={conversionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="conversions" stroke="#8b5cf6" strokeWidth={2} name="Dönüşüm" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-card-foreground">Kampanya Listesi</h3>
            <p className="text-sm text-muted-foreground mt-1">Tüm pazarlama kampanyaları</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Kampanya Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    UTM Parametreleri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Hedef
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Bitiş Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Durum
                  </th>
                  {canManage && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      İşlemler
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="px-6 py-8 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="px-6 py-8 text-center text-muted-foreground">
                      Henüz kampanya oluşturulmamış
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => {
                    const endDate = campaign.endDate?.toDate?.() || new Date(campaign.endDate)
                    const isActive = endDate > new Date()

                    return (
                      <tr key={campaign.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-card-foreground">{campaign.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Source: {campaign.utmSource}</div>
                            <div>Medium: {campaign.utmMedium}</div>
                            <div>Campaign: {campaign.utmCampaign}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground">
                            {campaign.targetSegment === 'all' ? 'Tüm Kullanıcılar' :
                             campaign.targetSegment === 'new' ? 'Yeni Kullanıcılar' :
                             campaign.targetSegment === 'active' ? 'Aktif Kullanıcılar' :
                             'Pasif Kullanıcılar'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground">
                            {endDate.toLocaleDateString('tr-TR')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isActive ? 'Aktif' : 'Sona Erdi'}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDelete(campaign.id, campaign.name)}
                              className="p-2 hover:bg-destructive/10 rounded-[var(--radius)] transition-colors text-destructive"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
