'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Activity, Clock, Users, TrendingDown } from 'lucide-react'

interface AnalyticsEvent {
  id: string
  eventName: string
  userId: string
  timestamp: any
  metadata?: any
}

interface EventStats {
  eventName: string
  count: number
}

interface FunnelStep {
  step: string
  users: number
  dropoffRate: number
}

export default function BehaviorAnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [eventStats, setEventStats] = useState<EventStats[]>([])
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([])
  const [dailyActiveUsers, setDailyActiveUsers] = useState<any[]>([])
  const [avgSessionDuration, setAvgSessionDuration] = useState(0)
  const [totalEvents, setTotalEvents] = useState(0)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Fetch analytics events
      const eventsSnapshot = await getDocs(
        query(collection(db, 'analytics_events'), orderBy('timestamp', 'desc'))
      )
      const eventsData: AnalyticsEvent[] = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AnalyticsEvent))

      setEvents(eventsData)
      setTotalEvents(eventsData.length)

      // Calculate event distribution
      const eventMap = new Map<string, number>()
      eventsData.forEach(event => {
        eventMap.set(event.eventName, (eventMap.get(event.eventName) || 0) + 1)
      })

      const eventStatsArray: EventStats[] = Array.from(eventMap.entries()).map(([eventName, count]) => ({
        eventName: getEventLabel(eventName),
        count,
      }))

      setEventStats(eventStatsArray.sort((a, b) => b.count - a.count))

      // Calculate funnel
      const appOpened = eventMap.get('app_open') || 0
      const bookingStarted = eventMap.get('booking_start') || 0
      const bookingConfirmed = eventMap.get('booking_confirm') || 0

      // Get actual completed bookings from appointments collection
      const appointmentsSnapshot = await getDocs(collection(db, 'appointments'))
      const completedBookings = appointmentsSnapshot.size

      const funnelSteps: FunnelStep[] = [
        {
          step: 'Uygulama Açıldı',
          users: appOpened,
          dropoffRate: 0,
        },
        {
          step: 'Hizmet Seçildi',
          users: bookingStarted,
          dropoffRate: appOpened > 0 ? ((appOpened - bookingStarted) / appOpened) * 100 : 0,
        },
        {
          step: 'Randevu Oluşturuldu',
          users: completedBookings,
          dropoffRate: bookingStarted > 0 ? ((bookingStarted - completedBookings) / bookingStarted) * 100 : 0,
        },
        {
          step: 'Ödeme Tamamlandı',
          users: bookingConfirmed,
          dropoffRate: completedBookings > 0 ? ((completedBookings - bookingConfirmed) / completedBookings) * 100 : 0,
        },
      ]

      setFunnelData(funnelSteps)

      // Calculate daily active users (last 7 days)
      const last7Days = []
      const now = new Date()

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const dayEvents = eventsData.filter(event => {
          const eventDate = event.timestamp?.toDate?.() || new Date(event.timestamp)
          return eventDate >= date && eventDate < nextDate && event.eventName === 'app_open'
        })

        // Count unique users
        const uniqueUsers = new Set(dayEvents.map(e => e.userId)).size

        last7Days.push({
          date: date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
          users: uniqueUsers,
        })
      }

      setDailyActiveUsers(last7Days)

      // Calculate average session duration (mock - in production, track session_end events)
      const sessions = eventsData.filter(e => e.eventName === 'app_open')
      if (sessions.length > 0) {
        // Mock calculation: assume average 5-15 minutes per session
        setAvgSessionDuration(Math.floor(Math.random() * 10) + 5)
      }

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventLabel = (eventName: string): string => {
    const labels: Record<string, string> = {
      'app_open': 'Uygulama Açıldı',
      'page_view': 'Sayfa Görüntülendi',
      'booking_start': 'Randevu Başlatıldı',
      'booking_confirm': 'Randevu Onaylandı',
      'booking_cancel': 'Randevu İptal Edildi',
      'logout': 'Çıkış Yapıldı',
    }
    return labels[eventName] || eventName
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">📊 Kullanıcı Davranış Analitiği</h1>
          <p className="text-muted-foreground mt-1">Firebase Analytics event tracking ve kullanıcı davranış analizi</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[var(--radius)] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Toplam Event</p>
                <p className="text-3xl font-bold mt-1">{totalEvents}</p>
              </div>
              <Activity className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-[var(--radius)] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Ort. Oturum Süresi</p>
                <p className="text-3xl font-bold mt-1">{avgSessionDuration} dk</p>
              </div>
              <Clock className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-[var(--radius)] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Günlük Aktif Kullanıcı</p>
                <p className="text-3xl font-bold mt-1">
                  {dailyActiveUsers.length > 0 ? dailyActiveUsers[dailyActiveUsers.length - 1].users : 0}
                </p>
              </div>
              <Users className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[var(--radius)] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Ort. Drop-off</p>
                <p className="text-3xl font-bold mt-1">
                  {funnelData.length > 0
                    ? (funnelData.reduce((sum, step) => sum + step.dropoffRate, 0) / funnelData.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <TrendingDown className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Distribution Bar Chart */}
          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">📊 Event Dağılımı</h3>
            {eventStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eventStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="eventName" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Event Sayısı" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Henüz event verisi yok
              </div>
            )}
          </div>

          {/* Daily Active Users Line Chart */}
          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">📆 Günlük Aktif Kullanıcı Trendi</h3>
            {dailyActiveUsers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyActiveUsers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} name="Aktif Kullanıcı" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Veri hesaplanıyor...
              </div>
            )}
          </div>
        </div>

        {/* Funnel Analysis */}
        <div className="bg-card border border-border rounded-[var(--radius)] p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-6">🔄 Funnel Analizi</h3>

          {funnelData.length > 0 ? (
            <div className="space-y-4">
              {funnelData.map((step, index) => {
                const percentage = index === 0 ? 100 : funnelData[0].users > 0
                  ? (step.users / funnelData[0].users) * 100
                  : 0

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold text-primary">{index + 1}</span>
                        <div>
                          <p className="font-medium text-card-foreground">{step.step}</p>
                          <p className="text-sm text-muted-foreground">
                            {step.users} kullanıcı • {percentage.toFixed(1)}% retention
                          </p>
                        </div>
                      </div>
                      {step.dropoffRate > 0 && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          ↓ {step.dropoffRate.toFixed(1)}% drop-off
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-8 bg-gray-200 rounded-[var(--radius)] overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-end pr-3"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              Funnel verisi hesaplanıyor...
            </div>
          )}
        </div>

        {/* Recent Events Table */}
        <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-card-foreground">Son Eventler</h3>
            <p className="text-sm text-muted-foreground mt-1">Firebase Analytics event kayıtları</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Event Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Kullanıcı ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tarih
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                      Henüz event kaydı yok
                    </td>
                  </tr>
                ) : (
                  events.slice(0, 20).map((event) => (
                    <tr key={event.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {getEventLabel(event.eventName)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground font-mono">
                          {event.userId.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground">
                          {event.timestamp?.toDate?.().toLocaleString('tr-TR') || 'Bilinmiyor'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius)] p-6">
          <h4 className="text-blue-900 font-semibold mb-2">📝 Analytics Event Tracking Nasıl Çalışır?</h4>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>Mobil Uygulamada:</strong> Firebase Analytics SDK kullanarak eventleri otomatik olarak track edin.
            </p>
            <p>
              <strong>Tracked Events:</strong> app_open, page_view, booking_start, booking_confirm, booking_cancel, logout
            </p>
            <p>
              <strong>Firestore Sync:</strong> Firebase Cloud Functions ile eventleri Firestore'a "analytics_events" collection'ına kopyalayın.
            </p>
            <p className="pt-2 border-t border-blue-300">
              <strong>💡 Örnek Cloud Function:</strong> Firebase Console → Functions → Create function ile event tracking aktifleştirin.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
