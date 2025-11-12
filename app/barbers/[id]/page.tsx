'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore'
import {
  ArrowLeft,
  Save,
  X,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Scissors,
  Users,
  Star,
  Image as ImageIcon,
  Calendar,
  MessageSquare,
  TrendingUp,
  Plus,
  Edit as EditIcon,
  UserPlus
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Service {
  name: string
  price: number
  duration: number
}

interface Employee {
  id: string
  name: string
  specialties?: string[]
}

interface EmployeeData {
  id: string
  barberId: string
  firstName: string
  lastName: string
  username: string
  email: string
  phone: string
  password: string
  createdAt: any
  isActive: boolean
}

interface WorkingHours {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}

interface Barber {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  district?: string
  latitude?: number
  longitude?: number
  rating?: number
  reviewCount?: number
  workingHours?: WorkingHours
  services?: Service[]
  employees?: Employee[]
  shopImages?: string[]
  role?: string
  active?: boolean
  createdAt?: any
}

interface BarberStats {
  appointmentCount: number
  reviewCount: number
  avgRating: number
}

const dayLabels: Record<string, string> = {
  monday: 'Pazartesi',
  tuesday: 'Salı',
  wednesday: 'Çarşamba',
  thursday: 'Perşembe',
  friday: 'Cuma',
  saturday: 'Cumartesi',
  sunday: 'Pazar',
}

export default function BarberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = useAuth()
  const barberId = params.id as string

  const [barber, setBarber] = useState<Barber | null>(null)
  const [stats, setStats] = useState<BarberStats>({ appointmentCount: 0, reviewCount: 0, avgRating: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedBarber, setEditedBarber] = useState<Barber | null>(null)
  const [saving, setSaving] = useState(false)

  // Employee management state
  const [employees, setEmployees] = useState<EmployeeData[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null)
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: ''
  })

  const canEdit = hasPermission('barbers:write') || hasPermission('*')
  const canDelete = hasPermission('barbers:delete') || hasPermission('*')

  useEffect(() => {
    fetchBarberDetails()
    fetchEmployees()
  }, [barberId])

  const fetchBarberDetails = async () => {
    try {
      setLoading(true)

      // Fetch barber data
      const barberDoc = await getDoc(doc(db, 'barbers', barberId))
      if (!barberDoc.exists()) {
        alert('Berber bulunamadı!')
        router.push('/barbers')
        return
      }

      const barberData = { id: barberDoc.id, ...barberDoc.data() } as Barber
      setBarber(barberData)
      setEditedBarber(barberData)

      // Fetch stats
      await fetchBarberStats(barberId)
    } catch (error) {
      console.error('Error fetching barber details:', error)
      alert('Berber bilgileri yüklenirken bir hata oluştu!')
    } finally {
      setLoading(false)
    }
  }

  const fetchBarberStats = async (barberId: string) => {
    try {
      // Get appointment count
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('barberId', '==', barberId)
      )
      const appointmentsSnapshot = await getDocs(appointmentsQuery)
      const appointmentCount = appointmentsSnapshot.size

      // Get reviews
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('barberId', '==', barberId)
      )
      const reviewsSnapshot = await getDocs(reviewsQuery)
      const reviewCount = reviewsSnapshot.size

      // Calculate average rating
      let totalRating = 0
      reviewsSnapshot.docs.forEach(doc => {
        const data = doc.data()
        totalRating += data.rating || 0
      })
      const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0

      setStats({ appointmentCount, reviewCount, avgRating })
    } catch (error) {
      console.error('Error fetching barber stats:', error)
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
    setEditedBarber(barber)
    setEditing(false)
  }

  const handleSave = async () => {
    if (!editedBarber || !canEdit) return

    try {
      setSaving(true)

      const updateData: any = { ...editedBarber }
      delete updateData.id

      await updateDoc(doc(db, 'barbers', barberId), updateData)

      setBarber(editedBarber)
      setEditing(false)
      alert('Değişiklikler kaydedildi!')
    } catch (error) {
      console.error('Error saving barber:', error)
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

    if (!confirm(`${barber?.name} berberini silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'barbers', barberId))
      alert('Berber silindi!')
      router.push('/barbers')
    } catch (error) {
      console.error('Error deleting barber:', error)
      alert('Silme sırasında bir hata oluştu!')
    }
  }

  const handleToggleActive = async () => {
    if (!canEdit || !barber) return

    try {
      const newActiveStatus = !barber.active
      await updateDoc(doc(db, 'barbers', barberId), { active: newActiveStatus })

      const updatedBarber = { ...barber, active: newActiveStatus }
      setBarber(updatedBarber)
      setEditedBarber(updatedBarber)

      alert(`Berber ${newActiveStatus ? 'aktif' : 'pasif'} hale getirildi!`)
    } catch (error) {
      console.error('Error toggling active status:', error)
      alert('İşlem sırasında bir hata oluştu!')
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (!editedBarber) return
    setEditedBarber({ ...editedBarber, [field]: value })
  }

  const handleWorkingHoursChange = (day: string, value: string) => {
    if (!editedBarber) return
    setEditedBarber({
      ...editedBarber,
      workingHours: {
        ...editedBarber.workingHours,
        [day]: value,
      },
    })
  }

  const handleServiceChange = (index: number, field: keyof Service, value: any) => {
    if (!editedBarber || !editedBarber.services) return
    const updatedServices = [...editedBarber.services]
    updatedServices[index] = { ...updatedServices[index], [field]: value }
    setEditedBarber({ ...editedBarber, services: updatedServices })
  }

  const handleAddService = () => {
    if (!editedBarber) return
    const newService: Service = { name: 'Yeni Hizmet', price: 0, duration: 30 }
    setEditedBarber({
      ...editedBarber,
      services: [...(editedBarber.services || []), newService],
    })
  }

  const handleRemoveService = (index: number) => {
    if (!editedBarber || !editedBarber.services) return
    const updatedServices = editedBarber.services.filter((_, i) => i !== index)
    setEditedBarber({ ...editedBarber, services: updatedServices })
  }

  const handleImageChange = (index: number, value: string) => {
    if (!editedBarber || !editedBarber.shopImages) return
    const updatedImages = [...editedBarber.shopImages]
    updatedImages[index] = value
    setEditedBarber({ ...editedBarber, shopImages: updatedImages })
  }

  const handleAddImage = () => {
    if (!editedBarber) return
    setEditedBarber({
      ...editedBarber,
      shopImages: [...(editedBarber.shopImages || []), ''],
    })
  }

  const handleRemoveImage = (index: number) => {
    if (!editedBarber || !editedBarber.shopImages) return
    const updatedImages = editedBarber.shopImages.filter((_, i) => i !== index)
    setEditedBarber({ ...editedBarber, shopImages: updatedImages })
  }

  // Employee management functions
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const employeesQuery = query(
        collection(db, 'employees'),
        where('barberId', '==', barberId)
      )
      const employeesSnapshot = await getDocs(employeesQuery)
      const employeesData = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmployeeData[]
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error fetching employees:', error)
      alert('Çalışanlar yüklenirken bir hata oluştu!')
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleOpenAddEmployeeModal = () => {
    if (!canEdit) {
      alert('Bu işlem için yetkiniz yok!')
      return
    }
    setEditingEmployee(null)
    setEmployeeForm({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      password: ''
    })
    setShowEmployeeModal(true)
  }

  const handleOpenEditEmployeeModal = (employee: EmployeeData) => {
    if (!canEdit) {
      alert('Bu işlem için yetkiniz yok!')
      return
    }
    setEditingEmployee(employee)
    setEmployeeForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      username: employee.username,
      email: employee.email,
      phone: employee.phone,
      password: employee.password
    })
    setShowEmployeeModal(true)
  }

  const handleCloseEmployeeModal = () => {
    setShowEmployeeModal(false)
    setEditingEmployee(null)
    setEmployeeForm({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      password: ''
    })
  }

  const handleEmployeeFormChange = (field: string, value: string) => {
    setEmployeeForm({ ...employeeForm, [field]: value })
  }

  const handleSaveEmployee = async () => {
    if (!canEdit) return

    // Validation
    if (!employeeForm.firstName.trim()) {
      alert('Lütfen ad giriniz!')
      return
    }
    if (!employeeForm.lastName.trim()) {
      alert('Lütfen soyad giriniz!')
      return
    }
    if (!employeeForm.username.trim()) {
      alert('Lütfen kullanıcı adı giriniz!')
      return
    }
    if (!employeeForm.email.trim()) {
      alert('Lütfen e-posta giriniz!')
      return
    }
    if (!employeeForm.phone.trim()) {
      alert('Lütfen telefon giriniz!')
      return
    }
    if (!editingEmployee && !employeeForm.password.trim()) {
      alert('Lütfen şifre giriniz!')
      return
    }

    try {
      setSaving(true)

      if (editingEmployee) {
        // Update existing employee
        const employeeData: any = {
          firstName: employeeForm.firstName.trim(),
          lastName: employeeForm.lastName.trim(),
          username: employeeForm.username.trim(),
          email: employeeForm.email.trim(),
          phone: employeeForm.phone.trim(),
        }

        // Only update password if changed
        if (employeeForm.password.trim() && employeeForm.password !== editingEmployee.password) {
          employeeData.password = employeeForm.password.trim()
        }

        await updateDoc(doc(db, 'employees', editingEmployee.id), employeeData)
        alert('Çalışan güncellendi!')
      } else {
        // Add new employee
        const employeeData = {
          barberId,
          firstName: employeeForm.firstName.trim(),
          lastName: employeeForm.lastName.trim(),
          username: employeeForm.username.trim(),
          email: employeeForm.email.trim(),
          phone: employeeForm.phone.trim(),
          password: employeeForm.password.trim(),
          createdAt: Timestamp.now(),
          isActive: true
        }

        await addDoc(collection(db, 'employees'), employeeData)
        alert('Çalışan eklendi!')
      }

      handleCloseEmployeeModal()
      fetchEmployees()
    } catch (error) {
      console.error('Error saving employee:', error)
      alert('Kaydetme sırasında bir hata oluştu!')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!canDelete) {
      alert('Bu işlem için yetkiniz yok!')
      return
    }

    if (!confirm(`${employeeName} adlı çalışanı silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'employees', employeeId))
      alert('Çalışan silindi!')
      fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Silme sırasında bir hata oluştu!')
    }
  }

  const handleToggleEmployeeActive = async (employee: EmployeeData) => {
    if (!canEdit) {
      alert('Bu işlem için yetkiniz yok!')
      return
    }

    try {
      const newActiveStatus = !employee.isActive
      await updateDoc(doc(db, 'employees', employee.id), { isActive: newActiveStatus })
      alert(`Çalışan ${newActiveStatus ? 'aktif' : 'pasif'} hale getirildi!`)
      fetchEmployees()
    } catch (error) {
      console.error('Error toggling employee status:', error)
      alert('İşlem sırasında bir hata oluştu!')
    }
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

  if (!barber) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Berber bulunamadı</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/barbers')}
              className="p-2 hover:bg-accent rounded-[var(--radius)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {editing && editedBarber ? (
                  <input
                    type="text"
                    value={editedBarber.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="px-3 py-1 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  barber.name
                )}
              </h1>
              <p className="text-muted-foreground mt-1">Berber detayları ve düzenleme</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Active/Inactive Toggle */}
            {canEdit && (
              <button
                onClick={handleToggleActive}
                className={`px-4 py-2 rounded-[var(--radius)] font-medium transition-colors ${
                  barber.active !== false
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {barber.active !== false ? 'Aktif' : 'Pasif'}
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
                <p className="text-sm text-muted-foreground">Yorum Sayısı</p>
                <p className="text-2xl font-bold text-card-foreground mt-1">
                  {stats.reviewCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[var(--radius)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ortalama Puan</p>
                <p className="text-2xl font-bold text-card-foreground mt-1">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : barber.rating?.toFixed(1) || '0.0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
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
                  <Mail className="w-4 h-4" />
                  <span>E-posta</span>
                </label>
                {editing && editedBarber ? (
                  <input
                    type="email"
                    value={editedBarber.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  <p className="mt-1 text-card-foreground">{barber.email || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Telefon</span>
                </label>
                {editing && editedBarber ? (
                  <input
                    type="tel"
                    value={editedBarber.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  <p className="mt-1 text-card-foreground">{barber.phone || '-'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Adres</span>
                </label>
                {editing && editedBarber ? (
                  <input
                    type="text"
                    value={editedBarber.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  <p className="mt-1 text-card-foreground">{barber.address || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Şehir</label>
                {editing && editedBarber ? (
                  <input
                    type="text"
                    value={editedBarber.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  <p className="mt-1 text-card-foreground">{barber.city || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">İlçe</label>
                {editing && editedBarber ? (
                  <input
                    type="text"
                    value={editedBarber.district || ''}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  <p className="mt-1 text-card-foreground">{barber.district || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Coordinates */}
        <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-card-foreground">Koordinatlar</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Enlem (Latitude)</label>
                {editing && editedBarber ? (
                  <input
                    type="number"
                    step="0.000001"
                    value={editedBarber.latitude || ''}
                    onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  <p className="mt-1 text-card-foreground">{barber.latitude || '-'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Boylam (Longitude)</label>
                {editing && editedBarber ? (
                  <input
                    type="number"
                    step="0.000001"
                    value={editedBarber.longitude || ''}
                    onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  <p className="mt-1 text-card-foreground">{barber.longitude || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Çalışma Saatleri</span>
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {Object.entries(dayLabels).map(([day, label]) => (
              <div key={day} className="flex items-center justify-between">
                <span className="text-sm font-medium text-card-foreground w-32">{label}</span>
                {editing && editedBarber ? (
                  <input
                    type="text"
                    value={editedBarber.workingHours?.[day as keyof WorkingHours] || ''}
                    onChange={(e) => handleWorkingHoursChange(day, e.target.value)}
                    placeholder="09:00-18:00 veya Kapalı"
                    className="flex-1 px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                  />
                ) : (
                  <span className="text-muted-foreground">
                    {barber.workingHours?.[day as keyof WorkingHours] || '-'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
                <Scissors className="w-5 h-5" />
                <span>Hizmetler</span>
              </h3>
              {editing && (
                <button
                  onClick={handleAddService}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-[var(--radius)] text-sm hover:opacity-90"
                >
                  + Hizmet Ekle
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            {(!barber.services || barber.services.length === 0) && !editing ? (
              <p className="text-muted-foreground">Henüz hizmet eklenmemiş</p>
            ) : (
              <div className="space-y-3">
                {(editing ? editedBarber?.services : barber.services)?.map((service, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-accent/50 rounded-[var(--radius)]">
                    {editing && editedBarber ? (
                      <>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                          placeholder="Hizmet adı"
                          className="flex-1 px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                        />
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) => handleServiceChange(index, 'price', parseFloat(e.target.value))}
                          placeholder="Fiyat"
                          className="w-24 px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                        />
                        <input
                          type="number"
                          value={service.duration}
                          onChange={(e) => handleServiceChange(index, 'duration', parseInt(e.target.value))}
                          placeholder="Süre (dk)"
                          className="w-24 px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                        />
                        <button
                          onClick={() => handleRemoveService(index)}
                          className="p-2 hover:bg-destructive/10 rounded-[var(--radius)] text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-medium text-card-foreground">{service.name}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">{service.duration} dk</div>
                        <div className="text-sm font-semibold text-primary">{service.price} TL</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Employees Management */}
        <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Çalışanlar</span>
              </h3>
              {canEdit && (
                <button
                  onClick={handleOpenAddEmployeeModal}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 transition-opacity flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Yeni Çalışan Ekle</span>
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            {loadingEmployees ? (
              <p className="text-muted-foreground">Çalışanlar yükleniyor...</p>
            ) : employees.length === 0 ? (
              <p className="text-muted-foreground">Henüz çalışan eklenmemiş</p>
            ) : (
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="p-4 bg-accent/50 rounded-[var(--radius)] border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-card-foreground text-lg">
                            {employee.firstName} {employee.lastName}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              employee.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {employee.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">Kullanıcı Adı:</span>
                            <span>{employee.username}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span className="font-medium">Telefon:</span>
                            <span>{employee.phone}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span className="font-medium">E-posta:</span>
                            <span>{employee.email}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <span className="font-medium">Şifre:</span>
                            <span className="font-mono">{'•'.repeat(8)}</span>
                          </div>
                        </div>
                      </div>

                      {canEdit && (
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleToggleEmployeeActive(employee)}
                            className={`px-3 py-1 rounded-[var(--radius)] text-sm font-medium transition-colors ${
                              employee.isActive
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={employee.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                          >
                            {employee.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                          </button>
                          <button
                            onClick={() => handleOpenEditEmployeeModal(employee)}
                            className="p-2 hover:bg-primary/10 rounded-[var(--radius)] text-primary transition-colors"
                            title="Düzenle"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() =>
                                handleDeleteEmployee(employee.id, `${employee.firstName} ${employee.lastName}`)
                              }
                              className="p-2 hover:bg-destructive/10 rounded-[var(--radius)] text-destructive transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="bg-card border border-border rounded-[var(--radius)] overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
                <ImageIcon className="w-5 h-5" />
                <span>Görseller</span>
              </h3>
              {editing && (
                <button
                  onClick={handleAddImage}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-[var(--radius)] text-sm hover:opacity-90"
                >
                  + Görsel Ekle
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            {(!barber.shopImages || barber.shopImages.length === 0) && !editing ? (
              <p className="text-muted-foreground">Henüz görsel eklenmemiş</p>
            ) : (
              <div className="space-y-3">
                {(editing ? editedBarber?.shopImages : barber.shopImages)?.map((image, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {editing && editedBarber ? (
                      <>
                        <input
                          type="text"
                          value={image}
                          onChange={(e) => handleImageChange(index, e.target.value)}
                          placeholder="Görsel URL'si"
                          className="flex-1 px-3 py-2 border border-border rounded-[var(--radius)] bg-background"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="p-2 hover:bg-destructive/10 rounded-[var(--radius)] text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <img
                          src={image}
                          alt={`Görsel ${index + 1}`}
                          className="w-32 h-32 object-cover rounded-[var(--radius)]"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/128'
                          }}
                        />
                        <p className="text-sm text-muted-foreground flex-1 truncate">{image}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Employee Add/Edit Modal */}
        {showEmployeeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-[var(--radius)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-card-foreground">
                    {editingEmployee ? 'Çalışan Düzenle' : 'Yeni Çalışan Ekle'}
                  </h3>
                  <button
                    onClick={handleCloseEmployeeModal}
                    className="p-2 hover:bg-accent rounded-[var(--radius)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Ad <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={employeeForm.firstName}
                      onChange={(e) => handleEmployeeFormChange('firstName', e.target.value)}
                      placeholder="Çalışanın adı"
                      className="w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Soyad <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={employeeForm.lastName}
                      onChange={(e) => handleEmployeeFormChange('lastName', e.target.value)}
                      placeholder="Çalışanın soyadı"
                      className="w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Kullanıcı Adı <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={employeeForm.username}
                      onChange={(e) => handleEmployeeFormChange('username', e.target.value)}
                      placeholder="Kullanıcı adı"
                      className="w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      E-posta <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      value={employeeForm.email}
                      onChange={(e) => handleEmployeeFormChange('email', e.target.value)}
                      placeholder="ornek@email.com"
                      className="w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Telefon <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="tel"
                      value={employeeForm.phone}
                      onChange={(e) => handleEmployeeFormChange('phone', e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Şifre {!editingEmployee && <span className="text-destructive">*</span>}
                      {editingEmployee && <span className="text-xs text-muted-foreground ml-1">(değiştirmek için doldurun)</span>}
                    </label>
                    <input
                      type="text"
                      value={employeeForm.password}
                      onChange={(e) => handleEmployeeFormChange('password', e.target.value)}
                      placeholder={editingEmployee ? "Yeni şifre (opsiyonel)" : "Şifre"}
                      className="w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-[var(--radius)] p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>Not:</strong> Şifre mobil uygulamada giriş için kullanılacaktır.
                    Güvenli bir şifre seçtiğinizden emin olun.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-border flex items-center justify-end space-x-3">
                <button
                  onClick={handleCloseEmployeeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-[var(--radius)] hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveEmployee}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 transition-opacity flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Kaydediliyor...' : editingEmployee ? 'Güncelle' : 'Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
