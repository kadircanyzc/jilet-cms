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

      // Fetch all users using Admin SDK
      const usersSnapshot = await adminDb.collection('users').get();
      
      // Fetch appointments to count per user
      const appointmentsSnapshot = await adminDb.collection('appointments').get();
      
      const appointmentCounts = new Map<string, number>();
      appointmentsSnapshot.docs.forEach(doc => {
        const userId = doc.data().userId;
        if (userId) {
          appointmentCounts.set(userId, (appointmentCounts.get(userId) || 0) + 1);
        }
      });

      const users = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'İsimsiz Kullanıcı',
          email: data.email || 'Belirtilmemiş',
          phone: data.phone || data.phoneNumber,
          role: data.role || 'user',
          isBlocked: data.isBlocked || false,
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
          totalAppointments: appointmentCounts.get(doc.id) || 0,
        };
      });

      // Sort by creation date (newest first)
      users.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      return NextResponse.json({ users });
    } catch (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const body = await request.json();
    const { userId, isBlocked, userName } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Check if user is admin
      const adminDoc = await adminDb.collection('admins').doc(decodedToken.uid).get();
      if (!adminDoc.exists) {
        return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 });
      }

      // Update user using Admin SDK
      await adminDb.collection('users').doc(userId).update({
        isBlocked: isBlocked,
        updatedAt: new Date(),
      });

      // Log the action
      await adminDb.collection('logs').add({
        action: isBlocked ? 'user_blocked' : 'user_unblocked',
        targetType: 'user',
        targetId: userId,
        targetName: userName,
        performedBy: decodedToken.uid,
        performedAt: new Date(),
      });

      return NextResponse.json({ success: true });
    } catch (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userName = searchParams.get('userName');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Check if user is admin
      const adminDoc = await adminDb.collection('admins').doc(decodedToken.uid).get();
      if (!adminDoc.exists) {
        return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 });
      }

      // Delete user's appointments
      const appointmentsSnapshot = await adminDb
        .collection('appointments')
        .where('userId', '==', userId)
        .get();
      
      const deletePromises = appointmentsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);

      // Delete user document
      await adminDb.collection('users').doc(userId).delete();

      // Log the action
      await adminDb.collection('logs').add({
        action: 'user_deleted',
        targetType: 'user',
        targetId: userId,
        targetName: userName,
        performedBy: decodedToken.uid,
        performedAt: new Date(),
      });

      return NextResponse.json({ success: true });
    } catch (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
