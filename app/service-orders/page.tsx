'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Wrench, Clock, CheckCircle, XCircle, Calendar, User, Plus, ArrowRight } from 'lucide-react'
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
  technician?: { full_name: string }
}

export default function ServiceOrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null)

  useEffect(() => {
    checkAuth(); loadOrders()
    const channel = supabase.channel('service_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, () => loadOrders())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => { applyFilters() }, [orders, filter, searchFilters])

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
      const { data, error } = await supabase.from('service_orders')
        .select(`*, technician:profiles!service_orders_technician_id_fkey(full_name)`)
        .eq('client_id', profile.client_id).order('created_at', { ascending: false })
      if (error) throw error
      setOrders(data || []); setFilteredOrders(data || [])
    } catch (error) { console.error('Erro ao carregar ordens:', error) }
    finally { setLoading(false) }
  }

  function applyFilters() {
    let filtered = [...orders]
    if (filter !== 'all') {
      filtered = filtered.filter(o => {
        if (filter === 'pending') return o.status === 'pending' || o.status === 'pendente'
        if (filter === 'in_progress') return o.status === 'in_progress' || o.status === 'em_andamento'
        if (filter === 'completed') return o.status === 'completed' || o.status === 'concluido' || o.status === 'concluida'
        return o.status === filter
      })
    }
    if (searchFilters) {
      if (searchFilters.searchTerm) {
        const term = searchFilters.searchTerm.toLowerCase()
        filtered = filtered.filter(o => o.title.toLowerCase().includes(term) || o.order_number.toLowerCase().includes(term) || o.description?.toLowerCase().includes(term))
      }
      if (searchFilters.status) filtered = filtered.filter(o => o.status === searchFilters.status)
      if (searchFilters.priority) filtered = filtered.filter(o => o.priority === searchFilters.priority)
      if (searchFilters.dateFrom) filtered = filtered.filter(o => new Date(o.created_at) >= new Date(searchFilters.dateFrom!))
      if (searchFilters.dateTo) filtered = filtered.filter(o => new Date(o.created_at) <= new Date(searchFilters.dateTo!))
      if (searchFilters.minValue !== undefined) filtered = filtered.filter(o => o.final_cost && o.final_cost >= searchFilters.minValue!)
      if (searchFilters.maxValue !== undefined) filtered = filtered.filter(o => o.final_cost && o.final_cost <= searchFilters.maxValue!)
      if (searchFilters.technician) {
        const tech = searchFilters.technician.toLowerCase()
        filtered = filtered.filter(o => o.technician?.full_name.toLowerCase().includes(tech))
      }
    }
    setFilteredOrders(filtered)
  }

  function handleSearch(filters: SearchFilters) { setSearchFilters(filters); setFilter('all') }
  function handleClearSearch() { setSearchFilters(null); setFilter('all') }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-warning-500/20 text-warning-400 border-warning-500/30', pendente: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
      scheduled: 'bg-primary-500/20 text-primary-400 border-primary-500/30', agendada: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
      in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30', em_andamento: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      paused: 'bg-orange-500/20 text-orange-400 border-orange-500/30', pausada: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      completed: 'bg-success-500/20 text-success-400 border-success-500/30', concluido: 'bg-success-500/20 text-success-400 border-success-500/30', concluida: 'bg-success-500/20 text-success-400 border-success-500/30',
      cancelled: 'bg-danger-500/20 text-danger-400 border-danger-500/30', cancelado: 'bg-danger-500/20 text-danger-400 border-danger-500/30', cancelada: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
    }
    return colors[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: 'Pendente', pendente: 'Pendente', scheduled: 'Agendada', agendada: 'Agendada',
      in_progress: 'Em Andamento', em_andamento: 'Em Andamento', paused: 'Pausada', pausada: 'Pausada',
      completed: 'Concluída', concluido: 'Concluída', concluida: 'Concluída',
      cancelled: 'Cancelada', cancelado: 'Cancelada', cancelada: 'Cancelada',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400 font-medium">Carregando ordens...</p>
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
                    <Wrench className="w-5 h-5 text-primary-400" />
                  </div>
                  <span className="text-primary-400 text-sm font-medium">Serviços</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">Ordens de Serviço</h1>
                <p className="text-zinc-400">{orders.length} ordem{orders.length !== 1 ? 's' : ''} no total</p>
              </div>
              <button onClick={() => router.push('/new-order')} className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" /><span>Nova Ordem</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6"><AdvancedSearch type="orders" onSearch={handleSearch} onClear={handleClearSearch} /></div>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              { key: 'all', label: 'Todas', count: orders.length },
              { key: 'pending', label: 'Pendentes', count: orders.filter(o => o.status === 'pending' || o.status === 'pendente').length },
              { key: 'in_progress', label: 'Em Andamento', count: orders.filter(o => o.status === 'in_progress' || o.status === 'em_andamento').length },
              { key: 'completed', label: 'Concluídas', count: orders.filter(o => o.status === 'completed' || o.status === 'concluido' || o.status === 'concluida').length },
            ].map((btn) => (
              <button key={btn.key} onClick={() => setFilter(btn.key as any)} className={`filter-btn ${filter === btn.key ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
                {btn.label} ({btn.count})
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="empty-state">
                <div className="inline-flex p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 mb-6"><Wrench className="w-12 h-12 text-primary-400" /></div>
                <p className="text-xl font-bold text-white mb-2">Nenhuma ordem encontrada</p>
                <p className="text-zinc-500">{filter === 'all' ? 'Quando houver ordens, elas aparecerão aqui' : 'Nenhuma ordem com este status'}</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} onClick={() => router.push(`/service-orders/${order.id}`)} className="list-item cursor-pointer hover:border-primary-500/30">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-xs text-zinc-500">{order.order_number}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">{order.title}</h3>
                      {order.description && <p className="text-zinc-400 text-sm line-clamp-2">{order.description}</p>}
                    </div>
                    {order.final_cost && (
                      <div className="w-full sm:w-auto text-left sm:text-right bg-success-500/10 border border-success-500/20 rounded-xl p-3">
                        <p className="text-xs text-zinc-500 mb-0.5">Valor</p>
                        <p className="text-xl font-bold text-success-400">R$ {order.final_cost.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/5">
                    {order.technician && <div className="flex items-center gap-2 text-xs text-zinc-500"><User className="w-3.5 h-3.5" /><span>{order.technician.full_name}</span></div>}
                    {order.scheduled_at && <div className="flex items-center gap-2 text-xs text-zinc-500"><Calendar className="w-3.5 h-3.5" /><span>{new Date(order.scheduled_at).toLocaleDateString('pt-BR')}</span></div>}
                    <div className="ml-auto text-xs font-medium text-primary-400 flex items-center gap-1">Ver detalhes <ArrowRight className="w-3 h-3" /></div>
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
