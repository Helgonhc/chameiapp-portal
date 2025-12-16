'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface Appointment {
  id: string
  requested_date: string
  requested_time_start: string
  requested_time_end: string | null
  service_type: string | null
  description: string | null
  priority: string
  status: string
  confirmed_date: string | null
  confirmed_time_start: string | null
  confirmed_time_end: string | null
  technician_notes: string | null
  cancellation_reason: string | null
  created_at: string
  technician?: {
    full_name: string
  }
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all')

  useEffect(() => {
    checkAuth()
    loadAppointments()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadAppointments() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('appointment_requests')
        .select(`
          *,
          technician:profiles!appointment_requests_technician_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      rescheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  function getStatusLabel(status: string) {
    const labels = {
      pending: 'Aguardando Confirmação',
      confirmed: 'Confirmado',
      rescheduled: 'Reagendado',
      completed: 'Realizado',
      cancelled: 'Cancelado',
    }
    return labels[status as keyof typeof labels] || status
  }

  function getStatusIcon(status: string) {
    const icons = {
      pending: <Clock className="w-5 h-5" />,
      confirmed: <CheckCircle className="w-5 h-5" />,
      rescheduled: <AlertCircle className="w-5 h-5" />,
      completed: <CheckCircle className="w-5 h-5" />,
      cancelled: <XCircle className="w-5 h-5" />,
    }
    return icons[status as keyof typeof icons] || <Clock className="w-5 h-5" />
  }

  const filteredAppointments = filter === 'all' 
    ? appointments 
    : appointments.filter(a => a.status === filter)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Carregando agendamentos...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-12 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Agendamentos</h1>
                  <p className="text-emerald-100 text-lg mt-1">{appointments.length} agendamento{appointments.length !== 1 ? 's' : ''} no total</p>
                </div>
              </div>

              <button
                onClick={() => router.push('/appointments/new')}
                className="px-6 py-4 bg-white text-emerald-600 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Novo Agendamento</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-8 pb-8">
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'Todos', count: appointments.length, icon: '📅' },
              { key: 'pending', label: 'Pendentes', count: appointments.filter(a => a.status === 'pending').length, icon: '⏳' },
              { key: 'confirmed', label: 'Confirmados', count: appointments.filter(a => a.status === 'confirmed').length, icon: '✅' },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key as any)}
                className={`px-5 py-3 rounded-xl font-semibold transition-all whitespace-nowrap shadow-sm ${
                  filter === btn.key
                    ? 'bg-white text-emerald-600 shadow-lg border-2 border-emerald-200'
                    : 'bg-white text-gray-600 hover:bg-white hover:shadow-md border-2 border-transparent'
                }`}
              >
                <span className="mr-2">{btn.icon}</span>
                {btn.label} ({btn.count})
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-20 text-center">
                <div className="inline-flex p-6 bg-emerald-100 rounded-full mb-6">
                  <Calendar className="w-16 h-16 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-700 mb-3">
                  Nenhum agendamento encontrado
                </p>
                <p className="text-gray-500 mb-8">
                  {filter === 'all' 
                    ? 'Crie seu primeiro agendamento' 
                    : 'Nenhum agendamento com este status'}
                </p>
                <button
                  onClick={() => router.push('/appointments/new')}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Novo Agendamento
                </button>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-2xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {appointment.service_type || 'Visita Técnica'}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {appointment.description && (
                    <p className="text-gray-600 mb-4">{appointment.description}</p>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Data Solicitada</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(appointment.requested_date).toLocaleDateString('pt-BR')} às {appointment.requested_time_start}
                        </p>
                      </div>
                    </div>

                    {appointment.confirmed_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-gray-500">Data Confirmada</p>
                          <p className="font-semibold text-green-600">
                            {new Date(appointment.confirmed_date).toLocaleDateString('pt-BR')} às {appointment.confirmed_time_start}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {appointment.technician && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <span>👤 Técnico: {appointment.technician.full_name}</span>
                    </div>
                  )}

                  {appointment.technician_notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Observações do Técnico:</p>
                      <p className="text-sm text-blue-800">{appointment.technician_notes}</p>
                    </div>
                  )}

                  {appointment.cancellation_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-red-900 mb-1">Motivo do Cancelamento:</p>
                      <p className="text-sm text-red-800">{appointment.cancellation_reason}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
