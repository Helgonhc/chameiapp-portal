// Função para gerar PDF de orçamento no portal
export function generateQuotePDF(quote: any, items: any[]) {
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
