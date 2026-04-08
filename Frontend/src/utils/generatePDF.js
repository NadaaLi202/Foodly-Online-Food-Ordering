import api from '../services/api';

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
        const settings = response.data?.data?.settings || {};
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
}) {
    const bodyRows = rows.map((row) => {
        const cells = Array.isArray(row) ? row : [];
        return `<tr>${cells.map((cell) => {
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
    };
    const reportDataJson = JSON.stringify(reportData).replace(/</g, '\\u003c');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet" />
  <style>
    @page { size: ${landscape ? 'A4 landscape' : 'A4'}; margin: 15mm; }
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
      font-size: 11px;
    }
    .header {
      width: 100%;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .company-info p {
      margin: 3px 0;
      font-size: 12px;
      line-height: 1.6;
    }
    .report-title {
      font-size: 16px;
      font-weight: 800;
      text-align: center;
      margin: 0 0 12px;
    }
    .report-subtitle {
      font-size: 12px;
      text-align: center;
      margin: 0 0 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
      direction: rtl;
      font-size: 11px;
    }
    table, th, td {
      border: 1px solid #000 !important;
      border-collapse: collapse !important;
    }
    th, td {
      padding: 8px;
      vertical-align: top;
      text-align: right;
      word-break: break-word;
      background: transparent;
      color: #000;
    }
    th {
      font-weight: 700;
      background: transparent;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .number {
      direction: ltr;
      unicode-bidi: embed;
      text-align: left;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      font-size: 12px;
    }
    img, .logo, [class*="logo"], [class*="brand"] {
      display: none !important;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <p><strong>\u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629:</strong> ${escapeHtml(company.name || '---')}</p>
      <p><strong>\u0627\u0644\u0633\u062c\u0644 \u0627\u0644\u062a\u062c\u0627\u0631\u064a:</strong> ${escapeHtml(company.commercialReg || '---')}</p>
      <p><strong>\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0636\u0631\u064a\u0628\u064a:</strong> ${escapeHtml(company.taxNumber || '---')}</p>
      <p><strong>\u0627\u0644\u0639\u0646\u0648\u0627\u0646:</strong> ${escapeHtml(company.address || '---')}</p>
    </div>
  </div>
  <div class="report-title">${escapeHtml(title)}</div>
  ${subtitle ? `<div class="report-subtitle">${escapeHtml(subtitle)}</div>` : ''}
  <table>
    <thead>
      <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
  ${footer ? `<div class="footer"><span>\u0627\u0644\u0645\u062d\u0627\u0633\u0628</span><span>\u0627\u0644\u0645\u062f\u064a\u0631</span></div>` : ''}
  <script type="application/json" id="report-data">${reportDataJson}</script>
</body>
</html>`;
}

export async function generatePDF(htmlContent, filename = 'report.pdf', pdfOptions = {}) {
    try {
        const response = await api.post('/reports/pdf/generate', {
            htmlContent,
            filename,
            pdfOptions,
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
