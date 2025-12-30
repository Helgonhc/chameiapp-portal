'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FileText, DollarSign, Clock, CheckCircle, TrendingUp, BarChart3, ArrowRight, Sparkles, Zap, AlertTriangle, Calendar, Wrench, Bell, Camera } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import ScannerModal from '@/components/ScannerModal'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface MaintenanceAlert {
  id: string
  title: string
  maintenance_type_name: string
  next_maintenance_date: string
  days_until: number
  urgency: 'vencido' | 'urgente' | 'proximo' | 'futuro'
  equipment_name?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([])
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [stats, setStats] = useState({
    totalOrders: 0, pendingOrders: 0, completedOrders: 0, inProgressOrders: 0,
    totalQuotes: 0, pendingQuotes: 0, approvedQuotes: 0, ordersThisWeek: 0, ordersThisMonth: 0,
    totalSpent: 0,
  })

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile, error } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()
    if (error || !profile || profile.role !== 'client') { await supabase.auth.signOut(); router.push('/login'); return }
    loadStats()
    loadMaintenanceAlerts()
  }

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single()
      if (!profile?.client_id) return
      const [ordersResponse, quotesResponse] = await Promise.all([
        supabase.from('service_orders').select('status, created_at').eq('client_id', profile.client_id),
        supabase.from('quotes').select('status, total').eq('client_id', profile.client_id)
      ])

      const orders = ordersResponse.data || []
      const quotes = quotesResponse.data || []

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const totalSpent = quotes
        .filter((q: any) => q.status === 'approved' || q.status === 'converted' || q.status === 'completed')
        .reduce((acc: number, q: any) => acc + (Number(q.total) || 0), 0)

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        inProgressOrders: orders.filter(o => o.status === 'in_progress').length,
        totalQuotes: quotes.length,
        pendingQuotes: quotes.filter(q => q.status === 'pending').length,
        approvedQuotes: quotes.filter(q => q.status === 'approved').length,
        ordersThisWeek: orders.filter((o: any) => new Date(o.created_at) >= weekAgo).length,
        ordersThisMonth: orders.filter((o: any) => new Date(o.created_at) >= monthAgo).length,
        totalSpent
      })
    } catch (error) { console.error('Erro:', error) }
    finally { setLoading(false) }
  }

  async function loadMaintenanceAlerts() {
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single()
      if (!profile?.client_id) return

      const alerts: MaintenanceAlert[] = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Tentar buscar de maintenance_contracts primeiro
      try {
        const { data: contracts } = await supabase
          .from('maintenance_contracts')
          .select(`*, maintenance_types(name, color), equipments(name)`)
          .eq('client_id', profile.client_id)
          .eq('status', 'ativo')
          .eq('is_active', true)
          .not('next_maintenance_date', 'is', null)
          .order('next_maintenance_date', { ascending: true })
          .limit(5)

        if (contracts && contracts.length > 0) {
          contracts.forEach((c: any) => {
            const nextDate = new Date(c.next_maintenance_date)
            nextDate.setHours(0, 0, 0, 0)
            const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            let urgency: 'vencido' | 'urgente' | 'proximo' | 'futuro' = 'futuro'
            if (daysUntil < 0) urgency = 'vencido'
            else if (daysUntil <= 7) urgency = 'urgente'
            else if (daysUntil <= 30) urgency = 'proximo'

            if (urgency !== 'futuro' || daysUntil <= 60) {
              alerts.push({
                id: c.id, title: c.title, maintenance_type_name: c.maintenance_types?.name || 'Manutenção',
                next_maintenance_date: c.next_maintenance_date, days_until: daysUntil, urgency, equipment_name: c.equipments?.name
              })
            }
          })
        }
      } catch (e) { console.log('Tabela maintenance_contracts não existe ou erro:', e) }

      // Também buscar equipamentos com next_maintenance_date
      try {
        const { data: equipments } = await supabase
          .from('equipments')
          .select('id, name, type, model, next_maintenance_date')
          .eq('client_id', profile.client_id)
          .eq('status', 'ativo')
          .not('next_maintenance_date', 'is', null)
          .order('next_maintenance_date', { ascending: true })
          .limit(5)

        if (equipments && equipments.length > 0) {
          equipments.forEach((eq: any) => {
            const nextDate = new Date(eq.next_maintenance_date)
            nextDate.setHours(0, 0, 0, 0)
            const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            let urgency: 'vencido' | 'urgente' | 'proximo' | 'futuro' = 'futuro'
            if (daysUntil < 0) urgency = 'vencido'
            else if (daysUntil <= 7) urgency = 'urgente'
            else if (daysUntil <= 30) urgency = 'proximo'

            if (urgency !== 'futuro' || daysUntil <= 60) {
              alerts.push({
                id: eq.id, title: `Manutenção: ${eq.name}`, maintenance_type_name: eq.type || 'Equipamento',
                next_maintenance_date: eq.next_maintenance_date, days_until: daysUntil, urgency, equipment_name: eq.name
              })
            }
          })
        }
      } catch (e) { console.log('Erro ao buscar equipamentos:', e) }

      // Ordenar por urgência e data
      alerts.sort((a, b) => {
        const urgencyOrder = { vencido: 0, urgente: 1, proximo: 2, futuro: 3 }
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
        return a.days_until - b.days_until
      })

      setMaintenanceAlerts(alerts.slice(0, 5))
    } catch (error) { console.error('Erro ao carregar alertas:', error) }
  }

  function getUrgencyStyle(urgency: string) {
    switch (urgency) {
      case 'vencido': return { bg: 'bg-danger-500/20', border: 'border-danger-500/30', text: 'text-danger-400', icon: '🚨' }
      case 'urgente': return { bg: 'bg-warning-500/20', border: 'border-warning-500/30', text: 'text-warning-400', icon: '⚠️' }
      case 'proximo': return { bg: 'bg-primary-500/20', border: 'border-primary-500/30', text: 'text-primary-400', icon: '📅' }
      default: return { bg: 'bg-zinc-500/20', border: 'border-zinc-500/30', text: 'text-zinc-400', icon: '📋' }
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400 font-medium">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const statCards = [
    { title: 'Total de Ordens', value: stats.totalOrders, icon: FileText, gradient: 'from-primary-500 to-primary-600', glow: 'shadow-primary-500/20' },
    { title: 'Pendentes', value: stats.pendingOrders, icon: Clock, gradient: 'from-warning-500 to-warning-600', glow: 'shadow-warning-500/20' },
    { title: 'Concluídas', value: stats.completedOrders, icon: CheckCircle, gradient: 'from-success-500 to-success-600', glow: 'shadow-success-500/20' },
    { title: 'Orçamentos', value: stats.totalQuotes, icon: DollarSign, gradient: 'from-accent-500 to-accent-600', glow: 'shadow-accent-500/20' },
    { title: 'Aguardando', value: stats.pendingQuotes, icon: TrendingUp, gradient: 'from-purple-500 to-purple-600', glow: 'shadow-purple-500/20' },
    { title: 'Aprovados', value: stats.approvedQuotes, icon: CheckCircle, gradient: 'from-success-500 to-success-600', glow: 'shadow-success-500/20' },
    { title: 'Total Investido', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalSpent), icon: DollarSign, gradient: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/20' },
  ]

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="page-header">
          <div className="max-w-7xl mx-auto relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
                <Sparkles className="w-5 h-5 text-primary-400" />
              </div>
              <span className="text-primary-400 text-sm font-medium">Visão Geral</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-zinc-400 text-lg">Acompanhe suas ordens e orçamentos</p>

            {/* Quick Scan Button - Desk/Tablet */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg shadow-primary-500/30"
              >
                <Camera className="w-5 h-5 text-white" />
                <span className="font-bold">Escanear QR Code</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-8">
          {/* Alertas de Manutenção */}
          {maintenanceAlerts.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-warning-500/20 border border-warning-500/30">
                  <Bell className="w-5 h-5 text-warning-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Alertas de Manutenção</h2>
                <span className="badge badge-warning">{maintenanceAlerts.length}</span>
              </div>
              <div className="grid gap-3">
                {maintenanceAlerts.map((alert) => {
                  const style = getUrgencyStyle(alert.urgency)
                  return (
                    <div key={alert.id} className={`list-item ${style.bg} ${style.border} border`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.bg} border ${style.border}`}>
                            <Wrench className={`w-6 h-6 ${style.text}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{style.icon}</span>
                              <h3 className="font-bold text-white">{alert.maintenance_type_name}</h3>
                              {alert.urgency === 'vencido' && <span className="badge badge-danger text-xs">VENCIDO</span>}
                              {alert.urgency === 'urgente' && <span className="badge badge-warning text-xs">URGENTE</span>}
                            </div>
                            <p className="text-sm text-zinc-400">{alert.title}</p>
                            {alert.equipment_name && <p className="text-xs text-zinc-500">Equipamento: {alert.equipment_name}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${style.text}`}>
                            {alert.days_until < 0
                              ? `${Math.abs(alert.days_until)} dias atrasado`
                              : alert.days_until === 0
                                ? 'Hoje!'
                                : `Em ${alert.days_until} dias`}
                          </p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1 justify-end">
                            <Calendar className="w-3 h-3" />
                            {new Date(alert.next_maintenance_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                        <button onClick={() => router.push('/appointments/new')} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> Agendar Manutenção
                        </button>
                        <button onClick={() => router.push('/tickets')} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Abrir Chamado
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon
              return (
                <div key={index} className="stat-card group">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.glow}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="badge badge-primary">Ativo</span>
                  </div>
                  <p className="text-zinc-500 text-sm font-medium mb-1">{card.title}</p>
                  <p className="text-3xl lg:text-4xl font-bold text-white">{card.value}</p>
                </div>
              )
            })}
          </div>

          {/* Charts */}
          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
                  <BarChart3 className="w-5 h-5 text-primary-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Distribuição de Ordens</h3>
              </div>
              {stats.totalOrders > 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <Doughnut
                    data={{
                      labels: ['Pendentes', 'Em Andamento', 'Concluídas'],
                      datasets: [{ data: [stats.pendingOrders, stats.inProgressOrders, stats.completedOrders], backgroundColor: ['#f59e0b', '#6366f1', '#10b981'], borderWidth: 0, borderRadius: 4 }]
                    }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12, weight: 'bold' }, color: '#a1a1aa' } } }, cutout: '65%' }}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-500"><p className="text-sm">Sem dados</p></div>
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accent-500/20 border border-accent-500/30">
                  <TrendingUp className="w-5 h-5 text-accent-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Atividade Recente</h3>
              </div>
              <div className="h-64">
                <Bar
                  data={{ labels: ['Semana', 'Mês', 'Total'], datasets: [{ label: 'Ordens', data: [stats.ordersThisWeek, stats.ordersThisMonth, stats.totalOrders], backgroundColor: ['#6366f1', '#f59e0b', '#10b981'], borderRadius: 8, borderSkipped: false }] }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: '#71717a' }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false }, ticks: { color: '#71717a' } } } }}
                />
              </div>
            </div>
          </div>

          {/* Insights */}
          {(stats.totalOrders > 0 || maintenanceAlerts.length > 0) && (
            <div className="mt-6 card p-6 bg-gradient-to-r from-primary-500/10 to-accent-500/5 border-primary-500/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent-400" /> Insights
              </h3>
              <div className="space-y-2 text-zinc-300 text-sm">
                {maintenanceAlerts.filter(a => a.urgency === 'vencido').length > 0 && (
                  <p className="text-danger-400">• 🚨 <strong>{maintenanceAlerts.filter(a => a.urgency === 'vencido').length}</strong> manutenção(ões) vencida(s)!</p>
                )}
                {maintenanceAlerts.filter(a => a.urgency === 'urgente').length > 0 && (
                  <p className="text-warning-400">• ⚠️ <strong>{maintenanceAlerts.filter(a => a.urgency === 'urgente').length}</strong> manutenção(ões) urgente(s) nos próximos 7 dias</p>
                )}
                {stats.pendingOrders > 0 && <p>• <strong className="text-white">{stats.pendingOrders}</strong> ordens pendentes</p>}
                {stats.ordersThisWeek > 0 && <p>• <strong className="text-white">{stats.ordersThisWeek}</strong> novas esta semana</p>}
                {stats.pendingQuotes > 0 && <p>• <strong className="text-white">{stats.pendingQuotes}</strong> orçamentos aguardando</p>}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <button onClick={() => router.push('/service-orders')} className="card p-6 text-left group hover:border-primary-500/40">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/20 w-fit mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ordens de Serviço</h3>
              <p className="text-zinc-500 text-sm mb-4">Acompanhe suas ordens</p>
              <span className="text-primary-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">Acessar <ArrowRight className="w-4 h-4" /></span>
            </button>

            <button onClick={() => router.push('/quotes')} className="card p-6 text-left group hover:border-accent-500/40">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-lg shadow-accent-500/20 w-fit mb-4">
                <DollarSign className="w-6 h-6 text-dark-900" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Orçamentos</h3>
              <p className="text-zinc-500 text-sm mb-4">Gerencie seus orçamentos</p>
              <span className="text-accent-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">Acessar <ArrowRight className="w-4 h-4" /></span>
            </button>
          </div>
        </div>

        {/* Floating Action Button (FAB) for Mobile */}
        <button
          onClick={() => setIsScannerOpen(true)}
          className="lg:hidden fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full shadow-2xl shadow-primary-500/40 flex items-center justify-center z-[50] animate-bounce-subtle"
        >
          <Camera className="w-8 h-8 text-white" />
        </button>

        {/* Scanner Modal */}
        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
        />
      </div>
    </DashboardLayout>
  )
}
