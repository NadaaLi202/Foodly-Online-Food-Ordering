const fs = require('fs');
const file = 'src/modules/transaction/transaction.controller.js';
let content = fs.readFileSync(file, 'utf8');

const replacement = `    const templateStyle = req.query.templateStyle || 'normal';

    let htmlContent = '';

    if (templateStyle === 'tax-bilingual') {
        htmlContent = \`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>\${esc(transaction.transactionNumber)}</title>
    <style>
        @page { size: A4; margin: 0; }
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 40px; color: #333; line-height: 1.6; direction: rtl; font-size: 11px; }
        .header { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding-bottom: 20px; font-size: 12px; margin-bottom: 20px;}
        .col { width: 33%; }
        .center-text { text-align: center; }
        .left-text { text-align: left; }
        .right-text { text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: center; }
        th { background: #f9fafb; border: 1px solid #ccc; padding: 10px; font-size: 11px; }
        td { border: 1px solid #ccc; padding: 10px; font-size: 11px; }
        .summary-container { display: flex; justify-content: space-between; margin-top: 20px; }
        .summary-box { width: 55%; font-size: 12px; }
        .notes-box { width: 35%; text-align: right; padding-right: 20px; }
        .row { display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding: 6px 0; }
        .logo-placeholder { border: 1px dashed #999; padding: 15px; color: #999; display: inline-block; }
    </style>
</head>
<body>
    <div class="header">
        <div class="col left-text" style="direction: ltr;">
            <b>\${esc(companyName)}</b><br>
            Register Number : \${esc(company.commercial_register || '—')}<br>
            Tax Number : \${esc(company.tax_number || '—')}<br>
            City : \${esc(company.address || '—')}<br>
        </div>
        <div class="col center-text">
            \${companyLogoUrl ? \`<img src="\${companyLogoUrl}" style="max-height:80px; max-width:150px; border:1px dashed #ccc; padding:4px;" />\` : \`<div class="logo-placeholder">ضع شعارك هنا</div>\`}
            <h2 style="margin:8px 0 0 0; font-size:16px;">فاتورة ضريبية</h2>
            <h2 style="margin:2px 0 0 0; font-size:14px;">TAX INVOICE</h2>
        </div>
        <div class="col right-text" style="direction: rtl;">
            <b>\${esc(companyName)}</b><br>
            السجل التجاري : \${esc(company.commercial_register || '—')}<br>
            الرقم الضريبي : \${esc(company.tax_number || '—')}<br>
            المدينة : \${esc(company.address || '—')}<br>
        </div>
    </div>

    <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold; font-size:12px;">
        <div class="left-text" style="direction: ltr;">
            \${esc(transaction.transactionNumber || '—')} : الرقم - Number<br>
            \${new Date(transaction.issueDate).toISOString().split('T')[0]} : التاريخ - Date
        </div>
        <div class="right-text" style="text-align: right;">
            العميل - Client : \${esc(contactName)}<br>
            الرقم الضريبي - Tax Number : \${esc(contact?.taxNumber || contact?.tax_number || '—')}
        </div>
    </div>

    <table dir="rtl">
        <thead>
            <tr>
                <th>المجموع<br>Total</th>
                <th>نسبة الضريبة<br>Tax Percentage</th>
                <th>المجموع بدون<br>الضريبة<br>Pre-Tax Total</th>
                <th>الكمية<br>Quantity</th>
                <th>السعر<br>Price</th>
                <th style="width: 25%;">الوصف<br>Description</th>
                <th>البند<br>Item</th>
            </tr>
        </thead>
        <tbody>
            \${(transaction.items || []).map((item, idx) => {
                const preTax = item.quantity * item.unitPrice - (item.discountAmount || 0);
                const total = item.total ?? (preTax + (item.taxAmount || 0));
                const taxP = item.taxAmount > 0 ? ((item.taxAmount / preTax) * 100).toFixed(0) : '0';
                return \`
                    <tr>
                        <td dir="ltr">\${fmt(total)} \${esc(currencySymbol)}</td>
                        <td dir="ltr">\${taxP}%</td>
                        <td dir="ltr">\${fmt(preTax)} \${esc(currencySymbol)}</td>
                        <td>\${item.quantity}</td>
                        <td dir="ltr">\${fmt(item.unitPrice)} \${esc(currencySymbol)}</td>
                        <td style="text-align: right;">\${esc(item.productName || item.product?.name)}</td>
                        <td>\${idx + 1}</td>
                    </tr>
                \`;
            }).join('')}
        </tbody>
    </table>

    <div class="summary-container">
        <div class="summary-box">
            <div class="row">
                <span style="width:33%; text-align:left;">Pre-Tax Total</span>
                <span style="width:33%; text-align:center;">\${fmt(transaction.subtotal)} \${currencySymbol}</span>
                <span style="width:33%; text-align:right;">الإجمالي قبل الضريبة</span>
            </div>
            <div class="row">
                <span style="width:33%; text-align:left;">VAT</span>
                <span style="width:33%; text-align:center;">\${fmt(transaction.totalTax)} \${currencySymbol}</span>
                <span style="width:33%; text-align:right;">يشمل القيمة المضافة</span>
            </div>
            <div class="row" style="font-weight:bold;">
                <span style="width:33%; text-align:left;">Total (\${currencySymbol})</span>
                <span style="width:33%; text-align:center;">\${fmt(transaction.totalAmount)}</span>
                <span style="width:33%; text-align:right;">الإجمالي (\${currencySymbol})</span>
            </div>
            <div class="row">
                <span style="width:33%; text-align:left;">Paid</span>
                <span style="width:33%; text-align:center;">\${fmt(transaction.paidAmount || 0)} \${currencySymbol}</span>
                <span style="width:33%; text-align:right;">المدفوع</span>
            </div>
            <div class="row" style="font-weight:bold;">
                <span style="width:33%; text-align:left;">Due (\${currencySymbol})</span>
                <span style="width:33%; text-align:center;">\${fmt(Math.max(0, transaction.totalAmount - (transaction.paidAmount || 0)))}</span>
                <span style="width:33%; text-align:right;">المستحق (\${currencySymbol})</span>
            </div>
            <div style="margin-top: 40px; text-align:left;">
                التوقيع - Signature __________________
            </div>
        </div>
        <div class="notes-box">
            <b>ملاحظات - Notes</b><br>
            <div style="font-size: 10px; margin: 10px 0;">\${esc(transaction.notes || '')}</div>
            <img src="\${qrDataURL}" style="width: 120px; height: 120px; display:block; margin-left:auto; margin-top:10px;" />
        </div>
    </div>
</body>
</html>
        \`;
    } else {
        htmlContent = \`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>\${esc(transaction.transactionNumber)}</title>
    <style>
        @page { size: A4; margin: 0; }
        body {
            font-family: 'Cairo', 'Arial', sans-serif;
            margin: 0;
            padding: 40px;
            color: #333;
            line-height: 1.6;
            direction: rtl;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 20px;
        }
        .logo { max-width: 150px; max-height: 80px; }
        .company-info { text-align: left; }
        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            color: #1a56db;
            margin: 0 0 10px 0;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 30px;
        }
        .meta-table td { padding: 5px 0; }
        .billing-info {
            display: flex;
            gap: 40px;
            margin-bottom: 40px;
        }
        .billing-box { flex: 1; }
        .label {
            font-size: 10px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 5px;
            font-weight: bold;
        }
        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        table.items-table th {
            background-color: #f9fafb;
            color: #374151;
            text-align: right;
            padding: 12px;
            font-size: 12px;
            border-bottom: 2px solid #e5e7eb;
        }
        table.items-table td {
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 11px;
        }
        .summary {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .qr-code { width: 100px; height: 100px; }
        .totals-table { width: 250px; }
        .totals-table td { padding: 5px 0; text-align: left; }
        .totals-table td:first-child { text-align: right; color: #6b7280; }
        .totals-table .grand-total {
            font-size: 16px;
            font-weight: bold;
            color: #1a56db;
            border-top: 2px solid #e5e7eb;
            padding-top: 10px;
        }
        .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
            padding-top: 20px;
        }
        .arabic-text { direction: rtl; unicode-bidi: embed; }
        .number { direction: ltr; display: inline-block; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-brand">
            \${companyLogoUrl ? \`<img src="\${companyLogoUrl}" class="logo" />\` : \`<h1 style="margin:0">\${esc(companyName)}</h1>\`}
        </div>
        <div class="company-info" style="text-align: right;">
            <p style="margin:0; font-weight:bold;">\${esc(companyName)}</p>
            \${company.commercial_register ? \`<p style="margin:2px 0; font-size:11px;">\\u0633\\u062c\\u0644 \\u062a\\u062c\\u0627\\u0631\\u064a: \${esc(company.commercial_register)}</p>\` : ''}
            \${company.tax_number ? \`<p style="margin:2px 0; font-size:11px;">\\u0627\\u0644\\u0631\\u0642\\u0645 \\u0627\\u0644\\u0636\\u0631\\u064a\\u0628\\u064a: \${esc(company.tax_number)}</p>\` : ''}
            \${company.address ? \`<p style="margin:2px 0; font-size:11px;">\${esc(company.address)}</p>\` : ''}
        </div>
    </div>

    <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
        <div>
            <h2 class="invoice-title">\${esc(docTypeLabel(transaction.module, transaction.documentType))}</h2>
            <p style="margin:0; font-weight:bold;"># \${esc(transaction.transactionNumber)}</p>
        </div>
        <div style="text-align: left;">
            <p style="margin:0; font-size:11px;"><span style="color:#6b7280;">\\u062a\\u0627\\u0631\\u064a\\u062e \\u0627\\u0644\\u0625\\u0635\\u062f\\u0627\\u0631:</span> \${new Date(transaction.issueDate).toLocaleDateString('ar-SA')}</p>
            \${transaction.dueDate ? \`<p style="margin:2px 0; font-size:11px;"><span style="color:#6b7280;">\\u062a\\u0627\\u0631\\u064a\\u062e \\u0627\\u0644\\u0627\\u0633\\u062a\\u062d\\u0642\\u0627\\u0642:</span> \${new Date(transaction.dueDate).toLocaleDateString('ar-SA')}</p>\` : ''}
        </div>
    </div>

    <div class="billing-info">
        <div class="billing-box">
            <div class="label">\\u0641\\u0627\\u062a\\u0648\\u0631\\u0629 \\u0625\\u0644\\u0649</div>
            <p style="margin:0; font-weight:bold;">\${esc(contactName)}</p>
            <p style="margin:2px 0; font-size:11px;">\${esc(contact?.address?.address1 || contact?.address?.city || "")}</p>
            \${contact?.phone ? \`<p style="margin:2px 0; font-size:11px;">\${esc(contact.phone)}</p>\` : ''}
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%;">\\u0627\\u0644\\u0648\\u0635\\u0641</th>
                <th style="text-align: center;">\\u0627\\u0644\\u0643\\u0645\\u064a\\u0629</th>
                <th style="text-align: center;">\\u0627\\u0644\\u0633\\u0639\\u0631</th>
                <th style="text-align: left;">\\u0627\\u0644\\u0625\\u062c\\u0645\\u0627\\u0644\\u064a</th>
            </tr>
        </thead>
        <tbody>
            \${(transaction.items || []).map(item => {
                const name = item.productName || item.product?.name || "—";
                const total = item.total ?? (item.quantity * item.unitPrice - (item.discountAmount || 0) + (item.taxAmount || 0));
                return \`
                    <tr>
                        <td>\${esc(name)}</td>
                        <td style="text-align: center;" class="number">\${fmt(item.quantity)}</td>
                        <td style="text-align: center;" class="number">\${fmt(item.unitPrice)}</td>
                        <td style="text-align: left;" class="number">\${fmt(total)} \${esc(currencySymbol)}</td>
                    </tr>
                \`;
            }).join('')}
        </tbody>
    </table>

    <div class="summary">
        <div style="text-align: center;">
            <img src="\${qrDataURL}" class="qr-code" />
            <p style="margin:5px 0 0 0; font-size:9px; color:#9ca3af;">\\u0645\\u0633\\u062d \\u0644\\u0644\\u062a\\u062d\\u0642\\u0642</p>
        </div>
        <table class="totals-table">
            <tr>
                <td>\\u0627\\u0644\\u0625\\u062c\\u0645\\u0627\\u0644\\u064a \\u0627\\u0644\\u0641\\u0631\\u0631\\u0639\\u064a:</td>
                <td class="number">\${fmt(transaction.subtotal)} \${esc(currencySymbol)}</td>
            </tr>
            \${transaction.totalDiscount > 0 ? \`
            <tr>
                <td>\\u0627\\u0644\\u062e\\u0635\\u0645:</td>
                <td class="number">-\${fmt(transaction.totalDiscount)} \${esc(currencySymbol)}</td>
            </tr>
            \` : ''}
            <tr>
                <td>\\u0627\\u0644\\u0636\\u0631\\u064a\\u0628\\u0629:</td>
                <td class="number">\${fmt(transaction.totalTax)} \${esc(currencySymbol)}</td>
            </tr>
            <tr class="grand-total">
                <td>\\u0627\\u0644\\u0625\\u062c\\u0645\\u0627\\u0644\\u064a \\u0627\\u0644\\u0646\\u0647\\u0627\\u0626\\u064a:</td>
                <td class="number">\${fmt(transaction.totalAmount)} \${esc(currencySymbol)}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>\${esc(companyName)} — \\u062c\\u0645\\u064a\\u0631 \\u0627\\u0644\\u062d\\u0642\\u0648\\u0642 \\u0645\\u062d\\u0641\\u0648\\u0638\\u0629</p>
        <p style="margin-top:5px; color:#e5e7eb;">Generated by Dafater Accounting</p>
    </div>
</body>
</html>
        \`;
    }
`;

content = content.replace(/const htmlContent = `([\s\S]*?)`;/, replacement);
fs.writeFileSync(file, content);
