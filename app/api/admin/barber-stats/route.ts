import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching barber statistics...');

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Fetch all barbers with role = 'barber'
    const barbersSnapshot = await adminDb
      .collection('barbers')
      .where('role', '==', 'barber')
      .get();

    const totalBarbers = barbersSnapshot.size;

    // Calculate new barbers in the last 30 days
    const newBarbers = barbersSnapshot.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      return createdAt && createdAt >= thirtyDaysAgo;
    }).length;

    const previousNewBarbers = barbersSnapshot.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;

    const barbersChange = previousNewBarbers > 0
      ? ((newBarbers - previousNewBarbers) / previousNewBarbers) * 100
      : newBarbers > 0 ? 100 : 0;

    // Fetch all employees
    const employeesSnapshot = await adminDb.collection('employees').get();
    const totalEmployees = employeesSnapshot.size;

    const newEmployees = employeesSnapshot.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      return createdAt && createdAt >= thirtyDaysAgo;
    }).length;

    const previousNewEmployees = employeesSnapshot.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;

    const employeesChange = previousNewEmployees > 0
      ? ((newEmployees - previousNewEmployees) / previousNewEmployees) * 100
      : newEmployees > 0 ? 100 : 0;

    // Fetch all appointments (Admin SDK bypasses security rules)
    const appointmentsSnapshot = await adminDb.collection('appointments').get();
    const totalAppointments = appointmentsSnapshot.size;

    // Average appointments per barber
    const avgAppointmentsPerBarber = totalBarbers > 0
      ? Math.round(totalAppointments / totalBarbers)
      : 0;

    // Count appointments by barber (using employeeId since that's who handles the appointment)
    const barberAppointments = new Map<string, number>();
    appointmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const employeeId = data.employeeId;
      if (employeeId) {
        barberAppointments.set(employeeId, (barberAppointments.get(employeeId) || 0) + 1);
      }
    });

    // Get top 5 barbers by appointment count
    const sortedBarbers = Array.from(barberAppointments.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topBarbersData = [];
    for (const [employeeId, count] of sortedBarbers) {
      // Try to find in employees collection first
      const employeeDoc = await adminDb.collection('employees').doc(employeeId).get();
      if (employeeDoc.exists) {
        const data = employeeDoc.data();
        topBarbersData.push({
          id: employeeId,
          name: data?.name || 'İsimsiz Çalışan',
          appointmentCount: count,
          rating: data?.rating || 4.5,
          city: data?.city || 'Belirtilmemiş',
        });
      } else {
        // Check in barbers collection
        const barberDoc = barbersSnapshot.docs.find(doc => doc.id === employeeId);
        if (barberDoc) {
          const data = barberDoc.data();
          topBarbersData.push({
            id: employeeId,
            name: data.name || data.shopName || 'İsimsiz Berber',
            appointmentCount: count,
            rating: data.rating || 4.5,
            city: data.city || 'Belirtilmemiş',
          });
        }
      }
    }

    // All barbers for the list
    const allBarbersData = barbersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.shopName || 'İsimsiz Berber',
        email: data.email || '',
        phone: data.phone || '',
        city: data.city || '',
        district: data.district || '',
        rating: data.rating || 0,
        active: data.active !== false,
        createdAt: data.createdAt?.toDate()?.toISOString() || null,
      };
    });

    // Sort by creation date (newest first)
    allBarbersData.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });

    // Count top-rated barbers (4+ stars)
    const topRatedCount = barbersSnapshot.docs.filter(doc => {
      const rating = doc.data().rating || 0;
      return rating >= 4.0;
    }).length;

    // Recent appointments (last 30 days)
    const recentAppointments = appointmentsSnapshot.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      return createdAt && createdAt >= thirtyDaysAgo;
    }).length;

    // Average occupancy rate (assuming max 100 appointments per barber per month)
    const maxPossibleAppointments = totalBarbers * 100;
    const avgOccupancyRate = maxPossibleAppointments > 0
      ? Math.round((recentAppointments / maxPossibleAppointments) * 100)
      : 0;

    const stats = {
      totalBarbers,
      totalEmployees,
      avgAppointmentsPerBarber,
      avgOccupancyRate,
      topRatedCount,
      newBarbersThisMonth: newBarbers,
      barbersChange: Math.round(barbersChange * 10) / 10,
      employeesChange: Math.round(employeesChange * 10) / 10,
    };

    console.log('✅ Barber statistics fetched successfully');

    return NextResponse.json({
      success: true,
      stats,
      topBarbers: topBarbersData,
      allBarbers: allBarbersData,
    });

  } catch (error: any) {
    console.error('❌ Error fetching barber statistics:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch barber statistics',
        message: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
