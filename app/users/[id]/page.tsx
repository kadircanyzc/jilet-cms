'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import {
  ArrowLeft,
  Save,
  X,
  Trash2,
  Phone,
  Mail,
  Calendar,
  User as UserIcon,
  Shield,
  Clock,
  MapPin,
  TrendingUp,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface User {
  id: string
  name: string
  surname?: string
  email: string
  phone?: string
  username?: string
  role: string
  active?: boolean
  isBlocked?: boolean
  createdAt?: any
  updatedAt?: any
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
}

interface Appointment {
  id: string
  barberId: string
  barberName?: string
  serviceName?: string
  date: any
  time?: string
  status: string
  totalPrice?: number
}

interface UserStats {
  appointmentCount: number
  completedAppointments: number
  cancelledAppointments: number
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = useAuth()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats>({ appointmentCount: 0, completedAppointments: 0, cancelledAppointments: 0 })
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)

  const canEdit = hasPermission('users:write') || hasPermission('*')
  const canDelete = hasPermission('users:delete') || hasPermission('*')

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)

      // Fetch user data
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (!userDoc.exists()) {
        alert('Kullanıcı bulunamadı!')
        router.push('/users')
        return
      }

      const userData = { id: userDoc.id, ...userDoc.data() } as User
      setUser(userData)
      setEditedUser(userData)

      // Fetch user stats and appointments
      await fetchUserStatsAndAppointments(userId)
    } catch (error) {
      console.error('Error fetching user details:', error)
      alert('Kullanıcı bilgileri yüklenirken bir hata oluştu!')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStatsAndAppointments = async (userId: string) => {
    try {
      // Get all appointments for this user
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(10)
      )
      const appointmentsSnapshot = await getDocs(appointmentsQuery)

      const appointmentsData: Appointment[] = []
      let completedCount = 0
      let cancelledCount = 0

      for (const docSnap of appointmentsSnapshot.docs) {
        const data = docSnap.data()
        appointmentsData.push({
          id: docSnap.id,
          barberId: data.barberId,
          barberName: data.barberName,
          serviceName: data.serviceName,
          date: data.date,
          time: data.time,
          status: data.status || 'pending',
          totalPrice: data.totalPrice
        })

        if (data.status === 'completed') completedCount++
        if (data.status === 'cancelled') cancelledCount++
      }

      setAppointments(appointmentsData)
      setStats({
        appointmentCount: appointmentsSnapshot.size,
        completedAppointments: completedCount,
        cancelledAppointments: cancelledCount
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const handleStartEdit = () => {
    if (!canEdit) {
      alert('Bu işlem için yetkiniz yok!')
      return
    }
    setEditing(true)
  }

  const handleCancelEdit = () => {
    setEditedUser(user)
    setEditing(false)
  }

  const handleSave = async () => {
    if (!editedUser || !canEdit) return

    try {
      setSaving(true)

      const updateData: any = {
        name: editedUser.name,
        surname: editedUser.surname,
        email: editedUser.email,
        phone: editedUser.phone,
        updatedAt: new Date()
      }

      await updateDoc(doc(db, 'users', userId), updateData)

      setUser({ ...user, ...updateData })
      setEditing(false)
      alert('Değişiklikler kaydedildi!')
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Kaydetme sırasında bir hata oluştu!')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canDelete) {
      alert('Bu işlem için yetkiniz yok!')
      return
    }

    if (!confirm(`${user?.name} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return
    }

    const confirmText = prompt('Silmek için "SİL" yazın:')
    if (confirmText !== 'SİL') {
      alert('Silme işlemi iptal edildi.')
      return
    }

    try {
      // Delete user's appointments first
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('userId', '==', userId)
      )
      const appointmentsSnapshot = await getDocs(appointmentsQuery)
      const deletePromises = appointmentsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // Delete user document
      await deleteDoc(doc(db, 'users', userId))

      alert('Kullanıcı silindi!')
      router.push('/users')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Silme sırasında bir hata oluştu!')
    }
  }

  const handleToggleActive = async () => {
    if (!canEdit || !user) return

    try {
      const newActiveStatus = !(user.active !== false && !user.isBlocked)
      await updateDoc(doc(db, 'users', userId), {
        active: newActiveStatus,
        isBlocked: !newActiveStatus,
        updatedAt: new Date()
      })

      const updatedUser = { ...user, active: newActiveStatus, isBlocked: !newActiveStatus }
      setUser(updatedUser)
      setEditedUser(updatedUser)

      alert(`Kullanıcı ${newActiveStatus ? 'aktif' : 'pasif'} hale getirildi!`)
    } catch (error) {
      console.error('Error toggling active status:', error)
      alert('İşlem sırasında bir hata oluştu!')
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (!editedUser) return
    setEditedUser({ ...editedUser, [field]: value })
  }

  const formatDate = (date: any) => {
    if (!date) return 'Bilinmiyor'
    const dateObj = date.toDate ? date.toDate() : new Date(date)
    return dateObj.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Beklemede', className: 'bg-yellow-100 text-yellow-700' },
      confirmed: { label: 'Onaylandı', className: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Tamamlandı', className: 'bg-green-100 text-green-700' },
      cancelled: { label: 'İptal Edildi', className: 'bg-red-100 text-red-700' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Yükleniyor...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Kullanıcı bulunamadı</div>
        </div>
      </DashboardLayout>
    )
  }

  const hasUTMParams = user.utmSource || user.utmMedium || user.utmCampaign || user.utmContent || user.utmTerm

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/users')}
              className="p-2 hover:bg-accent rounded-[var(--radius)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {editing && editedUser ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editedUser.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ad"
                      className="px-3 py-1 border border-border rounded-[var(--radius)] bg-background"
                    />
                    <input
                      type="text"
                      value={editedUser.surname || ''}
                      onChange={(e) => handleInputChange('surname', e.target.value)}
                      placeholder="Soyad"
                      className="px-3 py-1 border border-border rounded-[var(--radius)] bg-background"
                    />
                  </div>
                ) : (
                  `${user.name} ${user.surname || ''}`
                )}
              </h1>
              <p className="text-muted-foreground mt-1">Kullanıcı detayları ve düzenleme</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Active/Inactive Toggle */}
            {canEdit && (
              <button
                onClick={handleToggleActive}
                className={`px-4 py-2 rounded-[var(--radius)] font-medium transition-colors ${
                  user.active !== false && !user.isBlocked
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {user.active !== false && !user.isBlocked ? 'Aktif' : 'Pasif'}
              </button>
            )}

            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 transition-opacity flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-[var(--radius)] hover:bg-gray-300 transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>İptal</span>
                </button>
              </>
            ) : (
              <>
                {canEdit && (
                  <button
                    onClick={handleStartEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-[var(--radius)] hover:bg-blue-700 transition-colors"
                  >
                    Düzenle
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-[var(--radius)] hover:opacity-90 transition-opacity flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Sil</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Randevu</p>
                <p className="text-2xl font-bold text-card-foreground mt-1">
                  {stats.appointmentCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tamamlanan</p>
                <p className="text-2xl font-bold text-card-foreground mt-1">
                  {stats.completedAppointments}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">İptal Edilen</p>
                <p className="text-2xl font-bold text-card-foreground mt-1">
                  {stats.cancelledAppointments}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-card-foreground">Temel Bilgiler</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                  <UserIcon className="w-4 h-4" />
                  <span>Ad</span>
                </label>
                {editing && editedUser ? (
                  <input
                    type="text"
                    value={editedUser.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  <p className="mt-1 text-card-foreground">{user.name}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                  <UserIcon className="w-4 h-4" />
                  <span>Soyad</span>
                </label>
                {editing && editedUser ? (
                  <input
                    type="text"
                    value={editedUser.surname || ''}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  <p className="mt-1 text-card-foreground">{user.surname || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>E-posta</span>
                </label>
                {editing && editedUser ? (
                  <input
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  <p className="mt-1 text-card-foreground">{user.email}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Telefon</span>
                </label>
                {editing && editedUser ? (
                  <input
                    type="tel"
                    value={editedUser.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  <p className="mt-1 text-card-foreground">{user.phone || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                  <UserIcon className="w-4 h-4" />
                  <span>Kullanıcı Adı</span>
                </label>
                <p className="mt-1 text-card-foreground">{user.username || '-'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Rol</span>
                </label>
                <p className="mt-1 text-card-foreground capitalize">
                  {user.role === 'admin' ? 'Yönetici' : user.role === 'barber' ? 'Berber' : 'Kullanıcı'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Kayıt Tarihi</span>
                </label>
                <p className="mt-1 text-card-foreground">{formatDate(user.createdAt)}</p>
              </div>

              {user.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Son Güncelleme</span>
                  </label>
                  <p className="mt-1 text-card-foreground">{formatDate(user.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* UTM Parameters */}
        {hasUTMParams && (
          <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>UTM Parametreleri</span>
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.utmSource && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Source (Kaynak)</label>
                    <p className="mt-1 text-card-foreground">{user.utmSource}</p>
                  </div>
                )}
                {user.utmMedium && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Medium (Ortam)</label>
                    <p className="mt-1 text-card-foreground">{user.utmMedium}</p>
                  </div>
                )}
                {user.utmCampaign && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Campaign (Kampanya)</label>
                    <p className="mt-1 text-card-foreground">{user.utmCampaign}</p>
                  </div>
                )}
                {user.utmContent && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Content (İçerik)</label>
                    <p className="mt-1 text-card-foreground">{user.utmContent}</p>
                  </div>
                )}
                {user.utmTerm && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Term (Terim)</label>
                    <p className="mt-1 text-card-foreground">{user.utmTerm}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Appointments */}
        <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Son Randevular (Son 10)</span>
            </h3>
          </div>
          <div className="p-6">
            {appointments.length === 0 ? (
              <p className="text-muted-foreground">Henüz randevu yok</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 bg-accent/50 rounded-[var(--radius)] hover:bg-accent/70 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <p className="font-medium text-card-foreground">
                            {appointment.barberName || 'Berber adı yok'}
                          </p>
                        </div>
                        {appointment.serviceName && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Hizmet: {appointment.serviceName}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(appointment.date)}</span>
                          </span>
                          {appointment.time && (
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{appointment.time}</span>
                            </span>
                          )}
                        </div>
                        {appointment.totalPrice && (
                          <p className="text-sm font-semibold text-primary mt-2">
                            {appointment.totalPrice} TL
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {getStatusBadge(appointment.status)}
                        <button
                          onClick={() => router.push(`/appointments?search=${appointment.id}`)}
                          className="text-xs text-primary hover:underline flex items-center space-x-1"
                        >
                          <span>Detay</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
