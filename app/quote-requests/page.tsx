'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Plus, Calendar, ChevronRight, Camera, Search } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';

interface QuoteRequest {
  id: string
  request_number: string
  title: string
  description: string
  urgency: string
  status: string
  photos: string[]
  created_at: string
}

export default function QuoteRequestsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<QuoteRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)

  // Modal State
  const [newRequest, setNewRequest] = useState({ title: '', description: '', urgency: 'normal' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadRequests() }, [])

  async function loadRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).maybeSingle()
      if (!profile?.client_id) return

      const { data } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })

      setRequests(data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!newRequest.title) return toast.error('Título obrigatório');
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single();

      await supabase.from('quote_requests').insert({
        client_id: profile.client_id,
        ...newRequest,
        status: 'pending'
      });
      toast.success('Solicitação criada!');
      setShowModal(false);
      loadRequests();
      setNewRequest({ title: '', description: '', urgency: 'normal' });
    } catch (e) { toast.error('Erro ao criar'); }
    finally { setSubmitting(false); }
  }

  const getStatusBadge = (status: string) => {
    const map: any = {
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock, label: 'Aguardando' },
      quoted: { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle, label: 'Orçado' },
      in_review: { color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: AlertCircle, label: 'Em Análise' },
      cancelled: { color: 'bg-slate-50 text-slate-600 border-slate-100', icon: XCircle, label: 'Cancelado' }
    };
    const type = map[status] || map.pending;
    const Icon = type.icon;
    return (
      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${type.color}`}>
        <Icon size={14} /> {type.label}
      </span>
    );
  }

  const filtered = requests.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <DashboardLayout><div className="flex justify-center p-20"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-20 animate-fadeIn space-y-6">

        {/* Header - Elite Light Theme */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Solicitações</h1>
              <p className="text-slate-500 text-sm">Peça orçamentos para novos serviços.</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
            <Plus size={20} /> Nova Solicitação
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          <input
            placeholder="Buscar solicitações..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <FileText size={48} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400">Nenhuma solicitação encontrada.</p>
            </div>
          ) : (
            filtered.map(req => (
              <div key={req.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{req.request_number}</span>
                    {req.urgency === 'urgent' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Urgente</span>}
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{req.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">{req.description}</p>

                  {req.photos && req.photos.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {req.photos.map((p, i) => (
                        <div key={i} className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                          <img src={p} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3 min-w-[140px]">
                  {getStatusBadge(req.status)}
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} /> {new Date(req.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-lg relative shadow-2xl animate-scaleIn">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Nova Solicitação</h2>
              <div className="space-y-4">
                <div>
                  <label className="label-text mb-2 block">Título</label>
                  <input value={newRequest.title} onChange={e => setNewRequest({ ...newRequest, title: e.target.value })} className="form-input w-full" placeholder="Ex: Reparo no Portão" />
                </div>
                <div>
                  <label className="label-text mb-2 block">Descrição</label>
                  <textarea value={newRequest.description} onChange={e => setNewRequest({ ...newRequest, description: e.target.value })} className="form-textarea w-full h-24" placeholder="Detalhes do que precisa..." />
                </div>
                <div>
                  <label className="label-text mb-2 block">Urgência</label>
                  <div className="flex gap-2">
                    <button onClick={() => setNewRequest({ ...newRequest, urgency: 'normal' })} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${newRequest.urgency === 'normal' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}>Normal</button>
                    <button onClick={() => setNewRequest({ ...newRequest, urgency: 'urgent' })} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${newRequest.urgency === 'urgent' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-500 border-slate-200'}`}>Urgente</button>
                  </div>
                </div>
                <button onClick={handleCreate} disabled={submitting} className="w-full btn btn-primary py-3 rounded-xl font-bold mt-2">
                  {submitting ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
