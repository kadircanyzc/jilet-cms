'use client';

import { useState, useEffect } from 'react';
import { sendNotificationFromCMS, getRecipientCount } from '@/lib/notificationService';
import DashboardLayout from '@/components/DashboardLayout';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function NotificationsPage() {
  const [targetType, setTargetType] = useState<'ALL_BARBERS' | 'ALL_USERS' | 'ALL_EMPLOYEES' | 'CUSTOM'>('ALL_BARBERS');
  const [customRecipients, setCustomRecipients] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('system_maintenance');

  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [estimatedRecipients, setEstimatedRecipients] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);

  // Production safety: ALL_USERS confirmation
  const [confirmAllUsers, setConfirmAllUsers] = useState(false);

  // Notification history
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load notification history from Firestore
  useEffect(() => {
    const logsQuery = query(
      collection(db, 'notification_logs'),
      where('source', '==', 'cms'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotificationHistory(logs);
      setLoadingHistory(false);
    }, (error) => {
      console.error('Error loading notification history:', error);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch real recipient count from Cloud Function
  const fetchRecipientCount = async () => {
    try {
      const customRecipientsList = targetType === 'CUSTOM'
        ? customRecipients.split(',').map(id => id.trim()).filter(id => id.length > 0)
        : undefined;

      const count = await getRecipientCount(targetType, customRecipientsList);
      return count;
    } catch (error: any) {
      console.error('Error fetching recipient count:', error);

      // Fallback to approximate counts if query fails
      if (targetType === 'CUSTOM') {
        return customRecipients.split(',').filter(id => id.trim()).length;
      }
      return targetType === 'ALL_BARBERS' ? 150 : targetType === 'ALL_USERS' ? 5000 : 50;
    }
  };

  const handleSendClick = async () => {
    // Production safety: validate inputs
    if (!title.trim() || !body.trim()) {
      alert('❌ Hata!\n\nBaşlık ve mesaj alanları zorunludur.');
      return;
    }

    // Production safety: ALL_USERS requires explicit confirmation
    if (targetType === 'ALL_USERS' && !confirmAllUsers) {
      alert('❌ Hata!\n\nTÜM KULLANICILARA bildirim göndermek için onay kutusunu işaretlemelisiniz.');
      return;
    }

    setLoadingCount(true);
    const count = await fetchRecipientCount();
    setEstimatedRecipients(count);
    setLoadingCount(false);
    setShowConfirmModal(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      const payload: any = {
        targetType,
        title,
        body,
        type,
        confirmAllUsers: targetType === 'ALL_USERS' ? confirmAllUsers : undefined,
      };

      if (targetType === 'CUSTOM') {
        payload.customRecipients = customRecipients
          .split(',')
          .map(id => id.trim())
          .filter(id => id.length > 0);
      }

      const result = await sendNotificationFromCMS(payload);

      // Success toast
      alert(`✅ Başarılı!\n\n${result.totalTargets} kişiye bildirim gönderildi.\n\nDetaylar:\n- In-App: ${result.inAppCreated}\n- FCM Gönderildi: ${result.fcmSent}\n- FCM Başarısız: ${result.fcmFailed}\n- Süre: ${result.durationMs}ms`);

      // Reset form
      setTitle('');
      setBody('');
      setCustomRecipients('');
      setConfirmAllUsers(false);

      // Scroll to history
      setTimeout(() => {
        document.getElementById('notification-history')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 500);

    } catch (error: any) {
      // Error toast
      alert(`❌ Hata!\n\n${error.message}\n\nDetay: ${error.code || 'Bilinmeyen hata'}`);
      console.error('Notification send error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-6">📢 Bildirim Gönder</h1>

          <div className="space-y-4">
            {/* Target Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Hedef Kitle</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full px-4 py-2 border rounded-lg"
                disabled={loading}
              >
                <option value="ALL_BARBERS">Tüm Berberler</option>
                <option value="ALL_USERS">Tüm Kullanıcılar</option>
                <option value="ALL_EMPLOYEES">Tüm Çalışanlar</option>
                <option value="CUSTOM">Özel (Manuel ID)</option>
              </select>
            </div>

            {/* Custom Recipients */}
            {targetType === 'CUSTOM' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Kullanıcı ID'leri (virgülle ayrılmış)
                </label>
                <input
                  type="text"
                  value={customRecipients}
                  onChange={(e) => setCustomRecipients(e.target.value)}
                  placeholder="user123, user456, barber789"
                  className="w-full px-4 py-2 border rounded-lg"
                  disabled={loading}
                />
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Başlık</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bildirim başlığı"
                className="w-full px-4 py-2 border rounded-lg"
                disabled={loading}
                maxLength={65}
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/65 karakter</p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium mb-2">Mesaj</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Bildirim içeriği"
                rows={4}
                className="w-full px-4 py-2 border rounded-lg"
                disabled={loading}
                maxLength={240}
              />
              <p className="text-xs text-gray-500 mt-1">{body.length}/240 karakter</p>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Bildirim Tipi</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                disabled={loading}
              >
                <option value="system_maintenance">Sistem Bildirimi</option>
                <option value="marketing_bulk">Pazarlama</option>
                <option value="appointment_confirmed">Randevu Onayı</option>
              </select>
            </div>

            {/* Production Safety: ALL_USERS Confirmation */}
            {targetType === 'ALL_USERS' && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="confirmAllUsers"
                    checked={confirmAllUsers}
                    onChange={(e) => setConfirmAllUsers(e.target.checked)}
                    className="mt-1 w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-500"
                    disabled={loading}
                  />
                  <label htmlFor="confirmAllUsers" className="text-sm font-medium text-red-900">
                    ⚠️ TÜM KULLANICILARA bildirim gönderileceğini anlıyorum ve onaylıyorum.
                    <span className="block text-xs text-red-700 mt-1">
                      Bu işlem geri alınamaz ve binlerce kullanıcıya ulaşacaktır.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendClick}
              disabled={loading || loadingCount || !title.trim() || !body.trim()}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                loading || loadingCount || !title.trim() || !body.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loadingCount ? '⏳ Hesaplanıyor...' : loading ? '⏳ Gönderiliyor...' : '📤 Gönder'}
            </button>
          </div>
        </div>
      </div>

      {/* Notification History */}
      <div id="notification-history" className="max-w-6xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-6">📜 Bildirim Geçmişi</h2>

          {loadingHistory ? (
            <div className="text-center py-8 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2">Yükleniyor...</p>
            </div>
          ) : notificationHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Henüz gönderilmiş bildirim yok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Tarih</th>
                    <th className="text-left py-3 px-4">Başlık</th>
                    <th className="text-left py-3 px-4">Mesaj</th>
                    <th className="text-left py-3 px-4">Hedef</th>
                    <th className="text-left py-3 px-4">Durum</th>
                    <th className="text-right py-3 px-4">İstatistik</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationHistory.map((log) => {
                    const createdAt = log.createdAt?.toDate?.() || new Date();
                    const metadata = log.metadata || {};

                    return (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {createdAt.toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}{' '}
                          {createdAt.toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {log.title}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                          {log.body}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                            {metadata.targetType || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {log.dryRun ? (
                            <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                              Test
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                              Gönderildi
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="text-sm space-y-1">
                            <div className="flex justify-end gap-2">
                              <span className="text-green-600">✓ {log.fcmSent || 0}</span>
                              {log.fcmFailed > 0 && (
                                <span className="text-red-600">✗ {log.fcmFailed}</span>
                              )}
                              {log.fcmSkipped > 0 && (
                                <span className="text-gray-500">⊘ {log.fcmSkipped}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {metadata.sentByEmail || 'Admin'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">⚠️ Onay Gerekiyor</h2>
            <p className="mb-4">
              <strong>{estimatedRecipients} kişiye</strong> canlı bildirim gönderilecek.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Bu işlem geri alınamaz. Emin misiniz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmSend}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Evet, Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
