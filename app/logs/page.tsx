'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { Activity, Search, Filter, User, Scissors, Ban, Trash2, FileText } from 'lucide-react'

interface LogEntry {
  id: string
  action: string
  targetType: string
  targetId: string
  targetName: string
  performedBy: string
  performedAt: any
  details?: any
}

const actionLabels: Record<string, string> = {
  'barber_created': 'Berber Oluşturuldu',
  'barber_updated': 'Berber Güncellendi',
  'barber_deleted': 'Berber Silindi',
  'user_blocked': 'Kullanıcı Engellendi',
  'user_unblocked': 'Kullanıcı Engellemesi Kaldırıldı',
  'user_deleted': 'Kullanıcı Silindi',
  'appointment_cancelled': 'Randevu İptal Edildi',
  'review_deleted': 'Yorum Silindi',
}

const actionIcons: Record<string, any> = {
  'barber_created': Scissors,
  'barber_updated': FileText,
  'barber_deleted': Trash2,
  'user_blocked': Ban,
  'user_unblocked': User,
  'user_deleted': Trash2,
  'appointment_cancelled': FileText,
  'review_deleted': Trash2,
}

const actionColors: Record<string, string> = {
  'barber_created': 'text-green-600 bg-green-100',
  'barber_updated': 'text-blue-600 bg-blue-100',
  'barber_deleted': 'text-red-600 bg-red-100',
  'user_blocked': 'text-orange-600 bg-orange-100',
  'user_unblocked': 'text-green-600 bg-green-100',
  'user_deleted': 'text-red-600 bg-red-100',
  'appointment_cancelled': 'text-yellow-600 bg-yellow-100',
  'review_deleted': 'text-red-600 bg-red-100',
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState<string>('all')

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [searchTerm, filterAction, logs])

  const fetchLogs = async () => {
    try {
      const logsSnapshot = await getDocs(collection(db, 'logs'))

      const logsData: LogEntry[] = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LogEntry))

      // Sort by date (newest first)
      logsData.sort((a, b) => {
        const dateA = a.performedAt?.toDate?.() || new Date(0)
        const dateB = b.performedAt?.toDate?.() || new Date(0)
        return dateB.getTime() - dateA.getTime()
      })

      setLogs(logsData)
      setFilteredLogs(logsData)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = [...logs]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.targetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        actionLabels[log.action]?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Action filter
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction)
    }

    setFilteredLogs(filtered)
  }

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || Activity
    return Icon
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">📋 Aktivite Logları</h1>
          <p className="text-muted-foreground mt-1">Sistemdeki tüm işlemlerin kayıtları</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam İşlem</p>
                <p className="text-2xl font-bold text-foreground mt-1">{logs.length}</p>
              </div>
              <Activity className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bugün</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {logs.filter(log => {
                    const logDate = log.performedAt?.toDate?.()
                    if (!logDate) return false
                    const today = new Date()
                    return logDate.toDateString() === today.toDateString()
                  }).length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bu Hafta</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {logs.filter(log => {
                    const logDate = log.performedAt?.toDate?.()
                    if (!logDate) return false
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return logDate >= weekAgo
                  }).length}
                </p>
              </div>
              <Activity className="w-10 h-10 text-purple-600" />
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
                placeholder="İşlem veya kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Action Filter */}
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tüm İşlemler</option>
              {Object.entries(actionLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Timeline */}
        <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterAction !== 'all' ? 'Kayıt bulunamadı' : 'Henüz kayıtlı işlem yok'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => {
                  const Icon = getActionIcon(log.action)
                  const colorClass = actionColors[log.action] || 'text-gray-600 bg-gray-100'

                  return (
                    <div key={log.id} className="flex items-start space-x-4 p-4 hover:bg-accent/50 rounded-[var(--radius)] transition-colors">
                      <div className={`p-3 rounded-full ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-card-foreground">
                            {actionLabels[log.action] || log.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.performedAt?.toDate?.().toLocaleString('tr-TR') || 'Bilinmiyor'}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">{log.targetName}</span> • {log.targetType}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Yapan: <span className="font-medium">{log.performedBy}</span>
                        </p>
                        {log.details && (
                          <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                            {Object.entries(log.details).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Toplam <span className="font-medium text-foreground">{filteredLogs.length}</span> kayıt gösteriliyor
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
