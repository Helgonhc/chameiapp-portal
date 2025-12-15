'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()} 
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Agendamentos</h1>
                <p className="text-sm text-slate-500">{appointments.length} agendamento{appointments.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/appointments/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Agendamento</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filtros */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'bg-white/60 text-slate-600 hover:bg-white'
            }`}
          >
            Todos ({appointments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'bg-white/60 text-slate-600 hover:bg-white'
            }`}
          >
            Pendentes ({appointments.filter(a => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              filter === 'confirmed'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'bg-white/60 text-slate-600 hover:bg-white'
            }`}
          >
            Confirmados ({appointments.filter(a => a.status === 'confirmed').length})
          </button>
        </div>

        {/* Lista */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-16 text-center">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700 mb-2">
                Nenhum agendamento encontrado
              </p>
              <p className="text-sm text-slate-500 mb-6">
                {filter === 'all' 
                  ? 'Crie seu primeiro agendamento' 
                  : 'Nenhum agendamento com este status'}
              </p>
              <button
                onClick={() => router.push('/appointments/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                Novo Agendamento
              </button>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-lg transition-all"
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
                      <h3 className="text-lg font-bold text-slate-900">
                        {appointment.service_type || 'Visita Técnica'}
                      </h3>
                    </div>
                  </div>
                </div>

                {appointment.description && (
                  <p className="text-slate-600 mb-4">{appointment.description}</p>
                )}

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Data Solicitada */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-500">Data Solicitada</p>
                      <p className="font-semibold text-slate-900">
                        {new Date(appointment.requested_date).toLocaleDateString('pt-BR')} às {appointment.requested_time_start}
                      </p>
                    </div>
                  </div>

                  {/* Data Confirmada */}
                  {appointment.confirmed_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-slate-500">Data Confirmada</p>
                        <p className="font-semibold text-green-600">
                          {new Date(appointment.confirmed_date).toLocaleDateString('pt-BR')} às {appointment.confirmed_time_start}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Técnico */}
                {appointment.technician && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                    <span>👤 Técnico: {appointment.technician.full_name}</span>
                  </div>
                )}

                {/* Notas do Técnico */}
                {appointment.technician_notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Observações do Técnico:</p>
                    <p className="text-sm text-blue-800">{appointment.technician_notes}</p>
                  </div>
                )}

                {/* Motivo do Cancelamento */}
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
      </main>
    </div>
  )
}
