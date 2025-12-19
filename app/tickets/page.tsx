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
        .select(`
          *,
          creator:profiles!tickets_created_by_fkey(full_name)
        `)
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

    // Filtro de status básico
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.status === filter)
    }

    // Filtros avançados
    if (searchFilters) {
      // Busca por texto
      if (searchFilters.searchTerm) {
        const term = searchFilters.searchTerm.toLowerCase()
        filtered = filtered.filter(t =>
          t.title.toLowerCase().includes(term) ||
          t.ticket_number.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term)
        )
      }

      // Filtro de status avançado
      if (searchFilters.status) {
        filtered = filtered.filter(t => t.status === searchFilters.status)
      }

      // Filtro de prioridade
      if (searchFilters.priority) {
        filtered = filtered.filter(t => t.priority === searchFilters.priority)
      }

      // Filtro de data inicial
      if (searchFilters.dateFrom) {
        filtered = filtered.filter(t => 
          new Date(t.created_at) >= new Date(searchFilters.dateFrom!)
        )
      }

      // Filtro de data final
      if (searchFilters.dateTo) {
        filtered = filtered.filter(t => 
          new Date(t.created_at) <= new Date(searchFilters.dateTo!)
        )
      }
    }

    setFilteredTickets(filtered)
  }

  function handleSearch(filters: SearchFilters) {
    setSearchFilters(filters)
    setFilter('all')
  }

  function handleClearSearch() {
    setSearchFilters(null)
    setFilter('all')
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limitar a 5 fotos
    const maxFiles = 5
    const totalFiles = selectedFiles.length + files.length
    if (totalFiles > maxFiles) {
      setError(`Máximo de ${maxFiles} fotos permitidas`)
      return
    }

    setCompressing(true)
    setError('')

    try {
      // Calcular tamanho original
      const originalSize = files.reduce((sum, file) => sum + file.size, 0)

      // Comprimir imagens
      const compressedFiles = await compressImages(files, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
        maxSizeMB: 2,
      })

      // Calcular tamanho comprimido
      const compressedSize = compressedFiles.reduce((sum, file) => sum + file.size, 0)

      // Salvar estatísticas
      setCompressionStats({
        original: originalSize,
        compressed: compressedSize,
      })

      // Adicionar arquivos comprimidos
      setSelectedFiles(prev => [...prev, ...compressedFiles])

      // Criar previews
      compressedFiles.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrls(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    } catch (error) {
      console.error('Erro ao comprimir imagens:', error)
      setError('Erro ao processar imagens. Tente novamente.')
    } finally {
      setCompressing(false)
    }
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

        const { error: uploadError } = await supabase.storage
          .from('os-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('os-photos')
          .getPublicUrl(filePath)

        uploadedUrls.push(data.publicUrl)
      }

      return uploadedUrls
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      throw new Error('Erro ao fazer upload das fotos')
    } finally {
      setUploading(false)
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single()

      if (!profile?.client_id) throw new Error('Cliente não encontrado')

      // Upload de fotos (se houver)
      let photoUrls: string[] = []
      if (selectedFiles.length > 0) {
        photoUrls = await uploadPhotos()
      }

      if (editingTicket) {
        // Atualizar chamado existente
        const updateData: any = {
          title: title.trim(),
          description: description.trim(),
          priority
        }

        // Adicionar fotos se houver
        if (photoUrls.length > 0) {
          updateData.photos_url = [...(editingTicket.photos_url || []), ...photoUrls]
        }

        const { error: updateError } = await supabase
          .from('tickets')
          .update(updateData)
          .eq('id', editingTicket.id)

        if (updateError) throw updateError
      } else {
        // Criar novo chamado
        const { data: newTicket, error: insertError } = await supabase
          .from('tickets')
          .insert({
            client_id: profile.client_id,
            title: title.trim(),
            description: description.trim(),
            priority,
            status: 'aberto',
            created_by: user.id,
            photos_url: photoUrls
          })
          .select('id, ticket_number')
          .single()

        if (insertError) throw insertError

        // Buscar nome do cliente para a notificação
        const { data: clientData } = await supabase
          .from('clients')
          .select('name')
          .eq('id', profile.client_id)
          .single()

        // Criar notificações para TODOS os usuários da plataforma (admin, super_admin, técnicos)
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['admin', 'super_admin', 'technician'])
          .eq('is_active', true)

        if (allUsers && allUsers.length > 0) {
          const notifications = allUsers.map(u => ({
            user_id: u.id,
            title: '🎫 Novo Chamado Aberto',
            message: `Cliente: ${clientData?.name || 'N/A'} - ${title.trim()}`,
            type: 'ticket',
            reference_id: newTicket?.id,
            is_read: false
          }))

          await supabase.from('notifications').insert(notifications)
        }
      }

      setShowModal(false)
      setEditingTicket(null)
      setTitle('')
      setDescription('')
      setPriority('media')
      setSelectedFiles([])
      setPreviewUrls([])
      loadTickets()
    } catch (error: any) {
      setError(error.message || 'Erro ao salvar chamado')
    } finally {
      setCreating(false)
    }
  }

  function handleEditTicket(ticket: TicketData) {
    if (ticket.status !== 'aberto') {
      alert('Apenas chamados abertos podem ser editados')
      return
    }
    setEditingTicket(ticket)
    setTitle(ticket.title)
    setDescription(ticket.description)
    setPriority(ticket.priority as 'baixa' | 'media' | 'alta')
    setSelectedFiles([])
    setPreviewUrls([])
    setShowModal(true)
  }

  async function handleDeleteTicket(ticket: TicketData) {
    if (ticket.status === 'convertido') {
      alert('Chamados convertidos em OS não podem ser excluídos')
      return
    }

    if (!confirm(`Deseja realmente excluir o chamado ${ticket.ticket_number}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticket.id)

      if (error) throw error

      loadTickets()
    } catch (error: any) {
      console.error('Erro ao excluir chamado:', error)
      alert('Erro ao excluir chamado: ' + error.message)
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      aberto: 'bg-blue-100 text-blue-800 border-blue-200',
      em_analise: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      aprovado: 'bg-green-100 text-green-800 border-green-200',
      rejeitado: 'bg-red-100 text-red-800 border-red-200',
      convertido: 'bg-purple-100 text-purple-800 border-purple-200',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  function getStatusLabel(status: string) {
    const labels = {
      aberto: 'Aberto',
      em_analise: 'Em Análise',
      aprovado: 'Aprovado',
      rejeitado: 'Rejeitado',
      convertido: 'Convertido em OS',
    }
    return labels[status as keyof typeof labels] || status
  }

  function getStatusIcon(status: string) {
    const icons = {
      aberto: <Clock className="w-5 h-5" />,
      em_analise: <AlertCircle className="w-5 h-5" />,
      aprovado: <CheckCircle className="w-5 h-5" />,
      rejeitado: <XCircle className="w-5 h-5" />,
      convertido: <CheckCircle className="w-5 h-5" />,
    }
    return icons[status as keyof typeof icons] || <Clock className="w-5 h-5" />
  }

  function getPriorityLabel(priority: string) {
    const labels = {
      baixa: '🟢 Baixa',
      media: '🟡 Média',
      alta: '🔴 Alta',
    }
    return labels[priority as keyof typeof labels] || priority
  }

  const openCount = tickets.filter(t => t.status === 'aberto').length

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Carregando chamados...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Chamados</h1>
                  <p className="text-blue-100 text-lg mt-1">
                    {openCount > 0 ? `${openCount} chamado${openCount > 1 ? 's' : ''} aberto${openCount > 1 ? 's' : ''}` : 'Todos os seus chamados'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingTicket(null)
                  setTitle('')
                  setDescription('')
                  setPriority('media')
                  setShowModal(true)
                }}
                className="px-6 py-4 bg-white text-blue-600 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Novo Chamado</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 -mt-8 pb-8">
          {/* Advanced Search */}
          <div className="mb-6">
            <AdvancedSearch
              type="tickets"
              onSearch={handleSearch}
              onClear={handleClearSearch}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              { key: 'all', label: 'Todos', count: tickets.length, icon: '📋' },
              { key: 'aberto', label: 'Abertos', count: tickets.filter(t => t.status === 'aberto').length, icon: '🔵' },
              { key: 'em_analise', label: 'Em Análise', count: tickets.filter(t => t.status === 'em_analise').length, icon: '🟡' },
              { key: 'aprovado', label: 'Aprovados', count: tickets.filter(t => t.status === 'aprovado').length, icon: '✅' },
              { key: 'rejeitado', label: 'Rejeitados', count: tickets.filter(t => t.status === 'rejeitado').length, icon: '❌' },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key as any)}
                className={`px-5 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                  filter === btn.key
                    ? 'bg-white text-blue-600 shadow-xl border-2 border-blue-200'
                    : 'bg-white text-gray-600 hover:shadow-xl border-2 border-transparent'
                }`}
              >
                <span className="mr-2">{btn.icon}</span>
                {btn.label} ({btn.count})
              </button>
            ))}
          </div>

          <div className="grid gap-6">
            {filteredTickets.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-20 text-center">
                <div className="inline-flex p-6 bg-blue-100 rounded-full mb-6">
                  <Ticket className="w-16 h-16 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-700 mb-3">
                  Nenhum chamado encontrado
                </p>
                <p className="text-gray-500 mb-8">
                  {filter === 'all' 
                    ? 'Crie seu primeiro chamado' 
                    : 'Nenhum chamado com este status'}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Novo Chamado
                </button>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-gray-500">{ticket.ticket_number}</span>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {getStatusLabel(ticket.status)}
                        </span>
                        <span className="text-sm font-medium">{getPriorityLabel(ticket.priority)}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {ticket.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{ticket.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap items-center gap-4">
                      {ticket.creator && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>Aberto por: {ticket.creator.full_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(ticket.created_at).toLocaleDateString('pt-BR')} às {new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {ticket.status === 'aberto' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditTicket(ticket)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar chamado"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Excluir chamado"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  {ticket.rejection_reason && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-red-900 mb-1">Motivo da Rejeição:</p>
                      <p className="text-sm text-red-800">{ticket.rejection_reason}</p>
                    </div>
                  )}

                  {ticket.converted_to_order_id && (
                    <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-purple-900">
                        ✓ Convertido em Ordem de Serviço
                      </p>
                    </div>
                  )}

                  {/* Fotos Anexadas */}
                  {ticket.photos_url && ticket.photos_url.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5 sm:gap-2">
                        <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Fotos Anexadas ({ticket.photos_url.length})
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
                        {ticket.photos_url.map((url, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(url)}
                            className="relative group overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors aspect-square"
                          >
                            <img
                              src={url}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
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

      {/* Modal de Visualização de Imagem */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-2 sm:p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white text-gray-900 rounded-full p-2 sm:p-2.5 hover:bg-gray-100 transition-colors shadow-lg z-10"
            >
              <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Visualização"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 md:p-8 my-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                {editingTicket ? <Edit2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" /> : <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {editingTicket ? 'Editar Chamado' : 'Novo Chamado'}
              </h2>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Descreva brevemente o problema"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Descrição *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o problema em detalhes..."
                  rows={3}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Prioridade
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { key: 'baixa', label: 'Baixa', icon: '🟢' },
                    { key: 'media', label: 'Média', icon: '🟡' },
                    { key: 'alta', label: 'Alta', icon: '🔴' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPriority(p.key as any)}
                      className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all ${
                        priority === p.key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">{p.icon}</div>
                      <div className="text-[10px] sm:text-xs font-bold text-gray-700">{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload de Fotos */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-2">
                  Fotos (Opcional)
                  <span className="flex items-center gap-1 text-[10px] sm:text-xs text-green-600 font-normal">
                    <Zap className="w-3 h-3" />
                    Compressão automática
                  </span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploading || creating || compressing}
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`flex flex-col items-center justify-center py-2 ${compressing ? 'cursor-wait' : 'cursor-pointer'}`}
                  >
                    {compressing ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-200 border-t-blue-600 mb-1 sm:mb-2"></div>
                        <p className="text-xs sm:text-sm font-medium text-blue-600 text-center">
                          Comprimindo imagens...
                        </p>
                      </>
                    ) : (
                      <>
                        <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-1 sm:mb-2" />
                        <p className="text-xs sm:text-sm font-medium text-gray-700 text-center">
                          Clique para adicionar fotos
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 text-center">
                          Máximo 5 fotos • Compressão automática
                        </p>
                      </>
                    )}
                  </label>
                </div>

                {/* Estatísticas de Compressão */}
                {compressionStats && (
                  <div className="mt-2 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-green-800">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">
                        Economia de {calculateReduction(compressionStats.original, compressionStats.compressed)}%
                      </span>
                      <span className="text-green-600">
                        ({formatFileSize(compressionStats.original)} → {formatFileSize(compressionStats.compressed)})
                      </span>
                    </div>
                  </div>
                )}

                {/* Preview das Fotos */}
                {previewUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 sm:h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                        >
                          <XIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploading && (
                  <div className="mt-2 sm:mt-3 flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-xs sm:text-sm font-medium">Fazendo upload...</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTicket(null)
                    setTitle('')
                    setDescription('')
                    setPriority('media')
                    setSelectedFiles([])
                    setPreviewUrls([])
                    setError('')
                  }}
                  disabled={creating}
                  className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || uploading}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                      <span className="hidden sm:inline">Criando...</span>
                    </>
                  ) : (
                    <>
                      {editingTicket ? <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                      <span>{editingTicket ? 'Salvar' : 'Criar'}</span>
                      <span className="hidden sm:inline">{editingTicket ? 'Alterações' : 'Chamado'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
