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
  const [rescheduleModal, setRescheduleModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    const colors: Record<string, string> = {
      pendente: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
      pending: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
      confirmado: 'bg-success-500/20 text-success-400 border-success-500/30',
      confirmed: 'bg-success-500/20 text-success-400 border-success-500/30',
      reagendado: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
      rescheduled: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
      concluido: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      completed: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      cancelado: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
      cancelled: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
    }
    return colors[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pendente: 'Aguardando Confirmação',
      pending: 'Aguardando Confirmação',
      confirmado: 'Confirmado',
      confirmed: 'Confirmado',
      reagendado: 'Reagendado',
      rescheduled: 'Reagendado',
      concluido: 'Realizado',
      completed: 'Realizado',
      cancelado: 'Cancelado',
      cancelled: 'Cancelado',
    }
    return labels[status] || status
  }

  function getStatusIcon(status: string) {
    if (status === 'pendente' || status === 'pending') return <Clock className="w-4 h-4" />
    if (status === 'confirmado' || status === 'confirmed') return <CheckCircle className="w-4 h-4" />
    if (status === 'reagendado' || status === 'rescheduled') return <AlertCircle className="w-4 h-4" />
    if (status === 'concluido' || status === 'completed') return <CheckCircle className="w-4 h-4" />
    if (status === 'cancelado' || status === 'cancelled') return <XCircle className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  async function handleCancelAppointment(id: string) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return

    try {
      const { error } = await supabase
        .from('appointment_requests')
        .update({ status: 'cancelado', cancellation_reason: 'Cancelado pelo cliente' })
        .eq('id', id)

      if (error) throw error
      loadAppointments()
    } catch (error) {
      console.error('Erro ao cancelar:', error)
      alert('Erro ao cancelar agendamento')
    }
  }

  async function handleDeleteAppointment(id: string) {
    if (!confirm('Tem certeza que deseja EXCLUIR este agendamento? Esta ação não pode ser desfeita.')) return

    try {
      const { error } = await supabase
        .from('appointment_requests')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadAppointments()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir agendamento')
    }
  }

  async function handleConfirmAppointment(id: string) {
    if (!confirm('Deseja confirmar este agendamento para a data proposta?')) return

    try {
      const { error } = await supabase
        .from('appointment_requests')
        .update({ status: 'confirmed' })
        .eq('id', id)

      if (error) throw error
      alert('Agendamento confirmado com sucesso!')
      loadAppointments()
    } catch (error) {
      console.error('Erro ao confirmar:', error)
      alert('Erro ao confirmar agendamento')
    }
  }

  function handleReschedule(appointment: Appointment) {
    setSelectedAppointment(appointment)
    setNewDate(appointment.requested_date)
    setNewTime(appointment.requested_time_start)
    setRescheduleModal(true)
  }

  async function submitReschedule() {
    if (!selectedAppointment || !newDate || !newTime) return
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('appointment_requests')
        .update({
          requested_date: newDate,
          requested_time_start: newTime,
          status: 'pending',
          technician_notes: `Solicitado reagendamento pelo cliente para ${newDate} às ${newTime}`
        })
        .eq('id', selectedAppointment.id)

      if (error) throw error
      alert('Solicitação de reagendamento enviada!')
      setRescheduleModal(false)
      loadAppointments()
    } catch (error) {
      console.error('Erro ao reagendar:', error)
      alert('Erro ao enviar solicitação de reagendamento')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredAppointments = filter === 'all'
    ? appointments
    : filter === 'pending'
      ? appointments.filter(a => a.status === 'pending' || a.status === 'pendente')
      : appointments.filter(a => a.status === 'confirmed' || a.status === 'confirmado')

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400 font-medium">Carregando agendamentos...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="page-header">
          <div className="max-w-7xl mx-auto relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
                    <Calendar className="w-5 h-5 text-primary-400" />
                  </div>
                  <span className="text-primary-400 text-sm font-medium">Gestão</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">Agendamentos</h1>
                <p className="text-zinc-400">{appointments.length} agendamento{appointments.length !== 1 ? 's' : ''} no total</p>
              </div>

              <button
                onClick={() => router.push('/appointments/new')}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Novo Agendamento</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              { key: 'all', label: 'Todos', count: appointments.length },
              { key: 'pending', label: 'Pendentes', count: appointments.filter(a => a.status === 'pending' || a.status === 'pendente').length },
              { key: 'confirmed', label: 'Confirmados', count: appointments.filter(a => a.status === 'confirmed' || a.status === 'confirmado').length },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key as any)}
                className={`filter-btn ${filter === btn.key ? 'filter-btn-active' : 'filter-btn-inactive'}`}
              >
                {btn.label} ({btn.count})
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="empty-state">
                <div className="inline-flex p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 mb-6">
                  <Calendar className="w-12 h-12 text-primary-400" />
                </div>
                <p className="text-xl font-bold text-white mb-2">
                  Nenhum agendamento encontrado
                </p>
                <p className="text-zinc-500 mb-6">
                  {filter === 'all'
                    ? 'Crie seu primeiro agendamento'
                    : 'Nenhum agendamento com este status'}
                </p>
                <button
                  onClick={() => router.push('/appointments/new')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Novo Agendamento
                </button>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="list-item">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">
                          {appointment.service_type || 'Visita Técnica'}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {appointment.description && (
                    <p className="text-zinc-400 mb-4 text-sm">{appointment.description}</p>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-2 rounded-lg bg-white/5">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs">Data Solicitada</p>
                        <p className="font-medium text-white">
                          {new Date(appointment.requested_date).toLocaleDateString('pt-BR')} às {appointment.requested_time_start}
                        </p>
                      </div>
                    </div>

                    {appointment.confirmed_date && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-success-500/10">
                          <CheckCircle className="w-4 h-4 text-success-400" />
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs">Data Confirmada</p>
                          <p className="font-medium text-success-400">
                            {new Date(appointment.confirmed_date).toLocaleDateString('pt-BR')} às {appointment.confirmed_time_start}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {appointment.technician && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
                      <span>👤 Técnico: {appointment.technician.full_name}</span>
                    </div>
                  )}

                  {appointment.technician_notes && (
                    <div className="info-box info-box-blue mb-4">
                      <p className="text-sm font-semibold mb-1">Observações do Técnico:</p>
                      <p className="text-sm opacity-80">{appointment.technician_notes}</p>
                    </div>
                  )}

                  {appointment.cancellation_reason && (
                    <div className="info-box info-box-red mb-4">
                      <p className="text-sm font-semibold mb-1">Motivo do Cancelamento:</p>
                      <p className="text-sm opacity-80">{appointment.cancellation_reason}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    {(appointment.status === 'pendente' || appointment.status === 'pending') && (
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="px-4 py-2 bg-danger-500/10 text-danger-400 rounded-lg text-sm font-medium hover:bg-danger-500/20 transition-colors flex items-center gap-2 border border-danger-500/20"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}

                    {(appointment.status === 'pendente' || appointment.status === 'pending') && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmAppointment(appointment.id)}
                          className="px-4 py-2 bg-success-500/10 text-success-400 rounded-lg text-sm font-medium hover:bg-success-500/20 transition-colors flex items-center gap-2 border border-success-500/20"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleReschedule(appointment)}
                          className="px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg text-sm font-medium hover:bg-primary-500/20 transition-colors flex items-center gap-2 border border-primary-500/20"
                        >
                          <Clock className="w-4 h-4" />
                          Reagendar
                        </button>
                      </div>
                    )}

                    {(appointment.status === 'cancelado' || appointment.status === 'cancelled' ||
                      appointment.status === 'concluido' || appointment.status === 'completed') && (
                        <button
                          onClick={() => handleDeleteAppointment(appointment.id)}
                          className="px-4 py-2 bg-white/5 text-zinc-400 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/10"
                        >
                          🗑️ Excluir
                        </button>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="text-primary-400" />
                Reagendar Atendimento
              </h3>
              <p className="text-zinc-400 text-sm mt-1">
                Sugira uma nova data e horário para este serviço.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nova Data</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Novo Horário</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>

              <div className="p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
                <p className="text-xs text-primary-400">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Sua solicitação será enviada para nossa equipe técnica para validação.
                </p>
              </div>
            </div>

            <div className="p-6 bg-black/20 flex gap-3">
              <button
                onClick={() => setRescheduleModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitReschedule}
                disabled={submitting || !newDate || !newTime}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
