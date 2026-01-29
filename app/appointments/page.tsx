'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Search,
  Eye,
  Scissors,
  Clock,
  Phone,
  Mail,
  User,
  X,
  Trash2,
  CheckSquare,
  Ban,
  MoreVertical
} from 'lucide-react';
import { collection, query, onSnapshot, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast, ToastContainer } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';

interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  barberId: string;
  barberName: string;
  employeeId?: string;
  employeeName?: string;
  service: string;
  serviceDuration?: number;
  date: string;
  time: string;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: any;
}

interface Barber {
  id: string;
  shopName: string;
}

const statusConfig = {
  pending: {
    label: 'Bekliyor',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: AlertCircle,
  },
  confirmed: {
    label: 'Onaylandı',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: CheckCircle,
  },
  completed: {
    label: 'Tamamlandı',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'İptal Edildi',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircle,
  },
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { toasts, showToast, closeToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [barberFilter, setBarberFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Confirm Dialog States
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    variant: 'primary' as 'danger' | 'primary' | 'success',
    onConfirm: () => {},
  });

  // Real-time appointments listener
  useEffect(() => {
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      
      setAppointments(appointmentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load barbers for filter
  useEffect(() => {
    const barbersQuery = query(collection(db, 'barbers'));
    
    const unsubscribe = onSnapshot(barbersQuery, (snapshot) => {
      const barbersData = snapshot.docs.map(doc => ({
        id: doc.id,
        shopName: doc.data().shopName || doc.data().name
      })) as Barber[];
      
      setBarbers(barbersData);
    });

    return () => unsubscribe();
  }, []);

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.userPhone?.includes(searchTerm) ||
      apt.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesBarber = barberFilter === 'all' || apt.barberId === barberFilter;

    return matchesSearch && matchesStatus && matchesBarber;
  });

  // Statistics
  const stats = {
    today: appointments.filter(apt => apt.date === new Date().toISOString().split('T')[0]).length,
    pending: appointments.filter(apt => apt.status === 'pending').length,
    confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
  };

  // Update appointment status
  const updateStatus = async (appointmentId: string, newStatus: string) => {
    if (actionLoading) return;
    
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          status: newStatus,
          adminEmail: user?.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Randevu durumu başarıyla güncellendi', 'success');
      } else {
        showToast(data.error || 'Güncelleme başarısız', 'error');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      showToast('Bir hata oluştu', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete appointment
  const deleteAppointment = async (appointmentId: string) => {
    if (actionLoading) return;
    
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/appointments?id=${appointmentId}&adminEmail=${user?.email}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Randevu başarıyla silindi', 'success');
        setIsModalOpen(false);
      } else {
        showToast(data.error || 'Silme işlemi başarısız', 'error');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showToast('Bir hata oluştu', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm action handlers
  const handleDeleteClick = (appointment: Appointment) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Randevuyu Sil',
      message: `${appointment.userName} adlı müşteriye ait randevuyu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      confirmText: 'Sil',
      variant: 'danger',
      onConfirm: () => {
        deleteAppointment(appointment.id);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleCancelClick = (appointment: Appointment) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Randevuyu İptal Et',
      message: `${appointment.userName} adlı müşterinin randevusunu iptal etmek istediğinize emin misiniz?`,
      confirmText: 'İptal Et',
      variant: 'danger',
      onConfirm: () => {
        updateStatus(appointment.id, 'cancelled');
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleConfirmClick = (appointment: Appointment) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Randevuyu Onayla',
      message: `${appointment.userName} adlı müşterinin randevusunu onaylamak istediğinize emin misiniz?`,
      confirmText: 'Onayla',
      variant: 'success',
      onConfirm: () => {
        updateStatus(appointment.id, 'confirmed');
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleCompleteClick = (appointment: Appointment) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Randevuyu Tamamla',
      message: `${appointment.userName} adlı müşterinin randevusunu tamamlandı olarak işaretlemek istediğinize emin misiniz?`,
      confirmText: 'Tamamla',
      variant: 'success',
      onConfirm: () => {
        updateStatus(appointment.id, 'completed');
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || '?';
  };

  // Get avatar color
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ToastContainer toasts={toasts} onClose={closeToast} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmVariant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
      
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Randevu Yönetimi
          </h1>
          <p className="text-gray-600">
            Tüm randevuları buradan takip edebilir ve yönetebilirsiniz
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            title="Bugünkü Randevular"
            value={stats.today}
            color="blue"
          />
          <StatCard
            icon={AlertCircle}
            title="Onay Bekleyen"
            value={stats.pending}
            color="orange"
          />
          <StatCard
            icon={CheckCircle}
            title="Onaylanmış"
            value={stats.confirmed}
            color="green"
          />
          <StatCard
            icon={XCircle}
            title="İptal Edilen"
            value={stats.cancelled}
            color="red"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Müşteri adı, telefon veya randevu ID ile ara..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Bekliyor</option>
              <option value="confirmed">Onaylandı</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal Edildi</option>
            </select>

            {/* Barber Filter */}
            <select
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
            >
              <option value="all">Tüm Berberler</option>
              {barbers.map(barber => (
                <option key={barber.id} value={barber.id}>
                  {barber.shopName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Calendar className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Randevu bulunamadı</p>
              <p className="text-sm">Arama kriterlerinizi değiştirerek tekrar deneyin</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Randevu ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Müşteri
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Berber
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hizmet
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih & Saat
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{appointment.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full ${getAvatarColor(appointment.userName)} flex items-center justify-center text-white font-medium text-sm mr-3`}>
                            {getInitials(appointment.userName)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.userName}
                            </div>
                            {appointment.userPhone && (
                              <div className="text-sm text-gray-500">
                                {appointment.userPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Scissors className="w-4 h-4 mr-2 text-gray-400" />
                          {appointment.barberName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{appointment.service}</div>
                        {appointment.serviceDuration && (
                          <div className="text-sm text-gray-500">{appointment.serviceDuration} dk</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 mb-1">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(appointment.date).toLocaleDateString('tr-TR')}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          {appointment.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <AppointmentActions
                          appointment={appointment}
                          onView={() => {
                            setSelectedAppointment(appointment);
                            setIsModalOpen(true);
                          }}
                          onConfirm={() => handleConfirmClick(appointment)}
                          onCancel={() => handleCancelClick(appointment)}
                          onComplete={() => handleCompleteClick(appointment)}
                          onDelete={() => handleDeleteClick(appointment)}
                          loading={actionLoading}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {isModalOpen && selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppointment(null);
          }}
          onConfirm={() => handleConfirmClick(selectedAppointment)}
          onCancel={() => handleCancelClick(selectedAppointment)}
          onComplete={() => handleCompleteClick(selectedAppointment)}
          onDelete={() => handleDeleteClick(selectedAppointment)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// Appointment Actions Component
interface AppointmentActionsProps {
  appointment: Appointment;
  onView: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onDelete: () => void;
  loading: boolean;
}

function AppointmentActions({
  appointment,
  onView,
  onConfirm,
  onCancel,
  onComplete,
  onDelete,
  loading,
}: AppointmentActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const canConfirm = appointment.status === 'pending';
  const canComplete = appointment.status === 'confirmed';
  const canCancel = appointment.status !== 'cancelled' && appointment.status !== 'completed';

  return (
    <div className="flex items-center justify-center space-x-1">
      {/* View Button */}
      <button
        onClick={onView}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Detayları Görüntüle"
      >
        <Eye className="w-4 h-4" />
      </button>

      {/* Quick Actions */}
      {canConfirm && (
        <button
          onClick={onConfirm}
          disabled={loading}
          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
          title="Onayla"
        >
          <CheckSquare className="w-4 h-4" />
        </button>
      )}

      {canComplete && (
        <button
          onClick={onComplete}
          disabled={loading}
          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
          title="Tamamla"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
      )}

      {canCancel && (
        <button
          onClick={onCancel}
          disabled={loading}
          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
          title="İptal Et"
        >
          <Ban className="w-4 h-4" />
        </button>
      )}

      {/* Delete Button */}
      <button
        onClick={onDelete}
        disabled={loading}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        title="Sil"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: any;
  title: string;
  value: number;
  color: 'blue' | 'orange' | 'green' | 'red';
}

function StatCard({ icon: Icon, title, value, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
      <Icon className="w-4 h-4 mr-1" />
      {config.label}
    </span>
  );
}

// Appointment Detail Modal Component
function AppointmentModal({ appointment, onClose, onConfirm, onCancel, onComplete, onDelete, loading }: any) {
  const canConfirm = appointment.status === 'pending';
  const canComplete = appointment.status === 'confirmed';
  const canCancel = appointment.status !== 'cancelled' && appointment.status !== 'completed';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">Randevu Detayları</h2>
            <StatusBadge status={appointment.status} />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Müşteri Bilgileri</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Ad Soyad</p>
                <p className="text-base font-medium text-gray-900">{appointment.userName}</p>
              </div>
              {appointment.userPhone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-base text-gray-900">{appointment.userPhone}</p>
                </div>
              )}
              {appointment.userEmail && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-base text-gray-900">{appointment.userEmail}</p>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Randevu Bilgileri</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Berber</p>
                <div className="flex items-center mt-1">
                  <Scissors className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-base font-medium text-gray-900">{appointment.barberName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hizmet</p>
                <p className="text-base font-medium text-gray-900">{appointment.service}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tarih</p>
                <div className="flex items-center mt-1">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-base font-medium text-gray-900">
                    {new Date(appointment.date).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Saat</p>
                <div className="flex items-center mt-1">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-base font-medium text-gray-900">{appointment.time}</p>
                </div>
              </div>
              {appointment.serviceDuration && (
                <div>
                  <p className="text-sm text-gray-600">Süre</p>
                  <p className="text-base font-medium text-gray-900">{appointment.serviceDuration} dakika</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Ücret</p>
                <p className="text-2xl font-bold text-gray-900">₺{appointment.price}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notlar</h3>
              <p className="text-gray-700">{appointment.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {canConfirm && (
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                <CheckSquare className="w-5 h-5" />
                <span>Onayla</span>
              </button>
            )}
            
            {canComplete && (
              <button
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Tamamlandı</span>
              </button>
            )}
            
            {canCancel && (
              <button
                onClick={() => {
                  onCancel();
                  onClose();
                }}
                disabled={loading}
                className="flex items-center justify-center space-x-2 border-2 border-orange-600 text-orange-600 py-3 rounded-xl hover:bg-orange-50 transition-colors font-medium disabled:opacity-50"
              >
                <Ban className="w-5 h-5" />
                <span>İptal Et</span>
              </button>
            )}
            
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              disabled={loading}
              className="flex items-center justify-center space-x-2 border-2 border-red-600 text-red-600 py-3 rounded-xl hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              <span>Randevuyu Sil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
