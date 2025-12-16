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
    // 1. CARREGAMENTO DE DADOS
    const { data: config } = await supabase
      .from('app_config')
      .select('*')
      .limit(1)
      .maybeSingle()

    // Busca dados do técnico
    let technicianName = 'Técnico Responsável'
    let technicianSignature = ''
    if (order.technician_id) {
      const { data: tech } = await supabase
        .from('profiles')
        .select('full_name, signature_url')
        .eq('id', order.technician_id)
        .maybeSingle()

      if (tech) {
        technicianName = tech.full_name || technicianName
        technicianSignature = tech.signature_url || ''
      }
    }

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

    // Texto do relatório
    const reportContent = order.execution_report || '<i>Nenhuma observação registrada.</i>'

    // 3. HTML PROFISSIONAL V2.0 - EXATAMENTE IGUAL AO APP
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@page { margin: 30px; }
body {
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10px;
  color: #333;
  line-height: 1.4;
  -webkit-print-color-adjust: exact;
}

/* HEADER */
.header-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid ${company.color};
  padding-bottom: 15px;
  margin-bottom: 25px;
}
.header-logo { width: 20%; }
.header-logo img { width: 100%; max-height: 70px; object-fit: contain; }
.header-info { width: 55%; padding: 0 15px; }
.header-info h1 {
  margin: 0;
  font-size: 16px;
  color: ${company.color};
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.header-info p { margin: 2px 0; font-size: 9px; color: #555; }
.header-meta { width: 25%; text-align: right; }
.os-badge {
  background-color: ${company.color};
  color: #FFF;
  padding: 5px 10px;
  border-radius: 4px;
  display: inline-block;
  text-align: center;
}
.os-number { font-size: 14px; font-weight: bold; display: block; }
.os-label { font-size: 8px; text-transform: uppercase; opacity: 0.9; }
.os-date { font-size: 9px; margin-top: 5px; color: #666; font-weight: bold; }

/* SEÇÕES */
.section { margin-bottom: 20px; break-inside: avoid; }
.section-title {
  background-color: #f4f4f4;
  border-left: 5px solid ${company.color};
  padding: 6px 10px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  color: #333;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
}

/* TABELAS */
.info-table { width: 100%; border-collapse: collapse; }
.info-table td { padding: 4px; vertical-align: top; }
.lbl {
  font-weight: bold;
  color: #666;
  width: 110px;
  font-size: 9px;
  text-transform: uppercase;
}
.val { color: #000; font-weight: 500; }

/* CHECKLIST */
.task-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
.task-row { border-bottom: 1px solid #eee; }
.task-row td { padding: 6px 4px; }
.check-icon {
  width: 14px;
  height: 14px;
  border: 1px solid #ccc;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: transparent;
}
.is-checked .check-icon {
  background-color: #10B981;
  border-color: #10B981;
  color: #FFF;
}
.task-text { font-size: 10px; }
.is-checked .task-text { color: #000; font-weight: 600; }

/* RELATÓRIO E OBS */
.report-box {
  border: 1px solid #ccc;
  background-color: #fff;
  padding: 12px;
  border-radius: 4px;
  min-height: 80px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Segoe UI', 'Roboto', Helvetica, Arial, sans-serif;
  font-size: 11px;
  line-height: 1.5;
  color: #222;
  text-align: left;
}

/* FOTOS */
.photos-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 12px;
  page-break-inside: avoid;
}
.photos-single {
  grid-template-columns: 1fr;
  max-width: 65%;
  margin-left: auto;
  margin-right: auto;
}
.photo-card {
  width: 100%;
  height: 240px;
  border: 3px solid #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  background: #fafafa;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  page-break-inside: avoid;
}
.photo-card-single {
  height: 350px;
  border-width: 4px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}
.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.photo-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 70%, transparent 100%);
  color: white;
  padding: 10px 12px;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}

/* ASSINATURAS */
.signatures-section {
  margin-top: 40px;
  display: flex;
  justify-content: space-between;
  page-break-inside: avoid;
}
.sig-box { width: 45%; text-align: center; }
.sig-img {
  height: 50px;
  object-fit: contain;
  margin-bottom: -15px;
}
.sig-line { border-top: 1px solid #333; margin: 5px 0; }
.sig-name {
  font-weight: bold;
  font-size: 10px;
  text-transform: uppercase;
}
.sig-role { font-size: 8px; color: #666; }
.sig-doc { font-size: 8px; color: #888; margin-top: 3px; font-style: italic; }

.footer {
  margin-top: 30px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  text-align: center;
  font-size: 8px;
  color: #999;
}
</style>
</head>
<body>

<div class="header-container">
  <div class="header-logo">
    ${company.logo ? `<img src="${company.logo}" />` : ''}
  </div>
  <div class="header-info">
    <h1>${company.name}</h1>
    <p><b>CNPJ:</b> ${company.cnpj}</p>
    <p>${company.address}</p>
    <p><b>Contato:</b> ${company.phone} | ${company.email}</p>
    <p>${company.site}</p>
  </div>
  <div class="header-meta">
    <div class="os-badge">
      <span class="os-label">ORDEM DE SERVIÇO</span>
      <span class="os-number">#${osNumber}</span>
    </div>
    <div class="os-date">${new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Dados do Cliente</div>
  <table class="info-table">
    <tr>
      <td class="lbl">Cliente/Razão:</td>
      <td class="val"><b>${order.clients?.name || 'Não informado'}</b></td>
    </tr>
    <tr>
      <td class="lbl">Endereço:</td>
      <td class="val">${order.clients?.address || 'Não informado'}</td>
    </tr>
    <tr>
      <td class="lbl">Documento:</td>
      <td class="val">${order.clients?.cnpj_cpf || '-'}</td>
    </tr>
    <tr>
      <td class="lbl">Contato:</td>
      <td class="val">${order.clients?.phone || ''}</td>
    </tr>
  </table>
</div>

<div class="section">
  <div class="section-title">
    <span>Detalhes da Execução</span>
    <span style="font-size:9px; font-weight:normal; text-transform:none;">
      ${formatDateTime(order.checkin_at)} até ${formatDateTime(order.completed_at)}
    </span>
  </div>
  <div style="margin-bottom: 10px; padding: 0 4px;">
    <span class="lbl">SERVIÇO REALIZADO:</span>
    <span class="val"><b>${order.title}</b></span>
  </div>

  ${tasks && tasks.length > 0 ? `
  <div style="margin-top: 15px; margin-bottom: 15px;">
    <div style="font-size: 10px; font-weight: bold; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 2px; margin-bottom: 5px;">
      CHECKLIST DE VERIFICAÇÃO
    </div>
    <table class="task-table">
      ${tasks.map((t: any) => `
      <tr class="task-row ${t.is_completed ? 'is-checked' : ''}">
        <td width="20"><div class="check-icon">✓</div></td>
        <td class="task-text">${t.title}</td>
      </tr>
      `).join('')}
    </table>
  </div>
  ` : ''}

  <div style="font-size: 10px; font-weight: bold; color: #555; margin-bottom: 5px;">
    RELATÓRIO TÉCNICO / OBSERVAÇÕES
  </div>
  <div class="report-box">${reportContent}</div>
</div>

${(order.photos_url && order.photos_url.length > 0) || (order.photos && order.photos.length > 0) ? `
<div class="section">
  <div class="section-title">
    <span>📸 Registro Fotográfico</span>
    <span style="font-size:9px; font-weight:normal; text-transform:none;">
      ${(order.photos_url || order.photos).length} ${(order.photos_url || order.photos).length === 1 ? 'foto anexada' : 'fotos anexadas'}
    </span>
  </div>
  <div class="photos-container ${(order.photos_url || order.photos).length === 1 ? 'photos-single' : ''}">
    ${(order.photos_url || order.photos).map((u: string, index: number) => `
    <div class="photo-card ${(order.photos_url || order.photos).length === 1 ? 'photo-card-single' : ''}">
      <img src="${u}" alt="Foto ${index + 1}" />
      <div class="photo-label">Foto ${index + 1} de ${(order.photos_url || order.photos).length}</div>
    </div>
    `).join('')}
  </div>
</div>
` : ''}

<div class="signatures-section">
  <div class="sig-box">
    ${technicianSignature ? `<img src="${technicianSignature}" class="sig-img" />` : '<div style="height:40px"></div>'}
    <div class="sig-line"></div>
    <div class="sig-name">${technicianName}</div>
    <div class="sig-role">Técnico Responsável</div>
    ${order.technician_doc ? `<div class="sig-doc">CPF/RG: ${order.technician_doc}</div>` : ''}
  </div>
  <div class="sig-box">
    ${order.signature_url ? `<img src="${order.signature_url}" class="sig-img" />` : '<div style="height:40px"></div>'}
    <div class="sig-line"></div>
    <div class="sig-name">${order.signer_name || order.clients?.responsible_name || 'Responsável'}</div>
    <div class="sig-role">Responsável pelo Cliente</div>
    ${order.signer_doc ? `<div class="sig-doc">CPF/RG: ${order.signer_doc}</div>` : ''}
  </div>
</div>

<div class="footer">
  Documento gerado digitalmente através do Portal Chamei em ${new Date().toLocaleString('pt-BR')}<br/>
  A autenticidade deste documento pode ser verificada junto ao prestador de serviços.
</div>

</body>
</html>
    `

    // 4. ABRIR EM NOVA JANELA E IMPRIMIR
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Por favor, permita pop-ups para gerar o PDF')
      return
    }

    printWindow.document.write(html)
    printWindow.document.close()

    // Aguardar imagens carregarem antes de imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }

  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    alert('Erro ao gerar PDF. Tente novamente.')
  }
}
