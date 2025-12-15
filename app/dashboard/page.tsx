'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogOut, Plus, FileText, Bell, TrendingUp, Clock, CheckCircle2, AlertCircle, DollarSign, User, History, Calendar } from 'lucide-react'
import type { ServiceOrder } from '@/types'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([])
  const [clientData, setClientData] = useState<any>(null)
  const [pendingQuotes, setPendingQuotes] = useState(0)
  const [newServiceOrders, setNewServiceOrders] = useState(0)
  
  const { unreadCount: unreadNotifications, requestNotificationPermission } = useRealtimeNotifications()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [priorityFilter, setPriorityFilter] = useState<string>('todos')

  useEffect(() => {
    checkAuth()
    loadOrders()
    loadPendingQuotes()
    loadNewServiceOrders()
    requestNotificationPermission()
    
    const interval = setInterval(() => {
      loadOrders()
      loadPendingQuotes()
      loadNewServiceOrders()
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

    if (priorityFilter !== 'todos') {
      filtered = filtered.filter(order => order.priority === priorityFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter, priorityFilter])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('id', user.id)
      .single()

    if (profile?.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', profile.client_id)
        .single()
      
      if (client) setClientData(client)
    }
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

  async function loadNewServiceOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) return

      // Contar OS criadas nas últimas 24 horas
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      const { count, error } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', profile.client_id)
        .gte('created_at', oneDayAgo.toISOString())

      if (error) throw error
      setNewServiceOrders(count || 0)
    } catch (error) {
      console.error('Erro ao carregar novas OS:', error)
    }
  }

  async function loadPendingQuotes() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) return

      const { count, error } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', profile.client_id)
        .eq('status', 'pending')

      if (error) throw error
      setPendingQuotes(count || 0)
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const pendingOrders = orders.filter(o => o.status === 'aberto' || o.status === 'em_analise').length
  const inProgressOrders = orders.filter(o => o.status === 'aprovado').length
  const completedOrders = orders.filter(o => o.status === 'convertido').length

  function clearFilters() {
    setSearchTerm('')
    setStatusFilter('todos')
    setPriorityFilter('todos')
  }

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Premium */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {(clientData?.client_logo_url || clientData?.logo_url) ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl blur opacity-20"></div>
                  <img
                    src={clientData.client_logo_url || clientData.logo_url}
                    alt={clientData.name}
                    className="relative h-12 w-12 object-contain rounded-xl bg-white p-1.5 shadow-sm"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              ) : (
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">{clientData?.name?.charAt(0) || 'C'}</span>
                </div>
              )}
              
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {clientData?.name || 'Portal do Cliente'}
                </h1>
                <p className="text-sm text-slate-500">
                  {clientData?.responsible_name || 'Bem-vindo'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/quotes')}
                className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200"
                title="Orçamentos"
              >
                <DollarSign className="w-5 h-5 text-slate-600" />
                {pendingQuotes > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                    {pendingQuotes > 9 ? '9+' : pendingQuotes}
                  </span>
                )}
              </button>

              <button
                onClick={() => router.push('/notifications')}
                className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200"
                title="Notificações"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              <button
                onClick={() => router.push('/profile')}
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200"
                title="Meu Perfil"
              >
                <User className="w-5 h-5 text-slate-600" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards Premium */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total de Chamados</p>
              <p className="text-3xl font-bold text-slate-900">{orders.length}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">Aguardando</p>
              <p className="text-3xl font-bold text-slate-900">{pendingOrders}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">Em Progresso</p>
              <p className="text-3xl font-bold text-slate-900">{inProgressOrders}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">Concluídos</p>
              <p className="text-3xl font-bold text-slate-900">{completedOrders}</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push('/new-order')}
            className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-5 rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-center gap-3">
              <Plus className="w-6 h-6" />
              <span className="text-lg">Abrir Novo Chamado</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/service-orders')}
            className="group relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-5 rounded-2xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
          >
            {newServiceOrders > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center animate-pulse shadow-lg z-10">
                {newServiceOrders > 9 ? '9+' : newServiceOrders}
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-center gap-3">
              <FileText className="w-6 h-6" />
              <span className="text-lg">Ver Ordens de Serviço</span>
              {newServiceOrders > 0 && (
                <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">
                  {newServiceOrders} nova{newServiceOrders !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => router.push('/history')}
            className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-5 rounded-2xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-center gap-3">
              <History className="w-6 h-6" />
              <span className="text-lg">Histórico</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/appointments')}
            className="group relative bg-gradient-to-r from-orange-600 to-amber-600 text-white px-8 py-5 rounded-2xl font-semibold hover:from-orange-700 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-center gap-3">
              <Calendar className="w-6 h-6" />
              <span className="text-lg">Agendamentos</span>
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar chamados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-11 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="todos">Todos os Status</option>
              <option value="aberto">Aberto</option>
              <option value="em_analise">Em Análise</option>
              <option value="aprovado">Aprovado</option>
              <option value="convertido">Convertido</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="todos">Todas as Prioridades</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
            <button
              onClick={clearFilters}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all"
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
              className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200/60 hover:border-blue-300"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-slate-900 text-lg flex-1 pr-4 group-hover:text-blue-600 transition-colors">
                  {order.title}
                </h3>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium border ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                {order.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className="text-lg">
                  {order.priority === 'alta' ? '🔴' : order.priority === 'media' ? '🟡' : '🟢'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-16 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 mb-2">
              {orders.length === 0 ? 'Nenhum chamado encontrado' : 'Nenhum resultado'}
            </p>
            <p className="text-sm text-slate-500">
              {orders.length === 0 ? 'Clique em "Abrir Novo Chamado" para começar' : 'Tente ajustar os filtros'}
            </p>
          </div>
        )}

        {filteredOrders.length > 8 && (
          <div className="text-center mt-8">
            <p className="text-sm text-slate-600 font-medium">
              Mostrando 8 de {filteredOrders.length} chamados
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
