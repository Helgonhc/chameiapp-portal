'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Wrench, Clock, CheckCircle, XCircle, Calendar, User, Plus } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import AdvancedSearch, { SearchFilters } from '@/components/AdvancedSearch'

interface ServiceOrder {
  id: string
  order_number: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  scheduled_at: string | null
  completed_at: string | null
  technician_id: string | null
  estimated_cost: number | null
  final_cost: number | null
  technician?: {
    full_name: string
  }
}

export default function ServiceOrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null)

  useEffect(() => {
    checkAuth()
    loadOrders()

    // Atualização em tempo real
    const channel = supabase
      .channel('service_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_orders'
        },
        () => {
          // Recarregar quando houver mudanças
          loadOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    applyFilters()
  }, [orders, filter, searchFilters])

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
        .select(`
          *,
          technician:profiles!service_orders_technician_id_fkey(full_name)
        `)
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
      setFilteredOrders(data || [])
    } catch (error) {
      console.error('Erro ao carregar ordens:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...orders]

    // Filtro de status básico (considera português e inglês)
    if (filter !== 'all') {
      filtered = filtered.filter(o => {
        if (filter === 'pending') return o.status === 'pending' || o.status === 'pendente'
        if (filter === 'in_progress') return o.status === 'in_progress' || o.status === 'em_andamento'
        if (filter === 'completed') return o.status === 'completed' || o.status === 'concluido' || o.status === 'concluida'
        return o.status === filter
      })
    }

    // Filtros avançados
    if (searchFilters) {
      // Busca por texto
      if (searchFilters.searchTerm) {
        const term = searchFilters.searchTerm.toLowerCase()
        filtered = filtered.filter(o =>
          o.title.toLowerCase().includes(term) ||
          o.order_number.toLowerCase().includes(term) ||
          o.description?.toLowerCase().includes(term)
        )
      }

      // Filtro de status avançado
      if (searchFilters.status) {
        filtered = filtered.filter(o => o.status === searchFilters.status)
      }

      // Filtro de prioridade
      if (searchFilters.priority) {
        filtered = filtered.filter(o => o.priority === searchFilters.priority)
      }

      // Filtro de data inicial
      if (searchFilters.dateFrom) {
        filtered = filtered.filter(o => 
          new Date(o.created_at) >= new Date(searchFilters.dateFrom!)
        )
      }

      // Filtro de data final
      if (searchFilters.dateTo) {
        filtered = filtered.filter(o => 
          new Date(o.created_at) <= new Date(searchFilters.dateTo!)
        )
      }

      // Filtro de valor mínimo
      if (searchFilters.minValue !== undefined) {
        filtered = filtered.filter(o => 
          o.final_cost && o.final_cost >= searchFilters.minValue!
        )
      }

      // Filtro de valor máximo
      if (searchFilters.maxValue !== undefined) {
        filtered = filtered.filter(o => 
          o.final_cost && o.final_cost <= searchFilters.maxValue!
        )
      }

      // Filtro de técnico
      if (searchFilters.technician) {
        const tech = searchFilters.technician.toLowerCase()
        filtered = filtered.filter(o =>
          o.technician?.full_name.toLowerCase().includes(tech)
        )
      }
    }

    setFilteredOrders(filtered)
  }

  function handleSearch(filters: SearchFilters) {
    setSearchFilters(filters)
    setFilter('all') // Reset basic filter when using advanced search
  }

  function handleClearSearch() {
    setSearchFilters(null)
    setFilter('all')
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      // Inglês
      pending: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      // Português (app mobile)
      pendente: 'bg-yellow-100 text-yellow-800',
      agendada: 'bg-blue-100 text-blue-800',
      em_andamento: 'bg-purple-100 text-purple-800',
      pausada: 'bg-orange-100 text-orange-800',
      concluido: 'bg-green-100 text-green-800',
      concluida: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800',
      cancelada: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      // Inglês
      pending: 'Pendente',
      scheduled: 'Agendada',
      in_progress: 'Em Andamento',
      paused: 'Pausada',
      completed: 'Concluída',
      cancelled: 'Cancelada',
      // Português (app mobile)
      pendente: 'Pendente',
      agendada: 'Agendada',
      em_andamento: 'Em Andamento',
      pausada: 'Pausada',
      concluido: 'Concluída',
      concluida: 'Concluída',
      cancelado: 'Cancelada',
      cancelada: 'Cancelada',
    }
    return labels[status] || status
  }



  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Carregando ordens...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0">
                  <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Ordens de Serviço</h1>
                  <p className="text-blue-100 text-sm sm:text-base md:text-lg mt-0.5 sm:mt-1">{orders.length} ordem{orders.length !== 1 ? 's' : ''} no total</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/new-order')}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 bg-white text-blue-600 rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Nova Ordem</span>
                <span className="sm:hidden">Nova</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 -mt-6 sm:-mt-8 pb-6 sm:pb-8">
          {/* Advanced Search */}
          <div className="mb-4 sm:mb-6">
            <AdvancedSearch
              type="orders"
              onSearch={handleSearch}
              onClear={handleClearSearch}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            {[
              { key: 'all', label: 'Todas', count: orders.length, icon: '📋' },
              { key: 'pending', label: 'Pendentes', count: orders.filter(o => o.status === 'pending' || o.status === 'pendente').length, icon: '⏳' },
              { key: 'in_progress', label: 'Em Andamento', count: orders.filter(o => o.status === 'in_progress' || o.status === 'em_andamento').length, icon: '🔧' },
              { key: 'completed', label: 'Concluídas', count: orders.filter(o => o.status === 'completed' || o.status === 'concluido' || o.status === 'concluida').length, icon: '✅' },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key as any)}
                className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-sm text-xs sm:text-sm md:text-base ${
                  filter === btn.key
                    ? 'bg-white text-blue-600 shadow-lg border-2 border-blue-200'
                    : 'bg-white text-gray-600 hover:bg-white hover:shadow-md border-2 border-transparent'
                }`}
              >
                <span className="mr-1 md:mr-2">{btn.icon}</span>
                <span className="hidden sm:inline">{btn.label} </span>
                <span className="sm:hidden">{btn.label.split(' ')[0]} </span>
                ({btn.count})
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:gap-6">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-10 sm:p-16 md:p-20 text-center">
                <div className="inline-flex p-4 sm:p-6 bg-blue-100 rounded-full mb-4 sm:mb-6">
                  <Wrench className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-700 mb-2 sm:mb-3">
                  Nenhuma ordem encontrada
                </p>
                <p className="text-sm sm:text-base text-gray-500">
                  {filter === 'all' 
                    ? 'Quando houver ordens, elas aparecerão aqui' 
                    : 'Nenhuma ordem com este status'}
                </p>
              </div>
            ) : (
              filteredOrders.map((order, index) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/service-orders/${order.id}`)}
                  className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-xs sm:text-sm text-gray-500">{order.order_number}</span>
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2 hover:text-blue-600 transition-colors">
                        {order.title}
                      </h3>
                      {order.description && (
                        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{order.description}</p>
                      )}
                    </div>
                    {order.final_cost && (
                      <div className="w-full sm:w-auto text-left sm:text-right bg-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Valor</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                          R$ {order.final_cost.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
                    {order.technician && (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{order.technician.full_name}</span>
                      </div>
                    )}
                    {order.scheduled_at && (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>
                          {new Date(order.scheduled_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    <div className="ml-auto text-xs sm:text-sm font-medium text-blue-600 whitespace-nowrap">
                      Ver detalhes →
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
