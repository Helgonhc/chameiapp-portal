'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, TrendingUp, Download, Filter, Search, Sparkles, BarChart3 } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import DashboardLayout from '@/components/DashboardLayout'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ServiceOrder {
  id: string
  order_number: string
  title: string
  status: string
  completed_at: string
  final_cost: number | null
  technician?: {
    full_name: string
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([])
  const [period, setPeriod] = useState<'month' | '3months' | '6months' | 'year' | 'all'>('3months')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    checkAuth()
    loadHistory()
  }, [period])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('service_orders')
        .select(`
          *,
          technician:profiles!service_orders_technician_id_fkey(full_name)
        `)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      // Filtrar por período
      if (period !== 'all') {
        const months = period === 'month' ? 1 : period === '3months' ? 3 : period === '6months' ? 6 : 12
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - months)
        query = query.gte('completed_at', startDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
      setFilteredOrders(data || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterOrders() {
    if (!searchTerm) {
      setFilteredOrders(orders)
      return
    }

    const filtered = orders.filter(order =>
      order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.technician?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredOrders(filtered)
  }

  function getChartData() {
    // Agrupar por mês
    const monthlyData: { [key: string]: number } = {}
    
    orders.forEach(order => {
      const month = new Date(order.completed_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      monthlyData[month] = (monthlyData[month] || 0) + 1
    })

    const labels = Object.keys(monthlyData).reverse()
    const data = Object.values(monthlyData).reverse()

    return {
      labels,
      datasets: [
        {
          label: 'Serviços Concluídos',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
      ],
    }
  }

  const totalCost = filteredOrders.reduce((sum, order) => sum + (order.final_cost || 0), 0)
  const averageCost = filteredOrders.length > 0 ? totalCost / filteredOrders.length : 0

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
              <BarChart3 className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm font-medium text-slate-600">Carregando histórico...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Premium com Gradiente */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-8 py-12">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 backdrop-blur-xl rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white">Histórico de Serviços</h1>
              </div>
              <p className="text-indigo-100 text-lg">{filteredOrders.length} serviço{filteredOrders.length !== 1 ? 's' : ''} concluído{filteredOrders.length !== 1 ? 's' : ''}</p>
            </div>

            <button
              onClick={() => window.print()}
              className="group relative px-6 py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:shadow-2xl hover:shadow-white/50 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Exportar PDF</span>
                <span className="sm:hidden">PDF</span>
              </div>
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 md:px-8 -mt-6 sm:-mt-8 pb-6 sm:pb-8">
        {/* Estatísticas Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[
            { icon: TrendingUp, label: 'Total de Serviços', value: filteredOrders.length, color: 'from-blue-500 to-cyan-500', format: 'number' },
            { icon: '💰', label: 'Valor Total', value: totalCost, color: 'from-emerald-500 to-teal-500', format: 'currency' },
            { icon: '📊', label: 'Valor Médio', value: averageCost, color: 'from-purple-500 to-pink-500', format: 'currency' },
          ].map((stat, index) => (
            <div
              key={index}
              style={{ animationDelay: `${index * 100}ms` }}
              className="group relative bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200/50 overflow-hidden animate-fade-in-up"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              <div className="absolute -right-8 -top-8 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-slate-100 to-slate-50 rounded-full opacity-50"></div>
              
              <div className="relative">
                <div className={`inline-flex p-2 sm:p-3 bg-gradient-to-br ${stat.color} rounded-lg sm:rounded-xl shadow-lg mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {typeof stat.icon === 'string' ? (
                    <span className="text-xl sm:text-2xl">{stat.icon}</span>
                  ) : (
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">{stat.label}</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {stat.format === 'currency' ? `R$ ${stat.value.toFixed(2)}` : stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico */}
        {orders.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Serviços por Mês</h2>
            <div className="h-48 sm:h-64">
              <Line 
                data={getChartData()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Período */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="month">Último mês</option>
              <option value="3months">Últimos 3 meses</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="year">Último ano</option>
              <option value="all">Todos</option>
            </select>
          </div>
        </div>

        {/* Lista */}
        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 p-10 sm:p-16 text-center">
              <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg font-medium text-slate-700 mb-1 sm:mb-2">
                Nenhum serviço encontrado
              </p>
              <p className="text-xs sm:text-sm text-slate-500">
                Tente ajustar os filtros ou período
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/service-orders/${order.id}`)}
                className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/60 p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-2 sm:mb-3">
                  <div className="w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">{order.order_number}</span>
                      <span className="px-2 sm:px-2.5 py-0.5 bg-green-100 text-green-800 text-[10px] sm:text-xs font-bold rounded-full">
                        Concluído
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{order.title}</h3>
                  </div>

                  {order.final_cost && (
                    <div className="w-full sm:w-auto text-left sm:text-right bg-green-50 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                      <p className="text-xs sm:text-sm text-slate-500">Valor</p>
                      <p className="text-lg sm:text-xl font-bold text-green-600">
                        R$ {order.final_cost.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600">
                  {order.technician && (
                    <span className="flex items-center gap-1">
                      <span>👤</span>
                      <span className="truncate">{order.technician.full_name}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span>📅</span>
                    <span>{new Date(order.completed_at).toLocaleDateString('pt-BR')}</span>
                  </span>
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
