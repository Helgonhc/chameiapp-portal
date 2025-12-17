'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  DollarSign, FileText, Calendar, CheckCircle, XCircle, Clock, 
  AlertCircle, ArrowLeft, Download, User, MapPin, Phone, Mail,
  Package, FileCheck, Send, MessageCircle
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { generateQuotePDF } from '@/utils/generateQuotePDF'
import { sendWhatsAppNotification, sendEmailNotification } from '@/utils/quoteNotifications'

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
  approved_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  clients: {
    name: string
    email: string
    phone: string
    address: string
    cnpj_cpf: string
  }
  profiles: {
    full_name: string
  }
}

interface QuoteItem {
  id: string
  name: string
  description: string
  item_type: string
  quantity: number
  unit_price: number
  total: number
  sort_order: number
}

export default function QuoteDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (quoteId) {
      loadQuote()
    }
  }, [quoteId])

  async function loadQuote() {
    try {
      setLoading(true)
      
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          clients (name, email, phone, address, cnpj_cpf),
          profiles!quotes_created_by_fkey (full_name)
        `)
        .eq('id', quoteId)
        .single()

      if (quoteError) throw quoteError
      setQuote(quoteData)

      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('sort_order')

      if (itemsError) throw itemsError
      setItems(itemsData || [])
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error)
      router.push('/quotes')
    } finally {
      setLoading(false)
    }
  }

  // Função para enviar notificações (email + WhatsApp)
  async function sendQuoteStatusNotifications(status: 'aprovado' | 'rejeitado', reason?: string) {
    if (!quote) return
    
    try {
      // Buscar configurações da empresa
      const { data: config } = await supabase
        .from('app_config')
        .select('company_name, email, phone')
        .limit(1)
        .single()

      // Buscar admins para notificar
      const { data: admins } = await supabase
        .from('profiles')
        .select('email, full_name, phone')
        .eq('role', 'admin')
        .eq('is_active', true)

      const clientName = quote.clients?.name || 'Cliente'
      const quoteNumber = quote.quote_number
      const quoteTitle = quote.title
      const quoteTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total || 0)

      // ========== ENVIAR EMAIL ==========
      const emailSubject = status === 'aprovado' 
        ? `✅ Orçamento ${quoteNumber} APROVADO - ${clientName}`
        : `❌ Orçamento ${quoteNumber} REJEITADO - ${clientName}`

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${status === 'aprovado' ? '#10B981' : '#EF4444'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .label { color: #6b7280; }
            .value { font-weight: bold; color: #111827; }
            .total { font-size: 24px; color: ${status === 'aprovado' ? '#10B981' : '#EF4444'}; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .reason { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${status === 'aprovado' ? '✅ Orçamento Aprovado!' : '❌ Orçamento Rejeitado'}</h1>
            </div>
            <div class="content">
              <p>O cliente <strong>${clientName}</strong> ${status === 'aprovado' ? 'APROVOU' : 'rejeitou'} o orçamento:</p>
              
              <div class="info-box">
                <div class="info-row">
                  <span class="label">Número:</span>
                  <span class="value">${quoteNumber}</span>
                </div>
                <div class="info-row">
                  <span class="label">Título:</span>
                  <span class="value">${quoteTitle}</span>
                </div>
                <div class="info-row">
                  <span class="label">Valor Total:</span>
                  <span class="value total">${quoteTotal}</span>
                </div>
              </div>
              
              ${reason ? `
              <div class="reason">
                <strong>📝 Motivo da rejeição:</strong><br>
                ${reason}
              </div>
              ` : ''}
              
              <p style="margin-top: 20px;">
                ${status === 'aprovado' 
                  ? '🎉 Acesse o sistema para dar continuidade ao serviço.' 
                  : 'Entre em contato com o cliente para mais informações.'}
              </p>
            </div>
            <div class="footer">
              ${config?.company_name || 'Sistema de Gestão'} - Notificação Automática
            </div>
          </div>
        </body>
        </html>
      `

      // Tentar enviar email via Edge Function
      for (const admin of (admins || [])) {
        if (admin.email) {
          try {
            await supabase.functions.invoke('send-email', {
              body: {
                to: admin.email,
                subject: emailSubject,
                html: emailHtml
              }
            })
            console.log('Email enviado para:', admin.email)
          } catch (emailError) {
            console.log('Edge function de email não configurada, usando fallback')
          }
        }
      }

      // ========== ABRIR WHATSAPP ==========
      // Buscar telefone do admin principal
      const adminPhone = admins?.[0]?.phone || config?.phone
      if (adminPhone) {
        const whatsappMessage = status === 'aprovado'
          ? `✅ *ORÇAMENTO APROVADO!*\n\n` +
            `📋 *Número:* ${quoteNumber}\n` +
            `👤 *Cliente:* ${clientName}\n` +
            `📝 *Título:* ${quoteTitle}\n` +
            `💰 *Valor:* ${quoteTotal}\n\n` +
            `🎉 O cliente aprovou o orçamento! Acesse o sistema para dar continuidade.`
          : `❌ *ORÇAMENTO REJEITADO*\n\n` +
            `📋 *Número:* ${quoteNumber}\n` +
            `👤 *Cliente:* ${clientName}\n` +
            `📝 *Título:* ${quoteTitle}\n` +
            `💰 *Valor:* ${quoteTotal}\n` +
            (reason ? `\n📝 *Motivo:* ${reason}\n` : '') +
            `\nEntre em contato com o cliente para mais informações.`

        // Formatar telefone (remover caracteres especiais)
        const cleanPhone = adminPhone.replace(/\D/g, '')
        const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
        
        // Perguntar se quer enviar WhatsApp
        if (confirm(`Deseja enviar notificação via WhatsApp para ${adminPhone}?`)) {
          window.open(whatsappUrl, '_blank')
        }
      }
      
    } catch (error) {
      console.error('Erro ao enviar notificações:', error)
      // Não bloquear a aprovação/rejeição se as notificações falharem
    }
  }

  async function handleApprove() {
    if (!confirm('Deseja aprovar este orçamento?')) return
    
    try {
      setActionLoading(true)
      const { error } = await supabase
        .from('quotes')
        .update({
          status: 'aprovado',
          approved_at: new Date().toISOString()
        })
        .eq('id', quoteId)

      if (error) throw error
      
      // Enviar notificações (email + WhatsApp)
      await sendQuoteStatusNotifications('aprovado')
      
      alert('✅ Orçamento aprovado com sucesso!')
      loadQuote()
    } catch (error: any) {
      console.error('Erro ao aprovar:', error)
      alert('Erro ao aprovar orçamento: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    try {
      setActionLoading(true)
      const { error } = await supabase
        .from('quotes')
        .update({
          status: 'rejeitado',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectReason || null
        })
        .eq('id', quoteId)

      if (error) throw error
      
      // Enviar notificações (email + WhatsApp)
      await sendQuoteStatusNotifications('rejeitado', rejectReason)
      
      alert('Orçamento rejeitado.')
      setShowRejectModal(false)
      setRejectReason('')
      loadQuote()
    } catch (error: any) {
      console.error('Erro ao rejeitar:', error)
      alert('Erro ao rejeitar orçamento: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }


  function handleGeneratePDF() {
    if (quote) {
      generateQuotePDF(quote, items)
    }
  }

  // Função para enviar email manualmente
  async function handleSendEmail() {
    if (!quote) return
    
    try {
      // Buscar configurações da empresa
      const { data: config } = await supabase
        .from('app_config')
        .select('company_name, email, phone, logo_url, primary_color')
        .limit(1)
        .single()

      // Buscar APENAS admins para notificar (não técnicos)
      const { data: admins } = await supabase
        .from('profiles')
        .select('email, full_name, phone')
        .eq('role', 'admin')
        .eq('is_active', true)

      const companyName = config?.company_name || 'Empresa'
      const companyLogo = config?.logo_url || ''
      const primaryColor = config?.primary_color || '#0044cc'
      const clientName = quote.clients?.name || 'Cliente'
      const clientPhone = quote.clients?.phone || ''
      const clientEmail = quote.clients?.email || ''
      const quoteNumber = quote.quote_number
      const quoteTitle = quote.title
      const quoteTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total || 0)
      const status = quote.status === 'aprovado' || quote.status === 'approved' ? 'aprovado' : 'rejeitado'
      const statusColor = status === 'aprovado' ? '#10B981' : '#EF4444'
      const statusBg = status === 'aprovado' ? '#D1FAE5' : '#FEE2E2'

      // Coletar todos os emails dos admins com nomes
      const adminsList = (admins || [])
        .filter(a => !!a.email)
        .map(a => ({ email: a.email!, name: a.full_name || 'Admin' }))

      // ========== EMAILS FIXOS ADICIONAIS (edite aqui se quiser) ==========
      const emailsFixos: { email: string; name: string }[] = [
        // { email: 'gerente@empresa.com', name: 'Gerente' },
        // { email: 'financeiro@empresa.com', name: 'Financeiro' },
      ]
      
      // Combinar todos (remover duplicados por email)
      const todosDestinatarios = [...adminsList, ...emailsFixos]
        .filter((item, index, self) => 
          index === self.findIndex(t => t.email === item.email)
        )

      if (todosDestinatarios.length === 0) {
        alert('⚠️ Nenhum email de admin encontrado para enviar.')
        return
      }

      // Mostrar confirmação com lista de destinatários
      const listaEmails = todosDestinatarios.map(d => `• ${d.name}: ${d.email}`).join('\n')
      const confirmar = confirm(
        `📧 O email será enviado para:\n\n${listaEmails}\n\nDeseja continuar?`
      )
      
      if (!confirmar) return

      const todosEmails = todosDestinatarios.map(d => d.email)

      const emailSubject = status === 'aprovado' 
        ? `✅ Orçamento ${quoteNumber} APROVADO - ${clientName}`
        : `❌ Orçamento ${quoteNumber} REJEITADO - ${clientName}`

      // Template HTML bonito e profissional
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; }
            .wrapper { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd); color: white; padding: 30px; text-align: center; }
            .header img { max-width: 120px; margin-bottom: 15px; border-radius: 8px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
            .content { padding: 30px; }
            .alert-box { background: ${statusBg}; border-left: 4px solid ${statusColor}; padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; }
            .alert-box p { margin: 0; color: ${statusColor}; font-weight: 600; }
            .info-section { margin-bottom: 25px; }
            .info-section h3 { color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
            .info-grid { display: table; width: 100%; }
            .info-row { display: table-row; }
            .info-label { display: table-cell; padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px; }
            .info-value { display: table-cell; padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; }
            .total-box { background: linear-gradient(135deg, ${primaryColor}10, ${primaryColor}05); border: 2px solid ${primaryColor}; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; }
            .total-label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .total-value { color: ${primaryColor}; font-size: 32px; font-weight: bold; margin-top: 5px; }
            .reason-box { background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin-top: 20px; }
            .reason-box h4 { color: #92400E; margin: 0 0 8px; font-size: 14px; }
            .reason-box p { color: #78350F; margin: 0; font-size: 14px; }
            .footer { background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { margin: 0; color: #9ca3af; font-size: 12px; }
            .btn { display: inline-block; background: ${primaryColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="card">
              <div class="header">
                ${companyLogo ? `<img src="${companyLogo}" alt="${companyName}">` : ''}
                <h1>${status === 'aprovado' ? '✅ Orçamento Aprovado!' : '❌ Orçamento Rejeitado'}</h1>
                <p>${companyName}</p>
              </div>
              
              <div class="content">
                <div class="alert-box">
                  <p>${status === 'aprovado' 
                    ? `🎉 Ótima notícia! O cliente ${clientName} APROVOU o orçamento.`
                    : `O cliente ${clientName} rejeitou o orçamento.`
                  }</p>
                </div>

                <div class="info-section">
                  <h3>📋 Dados do Orçamento</h3>
                  <div class="info-grid">
                    <div class="info-row">
                      <span class="info-label">Número:</span>
                      <span class="info-value">${quoteNumber}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Título:</span>
                      <span class="info-value">${quoteTitle}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Descrição:</span>
                      <span class="info-value">${quote.description || '-'}</span>
                    </div>
                  </div>
                </div>

                <div class="total-box">
                  <div class="total-label">Valor Total</div>
                  <div class="total-value">${quoteTotal}</div>
                </div>

                <div class="info-section">
                  <h3>👤 Dados do Cliente</h3>
                  <div class="info-grid">
                    <div class="info-row">
                      <span class="info-label">Nome:</span>
                      <span class="info-value">${clientName}</span>
                    </div>
                    ${clientPhone ? `
                    <div class="info-row">
                      <span class="info-label">Telefone:</span>
                      <span class="info-value">${clientPhone}</span>
                    </div>
                    ` : ''}
                    ${clientEmail ? `
                    <div class="info-row">
                      <span class="info-label">Email:</span>
                      <span class="info-value">${clientEmail}</span>
                    </div>
                    ` : ''}
                  </div>
                </div>

                ${quote.rejection_reason ? `
                <div class="reason-box">
                  <h4>📝 Motivo da Rejeição</h4>
                  <p>${quote.rejection_reason}</p>
                </div>
                ` : ''}

                <p style="text-align: center; color: #6b7280; margin-top: 25px;">
                  ${status === 'aprovado' 
                    ? 'Acesse o sistema para dar continuidade ao serviço.'
                    : 'Entre em contato com o cliente para mais informações.'
                  }
                </p>
              </div>
              
              <div class="footer">
                <p>📧 Este email foi enviado automaticamente pelo Portal do Cliente</p>
                <p style="margin-top: 5px;">${companyName} - ${new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

      // Enviar para TODOS os emails de uma vez
      try {
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: { 
            to: todosEmails,  // Array de emails
            subject: emailSubject, 
            html: emailHtml,
            replyTo: clientEmail || undefined
          }
        })

        if (error) throw error

        alert(`✅ Email enviado com sucesso para ${todosEmails.length} destinatário(s)!\n\n${todosEmails.join('\n')}`)
      } catch (e) {
        console.log('Edge function não disponível, usando fallback:', e)
        
        // Fallback: abrir cliente de email
        const mailtoUrl = `mailto:${todosEmails.join(',')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(
          `${status === 'aprovado' ? '✅ ORÇAMENTO APROVADO' : '❌ ORÇAMENTO REJEITADO'}\n\n` +
          `Número: ${quoteNumber}\n` +
          `Cliente: ${clientName}\n` +
          `Título: ${quoteTitle}\n` +
          `Valor: ${quoteTotal}\n` +
          (quote.rejection_reason ? `Motivo: ${quote.rejection_reason}\n` : '')
        )}`
        window.open(mailtoUrl, '_blank')
        alert('📧 Abrindo cliente de email...')
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      alert('Erro ao enviar email')
    }
  }

  // Função para enviar WhatsApp manualmente
  function handleSendWhatsApp() {
    if (!quote) return
    
    const fetchAdminPhone = async () => {
      // Buscar telefone do admin
      const { data: config } = await supabase
        .from('app_config')
        .select('phone')
        .limit(1)
        .single()

      const { data: admins } = await supabase
        .from('profiles')
        .select('phone')
        .eq('role', 'admin')
        .eq('is_active', true)
        .limit(1)

      return admins?.[0]?.phone || config?.phone || ''
    }

    fetchAdminPhone().then(adminPhone => {
      const clientName = quote.clients?.name || 'Cliente'
      const quoteNumber = quote.quote_number
      const quoteTitle = quote.title
      const quoteTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total || 0)
      const status = quote.status === 'aprovado' || quote.status === 'approved' ? 'aprovado' : 'rejeitado'

      const message = status === 'aprovado'
        ? `✅ *ORÇAMENTO APROVADO!*\n\n` +
          `📋 *Número:* ${quoteNumber}\n` +
          `👤 *Cliente:* ${clientName}\n` +
          `📝 *Título:* ${quoteTitle}\n` +
          `💰 *Valor:* ${quoteTotal}\n\n` +
          `🎉 O cliente aprovou o orçamento!`
        : `❌ *ORÇAMENTO REJEITADO*\n\n` +
          `📋 *Número:* ${quoteNumber}\n` +
          `👤 *Cliente:* ${clientName}\n` +
          `📝 *Título:* ${quoteTitle}\n` +
          `💰 *Valor:* ${quoteTotal}\n` +
          (quote.rejection_reason ? `\n📝 *Motivo:* ${quote.rejection_reason}` : '')

      // Formatar telefone
      const cleanPhone = adminPhone.replace(/\D/g, '')
      const whatsappUrl = cleanPhone 
        ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`
      
      window.open(whatsappUrl, '_blank')
    })
  }


  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pendente: 'bg-amber-50 text-amber-700 border-amber-200',
      aprovado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejeitado: 'bg-red-50 text-red-700 border-red-200',
      expirado: 'bg-gray-50 text-gray-700 border-gray-200',
      convertido: 'bg-blue-50 text-blue-700 border-blue-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      expired: 'bg-gray-50 text-gray-700 border-gray-200',
      converted: 'bg-blue-50 text-blue-700 border-blue-200',
    }
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pendente: 'Aguardando Aprovação',
      aprovado: 'Aprovado',
      rejeitado: 'Rejeitado',
      expirado: 'Expirado',
      convertido: 'Convertido em OS',
      pending: 'Aguardando Aprovação',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      expired: 'Expirado',
      converted: 'Convertido em OS',
    }
    return labels[status] || status
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pendente':
      case 'pending':
        return <Clock className="w-5 h-5" />
      case 'aprovado':
      case 'approved':
        return <CheckCircle className="w-5 h-5" />
      case 'rejeitado':
      case 'rejected':
        return <XCircle className="w-5 h-5" />
      case 'expirado':
      case 'expired':
        return <AlertCircle className="w-5 h-5" />
      case 'convertido':
      case 'converted':
        return <FileCheck className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  function getItemTypeLabel(type: string) {
    const labels: Record<string, string> = {
      service: 'Serviço',
      material: 'Material',
      labor: 'Mão de Obra',
    }
    return labels[type] || type
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  function formatDate(dateString: string) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  function isExpired(validUntil: string) {
    return new Date(validUntil) < new Date()
  }

  const canApprove = quote && (quote.status === 'pendente' || quote.status === 'pending')
  const expired = quote && isExpired(quote.valid_until) && canApprove

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600 mx-auto mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Carregando orçamento...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!quote) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-700">Orçamento não encontrado</p>
            <button
              onClick={() => router.push('/quotes')}
              className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg"
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-4 sm:px-6 md:px-8 py-6 sm:py-8 shadow-lg">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => router.push('/quotes')}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar para Orçamentos</span>
            </button>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white/80 font-mono">{quote.quote_number}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{quote.title}</h1>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <span className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold border ${getStatusColor(quote.status)}`}>
                  {getStatusIcon(quote.status)}
                  {getStatusLabel(quote.status)}
                </span>
                {expired && (
                  <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                    ⚠️ Orçamento expirado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {/* Ações */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex flex-wrap gap-3">
              {canApprove && !expired && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Aprovar Orçamento
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Rejeitar
                  </button>
                </>
              )}
              <button
                onClick={handleGeneratePDF}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
              >
                <Download className="w-5 h-5" />
                Baixar PDF
              </button>
              
              {/* Botões de envio - aparecem quando orçamento foi aprovado ou rejeitado */}
              {(quote.status === 'aprovado' || quote.status === 'approved' || 
                quote.status === 'rejeitado' || quote.status === 'rejected') && (
                <>
                  <button
                    onClick={() => handleSendEmail()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
                  >
                    <Send className="w-5 h-5" />
                    Enviar Email
                  </button>
                  <button
                    onClick={() => handleSendWhatsApp()}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar WhatsApp
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Itens */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    Itens do Orçamento ({items.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-amber-600">#{index + 1}</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {getItemTypeLabel(item.item_type)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            {item.quantity}x {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">
                            {formatCurrency(item.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observações */}
              {quote.notes && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">📝 Observações</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}

              {/* Termos */}
              {quote.terms && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">📜 Termos e Condições</h2>
                  <p className="text-gray-500 text-sm whitespace-pre-wrap">{quote.terms}</p>
                </div>
              )}

              {/* Motivo da Rejeição */}
              {(quote.status === 'rejeitado' || quote.status === 'rejected') && quote.rejection_reason && (
                <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                  <h2 className="text-lg font-bold text-red-800 mb-4">❌ Motivo da Rejeição</h2>
                  <p className="text-red-700">{quote.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Valor Total */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                <p className="text-amber-100 text-sm mb-1">Valor Total</p>
                <p className="text-3xl font-bold">{formatCurrency(quote.total)}</p>
                
                <div className="mt-4 pt-4 border-t border-white/20 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-100">Subtotal:</span>
                    <span>{formatCurrency(quote.subtotal)}</span>
                  </div>
                  {quote.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-amber-100">
                        Desconto {quote.discount_type === 'percentage' ? `(${quote.discount}%)` : ''}:
                      </span>
                      <span>- {formatCurrency(quote.discount_type === 'percentage' ? quote.subtotal * (quote.discount / 100) : quote.discount)}</span>
                    </div>
                  )}
                  {quote.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-amber-100">Taxa:</span>
                      <span>+ {formatCurrency(quote.tax)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Validade */}
              <div className={`rounded-2xl shadow-lg p-6 ${expired ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className={`w-5 h-5 ${expired ? 'text-red-600' : 'text-amber-600'}`} />
                  <span className={`font-semibold ${expired ? 'text-red-800' : 'text-amber-800'}`}>
                    Validade
                  </span>
                </div>
                <p className={`text-2xl font-bold ${expired ? 'text-red-700' : 'text-amber-700'}`}>
                  {formatDate(quote.valid_until)}
                </p>
                {expired && (
                  <p className="text-sm text-red-600 mt-2">Este orçamento expirou</p>
                )}
              </div>

              {/* Cliente */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" />
                  Cliente
                </h3>
                <div className="space-y-3">
                  <p className="font-semibold text-gray-900">{quote.clients?.name}</p>
                  {quote.clients?.cnpj_cpf && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">CNPJ/CPF:</span> {quote.clients.cnpj_cpf}
                    </p>
                  )}
                  {quote.clients?.address && (
                    <p className="text-sm text-gray-500 flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {quote.clients.address}
                    </p>
                  )}
                  {quote.clients?.phone && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {quote.clients.phone}
                    </p>
                  )}
                  {quote.clients?.email && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {quote.clients.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Datas */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">📅 Datas</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Criado em:</span>
                    <span className="font-medium">{formatDate(quote.created_at)}</span>
                  </div>
                  {quote.approved_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Aprovado em:</span>
                      <span className="font-medium text-emerald-600">{formatDate(quote.approved_at)}</span>
                    </div>
                  )}
                  {quote.rejected_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rejeitado em:</span>
                      <span className="font-medium text-red-600">{formatDate(quote.rejected_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Rejeição */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-red-600 p-6 rounded-t-2xl">
                <h2 className="text-xl font-bold text-white">Rejeitar Orçamento</h2>
                <p className="text-red-100 mt-1">Informe o motivo da rejeição (opcional)</p>
              </div>
              <div className="p-6">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: Valor acima do orçamento disponível..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all resize-none"
                  rows={4}
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setRejectReason('')
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Rejeitando...' : 'Confirmar Rejeição'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
