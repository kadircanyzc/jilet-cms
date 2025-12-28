'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { auth } from '@/lib/firebase'
import { Users, Search, Ban, Trash2, CheckCircle, XCircle, Calendar, Eye } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  isBlocked?: boolean
  createdAt: string | null
  totalAppointments?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchTerm, filterStatus, users])

  const fetchUsers = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        window.location.href = '/login?redirect=/users';
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
          alert('Oturum süreniz dolmuş veya yetkiniz yok. Lütfen tekrar giriş yapın.');
          window.location.href = '/login?redirect=/users';
          return;
        }
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      alert('Kullanıcılar yüklenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      )
    }

    // Status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(user => !user.isBlocked)
    } else if (filterStatus === 'blocked') {
      filtered = filtered.filter(user => user.isBlocked)
    }

    setFilteredUsers(filtered)
  }

  const handleBlockUser = async (userId: string, userName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'engelini kaldır' : 'engelle'
    if (!confirm(`${userName} kullanıcısını ${action}mak istediğinize emin misiniz?`)) {
      return
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Lütfen giriş yapın');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          userName,
          isBlocked: !currentStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, isBlocked: !currentStatus } : user
        )
      )

      alert(`Kullanıcı başarıyla ${action}ndi!`)
    } catch (error) {
      console.error('Error blocking user:', error)
      alert('İşlem sırasında bir hata oluştu!')
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`${userName} kullanıcısını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return
    }

    const confirmText = prompt('Silmek için "SİL" yazın:')
    if (confirmText !== 'SİL') {
      alert('Silme işlemi iptal edildi.')
      return
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Lütfen giriş yapın');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`/api/users?userId=${userId}&userName=${encodeURIComponent(userName)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Update local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))

      alert('Kullanıcı başarıyla silindi!')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Silme işlemi sırasında bir hata oluştu!')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">👥 Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Platformdaki kullanıcıları yönet</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold text-foreground mt-1">{users.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktif Kullanıcı</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {users.filter(u => !u.isBlocked).length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engelli Kullanıcı</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {users.filter(u => u.isBlocked).length}
                </p>
              </div>
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-[var(--radius)] p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="İsim, email veya telefon ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'blocked')}
              className="px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tüm Kullanıcılar</option>
              <option value="active">Aktif</option>
              <option value="blocked">Engelli</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    İletişim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Randevu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Kayıt Tarihi
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      {searchTerm || filterStatus !== 'all' ? 'Kullanıcı bulunamadı' : 'Henüz kayıtlı kullanıcı yok'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-card-foreground">{user.name}</div>
                            <div className="text-xs text-muted-foreground">ID: {user.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-muted-foreground">{user.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{user.totalAppointments}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isBlocked ? (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                            Engelli
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => window.location.href = `/users/${user.id}`}
                            className="p-2 hover:bg-blue-100 rounded-[var(--radius)] transition-colors text-blue-600"
                            title="Detay"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBlockUser(user.id, user.name, user.isBlocked || false)}
                            className={`p-2 rounded-[var(--radius)] transition-colors ${
                              user.isBlocked
                                ? 'hover:bg-green-100 text-green-600'
                                : 'hover:bg-yellow-100 text-yellow-600'
                            }`}
                            title={user.isBlocked ? 'Engeli Kaldır' : 'Engelle'}
                          >
                            {user.isBlocked ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="p-2 hover:bg-destructive/10 rounded-[var(--radius)] transition-colors text-destructive"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Toplam <span className="font-medium text-foreground">{filteredUsers.length}</span> kullanıcı gösteriliyor
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
