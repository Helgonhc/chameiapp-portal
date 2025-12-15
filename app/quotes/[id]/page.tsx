'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, DollarSign, FileText, Calendar, CheckCircle, XCircle, AlertCircle, Download, MessageSquare } from 'lucide-react'

interface QuoteItem {
  id: string
  item_type: string
  name: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface QuoteDetails {
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
}

export default function QuoteDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string

  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState<QuoteDetails | null>(null)
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
    loadQuote()
  }, [quoteId])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadQuote() {
    try {
      setLoading(true)
      
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      if (quoteError) throw quoteError

      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('sort_order')

      if (itemsError) throw itemsError

      setQuote({
        ...quoteData,
        items: itemsData || []
      })
    } catch (error: any) {
      console.error('Erro ao carregar orçamento:', error)
      setError('Erro ao carregar orçamento')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!confirm('Tem certeza que deseja aprovar este orçamento?')) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', quoteId)

      if (error) throw error

      alert('✅ Orçamento aprovado com sucesso! Nossa equipe entrará em contato em breve.')
      await loadQuote()
    } catch (error: any) {
      console.error('Erro ao aprovar:', error)
      alert('Erro ao aprovar orçamento')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição')
      return
    }

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason.trim()
        })
        .eq('id', quoteId)

      if (error) throw error

      alert('Orçamento rejeitado. Obrigado pelo feedback!')
      setShowRejectModal(false)
      await loadQuote()
    } catch (error: any) {
      console.error('Erro ao rejeitar:', error)
      alert('Erro ao rejeitar orçamento')
    } finally {
      setProcessing(false)
    }
  }

  function getItemTypeLabel(type: string) {
    const labels = {
      service: 'Serviço',
      material: 'Material',
      labor: 'Mão de Obra'
    }
    return labels[type as keyof typeof labels] || type
  }

  function getItemTypeColor(type: string) {
    const colors = {
      service: 'bg-blue-100 text-blue-700',
      material: 'bg-purple-100 text-purple-700',
      labor: 'bg-amber-100 text-amber-700'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  function isExpired() {
    return quote && new Date(quote.valid_until) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 max-w-md text-center border border-slate-200/60">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Erro</h2>
          <p className="text-slate-600 mb-4">{error || 'Orçamento não encontrado'}</p>
          <button
            onClick={() => router.push('/quotes')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Voltar aos Orçamentos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Premium */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Cabeçalho do Orçamento */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-mono text-slate-500 mb-2">{quote.quote_number}</p>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{quote.title}</h1>
              {quote.description && (
                <p className="text-slate-600">{quote.description}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">Válido até</p>
              <p className="text-lg font-semibold text-slate-900">
                {new Date(quote.valid_until).toLocaleDateString('pt-BR')}
              </p>
              {isExpired() && (
                <span className="inline-block mt-2 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                  Expirado
                </span>
              )}
            </div>
          </div>

          {/* Status */}
          {quote.status !== 'pending' && (
            <div className={`p-4 rounded-xl border-l-4 ${
              quote.status === 'approved' 
                ? 'bg-emerald-50 border-emerald-500' 
                : 'bg-red-50 border-red-500'
            }`}>
              <div className="flex items-center gap-3">
                {quote.status === 'approved' ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p className={`font-semibold ${
                    quote.status === 'approved' ? 'text-emerald-900' : 'text-red-900'
                  }`}>
                    {quote.status === 'approved' ? 'Orçamento Aprovado' : 'Orçamento Rejeitado'}
                  </p>
                  <p className={`text-sm ${
                    quote.status === 'approved' ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {quote.status === 'approved' 
                      ? 'Nossa equipe entrará em contato em breve para dar continuidade'
                      : quote.rejection_reason || 'Obrigado pelo feedback'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Itens do Orçamento */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-8 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Itens do Orçamento</h2>
          
          <div className="space-y-4">
            {quote.items.map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{item.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getItemTypeColor(item.item_type)}`}>
                        {getItemTypeLabel(item.item_type)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-slate-600">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-slate-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(item.total)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>Qtd: {item.quantity}</span>
                  <span>•</span>
                  <span>
                    Valor unitário: {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(item.unit_price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-8 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Resumo Financeiro</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal</span>
              <span className="font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(quote.subtotal)}
              </span>
            </div>

            {quote.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>
                  Desconto {quote.discount_type === 'percentage' ? `(${quote.discount}%)` : ''}
                </span>
                <span className="font-medium">
                  - {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(
                    quote.discount_type === 'percentage' 
                      ? (quote.subtotal * quote.discount / 100)
                      : quote.discount
                  )}
                </span>
              </div>
            )}

            {quote.tax > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Impostos</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(quote.tax)}
                </span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(quote.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Observações e Termos */}
        {(quote.notes || quote.terms) && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-8 mb-6">
            {quote.notes && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-2">Observações</h3>
                <p className="text-slate-600 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
            {quote.terms && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Termos e Condições</h3>
                <p className="text-slate-600 whitespace-pre-wrap text-sm">{quote.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        {quote.status === 'pending' && !isExpired() && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Ações</h2>
            <p className="text-slate-600 mb-6">
              Revise o orçamento e escolha uma das opções abaixo:
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
                className="flex-1 px-6 py-4 border-2 border-red-300 text-red-700 rounded-2xl font-semibold hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
              >
                Rejeitar Orçamento
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 group relative px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center gap-2">
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Aprovar Orçamento</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Rejeitar Orçamento</h3>
            <p className="text-slate-600 mb-4">
              Por favor, informe o motivo da rejeição para que possamos melhorar:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Valor acima do esperado, prazo muito longo, etc."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processing ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
