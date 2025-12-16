'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle, Sparkles } from 'lucide-react'
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
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
              <Calendar className="w-6 h-6 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm font-medium text-slate-600">Carregando agendamentos...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Premium com Gradiente */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-12">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 backdrop-blur-xl rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white">Agendamentos</h1>
              </div>
              <p className="text-emerald-100 text-lg">{appointments.length} agendamento{appointments.length !== 1 ? 's' : ''} no total</p>
            </div>

            <button
              onClick={() => router.push('/appointments/new')}
              className="group relative px-6 py-4 bg-white text-emerald-600 rounded-2xl font-bold hover:shadow-2xl hover:shadow-white/50 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Novo Agendamento</span>
                <span className="sm:hidden">Novo</span>
              </div>
            </button>
          </div>
        </div>

        <div className="px-8 -mt-8 pb-8">
        {/* Filtros Premium */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Todos', count: appointments.length, icon: '📅' },
            { key: 'pending', label: 'Pendentes', count: appointments.filter(a => a.status === 'pending').length, icon: '⏳' },
            { key: 'confirmed', label: 'Confirmados', count: appointments.filter(a => a.status === 'confirmed').length, icon: '✅' },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key as any)}
              className={`group px-5 py-3 rounded-xl font-semibold transition-all whitespace-nowrap shadow-sm ${
                filter === btn.key
                  ? 'bg-white text-emerald-600 shadow-lg border-2 border-emerald-200 scale-105'
                  : 'bg-white/70 text-slate-600 hover:bg-white hover:shadow-md border-2 border-transparent'
              }`}
            >
              <span className="mr-2">{btn.icon}</span>
              {btn.label} ({btn.count})
            </button>
          ))}
        </div>

        {/* Lista Premium */}
        <div className="space-y-6">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-20 text-center">
              <div className="inline-flex p-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mb-6">
                <Calendar className="w-16 h-16 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-700 mb-3">
                Nenhum agendamento encontrado
              </p>
              <p className="text-slate-500 mb-8">
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
            filteredAppointments.map((appointment, index) => (
              <div
                key={appointment.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6 hover:shadow-2xl transition-all duration-500 hover:border-emerald-300 overflow-hidden animate-fade-in-up"
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
        </div>
      </div>
    </DashboardLayout>
  )
}
