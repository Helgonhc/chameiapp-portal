import { supabase } from '../lib/supabase';

const formatDateTime = (dateString: string) => {
  if (!dateString) return '-';
  try {
    let s = String(dateString).replace('Z', '').replace(/\+\d{2}:\d{2}$/, '').replace(/\.\d+$/, '');
    if (s.includes('T')) {
      const parts = s.split('T');
      const [y, m, d] = parts[0].split('-');
      const time = parts[1] || '00:00';
      const [h, min] = time.split(':');
      return `${d}/${m}/${y} ${h}:${min}`;
    }
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  } catch { return String(dateString); }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  try {
    let s = String(dateString).split('T')[0];
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  } catch { return String(dateString); }
};

const formatOrderId = (id: string, dateString: string) => {
  if (!id) return 'OS';
  try {
    const s = String(dateString).split('T')[0];
    const [y, m] = s.split('-');
    return `${y}${m}-${id.slice(0, 4).toUpperCase()}`;
  } catch { return id.slice(0, 6).toUpperCase(); }
};

async function getCompanyConfig() {
  const { data: config } = await supabase.from('app_config').select('*').limit(1).maybeSingle();
  return {
    name: config?.company_name || 'PRESTADOR DE SERVIÇOS',
    cnpj: config?.company_cnpj || config?.cnpj || '',
    address: config?.company_address || config?.address || '',
    phone: config?.company_phone || config?.phone || '',
    email: config?.company_email || config?.email || '',
    logo: config?.company_logo || config?.logo_url || '',
    color: config?.primary_color || '#1e40af'
  };
}

const getCommonCSS = (color: string) => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  @page { size: A4; margin: 12mm; }
  @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display: none !important; } }
  * { margin:0; padding:0; box-sizing:border-box; -webkit-font-smoothing: antialiased; }
  body { font-family:'Inter', sans-serif; font-size:10.5px; color:#1e293b; line-height:1.4; background:#fff; }
  .container { width:100%; margin:0 auto; }
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid ${color}; padding-bottom:20px; margin-bottom:25px; }
  .logo-box { width:260px; min-height:85px; display:flex; align-items:center; }
  .logo-box img { max-width:100%; max-height:100px; object-fit:contain; }
  .h-meta { text-align:right; }
  .h-meta h1 { font-size:16px; font-weight:800; color:${color}; text-transform:uppercase; }
  .os-num { margin-top:8px; background:#f1f5f9; border:1.5px solid #e2e8f0; border-radius:8px; padding:6px 12px; font-weight:800; display:inline-block; }
  .section { margin-bottom:20px; }
  .section-h { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
  .section-h h2 { font-size:9px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:1px; }
  .section-h .line { flex:1; height:1.5px; background:#f1f5f9; }
  .info-card { background:#fff; border:1.5px solid #f1f5f9; border-radius:12px; padding:15px; }
  .row { display:flex; padding:5px 0; border-bottom:1px solid #f8fafc; }
  .lbl { font-size:8px; font-weight:700; color:#94a3b8; width:90px; text-transform:uppercase; }
  .val { font-size:10.5px; color:#1e293b; font-weight:600; }
  .report-view { background:#fdfdfd; border:2px solid #f1f5f9; padding:20px; border-radius:14px; font-size:11px; line-height:1.7; color:#334155; white-space:pre-wrap; }
  .photo-grid { display:grid; grid-template-columns:repeat(5, 1fr); gap:8px; }
  .photo-box { height:85px; border:1.5px solid #f1f5f9; border-radius:12px; background:#f8fafc; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .photo-box img { max-width:100%; max-height:100%; object-fit:contain; border-radius:8px; }
  .sigs { display:flex; justify-content:space-between; margin-top:30px; page-break-inside:avoid; }
  .sig-col { width:45%; border-top:2px solid #e2e8f0; padding-top:10px; text-align:center; }
  .sig-img { height:55px; display:flex; align-items:flex-end; justify-content:center; margin-bottom:5px; }
  .sig-img img { max-height:50px; mix-blend-mode:multiply; }
  .sig-name { font-size:11px; font-weight:800; }
  .footer { margin-top:30px; border-top:1px solid #f1f5f9; padding-top:10px; text-align:center; font-size:8px; color:#94a3b8; }
`;

export async function generateServiceOrderPDF(order: any) {
  try {
    const company = await getCompanyConfig();
    let techName = 'Técnico Responsável', techSig = '';
    const osNumber = formatOrderId(order.id, order.created_at);
    const color = company.color;
    const photos = order.photos_url || order.photos || [];

    if (order.technician_id) {
      const { data: tech } = await supabase.from('profiles').select('full_name, signature_url').eq('id', order.technician_id).maybeSingle();
      if (tech) { techName = tech.full_name; techSig = tech.signature_url; }
    }

    const w = window.open('', '_blank');
    if (!w) return;

    w.document.write(`<html><head><title>OS #${osNumber}</title><style>${getCommonCSS(color)}</style></head><body>
      <div class="container">
        <button class="no-print" style="position:fixed; top:20px; right:20px; padding:10px 20px; background:${color}; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer;" onclick="window.print()">IMPRIMIR RELATÓRIO</button>
        <div class="header">
          <div class="logo-box">${company.logo ? `<img src="${company.logo}">` : ''}</div>
          <div class="h-meta"><h1>RELATÓRIO TÉCNICO</h1><div class="os-num">Nº ${osNumber}</div></div>
        </div>
        <div class="section">
          <div class="section-h"><h2>IDENTIFICAÇÃO DE SERVIÇO</h2><div class="line"></div></div>
          <div class="info-card">
            <div><div class="row"><span class="lbl">Cliente</span><span class="val">${order.clients?.name || '-'}</span></div><div class="row"><span class="lbl">Técnico</span><span class="val">${techName}</span></div></div>
            <div><div class="row"><span class="lbl">Conclusão</span><span class="val">${formatDateTime(order.completed_at)}</span></div><div class="row"><span class="lbl">Localização</span><span class="val">${order.clients?.address || '-'}</span></div></div>
          </div>
        </div>
        <div class="section">
          <div class="section-h"><h2>RELATÓRIO DE EXECUÇÃO</h2><div class="line"></div></div>
          <div class="report-view">${order.execution_report || order.description || 'Nenhum registro textual registrado.'}</div>
        </div>
        ${photos.length > 0 ? `<div class="section"><div class="section-h"><h2>EVIDÊNCIAS (INTEGRAL)</h2><div class="line"></div></div><div class="photo-grid">${photos.map((u: any) => `<div class="photo-box"><img src="${u}"></div>`).join('')}</div></div>` : ''}
        <div class="sigs">
          <div class="sig-col"><div class="sig-img">${techSig ? `<img src="${techSig}">` : ''}</div><p class="sig-name">${techName}</p><span class="lbl">Técnico</span></div>
          <div class="sig-col"><div class="sig-img">${order.signature_url ? `<img src="${order.signature_url}">` : ''}</div><p class="sig-name">${order.signer_name || 'Responsável'}</p><span class="lbl">Cliente</span></div>
        </div>
        <div class="footer">${company.name} • Oficial Intelligence Document</div>
      </div>
    </body></html>`);
    w.document.close();
  } catch (error) { alert('Erro ao gerar PDF'); }
}

export async function generateQuotePDF(quote: any) {
  // Padronizar conform V6
  const company = await getCompanyConfig();
  const quoteNumber = quote.quote_number || quote.id?.slice(0, 8).toUpperCase() || 'ORC';
  const color = company.color;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<html><head><style>${getCommonCSS(color)}</style></head><body>
    <div class="container">
      <div class="header"><div class="logo-box">${company.logo ? `<img src="${company.logo}">` : ''}</div><div class="h-meta"><h1>PROPOSTA COMERCIAL</h1><div class="os-num">#${quoteNumber}</div></div></div>
      <div class="section"><div class="section-h"><h2>CLIENTE</h2><div class="line"></div></div><p class="val" style="font-size:14px;">${quote.clients?.name || '-'}</p></div>
      <div class="section"><div class="section-h"><h2>ESCOPO</h2><div class="line"></div></div><div class="report-view">${quote.description || '-'}</div></div>
      <div style="background:#f8fafc; padding:20px; border-radius:14px; border:2px solid ${color}; text-align:right;"><h2 style="font-size:24px; color:${color}; font-weight:800;">INVESTIMENTO: R$ ${(quote.total_value || quote.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2></div>
    </div>
  </body></html>`);
  w.document.close();
}

export async function generateOvertimePDF(overtime: any) { }
