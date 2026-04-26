import api from '../services/api';
import { requestPrintTemplateSelection } from '../services/printTemplateService';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const isNumericValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return true;
  const text = String(value ?? '').trim();
  return text !== '' && /^-?\d+(?:\.\d+)?$/.test(text.replace(/,/g, ''));
};

export async function fetchCompanyProfile() {
  try {
    const response = await api.get('/settings?category=general');
    const rawData = response.data?.data || response.data || {};
    const settings = rawData.settings || rawData;
    return {
      name: settings.company_name || settings.name || '',
      commercialReg: settings.commercial_register || settings.commercialRegister || '',
      taxNumber: settings.tax_number || settings.taxNumber || '',
      address: settings.address || settings.location || settings.city || settings.region || '',
    };
  } catch (error) {
    console.warn('Using empty company profile for PDF export:', error?.message || error);
    return {
      name: '',
      commercialReg: '',
      taxNumber: '',
      address: '',
    };
  }
}

export function buildReportHtml({
  title = '',
  company = {},
  headers = [],
  rows = [],
  footer = true,
  landscape = false,
  subtitle = '',
  startDate = '',
  endDate = '',
  branch = '',
}) {
  const bodyRows = rows.map((row) => {
    const cells = Array.isArray(row) ? row : [];
    return `<tr>${cells.map((cell) => {
      if (cell && typeof cell === 'object' && cell.content !== undefined) {
        let attrs = '';
        if (cell.colSpan) attrs += ` colspan="${cell.colSpan}"`;
        if (cell.rowSpan) attrs += ` rowspan="${cell.rowSpan}"`;
        if (cell.styles) {
          let inlineStyle = '';
          if (cell.styles.background) inlineStyle += `background-color: ${escapeHtml(cell.styles.background)};`;
          if (cell.styles.fontWeight) inlineStyle += `font-weight: ${escapeHtml(cell.styles.fontWeight)};`;
          if (cell.styles.textAlign) inlineStyle += `text-align: ${escapeHtml(cell.styles.textAlign)};`;
          if (inlineStyle) attrs += ` style="${inlineStyle}"`;
        }
        return `<td${attrs}>${escapeHtml(cell.content)}</td>`;
      }
      const numeric = isNumericValue(cell);
      const className = numeric ? 'number' : '';
      return `<td class="${className}">${escapeHtml(cell)}</td>`;
    }).join('')}</tr>`;
  }).join('');

  const reportData = {
    title,
    company,
    headers,
    rows,
    footer,
    landscape,
    subtitle,
    startDate,
    endDate,
    branch,
  };
  const reportDataJson = JSON.stringify(reportData).replace(/</g, '\\u003c');

  // Format date string if dates are provided separately
  const dateRangeStr = (startDate && endDate)
    ? `من تاريخ ${escapeHtml(startDate)} إلى تاريخ ${escapeHtml(endDate)}`
    : subtitle;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet" />
  <style>
    @page { 
      size: ${landscape ? 'A4 landscape' : 'A4'}; 
      margin: 10mm !important; 
    }
    * {
      box-sizing: border-box;
      direction: rtl;
      text-align: right;
      font-family: 'Cairo', 'Arial Unicode MS', Arial, sans-serif !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: white;
      color: #000;
      unicode-bidi: embed;
      font-size: 8px;
      line-height: 1.2;
    }
    .header-container {
      width: 100%;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
    }
    .company-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    .company-meta p {
      margin: 2px 0;
      font-size: 11px;
    }
    .report-info {
      text-align: center;
      margin-top: 10px;
    }
    .report-title {
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 5px;
    }
    .report-subtitle {
      font-size: 12px;
      color: #333;
      margin: 0;
    }
    .branch-info {
      font-size: 11px;
      margin-top: 5px;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-top: 10px;
      word-wrap: break-word;
    }
    table, th, td {
      border: 1px solid #000 !important;
    }
    th, td {
      padding: 4px 2px;
      vertical-align: middle;
      text-align: right;
      font-size: 8px;
      word-break: break-all;
    }
    th {
      background-color: #f5f5f5;
      font-weight: 700;
      font-size: 8px;
    }
    tr {
      page-break-inside: avoid;
    }
    .number {
      direction: ltr;
      unicode-bidi: embed;
      text-align: left;
    }
    .signature-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 12px;
      font-weight: 700;
      border-top: 1px solid #eee;
    }
    .signature-block {
      width: 200px;
      text-align: center;
    }
    .signature-line {
      margin-top: 30px;
      border-top: 1px solid #000;
      width: 100%;
    }
    @media print {
      .signature-footer {
        position: fixed;
        bottom: 0;
      }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="company-header">
      <div class="company-meta">
        <p><strong>${escapeHtml(company.name || '---')}</strong></p>
        <p>السجل التجاري: ${escapeHtml(company.commercialReg || '---')}</p>
        ${company.taxNumber ? `<p>الرقم الضريبي: ${escapeHtml(company.taxNumber)}</p>` : ''}
      </div>
      ${branch ? `<div class="branch-info">الفرع: ${escapeHtml(branch)}</div>` : ''}
    </div>
    <div class="report-info">
      <h1 class="report-title">${escapeHtml(title)}</h1>
      ${dateRangeStr ? `<p class="report-subtitle">${escapeHtml(dateRangeStr)}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>

  ${footer ? `
  <div class="signature-footer">
    <div class="signature-block">
      <div>المحاسب</div>
      <div class="signature-line"></div>
    </div>
    <div class="signature-block">
      <div>المدير</div>
      <div class="signature-line"></div>
    </div>
  </div>
  ` : ''}
  
  <script type="application/json" id="report-data">${reportDataJson}</script>
</body>
</html>`;
}

export async function generatePDF(htmlContent, filename = 'report.pdf', pdfOptions = {}) {
  try {
    let templateStyle = null;
    // Skip template selection for reports
    if (!window.location.pathname.includes('/reports')) {
      templateStyle = await requestPrintTemplateSelection({
        actionType: 'pdf',
        source: 'generatePDF',
        filename,
      });
    }
    const response = await api.post('/reports/pdf/generate', {
      htmlContent,
      filename,
      pdfOptions: {
        ...pdfOptions,
        templateStyle,
      },
    }, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/pdf',
      },
    });
    const payload = response.data instanceof ArrayBuffer
      ? response.data
      : response.data?.buffer instanceof ArrayBuffer
        ? response.data.buffer
        : response.data;
    return new Blob([payload], { type: 'application/pdf' });
  } catch (error) {
    const message = error?.response?.data?.message || error?.message || 'PDF generation failed';
    console.error('PDF generation request failed:', message);
    throw new Error(message);
  }
}
