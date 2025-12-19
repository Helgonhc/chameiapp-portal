'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Ticket, Plus, Clock, CheckCircle, XCircle, AlertCircle, User, Calendar, Edit2, Trash2, Camera, X as XIcon, Image as ImageIcon, Zap } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import AdvancedSearch, { SearchFilters } from '@/components/AdvancedSearch'
import { compressImages, formatFileSize, calculateReduction } from '@/utils/imageCompression'

interface TicketData {
  id: string
  ticket_number: string
  title: string
  description: string
  priority: string
  status: string
  equipment_id: string | null
  created_at: string
  updated_at: string
  created_by: string
  rejection_reason: string | null
  converted_to_order_id: string | null
  photos_url?: string[]
  creator?: {
    full_name: string
  }
}

export default function TicketsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [filteredTickets, setFilteredTickets] = useState<TicketData[]>([])
  const [filter, setFilter] = useState<'all' | 'aberto' | 'em_analise' | 'aprovado' | 'rejeitado'>('all')
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingTicket, setEditingTicket] = useState<TicketData | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta'>('media')
  const [error, setError] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [compressionStats, setCompressionStats] = useState<{ original: number; compressed: number } | null>(null)

  useEffect(() => {
    checkAuth()
    loadTickets()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tickets, filter, searchFilters])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadTickets() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) return

      const { data, error } = await supabase
        .from('tickets')
        .select(`*, creator:profiles!tickets_created_by_fkey(full_name)`)
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
      setFilteredTickets(data || [])
    } catch (error) {
      console.error('Erro ao carregar chamados:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...tickets]
    if (filter !== 'all') filtered = filtered.filter(t => t.status === filter)
    if (searchFilters) {
      if (searchFilters.searchTerm) {
        const term = searchFilters.searchTerm.toLowerCase()
        filtered = filtered.filter(t =>
          t.title.toLowerCase().includes(term) ||
          t.ticket_number.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term)
        )
      }
      if (searchFilters.status) filtered = filtered.filter(t => t.status === searchFilters.status)
      if (searchFilters.priority) filtered = filtered.filter(t => t.priority === searchFilters.priority)
      if (searchFilters.dateFrom) filtered = filtered.filter(t => new Date(t.created_at) >= new Date(searchFilters.dateFrom!))
      if (searchFilters.dateTo) filtered = filtered.filter(t => new Date(t.created_at) <= new Date(searchFilters.dateTo!))
    }
    setFilteredTickets(filtered)
  }

  function handleSearch(filters: SearchFilters) { setSearchFilters(filters); setFilter('all') }
  function handleClearSearch() { setSearchFilters(null); setFilter('all') }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const maxFiles = 5
    if (selectedFiles.length + files.length > maxFiles) { setError(`Máximo de ${maxFiles} fotos permitidas`); return }
    setCompressing(true); setError('')
    try {
      const originalSize = files.reduce((sum, file) => sum + file.size, 0)
      const compressedFiles = await compressImages(files, { maxWidth: 1920, maxHeight: 1920, quality: 0.8, maxSizeMB: 2 })
      const compressedSize = compressedFiles.reduce((sum, file) => sum + file.size, 0)
      setCompressionStats({ original: originalSize, compressed: compressedSize })
      setSelectedFiles(prev => [...prev, ...compressedFiles])
      compressedFiles.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => setPreviewUrls(prev => [...prev, reader.result as string])
        reader.readAsDataURL(file)
      })
    } catch (error) { setError('Erro ao processar imagens. Tente novamente.') }
    finally { setCompressing(false) }
  }

  function removePhoto(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadPhotos(): Promise<string[]> {
    if (selectedFiles.length === 0) return []
    setUploading(true)
    const uploadedUrls: string[] = []
    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `tickets/${fileName}`
        const { error: uploadError } = await supabase.storage.from('os-photos').upload(filePath, file, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('os-photos').getPublicUrl(filePath)
        uploadedUrls.push(data.publicUrl)
      }
      return uploadedUrls
    } catch (error) { throw new Error('Erro ao fazer upload das fotos') }
    finally { setUploading(false) }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault(); setError(''); setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single()
      if (!profile?.client_id) throw new Error('Cliente não encontrado')
      let photoUrls: string[] = []
      if (selectedFiles.length > 0) photoUrls = await uploadPhotos()
      if (editingTicket) {
        const updateData: any = { title: title.trim(), description: description.trim(), priority }
        if (photoUrls.length > 0) updateData.photos_url = [...(editingTicket.photos_url || []), ...photoUrls]
        const { error: updateError } = await supabase.from('tickets').update(updateData).eq('id', editingTicket.id)
        if (updateError) throw updateError
      } else {
        const { data: newTicket, error: insertError } = await supabase.from('tickets').insert({
          client_id: profile.client_id, title: title.trim(), description: description.trim(),
          priority, status: 'aberto', created_by: user.id, photos_url: photoUrls
        }).select('id, ticket_number').single()
        if (insertError) throw insertError
        const { data: clientData } = await supabase.from('clients').select('name').eq('id', profile.client_id).single()
        const { data: allUsers } = await supabase.from('profiles').select('id').in('role', ['admin', 'super_admin', 'technician']).eq('is_active', true)
        if (allUsers && allUsers.length > 0) {
          const notifications = allUsers.map(u => ({ user_id: u.id, title: '🎫 Novo Chamado Aberto', message: `Cliente: ${clientData?.name || 'N/A'} - ${title.trim()}`, type: 'ticket', reference_id: newTicket?.id, is_read: false }))
          await supabase.from('notifications').insert(notifications)
        }
      }
      setShowModal(false); setEditingTicket(null); setTitle(''); setDescription(''); setPriority('media'); setSelectedFiles([]); setPreviewUrls([]); loadTickets()
    } catch (error: any) { setError(error.message || 'Erro ao salvar chamado') }
    finally { setCreating(false) }
  }

  function handleEditTicket(ticket: TicketData) {
    if (ticket.status !== 'aberto') { alert('Apenas chamados abertos podem ser editados'); return }
    setEditingTicket(ticket); setTitle(ticket.title); setDescription(ticket.description)
    setPriority(ticket.priority as 'baixa' | 'media' | 'alta'); setSelectedFiles([]); setPreviewUrls([]); setShowModal(true)
  }

  async function handleDeleteTicket(ticket: TicketData) {
    if (ticket.status === 'convertido') { alert('Chamados convertidos em OS não podem ser excluídos'); return }
    if (!confirm(`Deseja realmente excluir o chamado ${ticket.ticket_number}?`)) return
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', ticket.id)
      if (error) throw error
      loadTickets()
    } catch (error: any) { alert('Erro ao excluir chamado: ' + error.message) }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      aberto: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
      em_analise: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
      aprovado: 'bg-success-500/20 text-success-400 border-success-500/30',
      rejeitado: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
      convertido: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    }
    return colors[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = { aberto: 'Aberto', em_analise: 'Em Análise', aprovado: 'Aprovado', rejeitado: 'Rejeitado', convertido: 'Convertido em OS' }
    return labels[status] || status
  }

  function getStatusIcon(status: string) {
    const icons: Record<string, JSX.Element> = {
      aberto: <Clock className="w-4 h-4" />, em_analise: <AlertCircle className="w-4 h-4" />,
      aprovado: <CheckCircle className="w-4 h-4" />, rejeitado: <XCircle className="w-4 h-4" />, convertido: <CheckCircle className="w-4 h-4" />
    }
    return icons[status] || <Clock className="w-4 h-4" />
  }

  function getPriorityLabel(priority: string) {
    const labels: Record<string, string> = { baixa: '🟢 Baixa', media: '🟡 Média', alta: '🔴 Alta' }
    return labels[priority] || priority
  }

  const openCount = tickets.filter(t => t.status === 'aberto').length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400 font-medium">Carregando chamados...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="page-header">
          <div className="max-w-7xl mx-auto relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary-500/20 border border-primary-500/30">
                    <Ticket className="w-5 h-5 text-primary-400" />
                  </div>
                  <span className="text-primary-400 text-sm font-medium">Suporte</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">Chamados</h1>
                <p className="text-zinc-400">{openCount > 0 ? `${openCount} chamado${openCount > 1 ? 's' : ''} aberto${openCount > 1 ? 's' : ''}` : 'Todos os seus chamados'}</p>
              </div>
              <button onClick={() => { setEditingTicket(null); setTitle(''); setDescription(''); setPriority('media'); setShowModal(true) }} className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" /><span>Novo Chamado</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6"><AdvancedSearch type="tickets" onSearch={handleSearch} onClear={handleClearSearch} /></div>
          
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              { key: 'all', label: 'Todos', count: tickets.length },
              { key: 'aberto', label: 'Abertos', count: tickets.filter(t => t.status === 'aberto').length },
              { key: 'em_analise', label: 'Em Análise', count: tickets.filter(t => t.status === 'em_analise').length },
              { key: 'aprovado', label: 'Aprovados', count: tickets.filter(t => t.status === 'aprovado').length },
              { key: 'rejeitado', label: 'Rejeitados', count: tickets.filter(t => t.status === 'rejeitado').length },
            ].map((btn) => (
              <button key={btn.key} onClick={() => setFilter(btn.key as any)} className={`filter-btn ${filter === btn.key ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
                {btn.label} ({btn.count})
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <div className="empty-state">
                <div className="inline-flex p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 mb-6"><Ticket className="w-12 h-12 text-primary-400" /></div>
                <p className="text-xl font-bold text-white mb-2">Nenhum chamado encontrado</p>
                <p className="text-zinc-500 mb-6">{filter === 'all' ? 'Crie seu primeiro chamado' : 'Nenhum chamado com este status'}</p>
                <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2"><Plus className="w-5 h-5" />Novo Chamado</button>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div key={ticket.id} className="list-item">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-xs text-zinc-500">{ticket.ticket_number}</span>
                        <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>{getStatusIcon(ticket.status)}{getStatusLabel(ticket.status)}</span>
                        <span className="text-xs font-medium text-zinc-400">{getPriorityLabel(ticket.priority)}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{ticket.title}</h3>
                      <p className="text-zinc-400 text-sm line-clamp-2">{ticket.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      {ticket.creator && <span className="flex items-center gap-1"><User className="w-3 h-3" />{ticket.creator.full_name}</span>}
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {ticket.status === 'aberto' && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditTicket(ticket)} className="action-btn action-btn-edit" title="Editar"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteTicket(ticket)} className="action-btn action-btn-delete" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                  {ticket.rejection_reason && <div className="mt-3 info-box info-box-red"><p className="text-xs font-semibold mb-1">Motivo da Rejeição:</p><p className="text-xs opacity-80">{ticket.rejection_reason}</p></div>}
                  {ticket.converted_to_order_id && <div className="mt-3 info-box info-box-purple"><p className="text-xs font-semibold">✓ Convertido em Ordem de Serviço</p></div>}
                  {ticket.photos_url && ticket.photos_url.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" />Fotos ({ticket.photos_url.length})</p>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {ticket.photos_url.map((url, index) => (
                          <button key={index} onClick={() => setSelectedImage(url)} className="relative group overflow-hidden rounded-lg border border-white/10 hover:border-primary-500/50 transition-colors aspect-square">
                            <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center"><ImageIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full h-full flex items-center justify-center">
            <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 bg-white/10 text-white rounded-full p-2 hover:bg-white/20 transition-colors z-10"><XIcon className="w-6 h-6" /></button>
            <img src={selectedImage} alt="Visualização" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                {editingTicket ? <Edit2 className="w-6 h-6 text-primary-400" /> : <Ticket className="w-6 h-6 text-primary-400" />}
              </div>
              <h2 className="text-xl font-bold text-white">{editingTicket ? 'Editar Chamado' : 'Novo Chamado'}</h2>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="form-label">Título *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Descreva brevemente o problema" className="form-input" required />
              </div>
              <div>
                <label className="form-label">Descrição *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o problema em detalhes..." rows={3} className="form-textarea" required />
              </div>
              <div>
                <label className="form-label">Prioridade</label>
                <div className="grid grid-cols-3 gap-3">
                  {[{ key: 'baixa', label: 'Baixa', emoji: '🟢' }, { key: 'media', label: 'Média', emoji: '🟡' }, { key: 'alta', label: 'Alta', emoji: '🔴' }].map((p) => (
                    <button key={p.key} type="button" onClick={() => setPriority(p.key as any)} className={`priority-btn ${priority === p.key ? 'priority-btn-active' : 'priority-btn-inactive'}`}>
                      <div className="text-xl mb-1">{p.emoji}</div><div className="text-xs font-bold text-zinc-300">{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="form-label flex items-center gap-2">Fotos (Opcional)<span className="flex items-center gap-1 text-xs text-success-400 font-normal"><Zap className="w-3 h-3" />Compressão automática</span></label>
                <div className="border-2 border-dashed border-white/10 rounded-xl p-4 hover:border-primary-500/30 transition-colors">
                  <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" id="photo-upload" disabled={uploading || creating || compressing} />
                  <label htmlFor="photo-upload" className={`flex flex-col items-center justify-center py-2 ${compressing ? 'cursor-wait' : 'cursor-pointer'}`}>
                    {compressing ? (
                      <><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500/20 border-t-primary-500 mb-2"></div><p className="text-sm font-medium text-primary-400">Comprimindo...</p></>
                    ) : (
                      <><Camera className="w-10 h-10 text-zinc-500 mb-2" /><p className="text-sm font-medium text-zinc-400">Clique para adicionar fotos</p><p className="text-xs text-zinc-600 mt-1">Máximo 5 fotos</p></>
                    )}
                  </label>
                </div>
                {compressionStats && (
                  <div className="mt-2 p-3 info-box info-box-green">
                    <div className="flex items-center gap-2 text-xs"><Zap className="w-4 h-4" /><span className="font-semibold">Economia de {calculateReduction(compressionStats.original, compressionStats.compressed)}%</span><span className="opacity-70">({formatFileSize(compressionStats.original)} → {formatFileSize(compressionStats.compressed)})</span></div>
                  </div>
                )}
                {previewUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded-lg border border-white/10" />
                        <button type="button" onClick={() => removePhoto(index)} className="absolute -top-1 -right-1 bg-danger-500 text-white rounded-full p-1 shadow-lg"><XIcon className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <div className="info-box info-box-red"><p className="text-sm font-medium">{error}</p></div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingTicket(null); setTitle(''); setDescription(''); setPriority('media'); setSelectedFiles([]); setPreviewUrls([]); setError('') }} disabled={creating} className="flex-1 btn-secondary">Cancelar</button>
                <button type="submit" disabled={creating || uploading} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {creating ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div><span>Salvando...</span></> : <>{editingTicket ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}<span>{editingTicket ? 'Salvar' : 'Criar Chamado'}</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
