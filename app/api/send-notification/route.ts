import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientId, title, body: messageBody, type = 'general' } = body;

    console.log('📬 Sending notification to:', recipientId);

    // Validate required fields
    if (!recipientId || !title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientId, title, body' },
        { status: 400 }
      );
    }

    // Get FCM token - try users, barbers, then employees
    let fcmToken: string | null = null;
    let userType: string = '';

    // Try users collection
    const userDoc = await adminDb.collection('users').doc(recipientId).get();
    if (userDoc.exists && userDoc.data()?.fcmToken) {
      fcmToken = userDoc.data()!.fcmToken;
      userType = 'user';
      console.log('✅ FCM token found in users collection');
    }

    // Try barbers collection
    if (!fcmToken) {
      const barberDoc = await adminDb.collection('barbers').doc(recipientId).get();
      if (barberDoc.exists && barberDoc.data()?.fcmToken) {
        fcmToken = barberDoc.data()!.fcmToken;
        userType = 'barber';
        console.log('✅ FCM token found in barbers collection');
      }
    }

    // Try employees collection
    if (!fcmToken) {
      const employeeDoc = await adminDb.collection('employees').doc(recipientId).get();
      if (employeeDoc.exists && employeeDoc.data()?.fcmToken) {
        fcmToken = employeeDoc.data()!.fcmToken;
        userType = 'employee';
        console.log('✅ FCM token found in employees collection');
      }
    }

    if (!fcmToken) {
      console.error('❌ No FCM token found for recipient:', recipientId);
      return NextResponse.json(
        {
          error: 'No FCM token found for recipient',
          recipientId,
          message: 'User may not have logged in or granted notification permissions'
        },
        { status: 404 }
      );
    }

    // Save notification to Firestore
    const notificationRef = await adminDb.collection('notifications').add({
      recipientId,
      title,
      body: messageBody,
      type,
      read: false,
      createdAt: new Date(),
    });

    console.log('💾 Notification saved to Firestore:', notificationRef.id);

    // Send push notification
    const message = {
      notification: {
        title,
        body: messageBody,
      },
      data: {
        notificationId: notificationRef.id,
        type,
      },
      token: fcmToken,
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
    };

    const response = await adminMessaging.send(message);
    console.log('✅ Push notification sent successfully:', response);

    return NextResponse.json({
      success: true,
      notificationId: notificationRef.id,
      messageId: response,
      recipientId,
      userType,
      message: 'Notification sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Error sending notification:', error);

    // Detailed error response
    return NextResponse.json(
      {
        error: 'Failed to send notification',
        message: error.message,
        code: error.code,
        details: error.errorInfo || error.toString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to test if API is working
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Notification API is running',
    timestamp: new Date().toISOString()
  });
}
