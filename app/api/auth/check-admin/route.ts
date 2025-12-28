import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      // Verify token with Firebase Admin
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Check if user is admin using Admin SDK (bypasses Firestore Rules)
      const adminDoc = await adminDb.collection('admins').doc(decodedToken.uid).get();
      
      if (!adminDoc.exists) {
        return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
      }

      const adminData = adminDoc.data();
      
      return NextResponse.json({
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: adminData?.name || 'Admin',
        role: adminData?.role || 'viewer'
      });
    } catch (authError) {
      console.error('Auth verification error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in check-admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
