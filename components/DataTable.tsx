'use client'

import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

interface TableData {
  id: string
  title: string
  author: string
  status: 'active' | 'pending' | 'inactive'
  views: number
  date: string
  city?: string
  phone?: string
}

export default function DataTable() {
  const [barbers, setBarbers] = useState<TableData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const barbersQuery = query(
          collection(db, 'barbers'),
          where('role', '==', 'barber'),
          limit(10)
        )
        const barbersSnapshot = await getDocs(barbersQuery)

        const barbersData: TableData[] = barbersSnapshot.docs.map(doc => {
          const data = doc.data()

          // Determine status based on data
          let status: 'active' | 'pending' | 'inactive' = 'active'
          if (data.isActive === false) {
            status = 'inactive'
          } else if (data.isPending === true) {
            status = 'pending'
          }

          // Format date
          let dateStr = 'Bilinmiyor'
          if (data.createdAt) {
            const date = data.createdAt.toDate()
            dateStr = date.toLocaleDateString('tr-TR')
          }

          return {
            id: doc.id,
            title: data.name || data.shopName || 'İsimsiz Berber',
            author: data.ownerName || data.name || 'Bilinmiyor',
            status,
            views: Math.floor(Math.random() * 5000), // Random views for now
            date: dateStr,
            city: data.city,
            phone: data.phone || data.phoneNumber,
          }
        })

        setBarbers(barbersData)
      } catch (error) {
        console.error('Error fetching barbers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBarbers()
  }, [])
  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      inactive: 'bg-gray-100 text-gray-700',
    }
    const labels = {
      active: 'Aktif',
      pending: 'Beklemede',
      inactive: 'Pasif',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="bg-card rounded-[var(--radius)] border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-card-foreground">Berber Yönetimi</h3>
        <p className="text-sm text-muted-foreground mt-1">Tüm kayıtlı berberleri görüntüleyin ve yönetin</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Başlık
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sahibi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Görüntülenme
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tarih
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
            ) : barbers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  Henüz kayıtlı berber yok
                </td>
              </tr>
            ) : (
              barbers.map((item) => (
                <tr key={item.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-card-foreground">{item.title}</div>
                    {item.city && (
                      <div className="text-xs text-muted-foreground">{item.city}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">{item.author}</div>
                    {item.phone && (
                      <div className="text-xs text-muted-foreground">{item.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">{item.views.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">{item.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 hover:bg-accent rounded-[var(--radius)] transition-colors" title="Görüntüle">
                        <Eye className="w-4 h-4 text-foreground" />
                      </button>
                      <button className="p-2 hover:bg-accent rounded-[var(--radius)] transition-colors" title="Düzenle">
                        <Edit className="w-4 h-4 text-foreground" />
                      </button>
                      <button className="p-2 hover:bg-destructive/10 rounded-[var(--radius)] transition-colors" title="Sil">
                        <Trash2 className="w-4 h-4 text-destructive" />
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
      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Toplam <span className="font-medium text-foreground">{barbers.length}</span> kayıt gösteriliyor
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-[var(--radius)] hover:bg-accent disabled:opacity-50" disabled>
            Önceki
          </button>
          <button className="px-3 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-[var(--radius)]">
            1
          </button>
          <button className="px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-[var(--radius)] hover:bg-accent">
            2
          </button>
          <button className="px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-[var(--radius)] hover:bg-accent">
            Sonraki
          </button>
        </div>
      </div>
    </div>
  )
}
