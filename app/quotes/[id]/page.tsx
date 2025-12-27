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
      pendente: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
      aprovado: 'bg-success-500/20 text-success-400 border-success-500/30',
      rejeitado: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
      expirado: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      convertido: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
      pending: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
      approved: 'bg-success-500/20 text-success-400 border-success-500/30',
      rejected: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
      expired: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
      converted: 'bg-primary-500/20 text-primary-400 border-primary-500/30',
    }
    return colors[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
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
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-accent-500/30 border-t-accent-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Carregando orçamento...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!quote) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center empty-state">
            <p className="text-xl font-bold text-white">Orçamento não encontrado</p>
            <button
              onClick={() => router.push('/quotes')}
              className="mt-4 btn-primary"
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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="page-header">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => router.push('/quotes')}
              className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar para Orçamentos</span>
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/10 rounded-lg border border-white/5">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-zinc-400 font-mono text-sm border border-white/10 px-2 py-0.5 rounded-md bg-surface-light">{quote.quote_number}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{quote.title}</h1>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`badge ${getStatusColor(quote.status)} px-4 py-2 text-sm`}>
                  {getStatusIcon(quote.status)}
                  {getStatusLabel(quote.status)}
                </span>
                {expired && (
                  <span className="badge badge-danger">
                    ⚠️ Orçamento expirado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 -mt-8 pb-10">
          {/* Ações */}
          <div className="card p-4 sm:p-6 mb-6 flex flex-wrap gap-3 items-center justify-between bg-surface/80 backdrop-blur-md">
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              {canApprove && !expired && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="btn-success flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-success-500/20 transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Aprovar Orçamento
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="btn-danger flex items-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Rejeitar
                  </button>
                </>
              )}
              <button
                onClick={handleGeneratePDF}
                className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Download className="w-5 h-5" />
                Baixar PDF
              </button>
            </div>

            {/* Botões de envio - aparecem quando orçamento foi aprovado ou rejeitado */}
            {(quote.status === 'aprovado' || quote.status === 'approved' ||
              quote.status === 'rejeitado' || quote.status === 'rejected') && (
                <div className="flex gap-3 w-full sm:w-auto mt-3 sm:mt-0">
                  <button
                    onClick={() => handleSendEmail()}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    onClick={() => handleSendWhatsApp()}
                    className="btn-success flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
              )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Detalhes do Orçamento */}
            <div className="lg:col-span-2 space-y-6">
              {/* Descrição */}
              {quote.description && (
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-zinc-400" /> Descrição
                  </h3>
                  <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{quote.description}</p>
                </div>
              )}

              {/* Itens */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-zinc-400" /> Itens do Orçamento
                </h3>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-white/5 bg-surface-light">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{item.name}</h4>
                          <span className="text-xs text-zinc-500 uppercase tracking-wider">{getItemTypeLabel(item.item_type)}</span>
                        </div>
                        <p className="font-bold text-white">{formatCurrency(item.total)}</p>
                      </div>

                      {item.description && (
                        <p className="text-sm text-zinc-400 mb-3">{item.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-zinc-500 pt-3 border-t border-white/5">
                        <span>Qtd: {item.quantity}</span>
                        <span>Unit: {formatCurrency(item.unit_price)}</span>
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <p className="text-zinc-500 text-center py-4">Nenhum item listado.</p>
                  )}
                </div>

                {/* Totais */}
                <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(quote.subtotal)}</span>
                  </div>

                  {quote.discount > 0 && (
                    <div className="flex justify-between text-success-400">
                      <span>Desconto</span>
                      <span>- {formatCurrency(quote.discount)}</span>
                    </div>
                  )}

                  {quote.tax > 0 && (
                    <div className="flex justify-between text-danger-400">
                      <span>Impostos</span>
                      <span>+ {formatCurrency(quote.tax)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-lg font-bold text-white">Total</span>
                    <span className="text-2xl font-bold text-accent-400">{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </div>

              {/* Termos e Notas */}
              {(quote.terms || quote.notes) && (
                <div className="card p-6 space-y-6">
                  {quote.terms && (
                    <div>
                      <h3 className="font-bold text-white mb-2 text-sm uppercase tracking-wider text-zinc-500">Termos e Condições</h3>
                      <p className="text-zinc-400 text-sm">{quote.terms}</p>
                    </div>
                  )}
                  {quote.notes && (
                    <div>
                      <h3 className="font-bold text-white mb-2 text-sm uppercase tracking-wider text-zinc-500">Observações</h3>
                      <p className="text-zinc-400 text-sm">{quote.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Info */}
              <div className="card p-6">
                <h3 className="font-bold text-white mb-4">Informações</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center text-zinc-400 border border-white/5">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Emitido em</p>
                      <p className="text-white font-medium">{formatDate(quote.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center text-zinc-400 border border-white/5">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Válido até</p>
                      <p className="text-white font-medium">{formatDate(quote.valid_until)}</p>
                    </div>
                  </div>

                  {quote.status === 'aprovado' && quote.approved_at && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center text-success-400 border border-success-500/20">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Aprovado em</p>
                        <p className="text-success-400 font-medium">{formatDate(quote.approved_at)}</p>
                      </div>
                    </div>
                  )}

                  {quote.status === 'rejeitado' && quote.rejected_at && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-danger-500/10 flex items-center justify-center text-danger-400 border border-danger-500/20">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Rejeitado em</p>
                        <p className="text-danger-400 font-medium">{formatDate(quote.rejected_at)}</p>
                      </div>
                    </div>
                  )}

                  {quote.status === 'rejeitado' && quote.rejection_reason && (
                    <div className="mt-4 p-3 bg-danger-500/10 border border-danger-500/20 rounded-lg">
                      <p className="text-xs text-danger-300 font-bold mb-1">Motivo da Rejeição:</p>
                      <p className="text-sm text-danger-200">{quote.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cliente */}
              <div className="card p-6">
                <h3 className="font-bold text-white mb-4">Dados do Cliente</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-zinc-500" />
                    <p className="text-zinc-300">{quote.clients?.name}</p>
                  </div>
                  {quote.clients?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-zinc-500" />
                      <p className="text-zinc-300 text-sm">{quote.clients.email}</p>
                    </div>
                  )}
                  {quote.clients?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-zinc-500" />
                      <p className="text-zinc-300 text-sm">{quote.clients.phone}</p>
                    </div>
                  )}
                  {quote.clients?.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-zinc-500 mt-1" />
                      <p className="text-zinc-300 text-sm">{quote.clients.address}</p>
                    </div>
                  )}
                  {quote.clients?.cnpj_cpf && (
                    <div className="flex items-center gap-3 pt-3 border-t border-white/5 mt-3">
                      <p className="text-xs text-zinc-500">CNPJ/CPF:</p>
                      <p className="text-zinc-400 text-sm font-mono">{quote.clients.cnpj_cpf}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emissor */}
              <div className="card p-6">
                <h3 className="font-bold text-white mb-4">Emitido por</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-light border border-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{quote.profiles?.full_name || 'Equipe'}</p>
                    <p className="text-xs text-zinc-500">Técnico Responsável</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Rejeição */}
        {showRejectModal && (
          <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-danger-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-danger-500/20">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Rejeitar Orçamento</h2>
                  <p className="text-sm text-zinc-400">Por favor, informe o motivo</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Motivo da Rejeição *</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Descreva o motivo da rejeição (preço, prazo, etc)..."
                    className="form-textarea"
                    rows={4}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setRejectReason('')
                    }}
                    disabled={actionLoading}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="btn-danger flex-1"
                  >
                    {actionLoading ? 'Processando...' : 'Confirmar Rejeição'}
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
