'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Calendar, Clock, User, FileText, Download, CheckCircle, XCircle, AlertCircle, Image as ImageIcon } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import SignatureModal from '@/components/SignatureModal'
import { generateServiceOrderPDF } from '@/utils/pdfGenerator'

interface ServiceOrder {
  id: string
  order_number: string
  title: string
  description: string
  status: string
  priority: string
  scheduled_date: string
  scheduled_at: string
  completed_date: string
  completed_at: string
  checkin_at: string
  technician_notes: string
  execution_report: string
  photos: string[]
  photos_url: string[]
  technician_id: string
  created_at: string
  updated_at: string
  signature_url?: string
  signer_name?: string
  signer_doc?: string
  signed_at?: string
  clients: {
    name: string
    email: string
    phone: string
    address: string
    cnpj_cpf?: string
    responsible_name?: string
  }
  equipments: {
    name: string
    model: string
    serial_number: string
  }
}

export default function ServiceOrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [isSavingSignature, setIsSavingSignature] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [orderId])

  async function loadOrder() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          clients (
            name,
            email,
            phone,
            address
          ),
          equipments (
            name,
            model,
            serial_number
          )
        `)
        .eq('id', orderId)
        .maybeSingle()

      if (error) throw error
      
      if (!data) {
        alert('Ordem de serviço não encontrada')
        router.push('/service-orders')
        return
      }

      setOrder(data)
    } catch (error) {
      console.error('Erro ao carregar ordem:', error)
      alert('Erro ao carregar ordem de serviço')
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border-amber-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  function getStatusLabel(status: string) {
    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      completed: 'Concluída',
      cancelled: 'Cancelada',
    }
    return labels[status as keyof typeof labels] || status
  }

  function getStatusIcon(status: string) {
    const icons = {
      pending: <Clock className="w-5 h-5" />,
      in_progress: <AlertCircle className="w-5 h-5" />,
      completed: <CheckCircle className="w-5 h-5" />,
      cancelled: <XCircle className="w-5 h-5" />,
    }
    return icons[status as keyof typeof icons]
  }

  function getPriorityColor(priority: string) {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    }
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  function getPriorityLabel(priority: string) {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
    }
    return labels[priority as keyof typeof labels] || priority
  }

  async function handleDownloadPDF() {
    if (!order) return
    
    // Se já tem assinatura, gera PDF direto
    if (order.signature_url) {
      try {
        await generateServiceOrderPDF(order)
      } catch (error) {
        console.error('Erro ao gerar PDF:', error)
        alert('Erro ao gerar PDF')
      }
      return
    }

    // Se não tem assinatura, abre modal
    setShowSignatureModal(true)
  }

  async function handleSaveSignature(signatureData: string, signerName: string, signerDoc: string) {
    if (!order) return

    try {
      setIsSavingSignature(true)

      console.log('Iniciando salvamento da assinatura...')

      // OPÇÃO 1: Tentar fazer upload para storage
      let signatureUrl = signatureData // Fallback: usar base64 direto
      
      try {
        // Converter base64 para blob
        const base64Data = signatureData.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/png' })

        console.log('Blob criado, tamanho:', blob.size)

        // Upload para storage
        const fileName = `signatures/order-${order.id}-${Date.now()}.png`
        console.log('Tentando upload:', fileName)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: false
          })

        if (uploadError) {
          console.warn('Erro no upload, usando base64:', uploadError)
          // Continua com base64
        } else {
          console.log('Upload bem-sucedido:', uploadData)
          
          // Pegar URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName)
          
          signatureUrl = publicUrl
          console.log('URL pública:', publicUrl)
        }
      } catch (storageError) {
        console.warn('Erro no storage, usando base64:', storageError)
        // Continua com base64
      }

      console.log('Atualizando ordem no banco...')

      // Atualizar ordem com assinatura
      const { data: updateData, error: updateError } = await supabase
        .from('service_orders')
        .update({
          signature_url: signatureUrl,
          signer_name: signerName,
          signer_doc: signerDoc || null,
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .select()

      if (updateError) {
        console.error('Erro ao atualizar ordem:', updateError)
        throw updateError
      }

      console.log('Ordem atualizada:', updateData)

      // Atualizar estado local
      const updatedOrder = {
        ...order,
        signature_url: signatureUrl,
        signer_name: signerName,
        signer_doc: signerDoc,
        signed_at: new Date().toISOString()
      }
      
      setOrder(updatedOrder)

      // Fechar modal
      setShowSignatureModal(false)

      console.log('Gerando PDF...')

      // Gerar PDF com assinatura
      await generateServiceOrderPDF(updatedOrder)

      alert('✅ Assinatura salva e PDF gerado com sucesso!')

    } catch (error: any) {
      console.error('Erro ao salvar assinatura:', error)
      console.error('Detalhes do erro:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      alert(`Erro ao salvar assinatura: ${error.message || 'Tente novamente.'}`)
    } finally {
      setIsSavingSignature(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Carregando ordem...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-700">Ordem não encontrada</p>
            <button
              onClick={() => router.push('/service-orders')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voltar
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 sm:px-6 md:px-8 py-8 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.push('/service-orders')}
              className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-blue-100 text-sm mb-1">{order.order_number}</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{order.title}</h1>
              </div>
              {(order.status === 'completed' || order.status === 'concluido') && (
                <button
                  onClick={handleDownloadPDF}
                  disabled={isSavingSignature}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                  <span>{order.signature_url ? 'Baixar PDF' : 'Assinar e Baixar PDF'}</span>
                </button>
              )}
              {order.status !== 'completed' && order.status !== 'concluido' && (
                <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-semibold text-sm border-2 border-yellow-300">
                  <span>📋 PDF disponível após conclusão</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 -mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status e Prioridade */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Prioridade:</span>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getPriorityColor(order.priority)}`}>
                      {getPriorityLabel(order.priority)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Descrição do Serviço
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{order.description}</p>
              </div>

              {/* Notas do Técnico */}
              {order.technician_notes && (
                <div className="bg-blue-50 rounded-xl shadow-lg p-6 border border-blue-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Notas do Técnico
                  </h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{order.technician_notes}</p>
                </div>
              )}

              {/* Fotos */}
              {((order.photos_url && order.photos_url.length > 0) || (order.photos && order.photos.length > 0)) && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    Fotos ({(order.photos_url || order.photos).length})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {(order.photos_url || order.photos).map((photo, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedPhoto(photo)}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
                      >
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Lateral */}
            <div className="space-y-6">
              {/* Datas */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Datas
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Criada em</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {order.scheduled_date && (
                    <div>
                      <p className="text-sm text-gray-600">Agendada para</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(order.scheduled_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                  {order.completed_date && (
                    <div>
                      <p className="text-sm text-gray-600">Concluída em</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(order.completed_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Equipamento */}
              {order.equipments && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipamento</h2>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Nome</p>
                      <p className="text-gray-900 font-medium">{order.equipments.name}</p>
                    </div>
                    {order.equipments.model && (
                      <div>
                        <p className="text-sm text-gray-600">Modelo</p>
                        <p className="text-gray-900 font-medium">{order.equipments.model}</p>
                      </div>
                    )}
                    {order.equipments.serial_number && (
                      <div>
                        <p className="text-sm text-gray-600">Número de Série</p>
                        <p className="text-gray-900 font-medium">{order.equipments.serial_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Foto */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl"
            >
              ×
            </button>
            <img
              src={selectedPhoto}
              alt="Foto ampliada"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* Modal de Assinatura */}
        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSave={handleSaveSignature}
          defaultName={order.clients?.name || ''}
          defaultDoc={order.clients?.cnpj_cpf || ''}
        />
      </div>
    </DashboardLayout>
  )
}
