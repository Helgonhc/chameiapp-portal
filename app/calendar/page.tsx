'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Calendar from '@/components/Calendar'
import DashboardLayout from '@/components/DashboardLayout'
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react'

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
    // Converter ordens para eventos do calendário
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) return

      const { data, error } = await supabase
        .from('service_orders')
        .select('id, order_number, title, status, priority, scheduled_at, scheduled_end')
        .eq('client_id', profile.client_id)
        .order('scheduled_at', { ascending: true })

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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            </div>
            <p className="text-slate-600 font-medium">Carregando calendário...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Calendário</h1>
              <p className="text-sm sm:text-base text-slate-600">Visualize suas ordens de serviço por data</p>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtros</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Filtros</h3>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="scheduled">Agendada</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="completed">Concluída</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prioridade
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
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
          <div className="lg:col-span-2 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
              Legenda de Status
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-sm"></div>
                <span className="font-medium text-yellow-800">Pendente</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                <span className="font-medium text-blue-800">Agendada</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                <div className="w-3 h-3 bg-purple-500 rounded-full shadow-sm"></div>
                <span className="font-medium text-purple-800">Em Andamento</span>
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                <span className="font-medium text-green-800">Concluída</span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                <span className="font-medium text-red-800">Cancelada</span>
              </div>
            </div>
          </div>

          {/* Resumo Rápido */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-5 text-white">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Resumo
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="opacity-90">Total de Ordens:</span>
                <span className="font-bold text-lg">{events.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-90">Agendadas:</span>
                <span className="font-bold">{events.filter(e => e.status === 'scheduled').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-90">Em Andamento:</span>
                <span className="font-bold">{events.filter(e => e.status === 'in_progress').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendário */}
        <Calendar
          events={events}
          onSelectEvent={handleSelectEvent}
        />


      </div>
    </DashboardLayout>
  )
}
