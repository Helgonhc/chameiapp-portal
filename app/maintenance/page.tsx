'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Calendar, Clock, AlertTriangle, CheckCircle, Bell, ChevronRight, Plus, User, Send, X, CalendarPlus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MaintenancePage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'contracts' | 'requests'>('contracts');
  const [showModal, setShowModal] = useState(false);

  // Dummy data loader for structure - in real usage would connect to prop logic
  useEffect(() => {
    if (profile?.client_id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  async function loadData() {
    if (!profile?.client_id) return;
    try {
      const [cRes, rRes] = await Promise.all([
        supabase.from('active_maintenance_contracts').select('*').eq('client_id', profile.client_id),
        supabase.from('maintenance_requests_with_details').select('*').eq('client_id', profile.client_id)
      ]);

      setContracts(cRes.data || []);
      setRequests(rRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    if (status === 'vencido') return <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-lg text-xs font-bold border border-red-100">Vencido</span>;
    if (status === 'urgente') return <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg text-xs font-bold border border-amber-100">Urgente</span>;
    return <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg text-xs font-bold border border-emerald-100">Em dia</span>;
  }

  if (loading) return <DashboardLayout><div className="flex justify-center p-20"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-20 animate-fadeIn space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <WrenchIcon />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Manutenções</h1>
              <p className="text-slate-500 text-sm">Controle preventivo e solicitações.</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
            <CalendarPlus size={20} /> Nova Solicitação
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Vencidas', value: contracts.filter(c => c.urgency_status === 'vencido').length, color: 'text-red-600 bg-red-50' },
            { label: 'Urgentes', value: contracts.filter(c => c.urgency_status === 'urgente').length, color: 'text-amber-600 bg-amber-50' },
            { label: 'Próximas', value: contracts.filter(c => c.urgency_status === 'proximo').length, color: 'text-blue-600 bg-blue-50' },
            { label: 'Total', value: contracts.length, color: 'text-emerald-600 bg-emerald-50' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className={`text-3xl font-bold mb-1 ${stat.color.split(' ')[0]}`}>{stat.value}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.color}`}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-200 pb-1">
          <button onClick={() => setActiveTab('contracts')} className={`px-4 py-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'contracts' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            Manutenções Programadas
          </button>
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'requests' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            Solicitações ({requests.length})
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {activeTab === 'contracts' ? (
            contracts.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{c.title}</h3>
                    <p className="text-slate-500 text-sm">{c.maintenance_type_name} • {new Date(c.next_maintenance_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(c.urgency_status)}
                  <p className="text-xs text-slate-400 font-medium">Frequência: {c.frequency}</p>
                </div>
              </div>
            ))
          ) : (
            requests.map(r => (
              <div key={r.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{r.request_number}</span>
                    <h3 className="font-bold text-slate-800">{r.title}</h3>
                  </div>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase tracking-wider">{r.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-50 p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Data Sugerida</p>
                    <p className="text-slate-700 font-semibold">{new Date(r.suggested_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Período</p>
                    <p className="text-slate-700 font-semibold capitalize">{r.suggested_time_period}</p>
                  </div>
                </div>
              </div>
            ))
          )}

          {((activeTab === 'contracts' && contracts.length === 0) || (activeTab === 'requests' && requests.length === 0)) && (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <p className="text-slate-400">Nenhum registro encontrado nesta aba.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function WrenchIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
}
