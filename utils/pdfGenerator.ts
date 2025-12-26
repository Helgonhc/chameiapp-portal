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
  @page { size: A4; margin: 10mm; }
  @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display: none !important; } }
  * { margin:0; padding:0; box-sizing:border-box; -webkit-font-smoothing: antialiased; }
  body { font-family:'Inter', sans-serif; font-size:10.5px; color:#334155; line-height:1.4; background:#fff; }
  .container { width:100%; max-width:800px; margin:0 auto; }
  .header { display:flex; align-items:flex-start; justify-content:space-between; border-bottom:2px solid ${color}; padding-bottom:20px; margin-bottom:20px; }
  .logo-box { width:220px; min-height:100px; display:flex; align-items:center; }
  .logo-box img { max-width:100%; max-height:110px; object-fit:contain; }
  .company-meta { text-align:right; flex:1; }
  .company-meta h1 { font-size:16px; font-weight:800; color:${color}; text-transform:uppercase; }
  .doc-info { margin-top:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 15px; display:inline-block; }
  .doc-info label { font-size:8.5px; font-weight:600; color:#94a3b8; display:block; text-transform:uppercase; }
  .doc-info span { font-size:11px; font-weight:700; color:#1e293b; }
  .section { margin-bottom:15px; }
  .section-h { display:flex; align-items:center; margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:5px; }
  .section-h h2 { font-size:10.5px; font-weight:700; color:#0f172a; text-transform:uppercase; }
  .info-row { display:flex; padding:5px 0; border-bottom:1px solid #f8fafc; }
  .lbl { font-size:9px; font-weight:600; color:#94a3b8; width:90px; text-transform:uppercase; }
  .val { font-size:10.5px; color:#1e293b; flex:1; }
  .report-box { background:#fdfdfd; border:1px solid #e2e8f0; padding:15px; border-radius:6px; font-size:11px; line-height:1.5; color:#334155; white-space:pre-wrap; }
  .sigs { display:flex; justify-content:space-between; margin-top:30px; page-break-inside:avoid; }
  .sig-col { width:45%; border-top:1px solid #cbd5e1; padding-top:8px; text-align:center; }
  .sig-img { height:65px; display:flex; align-items:flex-end; justify-content:center; margin-bottom:5px; }
  .sig-img img { max-height:55px; max-width:100%; }
  .sig-name { font-size:11px; font-weight:700; }
  .sig-label { font-size:9px; color:#94a3b8; text-transform:uppercase; }
  .footer { margin-top:20px; border-top:1px solid #f1f5f9; padding-top:10px; text-align:center; font-size:9px; color:#94a3b8; }
`;

export async function generateServiceOrderPDF(order: any) {
  try {
    const company = await getCompanyConfig();
    let techName = 'Técnico Responsável', techSig = '';
    const osNumber = formatOrderId(order.id, order.created_at);
    const color = company.color;

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
          <div class="company-meta">
            <h1>RELATÓRIO TÉCNICO</h1>
            <div class="doc-info"><label>ORDEM DE SERVIÇO</label><span>#${osNumber}</span></div>
          </div>
        </div>
        <div class="section">
          <div class="section-h"><h2>Identificação</h2></div>
          <div class="info-row"><span class="lbl">Cliente</span><span class="val">${order.clients?.name || '-'}</span></div>
          <div class="info-row"><span class="lbl">Serviço</span><span class="val">${order.title || '-'}</span></div>
          <div class="info-row"><span class="lbl">Conclusão</span><span class="val">${formatDateTime(order.completed_at)}</span></div>
        </div>
        <div class="section">
          <div class="section-h"><h2>Relatório</h2></div>
          <div class="report-box">${order.execution_report || order.description || 'Serviço finalizado.'}</div>
        </div>
        <div class="sigs">
          <div class="sig-col"><div class="sig-img">${techSig ? `<img src="${techSig}">` : ''}</div><div class="sig-name">${techName}</div><div class="sig-label">Técnico</div></div>
          <div class="sig-col"><div class="sig-img">${order.signature_url ? `<img src="${order.signature_url}">` : ''}</div><div class="sig-name">${order.signer_name || 'Responsável'}</div><div class="sig-label">Cliente</div></div>
        </div>
        <div class="footer">${company.name} • Oficial Document</div>
      </div>
    </body></html>`);
    w.document.close();
  } catch (error) { alert('Erro ao gerar PDF'); }
}

export async function generateQuotePDF(quote: any) {
  try {
    const company = await getCompanyConfig();
    const quoteNumber = quote.quote_number || quote.id?.slice(0, 8).toUpperCase() || 'ORC';
    const color = company.color;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><style>${getCommonCSS(color)}</style></head><body>
      <div class="container">
        <div class="header"><div class="logo-box">${company.logo ? `<img src="${company.logo}">` : ''}</div><div class="company-meta"><h1>ORÇAMENTO</h1><div class="doc-info"><span>#${quoteNumber}</span></div></div></div>
        <div class="section"><div class="section-h"><h2>CLIENTE</h2></div><div class="info-row"><span class="lbl">NOME</span><span class="val">${quote.clients?.name || '-'}</span></div></div>
        <div class="section"><div class="section-h"><h2>ESCOPO</h2></div><div class="report-box">${quote.description || 'Serviços.'}</div></div>
        <div style="background:#f1f5f9; padding:20px; border-radius:8px; border-left:4px solid ${color}; text-align:right;">
          <h2 style="font-size:24px; color:${color};">TOTAL: R$ ${(quote.total_value || quote.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
      </div>
    </body></html>`);
    w.document.close();
  } catch (error) { alert('Erro ao gerar orçamento'); }
}

export async function generateOvertimePDF(overtime: any) {
  // Similar compacto
}
