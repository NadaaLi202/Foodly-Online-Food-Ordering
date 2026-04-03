import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { TajawalRegular, TajawalBold } from './tajawalFonts';
import { processArabic } from './arabic';

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
export function buildTrialBalancePdf(data, totals, t, reportTitle, dateRange) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = 18;
    
    doc.setR2L(true);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(reportTitle || t('reports.accounting.trial_balance') || 'Trial Balance', pageW - margin, y);
    y += 8;
    
    if (dateRange) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(dateRange, pageW - margin, y);
        y += 10;
    }
    
    const colWidths = [60, 25, 25, 25, 25, 25, 25];
    const headers = [
        t('reports.columns.account') || 'Account',
        t('reports.columns.initial_balance') || 'Initial', '', '',
        t('reports.columns.transaction_totals') || 'Transactions', '', '',
        t('reports.columns.end_balance') || 'End Balance', ''
    ];
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    let x = pageW - margin;
    headers.forEach((h, i) => {
        if (h) doc.text(h, x - colWidths[i] / 2, y);
        x -= colWidths[i];
    });
    y += 6;
    
    const flatData = flattenAccountTree(data || []);
    doc.setFont(undefined, 'normal');
    flatData.forEach(item => {
        if (y > pageH - 20) {
            doc.addPage('a4', 'l');
            y = 18;
            doc.setR2L(true);
        }
        const indent = (item.level || 0) * 3;
        x = pageW - margin;
        doc.text((item.name || item.label || '').substring(0, 30), x - indent, y);
        x -= colWidths[0];
        doc.text(item.initialDebit > 0 ? fmtNum(item.initialDebit) : '', x, y, { align: 'right' });
        x -= colWidths[1];
        doc.text(item.initialCredit > 0 ? fmtNum(item.initialCredit) : '', x, y, { align: 'right' });
        x -= colWidths[2];
        doc.text(item.transactionDebit > 0 ? fmtNum(item.transactionDebit) : '', x, y, { align: 'right' });
        x -= colWidths[3];
        doc.text(item.transactionCredit > 0 ? fmtNum(item.transactionCredit) : '', x, y, { align: 'right' });
        x -= colWidths[4];
        doc.text(item.endDebit > 0 ? fmtNum(item.endDebit) : '', x, y, { align: 'right' });
        x -= colWidths[5];
        doc.text(item.endCredit > 0 ? fmtNum(item.endCredit) : '', x, y, { align: 'right' });
        y += 5;
    });
    
    if (totals) {
        if (y > pageH - 20) {
            doc.addPage('a4', 'l');
            y = 18;
            doc.setR2L(true);
        }
        doc.setFont(undefined, 'bold');
        x = pageW - margin;
        doc.text(t('reports.total') || 'Total', x, y);
        x -= colWidths[0];
        doc.text(fmtNum(totals.initialDebit || 0), x, y, { align: 'right' });
        x -= colWidths[1];
        doc.text(fmtNum(totals.initialCredit || 0), x, y, { align: 'right' });
        x -= colWidths[2];
        doc.text(fmtNum(totals.transactionDebit || 0), x, y, { align: 'right' });
        x -= colWidths[3];
        doc.text(fmtNum(totals.transactionCredit || 0), x, y, { align: 'right' });
        x -= colWidths[4];
        doc.text(fmtNum(totals.endDebit || 0), x, y, { align: 'right' });
        x -= colWidths[5];
        doc.text(fmtNum(totals.endCredit || 0), x, y, { align: 'right' });
    }
    
    return doc.output('blob');
}

/**
 * Generic PDF builder for accounting reports (supports Arabic/RTL)
 */
export function buildAccountingReportPdf(title, contentRows, t, options = {}) {
    const { locale = (t && t.language) || 'ar' } = options;
    const isRtl = locale === 'ar' || locale === 'ar-EG';
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = 18;
    
    doc.addFileToVFS('Tajawal-Regular.ttf', TajawalRegular);
    doc.addFont('Tajawal-Regular.ttf', 'Tajawal', 'normal');
    doc.addFileToVFS('Tajawal-Bold.ttf', TajawalBold);
    doc.addFont('Tajawal-Bold.ttf', 'Tajawal', 'bold');
    
    const p = (text) => isRtl ? processArabic(String(text || '')) : String(text || '');

    doc.setFontSize(14);
    doc.setFont('Tajawal', 'bold');
    if (isRtl) {
        doc.text(p(title), pageW - margin, y, { align: 'right' });
    } else {
        doc.text(title, margin, y);
    }
    y += 10;
    
    doc.setFontSize(9);
    doc.setFont('Tajawal', 'normal');
    
    if (contentRows && contentRows.length > 0) {
        contentRows.forEach(row => {
            if (y > pageH - 20) {
                doc.addPage('a4', 'p');
                y = 18;
            }
            if (Array.isArray(row)) {
                let x = isRtl ? pageW - margin : margin;
                row.forEach((cell, i) => {
                    const strCell = String(cell || '');
                    // Only bold if it's the very first column in RTL (far right) or LTR (far left) ? Usually header elements are different. 
                    // Let's just keep 'normal' unless we specifically mark headers.
                    if (strCell.includes(t('reports.accounting.revenue') || 'Revenue') || strCell.includes(t('reports.accounting.expenses') || 'Expenses') || strCell.includes(t('reports.accounting.net_income') || 'Net Income')) {
                        doc.setFont('Tajawal', 'bold');
                    } else {
                        doc.setFont('Tajawal', 'normal');
                    }

                    const isNum = !isNaN(parseFloat(strCell.replace(/,/g, ''))) && strCell.trim() !== '';
                    let tempX = x;
                    if (isNum && isRtl) {
                         // Right align Numbers in their column
                         doc.text(strCell, tempX, y, { align: 'right' });
                    } else {
                         if (isRtl) {
                            doc.text(p(strCell.substring(0, 50)), tempX, y, { align: 'right' });
                         } else {
                            doc.text(strCell.substring(0, 50), tempX, y);
                         }
                    }

                    // For Income Statement, the columns are usually: [Indent?, Code+Name, Amount] 
                    if (isRtl) {
                         x -= (i === 0 ? 10 : 80); // Step left. 1st column is narrow (indent placeholder), 2nd is wide (Name), 3rd is amount
                    } else {
                         x += (i === 0 ? 10 : 80);
                    }
                });
            } else {
                const text = p(String(row || '').substring(0, 80));
                if (isRtl) {
                    doc.text(text, pageW - margin, y, { align: 'right' });
                } else {
                    doc.text(text, margin, y);
                }
            }
            y += 6;
        });
    }
    
    return doc.output('blob');
}
