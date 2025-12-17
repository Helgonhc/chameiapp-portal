import { supabase } from '@/lib/supabase'

// Função para formatar data e hora
const formatDateTime = (dateString: string) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })}hs`
}

// Função para ID bonito
const formatOrderId = (id: string, dateString: string) => {
  if (!dateString) return id.slice(0, 6).toUpperCase()
  const d = new Date(dateString)
  const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
  const suffix = id.slice(0, 4).toUpperCase()
  return `${yearMonth}-${suffix}`
}

export async function generateServiceOrderPDF(order: any) {
  try {
    // DEBUG
    console.log('=== PDF DEBUG ===')
    console.log('Order ID:', order.id)
    console.log('Technician ID:', order.technician_id)
    
    // 1. CARREGAMENTO DE DADOS
    const { data: config } = await supabase
      .from('app_config')
      .select('*')
      .limit(1)
      .maybeSingle()

    // Busca dados do técnico
    let technicianName = 'Técnico Responsável'
    let technicianSignature = ''
    let technicianDoc = ''
    if (order.technician_id) {
      const { data: tech, error: techError } = await supabase
        .from('profiles')
        .select('full_name, signature_url, cpf')
        .eq('id', order.technician_id)
        .maybeSingle()

      console.log('Tech data:', tech)
      console.log('Tech error:', techError)

      if (tech) {
        technicianName = tech.full_name || technicianName
        technicianSignature = tech.signature_url || ''
        technicianDoc = tech.cpf || ''
      }
    }
    
    console.log('Final - Name:', technicianName)
    console.log('Final - Signature:', technicianSignature)
    console.log('Final - CPF:', technicianDoc)
    console.log('=================')

    // Busca Checklist
    const { data: tasks } = await supabase
      .from('order_tasks')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at')

    // 2. PREPARAÇÃO
    const company = {
      name: config?.company_name || 'PRESTADOR DE SERVIÇOS',
      cnpj: config?.cnpj || '',
      address: config?.address || '',
      phone: config?.phone || '',
      email: config?.email || '',
      site: config?.website || '',
      logo: config?.logo_url || '',
      color: config?.primary_color || '#0044cc'
    }

    const osNumber = formatOrderId(order.id, order.created_at)
    const reportContent = order.execution_report || '<i>Nenhuma observação registrada.</i>'
    const photos = order.photos_url || order.photos || []

    // 3. HTML COMPACTO V4.0
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@page { margin: 20px 25px; size: A4; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9px;
  color: #333;
  line-height: 1.3;
  -webkit-print-color-adjust: exact;
}

/* HEADER COMPACTO */
.header {
  display: table;
  width: 100%;
  border-bottom: 3px solid ${company.color};
  padding-bottom: 12px;
  margin-bottom: 15px;
}
.header-left { display: table-cell; width: 80px; vertical-align: middle; }
.header-left img { max-width: 75px; max-height: 60px; }
.header-center { display: table-cell; vertical-align: middle; padding: 0 15px; }
.header-center h1 { font-size: 15px; color: ${company.color}; margin-bottom: 4px; }
.header-center p { font-size: 8px; color: #555; margin: 1px 0; }
.header-right { display: table-cell; width: 130px; vertical-align: middle; text-align: right; }
.os-box {
  background: ${company.color};
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  display: inline-block;
}
.os-box small { font-size: 7px; display: block; opacity: 0.9; }
.os-box strong { font-size: 14px; }
.os-date { font-size: 8px; color: #666; margin-top: 5px; }

/* SEÇÕES COMPACTAS */
.section { margin-bottom: 12px; }
.section-title {
  background: #f5f5f5;
  border-left: 3px solid ${company.color};
  padding: 6px 10px;
  font-size: 10px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

/* GRID 2 COLUNAS */
.two-cols { display: table; width: 100%; }
.col { display: table-cell; width: 50%; vertical-align: top; padding-right: 10px; }
.col:last-child { padding-right: 0; padding-left: 10px; }

/* TABELA DE DADOS */
.data-table { width: 100%; border-collapse: collapse; }
.data-table td { padding: 4px 0; border-bottom: 1px solid #eee; font-size: 9px; }
.data-table .label { color: #666; width: 80px; font-weight: 600; }
.data-table .value { color: #222; }

/* CHECKLIST COMPACTO */
.checklist { margin: 8px 0; }
.check-item { padding: 4px 0; border-bottom: 1px solid #f0f0f0; font-size: 9px; }
.check-item:last-child { border-bottom: none; }
.check-done { color: #16a34a; }
.check-done::before { content: "✓ "; font-weight: bold; }
.check-pending { color: #999; }
.check-pending::before { content: "○ "; }

/* RELATÓRIO */
.report-box {
  background: #fafafa;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  font-size: 9px;
  line-height: 1.5;
  white-space: pre-wrap;
  min-height: 50px;
}

/* FOTOS COMPACTAS */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}
.photo-item {
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ddd;
}
.photo-item img { width: 100%; height: 100%; object-fit: cover; }

/* ASSINATURAS COMPACTAS */
.signatures {
  display: table;
  width: 100%;
  margin-top: 25px;
  page-break-inside: avoid;
}
.sig-col { display: table-cell; width: 50%; text-align: center; padding: 0 20px; }
.sig-img { height: 45px; margin-bottom: -5px; }
.sig-line { border-top: 1px solid #333; margin: 5px 0; }
.sig-name { font-weight: bold; font-size: 9px; }
.sig-role { font-size: 8px; color: #666; }
.sig-doc { font-size: 7px; color: #999; margin-top: 2px; }

/* FOOTER */
.footer {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #ddd;
  text-align: center;
  font-size: 7px;
  color: #888;
}
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="header-left">
    ${company.logo ? `<img src="${company.logo}" />` : ''}
  </div>
  <div class="header-center">
    <h1>${company.name}</h1>
    ${company.cnpj ? `<p><b>CNPJ:</b> ${company.cnpj}</p>` : ''}
    ${company.address ? `<p>${company.address}</p>` : ''}
    <p>${[company.phone, company.email].filter(Boolean).join(' | ')}</p>
  </div>
  <div class="header-right">
    <div class="os-box">
      <small>ORDEM DE SERVIÇO</small>
      <strong>#${osNumber}</strong>
    </div>
    <div class="os-date">${new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
  </div>
</div>

<!-- DADOS CLIENTE + EXECUÇÃO EM 2 COLUNAS -->
<div class="two-cols">
  <div class="col">
    <div class="section">
      <div class="section-title">DADOS DO CLIENTE</div>
      <table class="data-table">
        <tr><td class="label">Cliente:</td><td class="value"><b>${order.clients?.name || '-'}</b></td></tr>
        <tr><td class="label">CNPJ/CPF:</td><td class="value">${order.clients?.cnpj_cpf || '-'}</td></tr>
        <tr><td class="label">Endereço:</td><td class="value">${order.clients?.address || '-'}</td></tr>
        <tr><td class="label">Contato:</td><td class="value">${order.clients?.phone || '-'}</td></tr>
      </table>
    </div>
  </div>
  <div class="col">
    <div class="section">
      <div class="section-title">DADOS DA EXECUÇÃO</div>
      <table class="data-table">
        <tr><td class="label">Serviço:</td><td class="value"><b>${order.title}</b></td></tr>
        <tr><td class="label">Técnico:</td><td class="value">${technicianName}</td></tr>
        <tr><td class="label">Início:</td><td class="value">${formatDateTime(order.checkin_at)}</td></tr>
        <tr><td class="label">Término:</td><td class="value">${formatDateTime(order.completed_at)}</td></tr>
      </table>
    </div>
  </div>
</div>

<!-- CHECKLIST (se houver) -->
${tasks && tasks.length > 0 ? `
<div class="section">
  <div class="section-title">CHECKLIST DE VERIFICAÇÃO</div>
  <div class="checklist">
    ${tasks.map((t: any) => `
      <div class="check-item ${t.is_completed ? 'check-done' : 'check-pending'}">${t.title}</div>
    `).join('')}
  </div>
</div>
` : ''}

<!-- RELATÓRIO -->
<div class="section">
  <div class="section-title">RELATÓRIO TÉCNICO / OBSERVAÇÕES</div>
  <div class="report-box">${reportContent}</div>
</div>

<!-- FOTOS (se houver) -->
${photos.length > 0 ? `
<div class="section">
  <div class="section-title">REGISTRO FOTOGRÁFICO (${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'})</div>
  <div class="photos-grid">
    ${photos.map((u: string) => `<div class="photo-item"><img src="${u}" /></div>`).join('')}
  </div>
</div>
` : ''}

<!-- ASSINATURAS -->
<div class="signatures">
  <div class="sig-col">
    ${technicianSignature ? `<img src="${technicianSignature}" class="sig-img" />` : '<div style="height:35px"></div>'}
    <div class="sig-line"></div>
    <div class="sig-name">${technicianName}</div>
    <div class="sig-role">Técnico Responsável</div>
    ${technicianDoc ? `<div class="sig-doc">CPF: ${technicianDoc}</div>` : ''}
  </div>
  <div class="sig-col">
    ${order.signature_url ? `<img src="${order.signature_url}" class="sig-img" />` : '<div style="height:35px"></div>'}
    <div class="sig-line"></div>
    <div class="sig-name">${order.signer_name || order.clients?.responsible_name || 'Responsável'}</div>
    <div class="sig-role">Responsável pelo Cliente</div>
    ${order.signer_doc ? `<div class="sig-doc">CPF: ${order.signer_doc}</div>` : ''}
  </div>
</div>

<div class="footer">
  Documento gerado em ${new Date().toLocaleString('pt-BR')} | Portal Chamei
</div>

</body>
</html>
    `

    // 4. ABRIR E IMPRIMIR
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Por favor, permita pop-ups para gerar o PDF')
      return
    }

    printWindow.document.write(html)
    printWindow.document.close()

    // Aguardar imagens
    const waitForImages = () => {
      return new Promise<void>((resolve) => {
        const images = printWindow.document.querySelectorAll('img')
        if (images.length === 0) { resolve(); return }
        let loaded = 0
        const check = () => { if (++loaded >= images.length) resolve() }
        images.forEach((img) => {
          if (img.complete) check()
          else { img.onload = check; img.onerror = check }
        })
        setTimeout(resolve, 5000)
      })
    }

    printWindow.onload = async () => {
      await waitForImages()
      setTimeout(() => printWindow.print(), 300)
    }

  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    alert('Erro ao gerar PDF. Tente novamente.')
  }
}
