'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import DashboardLayout from '../../components/DashboardLayout';
import { Calendar, Clock, AlertTriangle, CheckCircle, Bell, Mail, MessageCircle, ChevronRight } from 'lucide-react';

interface MaintenanceContract {
  id: string;
  title: string;
  description?: string;
  frequency: string;
  next_maintenance_date: string;
  last_maintenance_date?: string;
  status: string;
  maintenance_types?: { name: string; color: string };
  urgency_status?: string;
  days_until_maintenance?: number;
}

export default function MaintenancePage() {
  const { profile } = useAuthStore();
  const [contracts, setContracts] = useState<MaintenanceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<MaintenanceContract | null>(null);

  useEffect(() => {
    if (profile?.client_id) {
      loadContracts();
    }
  }, [profile]);

  async function loadContracts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('active_maintenance_contracts')
        .select('*')
        .eq('client_id', profile?.client_id)
        .order('days_until_maintenance', { ascending: true });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Erro ao carregar manutenções:', error);
    } finally {
      setLoading(false);
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

  // Estatísticas
  const vencidos = contracts.filter(c => c.urgency_status === 'vencido').length;
  const urgentes = contracts.filter(c => c.urgency_status === 'urgente').length;
  const proximos = contracts.filter(c => c.urgency_status === 'proximo').length;

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
        <div className="page-header">
          <h1 className="text-2xl font-bold text-white">Manutenções Preventivas</h1>
          <p className="text-gray-400">Acompanhe suas manutenções programadas</p>
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

        {/* Lista de Manutenções */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Suas Manutenções</h2>
          
          {contracts.length === 0 ? (
            <div className="empty-state">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma manutenção programada</p>
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
                    {/* Ícone com cor */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: contract.maintenance_types?.color || '#6366f1' }}
                    >
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white truncate">{contract.title}</h3>
                          <p className="text-sm text-gray-400">{contract.maintenance_types?.name || 'Manutenção Preventiva'}</p>
                        </div>
                        <span className={`badge ${getUrgencyColor(contract.urgency_status || 'futuro')} text-white text-xs`}>
                          {getUrgencyLabel(contract.urgency_status || 'futuro', contract.days_until_maintenance || 0)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateBR(contract.next_maintenance_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getFrequencyLabel(contract.frequency)}
                        </span>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Detalhes */}
        {selectedContract && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedContract(null)}>
            <div className="card max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: selectedContract.maintenance_types?.color || '#6366f1' }}
                >
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{selectedContract.title}</h2>
                  <p className="text-gray-400">{selectedContract.maintenance_types?.name}</p>
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
      </div>
    </DashboardLayout>
  );
}
