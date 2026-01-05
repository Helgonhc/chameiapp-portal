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
        supabase.from('service_orders').select('status, created_at').eq('client_id', profile.client_id),
        supabase.from('quotes').select('status, total').eq('client_id', profile.client_id)
      ]);

      const orders = ordersResponse.data || [];
      const quotes = quotesResponse.data || [];

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
          <p className="text-gray-500 font-medium">Carregando informações...</p>
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
      <div className="animate-fadeIn">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard de Controle</h1>
          <p className="text-gray-500">Visão geral da sua operação em tempo real</p>
        </div>

        {/* Maintenance Alerts */}
        {maintenanceAlerts.length > 0 && (
          <div className="mb-8 card bg-white border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-amber-500" />
              <h2 className="text-lg font-bold text-gray-800">Atenção Necessária</h2>
            </div>

            <div className="space-y-3">
              {maintenanceAlerts.map((alert) => {
                const style = getUrgencyStyle(alert.urgency);
                return (
                  <div key={alert.id} className={`p-4 rounded-lg border ${style.bg} ${style.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-sm`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                        <Wrench className={`w-5 h-5 ${style.text}`} />
                      </div>
                      <div>
                        <h3 className={`font-bold ${style.text} flex items-center gap-2`}>
                          {alert.maintenance_type_name}
                          {alert.urgency === 'vencido' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Vencido</span>}
                        </h3>
                        <p className="text-sm text-gray-600">{alert.title}</p>
                        {alert.equipment_name && <p className="text-xs text-gray-500 mt-1">Equipamento: {alert.equipment_name}</p>}
                      </div>
                    </div>

                    <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                      <div className="text-sm font-bold text-gray-700">
                        {alert.days_until < 0 ? `${Math.abs(alert.days_until)} dias atrasado` : alert.days_until === 0 ? 'Hoje' : `Em ${alert.days_until} dias`}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(alert.next_maintenance_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <button onClick={() => router.push('/tickets')} className="flex-1 sm:flex-none btn btn-secondary text-xs py-1.5 h-auto">Abrir Chamado</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="card card-hover flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.text}`} />
                  </div>
                  {index < 3 && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full cursor-default">OK</span>}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{card.value}</h3>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">{card.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts & Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Chart 1: Distribution */}
          <div className="card lg:col-span-1">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" /> Ordens de Serviço
            </h3>
            <div className="h-64 flex items-center justify-center">
              {stats.totalOrders > 0 ? (
                <Doughnut
                  data={{
                    labels: ['Pendentes', 'Andamento', 'Concluídas'],
                    datasets: [{ data: [stats.pendingOrders, stats.inProgressOrders, stats.completedOrders], backgroundColor: ['#F59E0B', '#6366F1', '#10B981'], borderWidth: 0 }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }}
                />
              ) : (
                <p className="text-sm text-gray-400">Sem dados registrados</p>
              )}
            </div>
          </div>

          {/* Chart 2: Activity */}
          <div className="card lg:col-span-2">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" /> Volume Recente
            </h3>
            <div className="h-64">
              <Bar
                data={{ labels: ['Semana', 'Mês', 'Total'], datasets: [{ label: 'Ordens', data: [stats.ordersThisWeek, stats.ordersThisMonth, stats.totalOrders], backgroundColor: ['#6366F1', '#F59E0B', '#10B981'], borderRadius: 6 }] }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } } }}
              />
            </div>
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
