'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Calendar from '@/components/Calendar'
import DashboardLayout from '@/components/DashboardLayout'
import { Calendar as CalendarIcon, Filter, X, Sparkles, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'

interface ServiceOrder {
  id: string
  order_number: string
  title: string
  status: string
  priority: string
  scheduled_at: string
  scheduled_end: string | null
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: string
  priority: string
  order_number: string
}

export default function CalendarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
  })

  useEffect(() => {
    checkAuth()
    loadOrders()
  }, [])

  useEffect(() => {
    const calendarEvents = orders
      .filter(order => order.scheduled_at)
      .filter(order => {
        if (filters.status !== 'all' && order.status !== filters.status) return false
        if (filters.priority !== 'all' && order.priority !== filters.priority) return false
        return true
      })
      .map(order => ({
        id: order.id,
        title: `${order.order_number} - ${order.title}`,
        start: new Date(order.scheduled_at),
        end: order.scheduled_end ? new Date(order.scheduled_end) : new Date(order.scheduled_at),
        status: order.status,
        priority: order.priority,
        order_number: order.order_number,
      }))
    setEvents(calendarEvents)
  }, [orders, filters])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single()
      if (!profile?.client_id) return
      const { data, error } = await supabase.from('service_orders').select('id, order_number, title, status, priority, scheduled_at, scheduled_end').eq('client_id', profile.client_id).order('scheduled_at', { ascending: true })
      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Erro ao carregar ordens:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectEvent(event: CalendarEvent) {
    router.push(`/service-orders/${event.id}`)
  }

  function handleClearFilters() {
    setFilters({ status: 'all', priority: 'all' })
  }

  const hasActiveFilters = filters.status !== 'all' || filters.priority !== 'all'

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 font-medium">Carregando calendário...</p>
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
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                    Calendário <Sparkles className="w-5 h-5 text-accent-400" />
                  </h1>
                  <p className="text-zinc-400">Visualize suas ordens de serviço por data</p>
                </div>
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
                {hasActiveFilters && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filtros */}
          {showFilters && (
            <div className="card p-6 mb-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Filtros</h3>
                {hasActiveFilters && (
                  <button onClick={handleClearFilters} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 font-medium">
                    <X className="w-4 h-4" /> Limpar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Status</label>
                  <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="form-input">
                    <option value="all">Todos</option>
                    <option value="pending">Pendente</option>
                    <option value="scheduled">Agendada</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="completed">Concluída</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Prioridade</label>
                  <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="form-input">
                    <option value="all">Todas</option>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Legenda e Estatísticas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Legenda */}
            <div className="lg:col-span-2 card p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full" />
                Legenda de Status
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2 bg-warning-500/10 px-3 py-2 rounded-lg border border-warning-500/20">
                  <div className="w-3 h-3 bg-warning-500 rounded-full shadow-sm shadow-warning-500/50" />
                  <span className="font-medium text-warning-400">Pendente</span>
                </div>
                <div className="flex items-center gap-2 bg-primary-500/10 px-3 py-2 rounded-lg border border-primary-500/20">
                  <div className="w-3 h-3 bg-primary-500 rounded-full shadow-sm shadow-primary-500/50" />
                  <span className="font-medium text-primary-400">Agendada</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/20">
                  <div className="w-3 h-3 bg-purple-500 rounded-full shadow-sm shadow-purple-500/50" />
                  <span className="font-medium text-purple-400">Em Andamento</span>
                </div>
                <div className="flex items-center gap-2 bg-success-500/10 px-3 py-2 rounded-lg border border-success-500/20">
                  <div className="w-3 h-3 bg-success-500 rounded-full shadow-sm shadow-success-500/50" />
                  <span className="font-medium text-success-400">Concluída</span>
                </div>
                <div className="flex items-center gap-2 bg-danger-500/10 px-3 py-2 rounded-lg border border-danger-500/20">
                  <div className="w-3 h-3 bg-danger-500 rounded-full shadow-sm shadow-danger-500/50" />
                  <span className="font-medium text-danger-400">Cancelada</span>
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="stat-card bg-gradient-to-br from-primary-500/20 to-accent-500/10">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary-400" />
                Resumo
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Total de Ordens:</span>
                  <span className="font-bold text-white text-lg">{events.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Agendadas:</span>
                  <span className="font-bold text-primary-400">{events.filter(e => e.status === 'scheduled').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Em Andamento:</span>
                  <span className="font-bold text-purple-400">{events.filter(e => e.status === 'in_progress').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Concluídas:</span>
                  <span className="font-bold text-success-400">{events.filter(e => e.status === 'completed').length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calendário */}
          <div className="card p-4 lg:p-6">
            <Calendar events={events} onSelectEvent={handleSelectEvent} />
          </div>
        </main>
      </div>
    </DashboardLayout>
  )
}
