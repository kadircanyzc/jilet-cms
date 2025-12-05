import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, title, body: messageBody, type = 'general' } = body;

    console.log('📬 Sending notification to topic:', topic);

    // Validate required fields
    if (!topic || !title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, title, body' },
        { status: 400 }
      );
    }

    // Send to Firebase topic
    const message = {
      notification: {
        title,
        body: messageBody,
      },
      data: {
        type,
      },
      topic: topic,  // Topic name (e.g., "all_users", "all_barbers")
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
    };

    const response = await adminMessaging.send(message);
    console.log('✅ Topic notification sent successfully:', response);

    return NextResponse.json({
      success: true,
      messageId: response,
      topic,
      message: `Notification sent to topic: ${topic}`
    });

  } catch (error: any) {
    console.error('❌ Error sending topic notification:', error);

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
    message: 'Topic Notification API is running',
    timestamp: new Date().toISOString(),
    availableTopics: [
      'all_app_users',
      'all_customers',
      'all_barbers',
      'all_employees'
    ]
  });
}
