'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Wrench, Clock, CheckCircle, XCircle, Calendar, User, Plus } from 'lucide-react'
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Ordens de Serviço</h1>
                  <p className="text-blue-100 text-lg mt-1">{orders.length} ordem{orders.length !== 1 ? 's' : ''} no total</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/new-order')}
                className="px-6 py-4 bg-white text-blue-600 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nova Ordem</span>
                <span className="sm:hidden">Nova</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-8 pb-8">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              { key: 'all', label: 'Todas', count: orders.length, icon: '📋' },
              { key: 'pending', label: 'Pendentes', count: orders.filter(o => o.status === 'pending').length, icon: '⏳' },
              { key: 'in_progress', label: 'Em Andamento', count: orders.filter(o => o.status === 'in_progress').length, icon: '🔧' },
              { key: 'completed', label: 'Concluídas', count: orders.filter(o => o.status === 'completed').length, icon: '✅' },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key as any)}
                className={`px-4 md:px-5 py-3 rounded-xl font-semibold transition-all shadow-sm text-sm md:text-base ${
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

          <div className="grid gap-6">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-20 text-center">
                <div className="inline-flex p-6 bg-blue-100 rounded-full mb-6">
                  <Wrench className="w-16 h-16 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-700 mb-3">
                  Nenhuma ordem encontrada
                </p>
                <p className="text-gray-500">
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
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-gray-500">{order.order_number}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                        {order.title}
                      </h3>
                      {order.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{order.description}</p>
                      )}
                    </div>
                    {order.final_cost && (
                      <div className="text-right ml-4 bg-green-50 rounded-xl p-4">
                        <p className="text-xs text-gray-600 mb-1">Valor</p>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {order.final_cost.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
                    {order.technician && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{order.technician.full_name}</span>
                      </div>
                    )}
                    {order.scheduled_at && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(order.scheduled_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    <div className="ml-auto text-sm font-medium text-blue-600">
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
