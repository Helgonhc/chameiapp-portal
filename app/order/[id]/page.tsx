'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, AlertCircle, Calendar, Clock, User, FileText, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface Ticket {
  id: string
  ticket_number: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  photos: string[]
  created_at: string
  updated_at: string
  resolved_at: string
  clients: {
    name: string
    email: string
    phone: string
  }
  equipments?: {
    name: string
    model: string
    serial_number: string
  }
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    loadTicket()
  }, [orderId])

  async function loadTicket() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          clients (
            name,
            email,
            phone
          ),
          equipments (
            name,
            model,
            serial_number
          )
        `)
        .eq('id', orderId)
        .maybeSingle()

      if (error) throw error
      
      if (!data) {
        alert('Chamado não encontrado')
        router.push('/tickets')
        return
      }

      setTicket(data)
    } catch (error) {
      console.error('Erro ao carregar chamado:', error)
      alert('Erro ao carregar chamado')
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      open: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-amber-100 text-amber-800 border-amber-300',
      resolved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      closed: 'bg-gray-100 text-gray-800 border-gray-300',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status: string) {
    const labels = {
      open: 'Aberto',
      in_progress: 'Em Andamento',
      resolved: 'Resolvido',
      closed: 'Fechado',
    }
    return labels[status as keyof typeof labels] || status
  }

  function getStatusIcon(status: string) {
    const icons = {
      open: <AlertCircle className="w-5 h-5" />,
      in_progress: <Clock className="w-5 h-5" />,
      resolved: <CheckCircle className="w-5 h-5" />,
      closed: <XCircle className="w-5 h-5" />,
    }
    return icons[status as keyof typeof icons]
  }

  function getPriorityColor(priority: string) {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  function getPriorityLabel(priority: string) {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
    }
    return labels[priority as keyof typeof labels] || priority
  }

  function getCategoryLabel(category: string) {
    const labels = {
      technical: 'Técnico',
      maintenance: 'Manutenção',
      support: 'Suporte',
      installation: 'Instalação',
      other: 'Outro',
    }
    return labels[category as keyof typeof labels] || category
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Carregando chamado...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-700">Chamado não encontrado</p>
            <button
              onClick={() => router.push('/tickets')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voltar
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 md:px-8 py-8 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.push('/tickets')}
              className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-blue-100 text-sm mb-1">{ticket.ticket_number}</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{ticket.title}</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 -mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status, Prioridade e Categoria */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {getStatusLabel(ticket.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Prioridade:</span>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                      {getPriorityLabel(ticket.priority)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Categoria:</span>
                    <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {getCategoryLabel(ticket.category)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Descrição do Problema
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Fotos */}
              {ticket.photos && ticket.photos.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    Fotos Anexadas ({ticket.photos.length})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {ticket.photos.map((photo, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedPhoto(photo)}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
                      >
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Lateral */}
            <div className="space-y-6">
              {/* Datas */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Datas
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Criado em</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(ticket.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                    <div>
                      <p className="text-sm text-gray-600">Última atualização</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(ticket.updated_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                  {ticket.resolved_at && (
                    <div>
                      <p className="text-sm text-gray-600">Resolvido em</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(ticket.resolved_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Equipamento */}
              {ticket.equipments && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipamento</h2>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Nome</p>
                      <p className="text-gray-900 font-medium">{ticket.equipments.name}</p>
                    </div>
                    {ticket.equipments.model && (
                      <div>
                        <p className="text-sm text-gray-600">Modelo</p>
                        <p className="text-gray-900 font-medium">{ticket.equipments.model}</p>
                      </div>
                    )}
                    {ticket.equipments.serial_number && (
                      <div>
                        <p className="text-sm text-gray-600">Número de Série</p>
                        <p className="text-gray-900 font-medium">{ticket.equipments.serial_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Foto */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl"
            >
              ×
            </button>
            <img
              src={selectedPhoto}
              alt="Foto ampliada"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
