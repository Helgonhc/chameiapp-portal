'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FileText, DollarSign, Clock, CheckCircle, TrendingUp, BarChart3, ArrowRight, Sparkles, Zap, AlertTriangle, Calendar, Wrench, Bell, Camera } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ScannerModal from '@/components/ScannerModal';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface MaintenanceAlert {
  id: string;
  title: string;
  maintenance_type_name: string;
  next_maintenance_date: string;
  days_until: number;
  urgency: 'vencido' | 'urgente' | 'proximo' | 'futuro';
  equipment_name?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0, pendingOrders: 0, completedOrders: 0, inProgressOrders: 0,
    totalQuotes: 0, pendingQuotes: 0, approvedQuotes: 0, ordersThisWeek: 0, ordersThisMonth: 0,
    totalSpent: 0,
  });

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: profile, error } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single();
    if (error || !profile || profile.role !== 'client') { await supabase.auth.signOut(); router.push('/login'); return; }
    loadStats();
    loadMaintenanceAlerts();
  }

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single();
      if (!profile?.client_id) return;

      const [ordersResponse, quotesResponse] = await Promise.all([
        supabase.from('service_orders').select('*').eq('client_id', profile.client_id).order('created_at', { ascending: false }),
        supabase.from('quotes').select('status, total').eq('client_id', profile.client_id)
      ]);

      const orders = ordersResponse.data || [];
      const quotes = quotesResponse.data || [];

      setRecentOrders(orders.slice(0, 5));

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalSpent = quotes
        .filter((q: any) => q.status === 'approved' || q.status === 'converted' || q.status === 'completed')
        .reduce((acc: number, q: any) => acc + (Number(q.total) || 0), 0);

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
      });
    } catch (error) { console.error('Erro:', error); }
    finally { setLoading(false); }
  }

  async function loadMaintenanceAlerts() {
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single();
      if (!profile?.client_id) return;

      const alerts: MaintenanceAlert[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      try {
        const { data: contracts } = await supabase
          .from('maintenance_contracts')
          .select(`*, maintenance_types(name, color), equipments(name)`)
          .eq('client_id', profile.client_id)
          .eq('status', 'ativo')
          .eq('is_active', true)
          .not('next_maintenance_date', 'is', null)
          .order('next_maintenance_date', { ascending: true })
          .limit(5);

        if (contracts && contracts.length > 0) {
          contracts.forEach((c: any) => {
            const nextDate = new Date(c.next_maintenance_date);
            nextDate.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            let urgency: 'vencido' | 'urgente' | 'proximo' | 'futuro' = 'futuro';
            if (daysUntil < 0) urgency = 'vencido';
            else if (daysUntil <= 7) urgency = 'urgente';
            else if (daysUntil <= 30) urgency = 'proximo';

            if (urgency !== 'futuro' || daysUntil <= 60) {
              alerts.push({
                id: c.id, title: c.title, maintenance_type_name: c.maintenance_types?.name || 'Manutenção',
                next_maintenance_date: c.next_maintenance_date, days_until: daysUntil, urgency, equipment_name: c.equipments?.name
              });
            }
          });
        }
      } catch (e) { console.log('Tabela maintenance_contracts não existe ou erro:', e); }

      try {
        const { data: equipments } = await supabase
          .from('equipments')
          .select('id, name, type, model, next_maintenance_date')
          .eq('client_id', profile.client_id)
          .eq('status', 'ativo')
          .not('next_maintenance_date', 'is', null)
          .order('next_maintenance_date', { ascending: true })
          .limit(5);

        if (equipments && equipments.length > 0) {
          equipments.forEach((eq: any) => {
            const nextDate = new Date(eq.next_maintenance_date);
            nextDate.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            let urgency: 'vencido' | 'urgente' | 'proximo' | 'futuro' = 'futuro';
            if (daysUntil < 0) urgency = 'vencido';
            else if (daysUntil <= 7) urgency = 'urgente';
            else if (daysUntil <= 30) urgency = 'proximo';

            if (urgency !== 'futuro' || daysUntil <= 60) {
              alerts.push({
                id: eq.id, title: `Manutenção: ${eq.name}`, maintenance_type_name: eq.type || 'Equipamento',
                next_maintenance_date: eq.next_maintenance_date, days_until: daysUntil, urgency, equipment_name: eq.name
              });
            }
          });
        }
      } catch (e) { console.log('Erro ao buscar equipamentos:', e); }

      alerts.sort((a, b) => {
        const urgencyOrder = { vencido: 0, urgente: 1, proximo: 2, futuro: 3 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        return a.days_until - b.days_until;
      });

      setMaintenanceAlerts(alerts.slice(0, 5));
    } catch (error) { console.error('Erro ao carregar alertas:', error); }
  }

  function getUrgencyStyle(urgency: string) {
    // Light theme urgency styles
    switch (urgency) {
      case 'vencido': return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', icon: '🚨' };
      case 'urgente': return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', icon: '⚠️' };
      case 'proximo': return { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', icon: '📅' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-500', icon: '📋' };
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-center">
          <div className="w-12 h-12 spinner mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando informações...</p>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { title: 'Total de Ordens', value: stats.totalOrders, icon: FileText, bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { title: 'Pendentes', value: stats.pendingOrders, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600' },
    { title: 'Concluídas', value: stats.completedOrders, icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { title: 'Orçamentos', value: stats.totalQuotes, icon: DollarSign, bg: 'bg-blue-50', text: 'text-blue-600' },
    { title: 'Aguardando', value: stats.pendingQuotes, icon: TrendingUp, bg: 'bg-purple-50', text: 'text-purple-600' },
    { title: 'Aprovados', value: stats.approvedQuotes, icon: CheckCircle, bg: 'bg-teal-50', text: 'text-teal-600' },
    { title: 'Total Investido', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalSpent), icon: DollarSign, bg: 'bg-gray-50', text: 'text-gray-700' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header Section - Admin Style */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard de Controle</h1>
          <p className="text-gray-500">Visão geral da sua operação em tempo real</p>
        </div>

        {/* Maintenance Alerts - Admin Style Cards */}
        {maintenanceAlerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {maintenanceAlerts.map((alert) => {
              const style = getUrgencyStyle(alert.urgency);
              return (
                <div key={alert.id} className={`card ${style.border} border-l-4 ${style.bg} relative overflow-hidden group`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${style.text}`}>
                        <Wrench size={10} /> {alert.maintenance_type_name}
                      </p>
                      <h4 className="font-bold text-gray-800 text-sm truncate max-w-[200px]">{alert.title}</h4>
                      {alert.equipment_name && <p className="text-xs text-gray-500">{alert.equipment_name}</p>}
                    </div>
                    <button
                      onClick={() => router.push('/tickets')}
                      className={`p-1.5 rounded-lg shadow-sm border transition-colors bg-white hover:bg-white/80 ${style.text} border-gray-100`}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-bold">
                      {new Date(alert.next_maintenance_date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${alert.urgency === 'vencido' ? 'bg-red-100 text-red-700' :
                        alert.urgency === 'urgente' ? 'bg-amber-100 text-amber-700' :
                          alert.urgency === 'proximo' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {alert.urgency === 'vencido' ? 'Vencida' : alert.urgency === 'urgente' ? 'Urgente' : 'Próxima'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Grid - Admin Style */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="card card-hover">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.text}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                    <p className="text-xs text-gray-500">{card.title}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section - Admin Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1 */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" />
              Status de Ordens
            </h3>
            <div className="h-[250px] w-full flex items-center justify-center">
              {stats.totalOrders > 0 ? (
                <Doughnut
                  data={{
                    labels: ['Pendentes', 'Andamento', 'Concluídas'],
                    datasets: [{ data: [stats.pendingOrders, stats.inProgressOrders, stats.completedOrders], backgroundColor: ['#F59E0B', '#6366F1', '#10B981'], borderWidth: 0 }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } } }, cutout: '75%' }}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <p>Sem dados suficientes</p>
                </div>
              )}
            </div>
          </div>

          {/* Chart 2 */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              Volume Recente
            </h3>
            <div className="h-[250px] w-full">
              <Bar
                data={{ labels: ['Semana', 'Mês', 'Total'], datasets: [{ label: 'Ordens', data: [stats.ordersThisWeek, stats.ordersThisMonth, stats.totalOrders], backgroundColor: ['#6366F1', '#F59E0B', '#10B981'], borderRadius: 4, barThickness: 40 }] }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: 'rgba(0,0,0,0.03)', drawBorder: false }, ticks: { display: false } },
                    x: { grid: { display: false }, ticks: { font: { size: 12 } } }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Recent Orders - Admin Style */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Ordens Recentes</h2>
            <button onClick={() => router.push('/service-orders')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
              Ver todas
            </button>
          </div>

          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 rounded-lg">Nenhuma ordem encontrada</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/service-orders/${order.id}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm group-hover:border-indigo-100 group-hover:shadow-md transition-all">
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">{order.title}</p>
                      <p className="text-xs text-gray-500">#{order.order_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="hidden sm:block text-xs font-medium text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {order.status === 'completed' ? 'Concluído' : order.status === 'in_progress' ? 'Andamento' : 'Pendente'}
                    </span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Floating Scanner Button (Mobile) */}
        {!isScannerOpen && (
          <button
            onClick={() => setIsScannerOpen(true)}
            className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center z-50 hover:scale-110 transition-transform active:scale-95"
          >
            <Camera size={24} />
          </button>
        )}

        <ScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      </div>
    </DashboardLayout>
  );
}
