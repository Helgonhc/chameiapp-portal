'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DollarSign, FileText, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

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
      expired: 'bg-gray-50 text-gray-700 border-gray-200',
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Carregando orçamentos...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-12 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Orçamentos</h1>
                <p className="text-amber-100 text-lg mt-1">
                  {pendingCount > 0 ? `${pendingCount} aguardando sua aprovação` : 'Todos os seus orçamentos'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-8 pb-8">
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 mb-6">
            {[
              { key: 'all', label: 'Todos', count: quotes.length, icon: '💰' },
              { key: 'pending', label: 'Aguardando', count: quotes.filter(q => q.status === 'pending').length, icon: '⏳' },
              { key: 'approved', label: 'Aprovados', count: quotes.filter(q => q.status === 'approved').length, icon: '✅' },
              { key: 'rejected', label: 'Rejeitados', count: quotes.filter(q => q.status === 'rejected').length, icon: '❌' },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`px-4 md:px-5 py-3 rounded-xl font-semibold transition-all shadow-sm text-sm md:text-base ${
                  filter === btn.key
                    ? 'bg-white text-amber-600 shadow-lg border-2 border-amber-200'
                    : 'bg-white text-gray-600 hover:bg-white hover:shadow-md border-2 border-transparent'
                }`}
              >
                <span className="mr-1 md:mr-2">{btn.icon}</span>
                <span className="hidden sm:inline">{btn.label} </span>
                <span className="sm:hidden">{btn.label.split(' ')[0]} </span>
                ({btn.count})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredQuotes.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-20 text-center">
                <div className="inline-flex p-6 bg-amber-100 rounded-full mb-6">
                  <DollarSign className="w-16 h-16 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-gray-700 mb-3">
                  {filter === 'all' ? 'Nenhum orçamento' : `Nenhum orçamento ${getStatusLabel(filter).toLowerCase()}`}
                </p>
                <p className="text-gray-500">
                  Quando recebermos orçamentos, eles aparecerão aqui
                </p>
              </div>
            ) : (
              filteredQuotes.map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => router.push(`/quotes/${quote.id}`)}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-gray-200 hover:border-amber-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono text-gray-500">
                          {quote.quote_number}
                        </span>
                        {quote.status === 'pending' && isExpired(quote.valid_until) && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                            Expirado
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg hover:text-blue-600 transition-colors">
                        {quote.title}
                      </h3>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${getStatusColor(quote.status)}`}>
                      {getStatusIcon(quote.status)}
                      {getStatusLabel(quote.status)}
                    </span>
                  </div>

                  {quote.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {quote.description}
                    </p>
                  )}

                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(quote.total)}
                    </p>
                    {quote.items_count && quote.items_count > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {quote.items_count} {quote.items_count === 1 ? 'item' : 'itens'}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Válido até {new Date(quote.valid_until).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {quote.status === 'pending' && (
                      <span className="text-sm font-medium text-blue-600">
                        Ver detalhes →
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
