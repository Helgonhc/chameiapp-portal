import { supabase } from '@/lib/supabase'

interface QuoteData {
  quote_number: string
  title: string
  total: number
  status: string
  rejection_reason?: string
  clients: {
    name: string
  }
}

interface CompanyConfig {
  company_name: string
  phone: string
  email: string
  whatsapp?: string
}

// Formatar valor em reais
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

// Buscar configurações da empresa
async function getCompanyConfig(): Promise<CompanyConfig> {
  const { data } = await supabase
    .from('app_config')
    .select('company_name, phone, email, whatsapp')
    .limit(1)
    .single()
  
  return {
    company_name: data?.company_name || 'Empresa',
    phone: data?.phone || '',
    email: data?.email || '',
    whatsapp: data?.whatsapp || data?.phone || ''
  }
}

// Buscar admins para notificar
async function getAdminContacts(): Promise<{ email: string; phone: string; name: string }[]> {
  const { data } = await supabase
    .from('profiles')
    .select('email, phone, full_name')
    .eq('role', 'admin')
    .eq('is_active', true)
  
  return (data || []).map(p => ({
    email: p.email || '',
    phone: p.phone || '',
    name: p.full_name || 'Admin'
  }))
}

// =====================================================
// GERAR MENSAGEM DE WHATSAPP
// =====================================================
export function generateWhatsAppMessage(quote: QuoteData, status: 'aprovado' | 'rejeitado' | 'pendente'): string {
  const clientName = quote.clients?.name || 'Cliente'
  const quoteNumber = quote.quote_number
  const quoteTitle = quote.title
  const quoteTotal = formatCurrency(quote.total)
  
  let message = ''
  
  switch (status) {
    case 'aprovado':
      message = `✅ *ORÇAMENTO APROVADO!*

📋 *Número:* ${quoteNumber}
📝 *Título:* ${quoteTitle}
💰 *Valor:* ${quoteTotal}
👤 *Cliente:* ${clientName}

O cliente aprovou o orçamento e está aguardando o início do serviço.

_Mensagem automática do Portal do Cliente_`
      break
      
    case 'rejeitado':
      message = `❌ *ORÇAMENTO REJEITADO*

📋 *Número:* ${quoteNumber}
📝 *Título:* ${quoteTitle}
💰 *Valor:* ${quoteTotal}
👤 *Cliente:* ${clientName}
${quote.rejection_reason ? `\n📝 *Motivo:* ${quote.rejection_reason}` : ''}

Entre em contato com o cliente para mais informações.

_Mensagem automática do Portal do Cliente_`
      break
      
    case 'pendente':
      message = `⏳ *NOVO ORÇAMENTO AGUARDANDO APROVAÇÃO*

📋 *Número:* ${quoteNumber}
📝 *Título:* ${quoteTitle}
💰 *Valor:* ${quoteTotal}
👤 *Cliente:* ${clientName}

O cliente está analisando o orçamento.

_Mensagem automática do Portal do Cliente_`
      break
  }
  
  return message
}

// =====================================================
// ENVIAR WHATSAPP
// =====================================================
export async function sendWhatsAppNotification(
  quote: QuoteData, 
  status: 'aprovado' | 'rejeitado' | 'pendente'
): Promise<void> {
  try {
    const config = await getCompanyConfig()
    const admins = await getAdminContacts()
    
    const message = generateWhatsAppMessage(quote, status)
    const encodedMessage = encodeURIComponent(message)
    
    // Usar o WhatsApp da empresa ou do primeiro admin
    const whatsappNumber = config.whatsapp || admins[0]?.phone || ''
    
    if (whatsappNumber) {
      // Limpar número (remover caracteres especiais)
      const cleanNumber = whatsappNumber.replace(/\D/g, '')
      
      // Abrir WhatsApp Web com a mensagem
      const whatsappUrl = `https://wa.me/55${cleanNumber}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank')
    } else {
      console.warn('Nenhum número de WhatsApp configurado')
    }
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error)
  }
}

// =====================================================
// GERAR HTML DO EMAIL
// =====================================================
export function generateEmailHTML(
  quote: QuoteData, 
  status: 'aprovado' | 'rejeitado' | 'pendente',
  companyName: string
): string {
  const clientName = quote.clients?.name || 'Cliente'
  const quoteNumber = quote.quote_number
  const quoteTitle = quote.title
  const quoteTotal = formatCurrency(quote.total)
  
  const statusConfig = {
    aprovado: {
      emoji: '✅',
      title: 'Orçamento Aprovado!',
      color: '#10B981',
      bgColor: '#D1FAE5',
      message: 'O cliente aprovou o orçamento e está aguardando o início do serviço.'
    },
    rejeitado: {
      emoji: '❌',
      title: 'Orçamento Rejeitado',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      message: 'O cliente rejeitou o orçamento. Entre em contato para mais informações.'
    },
    pendente: {
      emoji: '⏳',
      title: 'Aguardando Aprovação',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      message: 'O cliente está analisando o orçamento.'
    }
  }
  
  const config = statusConfig[status]
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${config.color}, ${config.color}dd); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">${config.emoji}</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${config.title}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Status Badge -->
              <div style="background-color: ${config.bgColor}; border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center;">
                <p style="margin: 0; color: ${config.color}; font-size: 16px; font-weight: 600;">
                  ${config.message}
                </p>
              </div>
              
              <!-- Quote Details -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                  📋 Detalhes do Orçamento
                </h2>
                
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; width: 120px;">Número:</td>
                    <td style="color: #111827; font-size: 14px; font-weight: 600;">${quoteNumber}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Título:</td>
                    <td style="color: #111827; font-size: 14px; font-weight: 600;">${quoteTitle}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Cliente:</td>
                    <td style="color: #111827; font-size: 14px; font-weight: 600;">${clientName}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Valor:</td>
                    <td style="color: ${config.color}; font-size: 20px; font-weight: bold;">${quoteTotal}</td>
                  </tr>
                  ${quote.rejection_reason ? `
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; vertical-align: top;">Motivo:</td>
                    <td style="color: #EF4444; font-size: 14px;">${quote.rejection_reason}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="#" style="display: inline-block; background-color: ${config.color}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Ver no Sistema
                </a>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                ${companyName}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este é um email automático enviado pelo Portal do Cliente.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// =====================================================
// ENVIAR EMAIL (via mailto ou API)
// =====================================================
export async function sendEmailNotification(
  quote: QuoteData, 
  status: 'aprovado' | 'rejeitado' | 'pendente'
): Promise<void> {
  try {
    const config = await getCompanyConfig()
    const admins = await getAdminContacts()
    
    const statusLabels = {
      aprovado: '✅ APROVADO',
      rejeitado: '❌ REJEITADO',
      pendente: '⏳ AGUARDANDO'
    }
    
    const subject = `Orçamento ${quote.quote_number} - ${statusLabels[status]} - ${quote.clients?.name}`
    
    // Gerar corpo do email em texto simples para mailto
    const body = `
ORÇAMENTO ${statusLabels[status]}

Número: ${quote.quote_number}
Título: ${quote.title}
Cliente: ${quote.clients?.name || 'Cliente'}
Valor: ${formatCurrency(quote.total)}
${quote.rejection_reason ? `Motivo da Rejeição: ${quote.rejection_reason}` : ''}

---
Mensagem automática do Portal do Cliente
${config.company_name}
    `.trim()
    
    // Usar mailto para abrir cliente de email
    const adminEmail = config.email || admins[0]?.email || ''
    
    if (adminEmail) {
      const mailtoUrl = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(mailtoUrl, '_blank')
    } else {
      console.warn('Nenhum email configurado')
    }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
  }
}

// =====================================================
// ENVIAR TODAS AS NOTIFICAÇÕES
// =====================================================
export async function sendAllNotifications(
  quote: QuoteData, 
  status: 'aprovado' | 'rejeitado' | 'pendente',
  options: { email?: boolean; whatsapp?: boolean } = { email: true, whatsapp: true }
): Promise<void> {
  const promises: Promise<void>[] = []
  
  if (options.email) {
    promises.push(sendEmailNotification(quote, status))
  }
  
  if (options.whatsapp) {
    promises.push(sendWhatsAppNotification(quote, status))
  }
  
  await Promise.all(promises)
}
