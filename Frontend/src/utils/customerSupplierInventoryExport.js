import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

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
        t('reports.customers.total_paid') || 'Total Paid',
        fmtNum(summaryData?.totalPaid || 0)
    ]);
    rows.push([
        t('reports.customers.outstanding') || 'Outstanding',
        fmtNum(summaryData?.outstanding || 0)
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
        const saleValue = (row.quantity || 0) * (row.sellingPrice || 0);
        const saleProfit = saleValue - (row.value || 0);
        rows.push([
            row.productName || '—',
            row.code || '—',
            row.quantity || 0,
            fmtNum(row.unitPrice || 0),
            fmtNum(row.value || 0),
            fmtNum(row.sellingPrice || 0),
            fmtNum(saleValue),
            fmtNum(saleProfit)
        ]);
    });
    
    // Total row
    if (summaryData.length > 0) {
        const totalValue = summaryData.reduce((sum, item) => sum + (item.value || 0), 0);
        rows.push([
            t('reports.total') || 'Total',
            '',
            '',
            '',
            fmtNum(totalValue),
            '',
            '',
            ''
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
                movement.type === 'in' ? (t('reports.inventory.incoming') || 'Incoming') : (t('reports.inventory.outgoing') || 'Outgoing'),
                movement.documentNumber || '—',
                formatCellDate(movement.date),
                movement.quantity || 0,
                '—',
                '—',
                '—'
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

/**
 * Export Client Statement (Account Statement) to Excel
 * Same columns as UI: Date, Type, Document Number, Description, Debit, Credit, Balance + totals row
 */
export function exportClientStatementToExcel(entries, totals, dateRange, t) {
    const rows = [];
    const title = t('reports.clients.client_general_ledger') || 'Customer Statement';
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
        if (type === 'invoice') return t('reports.invoice') || 'Invoice';
        if (type === 'return') return t('reports.return') || 'Return';
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
    if (entries.length > 0 && totals) {
        rows.push([
            '',
            t('reports.totals') || 'Totals',
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
export function buildClientStatementPdf(entries, totals, dateRange, t) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 18;
    doc.setR2L(true);
    const title = t('reports.clients.client_general_ledger') || 'Customer Statement';
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
        if (type === 'invoice') return t('reports.invoice') || 'Invoice';
        if (type === 'return') return t('reports.return') || 'Return';
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
    if (entries.length > 0 && totals) {
        if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage(pageW, doc.internal.pageSize.getHeight(), 'l');
            y = 18;
            doc.setR2L(true);
        }
        doc.setFont(undefined, 'bold');
        const totalRow = ['', t('reports.totals') || 'Totals', '', '', fmtNum(totals.totalDebit), fmtNum(totals.totalCredit), fmtNum(totals.finalBalance)];
        totalRow.forEach((cell, i) => {
            doc.text(String(cell).substring(0, 18), pageW - margin - (i + 1) * colW + 2, y);
        });
    }
    return doc.output('blob');
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
 * Build Supplier Statement (Account Statement) PDF
 */
export function buildSupplierStatementPdf(entries, totals, dateRange, t) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
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
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
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
        doc.text(t('reports.customers.total_paid') || 'Total Paid', pageW - margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(fmtNum(summaryData.totalPaid || 0), pageW - margin - 60, y);
        y += 7;
        
        doc.setFont(undefined, 'bold');
        doc.text(t('reports.customers.outstanding') || 'Outstanding', pageW - margin, y);
        doc.setFont(undefined, 'normal');
        doc.text(fmtNum(summaryData.outstanding || 0), pageW - margin - 60, y);
    }
    
    return doc.output('blob');
}

/**
 * Build Customer Detailed PDF
 */
export function buildCustomerDetailedPdf(detailedData, dateRange, t) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
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
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
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
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
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
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
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
        const saleValue = (row.quantity || 0) * (row.sellingPrice || 0);
        const saleProfit = saleValue - (row.value || 0);
        const rowData = [
            row.productName || '—',
            row.code || '—',
            String(row.quantity || 0),
            fmtNum(row.unitPrice || 0),
            fmtNum(row.value || 0),
            fmtNum(row.sellingPrice || 0),
            fmtNum(saleValue),
            fmtNum(saleProfit)
        ];
        rowData.forEach((cell, i) => {
            const x = pageW - margin - (i + 1) * colW + 2;
            doc.text(String(cell).substring(0, 18), x, y);
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
        doc.setFont(undefined, 'bold');
        const totalValue = summaryData.reduce((sum, item) => sum + (item.value || 0), 0);
        const totals = [
            t('reports.total') || 'Total',
            '',
            '',
            '',
            fmtNum(totalValue),
            '',
            '',
            ''
        ];
        totals.forEach((cell, i) => {
            const x = pageW - margin - (i + 1) * colW + 2;
            doc.text(String(cell).substring(0, 18), x, y);
        });
    }
    
    return doc.output('blob');
}

/**
 * Build Inventory Movements Detailed PDF
 */
export function buildInventoryMovementsPdf(movementsData, dateRange, t) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
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
                movement.type === 'in' ? (t('reports.inventory.incoming') || 'Incoming') : (t('reports.inventory.outgoing') || 'Outgoing'),
                movement.documentNumber || '—',
                formatCellDate(movement.date),
                String(movement.quantity || 0),
                '—',
                '—',
                '—'
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
