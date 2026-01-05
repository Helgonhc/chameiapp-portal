'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Wrench, Clock, CheckCircle, XCircle, Calendar, User, Plus, ArrowRight, ClipboardList,
  LayoutGrid, List as ListIcon, Map as MapIcon, Search, Filter, Timer, Eye, Copy
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AdvancedSearch, { SearchFilters } from '@/components/AdvancedSearch';
import toast from 'react-hot-toast';

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
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadOrders();
    const channel = supabase.channel('service_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, () => loadOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, search, statusFilter]);

  async function loadOrders() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single();
      if (!profile?.client_id) return;

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

    // Text Search
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(o =>
        o.title.toLowerCase().includes(term) ||
        o.order_number.toLowerCase().includes(term) ||
        o.description?.toLowerCase().includes(term) ||
        o.equipments?.name?.toLowerCase().includes(term)
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(o => {
        if (statusFilter === 'pending') return ['pending', 'pendente'].includes(o.status);
        if (statusFilter === 'in_progress') return ['in_progress', 'em_andamento'].includes(o.status);
        if (statusFilter === 'completed') return ['completed', 'concluido', 'concluida'].includes(o.status);
        return o.status === statusFilter;
      });
    }

    setFilteredOrders(result);
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200', pendente: 'bg-amber-100 text-amber-800 border-amber-200',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200', agendada: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200', em_andamento: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200', concluido: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200', cancelado: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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
      low: 'text-gray-500 bg-gray-100', baixa: 'text-gray-500 bg-gray-100',
      medium: 'text-amber-600 bg-amber-50', media: 'text-amber-600 bg-amber-50',
      high: 'text-orange-600 bg-orange-50', alta: 'text-orange-600 bg-orange-50',
      urgent: 'text-red-600 bg-red-50', urgente: 'text-red-600 bg-red-50',
    };
    return map[priority] || 'text-gray-500 bg-gray-50';
  }

  function getPriorityLabel(priority: string) {
    const map: Record<string, string> = {
      low: 'Baixa', baixa: 'Baixa',
      medium: 'Média', media: 'Média',
      high: 'Alta', alta: 'Alta',
      urgent: 'Urgente', urgente: 'Urgente',
    };
    return map[priority] || priority;
  }

  const kanbanColumns = [
    { id: 'pendente', title: 'Pendentes', color: 'bg-gray-100', statuses: ['pending', 'pendente', 'scheduled', 'agendada'] },
    { id: 'em_andamento', title: 'Em Andamento', color: 'bg-blue-50', statuses: ['in_progress', 'em_andamento', 'aguardando_peca'] },
    { id: 'concluido', title: 'Concluídas', color: 'bg-emerald-50', statuses: ['completed', 'concluido', 'concluida'] },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 spinner mb-4"></div>
            <p className="text-gray-500 font-medium">Carregando ordens...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn h-full flex flex-col">
        {/* Header - Admin Style */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Minhas Ordens de Serviço</h1>
            <p className="text-gray-500">{orders.length} ordens registradas no total</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Visualização em Lista"
              >
                <ListIcon size={20} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Visualização em Quadro"
              >
                <LayoutGrid size={20} />
              </button>
            </div>

            <button onClick={() => router.push('/new-order')} className="btn btn-primary shadow-lg shadow-indigo-200">
              <Plus size={20} />
              <span>Nova OS</span>
            </button>
          </div>
        </div>

        {/* Filters - Admin Style */}
        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Buscar por título, número ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluída</option>
          </select>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">Nenhuma ordem encontrada</p>
              <button onClick={() => { setSearch(''); setStatusFilter('all'); }} className="text-indigo-600 text-sm hover:underline mt-2">
                Limpar filtros
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* List View - Admin Style Grid */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/service-orders/${order.id}`)}
                  className="card card-hover flex flex-col group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getPriorityColor(order.priority)}`}>
                      {getPriorityLabel(order.priority)}
                    </span>
                  </div>

                  <div className="mb-3">
                    <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {order.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      #{order.order_number}
                    </p>
                  </div>

                  {order.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 bg-gray-50 p-2 rounded-lg italic border border-gray-100">
                      {order.description}
                    </p>
                  )}

                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={12} />
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    {order.final_cost && (
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-600">R$ {order.final_cost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Kanban View (Read-Only) - Admin Style */
            <div className="flex gap-4 overflow-x-auto pb-4 h-full">
              {kanbanColumns.map((col) => {
                const colOrders = filteredOrders.filter(o => col.statuses.includes(o.status));

                return (
                  <div key={col.id} className={`flex-shrink-0 w-80 flex flex-col h-full rounded-2xl ${col.color} border border-transparent`}>
                    {/* Column Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${col.id === 'pendente' ? 'bg-amber-500' : col.id === 'em_andamento' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">{col.title}</h3>
                      </div>
                      <span className="bg-white text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {colOrders.length}
                      </span>
                    </div>

                    {/* Column Content */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                      {colOrders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => router.push(`/service-orders/${order.id}`)}
                          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityColor(order.priority)}`}>
                              {getPriorityLabel(order.priority)}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">#{order.order_number}</span>
                          </div>

                          <h4 className="font-bold text-sm text-gray-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                            {order.title}
                          </h4>

                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-3">
                            {order.equipments?.name && (
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Wrench size={10} /> {order.equipments.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <User size={12} />
                              <span className="truncate max-w-[80px]">{(order.technician?.full_name || 'N/A').split(' ')[0]}</span>
                            </div>
                            <div className="text-xs font-medium text-gray-400 group-hover:text-indigo-600 flex items-center gap-0.5 transition-colors">
                              Detalhes <ArrowRight size={12} />
                            </div>
                          </div>
                        </div>
                      ))}
                      {colOrders.length === 0 && (
                        <div className="py-8 text-center bg-white/50 rounded-xl border border-dashed border-gray-300">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Vazio</p>
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
