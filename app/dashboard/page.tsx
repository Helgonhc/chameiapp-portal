'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import type { ServiceOrder } from '@/types'
import DashboardLayout from '@/components/DashboardLayout'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')

  useEffect(() => {
    loadOrders()
    
    const interval = setInterval(() => {
      loadOrders()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let filtered = [...orders]

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

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
        .from('tickets')
        .select('*')
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

  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const inProgressOrders = orders.filter(o => o.status === 'in_progress').length
  const completedOrders = orders.filter(o => o.status === 'completed').length

  function getStatusColor(status: string) {
    const colors = {
      aberto: 'bg-amber-50 text-amber-700 border-amber-200',
      em_analise: 'bg-blue-50 text-blue-700 border-blue-200',
      aprovado: 'bg-purple-50 text-purple-700 border-purple-200',
      convertido: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejeitado: 'bg-red-50 text-red-700 border-red-200',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  function getStatusLabel(status: string) {
    const labels = {
      aberto: 'Aberto',
      em_analise: 'Em Análise',
      aprovado: 'Aprovado',
      convertido: 'Convertido',
      rejeitado: 'Rejeitado',
    }
    return labels[status as keyof typeof labels] || status
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Bem-vindo ao seu portal de atendimento</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total de Chamados</p>
            <p className="text-3xl font-bold text-slate-900">{orders.length}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Aguardando</p>
            <p className="text-3xl font-bold text-slate-900">{pendingOrders}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Em Progresso</p>
            <p className="text-3xl font-bold text-slate-900">{inProgressOrders}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Concluídos</p>
            <p className="text-3xl font-bold text-slate-900">{completedOrders}</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/new-order')}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <Plus className="w-6 h-6" />
            <span className="text-lg">Abrir Novo Chamado</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar chamados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos os Status</option>
              <option value="aberto">Aberto</option>
              <option value="em_analise">Em Análise</option>
              <option value="aprovado">Aprovado</option>
              <option value="convertido">Convertido</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('todos')
              }}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.slice(0, 8).map((order) => (
            <div
              key={order.id}
              onClick={() => router.push(`/order/${order.id}`)}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-slate-200 hover:border-blue-300"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-slate-900 text-lg flex-1 pr-4">
                  {order.title}
                </h3>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium border ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                {order.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </span>
                <span className="text-lg">
                  {order.priority === 'urgent' || order.priority === 'high' ? '🔴' : order.priority === 'medium' ? '🟡' : '🟢'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 mb-2">
              {orders.length === 0 ? 'Nenhum chamado encontrado' : 'Nenhum resultado'}
            </p>
            <p className="text-sm text-slate-500">
              {orders.length === 0 ? 'Clique em "Abrir Novo Chamado" para começar' : 'Tente ajustar os filtros'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
