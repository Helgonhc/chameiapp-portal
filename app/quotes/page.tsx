'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, DollarSign, FileText, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

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
  items_count?: number
}

export default function QuotesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    checkAuth()
    loadQuotes()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadQuotes() {
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
        .from('quotes')
        .select(`
          *,
          quote_items(count)
        `)
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const quotesWithCount = data?.map(q => ({
        ...q,
        items_count: q.quote_items?.[0]?.count || 0
      })) || []
      
      setQuotes(quotesWithCount)
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      expired: 'bg-slate-50 text-slate-700 border-slate-200',
      converted: 'bg-blue-50 text-blue-700 border-blue-200',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  function getStatusLabel(status: string) {
    const labels = {
      pending: 'Aguardando',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      expired: 'Expirado',
      converted: 'Convertido',
    }
    return labels[status as keyof typeof labels] || status
  }

  function getStatusIcon(status: string) {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      expired: <AlertCircle className="w-4 h-4" />,
      converted: <FileText className="w-4 h-4" />,
    }
    return icons[status as keyof typeof icons] || <FileText className="w-4 h-4" />
  }

  function isExpired(validUntil: string) {
    return new Date(validUntil) < new Date()
  }

  const filteredQuotes = filter === 'all' 
    ? quotes 
    : quotes.filter(q => q.status === filter)

  const pendingCount = quotes.filter(q => q.status === 'pending').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Premium */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()} 
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Orçamentos</h1>
                <p className="text-sm text-slate-500">
                  {pendingCount > 0 ? `${pendingCount} aguardando aprovação` : 'Todos os orçamentos'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filtros */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'bg-white/60 text-slate-600 hover:bg-white'
            }`}
          >
            Todos ({quotes.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === 'pending'
                ? 'bg-white text-amber-600 shadow-sm border border-amber-200'
                : 'bg-white/60 text-slate-600 hover:bg-white'
            }`}
          >
            Aguardando ({quotes.filter(q => q.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === 'approved'
                ? 'bg-white text-emerald-600 shadow-sm border border-emerald-200'
                : 'bg-white/60 text-slate-600 hover:bg-white'
            }`}
          >
            Aprovados ({quotes.filter(q => q.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === 'rejected'
                ? 'bg-white text-red-600 shadow-sm border border-red-200'
                : 'bg-white/60 text-slate-600 hover:bg-white'
            }`}
          >
            Rejeitados ({quotes.filter(q => q.status === 'rejected').length})
          </button>
        </div>

        {/* Lista de Orçamentos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredQuotes.length === 0 ? (
            <div className="col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-16 text-center">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700 mb-2">
                {filter === 'all' ? 'Nenhum orçamento' : `Nenhum orçamento ${getStatusLabel(filter).toLowerCase()}`}
              </p>
              <p className="text-sm text-slate-500">
                Quando recebermos orçamentos, eles aparecerão aqui
              </p>
            </div>
          ) : (
            filteredQuotes.map((quote) => (
              <div
                key={quote.id}
                onClick={() => router.push(`/quotes/${quote.id}`)}
                className="group bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200/60 hover:border-blue-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-slate-500">
                        {quote.quote_number}
                      </span>
                      {quote.status === 'pending' && isExpired(quote.valid_until) && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                          Expirado
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                      {quote.title}
                    </h3>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${getStatusColor(quote.status)}`}>
                    {getStatusIcon(quote.status)}
                    {getStatusLabel(quote.status)}
                  </span>
                </div>

                {/* Descrição */}
                {quote.description && (
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                    {quote.description}
                  </p>
                )}

                {/* Valor Total */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-slate-600 mb-1">Valor Total</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(quote.total)}
                  </p>
                  {quote.items_count && quote.items_count > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {quote.items_count} {quote.items_count === 1 ? 'item' : 'itens'}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Válido até {new Date(quote.valid_until).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {quote.status === 'pending' && (
                    <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                      Ver detalhes →
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
