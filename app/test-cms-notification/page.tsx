'use client';

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

export default function TestCmsNotificationPage() {
  const [targetType, setTargetType] = useState<'ALL_BARBERS' | 'ALL_EMPLOYEES' | 'ALL_USERS' | 'CUSTOM'>('CUSTOM');
  const [customRecipients, setCustomRecipients] = useState('');
  const [title, setTitle] = useState('🧪 Test Notification');
  const [body, setBody] = useState('This is a test notification from CMS');
  const [type, setType] = useState('system_maintenance');
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendNotification = async () => {
    if (targetType === 'CUSTOM' && !customRecipients.trim()) {
      setError('Custom recipients required for CUSTOM target type');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const functions = getFunctions(app);
      const sendCmsNotif = httpsCallable(functions, 'sendCmsNotification');

      const payload: any = {
        targetType,
        title,
        body,
        type,
        dryRun,
      };

      if (targetType === 'CUSTOM') {
        payload.customRecipients = customRecipients
          .split(',')
          .map(id => id.trim())
          .filter(id => id.length > 0);
      }

      console.log('🚀 Sending CMS notification...', payload);

      const response = await sendCmsNotif(payload);

      console.log('✅ Success:', response.data);
      setResult(response.data);
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Test CMS Notification</h1>
        <p className="text-gray-600 mb-6">
          Test sendCmsNotification Cloud Function
        </p>

        <div className="space-y-6">
          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Type
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="CUSTOM">CUSTOM (specific users)</option>
              <option value="ALL_BARBERS">ALL_BARBERS</option>
              <option value="ALL_EMPLOYEES">ALL_EMPLOYEES</option>
              <option value="ALL_USERS">ALL_USERS</option>
            </select>
          </div>

          {/* Custom Recipients */}
          {targetType === 'CUSTOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Recipients (comma-separated UIDs)
              </label>
              <input
                type="text"
                value={customRecipients}
                onChange={(e) => setCustomRecipients(e.target.value)}
                placeholder="user123, user456, barber789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter Firestore user/barber/employee IDs separated by commas
              </p>
            </div>
          )}

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

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="system_maintenance">System Maintenance</option>
              <option value="marketing_bulk">Marketing Bulk</option>
              <option value="appointment_new">Appointment New</option>
              <option value="appointment_confirmed">Appointment Confirmed</option>
            </select>
          </div>

          {/* Dry Run */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="dryRun"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="dryRun" className="text-sm font-medium text-gray-700">
              Dry Run (skip FCM sending, test mode)
            </label>
          </div>

          {/* Send Button */}
          <button
            onClick={sendNotification}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Sending...' : '🚀 Send CMS Notification'}
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
                <div className="font-medium">Target Type:</div>
                <div className="text-gray-700">{result.targetType}</div>

                <div className="font-medium">Total Targets:</div>
                <div className="text-gray-700">{result.totalTargets}</div>

                <div className="font-medium">In-App Created:</div>
                <div className="text-gray-700">{result.inAppCreated}</div>

                <div className="font-medium">FCM Sent:</div>
                <div className="text-gray-700">{result.fcmSent}</div>

                <div className="font-medium">FCM Failed:</div>
                <div className="text-gray-700">{result.fcmFailed}</div>

                <div className="font-medium">FCM Skipped:</div>
                <div className="text-gray-700">{result.fcmSkipped}</div>

                <div className="font-medium">Dry Run:</div>
                <div className="text-gray-700">{result.dryRun ? '✅' : '❌'}</div>

                <div className="font-medium">Duration:</div>
                <div className="text-gray-700">{result.durationMs}ms</div>

                <div className="font-medium">Total Errors:</div>
                <div className="text-gray-700">{result.totalErrors || 0}</div>
              </div>

              <div className="mt-4">
                <div className="font-medium text-sm mb-1">Message:</div>
                <div className="text-gray-700 text-sm">{result.message}</div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <div className="font-medium text-sm mb-1">Errors:</div>
                  <div className="space-y-1">
                    {result.errors.map((err: any, i: number) => (
                      <div key={i} className="text-xs text-red-600">
                        {err.recipientId}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
            <li>Ensure you're logged in as an admin user</li>
            <li>Select target type (start with CUSTOM for testing)</li>
            <li>For CUSTOM, enter user/barber IDs from Firestore</li>
            <li>Enable "Dry Run" for testing (no real FCM push)</li>
            <li>Click "Send CMS Notification"</li>
            <li>Check Cloud Logging for detailed logs</li>
            <li>Verify in Firestore: notifications & notification_logs collections</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
