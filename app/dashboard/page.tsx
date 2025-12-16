'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FileText, DollarSign, Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalQuotes: 0,
    pendingQuotes: 0,
    approvedQuotes: 0,
  })

  useEffect(() => {
    checkAuth()
    loadStats()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) return

      const [ordersData, quotesData] = await Promise.all([
        supabase
          .from('service_orders')
          .select('status')
          .eq('client_id', profile.client_id),
        supabase
          .from('quotes')
          .select('status')
          .eq('client_id', profile.client_id)
      ])

      const orders = ordersData.data || []
      const quotes = quotesData.data || []

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        totalQuotes: quotes.length,
        pendingQuotes: quotes.filter(q => q.status === 'pending').length,
        approvedQuotes: quotes.filter(q => q.status === 'approved').length,
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            </div>
            <p className="text-slate-600 font-medium">Carregando dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const statCards = [
    {
      title: 'Total de Ordens',
      value: stats.totalOrders,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Ordens Pendentes',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      title: 'Ordens Concluídas',
      value: stats.completedOrders,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Total de Orçamentos',
      value: stats.totalQuotes,
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Orçamentos Pendentes',
      value: stats.pendingQuotes,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: 'Orçamentos Aprovados',
      value: stats.approvedQuotes,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
  ]

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12 shadow-xl">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-blue-100 text-lg">Visão geral do seu portal</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto px-8 -mt-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon
              return (
                <div
                  key={index}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${card.bgColor}`}>
                        <Icon className={`w-6 h-6 ${card.textColor}`} />
                      </div>
                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${card.color} text-white text-xs font-bold`}>
                        Ativo
                      </div>
                    </div>
                    <h3 className="text-slate-600 text-sm font-medium mb-2">{card.title}</h3>
                    <p className="text-4xl font-bold text-slate-900">{card.value}</p>
                  </div>
                  <div className={`h-1 bg-gradient-to-r ${card.color}`}></div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => router.push('/service-orders')}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
              <FileText className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Ver Ordens de Serviço</h3>
              <p className="text-slate-600">Acompanhe todas as suas ordens de serviço</p>
              <div className="mt-4 text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                Acessar →
              </div>
            </button>

            <button
              onClick={() => router.push('/quotes')}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16"></div>
              <DollarSign className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Ver Orçamentos</h3>
              <p className="text-slate-600">Gerencie seus orçamentos pendentes</p>
              <div className="mt-4 text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
                Acessar →
              </div>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
