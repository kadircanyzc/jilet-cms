import { NextRequest, NextResponse } from 'next/server'
import * as admin from 'firebase-admin'

/**
 * FCM Bildirim Gönderme API Endpoint
 *
 * Bu endpoint Firebase Cloud Messaging kullanarak toplu bildirim göndermek için kullanılır.
 *
 * NOT: Bu endpoint'i kullanabilmek için:
 * 1. Firebase Admin SDK kurulumu gereklidir: npm install firebase-admin
 * 2. Firebase servis hesabı JSON dosyası gereklidir
 * 3. FIREBASE_SERVICE_ACCOUNT_KEY environment variable'ı ayarlanmalıdır
 *
 * Örnek kullanım:
 * POST /api/notifications/send
 * Body: {
 *   tokens: string[],
 *   title: string,
 *   body: string,
 *   type: string,
 *   data?: object
 * }
 */

// Firebase Admin SDK'yı başlat
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
    )

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })

    console.log('✅ Firebase Admin SDK initialized successfully')
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization error:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tokens, title, body, type, data } = await request.json()

    // Validation
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { error: 'Tokens array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin SDK not initialized')
      return NextResponse.json(
        { error: 'Firebase Admin SDK not configured. Please check FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' },
        { status: 500 }
      )
    }

    console.log('📧 Sending FCM notifications:')
    console.log('  Tokens:', tokens.length)
    console.log('  Title:', title)
    console.log('  Body:', body)
    console.log('  Type:', type)

    // Notification payload'u oluştur
    const messageData: { [key: string]: string } = {
      type: type || 'general',
      ...(data || {}),
    }

    // Toplu gönderim yapın (500'lü batch'ler halinde)
    const batchSize = 500
    const results = []

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize)

      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: batch,
          notification: {
            title,
            body,
          },
          data: messageData,
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'default',
            },
          },
        })

        results.push(response)

        console.log(`  Batch ${Math.floor(i / batchSize) + 1}:`, {
          success: response.successCount,
          failure: response.failureCount,
        })
      } catch (batchError) {
        console.error('  Batch error:', batchError)
        results.push({
          successCount: 0,
          failureCount: batch.length,
          responses: [],
        })
      }
    }

    // Sonuçları analiz et
    let successCount = 0
    let failureCount = 0

    results.forEach(result => {
      successCount += result.successCount
      failureCount += result.failureCount
    })

    console.log('✅ Notification sending completed:', {
      total: tokens.length,
      success: successCount,
      failure: failureCount,
    })

    return NextResponse.json({
      success: true,
      successCount,
      failureCount,
      totalCount: tokens.length,
    })
  } catch (error) {
    console.error('❌ Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
