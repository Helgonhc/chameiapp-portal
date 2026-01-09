'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar, Clock, Wrench, AlertTriangle, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  client_id: string;
  service_type: string;
  title: string;
  description?: string;
  requested_date: string;
  requested_time_start?: string;
  status: string;
  clients?: { name: string };
}

interface MaintenanceContract {
  id: string;
  title: string;
  next_maintenance_date: string;
  last_maintenance_date: string | null;
  frequency: string;
  urgency_status: string;
  maintenance_type_name: string | null;
  maintenance_color: string | null;
  client_name: string;
  days_until_maintenance: number;
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'orders', 'maintenance', 'appointments'
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '09:00',
  });
  const [saving, setSaving] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single();
      if (!profile?.client_id) return;
      setClientId(profile.client_id);

      const start = startOfMonth(currentMonth);
      const futureLimit = addMonths(start, 6);

      const [appointmentsRes, ordersRes, maintenancesRes] = await Promise.all([
        supabase
          .from('appointment_requests')
          .select('*, clients(name)')
          .eq('client_id', profile.client_id)
          .gte('requested_date', format(start, 'yyyy-MM-dd'))
          .lte('requested_date', format(futureLimit, 'yyyy-MM-dd'))
          .order('requested_date'),
        supabase
          .from('service_orders')
          .select('*, clients(name)')
          .eq('client_id', profile.client_id)
          .gte('scheduled_at', format(start, 'yyyy-MM-dd'))
          .lte('scheduled_at', format(futureLimit, 'yyyy-MM-dd'))
          .not('scheduled_at', 'is', null)
          .order('scheduled_at'),
        supabase
          .from('active_maintenance_contracts')
          .select('id, title, client_id, next_maintenance_date, last_maintenance_date, frequency, urgency_status, maintenance_type_name, maintenance_color, client_name, days_until_maintenance')
          .eq('client_id', profile.client_id)
          .gte('next_maintenance_date', format(start, 'yyyy-MM-dd'))
          .lte('next_maintenance_date', format(futureLimit, 'yyyy-MM-dd')),
      ]);

      setAppointments(appointmentsRes.data || []);
      setOrders(ordersRes.data || []);

      const filteredMaintenances = (maintenancesRes.data || []).filter(m => {
        const hasOrder = (ordersRes.data || []).some(o =>
          o.maintenance_contract_id === m.id &&
          o.scheduled_at?.split('T')[0] === m.next_maintenance_date
        );
        const hasApp = (appointmentsRes.data || []).some(a =>
          a.client_id === m.client_id &&
          a.requested_date === m.next_maintenance_date
        );
        return !hasOrder && !hasApp;
      }).map(m => ({ ...m, status: 'pending' }));

      setMaintenances(filteredMaintenances);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAppointments = filters.type === 'all' || filters.type === 'appointments'
      ? appointments.filter(a => a.requested_date === dateStr)
      : [];
    const dayOrders = filters.type === 'all' || filters.type === 'orders'
      ? orders.filter(o => o.scheduled_at?.split('T')[0] === dateStr)
      : [];
    const dayMaintenances = filters.type === 'all' || filters.type === 'maintenance'
      ? maintenances.filter(m => m.next_maintenance_date === dateStr)
      : [];
    return [
      ...dayAppointments.map(a => ({ ...a, type: 'appointment' })),
      ...dayOrders.map(o => ({ ...o, type: 'order' })),
      ...dayMaintenances.map(m => ({ ...m, type: 'maintenance' }))
    ];
  };

  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];
  const monthMaintenances = maintenances.length;
  const urgentMaintenances = maintenances.filter(m => m.urgency_status === 'vencido' || m.urgency_status === 'urgente').length;

  function openModal(date?: Date) {
    setFormData({
      title: '',
      description: '',
      scheduled_date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      scheduled_time: '09:00',
    });
    setShowModal(true);
  }

  async function handleCreate() {
    if (!clientId || !formData.title || !formData.scheduled_date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('appointment_requests').insert([{
        client_id: clientId,
        title: formData.title,
        service_type: formData.title,
        description: formData.description,
        requested_date: formData.scheduled_date,
        requested_time_start: formData.scheduled_time,
        status: 'pending',
      }]);
      if (error) throw error;
      toast.success('Solicitação enviada!');
      setShowModal(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Agenda Operacional</h1>
            <p className="text-gray-500">
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}>
              <Filter size={18} />
              Filtros
            </button>
            <button onClick={() => openModal()} className="btn btn-primary">
              <Plus size={20} />
              Solicitar Agendamento
            </button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="card p-4 animate-fadeIn bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Filtrar por Tipo</h3>
              {filters.type !== 'all' && (
                <button onClick={() => setFilters({ type: 'all' })} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <X size={14} /> Limpar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilters({ type: 'all' })} className={`btn btn-sm ${filters.type === 'all' ? 'btn-primary' : 'btn-secondary'}`}>
                Todos
              </button>
              <button onClick={() => setFilters({ type: 'orders' })} className={`btn btn-sm ${filters.type === 'orders' ? 'bg-amber-500 text-white' : 'btn-secondary'}`}>
                📋 Ordens de Serviço
              </button>
              <button onClick={() => setFilters({ type: 'maintenance' })} className={`btn btn-sm ${filters.type === 'maintenance' ? 'bg-purple-500 text-white' : 'btn-secondary'}`}>
                🔧 Manutenções
              </button>
              <button onClick={() => setFilters({ type: 'appointments' })} className={`btn btn-sm ${filters.type === 'appointments' ? 'bg-blue-500 text-white' : 'btn-secondary'}`}>
                📅 Agendamentos
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {monthMaintenances > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 border-l-4 border-l-purple-500 bg-white rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{monthMaintenances}</p>
                  <p className="text-sm text-gray-500">Manutenções no mês</p>
                </div>
              </div>
            </div>
            {urgentMaintenances > 0 && (
              <div className="card p-4 border-l-4 border-l-red-500 bg-white rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{urgentMaintenances}</p>
                    <p className="text-sm text-gray-500">Urgentes/Vencidas</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
              <h2 className="text-lg font-semibold text-gray-800 capitalize">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-gray-600">Ordens</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500" /><span className="text-gray-600">Manutenções</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-gray-600">Minhas Solicitações</span></div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (<div key={`empty-${i}`} className="aspect-square" />))}
              {days.map((day) => {
                const events = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasOrder = events.some(e => e.type === 'order');
                const hasMaintenance = events.some(e => e.type === 'maintenance');
                const hasAppointment = events.some(e => e.type === 'appointment');

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square p-1 rounded-lg text-sm transition-all relative flex flex-col items-center justify-center ${isSelected ? 'bg-indigo-600 text-white shadow-md transform scale-105' : isToday ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' : 'hover:bg-gray-50'}`}
                  >
                    <span className="block">{format(day, 'd')}</span>
                    {events.length > 0 && (
                      <div className="flex justify-center gap-0.5 mt-1">
                        {hasOrder && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`} />}
                        {hasMaintenance && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-purple-300' : 'bg-purple-500'}`} />}
                        {hasAppointment && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-300' : 'bg-indigo-500'}`} />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Events */}
          <div className="card h-fit sticky top-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            {!selectedEvent ? (
              <>
                <h3 className="font-semibold text-gray-800 mb-4">{selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: ptBR }) : 'Próximos Eventos'}</h3>
                {selectedDate && (
                  <button onClick={() => openModal(selectedDate)} className="w-full btn btn-secondary mb-4 flex justify-center gap-2 items-center hover:bg-slate-100 py-2 rounded-lg">
                    <Plus size={18} /> Solicitar neste dia
                  </button>
                )}

                <div className="space-y-3">
                  {/* Logic to show list */}
                  {(() => {
                    const list = (!selectedDate ? [
                      ...appointments.map(a => ({ ...a, type: 'appointment' })),
                      ...orders.map(o => ({ ...o, type: 'order' })),
                      ...maintenances.map(m => ({ ...m, type: 'maintenance' }))
                    ].filter(e => {
                      const date = e.requested_date || e.scheduled_at?.split('T')[0] || e.next_maintenance_date;
                      return date >= format(new Date(), 'yyyy-MM-dd');
                    }).sort((a, b) => {
                      const dateA = a.requested_date || a.scheduled_at?.split('T')[0] || a.next_maintenance_date;
                      const dateB = b.requested_date || b.scheduled_at?.split('T')[0] || b.next_maintenance_date;
                      return dateA.localeCompare(dateB);
                    }).slice(0, 10) : selectedDateEvents);

                    if (list.length === 0) return <p className="text-gray-500 text-sm text-center py-4">{selectedDate ? 'Nenhum evento neste dia' : 'Nenhuma atividade futura'}</p>;

                    return list.map((event: any) => (
                      <div key={event.id} onClick={() => setSelectedEvent(event)} className={`block p-3 rounded-lg border-l-4 hover:shadow-md transition-shadow cursor-pointer bg-white border border-gray-100 ${event.type === 'order' ? 'border-l-amber-500' : event.type === 'maintenance' ? 'border-l-purple-500' : 'border-l-indigo-500'
                        }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${event.type === 'order' ? 'bg-amber-100 text-amber-800' : event.type === 'maintenance' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                              }`}>{event.type === 'order' ? 'OS' : event.type === 'maintenance' ? 'MANUT' : 'AGEND'}</span>
                            {!selectedDate && <span className="text-[10px] text-gray-500 font-medium">{format(new Date(event.requested_date || event.scheduled_at || event.next_maintenance_date), 'dd/MM')}</span>}
                          </div>
                        </div>
                        <p className="font-semibold text-gray-800 text-sm truncate">{event.type === 'maintenance' ? (event.maintenance_type_name || event.title) : (event.title || event.service_type)}</p>
                      </div>
                    ));
                  })()}
                </div>
              </>
            ) : (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setSelectedEvent(null)} className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1"><ChevronLeft size={16} /> Voltar</button>
                  <span className="text-xs px-2 py-1 rounded font-bold uppercase bg-gray-100 text-gray-600">{selectedEvent.status}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 leading-tight mb-2">{selectedEvent.type === 'maintenance' ? (selectedEvent.maintenance_type_name || selectedEvent.title) : (selectedEvent.title || selectedEvent.service_type)}</h3>
                <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Data:</span> <span className="font-medium">{selectedEvent.requested_date || selectedEvent.scheduled_at?.split('T')[0] || selectedEvent.next_maintenance_date}</span></div>
                  {selectedEvent.description && <div className="pt-2 text-gray-600 text-xs italic border-t border-gray-200 mt-2">{selectedEvent.description}</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">Solicitar Agendamento</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Título / Serviço</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-colors" placeholder="Ex: Manutenção Preventiva" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-gray-700 mb-1">Data Preferencial</label><input type="date" value={formData.scheduled_date} onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500" /></div>
                  <div><label className="block text-xs font-semibold text-gray-700 mb-1">Horário (Opcional)</label><input type="time" value={formData.scheduled_time} onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500" /></div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Observações</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 min-h-[80px]" placeholder="Descreva sua necessidade..." />
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-medium transition-colors">Cancelar</button>
                <button onClick={handleCreate} disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Enviar Solicitação
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
