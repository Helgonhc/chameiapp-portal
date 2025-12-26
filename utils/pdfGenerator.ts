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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  @page { size: A4; margin: 0; }
  @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display: none !important; } }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  body { font-family: 'Inter', sans-serif; font-size: 11px; color: #1e293b; line-height: 1.4; background: #fff; }
  .document { width: 100%; min-height: 297mm; background: white; position: relative; }
  .corporate-header { background: ${color}; color: white; padding: 40px 50px; display: flex; justify-content: space-between; align-items: center; }
  .logo-box { width: 150px; height: 80px; background: white; border-radius: 8px; padding: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .header-info { text-align: right; }
  .header-info h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 5px; text-transform: uppercase; }
  .header-info .doc-id { margin-top: 10px; font-size: 14px; font-weight: 700; background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 4px; display: inline-block; }
  .content-wrapper { padding: 40px 50px; }
  .section { margin-bottom: 30px; }
  .section-header { display: flex; align-items: center; margin-bottom: 12px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; }
  .section-header .bar { width: 4px; height: 18px; background: ${color}; margin-right: 10px; border-radius: 2px; }
  .section-header h2 { font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; }
  .info-table { width: 100%; border-collapse: collapse; }
  .info-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
  .label { font-size: 9px; font-weight: 600; color: #64748b; text-transform: uppercase; width: 100px; }
  .value { font-size: 11px; font-weight: 500; color: #1e293b; }
  .report-box { background: #fdfdfd; border: 1.5px solid #f1f5f9; padding: 25px; border-radius: 10px; font-size: 12px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
  .signature-area { margin-top: 60px; display: flex; justify-content: space-between; page-break-inside: avoid; }
  .sig-box { width: 45%; }
  .sig-img-wrap { height: 100px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 12px; }
  .sig-img-wrap img { max-height: 80px; max-width: 100%; }
  .sig-line { border-top: 2px solid #0f172a; margin-bottom: 8px; }
  .sig-name { font-size: 12px; font-weight: 700; color: #0f172a; text-align: center; }
  .sig-role { font-size: 10px; color: #64748b; text-align: center; text-transform: uppercase; }
  .footer { position: absolute; bottom: 30px; left: 50px; right: 50px; border-top: 1px solid #f1f5f9; padding-top: 15px; color: #94a3b8; font-size: 9px; }
  .print-btn { position: fixed; bottom: 30px; right: 30px; background: #0f172a; color: white; border: none; padding: 15px 30px; border-radius: 50px; font-family: 'Inter', sans-serif; font-weight: 700; cursor: pointer; z-index: 9999; }
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

    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Relatório | ${osNumber}</title>
  <style>${getCommonCSS(color)}</style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">IMPRIMIR DOCUMENTO</button>
  <div class="document">
    <div class="corporate-header">
      <div class="logo-box">${company.logo ? `<img src="${company.logo}">` : ''}</div>
      <div class="header-info">
        <h1>RELATÓRIO TÉCNICO</h1>
        <p>${company.name}</p>
        <div class="doc-id">Nº ORDEM: ${osNumber}</div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="section">
        <div class="section-header"><div class="bar"></div><h2>Dados do Cliente</h2></div>
        <table class="info-table">
          <tr><td class="label">Cliente</td><td class="value">${order.clients?.name || '-'}</td></tr>
          <tr><td class="label">Endereço</td><td class="value">${order.clients?.address || '-'}</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-header"><div class="bar"></div><h2>Execução do Serviço</h2></div>
        <table class="info-table">
          <tr><td class="label">Serviço</td><td class="value">${order.title || '-'}</td></tr>
          <tr><td class="label">Realizado por</td><td class="value">${techName}</td></tr>
          <tr><td class="label">Data Conclusão</td><td class="value">${formatDateTime(order.completed_at)}</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-header"><div class="bar"></div><h2>Relatório Detalhado</h2></div>
        <div class="report-box">${order.execution_report || order.description || 'Relatório finalizado conforme solicitação.'}</div>
      </div>

      <div class="signature-area">
        <div class="sig-box">
          <div class="sig-img-wrap">${techSig ? `<img src="${techSig}">` : ''}</div>
          <div class="sig-line"></div>
          <div class="sig-name">${techName}</div>
          <div class="sig-role">Certificador Técnico</div>
        </div>
        <div class="sig-box">
          <div class="sig-img-wrap">${order.signature_url ? `<img src="${order.signature_url}">` : ''}</div>
          <div class="sig-line"></div>
          <div class="sig-name">${order.signer_name || 'Responsável Cliente'}</div>
          <div class="sig-role">Validação do Cliente</div>
        </div>
      </div>
    </div>
    <div class="footer">Este documento é parte integrante do histórico de manutenções de ${company.name}</div>
  </div>
</body>
</html>`);
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

    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Proposta | ${quoteNumber}</title>
  <style>${getCommonCSS(color)}</style>
</head>
<body>
  <div class="document">
    <div class="corporate-header">
      <div class="logo-box">${company.logo ? `<img src="${company.logo}">` : ''}</div>
      <div class="header-info">
        <h1>PROPOSTA COMERCIAL</h1>
        <div class="doc-id">Nº: ${quoteNumber}</div>
      </div>
    </div>
    <div class="content-wrapper">
      <div class="section">
        <div class="section-header"><div class="bar"></div><h2>Cliente</h2></div>
        <table class="info-table">
          <tr><td class="label">Razão Social</td><td class="value">${quote.clients?.name || '-'}</td></tr>
        </table>
      </div>
      <div class="section">
        <div class="section-header"><div class="bar"></div><h2>Escopo de Trabalho</h2></div>
        <div class="report-box">${quote.description || 'Proposta de serviços técnicos.'}</div>
      </div>
      <div style="background:#f1f5f9; padding:30px; border-radius:10px; border:2px solid ${color}; text-align:right;">
        <p style="font-size:12px; font-weight:700; margin-bottom:5px;">VALOR TOTAL DO INVESTIMENTO</p>
        <h2 style="font-size:32px; color:${color}; font-weight:800;">R$ ${(quote.total_value || quote.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
      </div>
    </div>
  </div>
</body>
</html>`);
    w.document.close();
  } catch (error) { alert('Erro ao gerar orçamento'); }
}

export async function generateOvertimePDF(overtime: any) {
  try {
    const company = await getCompanyConfig();
    const ovNumber = overtime.id?.slice(0, 8).toUpperCase() || 'BH';
    const color = company.color;

    const w = window.open('', '_blank');
    if (!w) return;

    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Registro | ${ovNumber}</title>
  <style>${getCommonCSS(color)}</style>
</head>
<body>
  <div class="document">
    <div class="corporate-header" style="background:#334155;">
      <div class="logo-box">${company.logo ? `<img src="${company.logo}">` : ''}</div>
      <div class="header-info"><h1>CONTROLE DE ACESSOS</h1><p>${company.name}</p></div>
    </div>
    <div class="content-wrapper">
        <div class="section">
            <div class="section-header"><div class="bar"></div><h2>Informações</h2></div>
            <table class="info-table">
                <tr><td class="label">Data</td><td class="value">${formatDate(overtime.date || overtime.created_at)}</td></tr>
                <tr><td class="label">Total Horas</td><td class="value"><strong>${overtime.hours || 0} horas</strong></td></tr>
            </table>
        </div>
    </div>
  </div>
</body>
</html>`);
    w.document.close();
  } catch (error) { alert('Erro ao gerar registro'); }
}
