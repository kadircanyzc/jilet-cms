'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { Shield, UserPlus, Trash2, Edit2, Save, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

type UserRole = 'super_admin' | 'admin' | 'moderator' | 'viewer'

interface Admin {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: any
}

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Süper Admin',
  admin: 'Admin',
  moderator: 'Moderatör',
  viewer: 'İzleyici',
}

const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  moderator: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-700',
}

export default function SettingsPage() {
  const { user, hasPermission } = useAuth()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<UserRole>('viewer')

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const adminsSnapshot = await getDocs(collection(db, 'admins'))
      const adminsData: Admin[] = adminsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Admin))

      adminsData.sort((a, b) => {
        const roleOrder = { super_admin: 0, admin: 1, moderator: 2, viewer: 3 }
        return roleOrder[a.role] - roleOrder[b.role]
      })

      setAdmins(adminsData)
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = (admin: Admin) => {
    setEditingId(admin.id)
    setEditRole(admin.role)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditRole('viewer')
  }

  const handleSaveRole = async (adminId: string) => {
    try {
      await updateDoc(doc(db, 'admins', adminId), {
        role: editRole,
        updatedAt: new Date(),
      })

      // Log the action
      await setDoc(doc(collection(db, 'logs')), {
        action: 'admin_role_updated',
        targetType: 'admin',
        targetId: adminId,
        targetName: admins.find(a => a.id === adminId)?.name || '',
        performedBy: user?.email || 'admin',
        performedAt: new Date(),
        details: {
          newRole: editRole,
        }
      })

      setAdmins(prevAdmins =>
        prevAdmins.map(admin =>
          admin.id === adminId ? { ...admin, role: editRole } : admin
        )
      )

      setEditingId(null)
      alert('Rol başarıyla güncellendi!')
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Rol güncellenirken bir hata oluştu!')
    }
  }

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`${adminName} admin yetkilerini kaldırmak istediğinize emin misiniz?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'admins', adminId))

      // Log the action
      await setDoc(doc(collection(db, 'logs')), {
        action: 'admin_removed',
        targetType: 'admin',
        targetId: adminId,
        targetName: adminName,
        performedBy: user?.email || 'admin',
        performedAt: new Date(),
      })

      setAdmins(prevAdmins => prevAdmins.filter(admin => admin.id !== adminId))
      alert('Admin yetkisi kaldırıldı!')
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('İşlem sırasında bir hata oluştu!')
    }
  }

  const canEdit = hasPermission('*') // Only super admin can manage roles

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">⚙️ Ayarlar & Yetkilendirme</h1>
          <p className="text-muted-foreground mt-1">Admin kullanıcıları ve rol yönetimi</p>
        </div>

        {/* Current User Info */}
        <div className="bg-card border border-border rounded-[var(--radius)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">Mevcut Oturum</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.email} • {roleLabels[user?.role || 'viewer']}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleColors[user?.role || 'viewer']}`}>
              {roleLabels[user?.role || 'viewer']}
            </span>
          </div>
        </div>

        {/* Role Permissions Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius)] p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Rol Yetkileri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-900">🔴 Süper Admin:</p>
              <p className="text-blue-700">Tüm yetkiler</p>
            </div>
            <div>
              <p className="font-medium text-blue-900">🔵 Admin:</p>
              <p className="text-blue-700">Berber, kullanıcı yönetimi ve silme</p>
            </div>
            <div>
              <p className="font-medium text-blue-900">🟢 Moderatör:</p>
              <p className="text-blue-700">Kullanıcı engelleme, içerik görüntüleme</p>
            </div>
            <div>
              <p className="font-medium text-blue-900">⚪ İzleyici:</p>
              <p className="text-blue-700">Sadece görüntüleme</p>
            </div>
          </div>
        </div>

        {/* Admins Table */}
        <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">Admin Kullanıcılar</h3>
                <p className="text-sm text-muted-foreground mt-1">Sistem yöneticileri ve yetkileri</p>
              </div>
              {canEdit && (
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 transition-opacity flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Yeni Admin Ekle</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    E-posta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Eklenme Tarihi
                  </th>
                  {canEdit && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      İşlemler
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={canEdit ? 5 : 4} className="px-6 py-8 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 5 : 4} className="px-6 py-8 text-center text-muted-foreground">
                      Henüz admin kullanıcı yok
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-card-foreground">{admin.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{admin.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === admin.id ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as UserRole)}
                            className="px-3 py-1 border border-border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="super_admin">Süper Admin</option>
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderatör</option>
                            <option value="viewer">İzleyici</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[admin.role]}`}>
                            {roleLabels[admin.role]}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {admin.createdAt?.toDate?.().toLocaleDateString('tr-TR') || 'Bilinmiyor'}
                        </div>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {editingId === admin.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveRole(admin.id)}
                                  className="p-2 hover:bg-green-100 rounded-[var(--radius)] transition-colors text-green-600"
                                  title="Kaydet"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-2 hover:bg-gray-100 rounded-[var(--radius)] transition-colors text-gray-600"
                                  title="İptal"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(admin)}
                                  disabled={admin.id === user?.uid}
                                  className="p-2 hover:bg-blue-100 rounded-[var(--radius)] transition-colors text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Düzenle"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                                  disabled={admin.id === user?.uid || admin.role === 'super_admin'}
                                  className="p-2 hover:bg-destructive/10 rounded-[var(--radius)] transition-colors text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
