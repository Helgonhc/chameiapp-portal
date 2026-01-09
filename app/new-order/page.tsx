'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, ArrowRight, X, CheckCircle2, Camera, Image as ImageIcon, Zap, Wrench, FileText, Sparkles, AlertTriangle, Clock } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';

interface Equipment { id: string; name: string; type: string; model: string }

export default function NewOrderPage() {
  const router = useRouter();
  const { profile, user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [activeCallType, setActiveCallType] = useState<'custom' | 'maintenance'>('custom');

  // Stats
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [equipmentId, setEquipmentId] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (profile?.client_id) {
      loadEquipments();
    }
  }, [profile]);

  async function loadEquipments() {
    if (!profile?.client_id) return;
    const { data } = await supabase.from('equipments').select('*').eq('client_id', profile.client_id).eq('status', 'ativo');
    setEquipments(data || []);
  }

  async function handleSubmit() {
    if (!profile?.client_id || !user?.id) {
      toast.error('Sessão inválida');
      return;
    }
    setLoading(true);
    try {
      await supabase.from('tickets').insert({
        client_id: profile.client_id,
        title, description, priority,
        status: 'aberto',
        equipment_id: equipmentId || null,
        created_by: user.id
        // Photos logic would go here
      });

      toast.success('Chamado aberto com sucesso!');
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao abrir chamado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-20 animate-fadeIn">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="p-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Novo Chamado</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`h-1.5 rounded-full w-8 ${step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              <div className={`h-1.5 rounded-full w-8 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              <div className={`h-1.5 rounded-full w-8 ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">

          {/* Steps Content */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Qual o tipo de problema?</h2>
                <p className="text-slate-500">Selecione a categoria que melhor se encaixa.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <button onClick={() => { setActiveCallType('custom'); setStep(2); }} className="group p-8 rounded-3xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/30 transition-all text-left relative">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <FileText size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Problema Geral</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Relatar um problema específico, dúvida ou solicitação avulsa.</p>
                </button>

                <button onClick={() => { setActiveCallType('maintenance'); setStep(2); }} className="group p-8 rounded-3xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/30 transition-all text-left relative">
                  <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <Wrench size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Manutenção</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">Solicitar manutenção periódica ou reparo em equipamento.</p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Descreva o problema</h2>
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full text-2xl font-bold placeholder:text-slate-300 border-0 border-b-2 border-slate-100 focus:border-indigo-500 focus:ring-0 px-0 py-2 bg-transparent transition-colors"
                  placeholder="Ex: Ar condicionado vazando..."
                  autoFocus
                />
              </div>

              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                className="w-full h-40 resize-none rounded-2xl bg-slate-50 border-0 p-6 text-slate-600 focus:ring-2 focus:ring-indigo-100"
                placeholder="Descreva detalhadamente o que está acontecendo..."
              />

              <div className="flex justify-end pt-4">
                <button onClick={() => setStep(3)} disabled={!title || !description} className="btn btn-primary px-8 py-4 rounded-xl shadow-lg shadow-indigo-200">
                  Continuar <ArrowRight size={20} className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Detalhes Finais</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="label-text mb-3 block">Prioridade</label>
                    <div className="flex gap-3">
                      {['baixa', 'media', 'alta'].map(p => (
                        <button
                          key={p}
                          onClick={() => setPriority(p as any)}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${priority === p ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label-text mb-3 block">Equipamento (Opcional)</label>
                    <select
                      value={equipmentId} onChange={e => setEquipmentId(e.target.value)}
                      className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Selecione...</option>
                      {equipments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <button onClick={handleSubmit} disabled={loading} className="w-full py-4 text-lg font-bold bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3">
                  {loading ? 'Processando...' : <><CheckCircle2 /> Finalizar Abertura</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
