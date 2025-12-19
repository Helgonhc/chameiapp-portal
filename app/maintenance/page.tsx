'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Calendar, Clock, AlertTriangle, CheckCircle, Bell, ChevronRight, Plus, User, Send, X, CalendarPlus } from 'lucide-react';

interface MaintenanceContract {
  id: string;
  title: string;
  description?: string;
  frequency: string;
  next_maintenance_date: string;
  last_maintenance_date?: string;
  status: string;
  maintenance_type_name?: string;
  maintenance_color?: string;
  urgency_status?: string;
  days_until_maintenance?: number;
  requested_by_name?: string;
}

interface MaintenanceRequest {
  id: string;
  request_number: string;
  title: string;
  description?: string;
  suggested_date: string;
  suggested_time_period: string;
  confirmed_date?: string;
  status: string;
  admin_notes?: string;
  requester_name?: string;
  maintenance_type_name?: string;
  maintenance_color?: string;
  created_at: string;
}

interface MaintenanceType {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export default function MaintenancePage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<MaintenanceContract[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<MaintenanceContract | null>(null);
  const [activeTab, setActiveTab] = useState<'contracts' | 'requests'>('contracts');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form state
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    maintenance_type_id: '',
    suggested_date: '',
    suggested_time_period: 'manha'
  });

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    
    setUserId(user.id);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('id', user.id)
      .single();
    
    if (!profile?.client_id) {
      setLoading(false);
      return;
    }
    
    setClientId(profile.client_id);
    await Promise.all([
      loadContracts(profile.client_id),
      loadRequests(profile.client_id),
      loadMaintenanceTypes()
    ]);
  }

  async function loadContracts(clientId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('active_maintenance_contracts')
        .select('*')
        .eq('client_id', clientId)
        .order('days_until_maintenance', { ascending: true });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Erro ao carregar manutenções:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRequests(clientId: string) {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests_with_details')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    }
  }

  async function loadMaintenanceTypes() {
    try {
      const { data, error } = await supabase
        .from('maintenance_types')
        .select('id, name, color, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMaintenanceTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
    }
  }

  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !userId) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .insert({
          client_id: clientId,
          requested_by: userId,
          title: requestForm.title,
          description: requestForm.description,
          maintenance_type_id: requestForm.maintenance_type_id || null,
          suggested_date: requestForm.suggested_date,
          suggested_time_period: requestForm.suggested_time_period,
          status: 'pendente'
        });

      if (error) throw error;
      
      alert('✅ Solicitação enviada! Aguarde a confirmação do admin.');
      setShowRequestModal(false);
      setRequestForm({ title: '', description: '', maintenance_type_id: '', suggested_date: '', suggested_time_period: 'manha' });
      loadRequests(clientId);
      setActiveTab('requests');
    } catch (error: any) {
      alert('Erro ao enviar solicitação: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcceptNewDate(requestId: string) {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: 'aceito' })
        .eq('id', requestId);

      if (error) throw error;
      alert('✅ Data aceita!');
      if (clientId) loadRequests(clientId);
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  }

  async function handleRejectNewDate(requestId: string) {
    if (!confirm('Deseja recusar a nova data sugerida?')) return;
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: 'recusado' })
        .eq('id', requestId);

      if (error) throw error;
      alert('Data recusada. Entre em contato para negociar.');
      if (clientId) loadRequests(clientId);
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  }

  async function handleCancelRequest(requestId: string) {
    if (!confirm('Deseja cancelar esta solicitação?')) return;
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: 'cancelado' })
        .eq('id', requestId);

      if (error) throw error;
      alert('Solicitação cancelada.');
      if (clientId) loadRequests(clientId);
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  }

  function formatDateBR(date: string | null): string {
    if (!date) return '--';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  function getUrgencyColor(status: string): string {
    switch (status) {
      case 'vencido': return 'bg-red-500';
      case 'urgente': return 'bg-amber-500';
      case 'proximo': return 'bg-blue-500';
      default: return 'bg-emerald-500';
    }
  }

  function getUrgencyLabel(status: string, days: number): string {
    if (status === 'vencido') return `Vencido (${Math.abs(days)} dias)`;
    if (status === 'urgente') return `Urgente (${days} dias)`;
    if (status === 'proximo') return `${days} dias`;
    return `${days} dias`;
  }

  function getFrequencyLabel(freq: string): string {
    const labels: Record<string, string> = {
      mensal: 'Mensal',
      bimestral: 'Bimestral',
      trimestral: 'Trimestral',
      semestral: 'Semestral',
      anual: 'Anual',
    };
    return labels[freq] || freq;
  }

  function getRequestStatusColor(status: string): string {
    switch (status) {
      case 'pendente': return 'bg-amber-500';
      case 'confirmado': return 'bg-emerald-500';
      case 'reagendado': return 'bg-blue-500';
      case 'aceito': return 'bg-emerald-500';
      case 'recusado': return 'bg-red-500';
      case 'cancelado': return 'bg-gray-500';
      case 'convertido': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  }

  function getRequestStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pendente: 'Aguardando',
      confirmado: 'Confirmado',
      reagendado: 'Nova Data',
      aceito: 'Aceito',
      recusado: 'Recusado',
      cancelado: 'Cancelado',
      convertido: 'Agendado'
    };
    return labels[status] || status;
  }

  function getTimePeriodLabel(period: string): string {
    const labels: Record<string, string> = {
      manha: 'Manhã',
      tarde: 'Tarde',
      qualquer: 'Qualquer horário'
    };
    return labels[period] || period;
  }

  // Estatísticas
  const vencidos = contracts.filter(c => c.urgency_status === 'vencido').length;
  const urgentes = contracts.filter(c => c.urgency_status === 'urgente').length;
  const proximos = contracts.filter(c => c.urgency_status === 'proximo').length;
  const pendingRequests = requests.filter(r => r.status === 'pendente' || r.status === 'reagendado').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Manutenções Preventivas</h1>
            <p className="text-gray-400">Acompanhe e solicite manutenções</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <CalendarPlus className="w-5 h-5" />
            Solicitar Manutenção
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="info-box info-box-red">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="text-2xl font-bold">{vencidos}</p>
              <p className="text-sm opacity-80">Vencidas</p>
            </div>
          </div>
          <div className="info-box info-box-yellow">
            <Clock className="w-6 h-6" />
            <div>
              <p className="text-2xl font-bold">{urgentes}</p>
              <p className="text-sm opacity-80">Urgentes</p>
            </div>
          </div>
          <div className="info-box info-box-blue">
            <Calendar className="w-6 h-6" />
            <div>
              <p className="text-2xl font-bold">{proximos}</p>
              <p className="text-sm opacity-80">Próximas</p>
            </div>
          </div>
          <div className="info-box info-box-green">
            <CheckCircle className="w-6 h-6" />
            <div>
              <p className="text-2xl font-bold">{contracts.length}</p>
              <p className="text-sm opacity-80">Total</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-surface rounded-xl p-2 border border-white/5">
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'contracts'
                ? 'bg-primary text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            📅 Agendadas ({contracts.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'requests'
                ? 'bg-primary text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            📝 Solicitações ({requests.length})
            {pendingRequests > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                {pendingRequests}
              </span>
            )}
          </button>
        </div>

        {/* Lista de Manutenções Agendadas */}
        {activeTab === 'contracts' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Suas Manutenções</h2>
            
            {contracts.length === 0 ? (
              <div className="empty-state">
                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Nenhuma manutenção programada</p>
                <button onClick={() => setShowRequestModal(true)} className="btn-primary">
                  Solicitar Manutenção
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="list-item cursor-pointer hover:bg-card-hover transition-colors"
                    onClick={() => setSelectedContract(contract)}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: contract.maintenance_color || '#6366f1' }}
                      >
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-white truncate">{contract.title}</h3>
                            <p className="text-sm text-gray-400">{contract.maintenance_type_name || 'Manutenção Preventiva'}</p>
                          </div>
                          <span className={`badge ${getUrgencyColor(contract.urgency_status || 'futuro')} text-white text-xs`}>
                            {getUrgencyLabel(contract.urgency_status || 'futuro', contract.days_until_maintenance || 0)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDateBR(contract.next_maintenance_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {getFrequencyLabel(contract.frequency)}
                          </span>
                          {contract.requested_by_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {contract.requested_by_name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lista de Solicitações */}
        {activeTab === 'requests' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Suas Solicitações</h2>
            
            {requests.length === 0 ? (
              <div className="empty-state">
                <Send className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Nenhuma solicitação enviada</p>
                <button onClick={() => setShowRequestModal(true)} className="btn-primary">
                  Solicitar Manutenção
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="list-item">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-500">{request.request_number}</span>
                          <span className={`badge ${getRequestStatusColor(request.status)} text-white text-xs`}>
                            {getRequestStatusLabel(request.status)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white">{request.title}</h3>
                        {request.description && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{request.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="bg-background rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Data Sugerida</p>
                        <p className="font-semibold text-white">{formatDateBR(request.suggested_date)}</p>
                        <p className="text-xs text-gray-400">{getTimePeriodLabel(request.suggested_time_period)}</p>
                      </div>
                      {request.confirmed_date && (
                        <div className="bg-background rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">
                            {request.status === 'confirmado' ? 'Data Confirmada' : 'Nova Data Sugerida'}
                          </p>
                          <p className="font-semibold text-primary">{formatDateBR(request.confirmed_date)}</p>
                        </div>
                      )}
                    </div>

                    {request.admin_notes && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3">
                        <p className="text-xs text-blue-400 font-medium mb-1">Observação do Admin:</p>
                        <p className="text-sm text-gray-300">{request.admin_notes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {request.requester_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {request.requester_name}
                          </span>
                        )}
                        <span>{new Date(request.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {request.status === 'reagendado' && (
                          <>
                            <button
                              onClick={() => handleAcceptNewDate(request.id)}
                              className="btn-primary text-xs px-3 py-1.5"
                            >
                              ✓ Aceitar
                            </button>
                            <button
                              onClick={() => handleRejectNewDate(request.id)}
                              className="btn-danger text-xs px-3 py-1.5"
                            >
                              ✗ Recusar
                            </button>
                          </>
                        )}
                        {request.status === 'pendente' && (
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de Detalhes */}
        {selectedContract && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedContract(null)}>
            <div className="card max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: selectedContract.maintenance_color || '#6366f1' }}
                >
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{selectedContract.title}</h2>
                  <p className="text-gray-400">{selectedContract.maintenance_type_name}</p>
                </div>
                <span className={`badge ${getUrgencyColor(selectedContract.urgency_status || 'futuro')} text-white`}>
                  {getUrgencyLabel(selectedContract.urgency_status || 'futuro', selectedContract.days_until_maintenance || 0)}
                </span>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Próxima Manutenção</p>
                  <p className="text-lg font-bold text-primary">{formatDateBR(selectedContract.next_maintenance_date)}</p>
                </div>
                <div className="bg-background rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Última Manutenção</p>
                  <p className="text-lg font-bold text-white">{formatDateBR(selectedContract.last_maintenance_date || null)}</p>
                </div>
              </div>

              {/* Frequência */}
              <div className="bg-background rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-400 mb-1">Frequência</p>
                <p className="text-lg font-semibold text-white">{getFrequencyLabel(selectedContract.frequency)}</p>
              </div>

              {/* Descrição */}
              {selectedContract.description && (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Descrição</p>
                  <p className="text-gray-300">{selectedContract.description}</p>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-medium">Alertas Automáticos</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Você receberá lembretes 30, 15 e 7 dias antes da data de manutenção.
                    </p>
                  </div>
                </div>
              </div>

              {/* Solicitado por */}
              {selectedContract.requested_by_name && (
                <div className="bg-background rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-400 mb-1">Solicitado por</p>
                  <p className="text-lg font-semibold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    {selectedContract.requested_by_name}
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-medium">Alertas Automáticos</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Você receberá lembretes 30, 15 e 7 dias antes da data de manutenção.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão Fechar */}
              <button
                onClick={() => setSelectedContract(null)}
                className="btn-secondary w-full"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Modal de Solicitação */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowRequestModal(false)}>
            <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <CalendarPlus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Solicitar Manutenção</h2>
                    <p className="text-sm text-gray-400">Sugira uma data para sua manutenção</p>
                  </div>
                </div>
                <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    value={requestForm.title}
                    onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                    placeholder="Ex: Manutenção preventiva ar condicionado"
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Tipo de Manutenção</label>
                  <select
                    value={requestForm.maintenance_type_id}
                    onChange={(e) => setRequestForm({ ...requestForm, maintenance_type_id: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Selecione (opcional)</option>
                    {maintenanceTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Descrição</label>
                  <textarea
                    value={requestForm.description}
                    onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                    placeholder="Descreva o que precisa ser feito..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="form-label">Data Sugerida *</label>
                  <input
                    type="date"
                    value={requestForm.suggested_date}
                    onChange={(e) => setRequestForm({ ...requestForm, suggested_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Período Preferido</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'manha', label: 'Manhã', emoji: '🌅' },
                      { key: 'tarde', label: 'Tarde', emoji: '☀️' },
                      { key: 'qualquer', label: 'Qualquer', emoji: '📅' }
                    ].map((period) => (
                      <button
                        key={period.key}
                        type="button"
                        onClick={() => setRequestForm({ ...requestForm, suggested_time_period: period.key })}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          requestForm.suggested_time_period === period.key
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10 hover:border-white/20 bg-surface'
                        }`}
                      >
                        <div className="text-xl mb-1">{period.emoji}</div>
                        <div className="text-xs font-semibold text-white">{period.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-sm text-amber-400">
                    💡 Após enviar, o admin irá analisar e confirmar ou sugerir uma nova data.
                    Você será notificado para aceitar ou recusar.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    disabled={submitting}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !requestForm.title || !requestForm.suggested_date}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Solicitação
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
