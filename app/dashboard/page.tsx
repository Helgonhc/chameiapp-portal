'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { FileText, DollarSign, Clock, CheckCircle, TrendingUp, BarChart3, ArrowRight, ClipboardList, Zap, AlertTriangle, Calendar, Wrench, ChevronRight, Camera, Plus } from 'lucide-react';
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
  const { profile, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0, pendingOrders: 0, completedOrders: 0, inProgressOrders: 0,
    totalQuotes: 0, pendingQuotes: 0, approvedQuotes: 0, ordersThisWeek: 0, ordersThisMonth: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (isAuthenticated && profile?.client_id) {
      loadStats();
      loadMaintenanceAlerts();
      loadRecentOrders();
    } else if (!loading && !isAuthenticated) {
      router.push('/login');
    }

    const channel = supabase.channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, () => {
        loadStats();
        loadRecentOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, profile]);

  async function loadStats() {
    if (!profile?.client_id) return;
    try {
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
        pendingOrders: orders.filter((o: any) => ['pendente', 'pending', 'scheduled', 'agendada'].includes(o.status)).length,
        completedOrders: orders.filter((o: any) => ['concluido', 'concluida', 'completed'].includes(o.status)).length,
        inProgressOrders: orders.filter((o: any) => ['em_andamento', 'in_progress', 'aguardando_peca'].includes(o.status)).length,
        totalQuotes: quotes.length,
        pendingQuotes: quotes.filter((q: any) => q.status === 'pending' || q.status === 'pendente').length,
        approvedQuotes: quotes.filter((q: any) => q.status === 'approved' || q.status === 'aprovado').length,
        ordersThisWeek: orders.filter((o: any) => new Date(o.created_at) >= weekAgo).length,
        ordersThisMonth: orders.filter((o: any) => new Date(o.created_at) >= monthAgo).length,
        totalSpent
      });
    } catch (error) { console.error('Erro:', error); }
    finally { setLoading(false); }
  }

  async function loadMaintenanceAlerts() {
    if (!profile?.client_id) return;
    try {
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
          .select('*')
          .eq('client_id', profile.client_id)
          .not('next_maintenance_date', 'is', null)
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

  async function loadRecentOrders() {
    if (!profile?.client_id) return;
    try {
      const { data } = await supabase
        .from('service_orders')
        .select('*, equipments(name)')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentOrders(data || []);
    } catch (e) { console.error(e); }
  }

  function getUrgencyStyle(urgency: string) {
    switch (urgency) {
      case 'vencido': return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', iconColor: 'text-red-500' };
      case 'urgente': return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', iconColor: 'text-amber-500' };
      case 'proximo': return { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', iconColor: 'text-indigo-500' };
      default: return { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-600', iconColor: 'text-slate-400' };
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600 font-medium">Carregando informações...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { title: 'Ordens Pendentes', value: stats.pendingOrders, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', link: '/service-orders?status=pending' },
    { title: 'Em Execução', value: stats.inProgressOrders, icon: Zap, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', link: '/service-orders?status=in_progress' },
    { title: 'Concluídas', value: stats.completedOrders, icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', link: '/service-orders?status=completed' },
    { title: 'Total Investido', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.totalSpent), icon: DollarSign, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', link: '/quotes' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard de Controle</h1>
            <p className="text-slate-500">Visão geral da sua operação em tempo real</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
              Exportar
            </button>
            <button onClick={() => router.push('/new-order')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-indigo-100 transition-all flex items-center gap-2">
              <Plus size={16} /> Nova Solicitação
            </button>
          </div>
        </div>

        {/* Stats Grid - Elite Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={index}
                href={card.link || '#'}
                className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${card.bg} ${card.text}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${card.bg} ${card.text}`}>
                    +2.5%
                  </span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800 tracking-tight mb-1">{card.value}</p>
                  <p className="text-sm text-slate-500 font-medium">{card.title}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts Section */}
          <div className="lg:col-span-2 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Volume de Ordens</h3>
                <p className="text-sm text-slate-400">Atividade dos últimos 30 dias</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <BarChart3 className="text-indigo-600" size={20} />
              </div>
            </div>
            <div className="h-[250px] w-full">
              <Bar
                data={{ labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'], datasets: [{ label: 'Ordens', data: [stats.ordersThisMonth * 0.2, stats.ordersThisMonth * 0.3, stats.ordersThisMonth * 0.1, stats.ordersThisMonth * 0.4], backgroundColor: '#6366F1', borderRadius: 6, barThickness: 24 }] }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: 'rgba(0,0,0,0.02)' }, ticks: { display: false } },
                    x: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#94a3b8' } }
                  }
                }}
              />
            </div>
          </div>

          {/* Alerts Section */}
          <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20} />
                Alertas
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 -mr-2">
              {maintenanceAlerts.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm">Tudo em dia!</p>
                </div>
              ) : (
                maintenanceAlerts.map((alert) => {
                  const style = getUrgencyStyle(alert.urgency);
                  return (
                    <div key={alert.id} className={`p-3 rounded-2xl border ${style.border} ${style.bg} transition-all hover:scale-[1.02] cursor-pointer`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/50 ${style.text}`}>
                          {alert.urgency}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{new Date(alert.next_maintenance_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-0.5">{alert.title}</h4>
                      {alert.equipment_name && <p className="text-xs text-slate-500 flex items-center gap-1"><Wrench size={10} /> {alert.equipment_name}</p>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders - Table Style */}
        <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-lg">Ordens Recentes</h2>
            <button onClick={() => router.push('/service-orders')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={14} />
            </button>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">OS #</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Título</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">Nenhuma ordem recente.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/service-orders/${order.id}`)}>
                      <td className="p-4 text-sm font-mono text-slate-500">#{order.order_number}</td>
                      <td className="p-4">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{order.title}</p>
                        {order.equipments?.name && <p className="text-xs text-slate-400">{order.equipments.name}</p>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5
                              ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            order.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'completed' ? 'bg-emerald-500' : order.status === 'in_progress' ? 'bg-indigo-500' : 'bg-amber-500'}`}></span>
                          {order.status === 'completed' ? 'Concluído' : order.status === 'in_progress' ? 'Andamento' : 'Pendente'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4 text-right">
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Nenhuma ordem recente.</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/service-orders/${order.id}`)}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm active:scale-98 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-mono text-slate-400 block mb-1">#{order.order_number}</span>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{order.title}</h4>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide
                          ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        order.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                      {order.status === 'completed' ? 'Concluído' : order.status === 'in_progress' ? 'Andamento' : 'Pendente'}
                    </span>
                  </div>

                  {order.equipments?.name && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded-lg">
                      <Wrench size={12} className="text-slate-400" />
                      {order.equipments.name}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <button className="text-indigo-600 font-medium text-xs flex items-center gap-1">
                      Ver detalhes <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <ScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      </div>
    </DashboardLayout>
  );
}
