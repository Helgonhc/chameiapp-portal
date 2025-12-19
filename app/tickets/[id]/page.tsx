'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, User, Calendar, Image as ImageIcon, X as XIcon } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface TicketData {
  id: string
  ticket_number: string
  title: string
  description: string
  priority: string
  status: string
  created_at: string
  updated_at: string
  rejection_reason: string | null
  converted_to_order_id: string | null
  photos_url?: string[]
  creator?: { full_name: string }
}

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) loadTicket()
  }, [params.id])

  async function loadTicket() {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, creator:profiles!tickets_created_by_fkey(full_name)')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setTicket(data)
    } catch (error) {
      console.error('Erro ao carregar chamado:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      aberto: 'bg-blue-100 text-blue-800 border-blue-200',
      em_analise: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      aprovado: 'bg-green-100 text-green-800 border-green-200',
      rejeitado: 'bg-red-100 text-red-800 border-red-200',
      convertido: 'bg-purple-100 text-purple-800 border-purple-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      aberto: 'Aberto',
      em_analise: 'Em Análise',
      aprovado: 'Aprovado',
      rejeitado: 'Rejeitado',
      convertido: 'Convertido em OS',
    }
    return labels[status] || status
  }

  function getStatusIcon(status: string) {
    const icons: Record<string, JSX.Element> = {
      aberto: <Clock className="w-5 h-5" />,
      em_analise: <AlertCircle className="w-5 h-5" />,
      aprovado: <CheckCircle className="w-5 h-5" />,
      rejeitado: <XCircle className="w-5 h-5" />,
      convertido: <CheckCircle className="w-5 h-5" />,
    }
    return icons[status] || <Clock className="w-5 h-5" />
  }

  function getPriorityLabel(priority: string) {
    const labels: Record<string, string> = {
      baixa: '🟢 Baixa',
      media: '🟡 Média',
      alta: '🔴 Alta',
    }
    return labels[priority] || priority
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gray-50">
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
        <div className="flex flex-col items-center justify-center h-full bg-gray-50">
          <XCircle className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-xl font-bold text-gray-700 mb-2">Chamado não encontrado</p>
          <button onClick={() => router.push('/tickets')} className="text-blue-600 hover:underline">
            Voltar para chamados
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-8 py-6 sm:py-8 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <button onClick={() => router.push('/tickets')} className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-blue-200 text-sm font-mono">{ticket.ticket_number}</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{ticket.title}</h1>
              </div>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                {getStatusIcon(ticket.status)}
                {getStatusLabel(ticket.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Descrição</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Prioridade</h3>
                  <p className="text-gray-800 font-medium">{getPriorityLabel(ticket.priority)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Criado em</h3>
                  <p className="text-gray-800">{new Date(ticket.created_at).toLocaleDateString('pt-BR')} às {new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {ticket.creator && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">Aberto por</h3>
                    <p className="text-gray-800 flex items-center gap-1"><User className="w-4 h-4" /> {ticket.creator.full_name}</p>
                  </div>
                )}
              </div>

              {ticket.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Motivo da Rejeição</h3>
                  <p className="text-red-800">{ticket.rejection_reason}</p>
                </div>
              )}

              {ticket.converted_to_order_id && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-purple-900 font-semibold">✓ Este chamado foi convertido em Ordem de Serviço</p>
                </div>
              )}

              {ticket.photos_url && ticket.photos_url.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Fotos Anexadas ({ticket.photos_url.length})
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {ticket.photos_url.map((url, index) => (
                      <button key={index} onClick={() => setSelectedImage(url)} className="relative group overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors aspect-square">
                        <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-50" onClick={() => setSelectedImage(null)}>
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 bg-white text-gray-900 rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg z-10">
            <XIcon className="w-6 h-6" />
          </button>
          <img src={selectedImage} alt="Visualização" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </DashboardLayout>
  )
}
