'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Wrench, Clock, CheckCircle, XCircle, Calendar, User, DollarSign, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react'

interface ServiceOrder {
  id: string
  order_number: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  scheduled_at: string | null
  scheduled_end: string | null
  started_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  estimated_cost: number | null
  final_cost: number | null
  notes: string | null
  completion_notes: string | null
  cancellation_reason: string | null
  photos: string[] | null
  technician?: {
    full_name: string
    email: string
    phone: string
  }
  equipment?: {
    name: string
    brand: string
    model: string
    serial_number: string
  }
}

export default function ServiceOrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
    loadOrder()
  }, [orderId])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadOrder() {
    try {
      // Verificar autenticação e client_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuário não autenticado')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) {
        setError('Perfil de cliente não encontrado')
        return
      }

      // Buscar ordem de serviço
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          technician:profiles!service_orders_technician_id_fkey(full_name, email, phone),
          equipment:equipments(name, brand, model, serial_number)
        `)
        .eq('id', orderId)
        .eq('client_id', profile.client_id)
        .single()

      if (error) {
        console.error('Erro ao carregar ordem:', error)
        throw error
      }
      
      if (!data) {
        setError('Ordem de serviço não encontrada ou você não tem permissão para visualizá-la')
        return
      }

      setOrder(data)
    } catch (error: any) {
      console.error('Erro ao carregar ordem:', error)
      setError(error.message || 'Ordem de serviço não encontrada')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Erro</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/service-orders')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Voltar para Ordens de Serviço
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{order.order_number}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <p className="text-sm text-slate-500">{order.title}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Descrição */}
        {order.description && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Descrição</h2>
            <p className="text-slate-700 leading-relaxed">{order.description}</p>
          </div>
        )}

        {/* Informações Principais */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Técnico */}
          {order.technician && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Técnico Responsável</p>
                  <p className="font-bold text-slate-900">{order.technician.full_name}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>📧 {order.technician.email}</p>
                {order.technician.phone && <p>📱 {order.technician.phone}</p>}
              </div>
            </div>
          )}

          {/* Prioridade */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Prioridade</p>
                <p className="font-bold text-slate-900">
                  {order.priority === 'baixa' ? '🟢 Baixa' : 
                   order.priority === 'media' ? '🟡 Média' : 
                   order.priority === 'alta' ? '🟠 Alta' : '🔴 Urgente'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Equipamento */}
        {order.equipment && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Equipamento</p>
                <p className="font-bold text-slate-900">{order.equipment.name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              {order.equipment.brand && `${order.equipment.brand} - `}{order.equipment.model}
              {order.equipment.serial_number && ` (S/N: ${order.equipment.serial_number})`}
            </p>
          </div>
        )}



        {/* Timeline */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Linha do Tempo</h2>
          
          <div className="space-y-6">
            {/* Criada */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                {(order.scheduled_at || order.started_at || order.completed_at) && (
                  <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                )}
              </div>
              <div className="flex-1 pb-6">
                <p className="font-semibold text-slate-900">Ordem Criada</p>
                <p className="text-sm text-slate-500">
                  {new Date(order.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Agendada */}
            {order.scheduled_at && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  {(order.started_at || order.completed_at) && (
                    <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <p className="font-semibold text-slate-900">Agendada</p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.scheduled_at).toLocaleString('pt-BR')}
                  </p>
                  {order.scheduled_end && (
                    <p className="text-xs text-slate-400 mt-1">
                      Até {new Date(order.scheduled_end).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Iniciada */}
            {order.started_at && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-yellow-600" />
                  </div>
                  {order.completed_at && (
                    <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <p className="font-semibold text-slate-900">Iniciada</p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.started_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            )}

            {/* Concluída */}
            {order.completed_at && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Concluída</p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.completed_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            )}

            {/* Cancelada */}
            {order.cancelled_at && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">Cancelada</p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.cancelled_at).toLocaleString('pt-BR')}
                  </p>
                  {order.cancellation_reason && (
                    <p className="text-sm text-red-600 mt-2">
                      Motivo: {order.cancellation_reason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Valores */}
        {(order.estimated_cost || order.final_cost) && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Valores</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {order.estimated_cost && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Valor Estimado</p>
                  <p className="text-2xl font-bold text-slate-700">
                    R$ {order.estimated_cost.toFixed(2)}
                  </p>
                </div>
              )}
              
              {order.final_cost && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Valor Final</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {order.final_cost.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observações */}
        {order.notes && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Observações</h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Notas de Conclusão */}
        {order.completion_notes && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-green-900 mb-3">Notas de Conclusão</h2>
            <p className="text-green-800 leading-relaxed whitespace-pre-wrap">{order.completion_notes}</p>
          </div>
        )}

        {/* Fotos */}
        {order.photos && order.photos.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center gap-3 mb-4">
              <ImageIcon className="w-6 h-6 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">Fotos</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {order.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-48 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                  onClick={() => window.open(photo, '_blank')}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
