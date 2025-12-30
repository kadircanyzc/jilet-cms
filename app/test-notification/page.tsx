'use client';

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

export default function TestNotificationPage() {
  const [recipientId, setRecipientId] = useState('');
  const [title, setTitle] = useState('Test Notification 🧪');
  const [body, setBody] = useState('Testing sendNotificationInternal');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testNotification = async () => {
    if (!recipientId.trim()) {
      setError('Recipient ID gerekli!');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const functions = getFunctions(app);
      const testFunc = httpsCallable(functions, 'testSendNotification');

      console.log('🚀 Sending test notification...', {
        recipientId,
        title,
        body
      });

      const response = await testFunc({
        recipientId: recipientId.trim(),
        title,
        body
      });

      console.log('✅ Success:', response.data);
      setResult(response.data);
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Test Notification</h1>
        <p className="text-gray-600 mb-6">
          Test sendNotificationInternal function
        </p>

        <div className="space-y-4">
          {/* Recipient ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient ID (User ID) *
            </label>
            <input
              type="text"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="Enter user ID from Firestore"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Firestore'da fcm_tokens collection'ında tokeni olan bir user ID gir
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={testNotification}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Gönderiliyor...' : '🚀 Send Test Notification'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">❌ Error</h3>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">✅ Success</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Recipient:</div>
                <div className="text-gray-700">{result.recipientId}</div>

                <div className="font-medium">In-App Created:</div>
                <div className="text-gray-700">{result.result?.inAppCreated ? '✅' : '❌'}</div>

                <div className="font-medium">FCM Sent:</div>
                <div className="text-gray-700">{result.result?.fcmSent || 0}</div>

                <div className="font-medium">FCM Failed:</div>
                <div className="text-gray-700">{result.result?.fcmFailed || 0}</div>

                <div className="font-medium">FCM Skipped:</div>
                <div className="text-gray-700">{result.result?.fcmSkipped || 0}</div>

                <div className="font-medium">From Cache:</div>
                <div className="text-gray-700">{result.result?.fromCache ? '✅' : '❌'}</div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                  📄 Full Response (JSON)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
{JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Instructions</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Firestore Console'da <code className="bg-blue-100 px-1 rounded">users</code> collection'ından bir user ID kopyala</li>
            <li>O user'ın <code className="bg-blue-100 px-1 rounded">fcm_tokens</code> collection'ında aktif tokeni olduğundan emin ol</li>
            <li>Recipient ID alanına yapıştır ve "Send Test Notification" butonuna tıkla</li>
            <li>Cloud Logging'de logları kontrol et (zaten açık)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
