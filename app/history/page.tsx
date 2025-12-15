'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Calendar, TrendingUp, Download, Filter, Search } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()} 
                className="p-2.5 hover:bg-slate-100 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Histórico de Serviços</h1>
                <p className="text-sm text-slate-500">{filteredOrders.length} serviço{filteredOrders.length !== 1 ? 's' : ''} concluído{filteredOrders.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Estatísticas */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-slate-600">Total de Serviços</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{filteredOrders.length}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <p className="text-sm font-medium text-slate-600">Valor Total</p>
            </div>
            <p className="text-3xl font-bold text-green-600">R$ {totalCost.toFixed(2)}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <p className="text-sm font-medium text-slate-600">Valor Médio</p>
            </div>
            <p className="text-3xl font-bold text-purple-600">R$ {averageCost.toFixed(2)}</p>
          </div>
        </div>

        {/* Gráfico */}
        {orders.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Serviços por Mês</h2>
            <Line 
              data={getChartData()} 
              options={{
                responsive: true,
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
        )}

        {/* Filtros */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título, número ou técnico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Período */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-16 text-center">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700 mb-2">
                Nenhum serviço encontrado
              </p>
              <p className="text-sm text-slate-500">
                Tente ajustar os filtros ou período
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/service-orders/${order.id}`)}
                className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">{order.order_number}</span>
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                        Concluído
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{order.title}</h3>
                  </div>

                  {order.final_cost && (
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Valor</p>
                      <p className="text-xl font-bold text-green-600">
                        R$ {order.final_cost.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div className="flex items-center gap-4">
                    {order.technician && (
                      <span>👤 {order.technician.full_name}</span>
                    )}
                    <span>
                      📅 {new Date(order.completed_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
