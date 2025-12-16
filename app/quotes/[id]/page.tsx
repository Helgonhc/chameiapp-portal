'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, DollarSign, Calendar, CheckCircle, XCircle, Clock, FileText, Download, Package } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Quote {
  id: string
  quote_number: string
  title: string
  description: string
  status: string
  subtotal: number
  discount: number
  discount_type: string
  tax: number
  total: number
  valid_until: string
  notes: string
  terms: string
  created_at: string
  items: QuoteItem[]
  clients: {
    name: string
    email: string
    phone: string
  }
}

export default function QuoteDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string

  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    loadQuote()
  }, [quoteId])

  async function loadQuote() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          clients (
            name,
            email,
            phone
          ),
          quote_items (
            id,
            description,
            quantity,
            unit_price,
            total
          )
        `)
        .eq('id', quoteId)
        .maybeSingle()

      if (error) throw error
      
      if (!data) {
        alert('Orçamento não encontrado')
        router.push('/quotes')
        return
      }

      setQuote({
        ...data,
        items: data.quote_items || []
      })
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error)
      alert('Erro ao carregar orçamento')
    } finally {
      setLoading(false)
    }
  }

  async function handleResponse(approved: boolean) {
    if (!quote) return
    
    const action = approved ? 'aprovar' : 'rejeitar'
    if (!confirm(`Tem certeza que deseja ${action} este orçamento?`)) return

    try {
      setResponding(true)
      
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: approved ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId)

      if (error) throw error

      alert(`✅ Orçamento ${approved ? 'aprovado' : 'rejeitado'} com sucesso!`)
      loadQuote()
    } catch (error) {
      console.error('Erro ao responder orçamento:', error)
      alert('Erro ao processar resposta. Tente novamente.')
    } finally {
      setResponding(false)
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border-amber-300',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      expired: 'bg-gray-100 text-gray-800 border-gray-300',
      converted: 'bg-blue-100 text-blue-800 border-blue-300',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status: string) {
    const labels = {
      pending: 'Aguardando Resposta',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      expired: 'Expirado',
      converted: 'Convertido em Ordem',
    }
    return labels[status as keyof typeof labels] || status
  }

  function getStatusIcon(status: string) {
    const icons = {
      pending: <Clock className="w-5 h-5" />,
      approved: <CheckCircle className="w-5 h-5" />,
      rejected: <XCircle className="w-5 h-5" />,
      expired: <Clock className="w-5 h-5" />,
      converted: <FileText className="w-5 h-5" />,
    }
    return icons[status as keyof typeof icons]
  }

  function isExpired() {
    if (!quote) return false
    return new Date(quote.valid_until) < new Date()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Carregando orçamento...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!quote) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-700">Orçamento não encontrado</p>
            <button
              onClick={() => router.push('/quotes')}
              className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
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
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-4 sm:px-6 md:px-8 py-8 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.push('/quotes')}
              className="flex items-center gap-2 text-white hover:text-amber-100 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-amber-100 text-sm mb-1">{quote.quote_number}</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{quote.title}</h1>
              </div>
              <button
                onClick={() => alert('Função de download PDF será implementada')}
                className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 rounded-lg font-semibold hover:bg-amber-50 transition-all shadow-lg"
              >
                <Download className="w-5 h-5" />
                <span>Baixar PDF</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 -mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(quote.status)}`}>
                    {getStatusIcon(quote.status)}
                    {getStatusLabel(quote.status)}
                  </span>
                  {isExpired() && quote.status === 'pending' && (
                    <span className="text-sm text-red-600 font-medium">
                      ⚠️ Orçamento expirado
                    </span>
                  )}
                </div>
              </div>

              {/* Descrição */}
              {quote.description && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    Descrição
                  </h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{quote.description}</p>
                </div>
              )}

              {/* Itens do Orçamento */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  Itens ({quote.items.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Descrição</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Qtd</th>
                        <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Valor Unit.</th>
                        <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.items.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="py-3 px-2 text-sm text-gray-900">{item.description}</td>
                          <td className="py-3 px-2 text-sm text-gray-900 text-center">{item.quantity}</td>
                          <td className="py-3 px-2 text-sm text-gray-900 text-right">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}
                          </td>
                          <td className="py-3 px-2 text-sm font-medium text-gray-900 text-right">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totais */}
                <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.subtotal)}
                    </span>
                  </div>
                  {quote.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Desconto {quote.discount_type === 'percentage' ? `(${quote.discount}%)` : ''}:
                      </span>
                      <span className="font-medium text-green-600">
                        -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          quote.discount_type === 'percentage' 
                            ? (quote.subtotal * quote.discount / 100)
                            : quote.discount
                        )}
                      </span>
                    </div>
                  )}
                  {quote.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Impostos:</span>
                      <span className="font-medium text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.tax)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-amber-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {quote.notes && (
                <div className="bg-blue-50 rounded-xl shadow-lg p-6 border border-blue-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Observações</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}

              {/* Termos */}
              {quote.terms && (
                <div className="bg-gray-50 rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Termos e Condições</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.terms}</p>
                </div>
              )}
            </div>

            {/* Coluna Lateral */}
            <div className="space-y-6">
              {/* Ações */}
              {quote.status === 'pending' && !isExpired() && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações</h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleResponse(true)}
                      disabled={responding}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {responding ? 'Processando...' : 'Aprovar Orçamento'}
                    </button>
                    <button
                      onClick={() => handleResponse(false)}
                      disabled={responding}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      {responding ? 'Processando...' : 'Rejeitar Orçamento'}
                    </button>
                  </div>
                </div>
              )}

              {/* Datas */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  Datas
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Criado em</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(quote.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Válido até</p>
                    <p className={`font-medium ${isExpired() ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(quote.valid_until).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                      {isExpired() && ' (Expirado)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
