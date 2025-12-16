'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Ticket, Plus, Clock, CheckCircle, XCircle, AlertCircle, User, Calendar } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface TicketData {
  id: string
  ticket_number: string
  title: string
  description: string
  priority: string
  status: string
  equipment_id: string | null
  created_at: string
  updated_at: string
  created_by: string
  rejection_reason: string | null
  converted_to_order_id: string | null
  creator?: {
    full_name: string
  }
}

export default function TicketsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [filter, setFilter] = useState<'all' | 'aberto' | 'em_analise' | 'aprovado' | 'rejeitado'>('all')
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>('media')
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
    loadTickets()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadTickets() {
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
        .select(`
          *,
          creator:profiles!tickets_created_by_fkey(full_name)
        `)
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Erro ao carregar chamados:', error)
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

      setShowModal(false)
      setTitle('')
      setDescription('')
      setPriority('media')
      loadTickets()
    } catch (error: any) {
      setError(error.message || 'Erro ao criar chamado')
    } finally {
      setCreating(false)
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      aberto: 'bg-blue-100 text-blue-800 border-blue-200',
      em_analise: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      aprovado: 'bg-green-100 text-green-800 border-green-200',
      rejeitado: 'bg-red-100 text-red-800 border-red-200',
      convertido: 'bg-purple-100 text-purple-800 border-purple-200',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  function getStatusLabel(status: string) {
    const labels = {
      aberto: 'Aberto',
      em_analise: 'Em Análise',
      aprovado: 'Aprovado',
      rejeitado: 'Rejeitado',
      convertido: 'Convertido em OS',
    }
    return labels[status as keyof typeof labels] || status
  }

  function getStatusIcon(status: string) {
    const icons = {
      aberto: <Clock className="w-5 h-5" />,
      em_analise: <AlertCircle className="w-5 h-5" />,
      aprovado: <CheckCircle className="w-5 h-5" />,
      rejeitado: <XCircle className="w-5 h-5" />,
      convertido: <CheckCircle className="w-5 h-5" />,
    }
    return icons[status as keyof typeof icons] || <Clock className="w-5 h-5" />
  }

  function getPriorityLabel(priority: string) {
    const labels = {
      baixa: '🟢 Baixa',
      media: '🟡 Média',
      alta: '🔴 Alta',
    }
    return labels[priority as keyof typeof labels] || priority
  }

  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filter)

  const openCount = tickets.filter(t => t.status === 'aberto').length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Carregando chamados...</p>
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
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Chamados</h1>
                  <p className="text-blue-100 text-lg mt-1">
                    {openCount > 0 ? `${openCount} chamado${openCount > 1 ? 's' : ''} aberto${openCount > 1 ? 's' : ''}` : 'Todos os seus chamados'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-4 bg-white text-blue-600 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Novo Chamado</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-8 pb-8">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              { key: 'all', label: 'Todos', count: tickets.length, icon: '📋' },
              { key: 'aberto', label: 'Abertos', count: tickets.filter(t => t.status === 'aberto').length, icon: '🔵' },
              { key: 'em_analise', label: 'Em Análise', count: tickets.filter(t => t.status === 'em_analise').length, icon: '🟡' },
              { key: 'aprovado', label: 'Aprovados', count: tickets.filter(t => t.status === 'aprovado').length, icon: '✅' },
              { key: 'rejeitado', label: 'Rejeitados', count: tickets.filter(t => t.status === 'rejeitado').length, icon: '❌' },
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
            {filteredTickets.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-20 text-center">
                <div className="inline-flex p-6 bg-blue-100 rounded-full mb-6">
                  <Ticket className="w-16 h-16 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-700 mb-3">
                  Nenhum chamado encontrado
                </p>
                <p className="text-gray-500 mb-8">
                  {filter === 'all' 
                    ? 'Crie seu primeiro chamado' 
                    : 'Nenhum chamado com este status'}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Novo Chamado
                </button>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-gray-500">{ticket.ticket_number}</span>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {getStatusLabel(ticket.status)}
                        </span>
                        <span className="text-sm font-medium">{getPriorityLabel(ticket.priority)}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {ticket.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{ticket.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
                    {ticket.creator && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>Aberto por: {ticket.creator.full_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')} às {new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {ticket.rejection_reason && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-red-900 mb-1">Motivo da Rejeição:</p>
                      <p className="text-sm text-red-800">{ticket.rejection_reason}</p>
                    </div>
                  )}

                  {ticket.converted_to_order_id && (
                    <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-purple-900">
                        ✓ Convertido em Ordem de Serviço
                      </p>
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
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Novo Chamado</h2>
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
                      <Plus className="w-5 h-5" />
                      Criar Chamado
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
