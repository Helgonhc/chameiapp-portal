'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Ticket, Plus, Clock, CheckCircle, XCircle, AlertCircle, User, Calendar, Edit2, Trash2, Camera, X as XIcon, Image as ImageIcon, Zap, ChevronRight, Search, Filter } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { compressImages, formatFileSize, calculateReduction } from '@/utils/imageCompression';
import toast from 'react-hot-toast';

interface TicketData {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  equipment_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  rejection_reason: string | null;
  converted_to_order_id: string | null;
  photos_url?: string[];
  creator?: {
    full_name: string;
  };
}

export default function TicketsPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketData[]>([]);
  const [filter, setFilter] = useState<'all' | 'aberto' | 'em_analise' | 'aprovado' | 'rejeitado'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal & Form States
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketData | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [equipmentId, setEquipmentId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{ original: number; compressed: number } | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    loadTickets();

    // Auto-open modal if equipment_id is present
    const eqId = searchParams.get('equipment_id');
    if (eqId) {
      setEquipmentId(eqId);
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [tickets, filter, searchTerm]);



  async function loadTickets() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single();
      if (!profile?.client_id) return;

      const { data, error } = await supabase
        .from('tickets')
        .select(`*, creator:profiles!tickets_created_by_fkey(full_name)`)
        .eq('client_id', profile!.client_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
      setFilteredTickets(data || []);
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
      toast.error('Erro ao carregar chamados');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let result = [...tickets];

    if (filter !== 'all') {
      result = result.filter(t => t.status === filter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(term) ||
        t.ticket_number.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
      );
    }

    setFilteredTickets(result);
  }

  // File Upload Handlers (simplified from original)
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setCompressing(true);
    try {
      const compressed = await compressImages(files, { maxWidth: 1920, quality: 0.8 });
      setSelectedFiles(prev => [...prev, ...compressed]);
      compressed.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrls(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    } catch (error) { toast.error('Erro ao processar imagens'); }
    finally { setCompressing(false); }
  }

  function removePhoto(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  }

  async function uploadPhotos(): Promise<string[]> {
    if (selectedFiles.length === 0) return [];
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const file of selectedFiles) {
        const path = `tickets/${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('os-photos').upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from('os-photos').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      return urls;
    } catch (e) { throw new Error('Erro no upload'); }
    finally { setUploading(false); }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário inválido');

      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single();
      if (!profile) throw new Error('Perfil não encontrado');
      const photoUrls = await uploadPhotos();

      if (editingTicket) {
        const updateData: any = { title, description, priority };
        if (photoUrls.length > 0) updateData.photos_url = [...(editingTicket.photos_url || []), ...photoUrls];
        const { error } = await supabase.from('tickets').update(updateData).eq('id', editingTicket.id);
        if (error) throw error;
        toast.success('Chamado atualizado!');
      } else {
        const { error } = await supabase.from('tickets').insert({
          client_id: profile.client_id, title, description, priority, status: 'aberto',
          created_by: user.id, photos_url: photoUrls, equipment_id: equipmentId
        });
        if (error) throw error;
        toast.success('Chamado criado com sucesso!');
      }
      setShowModal(false); resetForm(); loadTickets();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setEditingTicket(null); setTitle(''); setDescription(''); setPriority('media'); setSelectedFiles([]); setPreviewUrls([]);
  }

  function handleEdit(ticket: TicketData) {
    if (ticket.status !== 'aberto') return toast.error('Apenas chamados abertos podem ser editados');
    setEditingTicket(ticket); setTitle(ticket.title); setDescription(ticket.description);
    setPriority(ticket.priority as any); setShowModal(true);
  }

  async function handleDelete(ticket: TicketData) {
    if (!confirm('Excluir este chamado?')) return;
    try {
      await supabase.from('tickets').delete().eq('id', ticket.id);
      toast.success('Chamado excluído');
      loadTickets();
    } catch (e) { toast.error('Erro ao excluir'); }
  }

  function getStatusStyle(status: string) {
    const s = {
      aberto: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      em_analise: 'bg-amber-50 text-amber-700 border-amber-100',
      aprovado: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      rejeitado: 'bg-red-50 text-red-700 border-red-100',
      convertido: 'bg-purple-50 text-purple-700 border-purple-100'
    };
    return s[status as keyof typeof s] || 'bg-slate-50 text-slate-600 border-slate-200';
  }

  function getStatusLabel(status: string) {
    const l: any = { aberto: 'Aberto', em_analise: 'Em Análise', aprovado: 'Aprovado', rejeitado: 'Rejeitado', convertido: 'Convertido em OS' };
    return l[status] || status;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Carregando chamados...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Meus Chamados</h1>
            <p className="text-slate-500 text-sm">Acompanhe suas solicitações de suporte em tempo real.</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary shadow-lg shadow-indigo-100 flex items-center gap-2 px-5 py-3 rounded-xl">
            <Plus size={20} />
            <span>Novo Chamado</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar chamados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all text-slate-600 shadow-sm placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['all', 'aberto', 'em_analise', 'aprovado'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${filter === st ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                {st === 'all' ? 'Todos' : getStatusLabel(st)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">Nenhum chamado encontrado</h3>
              <p className="text-slate-400 text-sm">Tente ajustar os filtros ou crie um novo chamado.</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-2px] hover:border-indigo-100 transition-all group relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${getStatusStyle(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                      <span className="text-xs font-mono text-slate-400">#{ticket.ticket_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ticket.priority === 'alta' ? 'bg-red-50 text-red-600' : ticket.priority === 'media' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                        {ticket.priority === 'alta' ? 'Alta Prioridade' : ticket.priority === 'media' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{ticket.title}</h3>
                    <p className="text-slate-500 text-sm line-clamp-2">{ticket.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50 mt-2 md:mt-0">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Calendar size={14} />
                      {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    {ticket.status === 'aberto' && (
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(ticket); }} className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(ticket); }} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Info Area */}
                {(ticket.rejection_reason || ticket.photos_url?.length) && (
                  <div className="mt-4 pt-4 border-t border-slate-50 flex gap-4 overflow-x-auto">
                    {ticket.photos_url && ticket.photos_url.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                        <ImageIcon size={14} />
                        {ticket.photos_url.length} fotos anexadas
                      </div>
                    )}
                    {ticket.rejection_reason && (
                      <div className="flex-1 bg-red-50 p-2 rounded-lg text-xs text-red-600 border border-red-100">
                        <span className="font-bold">Motivo da recusa:</span> {ticket.rejection_reason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modern Modal using Fixed Positioning and Backdrop Blur */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl p-6 sm:p-8 animate-scaleIn max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <XIcon size={20} />
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">{editingTicket ? 'Editar Chamado' : 'Novo Chamado'}</h2>
              <p className="text-slate-500 text-sm">Preencha os detalhes para solicitar suporte.</p>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Título do Problema</label>
                <input
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 font-medium"
                  placeholder="Ex: Ar condicionado vazando..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Prioridade</label>
                  <select
                    value={priority} onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="baixa">🟢 Baixa</option>
                    <option value="media">🟡 Média</option>
                    <option value="alta">🔴 Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Descrição Detalhada</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400 resize-none font-medium"
                  placeholder="Descreva o que aconteceu, onde e quando..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Fotos (Opcional)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer relative group">
                  <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-500 group-hover:scale-110 transition-transform">
                    <Camera size={24} />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Clique para enviar fotos</p>
                  <p className="text-xs text-slate-400 mt-1">Nós comprimimos automaticamente para você</p>
                </div>
                {/* Previews */}
                {previewUrls.length > 0 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                        <img src={url} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full"><XIcon size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={creating || uploading || compressing}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
                ) : (
                  <>{editingTicket ? 'Salvar Alterações' : 'Criar Chamado'}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
