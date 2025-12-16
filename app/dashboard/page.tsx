'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, FileText, TrendingUp, Clock, CheckCircle2, AlertCircle, Zap, ArrowRight, Star } from 'lucide-react'
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
    const interval = setInterval(() => loadOrders(), 30000)
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
      aberto: 'from-amber-500 to-orange-500',
      em_analise: 'from-blue-500 to-cyan-500',
      aprovado: 'from-purple-500 to-pink-500',
      convertido: 'from-emerald-500 to-teal-500',
      rejeitado: 'from-red-500 to-rose-500',
    }
    return colors[status as keyof typeof colors] || 'from-gray-500 to-gray-600'
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
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <Zap className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm font-medium text-slate-600">Carregando seu dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Premium com Gradiente */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-12">
          {/* Efeitos de fundo */}
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 backdrop-blur-xl rounded-lg">
                <Star className="w-6 h-6 text-yellow-300" />
              </div>
              <h1 className="text-4xl font-bold text-white">Dashboard</h1>
            </div>
            <p className="text-blue-100 text-lg">Bem-vindo ao seu portal de atendimento premium</p>
          </div>
        </div>

        <div className="px-8 -mt-8 pb-8">
          {/* Stats Cards Premium com Animação */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { icon: TrendingUp, label: 'Total de Chamados', value: orders.length, color: 'from-blue-500 to-cyan-500', delay: '0ms' },
              { icon: Clock, label: 'Aguardando', value: pendingOrders, color: 'from-amber-500 to-orange-500', delay: '100ms' },
              { icon: AlertCircle, label: 'Em Progresso', value: inProgressOrders, color: 'from-purple-500 to-pink-500', delay: '200ms' },
              { icon: CheckCircle2, label: 'Concluídos', value: completedOrders, color: 'from-emerald-500 to-teal-500', delay: '300ms' },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  style={{ animationDelay: stat.delay }}
                  className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200/50 overflow-hidden animate-fade-in-up"
                >
                  {/* Efeito de brilho no hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  
                  {/* Círculo decorativo */}
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-50 rounded-full opacity-50"></div>
                  
                  <div className="relative">
                    <div className={`inline-flex p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 mb-2">{stat.label}</p>
                    <p className="text-4xl font-bold bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                  </div>
                  
                  {/* Indicador de mudança */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA Button Premium */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/new-order')}
              className="group relative w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-8 py-6 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 overflow-hidden"
            >
              {/* Efeito de brilho animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="relative flex items-center justify-center gap-4">
                <div className="p-2 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform duration-300">
                  <Plus className="w-7 h-7" />
                </div>
                <span>Abrir Novo Chamado</span>
                <Zap className="w-6 h-6 group-hover:scale-125 transition-transform duration-300" />
              </div>
            </button>
          </div>

          {/* Filters Premium */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="🔍 Buscar chamados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all group-hover:border-slate-300"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-300 cursor-pointer"
              >
                <option value="todos">📊 Todos os Status</option>
                <option value="aberto">🟡 Aberto</option>
                <option value="em_analise">🔵 Em Análise</option>
                <option value="aprovado">🟣 Aprovado</option>
                <option value="convertido">🟢 Convertido</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('todos')
                }}
                className="px-5 py-4 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
              >
                ✨ Limpar Filtros
              </button>
            </div>
          </div>

          {/* Orders Grid Premium */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOrders.slice(0, 8).map((order, index) => (
              <div
                key={order.id}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => router.push(`/order/${order.id}`)}
                className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-slate-200/50 hover:border-blue-300 overflow-hidden animate-fade-in-up"
              >
                {/* Efeito de brilho no hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getStatusColor(order.status)} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                {/* Badge de Status Premium */}
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getStatusColor(order.status)} shadow-lg`}>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                
                <div className="relative">
                  <h3 className="font-bold text-slate-900 text-xl mb-3 pr-32 group-hover:text-blue-600 transition-colors">
                    {order.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-6 leading-relaxed">
                    {order.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <FileText className="w-4 h-4 text-slate-600" />
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {order.priority === 'urgent' || order.priority === 'high' ? '🔴' : order.priority === 'medium' ? '🟡' : '🟢'}
                      </span>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 p-20 text-center">
              <div className="inline-flex p-6 bg-gradient-to-br from-slate-100 to-slate-50 rounded-full mb-6">
                <FileText className="w-16 h-16 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-700 mb-3">
                {orders.length === 0 ? 'Nenhum chamado encontrado' : 'Nenhum resultado'}
              </p>
              <p className="text-slate-500 mb-8">
                {orders.length === 0 ? 'Clique em "Abrir Novo Chamado" para começar' : 'Tente ajustar os filtros de busca'}
              </p>
              {orders.length === 0 && (
                <button
                  onClick={() => router.push('/new-order')}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Criar Primeiro Chamado
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
