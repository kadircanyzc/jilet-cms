import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    console.log(`📊 Fetching analytics for last ${days} days`);

    // Son N günün verilerini çek
    const dailyRef = collection(db, 'analytics_daily');
    const q = query(dailyRef, orderBy('__name__', 'desc'), limit(days));
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map(doc => ({
      date: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Fetched ${data.length} days of analytics data`);

    return NextResponse.json({
      success: true,
      data,
      count: data.length
    });

  } catch (error: any) {
    console.error('❌ Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
