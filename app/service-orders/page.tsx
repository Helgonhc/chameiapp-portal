'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Wrench, Clock, CheckCircle, Calendar, User, Plus, ArrowRight, ClipboardList,
  LayoutGrid, List as ListIcon, Search, AlertCircle
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface ServiceOrder {
  id: string;
  order_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  scheduled_at: string | null;
  completed_at: string | null;
  technician_id: string | null;
  final_cost: number | null;
  technician?: { full_name: string };
  equipments?: { name: string };
  clients?: { name: string; address: string };
}

export default function ServiceOrdersPage() {
  const router = useRouter();
  const { profile, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (isAuthenticated && profile?.client_id) {
      loadOrders();
    } else if (!loading && !isAuthenticated) {
      router.push('/login');
    }

    const channel = supabase.channel('service_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, () => loadOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, profile]);

  useEffect(() => {
    applyFilters();
  }, [orders, search, statusFilter]);

  async function loadOrders() {
    if (!profile?.client_id) return;
    try {
      setLoading(true);

      const { data, error } = await supabase.from('service_orders')
        .select(`
          *, 
          technician:profiles!service_orders_technician_id_fkey(full_name), 
          equipments(name),
          clients(name, address)
        `)
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
      toast.error('Erro ao carregar ordens');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let result = [...orders];

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(o =>
        o.title.toLowerCase().includes(term) ||
        o.order_number.toLowerCase().includes(term) ||
        o.description?.toLowerCase().includes(term) ||
        o.equipments?.name?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(o => {
        if (statusFilter === 'pending') return ['pending', 'pendente', 'scheduled', 'agendada'].includes(o.status);
        if (statusFilter === 'in_progress') return ['in_progress', 'em_andamento', 'aguardando_peca'].includes(o.status);
        if (statusFilter === 'completed') return ['completed', 'concluido', 'concluida'].includes(o.status);
        return o.status === statusFilter;
      });
    }

    setFilteredOrders(result);
  }

  function getStatusStyle(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      pendente: 'bg-amber-50 text-amber-700 border-amber-100',
      scheduled: 'bg-blue-50 text-blue-700 border-blue-100',
      agendada: 'bg-blue-50 text-blue-700 border-blue-100',
      in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-100 ring-indigo-500/20',
      em_andamento: 'bg-indigo-50 text-indigo-700 border-indigo-100 ring-indigo-500/20',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      concluido: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      cancelled: 'bg-red-50 text-red-700 border-red-100',
      cancelado: 'bg-red-50 text-red-700 border-red-100',
    };
    return styles[status] || 'bg-gray-50 text-gray-700 border-gray-100';
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: 'Pendente', pendente: 'Pendente',
      scheduled: 'Agendada', agendada: 'Agendada',
      in_progress: 'Em Andamento', em_andamento: 'Em Andamento',
      completed: 'Concluída', concluido: 'Concluída',
      cancelled: 'Cancelada', cancelado: 'Cancelada',
    };
    return labels[status] || status;
  }

  function getPriorityColor(priority: string) {
    const map: Record<string, string> = {
      low: 'text-gray-500 bg-gray-50', baixa: 'text-gray-500 bg-gray-50',
      medium: 'text-amber-600 bg-amber-50', media: 'text-amber-600 bg-amber-50',
      high: 'text-orange-600 bg-orange-50', alta: 'text-orange-600 bg-orange-50',
      urgent: 'text-red-600 bg-red-50 ring-1 ring-red-100', urgente: 'text-red-600 bg-red-50 ring-1 ring-red-100',
    };
    return map[priority] || 'text-gray-500 bg-gray-50';
  }

  const kanbanColumns = [
    {
      id: 'pendente',
      title: 'A Fazer',
      color: 'bg-slate-50 border-slate-200/60',
      icon: Clock,
      iconColor: 'text-slate-500',
      statuses: ['pending', 'pendente', 'scheduled', 'agendada']
    },
    {
      id: 'em_andamento',
      title: 'Em Execução',
      color: 'bg-indigo-50/30 border-indigo-100',
      icon: Wrench,
      iconColor: 'text-indigo-600',
      statuses: ['in_progress', 'em_andamento', 'aguardando_peca']
    },
    {
      id: 'concluido',
      title: 'Concluídas',
      color: 'bg-emerald-50/30 border-emerald-100',
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      statuses: ['completed', 'concluido', 'concluida']
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn h-[calc(100vh-140px)] flex flex-col">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ordens de Serviço</h1>
            <p className="text-slate-500 text-sm">Gerencie solicitações e acompanhe o progresso técnico.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100/80 p-1 rounded-2xl">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ListIcon size={18} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            <button onClick={() => router.push('/new-order')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2">
              <Plus size={18} />
              <span className="hidden sm:inline">Solicitar Serviço</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar por número, equipamento ou técnico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 text-slate-600 appearance-none cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">A Fazer</option>
            <option value="in_progress">Em Execução</option>
            <option value="completed">Concluídos</option>
          </select>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0">
          {filteredOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="p-4 bg-slate-50 rounded-full mb-4">
                <ClipboardList className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Nenhuma ordem encontrada</p>
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); }}
                className="text-indigo-600 text-sm font-medium hover:underline mt-2"
              >
                Limpar filtros
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* List View */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/service-orders/${order.id}`)}
                  className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100 transition-all cursor-pointer group flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <span className={`text-[10px] bg-slate-50 text-slate-400 font-mono px-2 py-1 rounded-lg`}>
                      #{order.order_number}
                    </span>
                  </div>

                  <div className="mb-4 flex-1">
                    <h3 className="font-bold text-slate-800 text-base mb-1 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                      {order.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {order.equipments?.name && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          <Wrench size={10} /> {order.equipments.name}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-bold uppercase ${getPriorityColor(order.priority)}`}>
                        <AlertCircle size={10} /> {order.priority === 'urgent' ? 'Urgente' : order.priority === 'high' ? 'Alta' : 'Normal'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Calendar size={12} />
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Kanban View */
            <div className="flex gap-4 overflow-x-hidden h-full pb-4">
              {kanbanColumns.map((col) => {
                const colOrders = filteredOrders.filter(o => col.statuses.includes(o.status));
                const Icon = col.icon;

                return (
                  <div key={col.id} className={`flex-shrink-0 w-80 lg:w-[22rem] flex flex-col h-full rounded-[2rem] bg-slate-50/50 border border-slate-200/50 backdrop-blur-sm`}>
                    {/* Column Header */}
                    <div className="p-4 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg bg-white shadow-sm ${col.iconColor}`}>
                          <Icon size={16} />
                        </div>
                        <h3 className="font-bold text-slate-700 text-sm tracking-tight">{col.title}</h3>
                      </div>
                      <span className="bg-white text-slate-400 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-100 shadow-sm">
                        {colOrders.length}
                      </span>
                    </div>

                    {/* Column Content */}
                    <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar">
                      {colOrders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => router.push(`/service-orders/${order.id}`)}
                          className="bg-white p-4 rounded-[1.2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 hover:-translate-y-0.5 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex gap-1.5">
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${getPriorityColor(order.priority)}`}>
                                {order.priority === 'urgent' ? 'Urgente' : 'Normal'}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-300">#{order.order_number}</span>
                          </div>

                          <h4 className="font-bold text-sm text-slate-800 mb-2 leading-relaxed group-hover:text-indigo-600 transition-colors">
                            {order.title}
                          </h4>

                          {order.equipments?.name && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3 bg-slate-50 px-2 py-1 rounded-lg w-fit">
                              <Wrench size={12} className="text-slate-400" />
                              <span className="truncate max-w-[150px]">{order.equipments.name}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
                            {order.technician && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                  {order.technician.full_name.charAt(0)}
                                </div>
                                <span className="text-[11px] text-slate-500 truncate max-w-[80px]">
                                  {order.technician.full_name.split(' ')[0]}
                                </span>
                              </div>
                            )}
                            <div className="text-[10px] font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                              Ver <ArrowRight size={10} />
                            </div>
                          </div>
                        </div>
                      ))}
                      {colOrders.length === 0 && (
                        <div className="py-12 text-center opacity-50">
                          <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                            <ClipboardList className="text-slate-300" size={20} />
                          </div>
                          <p className="text-xs font-semibold text-slate-400">Vazio</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
