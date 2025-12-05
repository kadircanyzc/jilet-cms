import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokens, title, body: messageBody, type = 'general' } = body;

    console.log('📬 Sending notifications to', tokens.length, 'devices');

    // Validate required fields
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid tokens array' },
        { status: 400 }
      );
    }

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body' },
        { status: 400 }
      );
    }

    // Firebase Messaging multicast (batch send)
    const message = {
      notification: {
        title,
        body: messageBody,
      },
      data: {
        type,
      },
      tokens: tokens, // Array of FCM tokens
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
    };

    const response = await adminMessaging.sendEachForMulticast(message);

    console.log('✅ Batch notification sent:');
    console.log('   Success:', response.successCount);
    console.log('   Failed:', response.failureCount);

    // Log failures if any
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`   Token ${idx} failed:`, resp.error);
        }
      });
    }

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalSent: tokens.length,
      message: `Sent to ${response.successCount} out of ${tokens.length} devices`
    });

  } catch (error: any) {
    console.error('❌ Error sending batch notification:', error);

    return NextResponse.json(
      {
        error: 'Failed to send notifications',
        message: error.message,
        code: error.code,
        details: error.errorInfo || error.toString()
      },
      { status: 500 }
    );
  }
}
