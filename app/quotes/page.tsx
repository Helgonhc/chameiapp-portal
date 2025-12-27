'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DollarSign, FileText, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Trash2, Sparkles, Plus, Edit3 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import AdvancedSearch, { SearchFilters } from '@/components/AdvancedSearch'

interface Quote {
  id: string
  quote_number: string
  title: string
  description: string
  status: string
  subtotal: number
  discount: number
  discount_type: string
  tax: number
  total: number
  valid_until: string
  notes: string
  terms: string
  created_at: string
  items_count?: number
}

interface QuoteRequest {
  id: string
  request_number: string
  title: string
  description: string
  urgency: string
  status: string
  photos: string[]
  created_at: string
  updated_at: string
}

export default function QuotesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'quotes' | 'requests'>('quotes')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [requests, setRequests] = useState<QuoteRequest[]>([])
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestForm, setRequestForm] = useState({ title: '', description: '', urgency: 'normal' })
  const [submitting, setSubmitting] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  useEffect(() => { checkAuth(); loadQuotes(); loadRequests() }, [])
  useEffect(() => { applyFilters() }, [quotes, filter, searchFilters])

  async function checkAuth() { const { data: { user } } = await supabase.auth.getUser(); if (!user) router.push('/login') }

  async function loadQuotes() {
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).maybeSingle()
      if (!profile?.client_id) return
      const { data } = await supabase.from('quotes').select(`*, quote_items(count)`).eq('client_id', profile.client_id).order('created_at', { ascending: false })
      const quotesWithCount = data?.map(q => ({ ...q, items_count: q.quote_items?.[0]?.count || 0 })) || []
      setQuotes(quotesWithCount)
      setFilteredQuotes(quotesWithCount)
    } catch (error) { console.error('Erro:', error) }
    finally { setLoading(false) }
  }

  async function loadRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).maybeSingle()
      if (!profile?.client_id) return
      const { data } = await supabase.from('quote_requests').select('*').eq('client_id', profile.client_id).order('created_at', { ascending: false })
      setRequests(data || [])
    } catch (error) { console.error('Erro:', error) }
  }

  async function handleCancelRequest(requestId: string) {
    if (!confirm('Cancelar esta solicitação?')) return
    try {
      await supabase.from('quote_requests').delete().eq('id', requestId)
      alert('✅ Solicitação cancelada!')
      loadRequests()
    } catch (error) { alert('Erro ao cancelar') }
  }

  function applyFilters() {
    let filtered = [...quotes]
    if (filter !== 'all') filtered = filtered.filter(q => q.status === filter)
    if (searchFilters) {
      if (searchFilters.searchTerm) {
        const term = searchFilters.searchTerm.toLowerCase()
        filtered = filtered.filter(q => q.title.toLowerCase().includes(term) || q.quote_number.toLowerCase().includes(term) || q.description?.toLowerCase().includes(term))
      }
      if (searchFilters.status) filtered = filtered.filter(q => q.status === searchFilters.status)
      if (searchFilters.dateFrom) filtered = filtered.filter(q => new Date(q.created_at) >= new Date(searchFilters.dateFrom!))
      if (searchFilters.dateTo) filtered = filtered.filter(q => new Date(q.created_at) <= new Date(searchFilters.dateTo!))
      if (searchFilters.minValue !== undefined) filtered = filtered.filter(q => q.total >= searchFilters.minValue!)
      if (searchFilters.maxValue !== undefined) filtered = filtered.filter(q => q.total <= searchFilters.maxValue!)
    }
    setFilteredQuotes(filtered)
  }

  function handleSearch(filters: SearchFilters) { setSearchFilters(filters); setFilter('all') }
  function handleClearSearch() { setSearchFilters(null); setFilter('all') }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
      approved: 'bg-success-500/20 text-success-400 border-success-500/30',
      rejected: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
      expired: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      converted: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
      review_requested: 'bg-info-500/20 text-info-400 border-info-500/30',
    }
    return colors[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = { pending: 'Aguardando', approved: 'Aprovado', rejected: 'Rejeitado', expired: 'Expirado', converted: 'Convertido', review_requested: 'Revisão Solicitada' }
    return labels[status] || status
  }

  function getStatusIcon(status: string) {
    const icons: Record<string, JSX.Element> = { pending: <Clock className="w-4 h-4" />, approved: <CheckCircle className="w-4 h-4" />, rejected: <XCircle className="w-4 h-4" />, expired: <AlertCircle className="w-4 h-4" />, converted: <FileText className="w-4 h-4" />, review_requested: <Edit3 className="w-4 h-4" /> }
    return icons[status] || <FileText className="w-4 h-4" />
  }

  function isExpired(validUntil: string) { return new Date(validUntil) < new Date() }

  function getRequestStatusColor(status: string) {
    const colors: Record<string, string> = { pending: 'bg-warning-500/20 text-warning-400 border-warning-500/30', in_review: 'bg-primary-500/20 text-primary-400 border-primary-500/30', quoted: 'bg-success-500/20 text-success-400 border-success-500/30', cancelled: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' }
    return colors[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  }

  function getRequestStatusLabel(status: string) {
    const labels: Record<string, string> = { pending: 'Aguardando', in_review: 'Em Análise', quoted: 'Orçamento Enviado', cancelled: 'Cancelado' }
    return labels[status] || status
  }

  function getRequestStatusIcon(status: string) {
    const icons: Record<string, JSX.Element> = { pending: <Clock className="w-4 h-4" />, in_review: <AlertCircle className="w-4 h-4" />, quoted: <CheckCircle className="w-4 h-4" />, cancelled: <XCircle className="w-4 h-4" /> }
    return icons[status] || <FileText className="w-4 h-4" />
  }

  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width, height = img.height
          const maxSize = 1920
          if (width > height && width > maxSize) { height = (height / width) * maxSize; width = maxSize }
          else if (height > maxSize) { width = (width / height) * maxSize; height = maxSize }
          canvas.width = width; canvas.height = height
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => { resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file) }, 'image/jpeg', 0.8)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []); if (!files.length) return
    setUploadingPhotos(true)
    try { const compressed = await Promise.all(files.map(f => compressImage(f))); setSelectedPhotos(prev => [...prev, ...compressed]) }
    catch (error) { alert('Erro ao processar fotos') }
    finally { setUploadingPhotos(false) }
  }

  function removePhoto(index: number) { setSelectedPhotos(prev => prev.filter((_, i) => i !== index)) }

  async function uploadPhotos(): Promise<string[]> {
    if (!selectedPhotos.length) return []
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return []
    const urls: string[] = []
    for (const photo of selectedPhotos) {
      const fileName = `quote-requests/${user.id}/${Date.now()}-${photo.name}`
      const { error } = await supabase.storage.from('photos').upload(fileName, photo)
      if (!error) { const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName); urls.push(publicUrl) }
    }
    return urls
  }

  async function handleRequestQuote() {
    if (!requestForm.title.trim() || !requestForm.description.trim()) { alert('Preencha título e descrição'); return }
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).maybeSingle()
      if (!profile?.client_id) { alert('Perfil não encontrado'); return }
      const photoUrls = await uploadPhotos()
      await supabase.from('quote_requests').insert({ client_id: profile.client_id, title: requestForm.title, description: requestForm.description, urgency: requestForm.urgency, status: 'pending', photos: photoUrls.length > 0 ? photoUrls : null })
      alert('✅ Solicitação enviada!')
      setShowRequestModal(false); setRequestForm({ title: '', description: '', urgency: 'normal' }); setSelectedPhotos([])
      loadRequests(); setActiveTab('requests')
    } catch (error) { alert('Erro ao enviar') }
    finally { setSubmitting(false) }
  }

  const pendingCount = quotes.filter(q => q.status === 'pending').length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Carregando orçamentos...</p>
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
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30">
                  <DollarSign className="w-6 h-6 text-dark-900" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">Orçamentos <Sparkles className="w-5 h-5 text-accent-400" /></h1>
                  <p className="text-zinc-400">{pendingCount > 0 ? `${pendingCount} aguardando aprovação` : 'Todos os seus orçamentos'}</p>
                </div>
              </div>
              <button onClick={() => setShowRequestModal(true)} className="btn-accent flex items-center gap-2">
                <Plus className="w-5 h-5" /> Solicitar Orçamento
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Abas */}
          <div className="flex gap-2 bg-surface rounded-xl p-2 mb-6 border border-white/5">
            <button onClick={() => setActiveTab('quotes')} className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === 'quotes' ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-dark-900 shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              💰 Orçamentos ({quotes.length})
            </button>
            <button onClick={() => setActiveTab('requests')} className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === 'requests' ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-dark-900 shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              📝 Solicitações ({requests.length})
            </button>
          </div>

          {activeTab === 'quotes' ? (
            <>
              <div className="mb-6"><AdvancedSearch type="quotes" onSearch={handleSearch} onClear={handleClearSearch} /></div>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {[
                  { key: 'all', label: 'Todos', count: quotes.length, icon: '💰' },
                  { key: 'pending', label: 'Aguardando', count: quotes.filter(q => q.status === 'pending').length, icon: '⏳' },
                  { key: 'approved', label: 'Aprovados', count: quotes.filter(q => q.status === 'approved').length, icon: '✅' },
                  { key: 'rejected', label: 'Rejeitados', count: quotes.filter(q => q.status === 'rejected').length, icon: '❌' },
                ].map((btn) => (
                  <button key={btn.key} onClick={() => setFilter(btn.key)} className={`filter-btn ${filter === btn.key ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
                    <span className="mr-1">{btn.icon}</span> {btn.label} ({btn.count})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredQuotes.length === 0 ? (
                  <div className="col-span-2 empty-state">
                    <DollarSign className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <p className="text-xl font-bold text-white mb-2">{filter === 'all' ? 'Nenhum orçamento' : `Nenhum ${getStatusLabel(filter).toLowerCase()}`}</p>
                    <p className="text-zinc-400">Orçamentos aparecerão aqui</p>
                  </div>
                ) : (
                  filteredQuotes.map((quote) => (
                    <div key={quote.id} onClick={() => router.push(`/quotes/${quote.id}`)} className="list-item cursor-pointer hover:border-accent-500/30">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono text-zinc-500">{quote.quote_number}</span>
                            {quote.status === 'pending' && isExpired(quote.valid_until) && <span className="badge badge-danger text-xs">Expirado</span>}
                          </div>
                          <h3 className="font-semibold text-white hover:text-primary-400 transition-colors">{quote.title}</h3>
                        </div>
                        <span className={`badge ${getStatusColor(quote.status)}`}>{getStatusIcon(quote.status)} {getStatusLabel(quote.status)}</span>
                      </div>
                      {quote.description && <p className="text-sm text-zinc-400 line-clamp-2 mb-4">{quote.description}</p>}
                      <div className="bg-primary-500/10 rounded-xl p-4 mb-4 border border-primary-500/20">
                        <p className="text-xs text-zinc-400 mb-1">Valor Total</p>
                        <p className="text-2xl font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total)}</p>
                        {quote.items_count && quote.items_count > 0 && <p className="text-xs text-zinc-500 mt-1">{quote.items_count} {quote.items_count === 1 ? 'item' : 'itens'}</p>}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-sm text-zinc-500"><Calendar className="w-4 h-4" /> Válido até {new Date(quote.valid_until).toLocaleDateString('pt-BR')}</div>
                        {quote.status === 'pending' && <span className="text-sm font-medium text-primary-400">Ver detalhes →</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {requests.length === 0 ? (
                <div className="empty-state">
                  <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <p className="text-xl font-bold text-white mb-2">Nenhuma solicitação</p>
                  <p className="text-zinc-400 mb-6">Clique em "Solicitar Orçamento" para começar</p>
                  <button onClick={() => setShowRequestModal(true)} className="btn-accent">Solicitar Orçamento</button>
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className="list-item">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {request.request_number && <span className="text-xs font-mono text-zinc-500">{request.request_number}</span>}
                          <span className={`badge ${request.urgency === 'urgent' ? 'badge-danger' : 'badge-neutral'}`}>{request.urgency === 'urgent' ? '🚨 URGENTE' : '📅 Normal'}</span>
                        </div>
                        <h3 className="font-semibold text-white mb-2">{request.title}</h3>
                        <p className="text-sm text-zinc-400 line-clamp-2">{request.description}</p>
                      </div>
                      <span className={`badge ${getRequestStatusColor(request.status)}`}>{getRequestStatusIcon(request.status)} {getRequestStatusLabel(request.status)}</span>
                    </div>
                    {request.photos && request.photos.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-zinc-500 mb-2">📸 {request.photos.length} foto(s)</p>
                        <div className="flex gap-2 overflow-x-auto">
                          {request.photos.slice(0, 3).map((photo, index) => <img key={index} src={photo} alt={`Foto ${index + 1}`} className="w-20 h-20 object-cover rounded-lg border border-white/10" />)}
                          {request.photos.length > 3 && <div className="w-20 h-20 bg-surface-light rounded-lg border border-white/10 flex items-center justify-center text-xs text-zinc-400">+{request.photos.length - 3}</div>}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xs text-zinc-500">Solicitado em {new Date(request.created_at).toLocaleDateString('pt-BR')}</span>
                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && <span className="text-xs text-primary-400">{request.urgency === 'urgent' ? '⚡ Resposta em 24h' : '📅 Resposta em 48h'}</span>}
                        {(request.status === 'pending' || request.status === 'in_review') && (
                          <button onClick={() => handleCancelRequest(request.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-danger-400 hover:bg-danger-500/10 rounded-lg transition-all">
                            <Trash2 className="w-3.5 h-3.5" /> Cancelar
                          </button>
                        )}
                        {request.status === 'quoted' && <button onClick={() => setActiveTab('quotes')} className="text-xs font-medium text-success-400">Ver Orçamento →</button>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        {/* Modal */}
        {showRequestModal && (
          <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-dark-900" />
                </div>
                <div><h2 className="text-xl font-bold text-white">Solicitar Orçamento</h2><p className="text-sm text-zinc-400">Descreva o que você precisa</p></div>
              </div>
              <div className="space-y-4">
                <div><label className="form-label">Título *</label><input type="text" value={requestForm.title} onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })} placeholder="Ex: Manutenção preventiva" className="form-input" maxLength={100} /></div>
                <div><label className="form-label">Descrição *</label><textarea value={requestForm.description} onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })} placeholder="Descreva em detalhes..." className="form-textarea" rows={5} maxLength={1000} /></div>
                <div>
                  <label className="form-label">Urgência</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setRequestForm({ ...requestForm, urgency: 'normal' })} className={`p-4 rounded-xl border-2 transition-all text-center ${requestForm.urgency === 'normal' ? 'border-accent-500 bg-accent-500/10' : 'border-white/10 hover:border-white/20 bg-surface-light'}`}>
                      <div className="text-2xl mb-1">📅</div><div className="font-semibold text-white">Normal</div><div className="text-xs text-zinc-500">Resposta em 48h</div>
                    </button>
                    <button onClick={() => setRequestForm({ ...requestForm, urgency: 'urgent' })} className={`p-4 rounded-xl border-2 transition-all text-center ${requestForm.urgency === 'urgent' ? 'border-danger-500 bg-danger-500/10' : 'border-white/10 hover:border-white/20 bg-surface-light'}`}>
                      <div className="text-2xl mb-1">🚨</div><div className="font-semibold text-white">Urgente</div><div className="text-xs text-zinc-500">Resposta em 24h</div>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Fotos (Opcional)</label>
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-accent-500/50 transition-colors">
                    <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} disabled={uploadingPhotos} className="hidden" id="photo-upload" />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="text-4xl mb-2">📸</div>
                      <p className="text-sm text-zinc-400">{uploadingPhotos ? 'Processando...' : 'Clique para adicionar'}</p>
                    </label>
                  </div>
                  {selectedPhotos.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {selectedPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img src={URL.createObjectURL(photo)} alt={`Foto ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                          <button onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-danger-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => { setShowRequestModal(false); setRequestForm({ title: '', description: '', urgency: 'normal' }); setSelectedPhotos([]) }} disabled={submitting} className="btn-secondary flex-1">Cancelar</button>
                  <button onClick={handleRequestQuote} disabled={submitting || !requestForm.title.trim() || !requestForm.description.trim()} className="btn-accent flex-1">{submitting ? 'Enviando...' : 'Enviar Solicitação'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
