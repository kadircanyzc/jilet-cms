import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase-admin';

/**
 * Send notification API - Uses new fcm_tokens collection
 * 
 * POST /api/send-notification
 * Body: { recipientId, title, body, type? }
 */
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

    // Get FCM tokens from fcm_tokens collection (SINGLE SOURCE OF TRUTH)
    const tokensSnapshot = await adminDb
      .collection('fcm_tokens')
      .where('userId', '==', recipientId)
      .where('isValid', '==', true)
      .get();

    if (tokensSnapshot.empty) {
      console.error('❌ No valid FCM tokens found for recipient:', recipientId);
      return NextResponse.json(
        {
          error: 'No FCM tokens found for recipient',
          recipientId,
          message: 'User may not have logged in or granted notification permissions'
        },
        { status: 404 }
      );
    }

    const tokens = tokensSnapshot.docs.map(doc => ({
      token: doc.data().token,
      platform: doc.data().platform,
      tokenHash: doc.id,
    }));

    console.log(`✅ Found ${tokens.length} valid FCM token(s) for recipient`);

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

    // Send push notification to all valid tokens
    const sendResults = await Promise.allSettled(
      tokens.map(async ({ token, platform, tokenHash }) => {
        const message = {
          notification: {
            title,
            body: messageBody,
          },
          data: {
            notificationId: notificationRef.id,
            type,
          },
          token,
          android: {
            priority: 'high' as const,
            notification: {
              sound: 'default',
              channelId: 'default',
            },
          },
        };

        try {
          const response = await adminMessaging.send(message);
          console.log(`✅ Push notification sent to ${platform} device:`, response);
          
          // Update lastUsedAt
          await adminDb.collection('fcm_tokens').doc(tokenHash).update({
            lastUsedAt: new Date(),
          });
          
          return { success: true, platform, messageId: response };
        } catch (error: any) {
          console.error(`❌ Failed to send to ${platform} device:`, error);
          
          // Auto-invalidate stale tokens
          const staleErrorCodes = [
            'messaging/registration-token-not-registered',
            'messaging/invalid-registration-token',
          ];
          
          if (staleErrorCodes.includes(error.code)) {
            console.warn(`🗑️ Invalidating stale token: ${tokenHash.substring(0, 12)}...`);
            await adminDb.collection('fcm_tokens').doc(tokenHash).update({
              isValid: false,
              invalidatedAt: new Date(),
              invalidationReason: 'stale_detected',
              staleErrorCode: error.code,
            });
          }
          
          return { success: false, platform, error: error.message };
        }
      })
    );

    const successCount = sendResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failCount = sendResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    console.log(`✅ Notification sent: ${successCount} success, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      notificationId: notificationRef.id,
      recipientId,
      tokensTotal: tokens.length,
      tokensSent: successCount,
      tokensFailed: failCount,
      message: `Notification sent to ${successCount}/${tokens.length} devices`
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
    message: 'Notification API is running (using fcm_tokens collection)',
    timestamp: new Date().toISOString()
  });
}
