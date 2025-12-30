'use client'

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DailyMetrics {
  date: string;
  total_sessions: number;
  total_bookings: number;
  avg_booking_value: number;
  booking_funnel: {
    sessions: number;
    profile_views: number;
    booking_initiated: number;
    slot_picker_loaded: number;
    booking_confirmed: number;
  };
  bookings_by_service: Record<string, number>;
  slot_unavailable_count: number;
  abandonment_steps: Record<string, number>;
}

interface BarberStats {
  barber_id: string;
  profile_views: number;
  bookings: number;
  revenue: number;
  conversion_rate: number;
  favorites_added: number;
}

export default function AnalyticsPage() {
  const [dailyData, setDailyData] = useState<DailyMetrics[]>([]);
  const [barberData, setBarberData] = useState<BarberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedDays]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Günlük verileri çek
      const dailyRes = await fetch(`/api/analytics?days=${selectedDays}`);
      const dailyJson = await dailyRes.json();

      if (dailyJson.success) {
        setDailyData(dailyJson.data);
      }

      // Berber verilerini çek
      const barberRes = await fetch(`/api/analytics/barbers?days=${selectedDays}`);
      const barberJson = await barberRes.json();

      if (barberJson.success) {
        setBarberData(barberJson.data.slice(0, 10)); // Top 10
      }

    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Toplam metrikleri hesapla
  const totalBookings = dailyData.reduce((sum, day) => sum + day.total_bookings, 0);
  const totalSessions = dailyData.reduce((sum, day) => sum + day.total_sessions, 0);
  const conversionRate = totalSessions > 0 ? ((totalBookings / totalSessions) * 100).toFixed(2) : '0.00';
  const avgBookingValue = dailyData.length > 0
    ? dailyData.reduce((sum, day) => sum + day.avg_booking_value, 0) / dailyData.length
    : 0;

  // Son günün funnel verisi
  const latestFunnel = dailyData[0]?.booking_funnel || {
    sessions: 0,
    profile_views: 0,
    booking_initiated: 0,
    slot_picker_loaded: 0,
    booking_confirmed: 0
  };

  // Funnel verisini chart formatına çevir
  const funnelData = [
    { name: 'Oturum', value: latestFunnel.sessions, percentage: 100 },
    {
      name: 'Profil',
      value: latestFunnel.profile_views,
      percentage: latestFunnel.sessions > 0 ? ((latestFunnel.profile_views / latestFunnel.sessions) * 100).toFixed(1) : 0
    },
    {
      name: 'Randevu',
      value: latestFunnel.booking_initiated,
      percentage: latestFunnel.profile_views > 0 ? ((latestFunnel.booking_initiated / latestFunnel.profile_views) * 100).toFixed(1) : 0
    },
    {
      name: 'Slot',
      value: latestFunnel.slot_picker_loaded,
      percentage: latestFunnel.booking_initiated > 0 ? ((latestFunnel.slot_picker_loaded / latestFunnel.booking_initiated) * 100).toFixed(1) : 0
    },
    {
      name: 'Tamamlandı',
      value: latestFunnel.booking_confirmed,
      percentage: latestFunnel.slot_picker_loaded > 0 ? ((latestFunnel.booking_confirmed / latestFunnel.slot_picker_loaded) * 100).toFixed(1) : 0
    }
  ];

  // Abandonment data
  const abandonmentData = dailyData[0]?.abandonment_steps
    ? Object.entries(dailyData[0].abandonment_steps).map(([step, count]) => ({
        step: step.replace(/_/g, ' '),
        count
      }))
    : [];

  // Service data
  const serviceData = dailyData[0]?.bookings_by_service
    ? Object.entries(dailyData[0].bookings_by_service).map(([serviceId, count]) => ({
        service: serviceId.substring(0, 20),
        count
      }))
    : [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics V1</h1>
            <p className="text-gray-600 mt-1">Kullanıcı davranışı ve performans metrikleri</p>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setSelectedDays(days)}
                className={`px-4 py-2 rounded-lg ${
                  selectedDays === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Son {days} Gün
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Toplam Randevular</p>
            <p className="text-3xl font-bold mt-2">{totalBookings.toLocaleString('tr-TR')}</p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Toplam Oturumlar</p>
            <p className="text-3xl font-bold mt-2">{totalSessions.toLocaleString('tr-TR')}</p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Dönüşüm Oranı</p>
            <p className="text-3xl font-bold mt-2">{conversionRate}%</p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Ort. Randevu Değeri</p>
            <p className="text-3xl font-bold mt-2">₺{avgBookingValue.toFixed(0)}</p>
          </div>
        </div>

        {/* Section 2: Daily Trend */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Günlük Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[...dailyData].reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="total_bookings" stroke="#2563EB" strokeWidth={2} name="Randevular" />
              <Line type="monotone" dataKey="total_sessions" stroke="#10B981" strokeWidth={2} name="Oturumlar" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Section 3: Booking Funnel */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Randevu Hunisi (Son Gün)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload.length > 0) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p className="font-bold">{data.name}</p>
                        <p>Kullanıcı: {data.value}</p>
                        <p className="text-sm text-gray-600">Dönüşüm: {data.percentage}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" fill="#2563EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Section 4: Top 10 Barbers */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">En İyi 10 Berber</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Berber ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Profil Görüntüleme</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Randevular</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Dönüşüm %</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Gelir</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {barberData.map((barber, index) => (
                  <tr key={barber.barber_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{barber.barber_id.substring(0, 20)}...</td>
                    <td className="px-4 py-3 text-sm">{barber.profile_views}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{barber.bookings}</td>
                    <td className="px-4 py-3 text-sm">{barber.conversion_rate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm">₺{barber.revenue.toLocaleString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Abandonment & Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Abandonment */}
          {abandonmentData.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">Vazgeçme Noktaları</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={abandonmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step" stroke="#9CA3AF" style={{ fontSize: '10px' }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Services */}
          {serviceData.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold mb-4">Hizmet Dağılımı</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={serviceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" stroke="#9CA3AF" style={{ fontSize: '10px' }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
