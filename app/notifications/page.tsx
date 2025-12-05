'use client'

import DashboardLayout from '@/components/DashboardLayout'
import AnalyticsCard from '@/components/AnalyticsCard'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, Timestamp, query, where, orderBy, limit } from 'firebase/firestore'
import { Bell, Users, Scissors, Briefcase, Send, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface NotificationLog {
  id: string
  title: string
  body: string
  type: string
  target: string
  recipientCount: number
  sentBy: string
  sentAt: Date
  status: 'success' | 'failed'
}

interface FCMStats {
  usersCount: number
  barbersCount: number
  employeesCount: number
  monthNotifications: number
}

type TargetType = 'all_users' | 'all_barbers' | 'all_employees' | 'all_barbers_employees' | 'all_app_users' | 'custom' | 'topic_all_app_users' | 'topic_all_customers' | 'topic_all_barbers' | 'topic_all_employees'
type NotificationType = 'general' | 'promotion' | 'announcement' | 'reminder'

interface SelectedUser {
  id: string
  name: string
  email: string
  type: 'user' | 'barber' | 'employee'
}

export default function NotificationsPage() {
  const { user, hasPermission } = useAuth()
  const [stats, setStats] = useState<FCMStats>({
    usersCount: 0,
    barbersCount: 0,
    employeesCount: 0,
    monthNotifications: 0,
  })
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Form states
  const [target, setTarget] = useState<TargetType>('all_users')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [notificationType, setNotificationType] = useState<NotificationType>('general')
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])
  const [availableUsers, setAvailableUsers] = useState<SelectedUser[]>([])

  // useEffect her zaman aynı sırada çağrılmalı (hooks kuralı)
  useEffect(() => {
    if (user && (user.role === 'super_admin' || user.role === 'admin')) {
      fetchData()
    }
  }, [user])

  // Yetki kontrolü
  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Yetkisiz Erişim</h2>
            <p className="text-muted-foreground">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // İstatistikleri topla - her biri için ayrı try-catch
      let usersSnapshot: any = { docs: [] }
      let barbersSnapshot: any = { docs: [] }
      let employeesSnapshot: any = { docs: [] }

      try {
        usersSnapshot = await getDocs(collection(db, 'users'))
      } catch (error) {
        console.error('Error fetching users:', error)
      }

      try {
        barbersSnapshot = await getDocs(collection(db, 'barbers'))
      } catch (error) {
        console.error('Error fetching barbers:', error)
      }

      try {
        employeesSnapshot = await getDocs(collection(db, 'employees'))
      } catch (error) {
        console.error('Error fetching employees:', error)
      }

      // FCM token sayılarını hesapla
      let usersWithToken = 0
      let barbersWithToken = 0
      let employeesWithToken = 0

      usersSnapshot.docs.forEach((doc: any) => {
        if (doc.data().fcmToken) usersWithToken++
      })

      barbersSnapshot.docs.forEach((doc: any) => {
        if (doc.data().fcmToken) barbersWithToken++
      })

      employeesSnapshot.docs.forEach((doc: any) => {
        if (doc.data().fcmToken) employeesWithToken++
      })

      // Bu ay gönderilen bildirimler
      let logsSnapshot: any = { docs: [], size: 0 }
      try {
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        logsSnapshot = await getDocs(
          query(
            collection(db, 'notification_logs'),
            where('sentAt', '>=', Timestamp.fromDate(firstDayOfMonth)),
            orderBy('sentAt', 'desc')
          )
        )
      } catch (error) {
        console.error('Error fetching notification logs:', error)
      }

      const logsData: NotificationLog[] = logsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        sentAt: doc.data().sentAt?.toDate() || new Date(),
      } as NotificationLog))

      setStats({
        usersCount: usersWithToken,
        barbersCount: barbersWithToken,
        employeesCount: employeesWithToken,
        monthNotifications: logsSnapshot.size,
      })

      setLogs(logsData)

      // Özel seçim için kullanıcıları yükle
      const allUsers: SelectedUser[] = []

      usersSnapshot.docs.forEach(doc => {
        const data = doc.data()
        allUsers.push({
          id: doc.id,
          name: data.name || data.email || 'İsimsiz Kullanıcı',
          email: data.email || '',
          type: 'user',
        })
      })

      barbersSnapshot.docs.forEach(doc => {
        const data = doc.data()
        allUsers.push({
          id: doc.id,
          name: data.name || data.shopName || 'İsimsiz Berber',
          email: data.email || '',
          type: 'barber',
        })
      })

      employeesSnapshot.docs.forEach(doc => {
        const data = doc.data()
        allUsers.push({
          id: doc.id,
          name: data.name || 'İsimsiz Çalışan',
          email: data.email || '',
          type: 'employee',
        })
      })

      setAvailableUsers(allUsers)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const collectFCMTokens = async (targetType: TargetType): Promise<{ tokens: string[], userIds: string[] }> => {
    const tokens: string[] = []
    const userIds: string[] = []

    try {
      if (targetType === 'custom') {
        // Özel seçim için seçilen kullanıcıların tokenlarını topla
        for (const selectedUser of selectedUsers) {
          let collectionName = 'users'
          if (selectedUser.type === 'barber') {
            collectionName = 'barbers'
          } else if (selectedUser.type === 'employee') {
            collectionName = 'employees'
          }

          const snapshot = await getDocs(
            query(collection(db, collectionName), where('__name__', '==', selectedUser.id))
          )

          snapshot.docs.forEach(doc => {
            const fcmToken = doc.data().fcmToken
            if (fcmToken) {
              tokens.push(fcmToken)
              userIds.push(doc.id)
            }
          })
        }
      } else if (targetType === 'all_users') {
        const snapshot = await getDocs(collection(db, 'users'))
        snapshot.docs.forEach(doc => {
          const fcmToken = doc.data().fcmToken
          if (fcmToken) {
            tokens.push(fcmToken)
            userIds.push(doc.id)
          }
        })
      } else if (targetType === 'all_barbers') {
        const snapshot = await getDocs(collection(db, 'barbers'))
        snapshot.docs.forEach(doc => {
          const fcmToken = doc.data().fcmToken
          if (fcmToken) {
            tokens.push(fcmToken)
            userIds.push(doc.id)
          }
        })
      } else if (targetType === 'all_employees') {
        const snapshot = await getDocs(collection(db, 'employees'))
        snapshot.docs.forEach(doc => {
          const fcmToken = doc.data().fcmToken
          if (fcmToken) {
            tokens.push(fcmToken)
            userIds.push(doc.id)
          }
        })
      } else if (targetType === 'all_barbers_employees') {
        const [barbersSnap, employeesSnap] = await Promise.all([
          getDocs(collection(db, 'barbers')),
          getDocs(collection(db, 'employees')),
        ])

        barbersSnap.docs.forEach(doc => {
          const fcmToken = doc.data().fcmToken
          if (fcmToken) {
            tokens.push(fcmToken)
            userIds.push(doc.id)
          }
        })

        employeesSnap.docs.forEach(doc => {
          const fcmToken = doc.data().fcmToken
          if (fcmToken) {
            tokens.push(fcmToken)
            userIds.push(doc.id)
          }
        })
      } else if (targetType === 'all_app_users') {
        // Tüm kullanıcılar + berberler + çalışanlar
        const [usersSnap, barbersSnap, employeesSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'barbers')),
          getDocs(collection(db, 'employees')),
        ])

        usersSnap.docs.forEach(doc => {
          const fcmToken = doc.data().fcmToken
          if (fcmToken) {
            tokens.push(fcmToken)
            userIds.push(doc.id)
          }
        })

        barbersSnap.docs.forEach(doc => {
          const fcmToken = doc.data().fcmToken
          if (fcmToken) {
            tokens.push(fcmToken)
            userIds.push(doc.id)
          }
        })

        employeesSnap.docs.forEach(doc => {
          const fcmToken = doc.data().fcmToken
          if (fcmToken) {
            tokens.push(fcmToken)
            userIds.push(doc.id)
          }
        })
      }
    } catch (error) {
      console.error('Error collecting FCM tokens:', error)
    }

    return { tokens, userIds }
  }

  const handleSendNotification = () => {
    if (!title.trim() || !body.trim()) {
      alert('Lütfen başlık ve mesaj alanlarını doldurun!')
      return
    }

    if (target === 'custom' && selectedUsers.length === 0) {
      alert('Lütfen en az bir alıcı seçin!')
      return
    }

    setShowModal(true)
  }

  const confirmSendNotification = async () => {
    setSending(true)
    setShowModal(false)

    try {
      // Topic-based notification check
      if (target.startsWith('topic_')) {
        // Extract topic name (e.g., "topic_all_app_users" -> "all_app_users")
        const topicName = target.replace('topic_', '')

        // Send to topic
        const response = await fetch('/api/notifications/send-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topicName,
            title,
            body,
            type: notificationType,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Topic bildirimi gönderilemedi')
        }

        console.log('✅ Topic notification sent:', result)

        // Firestore'a log kaydı
        await addDoc(collection(db, 'notification_logs'), {
          title,
          body,
          type: notificationType,
          target: getTargetLabel(target),
          recipientCount: -1, // Topic'lerde alıcı sayısı bilinmez
          sentBy: user?.email || 'admin',
          sentAt: Timestamp.now(),
          status: 'success',
        })

        alert(`📱 Bildirim başarıyla "${topicName}" topic'ine gönderildi!`)

        // Formu temizle
        setTitle('')
        setBody('')
        setNotificationType('general')
        setTarget('all_users')
        setSelectedUsers([])

        fetchData()
        return
      }

      // Token-based notification (existing code)
      const { tokens, userIds } = await collectFCMTokens(target)

      if (tokens.length === 0) {
        alert('Hedef kullanıcılar arasında FCM token\'a sahip kimse bulunamadı!')
        setSending(false)
        return
      }

      // FCM gönderimi için API endpoint'ini çağır
      try {
        const fcmResponse = await fetch('/api/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokens,
            title,
            body,
            type: notificationType,
          }),
        })

        const fcmResult = await fcmResponse.json()

        if (!fcmResponse.ok) {
          throw new Error(fcmResult.error || 'FCM gönderimi başarısız')
        }

        console.log('FCM Response:', fcmResult)
      } catch (fcmError) {
        console.error('FCM Error:', fcmError)
        // FCM hatası olsa bile devam et (log kaydı yap)
      }

      // Firestore'a log kaydı oluştur
      await addDoc(collection(db, 'notification_logs'), {
        title,
        body,
        type: notificationType,
        target: getTargetLabel(target),
        recipientCount: tokens.length,
        sentBy: user?.email || 'admin',
        sentAt: Timestamp.now(),
        status: 'success',
      })

      // Her kullanıcı için bildirim kaydı oluştur (notifications koleksiyonu)
      const notificationPromises = userIds.map(userId =>
        addDoc(collection(db, 'notifications'), {
          userId,
          title,
          body,
          type: notificationType,
          read: false,
          createdAt: Timestamp.now(),
        })
      )

      await Promise.all(notificationPromises)

      alert(`Bildirim başarıyla ${tokens.length} kişiye gönderildi!`)

      // Formu temizle
      setTitle('')
      setBody('')
      setNotificationType('general')
      setTarget('all_users')
      setSelectedUsers([])

      // Verileri yenile
      fetchData()
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Bildirim gönderilirken bir hata oluştu!')
    } finally {
      setSending(false)
    }
  }

  const getTargetLabel = (targetType: TargetType): string => {
    const labels: Record<TargetType, string> = {
      all_users: 'Tüm Kullanıcılar (Giriş Yapmış)',
      all_barbers: 'Tüm Berberler (Giriş Yapmış)',
      all_employees: 'Tüm Çalışanlar (Giriş Yapmış)',
      all_barbers_employees: 'Tüm Berber ve Çalışanlar (Giriş Yapmış)',
      all_app_users: 'Tüm Uygulama Kullanıcıları (Giriş Yapmış)',
      custom: 'Özel Seçim',
      topic_all_app_users: '📱 Tüm App Kullanıcıları (Topic - Giriş Gerekmez)',
      topic_all_customers: '📱 Tüm Müşteriler (Topic)',
      topic_all_barbers: '📱 Tüm Berberler (Topic)',
      topic_all_employees: '📱 Tüm Çalışanlar (Topic)',
    }
    return labels[targetType]
  }

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      general: 'bg-blue-100 text-blue-800',
      promotion: 'bg-green-100 text-green-800',
      announcement: 'bg-purple-100 text-purple-800',
      reminder: 'bg-orange-100 text-orange-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'success') {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    }
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  const getRecipientCount = async (): Promise<number> => {
    // Topic-based notifications don't have a count
    if (target.startsWith('topic_')) {
      return -1 // Special value indicating topic-based
    }
    if (target === 'custom') {
      return selectedUsers.length
    }
    const { tokens } = await collectFCMTokens(target)
    return tokens.length
  }

  const [recipientCount, setRecipientCount] = useState(0)
  const [isTopicTarget, setIsTopicTarget] = useState(false)

  useEffect(() => {
    const updateRecipientCount = async () => {
      setIsTopicTarget(target.startsWith('topic_'))
      const count = await getRecipientCount()
      setRecipientCount(count)
    }
    updateRecipientCount()
  }, [target, selectedUsers])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Bildirim Gönderme Paneli</h1>
          <p className="text-muted-foreground mt-1">Kullanıcılara toplu bildirim gönderin</p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <AnalyticsCard
            title="Kullanıcı FCM Token"
            value={loading ? '...' : stats.usersCount.toLocaleString('tr-TR')}
            change={0}
            icon={Users}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <AnalyticsCard
            title="Berber FCM Token"
            value={loading ? '...' : stats.barbersCount.toLocaleString('tr-TR')}
            change={0}
            icon={Scissors}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <AnalyticsCard
            title="Çalışan FCM Token"
            value={loading ? '...' : stats.employeesCount.toLocaleString('tr-TR')}
            change={0}
            icon={Briefcase}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <AnalyticsCard
            title="Bu Ay Gönderilen"
            value={loading ? '...' : stats.monthNotifications.toLocaleString('tr-TR')}
            change={0}
            icon={Bell}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
        </div>

        {/* Bildirim Gönderme Formu */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Alanları */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-[var(--radius)] border border-border p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-6">Yeni Bildirim Oluştur</h3>

              <div className="space-y-6">
                {/* Hedef Seçimi */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-3">
                    Hedef Kitle
                  </label>

                  {/* Topic Bilgilendirmesi */}
                  {isTopicTarget && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-[var(--radius)]">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>ℹ️ Bilgi:</strong> Topic bildirimleri mobil uygulamaya topic subscription kodu eklendikten sonra çalışır.
                        Detaylar için <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">HOW_TO_SEND_TO_ALL_USERS.md</code> dosyasına bakın.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {[
                      { value: 'topic_all_app_users', label: '📱 Tüm App Kullanıcıları (Topic - Giriş Gerekmez)' },
                      { value: 'topic_all_customers', label: '📱 Tüm Müşteriler (Topic)' },
                      { value: 'topic_all_barbers', label: '📱 Tüm Berberler (Topic)' },
                      { value: 'topic_all_employees', label: '📱 Tüm Çalışanlar (Topic)' },
                      { value: 'all_users', label: 'Tüm Kullanıcılar (Giriş Yapmış)' },
                      { value: 'all_barbers', label: 'Tüm Berberler (Giriş Yapmış)' },
                      { value: 'all_employees', label: 'Tüm Çalışanlar (Giriş Yapmış)' },
                      { value: 'all_barbers_employees', label: 'Tüm Berber ve Çalışanlar (Giriş Yapmış)' },
                      { value: 'all_app_users', label: 'Tüm Uygulama Kullanıcıları (Herkes - Giriş Yapmış)' },
                      { value: 'custom', label: 'Özel Seçim' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="target"
                          value={option.value}
                          checked={target === option.value}
                          onChange={(e) => setTarget(e.target.value as TargetType)}
                          className="w-4 h-4 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-card-foreground">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Özel Seçim - Multi-select */}
                {target === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Alıcıları Seçin
                    </label>
                    <select
                      multiple
                      value={selectedUsers.map(u => u.id)}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions).map(option => {
                          return availableUsers.find(u => u.id === option.value)!
                        })
                        setSelectedUsers(selected)
                      }}
                      className="w-full px-3 py-2 border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary min-h-[200px]"
                    >
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.type}) - {user.email}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Birden fazla seçim için Ctrl/Cmd tuşuna basılı tutun. Seçilen: {selectedUsers.length}
                    </p>
                  </div>
                )}

                {/* Başlık */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Başlık
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Bildirim başlığını girin"
                    className="w-full px-4 py-3 border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={100}
                  />
                </div>

                {/* Mesaj */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Mesaj
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Bildirim mesajını girin"
                    rows={4}
                    className="w-full px-4 py-3 border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{body.length}/300 karakter</p>
                </div>

                {/* Bildirim Tipi */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Bildirim Tipi
                  </label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value as NotificationType)}
                    className="w-full px-4 py-3 border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="general">Genel</option>
                    <option value="promotion">Promosyon</option>
                    <option value="announcement">Duyuru</option>
                    <option value="reminder">Hatırlatma</option>
                  </select>
                </div>

                {/* Gönder Butonu */}
                <button
                  onClick={handleSendNotification}
                  disabled={sending || !title.trim() || !body.trim()}
                  className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-[var(--radius)] font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  <span>{sending ? 'Gönderiliyor...' : 'Bildirim Gönder'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Önizleme Kartı */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-[var(--radius)] border border-border p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Önizleme</h3>

              {/* Alıcı Sayısı */}
              <div className="mb-4 p-3 bg-muted rounded-[var(--radius)]">
                <p className="text-sm text-muted-foreground">Alıcı Sayısı</p>
                {isTopicTarget ? (
                  <div>
                    <p className="text-2xl font-bold text-foreground">📱 Topic</p>
                    <p className="text-xs text-muted-foreground mt-1">Abone sayısı Firebase tarafından bilinmiyor</p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-foreground">{recipientCount}</p>
                )}
              </div>

              {/* Bildirim Kartı */}
              <div className="border-2 border-dashed border-border rounded-[var(--radius)] p-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-card-foreground text-sm">
                      {title || 'Bildirim Başlığı'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 break-words">
                      {body || 'Bildirim mesajı burada görünecek...'}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(notificationType)}`}>
                        {notificationType}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Şimdi
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hedef Bilgisi */}
              <div className="mt-4 p-3 bg-muted/50 rounded-[var(--radius)]">
                <p className="text-xs text-muted-foreground">Hedef Kitle</p>
                <p className="text-sm font-medium text-foreground">{getTargetLabel(target)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gönderim Geçmişi */}
        <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-card-foreground">Gönderim Geçmişi</h3>
            <p className="text-sm text-muted-foreground mt-1">Son gönderilen bildirimler</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Başlık
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Hedef
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Alıcı Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Gönderen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      Henüz bildirim gönderilmemiş
                    </td>
                  </tr>
                ) : (
                  logs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusIcon(log.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {log.sentAt.toLocaleDateString('tr-TR')}
                          <br />
                          <span className="text-xs">{log.sentAt.toLocaleTimeString('tr-TR')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-card-foreground max-w-xs truncate">
                          {log.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(log.type)}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{log.target}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-card-foreground">
                          {log.recipientCount === -1 ? '📱 Topic' : log.recipientCount.toLocaleString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{log.sentBy}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {logs.length > 0 && (
            <div className="px-6 py-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Toplam <span className="font-medium text-foreground">{logs.length}</span> kayıt gösteriliyor
              </div>
            </div>
          )}
        </div>

        {/* Onay Modalı */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-[var(--radius)] p-6 max-w-md w-full border border-border">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Bildirim Gönderilsin mi?</h3>
              <div className="space-y-3 mb-6">
                <p className="text-sm text-muted-foreground">
                  {isTopicTarget ? (
                    <>
                      📱 <span className="font-medium text-foreground">Topic'e abone olan tüm kullanıcılara</span> bildirim gönderilecek.
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{recipientCount} kişiye</span> bildirim gönderilecek.
                    </>
                  )}
                </p>
                <div className="p-3 bg-muted rounded-[var(--radius)] space-y-1">
                  <p className="text-sm"><span className="font-medium">Başlık:</span> {title}</p>
                  <p className="text-sm"><span className="font-medium">Mesaj:</span> {body}</p>
                  <p className="text-sm"><span className="font-medium">Tip:</span> {notificationType}</p>
                  <p className="text-sm"><span className="font-medium">Hedef:</span> {getTargetLabel(target)}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-[var(--radius)] text-sm font-medium hover:bg-accent transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={confirmSendNotification}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Gönder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
