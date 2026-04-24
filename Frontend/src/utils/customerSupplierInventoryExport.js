import * as XLSX from 'xlsx';
import { buildReportHtml, fetchCompanyProfile, generatePDF } from './generatepdf';

const fmtNum = (n) => (n == null || n === '' || n === undefined) ? '' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

/**
 * Export Customer Summary Report to Excel
 */
export function exportCustomerSummaryToExcel(summaryData, dateRange, t) {
    const rows = [];
    rows.push([t('reports.customers.summary_report') || 'Customer Summary Report']);
    rows.push([t('reports.filters.from_date') || 'From Date', dateRange?.fromDate || '—']);
    rows.push([t('reports.filters.to_date') || 'To Date', dateRange?.toDate || '—']);
    rows.push([]);

    rows.push([
        t('reports.customers.total_invoices') || 'Total Invoices',
        fmtNum(summaryData?.totalInvoices || 0)
    ]);
    rows.push([
        t('reports.customers.total_returns') || 'Total Returns',
        fmtNum(summaryData?.totalReturns || 0)
    ]);
    rows.push([
        t('reports.clients.total_payments_received') || 'Total Payments Received',
        fmtNum(summaryData?.totalPaymentsReceived || 0)
    ]);
    rows.push([
        t('reports.clients.total_outstanding') || 'Outstanding',
        fmtNum(summaryData?.totalOutstanding || 0)
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Summary');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `Customer_Summary_${dateStr}.xlsx`);
}

/**
 * Export Customer Detailed Report to Excel
 */
export function exportCustomerDetailedToExcel(detailedData, dateRange, t) {
    const rows = [];
    rows.push([t('reports.customers.detailed_report') || 'Detailed Customer Report']);
    rows.push([t('reports.filters.from_date') || 'From Date', dateRange?.fromDate || '—']);
    rows.push([t('reports.filters.to_date') || 'To Date', dateRange?.toDate || '—']);
    rows.push([]);

    // Header row
    rows.push([
        t('reports.columns.customer_name') || 'Customer Name',
        t('reports.columns.code') || 'Code',
        t('reports.customers.total_invoices') || 'Total Invoices',
        t('reports.customers.total_returns') || 'Total Returns',
        t('reports.customers.total_paid') || 'Total Paid',
        t('reports.customers.outstanding') || 'Outstanding'
    ]);

    // Data rows
    detailedData.forEach(row => {
        rows.push([
            row.customerName || '—',
            row.code || '—',
            fmtNum(row.totalInvoices || 0),
            fmtNum(row.totalReturns || 0),
            fmtNum(row.totalPaid || 0),
            fmtNum(row.outstanding || 0)
        ]);
    });

    // Total row
    if (detailedData.length > 0) {
        rows.push([
            t('reports.total') || 'Total',
            '',
            fmtNum(detailedData.reduce((sum, r) => sum + (r.totalInvoices || 0), 0)),
            fmtNum(detailedData.reduce((sum, r) => sum + (r.totalReturns || 0), 0)),
            fmtNum(detailedData.reduce((sum, r) => sum + (r.totalPaid || 0), 0)),
            fmtNum(detailedData.reduce((sum, r) => sum + (r.outstanding || 0), 0))
        ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Detailed');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `Customer_Detailed_${dateStr}.xlsx`);
}

/**
 * Export Supplier Summary Report to Excel
 */
export function exportSupplierSummaryToExcel(summaryData, dateRange, t) {
    const rows = [];
    rows.push([t('reports.suppliers.summary_report') || 'Supplier Summary Report']);
    rows.push([t('reports.filters.from_date') || 'From Date', dateRange?.fromDate || '—']);
    rows.push([t('reports.filters.to_date') || 'To Date', dateRange?.toDate || '—']);
    rows.push([]);

    rows.push([
        t('reports.suppliers.total_purchases') || 'Total Purchases',
        fmtNum(summaryData?.totalPurchases || 0)
    ]);
    rows.push([
        t('reports.suppliers.total_returns') || 'Total Returns',
        fmtNum(summaryData?.totalReturns || 0)
    ]);
    rows.push([
        t('reports.suppliers.total_payments_spent') || 'Total Payments Spent',
        fmtNum(summaryData?.totalPaymentsSpent || 0)
    ]);
    rows.push([
        t('reports.suppliers.total_outstanding') || 'Total Outstanding',
        fmtNum(summaryData?.totalOutstanding || 0)
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Supplier Summary');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `Supplier_Summary_${dateStr}.xlsx`);
}

/**
 * Export Supplier Detailed Report to Excel
 */
export function exportSupplierDetailedToExcel(detailedData, dateRange, t) {
    const rows = [];
    rows.push([t('reports.suppliers.detailed_report') || 'Detailed Supplier Report']);
    rows.push([t('reports.filters.from_date') || 'From Date', dateRange?.fromDate || '—']);
    rows.push([t('reports.filters.to_date') || 'To Date', dateRange?.toDate || '—']);
    rows.push([]);

    // Header row
    rows.push([
        t('reports.columns.supplier_name') || 'Supplier Name',
        t('reports.columns.code') || 'Code',
        t('reports.suppliers.total_purchases') || 'Total Purchases',
        t('reports.suppliers.total_returns') || 'Total Returns',
        t('reports.suppliers.total_paid') || 'Total Paid',
        t('reports.suppliers.outstanding') || 'Outstanding'
    ]);

    // Data rows
    detailedData.forEach(row => {
        rows.push([
            row.supplierName || '—',
            row.code || '—',
            fmtNum(row.totalPurchases || 0),
            fmtNum(row.totalReturns || 0),
            fmtNum(row.totalPaid || 0),
            fmtNum(row.outstanding || 0)
        ]);
    });

    // Total row
    if (detailedData.length > 0) {
        rows.push([
            t('reports.total') || 'Total',
            '',
            fmtNum(detailedData.reduce((sum, r) => sum + (r.totalPurchases || 0), 0)),
            fmtNum(detailedData.reduce((sum, r) => sum + (r.totalReturns || 0), 0)),
            fmtNum(detailedData.reduce((sum, r) => sum + (r.totalPaid || 0), 0)),
            fmtNum(detailedData.reduce((sum, r) => sum + (r.outstanding || 0), 0))
        ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Supplier Detailed');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `Supplier_Detailed_${dateStr}.xlsx`);
}

/**
 * Export Inventory Value Report to Excel
 */
export function exportInventoryValueToExcel(summaryData, filters, t) {
    const rows = [];
    rows.push([t('reports.inventory.inventory_value_report.report_title_dynamic') || 'Inventory Value Report']);
    rows.push([]);

    // Header row
    rows.push([
        t('reports.inventory.inventory_value_report.name') || 'Name',
        t('reports.inventory.inventory_value_report.code') || 'Code',
        t('reports.inventory.inventory_value_report.quantity') || 'Quantity',
        t('reports.inventory.inventory_value_report.average_cost') || 'Average Cost',
        t('reports.inventory.inventory_value_report.value') || 'Value',
        t('reports.inventory.inventory_value_report.sale_price_without_taxes') || 'Sale Price (Without Taxes)',
        t('reports.inventory.inventory_value_report.sale_value') || 'Sale Value',
        t('reports.inventory.inventory_value_report.sale_profit') || 'Sale Profit'
    ]);

    // Data rows
    summaryData.forEach(row => {
        rows.push([
            row.productName || '—',
            row.code || '—',
            row.quantity || 0,
            fmtNum(row.unitCost || 0),
            fmtNum(row.inventoryValue || 0),
            fmtNum(row.sellingPrice || 0),
            fmtNum(row.potentialSalesValue || 0),
            fmtNum(row.potentialProfit || 0)
        ]);
    });

    // Total row
    if (summaryData.length > 0) {
        const totalValue = summaryData.reduce((sum, item) => sum + (item.inventoryValue || 0), 0);
        const totalSalesValue = summaryData.reduce((sum, item) => sum + (item.potentialSalesValue || 0), 0);
        const totalProfit = summaryData.reduce((sum, item) => sum + (item.potentialProfit || 0), 0);

        rows.push([
            t('reports.total') || 'Total',
            '',
            '',
            '',
            fmtNum(totalValue),
            '',
            fmtNum(totalSalesValue),
            fmtNum(totalProfit)
        ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Value');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `Inventory_Value_${dateStr}.xlsx`);
}

/**
 * Export Inventory Movements Detailed Report to Excel
 */
export function exportInventoryMovementsToExcel(movementsData, dateRange, t) {
    const rows = [];
    rows.push([t('reports.inventory.inventory_movements_detailed') || 'Inventory Movements Detailed Report']);
    rows.push([t('reports.filters.from_date') || 'From Date', dateRange?.fromDate || '—']);
    rows.push([t('reports.filters.to_date') || 'To Date', dateRange?.toDate || '—']);
    rows.push([]);

    // Header row
    rows.push([
        t('reports.inventory.inventory_value_detailed_report.stock_transaction') || 'Stock Transaction',
        t('reports.inventory.inventory_value_detailed_report.source') || 'Source',
        t('reports.inventory.inventory_value_detailed_report.date') || 'Date',
        t('reports.inventory.inventory_value_detailed_report.quantity') || 'Quantity',
        t('reports.inventory.inventory_value_detailed_report.quantity_after') || 'Quantity After',
        t('reports.inventory.inventory_value_detailed_report.value') || 'Value (EGP)',
        t('reports.inventory.inventory_value_detailed_report.value_correction') || 'Value Correction (EGP)'
    ]);

    // Group by product and add rows
    const groupedByProduct = {};
    movementsData.forEach(movement => {
        const key = movement.productCode || movement.productName || 'unknown';
        if (!groupedByProduct[key]) {
            groupedByProduct[key] = {
                productName: movement.productName || '—',
                productCode: movement.productCode || '—',
                movements: []
            };
        }
        groupedByProduct[key].movements.push(movement);
    });

    Object.entries(groupedByProduct).forEach(([key, group]) => {
        rows.push([`${group.productName} ${group.productCode}`, '', '', '', '', '', '']);
        group.movements.forEach(movement => {
            rows.push([
                movement.type || '—',
                movement.documentNumber || '—',
                formatCellDate(movement.date),
                fmtNum(movement.quantity),
                fmtNum(movement.quantityAfter),
                fmtNum(movement.value),
                fmtNum(movement.valueCorrection)
            ]);
        });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Movements');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `Inventory_Movements_${dateStr}.xlsx`);
}

const formatCellDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

const buildPdfBlob = async ({ title, headers, rows, dateRange, footer = true, landscape = false, subtitle = '' }) => {
    const company = await fetchCompanyProfile();
    const html = buildReportHtml({
        title,
        company,
        headers,
        rows,
        footer,
        landscape,
        subtitle,
    });
    return generatePDF(html, `${String(title || 'report').replace(/\s+/g, '_')}.pdf`, { landscape });
};

/**
 * Export Client Statement (Account Statement) to Excel
 * Same columns as UI: Date, Type, Document Number, Description, Debit, Credit, Balance + totals row
 */
export function exportClientStatementToExcel(accountsData, totals, dateRange, t) {
    const rows = [];
    const title = t('reports.clients.client_general_ledger') || 'كشف حساب عميل';
    rows.push([title]);
    rows.push([t('reports.filters.from_date') || 'من تاريخ', dateRange?.fromDate || '—']);
    rows.push([t('reports.filters.to_date') || 'إلى تاريخ', dateRange?.toDate || '—']);
    rows.push([]);

    accountsData.forEach((account) => {
        // Account header
        rows.push([`${account.accountName} #${account.accountCode}`]);

        // Table Headers
        rows.push([
            t('reports.columns.journal_entry') || 'قيد اليومية',
            t('reports.columns.date') || 'التاريخ',
            t('reports.columns.source') || 'المصدر',
            t('reports.columns.description') || 'الوصف',
            t('reports.columns.debit') || 'مديـن',
            t('reports.columns.credit') || 'دائـن',
            t('reports.columns.balance') || 'الرصيد',
        ]);

        // Opening Balance
        rows.push([
            '',
            '',
            '',
            'الرصيد الافتتاحي',
            '',
            '',
            fmtNum(account.openingBalance)
        ]);

        // Entries
        account.entries.forEach((entry) => {
            rows.push([
                entry.journalNumber || '—',
                fmtDate(entry.date),
                entry.source || '—',
                entry.description || '—',
                fmtNum(entry.debit),
                fmtNum(entry.credit),
                fmtNum(entry.balance),
            ]);
        });

        // Account Footer
        rows.push([
            '',
            '',
            'إجمالي الحساب',
            fmtNum(account.totalDebit),
            fmtNum(account.totalCredit),
            fmtNum(account.closingBalance),
        ]);
        rows.push([]); // Spacer
    });

    if (totals) {
        rows.push([
            'إجمالي العــملاء',
            '',
            '',
            fmtNum(totals.totalDebit),
            fmtNum(totals.totalCredit),
            fmtNum(totals.finalBalance),
        ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Statement');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `Customer_Statement_${dateStr}.xlsx`);
}

/**
 * Build Client Statement (Account Statement) PDF - same layout as UI
 */
/**
 * Export Client Statement (Account Statement) to PDF
 */
export async function exportClientStatementToPdf(accountsData, totals, dateRange, t) {
    try {
        const company = await fetchCompanyProfile();
        const title = t('reports.clients.client_general_ledger') || 'كشف حساب عميل';
        
        let htmlTable = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10pt;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th rowspan="2" style="border: 1px solid #222; padding: 6px;">قيد اليومية</th>
                        <th rowspan="2" style="border: 1px solid #222; padding: 6px;">التاريخ</th>
                        <th rowspan="2" style="border: 1px solid #222; padding: 6px;">المصدر</th>
                        <th rowspan="2" style="border: 1px solid #222; padding: 6px; min-width: 180px;">الوصف</th>
                        <th colspan="2" style="border: 1px solid #222; padding: 6px; text-align: center;">القيد</th>
                        <th colspan="2" style="border: 1px solid #222; padding: 6px; text-align: center;">الرصيد</th>
                    </tr>
                    <tr style="background: #f1f5f9;">
                        <th style="border: 1px solid #222; padding: 6px; text-align: center; width: 80px;">مدين</th>
                        <th style="border: 1px solid #222; padding: 6px; text-align: center; width: 80px;">دائن</th>
                        <th style="border: 1px solid #222; padding: 6px; text-align: center; width: 80px;">مدين</th>
                        <th style="border: 1px solid #222; padding: 6px; text-align: center; width: 80px;">دائن</th>
                    </tr>
                </thead>
                <tbody>
        `;

        accountsData.forEach(account => {
            // Account Section Header
            htmlTable += `
                <tr style="background: #e2e8f0; font-weight: bold;">
                    <td colspan="8" style="border: 1px solid #222; padding: 8px; text-align: center; background: #f8fafc;">
                        ${account.accountName} #${account.accountCode}
                    </td>
                </tr>
            `;

            // Previous Balance
            htmlTable += `
                <tr style="background: #fffbeb;">
                    <td style="border: 1px solid #222;"></td>
                    <td style="border: 1px solid #222;"></td>
                    <td style="border: 1px solid #222;"></td>
                    <td style="border: 1px solid #222; padding: 6px; font-weight: bold;">الرصيد السابق</td>
                    <td style="border: 1px solid #222;"></td>
                    <td style="border: 1px solid #222;"></td>
                    <td style="border: 1px solid #222; padding: 6px; text-align: center; font-weight: bold;">${account.openingBalance > 0 ? fmtNum(account.openingBalance) : '0.00'}</td>
                    <td style="border: 1px solid #222; padding: 6px; text-align: center; font-weight: bold;">${account.openingBalance < 0 ? fmtNum(Math.abs(account.openingBalance)) : '0.00'}</td>
                </tr>
            `;

            // Transaction Entries
            account.entries.forEach(entry => {
                htmlTable += `
                    <tr>
                        <td style="border: 1px solid #222; padding: 6px;">${entry.journalNumber || '--'}</td>
                        <td style="border: 1px solid #222; padding: 6px;">${fmtDate(entry.date)}</td>
                        <td style="border: 1px solid #222; padding: 6px;">${entry.source || '--'}</td>
                        <td style="border: 1px solid #222; padding: 6px;">${entry.description || '--'}</td>
                        <td style="border: 1px solid #222; padding: 6px; text-align: center;">${entry.debit > 0 ? fmtNum(entry.debit) : ''}</td>
                        <td style="border: 1px solid #222; padding: 6px; text-align: center;">${entry.credit > 0 ? fmtNum(entry.credit) : ''}</td>
                        <td style="border: 1px solid #222; padding: 6px; text-align: center; font-weight: bold;">${entry.balance > 0 ? fmtNum(entry.balance) : '0.00'}</td>
                        <td style="border: 1px solid #222; padding: 6px; text-align: center; font-weight: bold;">${entry.balance < 0 ? fmtNum(Math.abs(entry.balance)) : '0.00'}</td>
                    </tr>
                `;
            });

            // Account Footer / Totals
            htmlTable += `
                <tr style="background: #f8fafc; font-weight: bold;">
                    <td colspan="4" style="border: 1px solid #222; padding: 6px;">إجمالي الحساب</td>
                    <td style="border: 1px solid #222; padding: 6px; text-align: center;">${fmtNum(account.totalDebit)}</td>
                    <td style="border: 1px solid #222; padding: 6px; text-align: center;">${fmtNum(account.totalCredit)}</td>
                    <td style="border: 1px solid #222; padding: 6px; text-align: center;">${account.closingBalance > 0 ? fmtNum(account.closingBalance) : '0.00'}</td>
                    <td style="border: 1px solid #222; padding: 6px; text-align: center;">${account.closingBalance < 0 ? fmtNum(Math.abs(account.closingBalance)) : '0.00'}</td>
                </tr>
                <tr style="height: 10px;"><td colspan="8"></td></tr>
            `;
        });

        if (totals) {
            htmlTable += `
                <tr style="background: #eef2ff; font-weight: 900; font-size: 11pt;">
                    <td colspan="4" style="border: 1px solid #222; padding: 10px;">إجماليات العملاء</td>
                    <td style="border: 1px solid #222; padding: 10px; text-align: center;">${fmtNum(totals.totalDebit)}</td>
                    <td style="border: 1px solid #222; padding: 10px; text-align: center;">${fmtNum(totals.totalCredit)}</td>
                    <td style="border: 1px solid #222; padding: 10px; text-align: center;">${totals.finalBalance > 0 ? fmtNum(totals.finalBalance) : '0.00'}</td>
                    <td style="border: 1px solid #222; padding: 10px; text-align: center;">${totals.finalBalance < 0 ? fmtNum(Math.abs(totals.finalBalance)) : '0.00'}</td>
                </tr>
            `;
        }

        htmlTable += `</tbody></table>`;

        const fullHtml = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
                <style>
                    * { direction: rtl; box-sizing: border-box; }
                    body { font-family: 'Cairo', sans-serif; padding: 10mm; color: #111; }
                    .header-top { border-bottom: 2px solid #000; padding-bottom: 5mm; margin-bottom: 5mm; display: flex; justify-content: space-between; }
                    .company-name { font-size: 16pt; font-weight: 900; }
                    .report-title { font-size: 18pt; font-weight: 900; text-align: center; margin: 5mm 0; }
                    .report-subtitle { font-size: 11pt; text-align: center; margin-bottom: 5mm; color: #444; }
                    table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; }
                    th, td { border: 1px solid #111; padding: 4px; text-align: right; }
                    th { font-weight: bold; background-color: #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="header-top">
                    <div style="text-align: right;">
                        <div class="company-name">${company.name || ''}</div>
                        ${company.taxNumber ? `<div>الرقم الضريبي: ${company.taxNumber}</div>` : ''}
                        ${company.commercialReg ? `<div>السجل التجاري: ${company.commercialReg}</div>` : ''}
                    </div>
                </div>
                <div class="report-title">${title}</div>
                <div class="report-subtitle">من تاريخ ${dateRange.fromDate} إلى تاريخ ${dateRange.toDate}</div>
                ${htmlTable}
            </body>
            </html>
        `;

        const blob = await generatePDF(fullHtml, `Client_Statement.pdf`, { landscape: true });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `كشف_حساب_عميل_${new Date().toISOString().slice(0, 10)}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("PDF Export Error:", err);
        alert("Failed to export PDF: " + err.message);
    }
}

/**
 * Export Supplier Statement (Account Statement) to Excel
 */
export function exportSupplierStatementToExcel(entries, totals, dateRange, t) {
    const rows = [];
    const title = t('reports.suppliers.supplier_general_ledger') || 'Supplier Statement';
    rows.push([title]);
    rows.push([t('reports.filters.from_date') || 'From Date', dateRange?.fromDate || '—']);
    rows.push([t('reports.filters.to_date') || 'To Date', dateRange?.toDate || '—']);
    rows.push([]);
    const headers = [
        t('reports.columns.date') || 'Date',
        t('reports.columns.type') || 'Type',
        t('reports.columns.document_number') || 'Document Number',
        t('reports.columns.description') || 'Description',
        t('reports.columns.debit') || 'Debit',
        t('reports.columns.credit') || 'Credit',
        t('reports.columns.balance') || 'Balance',
    ];
    rows.push(headers);
    const typeLabel = (type) => {
        if (type === 'invoice') return t('reports.suppliers.purchase_invoice') || 'Purchase Invoice';
        if (type === 'return') return t('reports.suppliers.purchase_return') || 'Purchase Return';
        return t('reports.payment') || 'Payment';
    };
    entries.forEach((entry) => {
        rows.push([
            formatCellDate(entry.date),
            typeLabel(entry.type),
            entry.documentNumber || '—',
            entry.description || '—',
            fmtNum(entry.debit),
            fmtNum(entry.credit),
            fmtNum(entry.balance),
        ]);
    });
    const effectiveTotals = totals || { totalDebit: 0, totalCredit: 0, finalBalance: 0 };
    rows.push([
        '',
        t('reports.totals') || 'Totals',
        '',
        '',
        fmtNum(effectiveTotals.totalDebit),
        fmtNum(effectiveTotals.totalCredit),
        fmtNum(effectiveTotals.finalBalance),
    ]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Supplier Statement');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `Supplier_Statement_${dateStr}.xlsx`);
}

/**
 * Export Supplier Statement (Account Statement) to PDF
 */
export async function exportSupplierStatementToPdf(accountsData, totals, dateRange, t) {
    try {
        const company = await fetchCompanyProfile();
        const title = t('reports.suppliers.supplier_general_ledger') || 'كشف حساب مورد';
        
        let htmlTable = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10pt;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th rowspan="2" style="border: 1px solid #222; padding: 6px;">قيد اليومية</th>
                        <th rowspan="2" style="border: 1px solid #222; padding: 6px;">التاريخ</th>
                        <th rowspan="2" style="border: 1px solid #222; padding: 6px;">المصدر</th>
                        <th rowspan="2" style="border: 1px solid #222; padding: 6px; min-width: 180px;">الوصف</th>
                        <th colspan="2" style="border: 1px solid #222; padding: 6px; text-align: center;">القيد</th>
                        <th colspan="2" style="border: 1px solid #222; padding: 6px; text-align: center;">الرصيد</th>
                    </tr>
                    <tr style="background: #f1f5f9;">
                        <th style="border: 1px solid #222; padding: 6px; text-align: center; width: 80px;">مدين</th>
                        <th style="border: 1px solid #222; padding: 6px; text-align: center; width: 80px;">دائن</th>
                        <th style="border: 1px solid #222; padding: 6px; text-align: center; width: 80px;">مدين</th>
                        <th style="border: 1px solid #222; padding: 6px; text-align: center; width: 80px;">دائن</th>
                    </tr>
                </thead>
                <tbody>
        `;

        accountsData.forEach(account => {
            // Account Section Header
            htmlTable += `
                <tr style="background: #e2e8f0; font-weight: bold;">
                    <td colspan="8" style="border: 1px solid #222; padding: 8px; text-align: center; background: #f8fafc;">
                        ${account.accountName} #${account.accountCode}
                    </td>
                </tr>
            `;

            // Previous Balance
            htmlTable += `
                <tr style="background: #fffbeb;">
                    <td style="border: 1px solid #222;"></td>
                    <td style="border: 1px solid #222;"></td>
                    <td style="border: 1px solid #222;"></td>
                    <td style="border: 1px solid #222; padding: 6px; font-weight: bold;">الرصيد السابق</td>
                    <td style="border: 1px solid #222;"></td>
                    <td style="border: 1px solid #222;"></td>
                    <td style="border: 1px solid #222; padding: 6px; text-align: center; font-weight: bold;">${account.openingBalance > 0 ? fmtNum(account.openingBalance) : '0.00'}</td>
                    <td style="border: 1px solid #222; padding: 6px; text-align: center; font-weight: bold;">${account.openingBalance < 0 ? fmtNum(Math.abs(account.openingBalance)) : '0.00'}</td>
                </tr>
            `;

            // Transaction Entries
            account.entries.forEach(entry => {
                htmlTable += `
                    <tr>
                        <td style="border: 1px solid #222; padding: 6px;">${entry.journalNumber || '--'}</td>
                        <td style="border: 1px solid #222; padding: 6px;">${fmtDate(entry.date)}</td>
                        <td style="border: 1px solid #222; padding: 6px;">${entry.source || '--'}</td>
                        <td style="border: 1px solid #222; padding: 6px;">${entry.description || '--'}</td>
                        <td style="border: 1px solid #222; padding: 6px; text-align: center;">${entry.debit > 0 ? fmtNum(entry.debit) : ''}</td>
                        <td style="border: 1px solid #222; padding: 6px; text-align: center;">${entry.credit > 0 ? fmtNum(entry.credit) : ''}</td>
                        <td style="border: 1px solid #222; padding: 6px; text-align: center; font-weight: bold;">${entry.balance > 0 ? fmtNum(entry.balance) : '0.00'}</td>
                        <td style="border: 1px solid #222; padding: 6px; text-align: center; font-weight: bold;">${entry.balance < 0 ? fmtNum(Math.abs(entry.balance)) : '0.00'}</td>
                    </tr>
                `;
            });

            // Account Footer / Totals
            htmlTable += `
                <tr style="background: #f8fafc; font-weight: bold;">
                    <td colspan="4" style="border: 1px solid #222; padding: 6px;">إجمالي الحساب</td>
                    <td style="border: 1px solid #222; padding: 6px; text-align: center;">${fmtNum(account.totalDebit)}</td>
                    <td style="border: 1px solid #222; padding: 6px; text-align: center;">${fmtNum(account.totalCredit)}</td>
                    <td style="border: 1px solid #222; padding: 6px; text-align: center;">${account.closingBalance > 0 ? fmtNum(account.closingBalance) : '0.00'}</td>
                    <td style="border: 1px solid #222; padding: 6px; text-align: center;">${account.closingBalance < 0 ? fmtNum(Math.abs(account.closingBalance)) : '0.00'}</td>
                </tr>
                <tr style="height: 10px;"><td colspan="8"></td></tr>
            `;
        });

        if (totals) {
            htmlTable += `
                <tr style="background: #eef2ff; font-weight: 900; font-size: 11pt;">
                    <td colspan="4" style="border: 1px solid #222; padding: 10px;">إجماليات الموردين</td>
                    <td style="border: 1px solid #222; padding: 10px; text-align: center;">${fmtNum(totals.totalDebit)}</td>
                    <td style="border: 1px solid #222; padding: 10px; text-align: center;">${fmtNum(totals.totalCredit)}</td>
                    <td style="border: 1px solid #222; padding: 10px; text-align: center;">${totals.finalBalance > 0 ? fmtNum(totals.finalBalance) : '0.00'}</td>
                    <td style="border: 1px solid #222; padding: 10px; text-align: center;">${totals.finalBalance < 0 ? fmtNum(Math.abs(totals.finalBalance)) : '0.00'}</td>
                </tr>
            `;
        }

        htmlTable += `</tbody></table>`;

        const fullHtml = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
                <style>
                    * { direction: rtl; box-sizing: border-box; }
                    body { font-family: 'Cairo', sans-serif; padding: 10mm; color: #111; }
                    .header-top { border-bottom: 2px solid #000; padding-bottom: 5mm; margin-bottom: 5mm; display: flex; justify-content: space-between; }
                    .company-name { font-size: 16pt; font-weight: 900; }
                    .report-title { font-size: 18pt; font-weight: 900; text-align: center; margin: 5mm 0; }
                    .report-subtitle { font-size: 11pt; text-align: center; margin-bottom: 5mm; color: #444; }
                    table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; }
                    th, td { border: 1px solid #111; padding: 4px; text-align: right; }
                    th { font-weight: bold; background-color: #f1f5f9; }
                </style>
            </head>
            <body>
                <div class="header-top">
                    <div style="text-align: right;">
                        <div class="company-name">${company.name || ''}</div>
                        ${company.taxNumber ? `<div>الرقم الضريبي: ${company.taxNumber}</div>` : ''}
                        ${company.commercialReg ? `<div>السجل التجاري: ${company.commercialReg}</div>` : ''}
                    </div>
                </div>
                <div class="report-title">${title}</div>
                <div class="report-subtitle">من تاريخ ${dateRange.fromDate} إلى تاريخ ${dateRange.toDate}</div>
                ${htmlTable}
            </body>
            </html>
        `;

        const blob = await generatePDF(fullHtml, `Supplier_Statement.pdf`, { landscape: true });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `كشف_حساب_مورد_${new Date().toISOString().slice(0, 10)}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("PDF Export Error:", err);
        alert("Failed to export PDF: " + err.message);
    }
}

/**
 * Build Supplier Statement (Account Statement) PDF
 */
export function buildSupplierStatementPdf(entries, totals, dateRange, t) {
    const doc = createArabicPdfDoc({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 18;
    doc.setR2L(true);
    const title = t('reports.suppliers.supplier_general_ledger') || 'Supplier Statement';
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(title, pageW - margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`${t('reports.filters.from_date') || 'From Date'}: ${dateRange?.fromDate || '—'}`, pageW - margin, y);
    y += 5;
    doc.text(`${t('reports.filters.to_date') || 'To Date'}: ${dateRange?.toDate || '—'}`, pageW - margin, y);
    y += 10;
    const colW = (pageW - 2 * margin) / 7;
    const headers = [
        t('reports.columns.date') || 'Date',
        t('reports.columns.type') || 'Type',
        t('reports.columns.document_number') || 'Doc No',
        t('reports.columns.description') || 'Description',
        t('reports.columns.debit') || 'Debit',
        t('reports.columns.credit') || 'Credit',
        t('reports.columns.balance') || 'Balance',
    ];
    const typeLabel = (type) => {
        if (type === 'invoice') return t('reports.suppliers.purchase_invoice') || 'Purchase Invoice';
        if (type === 'return') return t('reports.suppliers.purchase_return') || 'Purchase Return';
        return t('reports.payment') || 'Payment';
    };
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    headers.forEach((h, i) => {
        doc.text(String(h).substring(0, 12), pageW - margin - (i + 1) * colW + 2, y);
    });
    y += 6;
    doc.setFont(undefined, 'normal');
    entries.forEach((entry) => {
        if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage(pageW, doc.internal.pageSize.getHeight(), 'l');
            y = 18;
            doc.setR2L(true);
        }
        const row = [
            formatCellDate(entry.date),
            typeLabel(entry.type),
            String(entry.documentNumber || '—').substring(0, 14),
            String(entry.description || '—').substring(0, 18),
            fmtNum(entry.debit),
            fmtNum(entry.credit),
            fmtNum(entry.balance),
        ];
        row.forEach((cell, i) => {
            doc.text(String(cell).substring(0, 18), pageW - margin - (i + 1) * colW + 2, y);
        });
        y += 5;
    });
    const effectiveTotals = totals || { totalDebit: 0, totalCredit: 0, finalBalance: 0 };
    if (y > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage(pageW, doc.internal.pageSize.getHeight(), 'l');
        y = 18;
        doc.setR2L(true);
    }
    doc.setFont(undefined, 'bold');
    const totalRow = ['', t('reports.totals') || 'Totals', '', '', fmtNum(effectiveTotals.totalDebit), fmtNum(effectiveTotals.totalCredit), fmtNum(effectiveTotals.finalBalance)];
    totalRow.forEach((cell, i) => {
        doc.text(String(cell).substring(0, 18), pageW - margin - (i + 1) * colW + 2, y);
    });
    return doc.output('blob');
}

/**
 * Build Customer Summary PDF
 */
export function buildCustomerSummaryPdf(summaryData, dateRange, t) {
    const doc = createArabicPdfDoc({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 18;

    doc.setR2L(true);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(t('reports.customers.summary_report') || 'Customer Summary Report', pageW - margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`${t('reports.filters.from_date') || 'From Date'}: ${dateRange?.fromDate || '—'}`, pageW - margin, y);
    y += 5;
    doc.text(`${t('reports.filters.to_date') || 'To Date'}: ${dateRange?.toDate || '—'}`, pageW - margin, y);
    y += 10;

    if (summaryData) {
        doc.setFont(undefined, 'bold');
        doc.text(t('reports.customers.total_invoices') || 'Total Invoices', pageW - margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(fmtNum(summaryData.totalInvoices || 0), pageW - margin - 60, y);
        y += 7;

        doc.setFont(undefined, 'bold');
        doc.text(t('reports.customers.total_returns') || 'Total Returns', pageW - margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(fmtNum(summaryData.totalReturns || 0), pageW - margin - 60, y);
        y += 7;

        doc.setFont(undefined, 'bold');
        doc.text(t('reports.clients.total_payments_received') || 'Total Payments Received', pageW - margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(fmtNum(summaryData.totalPaymentsReceived || 0), pageW - margin - 60, y);
        y += 7;

        doc.setFont(undefined, 'bold');
        doc.text(t('reports.clients.total_outstanding') || 'Outstanding', pageW - margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(fmtNum(summaryData.totalOutstanding || 0), pageW - margin - 60, y);
    }

    return doc.output('blob');
}

/**
 * Build Customer Detailed PDF
 */
export function buildCustomerDetailedPdf(detailedData, dateRange, t) {
    const doc = createArabicPdfDoc({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 18;

    doc.setR2L(true);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(t('reports.customers.detailed_report') || 'Detailed Customer Report', pageW - margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`${t('reports.filters.from_date') || 'From Date'}: ${dateRange?.fromDate || '—'}`, pageW - margin, y);
    y += 5;
    doc.text(`${t('reports.filters.to_date') || 'To Date'}: ${dateRange?.toDate || '—'}`, pageW - margin, y);
    y += 10;

    if (detailedData.length === 0) {
        doc.text(t('reports.no_data') || 'No data available', pageW - margin, y);
        return doc.output('blob');
    }

    const colW = (pageW - 2 * margin) / 6;
    const headers = [
        t('reports.columns.customer_name') || 'Customer Name',
        t('reports.columns.code') || 'Code',
        t('reports.customers.total_invoices') || 'Total Invoices',
        t('reports.customers.total_returns') || 'Total Returns',
        t('reports.customers.total_paid') || 'Total Paid',
        t('reports.customers.outstanding') || 'Outstanding'
    ];

    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    headers.forEach((header, i) => {
        const x = pageW - margin - (i + 1) * colW + 2;
        doc.text(String(header).substring(0, 20), x, y);
    });
    y += 6;

    doc.setFont(undefined, 'normal');
    detailedData.forEach(row => {
        if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage('a4', 'l');
            y = 18;
            doc.setR2L(true);
        }
        const rowData = [
            row.customerName || '—',
            row.code || '—',
            fmtNum(row.totalInvoices || 0),
            fmtNum(row.totalReturns || 0),
            fmtNum(row.totalPaid || 0),
            fmtNum(row.outstanding || 0)
        ];
        rowData.forEach((cell, i) => {
            const x = pageW - margin - (i + 1) * colW + 2;
            doc.text(String(cell).substring(0, 22), x, y);
        });
        y += 5;
    });

    // Total row
    if (detailedData.length > 0) {
        if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage('a4', 'l');
            y = 18;
            doc.setR2L(true);
        }
        doc.setFont(undefined, 'bold');
        const totals = [
            t('reports.total') || 'Total',
            '',
            fmtNum(detailedData.reduce((sum, r) => sum + (r.totalInvoices || 0), 0)),
            fmtNum(detailedData.reduce((sum, r) => sum + (r.totalReturns || 0), 0)),
            fmtNum(detailedData.reduce((sum, r) => sum + (r.totalPaid || 0), 0)),
            fmtNum(detailedData.reduce((sum, r) => sum + (r.outstanding || 0), 0))
        ];
        totals.forEach((cell, i) => {
            const x = pageW - margin - (i + 1) * colW + 2;
            doc.text(String(cell).substring(0, 22), x, y);
        });
    }

    return doc.output('blob');
}

/**
 * Build Supplier Summary PDF
 */
export function buildSupplierSummaryPdf(summaryData, dateRange, t) {
    const doc = createArabicPdfDoc({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 18;

    doc.setR2L(true);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(t('reports.suppliers.summary_report') || 'Supplier Summary Report', pageW - margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`${t('reports.filters.from_date') || 'From Date'}: ${dateRange?.fromDate || '—'}`, pageW - margin, y);
    y += 5;
    doc.text(`${t('reports.filters.to_date') || 'To Date'}: ${dateRange?.toDate || '—'}`, pageW - margin, y);
    y += 10;

    if (summaryData) {
        doc.setFont(undefined, 'bold');
        doc.text(t('reports.suppliers.total_purchases') || 'Total Purchases', pageW - margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(fmtNum(summaryData.totalPurchases || 0), pageW - margin - 60, y);
        y += 7;

        doc.setFont(undefined, 'bold');
        doc.text(t('reports.suppliers.total_returns') || 'Total Returns', pageW - margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(fmtNum(summaryData.totalReturns || 0), pageW - margin - 60, y);
        y += 7;

        doc.setFont(undefined, 'bold');
        doc.text(t('reports.suppliers.total_payments_spent') || 'Total Payments Spent', pageW - margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(fmtNum(summaryData.totalPaymentsSpent || 0), pageW - margin - 60, y);
        y += 7;

        doc.setFont(undefined, 'bold');
        doc.text(t('reports.suppliers.total_outstanding') || 'Total Outstanding', pageW - margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(fmtNum(summaryData.totalOutstanding || 0), pageW - margin - 60, y);
    }

    return doc.output('blob');
}

/**
 * Build Supplier Detailed PDF
 */
export function buildSupplierDetailedPdf(detailedData, dateRange, t) {
    const doc = createArabicPdfDoc({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 18;

    doc.setR2L(true);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(t('reports.suppliers.detailed_report') || 'Detailed Supplier Report', pageW - margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`${t('reports.filters.from_date') || 'From Date'}: ${dateRange?.fromDate || '—'}`, pageW - margin, y);
    y += 5;
    doc.text(`${t('reports.filters.to_date') || 'To Date'}: ${dateRange?.toDate || '—'}`, pageW - margin, y);
    y += 10;

    if (detailedData.length === 0) {
        doc.text(t('reports.no_data') || 'No data available', pageW - margin, y);
        return doc.output('blob');
    }

    const colW = (pageW - 2 * margin) / 6;
    const headers = [
        t('reports.columns.supplier_name') || 'Supplier Name',
        t('reports.columns.code') || 'Code',
        t('reports.suppliers.total_purchases') || 'Total Purchases',
        t('reports.suppliers.total_returns') || 'Total Returns',
        t('reports.suppliers.total_paid') || 'Total Paid',
        t('reports.suppliers.outstanding') || 'Outstanding'
    ];

    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    headers.forEach((header, i) => {
        const x = pageW - margin - (i + 1) * colW + 2;
        doc.text(String(header).substring(0, 20), x, y);
    });
    y += 6;

    doc.setFont(undefined, 'normal');
    detailedData.forEach(row => {
        if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage('a4', 'l');
            y = 18;
            doc.setR2L(true);
        }
        const rowData = [
            row.supplierName || '—',
            row.code || '—',
            fmtNum(row.totalPurchases || 0),
            fmtNum(row.totalReturns || 0),
            fmtNum(row.totalPaid || 0),
            fmtNum(row.outstanding || 0)
        ];
        rowData.forEach((cell, i) => {
            const x = pageW - margin - (i + 1) * colW + 2;
            doc.text(String(cell).substring(0, 22), x, y);
        });
        y += 5;
    });

    // Total row
    if (detailedData.length > 0) {
        if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage('a4', 'l');
            y = 18;
            doc.setR2L(true);
        }
        doc.setFont(undefined, 'bold');
        const totals = [
            t('reports.total') || 'Total',
            '',
            fmtNum(detailedData.reduce((sum, r) => sum + (r.totalPurchases || 0), 0)),
            fmtNum(detailedData.reduce((sum, r) => sum + (r.totalReturns || 0), 0)),
            fmtNum(detailedData.reduce((sum, r) => sum + (r.totalPaid || 0), 0)),
            fmtNum(detailedData.reduce((sum, r) => sum + (r.outstanding || 0), 0))
        ];
        totals.forEach((cell, i) => {
            const x = pageW - margin - (i + 1) * colW + 2;
            doc.text(String(cell).substring(0, 22), x, y);
        });
    }

    return doc.output('blob');
}

/**
 * Build Inventory Value PDF
 */
export function buildInventoryValuePdf(summaryData, filters, t) {
    const doc = createArabicPdfDoc({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 18;

    doc.setR2L(true);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(t('reports.inventory.inventory_value_report.report_title_dynamic') || 'Inventory Value Report', pageW - margin, y);
    y += 10;

    if (summaryData.length === 0) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(t('reports.no_data') || 'No data available', pageW - margin, y);
        return doc.output('blob');
    }

    const colW = (pageW - 2 * margin) / 8;
    const headers = [
        t('reports.inventory.inventory_value_report.name') || 'Name',
        t('reports.inventory.inventory_value_report.code') || 'Code',
        t('reports.inventory.inventory_value_report.quantity') || 'Quantity',
        t('reports.inventory.inventory_value_report.average_cost') || 'Average Cost',
        t('reports.inventory.inventory_value_report.value') || 'Value',
        t('reports.inventory.inventory_value_report.sale_price_without_taxes') || 'Sale Price',
        t('reports.inventory.inventory_value_report.sale_value') || 'Sale Value',
        t('reports.inventory.inventory_value_report.sale_profit') || 'Sale Profit'
    ];

    doc.setFont(undefined, 'bold');
    doc.setFontSize(7);
    headers.forEach((header, i) => {
        const x = pageW - margin - (i + 1) * colW + 2;
        doc.text(String(header).substring(0, 15), x, y);
    });
    y += 6;

    doc.setFont(undefined, 'normal');
    summaryData.forEach(row => {
        if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage('a4', 'l');
            y = 18;
            doc.setR2L(true);
        }
        const rowData = [
            row.productName || '—',
            row.code || '—',
            fmtNum(row.quantity),
            fmtNum(row.unitCost),
            fmtNum(row.inventoryValue),
            fmtNum(row.sellingPrice),
            fmtNum(row.potentialSalesValue),
            fmtNum(row.potentialProfit)
        ];
        rowData.forEach((cell, i) => {
            const x = pageW - margin - (i + 1) * colW + 2;
            doc.text(String(cell), x, y);
        });
        y += 5;
    });

    // Total row
    if (summaryData.length > 0) {
        if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage('a4', 'l');
            y = 18;
            doc.setR2L(true);
        }
        const totalValue = summaryData.reduce((sum, item) => sum + (item.inventoryValue || 0), 0);
        const totalSalesValue = summaryData.reduce((sum, item) => sum + (item.potentialSalesValue || 0), 0);
        const totalProfit = summaryData.reduce((sum, item) => sum + (item.potentialProfit || 0), 0);

        doc.setFont(undefined, 'bold');
        doc.text(t('reports.total') || 'Total', pageW - margin - colW + 2, y);
        doc.text(fmtNum(totalValue), pageW - margin - 5 * colW + 2, y);
        doc.text(fmtNum(totalSalesValue), pageW - margin - 7 * colW + 2, y);
        doc.text(fmtNum(totalProfit), pageW - margin - 8 * colW + 2, y);
    }

    return doc.output('blob');
}

/**
 * Build Inventory Movements Detailed PDF
 */
export function buildInventoryMovementsPdf(movementsData, dateRange, t) {
    const doc = createArabicPdfDoc({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 18;

    doc.setR2L(true);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(t('reports.inventory.inventory_movements_detailed') || 'Inventory Movements Detailed Report', pageW - margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`${t('reports.filters.from_date') || 'From Date'}: ${dateRange?.fromDate || '—'}`, pageW - margin, y);
    y += 5;
    doc.text(`${t('reports.filters.to_date') || 'To Date'}: ${dateRange?.toDate || '—'}`, pageW - margin, y);
    y += 10;

    if (movementsData.length === 0) {
        doc.text(t('reports.no_data') || 'No data available', pageW - margin, y);
        return doc.output('blob');
    }

    const colW = (pageW - 2 * margin) / 7;
    const headers = [
        t('reports.inventory.inventory_value_detailed_report.stock_transaction') || 'Stock Transaction',
        t('reports.inventory.inventory_value_detailed_report.source') || 'Source',
        t('reports.inventory.inventory_value_detailed_report.date') || 'Date',
        t('reports.inventory.inventory_value_detailed_report.quantity') || 'Quantity',
        t('reports.inventory.inventory_value_detailed_report.quantity_after') || 'Quantity After',
        t('reports.inventory.inventory_value_detailed_report.value') || 'Value (EGP)',
        t('reports.inventory.inventory_value_detailed_report.value_correction') || 'Value Correction (EGP)'
    ];

    doc.setFont(undefined, 'bold');
    doc.setFontSize(7);
    headers.forEach((header, i) => {
        const x = pageW - margin - (i + 1) * colW + 2;
        doc.text(String(header).substring(0, 18), x, y);
    });
    y += 6;

    // Group by product
    const groupedByProduct = {};
    movementsData.forEach(movement => {
        const key = movement.productCode || movement.productName || 'unknown';
        if (!groupedByProduct[key]) {
            groupedByProduct[key] = {
                productName: movement.productName || '—',
                productCode: movement.productCode || '—',
                movements: []
            };
        }
        groupedByProduct[key].movements.push(movement);
    });

    doc.setFont(undefined, 'normal');
    Object.entries(groupedByProduct).forEach(([key, group]) => {
        if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage('a4', 'l');
            y = 18;
            doc.setR2L(true);
        }
        doc.setFont(undefined, 'bold');
        doc.text(`${group.productName} ${group.productCode}`, pageW - margin, y);
        y += 5;
        doc.setFont(undefined, 'normal');

        group.movements.forEach(movement => {
            if (y > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage('a4', 'l');
                y = 18;
                doc.setR2L(true);
            }
            const rowData = [
                movement.type || '—',
                movement.documentNumber || '—',
                formatCellDate(movement.date),
                fmtNum(movement.quantity),
                fmtNum(movement.quantityAfter),
                fmtNum(movement.value),
                fmtNum(movement.valueCorrection)
            ];
            rowData.forEach((cell, i) => {
                const x = pageW - margin - (i + 1) * colW + 2;
                doc.text(String(cell).substring(0, 18), x, y);
            });
            y += 5;
        });
    });

    return doc.output('blob');
}
