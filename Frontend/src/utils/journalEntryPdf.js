import { jsPDF } from 'jspdf';
import { TajawalRegular, TajawalBold } from './tajawalFonts';
import { processArabic } from './arabic';

/**
 * Build journal entry data for PDF with correct Arabic rendering.
 * @param {Object} entry - { number, date, description, totalDebit, totalCredit, entries: [{ account, description, debit, credit }] }
 * @returns {Blob} PDF blob
 */
export function buildJournalEntryPdf(entry, options = {}) {
    const { title = 'قيد يومي', locale = 'ar' } = options;
    const isRtl = locale === 'ar';
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Register and use Tajawal fonts
    doc.addFileToVFS('Tajawal-Regular.ttf', TajawalRegular);
    doc.addFont('Tajawal-Regular.ttf', 'Tajawal', 'normal');
    
    doc.addFileToVFS('Tajawal-Bold.ttf', TajawalBold);
    doc.addFont('Tajawal-Bold.ttf', 'Tajawal', 'bold');

    doc.setFont('Tajawal');

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 25;

    // Helper: process text if Arabic
    const p = (text) => isRtl ? processArabic(text) : text;
    const fmtNumber = (num) => Number(num || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 1. Title (Large, Bold, Right Aligned if RTL)
    doc.setFontSize(22);
    doc.setFont('Tajawal', 'bold');
    if (isRtl) {
        doc.text(p(title), pageW - margin, y, { align: 'right' });
    } else {
        doc.text(title, margin, y);
    }
    y += 15;

    // 2. Meta line (Number and Date)
    doc.setFontSize(11);
    doc.setFont('Tajawal', 'normal');
    const dateStr = entry.date ? new Date(entry.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB') : '—';
    
    if (isRtl) {
        // RTL Layout for header info
        doc.text(`${p('رقم القيد')}: ${entry.number || '—'}`, pageW - margin, y, { align: 'right' });
        doc.text(`${p('التاريخ')}: ${dateStr}`, pageW - 80, y, { align: 'right' });
    } else {
        doc.text(`Number: ${entry.number || '—'}`, margin, y);
        doc.text(`Date: ${dateStr}`, 80, y);
    }
    y += 10;

    // 3. Description
    if (entry.description) {
        doc.setFontSize(10);
        const descText = `${isRtl ? p('البيان') : 'Description'}: ${p(entry.description)}`;
        const splitDesc = doc.splitTextToSize(descText, pageW - 2 * margin);
        
        splitDesc.forEach(line => {
            if (isRtl) {
                doc.text(line, pageW - margin, y, { align: 'right' });
            } else {
                doc.text(line, margin, y);
            }
            y += 6;
        });
        y += 4;
    } else {
        y += 5;
    }

    // 4. Table Header
    // Columns: [Account, Description, Debit, Credit]
    // In RTL we want them aligned right to left.
    const colW = [pageW * 0.25, pageW * 0.35, pageW * 0.15, pageW * 0.15];
    const totalW = colW.reduce((a, b) => a + b, 0);
    const startX = isRtl ? (pageW - margin - totalW) : margin;

    doc.setFont('Tajawal', 'bold');
    doc.setFontSize(11);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 6, pageW - 2 * margin, 9, 'F');
    doc.rect(margin, y - 6, pageW - 2 * margin, 9, 'S');

    const headers = isRtl 
        ? [p('الحساب'), p('الوصف'), p('مدين'), p('دائن')]
        : ['Account', 'Description', 'Debit', 'Credit'];

    let curX = isRtl ? (pageW - margin) : margin;
    headers.forEach((h, i) => {
        if (isRtl) {
            doc.text(h, curX - 2, y, { align: 'right' });
            curX -= colW[i];
        } else {
            doc.text(h, curX + 2, y);
            curX += colW[i];
        }
    });
    
    y += 9;

    // 5. Table Body
    doc.setFont('Tajawal', 'normal');
    doc.setFontSize(10);
    const rows = Array.isArray(entry.entries) ? entry.entries : [];
    
    rows.forEach((row) => {
        if (y > 270) {
            doc.addPage();
            y = 25;
        }
        
        const accountLabel = row.account?.name 
            ? (row.account.code ? `${row.account.code} - ${row.account.name}` : row.account.name)
            : (row.account || '');

        const data = [
            p(accountLabel),
            p(row.description || ''),
            fmtNumber(row.debit),
            fmtNumber(row.credit)
        ];

        doc.rect(margin, y - 6, pageW - 2 * margin, 8);
        
        let rowX = isRtl ? (pageW - margin) : margin;
        data.forEach((val, i) => {
            if (isRtl) {
                // Numbers should still be LTR but aligned correctly within the cell
                const align = (i >= 2) ? 'left' : 'right';
                const xOffset = (i >= 2) ? (rowX - colW[i] + 2) : (rowX - 2);
                doc.text(val, xOffset, y, { align: align });
                rowX -= colW[i];
            } else {
                doc.text(val, rowX + 2, y);
                rowX += colW[i];
            }
        });
        y += 8;
    });

    // 6. Total Row
    y += 2;
    doc.setFont('Tajawal', 'bold');
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, y - 6, pageW - 2 * margin, 8, 'F');
    doc.rect(margin, y - 6, pageW - 2 * margin, 8, 'S');

    const totalDebit = fmtNumber(entry.totalDebit);
    const totalCredit = fmtNumber(entry.totalCredit);
    const totalLabel = isRtl ? p('الإجمالي العام') : 'Total Sum';

    if (isRtl) {
        doc.text(totalLabel, pageW - margin - 5, y, { align: 'right' });
        doc.text(totalDebit, pageW - margin - colW[0] - colW[1] - colW[2] + 2, y, { align: 'left' });
        doc.text(totalCredit, pageW - margin - colW[0] - colW[1] - colW[2] - colW[3] + 2, y, { align: 'left' });
    } else {
        doc.text(totalLabel, margin + 2, y);
        doc.text(totalDebit, margin + colW[0] + colW[1] + 2, y);
        doc.text(totalCredit, margin + colW[0] + colW[1] + colW[2] + 2, y);
    }

    return doc.output('blob');
}

/**
 * Trigger download of journal entry PDF.
 */
export function downloadJournalEntryPdf(entry, filename, options = {}) {
    const blob = buildJournalEntryPdf(entry, options);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `journal-entry-${entry.number || entry._id || 'entry'}.pdf`;
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        try {
            window.URL.revokeObjectURL(url);
        } catch (_) {}
        a.remove();
    }, 500);
}

/**
 * Open journal entry PDF in new tab (for print).
 */
export function openJournalEntryPdfInNewTab(entry, options = {}) {
    const blob = buildJournalEntryPdf(entry, options);
    const url = window.URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) {
        w.onload = () => setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } else {
        window.URL.revokeObjectURL(url);
        throw new Error('Popup blocked. Please allow popups to open PDF.');
    }
}
