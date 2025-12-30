'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'

// Line Chart Component - Günlük Randevu Takibi
export function ViewsChart() {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointmentStats()
  }, [])

  const fetchAppointmentStats = async () => {
    try {
      setLoading(true)

      // Son 7 günün verilerini çek
      const last7Days = []
      const today = new Date()

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        last7Days.push({
          date,
          nextDate,
          dayName: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
          fullDate: date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
        })
      }

      // Her gün için randevu sayısını hesapla
      const statsPromises = last7Days.map(async ({ date, nextDate, dayName, fullDate }) => {
        const appointmentsRef = collection(db, 'appointments')
        const q = query(
          appointmentsRef,
          where('createdAt', '>=', Timestamp.fromDate(date)),
          where('createdAt', '<', Timestamp.fromDate(nextDate))
        )

        const snapshot = await getDocs(q)
        const totalAppointments = snapshot.size

        // Onaylanmış randevular
        const confirmedAppointments = snapshot.docs.filter(
          doc => doc.data().status === 'confirmed'
        ).length

        return {
          name: dayName,
          fullDate: fullDate,
          appointments: totalAppointments,
          confirmed: confirmedAppointments
        }
      })

      const stats = await Promise.all(statsPromises)
      setChartData(stats)

      console.log('📊 Appointment stats loaded:', stats)
    } catch (error) {
      console.error('Error fetching appointment stats:', error)
      // Hata durumunda boş veri göster
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-[var(--radius)] border border-border p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-6">Günlük Randevu İstatistikleri (Son 7 Gün)</h3>
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-[var(--radius)] border border-border p-6">
      <h3 className="text-lg font-semibold text-card-foreground mb-6">Günlük Randevu İstatistikleri (Son 7 Gün)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            labelFormatter={(value, payload) => {
              if (payload && payload[0]) {
                return `${payload[0].payload.fullDate} (${value})`
              }
              return value
            }}
          />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Area
            type="monotone"
            dataKey="appointments"
            stroke="#2563EB"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAppointments)"
            name="Toplam Randevu"
          />
          <Area
            type="monotone"
            dataKey="confirmed"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorConfirmed)"
            name="Onaylanan"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Donut Chart Component
export function ContentDistributionChart() {
  const data = [
    { name: 'Saç Kesimi', value: 400, color: '#2563EB' },
    { name: 'Sakal Tıraşı', value: 300, color: '#7C3AED' },
    { name: 'Cilt Bakımı', value: 200, color: '#F59E0B' },
    { name: 'Kombo Paket', value: 100, color: '#10B981' },
  ]

  return (
    <div className="bg-card rounded-[var(--radius)] border border-border p-6">
      <h3 className="text-lg font-semibold text-card-foreground mb-6">Hizmet Dağılımı</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-medium text-card-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
