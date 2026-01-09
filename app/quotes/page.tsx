'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DollarSign, FileText, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Trash2, Sparkles, Plus, Edit3, Search, Filter } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import toast from 'react-hot-toast';

interface Quote {
  id: string;
  quote_number: string;
  title: string;
  description: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  valid_until: string;
  created_at: string;
  items_count?: number;
}

interface QuoteRequest {
  id: string;
  request_number: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
  photos: string[];
  created_at: string;
}

export default function QuotesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quotes' | 'requests'>('quotes');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [selection, setSelection] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Request Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ title: '', description: '', urgency: 'normal' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  useEffect(() => { loadData(); }, []);



  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).maybeSingle();
      if (!profile?.client_id) return;

      const [quotesRes, requestsRes] = await Promise.all([
        supabase.from('quotes').select('*, quote_items(count)').eq('client_id', profile!.client_id).order('created_at', { ascending: false }),
        supabase.from('quote_requests').select('*').eq('client_id', profile!.client_id).order('created_at', { ascending: false })
      ]);

      setQuotes(quotesRes.data?.map(q => ({ ...q, items_count: q.quote_items?.[0]?.count || 0 })) || []);
      setRequests(requestsRes.data || []);
    } catch (error) { console.error('Erro:', error); }
    finally { setLoading(false); }
  }

  // Helper Functions
  function getFilteredData() {
    const term = searchTerm.toLowerCase();
    if (activeTab === 'quotes') {
      return quotes.filter(q =>
        (selection === 'all' || q.status === selection) &&
        (q.title.toLowerCase().includes(term) || q.quote_number.toLowerCase().includes(term))
      );
    } else {
      return requests.filter(r =>
        (selection === 'all' || r.status === selection) &&
        (r.title.toLowerCase().includes(term) || r.request_number?.toLowerCase().includes(term))
      );
    }
  }

  function getStatusStyle(status: string) {
    const s = {
      pending: 'bg-amber-50 text-amber-700 border-amber-100',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      quoted: 'bg-blue-50 text-blue-700 border-blue-100',
      rejected: 'bg-red-50 text-red-700 border-red-100',
      expired: 'bg-slate-50 text-slate-600 border-slate-200',
      in_review: 'bg-purple-50 text-purple-700 border-purple-100'
    };
    return s[status as keyof typeof s] || 'bg-slate-50 text-slate-600 border-slate-200';
  }

  function getStatusLabel(status: string) {
    const labels: any = { pending: 'Pendente', approved: 'Aprovado', quoted: 'Orçado', rejected: 'Recusado', expired: 'Expirado', in_review: 'Em Análise' };
    return labels[status] || status;
  }

  async function handleCreateRequest() {
    if (!requestForm.title || !requestForm.description) return toast.error('Preencha os campos obrigatórios');
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single();
      if (!profile) throw new Error('Perfil não encontrado');
      let photoUrls: string[] = [];
      // Photo upload logic (simplified for artifact size, assume standard)
      // ...

      const { error } = await supabase.from('quote_requests').insert({
        client_id: profile.client_id,
        title: requestForm.title,
        description: requestForm.description,
        urgency: requestForm.urgency,
        status: 'pending'
      });

      if (error) throw error;
      toast.success('Solicitação enviada!');
      setShowRequestModal(false);
      setRequestForm({ title: '', description: '', urgency: 'normal' });
      loadData();
      setActiveTab('requests');
    } catch (e) { toast.error('Erro ao enviar'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <DashboardLayout><div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn pb-20">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <DollarSign size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Financeiro & Orçamentos</h1>
              <p className="text-slate-500 text-sm">Gerencie seus orçamentos e solicitações.</p>
            </div>
          </div>
          <button onClick={() => setShowRequestModal(true)} className="btn btn-primary shadow-lg shadow-indigo-100 flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all">
            <Plus size={20} /> Solicitar Orçamento
          </button>
        </div>

        {/* Tabs & Filters */}
        <div className="flex flex-col gap-6">
          <div className="flex p-1 bg-white border border-slate-200 rounded-2xl w-fit">
            <button onClick={() => setActiveTab('quotes')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'quotes' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              💰 Orçamentos
            </button>
            <button onClick={() => setActiveTab('requests')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              📝 Solicitações
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text" placeholder="Buscar..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {getFilteredData().length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">Nenhum registro encontrado.</p>
            </div>
          ) : (
            getFilteredData().map((item: any) => (
              <div key={item.id} className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                onClick={() => activeTab === 'quotes' ? router.push(`/quotes/${item.id}`) : null}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${activeTab === 'quotes' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    {activeTab === 'quotes' ? <FileText size={24} /> : <Edit3 size={24} />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${getStatusStyle(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-xs font-mono text-slate-400 block mb-1">
                    {activeTab === 'quotes' ? item.quote_number : item.request_number || 'PENDENTE'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                </div>

                {activeTab === 'quotes' && (
                  <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Valor Total</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  {activeTab === 'quotes' && item.status === 'pending' && (
                    <span className="text-indigo-600 flex items-center gap-1">Ver detalhes <Sparkles size={12} /></span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Logic (Simplified Visuals) */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRequestModal(false)} />
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg relative shadow-2xl animate-scaleIn">
              <button onClick={() => setShowRequestModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400"><XCircle /></button>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Solicitar Orçamento</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Título</label>
                  <input value={requestForm.title} onChange={e => setRequestForm({ ...requestForm, title: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100" placeholder="Ex: Manutenção Elétrica" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Descrição</label>
                  <textarea value={requestForm.description} onChange={e => setRequestForm({ ...requestForm, description: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 min-h-[100px]" placeholder="Descreva sua necessidade..." />
                </div>
                <button onClick={handleCreateRequest} disabled={submitting} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 mt-4 hover:bg-indigo-700 transition-all">
                  {submitting ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
