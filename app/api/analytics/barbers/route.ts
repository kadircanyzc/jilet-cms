import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    console.log(`📊 Fetching barber analytics for last ${days} days`);

    // Son N günün başlangıç tarihini hesapla
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateString = startDate.toISOString().split('T')[0];

    // Barber bazında verileri çek
    const barberRef = collection(db, 'analytics_barber_daily');
    const q = query(
      barberRef,
      where('date', '>=', startDateString)
    );
    const snapshot = await getDocs(q);

    // Berber ID'ye göre grupla ve topla
    const barberStats: Record<string, {
      barber_id: string;
      profile_views: number;
      bookings: number;
      revenue: number;
      favorites_added: number;
      conversion_rate: number;
    }> = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const barberId = data.barber_id;

      if (!barberStats[barberId]) {
        barberStats[barberId] = {
          barber_id: barberId,
          profile_views: 0,
          bookings: 0,
          revenue: 0,
          favorites_added: 0,
          conversion_rate: 0
        };
      }

      barberStats[barberId].profile_views += data.profile_views || 0;
      barberStats[barberId].bookings += data.bookings || 0;
      barberStats[barberId].revenue += data.revenue || 0;
      barberStats[barberId].favorites_added += data.favorites_added || 0;
    });

    // Conversion rate'i hesapla
    Object.values(barberStats).forEach(stats => {
      if (stats.profile_views > 0) {
        stats.conversion_rate = (stats.bookings / stats.profile_views) * 100;
      }
    });

    // Array'e çevir ve booking sayısına göre sırala
    const sortedBarbers = Object.values(barberStats)
      .sort((a, b) => b.bookings - a.bookings);

    console.log(`✅ Fetched ${sortedBarbers.length} barber stats`);

    return NextResponse.json({
      success: true,
      data: sortedBarbers,
      count: sortedBarbers.length
    });

  } catch (error: any) {
    console.error('❌ Barber analytics API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
