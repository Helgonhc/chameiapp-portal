'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Wrench, Plus, Clock, CheckCircle, XCircle, AlertCircle, User, Calendar, Edit2, Trash2, Info } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface ServiceItem {
  id: string
  number: string
  title: string
  description: string
  priority: string
  status: string
  type: 'ticket' | 'order'
  created_at: string
  updated_at: string
  creator?: {
    full_name: string
  }
  technician?: {
    full_name: string
  }
  rejection_reason?: string | null
  final_cost?: number | null
}

export default function ServicesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [filter, setFilter] = useState<'all' | 'tickets' | 'orders'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingTicket, setEditingTicket] = useState<ServiceItem | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>('media')
  const [error, setError] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    checkAuth()
    loadServices()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadServices() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) return

      const [ticketsData, ordersData] = await Promise.all([
        supabase
          .from('tickets')
          .select(`
            *,
            creator:profiles!tickets_created_by_fkey(full_name)
          `)
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('service_orders')
          .select(`
            *,
            technician:profiles!service_orders_technician_id_fkey(full_name)
          `)
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: false })
      ])

      const tickets: ServiceItem[] = (ticketsData.data || []).map(t => ({
        id: t.id,
        number: t.ticket_number,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        type: 'ticket' as const,
        created_at: t.created_at,
        updated_at: t.updated_at,
        creator: t.creator,
        rejection_reason: t.rejection_reason
      }))

      const orders: ServiceItem[] = (ordersData.data || []).map(o => ({
        id: o.id,
        number: o.order_number,
        title: o.title,
        description: o.description,
        priority: o.priority,
        status: o.status,
        type: 'order' as const,
        created_at: o.created_at,
        updated_at: o.updated_at,
        technician: o.technician,
        final_cost: o.final_cost
      }))

      const allServices = [...tickets, ...orders].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setServices(allServices)
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) throw new Error('Cliente não encontrado')

      if (editingTicket) {
        const { error: updateError } = await supabase
          .from('tickets')
          .update({
            title: title.trim(),
            description: description.trim(),
            priority
          })
          .eq('id', editingTicket.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('tickets')
          .insert({
            client_id: profile.client_id,
            title: title.trim(),
            description: description.trim(),
            priority,
            status: 'aberto',
            created_by: user.id
          })

        if (insertError) throw insertError
      }

      setShowModal(false)
      setEditingTicket(null)
      setTitle('')
      setDescription('')
      setPriority('media')
      loadServices()
    } catch (error: any) {
      setError(error.message || 'Erro ao salvar chamado')
    } finally {
      setCreating(false)
    }
  }

  function handleEditTicket(service: ServiceItem) {
    if (service.type !== 'ticket' || service.status !== 'aberto') {
      alert('Apenas chamados abertos podem ser editados')
      return
    }
    setEditingTicket(service)
    setTitle(service.title)
    setDescription(service.description)
    setPriority(service.priority as 'baixa' | 'media' | 'alta')
    setShowModal(true)
  }

  async function handleDeleteTicket(service: ServiceItem) {
    if (service.type !== 'ticket') return
    if (service.status === 'convertido') {
      alert('Chamados convertidos em OS não podem ser excluídos')
      return
    }

    if (!confirm(`Deseja realmente excluir o chamado ${service.number}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', service.id)

      if (error) throw error
      loadServices()
    } catch (error: any) {
      console.error('Erro ao excluir chamado:', error)
      alert('Erro ao excluir chamado: ' + error.message)
    }
  }

  function getStatusColor(status: string, type: string) {
    if (type === 'ticket') {
      const colors = {
        aberto: 'bg-blue-100 text-blue-800 border-blue-200',
        em_analise: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        aprovado: 'bg-green-100 text-green-800 border-green-200',
        rejeitado: 'bg-red-100 text-red-800 border-red-200',
        convertido: 'bg-purple-100 text-purple-800 border-purple-200',
      }
      return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
    } else {
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
  }

  function getStatusLabel(status: string, type: string) {
    if (type === 'ticket') {
      const labels = {
        aberto: 'Chamado Aberto',
        em_analise: 'Em Análise',
        aprovado: 'Aprovado',
        rejeitado: 'Rejeitado',
        convertido: 'Em Execução',
      }
      return labels[status as keyof typeof labels] || status
    } else {
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
  }

  function getPriorityLabel(priority: string) {
    const labels = {
      baixa: '🟢 Baixa',
      low: '🟢 Baixa',
      media: '🟡 Média',
      medium: '🟡 Média',
      alta: '🔴 Alta',
      high: '🔴 Alta',
      urgent: '🔴 Urgente',
    }
    return labels[priority as keyof typeof labels] || priority
  }

  const filteredServices = services.filter(s => {
    if (filter === 'tickets' && s.type !== 'ticket') return false
    if (filter === 'orders' && s.type !== 'order') return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    return true
  })

  const ticketsCount = services.filter(s => s.type === 'ticket').length
  const ordersCount = services.filter(s => s.type === 'order').length
  const openTicketsCount = services.filter(s => s.type === 'ticket' && s.status === 'aberto').length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Carregando serviços...</p>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-4xl font-bold text-white">Meus Serviços</h1>
                    <button
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className="relative p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
                    >
                      <Info className="w-5 h-5 text-white" />
                      {showTooltip && (
                        <div className="absolute left-0 top-8 w-80 bg-white text-gray-800 p-4 rounded-xl shadow-2xl z-50 text-sm">
                          <p className="font-bold mb-2">Como funciona:</p>
                          <p className="mb-2">📋 <strong>Chamados:</strong> Você abre quando precisa de ajuda</p>
                          <p>🔧 <strong>Ordens de Serviço:</strong> Nossa equipe cria para executar o trabalho</p>
                        </div>
                      )}
                    </button>
                  </div>
                  <p className="text-blue-100 text-lg mt-1">
                    {openTicketsCount > 0 ? `${openTicketsCount} chamado${openTicketsCount > 1 ? 's' : ''} aguardando atendimento` : 'Acompanhe seus chamados e serviços'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingTicket(null)
                  setTitle('')
                  setDescription('')
                  setPriority('media')
                  setShowModal(true)
                }}
                className="px-6 py-4 bg-white text-blue-600 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Abrir Chamado</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-8 pb-8">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              { key: 'all', label: 'Todos', count: services.length, icon: '📋' },
              { key: 'tickets', label: 'Meus Chamados', count: ticketsCount, icon: '📝' },
              { key: 'orders', label: 'Em Execução', count: ordersCount, icon: '🔧' },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key as any)}
                className={`px-5 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                  filter === btn.key
                    ? 'bg-white text-blue-600 shadow-xl border-2 border-blue-200'
                    : 'bg-white text-gray-600 hover:shadow-xl border-2 border-transparent'
                }`}
              >
                <span className="mr-2">{btn.icon}</span>
                {btn.label} ({btn.count})
              </button>
            ))}
          </div>

          <div className="grid gap-6">
            {filteredServices.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-20 text-center">
                <div className="inline-flex p-6 bg-blue-100 rounded-full mb-6">
                  <Wrench className="w-16 h-16 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-700 mb-3">
                  Nenhum serviço encontrado
                </p>
                <p className="text-gray-500 mb-8">
                  Abra um chamado quando precisar de ajuda
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Abrir Chamado
                </button>
              </div>
            ) : (
              filteredServices.map((service) => (
                <div
                  key={`${service.type}-${service.id}`}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-sm text-gray-500">{service.number}</span>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status, service.type)}`}>
                          {getStatusLabel(service.status, service.type)}
                        </span>
                        <span className="text-sm font-medium">{getPriorityLabel(service.priority)}</span>
                        {service.type === 'ticket' && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded">
                            Chamado
                          </span>
                        )}
                        {service.type === 'order' && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded">
                            Ordem de Serviço
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{service.description}</p>
                    </div>
                    {service.final_cost && (
                      <div className="text-right ml-4 bg-green-50 rounded-xl p-4">
                        <p className="text-xs text-gray-600 mb-1">Valor</p>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {service.final_cost.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap items-center gap-4">
                      {service.creator && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>Aberto por: {service.creator.full_name}</span>
                        </div>
                      )}
                      {service.technician && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>Técnico: {service.technician.full_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(service.created_at).toLocaleDateString('pt-BR')} às {new Date(service.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {service.type === 'ticket' && service.status === 'aberto' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditTicket(service)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar chamado"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(service)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Excluir chamado"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  {service.rejection_reason && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-red-900 mb-1">Motivo da Rejeição:</p>
                      <p className="text-sm text-red-800">{service.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                {editingTicket ? <Edit2 className="w-6 h-6 text-blue-600" /> : <Plus className="w-6 h-6 text-blue-600" />}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTicket ? 'Editar Chamado' : 'Abrir Novo Chamado'}
              </h2>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Descreva brevemente o problema"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descrição *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o problema em detalhes..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prioridade
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'baixa', label: 'Baixa', icon: '🟢' },
                    { key: 'media', label: 'Média', icon: '🟡' },
                    { key: 'alta', label: 'Alta', icon: '🔴' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPriority(p.key as any)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        priority === p.key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{p.icon}</div>
                      <div className="text-xs font-bold text-gray-700">{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTicket(null)
                    setTitle('')
                    setDescription('')
                    setPriority('media')
                    setError('')
                  }}
                  disabled={creating}
                  className="flex-1 px-5 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      {editingTicket ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      {editingTicket ? 'Salvar Alterações' : 'Abrir Chamado'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
