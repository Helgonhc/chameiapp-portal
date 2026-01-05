'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface QuoteRequest {
  id: string
  request_number: string
  title: string
  description: string
  urgency: string
  status: string
  photos: string[]
  created_at: string
  updated_at: string
}

export default function QuoteRequestsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<QuoteRequest[]>([])

  useEffect(() => {
    checkAuth()
    loadRequests()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.client_id) return

      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      in_review: 'bg-blue-50 text-blue-700 border-blue-200',
      quoted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cancelled: 'bg-gray-50 text-gray-700 border-gray-200',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  function getStatusLabel(status: string) {
    const labels = {
      pending: 'Aguardando',
      in_review: 'Em Análise',
      quoted: 'Orçamento Enviado',
      cancelled: 'Cancelado',
    }
    return labels[status as keyof typeof labels] || status
  }

  function getStatusIcon(status: string) {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      in_review: <AlertCircle className="w-4 h-4" />,
      quoted: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    }
    return icons[status as keyof typeof icons] || <FileText className="w-4 h-4" />
  }

  function getUrgencyBadge(urgency: string) {
    if (urgency === 'urgent') {
      return (
        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
          🚨 URGENTE
        </span>
      )
    }
    return (
      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
        📅 Normal
      </span>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Carregando solicitações...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Minhas Solicitações</h1>
                <p className="text-amber-100 text-sm sm:text-base md:text-lg mt-0.5 sm:mt-1">
                  Acompanhe suas solicitações de orçamento
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 -mt-6 sm:-mt-8 pb-6 sm:pb-8">
          {requests.length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-10 sm:p-16 md:p-20 text-center">
              <div className="inline-flex p-4 sm:p-6 bg-amber-100 rounded-full mb-4 sm:mb-6">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-amber-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-700 mb-2 sm:mb-3">
                Nenhuma solicitação ainda
              </p>
              <p className="text-sm sm:text-base text-gray-500 mb-6">
                Suas solicitações de orçamento aparecerão aqui
              </p>
              <button
                onClick={() => router.push('/quotes')}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Solicitar Orçamento
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-200 hover:border-amber-300"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {request.request_number && (
                          <span className="text-xs sm:text-sm font-mono text-gray-500">
                            {request.request_number}
                          </span>
                        )}
                        {getUrgencyBadge(request.urgency)}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2">
                        {request.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {request.description}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium border ${getStatusColor(request.status)} whitespace-nowrap`}>
                      {getStatusIcon(request.status)}
                      {getStatusLabel(request.status)}
                    </span>
                  </div>

                  {request.photos && request.photos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">
                        📸 {request.photos.length} foto{request.photos.length > 1 ? 's' : ''} anexada{request.photos.length > 1 ? 's' : ''}
                      </p>
                      <div className="flex gap-2 overflow-x-auto">
                        {request.photos.slice(0, 3).map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                        ))}
                        {request.photos.length > 3 && (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-600 font-medium">
                              +{request.photos.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-4 border-t border-gray-100">
                    <div className="text-xs sm:text-sm text-gray-500">
                      Solicitado em {new Date(request.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {request.status === 'pending' && (
                      <span className="text-xs sm:text-sm font-medium text-blue-600">
                        {request.urgency === 'urgent' ? '⚡ Resposta em até 24h' : '📅 Resposta em até 48h'}
                      </span>
                    )}
                    {request.status === 'quoted' && (
                      <button
                        onClick={() => router.push('/quotes')}
                        className="text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Ver Orçamento →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
