'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  DollarSign, FileText, Calendar, CheckCircle, XCircle, Clock, 
  AlertCircle, ArrowLeft, Download, User, MapPin, Phone, Mail,
  Package, FileCheck
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

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


  function generatePDF() {
    if (!quote) return

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value || 0)
    }

    const formatDate = (dateString: string) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('pt-BR')
    }

    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        pendente: 'Pendente',
        aprovado: 'Aprovado',
        rejeitado: 'Rejeitado',
        expirado: 'Expirado',
        convertido: 'Convertido em OS',
        pending: 'Pendente',
        approved: 'Aprovado',
        rejected: 'Rejeitado',
        expired: 'Expirado',
        converted: 'Convertido em OS',
      }
      return labels[status] || status
    }

    const getItemTypeLabel = (type: string) => {
      const labels: Record<string, string> = {
        service: 'Serviço',
        material: 'Material',
        labor: 'Mão de Obra',
      }
      return labels[type] || type
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Orçamento ${quote.quote_number}</title>
<style>
@page { margin: 20px 25px; size: A4; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10px;
  color: #333;
  line-height: 1.4;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.header {
  display: table;
  width: 100%;
  border-bottom: 3px solid #0044cc;
  padding-bottom: 15px;
  margin-bottom: 20px;
}
.header-center { display: table-cell; vertical-align: middle; }
.header-center h1 { font-size: 18px; color: #0044cc; margin-bottom: 5px; }
.header-right { display: table-cell; width: 150px; vertical-align: middle; text-align: right; }
.quote-box {
  background: linear-gradient(135deg, #0044cc, #0044ccdd);
  color: #fff;
  padding: 12px 15px;
  border-radius: 8px;
  display: inline-block;
}
.quote-box small { font-size: 8px; display: block; opacity: 0.9; text-transform: uppercase; }
.quote-box strong { font-size: 14px; }
.quote-date { font-size: 9px; color: #666; margin-top: 8px; }

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: bold;
  margin-top: 10px;
}
.status-pendente, .status-pending { background: #FEF3C7; color: #D97706; }
.status-aprovado, .status-approved { background: #D1FAE5; color: #059669; }
.status-rejeitado, .status-rejected { background: #FEE2E2; color: #DC2626; }
.status-convertido, .status-converted { background: #DBEAFE; color: #2563EB; }

.section { margin-bottom: 20px; }
.section-title {
  background: linear-gradient(90deg, #f8f9fa, #fff);
  border-left: 4px solid #0044cc;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.two-cols { display: table; width: 100%; margin-bottom: 20px; }
.col { display: table-cell; width: 50%; vertical-align: top; padding-right: 15px; }
.col:last-child { padding-right: 0; padding-left: 15px; }

.info-box {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}
.info-row { margin-bottom: 6px; }
.info-label { color: #666; font-weight: 600; font-size: 9px; display: inline-block; width: 80px; }
.info-value { color: #222; font-size: 10px; }

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
.items-table th {
  background: #0044cc;
  color: #fff;
  padding: 10px 8px;
  text-align: left;
  font-size: 9px;
  text-transform: uppercase;
}
.items-table th:last-child { text-align: right; }
.items-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 10px;
}
.items-table td:last-child { text-align: right; font-weight: 600; }
.items-table tr:nth-child(even) { background: #f9fafb; }
.item-type {
  display: inline-block;
  padding: 2px 6px;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 8px;
  color: #666;
  margin-left: 8px;
}

.totals-box {
  background: linear-gradient(135deg, #f8f9fa, #fff);
  border: 2px solid #0044cc;
  border-radius: 10px;
  padding: 15px;
  margin-top: 20px;
  width: 300px;
  margin-left: auto;
}
.total-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 10px;
}
.total-row.main {
  border-top: 2px solid #0044cc;
  margin-top: 10px;
  padding-top: 12px;
}
.total-row.main span:first-child { font-size: 14px; font-weight: bold; color: #333; }
.total-row.main span:last-child { font-size: 18px; font-weight: bold; color: #0044cc; }

.validity-box {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  margin-top: 20px;
}
.validity-box strong { color: #92400e; font-size: 11px; }
.validity-box span { display: block; color: #b45309; font-size: 14px; font-weight: bold; margin-top: 5px; }

.notes-box {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 12px;
  font-size: 10px;
  line-height: 1.5;
}

.terms-box {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 12px;
  font-size: 9px;
  color: #666;
  line-height: 1.5;
}

.footer {
  margin-top: 30px;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 8px;
  color: #999;
}
</style>
</head>
<body>

<div class="header">
  <div class="header-center">
    <h1>ORÇAMENTO</h1>
    <p style="font-size: 9px; color: #666;">Documento gerado pelo Portal do Cliente</p>
  </div>
  <div class="header-right">
    <div class="quote-box">
      <small>Número</small>
      <strong>${quote.quote_number}</strong>
    </div>
    <div class="quote-date">Emitido em ${formatDate(quote.created_at)}</div>
    <div class="status-badge status-${quote.status}">${getStatusLabel(quote.status)}</div>
  </div>
</div>

<div class="two-cols">
  <div class="col">
    <div class="section">
      <div class="section-title">👤 Dados do Cliente</div>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Cliente:</span><span class="info-value"><b>${quote.clients?.name || '-'}</b></span></div>
        <div class="info-row"><span class="info-label">CNPJ/CPF:</span><span class="info-value">${quote.clients?.cnpj_cpf || '-'}</span></div>
        <div class="info-row"><span class="info-label">Endereço:</span><span class="info-value">${quote.clients?.address || '-'}</span></div>
        <div class="info-row"><span class="info-label">Telefone:</span><span class="info-value">${quote.clients?.phone || '-'}</span></div>
        <div class="info-row"><span class="info-label">E-mail:</span><span class="info-value">${quote.clients?.email || '-'}</span></div>
      </div>
    </div>
  </div>
  <div class="col">
    <div class="section">
      <div class="section-title">📋 Informações do Serviço</div>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Título:</span><span class="info-value"><b>${quote.title}</b></span></div>
        <div class="info-row"><span class="info-label">Descrição:</span><span class="info-value">${quote.description || '-'}</span></div>
        <div class="info-row"><span class="info-label">Criado por:</span><span class="info-value">${quote.profiles?.full_name || '-'}</span></div>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">📦 Itens do Orçamento</div>
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 40px">#</th>
        <th>Descrição</th>
        <th style="width: 60px">Qtd</th>
        <th style="width: 90px">Valor Unit.</th>
        <th style="width: 90px">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>
            ${item.name}
            <span class="item-type">${getItemTypeLabel(item.item_type)}</span>
            ${item.description ? `<br><small style="color:#666">${item.description}</small>` : ''}
          </td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unit_price)}</td>
          <td>${formatCurrency(item.total)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>

<div class="totals-box">
  <div class="total-row">
    <span>Subtotal:</span>
    <span>${formatCurrency(quote.subtotal)}</span>
  </div>
  ${quote.discount > 0 ? `
  <div class="total-row">
    <span>Desconto ${quote.discount_type === 'percentage' ? `(${quote.discount}%)` : '(Fixo)'}:</span>
    <span style="color: #DC2626">- ${formatCurrency(quote.discount_type === 'percentage' ? quote.subtotal * (quote.discount / 100) : quote.discount)}</span>
  </div>
  ` : ''}
  ${quote.tax > 0 ? `
  <div class="total-row">
    <span>Taxa/Impostos:</span>
    <span>+ ${formatCurrency(quote.tax)}</span>
  </div>
  ` : ''}
  <div class="total-row main">
    <span>VALOR TOTAL:</span>
    <span>${formatCurrency(quote.total)}</span>
  </div>
</div>

<div class="validity-box">
  <strong>⏰ Validade do Orçamento</strong>
  <span>${formatDate(quote.valid_until)}</span>
</div>

${quote.notes ? `
<div class="section" style="margin-top: 20px">
  <div class="section-title">📝 Observações</div>
  <div class="notes-box">${quote.notes}</div>
</div>
` : ''}

${quote.terms ? `
<div class="section">
  <div class="section-title">📜 Termos e Condições</div>
  <div class="terms-box">${quote.terms}</div>
</div>
` : ''}

<div class="footer">
  Documento gerado em ${new Date().toLocaleString('pt-BR')} | Portal Chamei
</div>

</body>
</html>
    `

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Por favor, permita pop-ups para gerar o PDF')
      return
    }

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      setTimeout(() => printWindow.print(), 300)
    }
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
                onClick={generatePDF}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
              >
                <Download className="w-5 h-5" />
                Baixar PDF
              </button>
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
