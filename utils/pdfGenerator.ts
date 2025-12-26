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
  @page { size: A4; margin: 8mm; }
  @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display: none !important; } }
  * { margin:0; padding:0; box-sizing:border-box; -webkit-font-smoothing: antialiased; }
  body { font-family:'Inter', sans-serif; font-size:10px; color:#334155; line-height:1.3; background:#fff; }
  .container { width:100%; margin:0 auto; }
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid ${color}; padding-bottom:15px; margin-bottom:15px; }
  .logo-box { width:260px; min-height:80px; display:flex; align-items:center; }
  .logo-box img { max-width:100%; max-height:90px; object-fit:contain; }
  .h-meta { text-align:right; }
  .h-meta h1 { font-size:16px; font-weight:800; color:${color}; text-transform:uppercase; }
  .os-num { margin-top:5px; background:#f1f5f9; padding:5px 10px; border-radius:4px; font-weight:700; font-size:11px; display:inline-block; }
  .section { margin-bottom:12px; }
  .section-h { font-size:9px; font-weight:700; color:#64748b; text-transform:uppercase; border-bottom:1px solid #f1f5f9; padding-bottom:3px; margin-bottom:6px; }
  .row { display:flex; padding:4px 0; border-bottom:1px solid #f8fafc; }
  .lbl { font-size:8px; font-weight:600; color:#94a3b8; width:80px; text-transform:uppercase; }
  .val { font-size:10px; color:#1e293b; }
  .report { background:#fff; border:1px solid #f1f5f9; padding:10px; border-radius:4px; font-size:10px; line-height:1.5; white-space:pre-wrap; }
  .photo-grid { display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; margin-top:5px; }
  .photo-box { height:85px; border:1px solid #f1f5f9; border-radius:4px; background:#f8fafc; display:flex; align-items:center; justify-content:center; }
  .photo-box img { max-width:100%; max-height:100%; object-fit:contain; }
  .sigs { display:flex; justify-content:space-between; margin-top:25px; page-break-inside:avoid; }
  .sig-col { width:45%; border-top:1px solid #e2e8f0; padding-top:8px; text-align:center; }
  .sig-img { height:50px; display:flex; align-items:flex-end; justify-content:center; margin-bottom:4px; }
  .sig-img img { max-height:45px; max-width:100%; }
  .footer { margin-top:20px; border-top:1px solid #f1f5f9; padding-top:8px; text-align:center; font-size:8px; color:#94a3b8; }
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

    w.document.write(`<html><head><style>${getCommonCSS(color)}</style></head><body>
      <div class="container">
        <div class="header">
          <div class="logo-box">${company.logo ? `<img src="${company.logo}">` : ''}</div>
          <div class="h-meta"><h1>RELATÓRIO TÉCNICO</h1><div class="os-num">OS #${osNumber}</div></div>
        </div>
        <div class="section">
          <div class="section-h">Identificação</div>
          <div class="row"><span class="lbl">Cliente</span><span class="val">${order.clients?.name || '-'}</span></div>
          <div class="row"><span class="lbl">Realizado por</span><span class="val">${techName}</span></div>
          <div class="row"><span class="lbl">Data</span><span class="val">${formatDateTime(order.completed_at)}</span></div>
        </div>
        <div class="section">
          <div class="section-h">Relatório dos Serviços</div>
          <div class="report">${order.execution_report || order.description || 'Finalizado.'}</div>
        </div>
        ${photos.length > 0 ? `<div class="section"><div class="section-h">Evidências (Integral)</div><div class="photo-grid">${photos.map((u: any) => `<div class="photo-box"><img src="${u}"></div>`).join('')}</div></div>` : ''}
        <div class="sigs">
          <div class="sig-col"><div class="sig-img">${techSig ? `<img src="${techSig}">` : ''}</div><p class="val">${techName}</p><span class="lbl">Técnico</span></div>
          <div class="sig-col"><div class="sig-img">${order.signature_url ? `<img src="${order.signature_url}">` : ''}</div><p class="val">${order.signer_name || 'Responsável'}</p><span class="lbl">Cliente</span></div>
        </div>
        <div class="footer">${company.name}</div>
      </div>
    </body></html>`);
    w.document.close();
  } catch (error) { alert('Erro ao gerar PDF'); }
}

export async function generateQuotePDF(quote: any) {
  // Padronizar conforme V5
  const company = await getCompanyConfig();
  const quoteNumber = quote.quote_number || quote.id?.slice(0, 8).toUpperCase() || 'ORC';
  const color = company.color;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<html><head><style>${getCommonCSS(color)}</style></head><body>
    <div class="container">
      <div class="header">
        <div class="logo-box">${company.logo ? `<img src="${company.logo}">` : ''}</div>
        <div class="h-meta"><h1>ORÇAMENTO</h1><div class="os-num">#${quoteNumber}</div></div>
      </div>
      <div class="section"><div class="section-h">Cliente</div><p class="val">${quote.clients?.name || '-'}</p></div>
      <div class="section"><div class="section-h">Serviços</div><div class="report">${quote.description || '-'}</div></div>
      <div style="background:#f1f5f9; padding:15px; border-radius:4px; text-align:right;"><h2 style="font-size:20px; color:${color};">TOTAL: R$ ${(quote.total_value || quote.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2></div>
    </div>
  </body></html>`);
  w.document.close();
}

export async function generateOvertimePDF(overtime: any) { }
