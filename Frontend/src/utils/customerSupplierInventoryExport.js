import * as XLSX from 'xlsx';
import { buildReportHtml, fetchCompanyProfile, generatePDF } from './generatePDF';
import { exportToExcel } from './excelHelpers';

const fmtNum = (n) => (n == null || n === '' || n === undefined) ? '' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
const formatCellDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

const downloadPdfBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        link.remove();
    }, 500);
};

/**
 * Export Customer Summary Report to Excel
 */
export async function exportCustomerSummaryToExcel(summaryData, dateRange, t) {
    const company = await fetchCompanyProfile();
    const rows = [];
    rows.push([t('reports.customers.total_invoices') || 'Total Invoices', fmtNum(summaryData?.totalInvoices || 0)]);
    rows.push([t('reports.customers.total_returns') || 'Total Returns', fmtNum(summaryData?.totalReturns || 0)]);
    rows.push([t('reports.clients.total_payments_received') || 'Total Payments Received', fmtNum(summaryData?.totalPaymentsReceived || 0)]);
    rows.push([t('reports.clients.total_outstanding') || 'Outstanding', fmtNum(summaryData?.totalOutstanding || 0)]);

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    exportToExcel({
        data: rows,
        filename: `Customer_Summary_${dateStr}.xlsx`,
        title: t('reports.customers.summary_report') || 'Customer Summary Report',
        company,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
        t
    });
}

/**
 * Export Customer Detailed Report to Excel
 */
export async function exportCustomerDetailedToExcel(detailedData, dateRange, t) {
    const company = await fetchCompanyProfile();
    const rows = [];
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

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    exportToExcel({
        data: rows,
        filename: `Customer_Detailed_${dateStr}.xlsx`,
        title: t('reports.customers.detailed_report') || 'Detailed Customer Report',
        company,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
        t
    });
}

/**
 * Export Supplier Summary Report to Excel
 */
export async function exportSupplierSummaryToExcel(summaryData, dateRange, t) {
    const company = await fetchCompanyProfile();
    const rows = [];
    rows.push([t('reports.suppliers.total_purchases') || 'Total Purchases', fmtNum(summaryData?.totalPurchases || 0)]);
    rows.push([t('reports.suppliers.total_returns') || 'Total Returns', fmtNum(summaryData?.totalReturns || 0)]);
    rows.push([t('reports.suppliers.total_payments_spent') || 'Total Payments Spent', fmtNum(summaryData?.totalPaymentsSpent || 0)]);
    rows.push([t('reports.suppliers.total_outstanding') || 'Total Outstanding', fmtNum(summaryData?.totalOutstanding || 0)]);

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    exportToExcel({
        data: rows,
        filename: `Supplier_Summary_${dateStr}.xlsx`,
        title: t('reports.suppliers.summary_report') || 'Supplier Summary Report',
        company,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
        t
    });
}

/**
 * Export Supplier Detailed Report to Excel
 */
export async function exportSupplierDetailedToExcel(detailedData, dateRange, t) {
    const company = await fetchCompanyProfile();
    const rows = [];
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

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    exportToExcel({
        data: rows,
        filename: `Supplier_Detailed_${dateStr}.xlsx`,
        title: t('reports.suppliers.detailed_report') || 'Detailed Supplier Report',
        company,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
        t
    });
}

/**
 * Export Inventory Value Report to Excel
 */
export async function exportInventoryValueToExcel(summaryData, filters, t) {
    const company = await fetchCompanyProfile();
    const rows = [];
    // Header row
    rows.push([
        'اسم المنتج',
        'الكود',
        'الكمية',
        'متوسط التكلفة',
        'القيمة',
        'سعر البيع بدون ضرائب',
        'قيمة البيع',
        'ربح البيع'
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
            'الإجمالي',
            '',
            '',
            '',
            fmtNum(totalValue),
            '',
            fmtNum(totalSalesValue),
            fmtNum(totalProfit)
        ]);
    }

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    exportToExcel({
        data: rows,
        filename: `Inventory_Value_${dateStr}.xlsx`,
        title: 'تقرير قيمة المخزون',
        company,
        startDate: filters?.fromDate,
        endDate: filters?.toDate,
        branch: filters?.branch,
        t
    });
}

/**
 * Export Inventory Movements Detailed Report to Excel
 */
export async function exportInventoryMovementsToExcel(movementsData, dateRange, t) {
    const company = await fetchCompanyProfile();
    const rows = [];
    // Header row
    rows.push([
        'حركة المخزون',
        'المصدر',
        'التاريخ',
        'الكمية',
        'الكمية بعد',
        'القيمة (ج.م)',
        'تسوية القيمة (ج.م)'
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

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    exportToExcel({
        data: rows,
        filename: `Inventory_Movements_${dateStr}.xlsx`,
        title: 'تقرير قيمة المخزون المفصل',
        company,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
        branch: dateRange?.branch,
        t
    });
}

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
    const filename = `${String(title || 'report').replace(/\s+/g, '_')}.pdf`;
    const blob = await generatePDF(html, filename, { landscape });
    downloadPdfBlob(blob, filename);
    return blob;
};

/**
 * Export Client Statement (Account Statement) to Excel
 * Same columns as UI: Date, Type, Document Number, Description, Debit, Credit, Balance + totals row
 */
export async function exportClientStatementToExcel(accountsData, totals, dateRange, t) {
    const company = await fetchCompanyProfile();
    const rows = [];

    accountsData.forEach((account) => {
        // Account header
        rows.push([`${account.accountName} #${account.accountCode}`]);

        // Table Headers
        rows.push([
            t('reports.columns.journal_entry') || 'قيد اليومية',
            t('reports.columns.date') || 'التاريخ',
            t('reports.columns.source') || 'المصدر',
            t('reports.columns.description') || 'الوصف',
            t('reports.columns.debit') || 'مدين',
            t('reports.columns.credit') || 'دائن',
            t('reports.columns.balance') || 'الرصيد',
        ]);

        // Opening Balance
        rows.push(['', '', '', 'الرصيد الافتتاحي', '', '', fmtNum(account.openingBalance)]);

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
        rows.push(['', '', 'إجمالي الحساب', '', fmtNum(account.totalDebit), fmtNum(account.totalCredit), fmtNum(account.closingBalance)]);
        rows.push([]); // Spacer
    });

    if (totals) {
        rows.push(['إجمالي العملاء', '', '', '', fmtNum(totals.totalDebit), fmtNum(totals.totalCredit), fmtNum(totals.finalBalance)]);
    }

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    exportToExcel({
        data: rows,
        filename: `Customer_Statement_${dateStr}.xlsx`,
        title: t('reports.clients.client_general_ledger') || 'كشف حساب عميل',
        company,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
        branch: dateRange?.branch,
        t
    });
}

/**
 * Build Client Statement (Account Statement) PDF - same layout as UI
 */
export async function exportClientStatementToPdf(accountsData, totals, dateRange, t) {
    const company = await fetchCompanyProfile();
    const headers = [
        'قيد اليومية',
        'التاريخ',
        'المصدر',
        'الوصف',
        'مدين',
        'دائن',
        'الرصيد',
    ];

    const rows = [];
    accountsData.forEach(account => {
        rows.push([{ content: `${account.accountName} #${account.accountCode}`, colSpan: 7, styles: { background: '#f8fafc', fontWeight: 'bold' } }]);
        rows.push(['', '', '', 'الرصيد الافتتاحي', '', '', fmtNum(account.openingBalance)]);
        account.entries.forEach(entry => {
            rows.push([
                entry.journalNumber || '--',
                fmtDate(entry.date),
                entry.source || '--',
                entry.description || '--',
                entry.debit > 0 ? fmtNum(entry.debit) : '',
                entry.credit > 0 ? fmtNum(entry.credit) : '',
                fmtNum(entry.balance)
            ]);
        });
        rows.push(['', '', 'إجمالي الحساب', '', fmtNum(account.totalDebit), fmtNum(account.totalCredit), fmtNum(account.closingBalance)]);
    });

    if (totals) {
        rows.push([{ content: 'إجماليات العملاء', colSpan: 4, styles: { fontWeight: 'bold' } }, fmtNum(totals.totalDebit), fmtNum(totals.totalCredit), fmtNum(totals.finalBalance)]);
    }

    const html = buildReportHtml({
        title: t('reports.clients.client_general_ledger') || 'كشف حساب عميل',
        company,
        headers,
        rows,
        landscape: true,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
    });
    const filename = `Client_Statement_${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = await generatePDF(html, filename, { landscape: true });
    downloadPdfBlob(blob, filename);
    return blob;
}

/**
 * Export Supplier Statement (Account Statement) to Excel
 */
export async function exportSupplierStatementToExcel(entries, totals, dateRange, t) {
    const company = await fetchCompanyProfile();
    const rows = [];
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

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    exportToExcel({
        data: rows,
        filename: `Supplier_Statement_${dateStr}.xlsx`,
        title: t('reports.suppliers.supplier_general_ledger') || 'Supplier Statement',
        company,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
        branch: dateRange?.branch,
        t
    });
}

/**
 * Export Supplier Statement (Account Statement) to PDF
 */
export async function exportSupplierStatementToPdf(accountsData, totals, dateRange, t) {
    const company = await fetchCompanyProfile();
    const headers = [
        'قيد اليومية',
        'التاريخ',
        'المصدر',
        'الوصف',
        'مدين',
        'دائن',
        'الرصيد',
    ];

    const rows = [];
    accountsData.forEach(account => {
        rows.push([{ content: `${account.accountName} #${account.accountCode}`, colSpan: 7, styles: { background: '#f8fafc', fontWeight: 'bold' } }]);
        rows.push(['', '', '', 'الرصيد الافتتاحي', '', '', fmtNum(account.openingBalance)]);
        account.entries.forEach(entry => {
            rows.push([
                entry.journalNumber || '--',
                fmtDate(entry.date),
                entry.source || '--',
                entry.description || '--',
                entry.debit > 0 ? fmtNum(entry.debit) : '',
                entry.credit > 0 ? fmtNum(entry.credit) : '',
                fmtNum(entry.balance)
            ]);
        });
        rows.push(['', '', 'إجمالي الحساب', '', fmtNum(account.totalDebit), fmtNum(account.totalCredit), fmtNum(account.closingBalance)]);
    });

    if (totals) {
        rows.push([{ content: 'إجماليات الموردين', colSpan: 4, styles: { fontWeight: 'bold' } }, fmtNum(totals.totalDebit), fmtNum(totals.totalCredit), fmtNum(totals.finalBalance)]);
    }

    const html = buildReportHtml({
        title: t('reports.suppliers.supplier_general_ledger') || 'كشف حساب مورد',
        company,
        headers,
        rows,
        landscape: true,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
    });
    const filename = `Supplier_Statement_${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = await generatePDF(html, filename, { landscape: true });
    downloadPdfBlob(blob, filename);
    return blob;
}

/**
 * Build Supplier Statement PDF
 */
export async function buildSupplierStatementPdf(entries, totals, dateRange, t) {
    return exportSupplierStatementToPdf([{ entries, accountName: '', accountCode: '', totalDebit: totals?.totalDebit || 0, totalCredit: totals?.totalCredit || 0, closingBalance: totals?.finalBalance || 0, openingBalance: 0 }], totals, dateRange, t);
}

/**
 * Build Customer Summary PDF
 */
export async function buildCustomerSummaryPdf(summaryData, dateRange, t) {
    const company = await fetchCompanyProfile();
    const rows = [
        [t('reports.customers.total_invoices') || 'Total Invoices', fmtNum(summaryData?.totalInvoices || 0)],
        [t('reports.customers.total_returns') || 'Total Returns', fmtNum(summaryData?.totalReturns || 0)],
        [t('reports.clients.total_payments_received') || 'Total Payments Received', fmtNum(summaryData?.totalPaymentsReceived || 0)],
        [t('reports.clients.total_outstanding') || 'Outstanding', fmtNum(summaryData?.totalOutstanding || 0)],
    ];
    const html = buildReportHtml({
        title: t('reports.customers.summary_report') || 'Customer Summary Report',
        company,
        headers: ['', ''],
        rows,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
    });
    const filename = `Customer_Summary_${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = await generatePDF(html, filename, {});
    downloadPdfBlob(blob, filename);
    return blob;
}

/**
 * Build Customer Detailed PDF
 */
export async function buildCustomerDetailedPdf(detailedData, dateRange, t) {
    const company = await fetchCompanyProfile();
    const headers = [
        t('reports.columns.customer_name') || 'Customer Name',
        t('reports.columns.code') || 'Code',
        t('reports.customers.total_invoices') || 'Total Invoices',
        t('reports.customers.total_returns') || 'Total Returns',
        t('reports.customers.total_paid') || 'Total Paid',
        t('reports.customers.outstanding') || 'Outstanding'
    ];
    const rows = detailedData.map(row => [
        row.customerName || '—',
        row.code || '—',
        fmtNum(row.totalInvoices || 0),
        fmtNum(row.totalReturns || 0),
        fmtNum(row.totalPaid || 0),
        fmtNum(row.outstanding || 0)
    ]);
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
    const html = buildReportHtml({
        title: t('reports.customers.detailed_report') || 'Detailed Customer Report',
        company,
        headers,
        rows,
        landscape: true,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
    });
    const filename = `Customer_Detailed_${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = await generatePDF(html, filename, { landscape: true });
    downloadPdfBlob(blob, filename);
    return blob;
}

/**
 * Build Supplier Summary PDF
 */
export async function buildSupplierSummaryPdf(summaryData, dateRange, t) {
    const company = await fetchCompanyProfile();
    const rows = [
        [t('reports.suppliers.total_purchases') || 'Total Purchases', fmtNum(summaryData?.totalPurchases || 0)],
        [t('reports.suppliers.total_returns') || 'Total Returns', fmtNum(summaryData?.totalReturns || 0)],
        [t('reports.suppliers.total_payments_spent') || 'Total Payments Spent', fmtNum(summaryData?.totalPaymentsSpent || 0)],
        [t('reports.suppliers.total_outstanding') || 'Total Outstanding', fmtNum(summaryData?.totalOutstanding || 0)],
    ];
    const html = buildReportHtml({
        title: t('reports.suppliers.summary_report') || 'Supplier Summary Report',
        company,
        headers: ['', ''],
        rows,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
    });
    const filename = `Supplier_Summary_${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = await generatePDF(html, filename, {});
    downloadPdfBlob(blob, filename);
    return blob;
}

/**
 * Build Supplier Detailed PDF
 */
export async function buildSupplierDetailedPdf(detailedData, dateRange, t) {
    const company = await fetchCompanyProfile();
    const headers = [
        t('reports.columns.supplier_name') || 'Supplier Name',
        t('reports.columns.code') || 'Code',
        t('reports.suppliers.total_purchases') || 'Total Purchases',
        t('reports.suppliers.total_returns') || 'Total Returns',
        t('reports.suppliers.total_paid') || 'Total Paid',
        t('reports.suppliers.outstanding') || 'Outstanding'
    ];
    const rows = detailedData.map(row => [
        row.supplierName || '—',
        row.code || '—',
        fmtNum(row.totalPurchases || 0),
        fmtNum(row.totalReturns || 0),
        fmtNum(row.totalPaid || 0),
        fmtNum(row.outstanding || 0)
    ]);
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
    const html = buildReportHtml({
        title: t('reports.suppliers.detailed_report') || 'Detailed Supplier Report',
        company,
        headers,
        rows,
        landscape: true,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
    });
    const filename = `Supplier_Detailed_${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = await generatePDF(html, filename, { landscape: true });
    downloadPdfBlob(blob, filename);
    return blob;
}

/**
 * Build Inventory Value PDF
 */
export async function buildInventoryValuePdf(summaryData, filters, t) {
    const company = await fetchCompanyProfile();
    const headers = [
        'اسم المنتج',
        'الكود',
        'الكمية',
        'متوسط التكلفة',
        'القيمة',
        'سعر البيع بدون ضرائب',
        'قيمة البيع',
        'ربح البيع'
    ];
    const rows = summaryData.map(row => [
        row.productName || '—',
        row.code || '—',
        fmtNum(row.quantity),
        fmtNum(row.unitCost),
        fmtNum(row.inventoryValue),
        fmtNum(row.sellingPrice),
        fmtNum(row.potentialSalesValue),
        fmtNum(row.potentialProfit)
    ]);
    if (summaryData.length > 0) {
        const totalValue = summaryData.reduce((sum, item) => sum + (item.inventoryValue || 0), 0);
        const totalSalesValue = summaryData.reduce((sum, item) => sum + (item.potentialSalesValue || 0), 0);
        const totalProfit = summaryData.reduce((sum, item) => sum + (item.potentialProfit || 0), 0);
        rows.push([
            'الإجمالي',
            '',
            '',
            '',
            fmtNum(totalValue),
            '',
            fmtNum(totalSalesValue),
            fmtNum(totalProfit)
        ]);
    }
    const html = buildReportHtml({
        title: 'تقرير قيمة المخزون',
        company,
        headers,
        rows,
        landscape: true,
        startDate: filters?.fromDate,
        endDate: filters?.toDate,
        branch: filters?.branch,
    });
    const filename = `Inventory_Value_${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = await generatePDF(html, filename, { landscape: true });
    downloadPdfBlob(blob, filename);
    return blob;
}

/**
 * Build Inventory Movements Detailed PDF
 */
export async function buildInventoryMovementsPdf(movementsData, dateRange, t) {
    const company = await fetchCompanyProfile();
    const headers = [
        'حركة المخزون',
        'المصدر',
        'التاريخ',
        'الكمية',
        'الكمية بعد',
        'القيمة (ج.م)',
        'تسوية القيمة (ج.م)'
    ];

    const rows = [];
    const groupedByProduct = {};
    movementsData.forEach(movement => {
        const key = movement.productCode || movement.productName || 'unknown';
        if (!groupedByProduct[key]) {
            groupedByProduct[key] = { productName: movement.productName, productCode: movement.productCode, movements: [] };
        }
        groupedByProduct[key].movements.push(movement);
    });

    Object.values(groupedByProduct).forEach(group => {
        rows.push([{ content: `${group.productName} ${group.productCode}`, colSpan: 7, styles: { background: '#f8fafc', fontWeight: 'bold' } }]);
        group.movements.forEach(movement => {
            rows.push([
                movement.type || '—',
                movement.documentNumber || '—',
                fmtDate(movement.date),
                fmtNum(movement.quantity),
                fmtNum(movement.quantityAfter),
                fmtNum(movement.value),
                fmtNum(movement.valueCorrection)
            ]);
        });
    });

    const html = buildReportHtml({
        title: 'تقرير قيمة المخزون المفصل',
        company,
        headers,
        rows,
        landscape: true,
        startDate: dateRange?.fromDate,
        endDate: dateRange?.toDate,
        branch: dateRange?.branch,
    });
    const filename = `Inventory_Movements_${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = await generatePDF(html, filename, { landscape: true });
    downloadPdfBlob(blob, filename);
    return blob;
}
