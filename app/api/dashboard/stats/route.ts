import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Check if user is admin
      const adminDoc = await adminDb.collection('admins').doc(decodedToken.uid).get();
      if (!adminDoc.exists) {
        return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 });
      }

      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Fetch all data using Admin SDK
      const [barbersSnapshot, usersSnapshot, appointmentsSnapshot] = await Promise.all([
        adminDb.collection('barbers').get(),
        adminDb.collection('users').get(),
        adminDb.collection('appointments').get(),
      ]);

      const totalBarbers = barbersSnapshot.size;
      const totalUsers = usersSnapshot.size;
      const totalAppointments = appointmentsSnapshot.size;

      // Calculate barbers change
      const recentBarbers = barbersSnapshot.docs.filter(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        return createdAt && createdAt >= thirtyDaysAgo;
      }).length;

      const previousBarbers = barbersSnapshot.docs.filter(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
      }).length;

      const barbersChange = previousBarbers > 0
        ? ((recentBarbers - previousBarbers) / previousBarbers) * 100
        : recentBarbers > 0 ? 100 : 0;

      // Calculate users change
      const recentUsers = usersSnapshot.docs.filter(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        return createdAt && createdAt >= thirtyDaysAgo;
      }).length;

      const previousUsers = usersSnapshot.docs.filter(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
      }).length;

      const usersChange = previousUsers > 0
        ? ((recentUsers - previousUsers) / previousUsers) * 100
        : recentUsers > 0 ? 100 : 0;

      // Calculate appointments change
      const recentAppointments = appointmentsSnapshot.docs.filter(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        return createdAt && createdAt >= thirtyDaysAgo;
      });

      const previousAppointments = appointmentsSnapshot.docs.filter(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
      });

      const appointmentsChange = previousAppointments.length > 0
        ? ((recentAppointments.length - previousAppointments.length) / previousAppointments.length) * 100
        : recentAppointments.length > 0 ? 100 : 0;

      // Calculate active users
      const activeUserIds = new Set(recentAppointments.map(doc => doc.data().userId));
      const activeUsers = activeUserIds.size;

      const previousActiveUserIds = new Set(previousAppointments.map(doc => doc.data().userId));
      const previousActiveUsers = previousActiveUserIds.size;

      const activeUsersChange = previousActiveUsers > 0
        ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100
        : activeUsers > 0 ? 100 : 0;

      return NextResponse.json({
        stats: {
          totalBarbers,
          totalUsers,
          totalAppointments,
          activeUsers,
          barbersChange: Math.round(barbersChange * 10) / 10,
          usersChange: Math.round(usersChange * 10) / 10,
          appointmentsChange: Math.round(appointmentsChange * 10) / 10,
          activeUsersChange: Math.round(activeUsersChange * 10) / 10,
        }
      });
    } catch (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
