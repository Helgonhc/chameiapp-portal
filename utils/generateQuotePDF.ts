import { supabase } from '@/lib/supabase'

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
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

export async function generateQuotePDF(quote: Quote, items: QuoteItem[]) {
  // Buscar configurações da empresa
  const { data: config } = await supabase
    .from('app_config')
    .select('*')
    .limit(1)
    .single()

  const company = {
    name: config?.company_name || 'EMPRESA',
    cnpj: config?.cnpj || '',
    address: config?.address || '',
    phone: config?.phone || '',
    email: config?.email || '',
    site: config?.website || '',
    logo: config?.logo_url || '',
    color: config?.primary_color || '#0044cc'
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
@page { margin: 15px 20px; size: A4; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10px;
  color: #333;
  line-height: 1.4;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* HEADER COM LOGO */
.header {
  display: table;
  width: 100%;
  border-bottom: 3px solid ${company.color};
  padding-bottom: 12px;
  margin-bottom: 15px;
}
.header-logo {
  display: table-cell;
  width: 70px;
  vertical-align: middle;
}
.header-logo img {
  max-width: 65px;
  max-height: 55px;
  border-radius: 6px;
}
.header-logo .logo-placeholder {
  width: 60px;
  height: 50px;
  background: ${company.color};
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}
.header-company {
  display: table-cell;
  vertical-align: middle;
  padding: 0 12px;
}
.header-company h1 {
  font-size: 16px;
  color: ${company.color};
  margin-bottom: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.header-company .company-info {
  font-size: 8px;
  color: #666;
  line-height: 1.4;
}
.header-company .company-info span {
  display: inline-block;
  margin-right: 10px;
}
.header-quote {
  display: table-cell;
  width: 130px;
  vertical-align: middle;
  text-align: right;
}
.quote-box {
  background: ${company.color};
  color: #fff;
  padding: 10px 12px;
  border-radius: 8px;
  display: inline-block;
  text-align: center;
}
.quote-box small {
  font-size: 7px;
  display: block;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.quote-box strong {
  font-size: 13px;
  display: block;
  margin-top: 2px;
}
.quote-date {
  font-size: 8px;
  color: #666;
  margin-top: 6px;
}
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 8px;
  font-weight: bold;
  margin-top: 6px;
}
.status-pendente, .status-pending { background: #FEF3C7; color: #D97706; }
.status-aprovado, .status-approved { background: #D1FAE5; color: #059669; }
.status-rejeitado, .status-rejected { background: #FEE2E2; color: #DC2626; }
.status-convertido, .status-converted { background: #DBEAFE; color: #2563EB; }

/* SEÇÕES */
.section {
  margin-bottom: 12px;
}
.section-title {
  background: ${company.color}15;
  border-left: 3px solid ${company.color};
  padding: 6px 10px;
  font-size: 10px;
  font-weight: bold;
  color: ${company.color};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* GRID 2 COLUNAS */
.two-cols {
  display: table;
  width: 100%;
  margin-bottom: 12px;
}
.col {
  display: table-cell;
  width: 50%;
  vertical-align: top;
  padding-right: 8px;
}
.col:last-child {
  padding-right: 0;
  padding-left: 8px;
}

/* INFO BOX MELHORADO */
.info-box {
  background: #fafafa;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #e5e7eb;
}
.info-row {
  display: table;
  width: 100%;
  margin-bottom: 5px;
}
.info-row:last-child {
  margin-bottom: 0;
}
.info-icon {
  display: table-cell;
  width: 16px;
  vertical-align: top;
  padding-top: 1px;
  font-size: 10px;
}
.info-content {
  display: table-cell;
  vertical-align: top;
}
.info-label {
  font-size: 7px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.info-value {
  font-size: 9px;
  color: #333;
  font-weight: 500;
}
.info-value.highlight {
  font-size: 11px;
  font-weight: bold;
  color: #111;
}

/* TABELA DE ITENS */
.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-size: 9px;
}
.items-table th {
  background: ${company.color};
  color: #fff;
  padding: 8px 6px;
  text-align: left;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.items-table th:nth-child(3),
.items-table th:nth-child(4),
.items-table th:last-child {
  text-align: right;
}
.items-table td {
  padding: 8px 6px;
  border-bottom: 1px solid #e5e7eb;
}
.items-table td:nth-child(3),
.items-table td:nth-child(4),
.items-table td:last-child {
  text-align: right;
}
.items-table tr:nth-child(even) {
  background: #f9fafb;
}
.item-name {
  font-weight: 600;
  color: #111;
}
.item-desc {
  font-size: 8px;
  color: #666;
  margin-top: 2px;
}
.item-type {
  display: inline-block;
  padding: 2px 5px;
  background: #e5e7eb;
  border-radius: 3px;
  font-size: 7px;
  color: #666;
  margin-left: 6px;
}

/* TOTAIS */
.totals-section {
  margin-top: 15px;
}
.totals-box {
  background: linear-gradient(135deg, ${company.color}10, ${company.color}05);
  border: 2px solid ${company.color};
  border-radius: 8px;
  padding: 12px;
  width: 250px;
  margin-left: auto;
}
.total-row {
  display: table;
  width: 100%;
  margin-bottom: 6px;
}
.total-row:last-child {
  margin-bottom: 0;
}
.total-label {
  display: table-cell;
  font-size: 9px;
  color: #666;
}
.total-value {
  display: table-cell;
  text-align: right;
  font-size: 9px;
  font-weight: 600;
  color: #333;
}
.total-row.main {
  border-top: 2px solid ${company.color};
  margin-top: 8px;
  padding-top: 8px;
}
.total-row.main .total-label {
  font-size: 12px;
  font-weight: bold;
  color: #111;
}
.total-row.main .total-value {
  font-size: 16px;
  font-weight: bold;
  color: ${company.color};
}

/* VALIDADE */
.validity-box {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 6px;
  padding: 10px;
  text-align: center;
  margin-top: 12px;
  display: inline-block;
}
.validity-box .label {
  font-size: 8px;
  color: #92400e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.validity-box .date {
  font-size: 14px;
  font-weight: bold;
  color: #b45309;
  margin-top: 3px;
}

/* OBSERVAÇÕES */
.notes-box {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  padding: 10px;
  font-size: 9px;
  line-height: 1.5;
  color: #92400e;
}

/* TERMOS */
.terms-box {
  background: #f3f4f6;
  border-radius: 6px;
  padding: 10px;
  font-size: 8px;
  color: #666;
  line-height: 1.5;
}

/* FOOTER */
.footer {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 7px;
  color: #999;
}
</style>
</head>
<body>

<!-- HEADER COM LOGO E EMPRESA -->
<div class="header">
  <div class="header-logo">
    ${company.logo ? `<img src="${company.logo}" />` : `<div class="logo-placeholder">${company.name.charAt(0)}</div>`}
  </div>
  <div class="header-company">
    <h1>${company.name}</h1>
    <div class="company-info">
      ${company.cnpj ? `<span>📋 CNPJ: ${company.cnpj}</span>` : ''}
      ${company.phone ? `<span>📞 ${company.phone}</span>` : ''}
      ${company.email ? `<span>✉️ ${company.email}</span>` : ''}
      ${company.address ? `<br>📍 ${company.address}` : ''}
    </div>
  </div>
  <div class="header-quote">
    <div class="quote-box">
      <small>Orçamento Nº</small>
      <strong>${quote.quote_number}</strong>
    </div>
    <div class="quote-date">Emitido em ${formatDate(quote.created_at)}</div>
    <div class="status-badge status-${quote.status}">${getStatusLabel(quote.status)}</div>
  </div>
</div>

<!-- DADOS CLIENTE + SERVIÇO -->
<div class="two-cols">
  <div class="col">
    <div class="section">
      <div class="section-title">Dados do Cliente</div>
      <div class="info-box">
        <div class="info-row">
          <div class="info-icon">👤</div>
          <div class="info-content">
            <div class="info-label">Nome / Razão Social</div>
            <div class="info-value highlight">${quote.clients?.name || '-'}</div>
          </div>
        </div>
        <div class="info-row">
          <div class="info-icon">📋</div>
          <div class="info-content">
            <div class="info-label">CNPJ / CPF</div>
            <div class="info-value">${quote.clients?.cnpj_cpf || '-'}</div>
          </div>
        </div>
        <div class="info-row">
          <div class="info-icon">📍</div>
          <div class="info-content">
            <div class="info-label">Endereço</div>
            <div class="info-value">${quote.clients?.address || '-'}</div>
          </div>
        </div>
        <div class="info-row">
          <div class="info-icon">📞</div>
          <div class="info-content">
            <div class="info-label">Telefone</div>
            <div class="info-value">${quote.clients?.phone || '-'}</div>
          </div>
        </div>
        <div class="info-row">
          <div class="info-icon">✉️</div>
          <div class="info-content">
            <div class="info-label">E-mail</div>
            <div class="info-value">${quote.clients?.email || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="col">
    <div class="section">
      <div class="section-title">Informações do Serviço</div>
      <div class="info-box">
        <div class="info-row">
          <div class="info-icon">📝</div>
          <div class="info-content">
            <div class="info-label">Título</div>
            <div class="info-value highlight">${quote.title}</div>
          </div>
        </div>
        <div class="info-row">
          <div class="info-icon">📄</div>
          <div class="info-content">
            <div class="info-label">Descrição</div>
            <div class="info-value">${quote.description || '-'}</div>
          </div>
        </div>
        <div class="info-row">
          <div class="info-icon">👷</div>
          <div class="info-content">
            <div class="info-label">Responsável</div>
            <div class="info-value">${quote.profiles?.full_name || '-'}</div>
          </div>
        </div>
      </div>
      <div class="validity-box">
        <div class="label">⏰ Válido até</div>
        <div class="date">${formatDate(quote.valid_until)}</div>
      </div>
    </div>
  </div>
</div>

<!-- ITENS DO ORÇAMENTO -->
<div class="section">
  <div class="section-title">Itens do Orçamento (${items.length})</div>
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th>Descrição</th>
        <th style="width:50px">Qtd</th>
        <th style="width:80px">Valor Unit.</th>
        <th style="width:80px">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>
            <span class="item-name">${item.name}</span>
            <span class="item-type">${getItemTypeLabel(item.item_type)}</span>
            ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
          </td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unit_price)}</td>
          <td><strong>${formatCurrency(item.total)}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>

<!-- TOTAIS -->
<div class="totals-section">
  <div class="totals-box">
    <div class="total-row">
      <span class="total-label">Subtotal:</span>
      <span class="total-value">${formatCurrency(quote.subtotal)}</span>
    </div>
    ${quote.discount > 0 ? `
    <div class="total-row">
      <span class="total-label">Desconto ${quote.discount_type === 'percentage' ? `(${quote.discount}%)` : ''}:</span>
      <span class="total-value" style="color:#DC2626">- ${formatCurrency(quote.discount_type === 'percentage' ? quote.subtotal * (quote.discount / 100) : quote.discount)}</span>
    </div>
    ` : ''}
    ${quote.tax > 0 ? `
    <div class="total-row">
      <span class="total-label">Taxa/Impostos:</span>
      <span class="total-value">+ ${formatCurrency(quote.tax)}</span>
    </div>
    ` : ''}
    <div class="total-row main">
      <span class="total-label">TOTAL:</span>
      <span class="total-value">${formatCurrency(quote.total)}</span>
    </div>
  </div>
</div>

<!-- OBSERVAÇÕES -->
${quote.notes ? `
<div class="section" style="margin-top:15px">
  <div class="section-title">Observações</div>
  <div class="notes-box">${quote.notes}</div>
</div>
` : ''}

<!-- TERMOS -->
${quote.terms ? `
<div class="section">
  <div class="section-title">Termos e Condições</div>
  <div class="terms-box">${quote.terms}</div>
</div>
` : ''}

<div class="footer">
  Documento gerado em ${new Date().toLocaleString('pt-BR')} | ${company.name}
</div>

</body>
</html>
  `

  // Abrir janela de impressão
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
