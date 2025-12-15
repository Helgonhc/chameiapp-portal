'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Clock, User, AlertCircle, CheckCircle, Calendar, Wrench, Send, Trash2 } from 'lucide-react'

interface OrderDetails {
  id: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  opened_by_type: string
  equipment_id: string | null
  technician_id: string | null
  maintenance_type_id: string | null
  scheduled_at: string | null
  completed_at: string | null
  photos: string[] | null
  equipment?: {
    name: string
    brand: string
    model: string
    serial_number: string
  }
  technician?: {
    full_name: string
    email: string
  }
  maintenance_type?: {
    name: string
    description: string
    default_frequency: string
  }
}

interface Comment {
  id: string
  user_id: string
  comment: string
  created_at: string
  user?: {
    full_name: string
    role: string
  }
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
    loadOrder()
    loadComments()
  }, [orderId])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }

  async function loadOrder() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar ticket
      const { data: orderData, error: orderError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      // Buscar equipamento se tiver
      let equipment = null
      if (orderData.equipment_id) {
        const { data: equipData } = await supabase
          .from('equipments')
          .select('name, brand, model, serial_number')
          .eq('id', orderData.equipment_id)
          .single()
        equipment = equipData
      }

      // Buscar técnico se tiver
      let technician = null
      if (orderData.technician_id) {
        const { data: techData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', orderData.technician_id)
          .single()
        technician = techData
      }

      // Buscar tipo de manutenção se tiver
      let maintenanceType = null
      if (orderData.maintenance_type_id) {
        const { data: mtData } = await supabase
          .from('maintenance_types')
          .select('name, description, default_frequency')
          .eq('id', orderData.maintenance_type_id)
          .single()
        maintenanceType = mtData
      }

      setOrder({
        ...orderData,
        equipment,
        technician,
        maintenance_type: maintenanceType
      })
    } catch (error: any) {
      console.error('Erro ao carregar ordem:', error)
      setError('Erro ao carregar detalhes do chamado')
    } finally {
      setLoading(false)
    }
  }

  async function loadComments() {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          user:profiles(full_name, role)
        `)
        .eq('ticket_id', orderId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    }
  }

  async function handleSendComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    setSendingComment(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: orderId,
          user_id: user.id,
          comment: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      await loadComments()
    } catch (error: any) {
      console.error('Erro ao enviar comentário:', error)
      alert('Erro ao enviar comentário')
    } finally {
      setSendingComment(false)
    }
  }

  async function handleDeleteTicket() {
    if (!confirm('Tem certeza que deseja excluir este chamado? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Verificar se o chamado pertence ao cliente
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) throw new Error('Cliente não encontrado')

      // Deletar comentários primeiro
      await supabase
        .from('ticket_comments')
        .delete()
        .eq('ticket_id', orderId)

      // Deletar o ticket
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', orderId)
        .eq('client_id', profile.client_id)

      if (error) throw error

      alert('✅ Chamado excluído com sucesso!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Erro ao excluir chamado:', error)
      alert('Erro ao excluir chamado: ' + error.message)
    } finally {
      setDeleting(false)
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      aberto: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      em_analise: 'bg-blue-100 text-blue-800 border-blue-200',
      aprovado: 'bg-purple-100 text-purple-800 border-purple-200',
      convertido: 'bg-green-100 text-green-800 border-green-200',
      rejeitado: 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  function getStatusLabel(status: string) {
    const labels = {
      aberto: 'Aberto',
      em_analise: 'Em Análise',
      aprovado: 'Aprovado',
      convertido: 'Convertido em OS',
      rejeitado: 'Rejeitado',
    }
    return labels[status as keyof typeof labels] || status
  }

  function getPriorityColor(priority: string) {
    const colors = {
      baixa: 'text-green-600',
      media: 'text-yellow-600',
      alta: 'text-red-600',
    }
    return colors[priority as keyof typeof colors] || 'text-gray-600'
  }

  function getPriorityLabel(priority: string) {
    const labels = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
    }
    return labels[priority as keyof typeof labels] || priority
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600 mb-4">{error || 'Chamado não encontrado'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
            
            {/* Botão Excluir */}
            <button
              onClick={handleDeleteTicket}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? 'Excluindo...' : 'Excluir Chamado'}</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título e Status */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{order.title}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className="text-gray-600">{order.description}</p>
          </div>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Prioridade */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Prioridade</p>
                <p className={`text-lg font-semibold ${getPriorityColor(order.priority)}`}>
                  {getPriorityLabel(order.priority)}
                </p>
              </div>
            </div>
          </div>

          {/* Data de Abertura */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aberto em</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Técnico Responsável */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${order.technician ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <User className={`w-6 h-6 ${order.technician ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Técnico Responsável</p>
              {order.technician ? (
                <>
                  <p className="text-lg font-semibold text-gray-900">{order.technician.full_name}</p>
                  <p className="text-sm text-gray-500">{order.technician.email}</p>
                </>
              ) : (
                <p className="text-lg font-medium text-gray-500">Aguardando atribuição</p>
              )}
            </div>
          </div>
        </div>

        {/* Tipo de Manutenção */}
        {order.maintenance_type && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-100">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo de Manutenção</p>
                <p className="text-lg font-semibold text-gray-900">{order.maintenance_type.name}</p>
                {order.maintenance_type.description && (
                  <p className="text-sm text-gray-500">{order.maintenance_type.description}</p>
                )}
                {order.maintenance_type.default_frequency && (
                  <p className="text-xs text-gray-400 mt-1">
                    Frequência: {order.maintenance_type.default_frequency}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Equipamento */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${order.equipment ? 'bg-purple-100' : 'bg-gray-100'}`}>
              <Wrench className={`w-6 h-6 ${order.equipment ? 'text-purple-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Equipamento</p>
              {order.equipment ? (
                <>
                  <p className="text-lg font-semibold text-gray-900">{order.equipment.name}</p>
                  <p className="text-sm text-gray-500">
                    {order.equipment.brand && `${order.equipment.brand} - `}{order.equipment.model}
                    {order.equipment.serial_number && ` (S/N: ${order.equipment.serial_number})`}
                  </p>
                </>
              ) : (
                <p className="text-lg font-medium text-gray-500">Nenhum equipamento específico</p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico</h2>
          <div className="space-y-4">
            {/* Criado */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
              </div>
              <div className="pb-4">
                <p className="font-medium text-gray-900">Chamado Aberto</p>
                <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Aberto por {order.opened_by_type === 'client' ? 'você' : 'técnico'}
                </p>
              </div>
            </div>

            {/* Atribuído */}
            {order.technician ? (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  {order.status !== 'pendente' && <div className="w-0.5 h-full bg-gray-200 mt-2"></div>}
                </div>
                <div className="pb-4">
                  <p className="font-medium text-gray-900">Técnico Atribuído</p>
                  <p className="text-sm text-gray-600 mt-1">{order.technician.full_name}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="pb-4">
                  <p className="font-medium text-gray-900">Aguardando Atribuição</p>
                  <p className="text-sm text-gray-600 mt-1">Um técnico será atribuído em breve</p>
                </div>
              </div>
            )}

            {/* Em Andamento */}
            {(order.status === 'em_andamento' || order.status === 'concluido') && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-yellow-600" />
                  </div>
                  {order.status === 'concluido' && <div className="w-0.5 h-full bg-gray-200 mt-2"></div>}
                </div>
                <div className="pb-4">
                  <p className="font-medium text-gray-900">Em Andamento</p>
                  <p className="text-sm text-gray-600 mt-1">Técnico está trabalhando no chamado</p>
                </div>
              </div>
            )}

            {/* Concluído */}
            {order.status === 'concluido' && order.completed_at && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Concluído</p>
                  <p className="text-sm text-gray-500">{formatDate(order.completed_at)}</p>
                  <p className="text-sm text-gray-600 mt-1">Chamado finalizado com sucesso</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fotos */}
        {order.photos && order.photos.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fotos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {order.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(photo, '_blank')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Comentários */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Comentários</h2>
          
          {/* Lista de Comentários */}
          <div className="space-y-4 mb-6">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum comentário ainda</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {comment.user?.full_name || 'Usuário'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      comment.user?.role === 'client' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {comment.user?.role === 'client' ? 'Cliente' : 'Técnico'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.comment}</p>
                </div>
              ))
            )}
          </div>

          {/* Formulário de Novo Comentário */}
          <form onSubmit={handleSendComment} className="border-t pt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              type="submit"
              disabled={sendingComment || !newComment.trim()}
              className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sendingComment ? 'Enviando...' : 'Enviar Comentário'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
