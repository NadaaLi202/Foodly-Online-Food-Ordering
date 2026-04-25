import * as XLSX from 'xlsx';
import { buildReportHtml, fetchCompanyProfile, generatePDF } from './generatePDF';

const fmtNum = (n) => (n == null || n === '' || n === undefined) ? '' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

/**
 * Flatten hierarchical account tree for export
 */
function flattenAccountTree(nodes, level = 0) {
    const result = [];
    for (const node of nodes) {
        result.push({ ...node, level });
        if (node.children && node.children.length > 0) {
            result.push(...flattenAccountTree(node.children, level + 1));
        }
    }
    return result;
}

/**
 * Export Trial Balance to Excel
 */
export function exportTrialBalanceToExcel(data, totals, t) {
    const rows = [];
    rows.push([t('reports.columns.account') || 'Account', 
               t('reports.columns.initial_balance') || 'Initial Balance', '', 
               t('reports.columns.transaction_totals') || 'Transaction Totals', '', 
               t('reports.columns.end_balance') || 'End Balance', '']);
    rows.push(['', t('reports.columns.debit') || 'Debit', t('reports.columns.credit') || 'Credit',
               t('reports.columns.debit') || 'Debit', t('reports.columns.credit') || 'Credit',
               t('reports.columns.debit') || 'Debit', t('reports.columns.credit') || 'Credit']);
    
    const flatData = flattenAccountTree(data || []);
    flatData.forEach(item => {
        const indent = '  '.repeat(item.level || 0);
        rows.push([
            indent + (item.name || item.label || ''),
            item.initialDebit > 0 ? fmtNum(item.initialDebit) : '',
            item.initialCredit > 0 ? fmtNum(item.initialCredit) : '',
            item.transactionDebit > 0 ? fmtNum(item.transactionDebit) : '',
            item.transactionCredit > 0 ? fmtNum(item.transactionCredit) : '',
            item.endDebit > 0 ? fmtNum(item.endDebit) : '',
            item.endCredit > 0 ? fmtNum(item.endCredit) : ''
        ]);
    });
    
    if (totals) {
        rows.push([
            t('reports.total') || 'Total',
            fmtNum(totals.initialDebit || 0),
            fmtNum(totals.initialCredit || 0),
            fmtNum(totals.transactionDebit || 0),
            fmtNum(totals.transactionCredit || 0),
            fmtNum(totals.endDebit || 0),
            fmtNum(totals.endCredit || 0)
        ]);
    }
    
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trial Balance');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `Trial_Balance_${dateStr}.xlsx`);
}

/**
 * Export Balance Sheet to Excel
 */
export function exportBalanceSheetToExcel(reportData, t) {
    const rows = [];
    rows.push([t('reports.accounting.balance_sheet') || 'Balance Sheet']);
    rows.push([]);
    
    // Assets
    rows.push([t('reports.accounting.assets') || 'Assets']);
    if (reportData.assets?.fixed?.length > 0) {
        rows.push(['', t('reports.accounting.fixed_assets') || 'Fixed Assets']);
        reportData.assets.fixed.forEach(item => {
            rows.push(['', '', item.name || '', fmtNum(item.amount || 0)]);
        });
    }
    if (reportData.assets?.current?.length > 0) {
        rows.push(['', t('reports.accounting.current_assets') || 'Current Assets']);
        reportData.assets.current.forEach(item => {
            rows.push(['', '', item.name || '', fmtNum(item.amount || 0)]);
        });
    }
    rows.push(['', t('reports.total') || 'Total Assets', '', fmtNum(reportData.assets?.total || 0)]);
    rows.push([]);
    
    // Liabilities
    rows.push([t('reports.accounting.liabilities') || 'Liabilities']);
    if (reportData.liabilities?.current?.length > 0) {
        reportData.liabilities.current.forEach(item => {
            rows.push(['', item.name || '', fmtNum(item.amount || 0)]);
        });
    }
    rows.push(['', t('reports.total') || 'Total Liabilities', '', fmtNum(reportData.liabilities?.total || 0)]);
    rows.push([]);
    
    // Equity
    rows.push([t('reports.accounting.equity') || 'Equity']);
    if (reportData.equity?.items?.length > 0) {
        reportData.equity.items.forEach(item => {
            rows.push(['', item.name || '', fmtNum(item.amount || 0)]);
        });
    }
    rows.push(['', t('reports.total') || 'Total Equity', '', fmtNum(reportData.equity?.total || 0)]);
    rows.push([]);
    rows.push(['', t('reports.total') || 'Total Liabilities and Equity', '', fmtNum(reportData.totalLiabilitiesAndEquity || 0)]);
    
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `Balance_Sheet_${dateStr}.xlsx`);
}

/**
 * Export Income Statement to Excel
 */
export function exportIncomeStatementToExcel(reportData, t) {
    const rows = [];
    rows.push([t('reports.accounting.income_statement') || 'Income Statement']);
    rows.push([]);
    
    rows.push([t('reports.accounting.revenue') || 'Revenue']);
    if (reportData.revenue?.length > 0) {
        reportData.revenue.forEach(item => {
            rows.push(['', item.name || '', fmtNum(item.amount || 0)]);
        });
    }
    rows.push(['', t('reports.total') || 'Total Revenue', '', fmtNum(reportData.totalRevenue || 0)]);
    rows.push([]);
    
    rows.push([t('reports.accounting.expenses') || 'Expenses']);
    if (reportData.expenses?.length > 0) {
        reportData.expenses.forEach(item => {
            rows.push(['', item.name || '', fmtNum(item.amount || 0)]);
        });
    }
    rows.push(['', t('reports.total') || 'Total Expenses', '', fmtNum(reportData.totalExpenses || 0)]);
    rows.push([]);
    rows.push(['', t('reports.accounting.net_income') || 'Net Income', '', fmtNum(reportData.netIncome || 0)]);
    
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Income Statement');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `Income_Statement_${dateStr}.xlsx`);
}

/**
 * Export General Ledger to Excel
 */
export function exportGeneralLedgerToExcel(entries, account, t) {
    const rows = [];
    rows.push([t('reports.accounting.general_ledger') || 'General Ledger']);
    if (account) {
        rows.push([t('reports.columns.account') || 'Account', account.name || '', account.code || '']);
    }
    rows.push([]);
    rows.push([t('reports.columns.date') || 'Date', 
               t('reports.columns.description') || 'Description',
               t('reports.columns.debit') || 'Debit',
               t('reports.columns.credit') || 'Credit',
               t('reports.columns.balance') || 'Balance']);
    
    if (entries && entries.length > 0) {
        entries.forEach(entry => {
            rows.push([
                fmtDate(entry.date),
                entry.description || '',
                entry.debit > 0 ? fmtNum(entry.debit) : '',
                entry.credit > 0 ? fmtNum(entry.credit) : '',
                fmtNum(entry.balance || 0)
            ]);
        });
    }
    
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'General Ledger');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `General_Ledger_${dateStr}.xlsx`);
}

/**
 * Export Tax Reports to Excel
 */
export function exportTaxReportToExcel(data, t, isDetailed = false) {
    const rows = [];
    rows.push([isDetailed ? (t('reports.tax_detailed') || 'Tax Detailed Report') : (t('reports.tax_summary') || 'Tax Summary Report')]);
    rows.push([]);
    
    if (isDetailed && Array.isArray(data)) {
        rows.push([t('reports.columns.date') || 'Date',
                   t('reports.columns.document_number') || 'Document Number',
                   t('reports.columns.type') || 'Type',
                   t('reports.columns.contact') || 'Contact',
                   t('reports.columns.amount') || 'Amount',
                   t('reports.columns.tax') || 'Tax']);
        data.forEach(item => {
            rows.push([
                fmtDate(item.date),
                item.documentNumber || '',
                item.type || '',
                item.contactName || '',
                fmtNum(item.amount || 0),
                fmtNum(item.tax || 0)
            ]);
        });
    } else if (!isDetailed && data) {
        rows.push([t('reports.total_sales_tax') || 'Total Sales Tax', fmtNum(data.totalSalesTax || 0)]);
        rows.push([t('reports.total_purchase_tax') || 'Total Purchase Tax', fmtNum(data.totalPurchaseTax || 0)]);
        rows.push([t('reports.net_tax_payable') || 'Net Tax Payable', fmtNum(data.netTaxPayable || 0)]);
    }
    
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isDetailed ? 'Tax Detailed' : 'Tax Summary');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    XLSX.writeFile(wb, `Tax_Report_${dateStr}.xlsx`);
}

/**
 * Build PDF for Trial Balance
 */
export async function buildTrialBalancePdf(data, totals, t, reportTitle, dateRange) {
    const company = await fetchCompanyProfile();
    const headers = [
        t('reports.columns.account') || 'Account',
        t('reports.columns.initial_balance') || 'Initial Balance',
        '',
        t('reports.columns.transaction_totals') || 'Transaction Totals',
        '',
        t('reports.columns.end_balance') || 'End Balance',
        '',
    ];
    const rows = flattenAccountTree(data || []).map((item) => ([
        `${' '.repeat((item.level || 0) * 2)}${item.name || item.label || ''}`,
        item.initialDebit > 0 ? fmtNum(item.initialDebit) : '',
        item.initialCredit > 0 ? fmtNum(item.initialCredit) : '',
        item.transactionDebit > 0 ? fmtNum(item.transactionDebit) : '',
        item.transactionCredit > 0 ? fmtNum(item.transactionCredit) : '',
        item.endDebit > 0 ? fmtNum(item.endDebit) : '',
        item.endCredit > 0 ? fmtNum(item.endCredit) : '',
    ]));
    if (totals) {
        rows.push([
            t('reports.total') || 'Total',
            fmtNum(totals.initialDebit || 0),
            fmtNum(totals.initialCredit || 0),
            fmtNum(totals.transactionDebit || 0),
            fmtNum(totals.transactionCredit || 0),
            fmtNum(totals.endDebit || 0),
            fmtNum(totals.endCredit || 0),
        ]);
    }
    const html = buildReportHtml({
        title: reportTitle || t('reports.accounting.trial_balance') || 'Trial Balance',
        company,
        headers,
        rows,
        landscape: true,
        subtitle: dateRange || '',
    });
    return generatePDF(html, `Trial_Balance_${new Date().toISOString().slice(0, 10)}.pdf`, { landscape: true });
}

/**
 * Generic PDF builder for accounting reports (supports Arabic/RTL)
 */
export async function buildAccountingReportPdf(title, contentRows, t, options = {}) {
    const company = await fetchCompanyProfile();
    const rows = (contentRows || []).map((row) => Array.isArray(row) ? row : [row]);
    const html = buildReportHtml({
        title,
        company,
        headers: rows[0] || [],
        rows: rows.slice(1),
        landscape: false,
    });
    return generatePDF(html, `${String(title || 'report').replace(/\s+/g, '_')}.pdf`, {});
}
