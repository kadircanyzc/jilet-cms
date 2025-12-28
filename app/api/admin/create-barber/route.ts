import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const authToken = cookieStore.get('firebase-auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the token
    console.log('🔐 Verifying token...');
    const decodedToken = await adminAuth.verifyIdToken(authToken);
    console.log('✅ Token verified, UID:', decodedToken.uid);
    
    // Check if user is admin
    console.log('🔍 Checking admin status...');
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    console.log('📄 User doc exists:', userDoc.exists);
    
    if (!userDoc.exists) {
      console.log('❌ User doc not found for UID:', decodedToken.uid);
      return NextResponse.json(
        { success: false, error: 'Kullanıcı kaydı bulunamadı' },
        { status: 403 }
      );
    }
    
    const userData = userDoc.data();
    console.log('👤 User data:', { email: userData?.email, role: userData?.role });
    
    if (userData?.role !== 'admin') {
      console.log('❌ User is not admin, role:', userData?.role);
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim - Admin yetkisi gerekli' },
        { status: 403 }
      );
    }
    
    console.log('✅ Admin verified, proceeding with barber creation...');

    const body = await request.json();
    const { formData } = body;

    // Check if username is already taken
    const usernameQuery = await adminDb
      .collection('barbers')
      .where('username', '==', formData.username.toLowerCase())
      .get();

    if (!usernameQuery.empty) {
      return NextResponse.json(
        { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Check if email is already in use
    try {
      await adminAuth.getUserByEmail(formData.email);
      return NextResponse.json(
        { success: false, error: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      );
    } catch (error: any) {
      // Email not found, continue
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create Firebase Auth user (Admin SDK - doesn't affect current session)
    const userRecord = await adminAuth.createUser({
      email: formData.email,
      password: formData.password,
      displayName: formData.ownerName,
    });

    const userId = userRecord.uid;

    // Create barber document
    const barberData = {
      shopName: formData.shopName,
      name: formData.shopName,
      ownerName: formData.ownerName,
      username: formData.username.toLowerCase(),
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      district: formData.district,
      role: 'barber',
      description: formData.description || '',
      services: [],
      employees: [],
      slots: {},
      closedDays: [],
      workingHours: {
        startTime: formData.startTime,
        endTime: formData.endTime,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decodedToken.uid,
      ownerId: userId,
    };

    // Add coordinates if available
    if (formData.latitude && formData.longitude) {
      barberData.coordinates = {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };
    }

    // Create barber document
    await adminDb.collection('barbers').doc(userId).set(barberData);

    // Create users document with role: 'barber'
    await adminDb.collection('users').doc(userId).set({
      email: formData.email,
      name: formData.ownerName,
      role: 'barber',
      barberId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Log the action
    await adminDb.collection('logs').add({
      action: 'barber_created',
      barberId: userId,
      barberName: formData.shopName,
      performedBy: decodedToken.uid,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      barberId: userId,
    });
  } catch (error: any) {
    console.error('❌ Error creating barber:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Berber oluşturulurken bir hata oluştu',
        code: error.code 
      },
      { status: 500 }
    );
  }
}
