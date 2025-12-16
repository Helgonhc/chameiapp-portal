'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DollarSign, FileText, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Image as ImageIcon, Trash2 } from 'lucide-react'
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
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    urgency: 'normal'
  })
  const [submitting, setSubmitting] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  useEffect(() => {
    checkAuth()
    loadQuotes()
    loadRequests()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [quotes, filter, searchFilters])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
  }

  async function loadQuotes() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError || !profile?.client_id) {
        console.error('Erro ao buscar perfil:', profileError)
        return
      }

      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items(count)
        `)
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const quotesWithCount = data?.map(q => ({
        ...q,
        items_count: q.quote_items?.[0]?.count || 0
      })) || []
      
      setQuotes(quotesWithCount)
      setFilteredQuotes(quotesWithCount)
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.client_id) return

      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
    }
  }

  async function handleCancelRequest(requestId: string) {
    if (!confirm('Tem certeza que deseja cancelar esta solicitação?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('quote_requests')
        .delete()
        .eq('id', requestId)

      if (error) throw error

      alert('✅ Solicitação cancelada com sucesso!')
      loadRequests() // Recarregar lista
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error)
      alert('Erro ao cancelar solicitação. Tente novamente.')
    }
  }

  function applyFilters() {
    let filtered = [...quotes]

    // Filtro de status básico
    if (filter !== 'all') {
      filtered = filtered.filter(q => q.status === filter)
    }

    // Filtros avançados
    if (searchFilters) {
      // Busca por texto
      if (searchFilters.searchTerm) {
        const term = searchFilters.searchTerm.toLowerCase()
        filtered = filtered.filter(q =>
          q.title.toLowerCase().includes(term) ||
          q.quote_number.toLowerCase().includes(term) ||
          q.description?.toLowerCase().includes(term)
        )
      }

      // Filtro de status avançado
      if (searchFilters.status) {
        filtered = filtered.filter(q => q.status === searchFilters.status)
      }

      // Filtro de data inicial
      if (searchFilters.dateFrom) {
        filtered = filtered.filter(q => 
          new Date(q.created_at) >= new Date(searchFilters.dateFrom!)
        )
      }

      // Filtro de data final
      if (searchFilters.dateTo) {
        filtered = filtered.filter(q => 
          new Date(q.created_at) <= new Date(searchFilters.dateTo!)
        )
      }

      // Filtro de valor mínimo
      if (searchFilters.minValue !== undefined) {
        filtered = filtered.filter(q => 
          q.total >= searchFilters.minValue!
        )
      }

      // Filtro de valor máximo
      if (searchFilters.maxValue !== undefined) {
        filtered = filtered.filter(q => 
          q.total <= searchFilters.maxValue!
        )
      }
    }

    setFilteredQuotes(filtered)
  }

  function handleSearch(filters: SearchFilters) {
    setSearchFilters(filters)
    setFilter('all')
  }

  function handleClearSearch() {
    setSearchFilters(null)
    setFilter('all')
  }

  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      expired: 'bg-gray-50 text-gray-700 border-gray-200',
      converted: 'bg-blue-50 text-blue-700 border-blue-200',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  function getStatusLabel(status: string) {
    const labels = {
      pending: 'Aguardando',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      expired: 'Expirado',
      converted: 'Convertido',
    }
    return labels[status as keyof typeof labels] || status
  }

  function getStatusIcon(status: string) {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      expired: <AlertCircle className="w-4 h-4" />,
      converted: <FileText className="w-4 h-4" />,
    }
    return icons[status as keyof typeof icons] || <FileText className="w-4 h-4" />
  }

  function isExpired(validUntil: string) {
    return new Date(validUntil) < new Date()
  }

  function getRequestStatusColor(status: string) {
    const colors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      in_review: 'bg-blue-50 text-blue-700 border-blue-200',
      quoted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cancelled: 'bg-gray-50 text-gray-700 border-gray-200',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  function getRequestStatusLabel(status: string) {
    const labels = {
      pending: 'Aguardando',
      in_review: 'Em Análise',
      quoted: 'Orçamento Enviado',
      cancelled: 'Cancelado',
    }
    return labels[status as keyof typeof labels] || status
  }

  function getRequestStatusIcon(status: string) {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      in_review: <AlertCircle className="w-4 h-4" />,
      quoted: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    }
    return icons[status as keyof typeof icons] || <FileText className="w-4 h-4" />
  }

  function getUrgencyBadge(urgency: string) {
    if (urgency === 'urgent') {
      return (
        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
          🚨 URGENTE
        </span>
      )
    }
    return (
      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
        📅 Normal
      </span>
    )
  }

  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          const maxSize = 1920
          if (width > height && width > maxSize) {
            height = (height / width) * maxSize
            width = maxSize
          } else if (height > maxSize) {
            width = (width / height) * maxSize
            height = maxSize
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            } else {
              resolve(file)
            }
          }, 'image/jpeg', 0.8)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploadingPhotos(true)
    try {
      const compressed = await Promise.all(files.map(f => compressImage(f)))
      setSelectedPhotos(prev => [...prev, ...compressed])
    } catch (error) {
      console.error('Erro ao processar fotos:', error)
      alert('Erro ao processar fotos')
    } finally {
      setUploadingPhotos(false)
    }
  }

  function removePhoto(index: number) {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadPhotos(): Promise<string[]> {
    if (selectedPhotos.length === 0) return []

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const uploadedUrls: string[] = []

    for (const photo of selectedPhotos) {
      const fileName = `quote-requests/${user.id}/${Date.now()}-${photo.name}`
      
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(fileName, photo)

      if (error) {
        console.error('Erro ao fazer upload:', error)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    return uploadedUrls
  }

  async function handleRequestQuote() {
    if (!requestForm.title.trim() || !requestForm.description.trim()) {
      alert('Por favor, preencha o título e a descrição')
      return
    }

    try {
      setSubmitting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError || !profile?.client_id) {
        alert('Erro: Perfil não encontrado ou sem cliente associado.\n\nPor favor, entre em contato com o suporte.')
        return
      }

      // Upload das fotos (se houver)
      const photoUrls = await uploadPhotos()

      // Criar solicitação de orçamento na nova tabela
      const { error } = await supabase
        .from('quote_requests')
        .insert({
          client_id: profile.client_id,
          title: requestForm.title,
          description: requestForm.description,
          urgency: requestForm.urgency,
          status: 'pending',
          photos: photoUrls.length > 0 ? photoUrls : null
        })

      if (error) throw error

      alert('✅ Solicitação enviada com sucesso!\n\n' +
            'Você receberá uma notificação quando o orçamento estiver pronto.\n\n' +
            (requestForm.urgency === 'urgent' 
              ? '⚡ Resposta em até 24 horas' 
              : '📅 Resposta em até 48 horas'))
      
      setShowRequestModal(false)
      setRequestForm({ title: '', description: '', urgency: 'normal' })
      setSelectedPhotos([])
      loadRequests() // Recarregar lista
      setActiveTab('requests') // Mudar para aba de solicitações
    } catch (error) {
      console.error('Erro ao solicitar orçamento:', error)
      alert('Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = quotes.filter(q => q.status === 'pending').length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Carregando orçamentos...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Orçamentos</h1>
                  <p className="text-amber-100 text-sm sm:text-base md:text-lg mt-0.5 sm:mt-1">
                    {pendingCount > 0 ? `${pendingCount} aguardando sua aprovação` : 'Todos os seus orçamentos'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-amber-600 rounded-xl font-bold hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Solicitar Orçamento</span>
                <span className="sm:hidden">Solicitar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 -mt-6 sm:-mt-8 pb-4">
          <div className="flex gap-2 bg-white rounded-xl p-2 shadow-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('quotes')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'quotes'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              💰 Orçamentos Recebidos ({quotes.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📝 Minhas Solicitações ({requests.length})
            </button>
          </div>
        </div>

        {/* Modal de Solicitação */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white">Solicitar Orçamento</h2>
                <p className="text-amber-100 mt-1">Descreva o que você precisa e receba um orçamento</p>
              </div>

              <div className="p-6 space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Título da Solicitação *
                  </label>
                  <input
                    type="text"
                    value={requestForm.title}
                    onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                    placeholder="Ex: Manutenção preventiva em ar condicionado"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">{requestForm.title.length}/100 caracteres</p>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descrição Detalhada *
                  </label>
                  <textarea
                    value={requestForm.description}
                    onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                    placeholder="Descreva em detalhes o que você precisa, incluindo:&#10;- Tipo de serviço ou produto&#10;- Quantidade (se aplicável)&#10;- Especificações técnicas&#10;- Prazo desejado&#10;- Qualquer outra informação relevante"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
                    rows={8}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">{requestForm.description.length}/1000 caracteres</p>
                </div>

                {/* Urgência */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Urgência
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setRequestForm({ ...requestForm, urgency: 'normal' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        requestForm.urgency === 'normal'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">📅</div>
                      <div className="font-semibold">Normal</div>
                      <div className="text-xs text-gray-500">Resposta em até 48h</div>
                    </button>
                    <button
                      onClick={() => setRequestForm({ ...requestForm, urgency: 'urgent' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        requestForm.urgency === 'urgent'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">🚨</div>
                      <div className="font-semibold">Urgente</div>
                      <div className="text-xs text-gray-500">Resposta em até 24h</div>
                    </button>
                  </div>
                </div>

                {/* Fotos */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fotos (Opcional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-amber-400 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      disabled={uploadingPhotos}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer"
                    >
                      <div className="text-4xl mb-2">📸</div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {uploadingPhotos ? 'Processando fotos...' : 'Clique para adicionar fotos'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Ajuda a entendermos melhor sua necessidade
                      </p>
                    </label>
                  </div>

                  {/* Preview das fotos */}
                  {selectedPhotos.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {selectedPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedPhotos.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedPhotos.length} foto{selectedPhotos.length > 1 ? 's' : ''} selecionada{selectedPhotos.length > 1 ? 's' : ''} • Compressão automática aplicada
                    </p>
                  )}
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRequestModal(false)
                      setRequestForm({ title: '', description: '', urgency: 'normal' })
                    }}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRequestQuote}
                    disabled={submitting || !requestForm.title.trim() || !requestForm.description.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Enviando...' : 'Enviar Solicitação'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-6 sm:pb-8">
          {activeTab === 'quotes' ? (
            <>
              {/* Advanced Search */}
              <div className="mb-4 sm:mb-6">
                <AdvancedSearch
                  type="quotes"
                  onSearch={handleSearch}
                  onClear={handleClearSearch}
                />
              </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            {[
              { key: 'all', label: 'Todos', count: quotes.length, icon: '💰' },
              { key: 'pending', label: 'Aguardando', count: quotes.filter(q => q.status === 'pending').length, icon: '⏳' },
              { key: 'approved', label: 'Aprovados', count: quotes.filter(q => q.status === 'approved').length, icon: '✅' },
              { key: 'rejected', label: 'Rejeitados', count: quotes.filter(q => q.status === 'rejected').length, icon: '❌' },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-sm text-xs sm:text-sm md:text-base ${
                  filter === btn.key
                    ? 'bg-white text-amber-600 shadow-lg border-2 border-amber-200'
                    : 'bg-white text-gray-600 hover:bg-white hover:shadow-md border-2 border-transparent'
                }`}
              >
                <span className="mr-1 md:mr-2">{btn.icon}</span>
                <span className="hidden sm:inline">{btn.label} </span>
                <span className="sm:hidden">{btn.label.split(' ')[0]} </span>
                ({btn.count})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredQuotes.length === 0 ? (
              <div className="col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-10 sm:p-16 md:p-20 text-center">
                <div className="inline-flex p-4 sm:p-6 bg-amber-100 rounded-full mb-4 sm:mb-6">
                  <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-amber-600" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-700 mb-2 sm:mb-3">
                  {filter === 'all' ? 'Nenhum orçamento' : `Nenhum orçamento ${getStatusLabel(filter).toLowerCase()}`}
                </p>
                <p className="text-sm sm:text-base text-gray-500">
                  Quando recebermos orçamentos, eles aparecerão aqui
                </p>
              </div>
            ) : (
              filteredQuotes.map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => router.push(`/quotes/${quote.id}`)}
                  className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border border-gray-200 hover:border-amber-300"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3 sm:mb-4">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs sm:text-sm font-mono text-gray-500">
                          {quote.quote_number}
                        </span>
                        {quote.status === 'pending' && isExpired(quote.valid_until) && (
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                            Expirado
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg hover:text-blue-600 transition-colors">
                        {quote.title}
                      </h3>
                    </div>
                    <span className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium border ${getStatusColor(quote.status)} whitespace-nowrap`}>
                      {getStatusIcon(quote.status)}
                      {getStatusLabel(quote.status)}
                    </span>
                  </div>

                  {quote.description && (
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3 sm:mb-4">
                      {quote.description}
                    </p>
                  )}

                  <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Valor Total</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(quote.total)}
                    </p>
                    {quote.items_count && quote.items_count > 0 && (
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                        {quote.items_count} {quote.items_count === 1 ? 'item' : 'itens'}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>
                        Válido até {new Date(quote.valid_until).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {quote.status === 'pending' && (
                      <span className="text-xs sm:text-sm font-medium text-blue-600 whitespace-nowrap">
                        Ver detalhes →
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
            </>
          ) : (
            /* Aba de Solicitações */
            <div className="grid grid-cols-1 gap-4 sm:gap-6 mt-4">
              {requests.length === 0 ? (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-10 sm:p-16 text-center">
                  <div className="inline-flex p-4 sm:p-6 bg-amber-100 rounded-full mb-4 sm:mb-6">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-amber-600" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-700 mb-2 sm:mb-3">
                    Nenhuma solicitação ainda
                  </p>
                  <p className="text-sm sm:text-base text-gray-500 mb-6">
                    Clique em "Solicitar Orçamento" para começar
                  </p>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Solicitar Orçamento
                  </button>
                </div>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-200 hover:border-amber-300"
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {request.request_number && (
                            <span className="text-xs sm:text-sm font-mono text-gray-500">
                              {request.request_number}
                            </span>
                          )}
                          {getUrgencyBadge(request.urgency)}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2">
                          {request.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                          {request.description}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium border ${getRequestStatusColor(request.status)} whitespace-nowrap`}>
                        {getRequestStatusIcon(request.status)}
                        {getRequestStatusLabel(request.status)}
                      </span>
                    </div>

                    {request.photos && request.photos.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">
                          📸 {request.photos.length} foto{request.photos.length > 1 ? 's' : ''} anexada{request.photos.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-2 overflow-x-auto">
                          {request.photos.slice(0, 3).map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Foto ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            />
                          ))}
                          {request.photos.length > 3 && (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-600 font-medium">
                                +{request.photos.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-4 border-t border-gray-100">
                      <div className="text-xs sm:text-sm text-gray-500">
                        Solicitado em {new Date(request.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <>
                            <span className="text-xs sm:text-sm font-medium text-blue-600">
                              {request.urgency === 'urgent' ? '⚡ Resposta em até 24h' : '📅 Resposta em até 48h'}
                            </span>
                            <button
                              onClick={() => handleCancelRequest(request.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Cancelar solicitação"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Cancelar</span>
                            </button>
                          </>
                        )}
                        {request.status === 'quoted' && (
                          <button
                            onClick={() => setActiveTab('quotes')}
                            className="text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700"
                          >
                            Ver Orçamento →
                          </button>
                        )}
                        {request.status === 'in_review' && (
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Cancelar solicitação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Cancelar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
