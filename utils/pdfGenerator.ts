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
    // DEBUG: Verificar fotos
    console.log('=== DEBUG PDF ===')
    console.log('Order ID:', order.id)
    console.log('photos_url:', order.photos_url)
    console.log('photos:', order.photos)
    console.log('=================')

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

    // 3. HTML PROFISSIONAL V3.0 - DESIGN PREMIUM
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@page { margin: 25px 30px; }
* { box-sizing: border-box; }
body {
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10px;
  color: #2d3748;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  background: #fff;
  margin: 0;
  padding: 0;
}

/* HEADER PREMIUM */
.header-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, ${company.color}08 0%, ${company.color}15 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  border: 1px solid ${company.color}30;
}
.header-logo { width: 18%; }
.header-logo img { width: 100%; max-height: 75px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
.header-info { width: 52%; padding: 0 20px; }
.header-info h1 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: ${company.color};
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
}
.header-info p { margin: 3px 0; font-size: 9px; color: #4a5568; }
.header-info p b { color: #2d3748; }
.header-meta { width: 30%; text-align: right; }
.os-badge {
  background: linear-gradient(135deg, ${company.color} 0%, ${company.color}dd 100%);
  color: #FFF;
  padding: 12px 18px;
  border-radius: 10px;
  display: inline-block;
  text-align: center;
  box-shadow: 0 4px 15px ${company.color}40;
}
.os-number { font-size: 18px; font-weight: 800; display: block; letter-spacing: 1px; }
.os-label { font-size: 8px; text-transform: uppercase; opacity: 0.9; letter-spacing: 1px; }
.os-date { font-size: 10px; margin-top: 8px; color: #4a5568; font-weight: 600; }

/* SEÇÕES PREMIUM */
.section { margin-bottom: 22px; break-inside: avoid; }
.section-title {
  background: linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%);
  border-left: 4px solid ${company.color};
  border-radius: 0 8px 8px 0;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #1e293b;
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  letter-spacing: 0.5px;
}
.section-content {
  background: #fafbfc;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

/* TABELAS PREMIUM */
.info-table { width: 100%; border-collapse: collapse; }
.info-table tr { border-bottom: 1px solid #f1f5f9; }
.info-table tr:last-child { border-bottom: none; }
.info-table td { padding: 8px 6px; vertical-align: middle; }
.lbl {
  font-weight: 600;
  color: #64748b;
  width: 120px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.val { color: #1e293b; font-weight: 500; font-size: 10px; }

/* CHECKLIST PREMIUM */
.checklist-container {
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px;
  margin: 14px 0;
  border: 1px solid #e2e8f0;
}
.checklist-header {
  font-size: 10px;
  font-weight: 700;
  color: #475569;
  border-bottom: 2px solid ${company.color}30;
  padding-bottom: 8px;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.task-table { width: 100%; border-collapse: collapse; }
.task-row { border-bottom: 1px solid #e2e8f0; transition: background 0.2s; }
.task-row:last-child { border-bottom: none; }
.task-row td { padding: 10px 8px; }
.check-icon {
  width: 18px;
  height: 18px;
  border: 2px solid #cbd5e1;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: transparent;
  background: #fff;
}
.is-checked .check-icon {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  border-color: #10B981;
  color: #FFF;
  box-shadow: 0 2px 6px rgba(16,185,129,0.3);
}
.task-text { font-size: 10px; color: #64748b; }
.is-checked .task-text { color: #1e293b; font-weight: 600; }

/* RELATÓRIO PREMIUM */
.report-box {
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 16px;
  border-radius: 10px;
  min-height: 90px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Segoe UI', 'Roboto', Helvetica, Arial, sans-serif;
  font-size: 11px;
  line-height: 1.6;
  color: #334155;
  text-align: left;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
}

/* FOTOS PREMIUM */
.photos-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  margin-top: 14px;
  page-break-inside: avoid;
}
.photos-single {
  grid-template-columns: 1fr;
  max-width: 60%;
  margin-left: auto;
  margin-right: auto;
}
.photo-card {
  width: 100%;
  height: 250px;
  border: none;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  box-shadow: 0 8px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08);
  page-break-inside: avoid;
}
.photo-card-single {
  height: 380px;
  box-shadow: 0 12px 35px rgba(0,0,0,0.15), 0 6px 15px rgba(0,0,0,0.1);
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
  background: linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.7) 60%, transparent 100%);
  color: white;
  padding: 14px 16px;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ASSINATURAS PREMIUM */
.signatures-section {
  margin-top: 45px;
  display: flex;
  justify-content: space-between;
  page-break-inside: avoid;
  gap: 30px;
}
.sig-box {
  width: 45%;
  text-align: center;
  background: linear-gradient(180deg, #fafbfc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 20px 15px 15px;
  border: 1px solid #e2e8f0;
}
.sig-img {
  height: 55px;
  object-fit: contain;
  margin-bottom: -10px;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
}
.sig-line {
  border-top: 2px solid #334155;
  margin: 8px 20px;
  border-radius: 1px;
}
.sig-name {
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  color: #1e293b;
  letter-spacing: 0.5px;
}
.sig-role { font-size: 9px; color: #64748b; margin-top: 2px; }
.sig-doc { font-size: 8px; color: #94a3b8; margin-top: 4px; font-style: italic; }

/* FOOTER PREMIUM */
.footer {
  margin-top: 35px;
  padding: 15px 20px;
  background: linear-gradient(90deg, ${company.color}08 0%, ${company.color}12 50%, ${company.color}08 100%);
  border-radius: 10px;
  text-align: center;
  font-size: 8px;
  color: #64748b;
  border: 1px solid ${company.color}20;
}
.footer-brand {
  font-weight: 700;
  color: ${company.color};
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
  <div class="section-title">👤 Dados do Cliente</div>
  <div class="section-content">
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
</div>

<div class="section">
  <div class="section-title">
    <span>🔧 Detalhes da Execução</span>
    <span style="font-size:9px; font-weight:normal; text-transform:none; color:#64748b;">
      ${formatDateTime(order.checkin_at)} → ${formatDateTime(order.completed_at)}
    </span>
  </div>
  <div class="section-content">
    <div style="margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px dashed #e2e8f0;">
      <span class="lbl">SERVIÇO REALIZADO:</span>
      <span class="val" style="font-size: 12px;"><b>${order.title}</b></span>
    </div>

    ${tasks && tasks.length > 0 ? `
    <div class="checklist-container">
      <div class="checklist-header">✅ Checklist de Verificação</div>
      <table class="task-table">
        ${tasks.map((t: any) => `
        <tr class="task-row ${t.is_completed ? 'is-checked' : ''}">
          <td width="28"><div class="check-icon">✓</div></td>
          <td class="task-text">${t.title}</td>
        </tr>
        `).join('')}
      </table>
    </div>
    ` : ''}

    <div style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
      📝 Relatório Técnico / Observações
    </div>
    <div class="report-box">${reportContent}</div>
  </div>
</div>

${(order.photos_url && order.photos_url.length > 0) || (order.photos && order.photos.length > 0) ? `
<div class="section">
  <div class="section-title">
    <span>📸 Registro Fotográfico</span>
    <span style="font-size:9px; font-weight:normal; text-transform:none; color:#64748b;">
      ${(order.photos_url || order.photos).length} ${(order.photos_url || order.photos).length === 1 ? 'evidência anexada' : 'evidências anexadas'}
    </span>
  </div>
  <div class="photos-container ${(order.photos_url || order.photos).length === 1 ? 'photos-single' : ''}">
    ${(order.photos_url || order.photos).map((u: string, index: number) => `
    <div class="photo-card ${(order.photos_url || order.photos).length === 1 ? 'photo-card-single' : ''}">
      <img src="${u}" alt="Evidência ${index + 1}" />
      <div class="photo-label">Evidência ${index + 1} de ${(order.photos_url || order.photos).length}</div>
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
  Documento gerado digitalmente através do <span class="footer-brand">Portal Chamei</span> em ${new Date().toLocaleString('pt-BR')}<br/>
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

    // Aguardar TODAS as imagens carregarem antes de imprimir
    const waitForImages = () => {
      return new Promise<void>((resolve) => {
        const images = printWindow.document.querySelectorAll('img')
        if (images.length === 0) {
          resolve()
          return
        }

        let loadedCount = 0
        const totalImages = images.length

        const checkAllLoaded = () => {
          loadedCount++
          if (loadedCount >= totalImages) {
            resolve()
          }
        }

        images.forEach((img) => {
          if (img.complete) {
            checkAllLoaded()
          } else {
            img.onload = checkAllLoaded
            img.onerror = checkAllLoaded // Conta mesmo se falhar
          }
        })

        // Timeout de segurança - 5 segundos
        setTimeout(resolve, 5000)
      })
    }

    printWindow.onload = async () => {
      await waitForImages()
      // Aguarda mais um pouco para renderização
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }

  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    alert('Erro ao gerar PDF. Tente novamente.')
  }
}
