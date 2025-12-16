'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FileText, DollarSign, Calendar, TrendingUp, Clock, CheckCircle, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Registrar componentes do Chart.js
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    totalQuotes: 0,
    pendingQuotes: 0,
    approvedQuotes: 0,
    ordersThisWeek: 0,
    ordersThisMonth: 0,
  })

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Verificar se o usuário tem profile de cliente
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, client_id')
      .eq('id', user.id)
      .single()

    if (error || !profile || profile.role !== 'client') {
      await supabase.auth.signOut()
      router.push('/login')
      return
    }

    // Tudo ok, carregar dados
    loadStats()
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
          .select('status, created_at')
          .eq('client_id', profile.client_id),
        supabase
          .from('quotes')
          .select('status')
          .eq('client_id', profile.client_id)
      ])

      const orders = ordersData.data || []
      const quotes = quotesData.data || []

      // Calcular ordens da semana e do mês
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const ordersThisWeek = orders.filter((o: any) => new Date(o.created_at) >= weekAgo).length
      const ordersThisMonth = orders.filter((o: any) => new Date(o.created_at) >= monthAgo).length

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        inProgressOrders: orders.filter(o => o.status === 'in_progress').length,
        totalQuotes: quotes.length,
        pendingQuotes: quotes.filter(q => q.status === 'pending').length,
        approvedQuotes: quotes.filter(q => q.status === 'approved').length,
        ordersThisWeek,
        ordersThisMonth,
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 shadow-xl">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">Dashboard</h1>
            <p className="text-blue-100 text-sm sm:text-base md:text-lg">Visão geral do seu portal</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 -mt-6 sm:-mt-8 pb-6 sm:pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon
              return (
                <div
                  key={index}
                  className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${card.bgColor}`}>
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.textColor}`} />
                      </div>
                      <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gradient-to-r ${card.color} text-white text-[10px] sm:text-xs font-bold`}>
                        Ativo
                      </div>
                    </div>
                    <h3 className="text-slate-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">{card.title}</h3>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">{card.value}</p>
                  </div>
                  <div className={`h-1 bg-gradient-to-r ${card.color}`}></div>
                </div>
              )
            })}
          </div>

          {/* Gráficos */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Gráfico de Pizza - Status das Ordens */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
                  <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Distribuição de Ordens</h3>
              </div>
              {stats.totalOrders > 0 ? (
                <div className="h-48 sm:h-56 md:h-64 flex items-center justify-center">
                  <Doughnut
                    data={{
                      labels: ['Pendentes', 'Em Andamento', 'Concluídas'],
                      datasets: [{
                        data: [stats.pendingOrders, stats.inProgressOrders, stats.completedOrders],
                        backgroundColor: ['#F59E0B', '#3B82F6', '#10B981'],
                        borderWidth: 0,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 10,
                            font: { size: 11, weight: 'bold' }
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-48 sm:h-56 md:h-64 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <PieChartIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 opacity-30" />
                    <p className="text-xs sm:text-sm">Sem dados para exibir</p>
                  </div>
                </div>
              )}
            </div>

            {/* Gráfico de Barras - Atividade */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Atividade Recente</h3>
              </div>
              <div className="h-48 sm:h-56 md:h-64">
                <Bar
                  data={{
                    labels: ['Esta Semana', 'Este Mês', 'Total'],
                    datasets: [{
                      label: 'Ordens de Serviço',
                      data: [stats.ordersThisWeek, stats.ordersThisMonth, stats.totalOrders],
                      backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981'],
                      borderRadius: 8,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Insights */}
          {stats.totalOrders > 0 && (
            <div className="mt-4 sm:mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">💡</span> Insights
              </h3>
              <div className="space-y-1.5 sm:space-y-2 text-slate-700 text-xs sm:text-sm md:text-base">
                {stats.pendingOrders > stats.completedOrders && (
                  <p className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>Você tem <strong>{stats.pendingOrders} ordens pendentes</strong>. Acompanhe o progresso regularmente.</span>
                  </p>
                )}
                {stats.completedOrders > stats.pendingOrders && (
                  <p className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Ótimo! A maioria das suas ordens está <strong>concluída</strong>.</span>
                  </p>
                )}
                {stats.ordersThisWeek > 0 && (
                  <p className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span><strong>{stats.ordersThisWeek} nova(s) ordem(ns)</strong> criada(s) esta semana.</span>
                  </p>
                )}
                {stats.pendingQuotes > 0 && (
                  <p className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>Você tem <strong>{stats.pendingQuotes} orçamento(s) aguardando aprovação</strong>.</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <button
              onClick={() => router.push('/service-orders')}
              className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 sm:p-8 text-left overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mb-3 sm:mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Ver Ordens de Serviço</h3>
              <p className="text-sm sm:text-base text-slate-600">Acompanhe todas as suas ordens de serviço</p>
              <div className="mt-3 sm:mt-4 text-sm sm:text-base text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                Acessar →
              </div>
            </button>

            <button
              onClick={() => router.push('/quotes')}
              className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 sm:p-8 text-left overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
              <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mb-3 sm:mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Ver Orçamentos</h3>
              <p className="text-sm sm:text-base text-slate-600">Gerencie seus orçamentos pendentes</p>
              <div className="mt-3 sm:mt-4 text-sm sm:text-base text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
                Acessar →
              </div>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
