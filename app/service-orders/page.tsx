'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Wrench, Clock, CheckCircle, XCircle, Calendar, User, Filter } from 'lucide-react'

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

      // Buscar client_id do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) {
        console.error('Client ID não encontrado')
        return
      }

      // Buscar ordens de serviço do cliente
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
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
      paused: 'bg-orange-100 text-orange-800 border-orange-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
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

  function getStatusIcon(status: string) {
    const icons = {
      pending: <Clock className="w-5 h-5" />,
      scheduled: <Calendar className="w-5 h-5" />,
      in_progress: <Wrench className="w-5 h-5" />,
      paused: <Clock className="w-5 h-5" />,
      completed: <CheckCircle className="w-5 h-5" />,
      cancelled: <XCircle className="w-5 h-5" />,
    }
    return icons[status as keyof typeof icons] || <Wrench className="w-5 h-5" />
  }

  function getPriorityColor(priority: string) {
    const colors = {
      baixa: 'text-green-600',
      media: 'text-yellow-600',
      alta: 'text-orange-600',
      urgente: 'text-red-600',
    }
    return colors[priority as keyof typeof colors] || 'text-gray-600'
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Premium */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()} 
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Ordens de Serviço</h1>
                <p className="text-sm text-slate-500">{orders.length} ordem{orders.length !== 1 ? 's' : ''} no total</p>
              </div>
            </div>
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
            Todas ({orders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'bg-white/60 text-slate-600 hover:bg-white'
            }`}
          >
            Pendentes ({orders.filter(o => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              filter === 'in_progress'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'bg-white/60 text-slate-600 hover:bg-white'
            }`}
          >
            Em Andamento ({orders.filter(o => o.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              filter === 'completed'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'bg-white/60 text-slate-600 hover:bg-white'
            }`}
          >
            Concluídas ({orders.filter(o => o.status === 'completed').length})
          </button>
        </div>

        {/* Lista de Ordens */}
        <div className="grid gap-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-16 text-center">
              <Wrench className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700 mb-2">
                Nenhuma ordem de serviço encontrada
              </p>
              <p className="text-sm text-slate-500">
                {filter === 'all' 
                  ? 'Quando houver ordens de serviço, elas aparecerão aqui' 
                  : 'Nenhuma ordem com este status'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/service-orders/${order.id}`)}
                className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">{order.order_number}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {order.title}
                      </h3>
                    </div>
                  </div>

                  {order.final_cost && (
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Valor</p>
                      <p className="text-xl font-bold text-green-600">
                        R$ {order.final_cost.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {order.description && (
                  <p className="text-slate-600 mb-4 line-clamp-2">{order.description}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-4">
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
                          {new Date(order.scheduled_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={`text-sm font-semibold ${getPriorityColor(order.priority)}`}>
                    {order.priority === 'baixa' ? '🟢 Baixa' : 
                     order.priority === 'media' ? '🟡 Média' : 
                     order.priority === 'alta' ? '🟠 Alta' : '🔴 Urgente'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
