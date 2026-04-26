import * as XLSX from 'xlsx';
import { buildReportHtml, fetchCompanyProfile, generatePDF } from './generatePDF';
import { exportToExcel } from './excelHelpers';

const fmtNum = (n) => (n == null || n === '') ? '' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

/**
 * Build table rows (including month subtotals and grand total) from detailedData for export.
 * @param {Array} detailedData - same as table state
 * @param {Array} tableColumns - { key, label }
 * @param {Function} t - i18n
 * @returns {Array<Array>} [headerRow, ...dataRows, ...subtotalRows, totalRow]
 */
export function buildExportRows(detailedData, tableColumns, t) {
    const headerRow = tableColumns.map((col) => col.label);
    const rows = [headerRow];

    if (!detailedData.length) return rows;

    const byMonth = {};
    detailedData.forEach((row) => {
        const m = row.month ?? '—';
        if (!byMonth[m]) byMonth[m] = [];
        byMonth[m].push(row);
    });
    const months = Object.keys(byMonth).sort();

    const totalPaid = detailedData.reduce((acc, r) => acc + Number(r.paidAmount ?? 0), 0);
    const totalRemaining = detailedData.reduce((acc, r) => acc + Number(r.remainingAmount ?? 0), 0);
    const totalDiscounts = detailedData.reduce((acc, r) => acc + Number(r.discounts ?? 0), 0);
    const totalWithoutTax = detailedData.reduce((acc, r) => acc + Number(r.totalWithoutTax ?? 0), 0);
    const totalAmount = detailedData.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);

    months.forEach((month) => {
        const monthRows = byMonth[month];
        monthRows.forEach((row) => {
            const r = tableColumns.map((col) => {
                if (col.key === 'code') return row.invoiceNumber ?? '—';
                if (col.key === 'month') return row.month ?? '—';
                if (col.key === 'type') return t('reports.detailed_columns.type_invoice');
                if (col.key === 'issue_date') return fmtDate(row.date);
                if (col.key === 'client') return row.client ?? '—';
                if (col.key === 'paid_amount') return fmtNum(row.paidAmount);
                if (col.key === 'remaining_amount') return fmtNum(row.remainingAmount);
                if (col.key === 'discounts') return fmtNum(row.discounts);
                if (col.key === 'total_without_taxes') return fmtNum(row.totalWithoutTax);
                if (col.key === 'total') return fmtNum(row.amount);
                return '—';
            });
            rows.push(r);
        });
        const monthPaid = monthRows.reduce((acc, r) => acc + Number(r.paidAmount ?? 0), 0);
        const monthRemaining = monthRows.reduce((acc, r) => acc + Number(r.remainingAmount ?? 0), 0);
        const monthDiscounts = monthRows.reduce((acc, r) => acc + Number(r.discounts ?? 0), 0);
        const monthWithoutTax = monthRows.reduce((acc, r) => acc + Number(r.totalWithoutTax ?? 0), 0);
        const monthAmount = monthRows.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
        const subtotalRow = tableColumns.map((col) => {
            if (col.key === 'code') return `${t('reports.filters.month') || '\u0627\u0644\u0634\u0647\u0631'}: ${month}`;
            if (col.key === 'paid_amount') return fmtNum(monthPaid);
            if (col.key === 'remaining_amount') return fmtNum(monthRemaining);
            if (col.key === 'discounts') return fmtNum(monthDiscounts);
            if (col.key === 'total_without_taxes') return fmtNum(monthWithoutTax);
            if (col.key === 'total') return fmtNum(monthAmount);
            return '';
        });
        rows.push(subtotalRow);
    });

    const grandTotalRow = tableColumns.map((col) => {
        if (col.key === 'code') return t('reports.detailed_columns.total') || '\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a';
        if (col.key === 'paid_amount') return fmtNum(totalPaid);
        if (col.key === 'remaining_amount') return fmtNum(totalRemaining);
        if (col.key === 'discounts') return fmtNum(totalDiscounts);
        if (col.key === 'total_without_taxes') return fmtNum(totalWithoutTax);
        if (col.key === 'total') return fmtNum(totalAmount);
        return '';
    });
    rows.push(grandTotalRow);

    return rows;
}

/**
 * Export to Excel using current table data.
 */
export async function exportDetailedSalesReportToExcel(detailedData, tableColumns, t, filters = {}) {
    const company = await fetchCompanyProfile();
    const rows = buildExportRows(detailedData, tableColumns, t);
    if (rows.length <= 1) return;
    
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    
    exportToExcel({
        data: rows,
        filename: `Sales_Report_${dateStr}.xlsx`,
        title: t('reports.detailed_sales_report') || 'تقرير المبيعات التفصيلي',
        company,
        startDate: filters.startDate || filters.fromDate,
        endDate: filters.endDate || filters.toDate,
        branch: filters.branch,
        t
    });
}

/**
 * Build PDF blob from current table data.
 */
export async function buildDetailedSalesReportPdf(detailedData, tableColumns, t, reportTitle, filters = {}) {
    const company = await fetchCompanyProfile();
    const rows = buildExportRows(detailedData, tableColumns, t);
    const html = buildReportHtml({
        title: reportTitle || t('reports.detailed_sales_report'),
        company,
        headers: tableColumns.map((col) => col.label),
        rows: rows.slice(1),
        landscape: true,
        startDate: filters.startDate || filters.fromDate,
        endDate: filters.endDate || filters.toDate,
        branch: filters.branch,
    });
    return generatePDF(html, `Sales_Report_${new Date().toISOString().slice(0, 10)}.pdf`, { landscape: true });
}
