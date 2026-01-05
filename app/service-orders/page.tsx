'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Wrench, Clock, CheckCircle, XCircle, Calendar, User, Plus, ArrowRight, ClipboardList } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AdvancedSearch, { SearchFilters } from '@/components/AdvancedSearch';

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
estimated_cost: number | null;
final_cost: number | null;
technician ?: { full_name: string };
equipments ?: { name: string };
}

export default function ServiceOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);

  useEffect(() => {
    checkAuth();
    loadOrders();
    const channel = supabase.channel('service_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, () => loadOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { applyFilters(); }, [orders, filter, searchFilters]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) router.push('/login');
  }

  async function loadOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single();
      if (!profile?.client_id) return;
      const { data, error } = await supabase.from('service_orders')
        .select(`*, technician:profiles!service_orders_technician_id_fkey(full_name), equipments(name)`)
        .eq('client_id', profile.client_id).order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []); setFilteredOrders(data || []);
    } catch (error) { console.error('Erro ao carregar ordens:', error); }
    finally { setLoading(false); }
  }

  function applyFilters() {
    let filtered = [...orders];
    if (filter !== 'all') {
      filtered = filtered.filter(o => {
        if (filter === 'pending') return o.status === 'pending' || o.status === 'pendente';
        if (filter === 'in_progress') return o.status === 'in_progress' || o.status === 'em_andamento';
        if (filter === 'completed') return o.status === 'completed' || o.status === 'concluido' || o.status === 'concluida';
        return o.status === filter;
      });
    }
    if (searchFilters) {
      if (searchFilters.searchTerm) {
        const term = searchFilters.searchTerm.toLowerCase();
        filtered = filtered.filter(o => o.title.toLowerCase().includes(term) || o.order_number.toLowerCase().includes(term) || o.description?.toLowerCase().includes(term));
      }
      if (searchFilters.status) filtered = filtered.filter(o => o.status === searchFilters.status);
      if (searchFilters.priority) filtered = filtered.filter(o => o.priority === searchFilters.priority);
      if (searchFilters.dateFrom) filtered = filtered.filter(o => new Date(o.created_at) >= new Date(searchFilters.dateFrom!));
      if (searchFilters.dateTo) filtered = filtered.filter(o => new Date(o.created_at) <= new Date(searchFilters.dateTo!));
      if (searchFilters.minValue !== undefined) filtered = filtered.filter(o => o.final_cost && o.final_cost >= searchFilters.minValue!);
      if (searchFilters.maxValue !== undefined) filtered = filtered.filter(o => o.final_cost && o.final_cost <= searchFilters.maxValue!);
      if (searchFilters.technician) {
        const tech = searchFilters.technician.toLowerCase();
        filtered = filtered.filter(o => o.technician?.full_name.toLowerCase().includes(tech));
      }
    }
    setFilteredOrders(filtered);
  }

  function handleSearch(filters: SearchFilters) { setSearchFilters(filters); setFilter('all'); }
  function handleClearSearch() { setSearchFilters(null); setFilter('all'); }

  function getStatusColor(status: string) {
    // Light Theme Status Colors
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200', pendente: 'bg-amber-100 text-amber-800 border-amber-200',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200', agendada: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200', em_andamento: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      paused: 'bg-orange-100 text-orange-800 border-orange-200', pausada: 'bg-orange-100 text-orange-800 border-orange-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200', concluido: 'bg-emerald-100 text-emerald-800 border-emerald-200', concluida: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200', cancelado: 'bg-red-100 text-red-800 border-red-200', cancelada: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: 'Pendente', pendente: 'Pendente', scheduled: 'Agendada', agendada: 'Agendada',
      in_progress: 'Em Andamento', em_andamento: 'Em Andamento', paused: 'Pausada', pausada: 'Pausada',
      completed: 'Concluída', concluido: 'Concluída', concluida: 'Concluída',
      cancelled: 'Cancelada', cancelado: 'Cancelada', cancelada: 'Cancelada',
    };
    return labels[status] || status;
  }

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
      <div className="animate-fadeIn">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Ordens de Serviço</h1>
            <p className="text-gray-500 text-responsive">{orders.length} ordens registradas no total</p>
          </div>
          <button onClick={() => router.push('/new-order')} className="btn btn-primary self-start sm:self-center shadow-lg shadow-indigo-200 text-sm">
            <Plus className="w-4 h-4" />
            <span>Nova Ordem</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <AdvancedSearch type="orders" onSearch={handleSearch} onClear={handleClearSearch} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-1 overflow-x-auto flex-nowrap sm:flex-wrap scrollbar-hide">
          {[
            { key: 'all', label: 'Todas', count: orders.length },
            { key: 'pending', label: 'Pendentes', count: orders.filter(o => o.status === 'pending' || o.status === 'pendente').length },
            { key: 'in_progress', label: 'Em Andamento', count: orders.filter(o => o.status === 'in_progress' || o.status === 'em_andamento').length },
            { key: 'completed', label: 'Concluídas', count: orders.filter(o => o.status === 'completed' || o.status === 'concluido' || o.status === 'concluida').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`
                px-4 py-2 rounded-t-lg text-sm font-medium transition-colors relative top-[1px]
                ${filter === tab.key
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {tab.label} <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${filter === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Nenhuma ordem encontrada</h3>
              <p className="text-gray-500 text-sm">Tente ajustar os filtros ou crie uma nova ordem.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/service-orders/${order.id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-xs text-gray-400 font-medium">#{order.order_number}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors truncate">
                      {order.title}
                    </h3>
                    {order.description && (
                      <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                        {order.description}
                      </p>
                    )}

                    {order.equipments?.name && (
                      <div className="mb-3">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded inline-flex items-center gap-1">
                          <Wrench size={12} /> {order.equipments.name}
                        </span>
                      </div>
                    )}


                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {order.technician && (
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-gray-400" />
                          {order.technician.full_name}
                        </div>
                      )}
                      {order.scheduled_at && (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(order.scheduled_at).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 min-w-[120px]">
                    {order.final_cost && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-0.5">Valor Total</p>
                        <p className="text-lg font-bold text-emerald-600">
                          R$ {order.final_cost.toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 text-sm font-medium flex items-center gap-1">
                      Detalhes <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
