'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Wrench, Clock, CheckCircle, XCircle, Calendar, User } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

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
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')

  useEffect(() => {
    checkAuth()
    loadOrders()
  }, [])

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
    } catch (error) {
      console.error('Erro ao carregar ordens:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status: string) {
    const labels = {
      pending: 'Pendente',
      scheduled: 'Agendada',
      in_progress: 'Em Andamento',
      paused: 'Pausada',
      completed: 'Concluída',
      cancelled: 'Cancelada',
    }
    return labels[status as keyof typeof labels] || status
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <Wrench className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-600 font-medium">Carregando ordens...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header Premium */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-12 shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 backdrop-blur-xl rounded-lg">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Ordens de Serviço</h1>
            </div>
            <p className="text-blue-100 text-lg">{orders.length} ordem{orders.length !== 1 ? 's' : ''} no total</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-8 pb-8">
          {/* Filtros Premium */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 mb-6">
            {[
              { key: 'all', label: 'Todas', count: orders.length, icon: '📋' },
              { key: 'pending', label: 'Pendentes', count: orders.filter(o => o.status === 'pending').length, icon: '⏳' },
              { key: 'in_progress', label: 'Em Andamento', count: orders.filter(o => o.status === 'in_progress').length, icon: '🔧' },
              { key: 'completed', label: 'Concluídas', count: orders.filter(o => o.status === 'completed').length, icon: '✅' },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key as any)}
                className={`group px-4 md:px-5 py-3 rounded-xl font-semibold transition-all shadow-sm text-sm md:text-base ${
                  filter === btn.key
                    ? 'bg-white text-blue-600 shadow-lg border-2 border-blue-200 scale-105'
                    : 'bg-white/70 text-slate-600 hover:bg-white hover:shadow-md border-2 border-transparent'
                }`}
              >
                <span className="mr-1 md:mr-2">{btn.icon}</span>
                <span className="hidden sm:inline">{btn.label} </span>
                <span className="sm:hidden">{btn.label.split(' ')[0]} </span>
                ({btn.count})
              </button>
            ))}
          </div>

          {/* Lista de Ordens Premium */}
          <div className="grid gap-6">
            {filteredOrders.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-20 text-center">
                <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
                  <Wrench className="w-16 h-16 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-slate-700 mb-3">
                  Nenhuma ordem encontrada
                </p>
                <p className="text-slate-500">
                  {filter === 'all' 
                    ? 'Quando houver ordens, elas aparecerão aqui' 
                    : 'Nenhuma ordem com este status'}
                </p>
              </div>
            ) : (
              filteredOrders.map((order, index) => (
                <div
                  key={order.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => router.push(`/service-orders/${order.id}`)}
                  className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-slate-200/60 hover:border-blue-300 overflow-hidden animate-fade-in-up"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-slate-500">{order.order_number}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {order.title}
                      </h3>
                      {order.description && (
                        <p className="text-slate-600 text-sm line-clamp-2">{order.description}</p>
                      )}
                    </div>
                    {order.final_cost && (
                      <div className="text-right ml-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                        <p className="text-xs text-slate-600 mb-1">Valor</p>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {order.final_cost.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="relative flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                    {order.technician && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-4 h-4" />
                        <span>{order.technician.full_name}</span>
                      </div>
                    )}
                    {order.scheduled_at && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(order.scheduled_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    <div className="ml-auto text-sm font-medium text-blue-600 group-hover:text-blue-700">
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
