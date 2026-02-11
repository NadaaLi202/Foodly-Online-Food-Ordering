import { jsPDF } from 'jspdf';

/**
 * Build journal entry data for PDF (numbers and strings only).
 * @param {Object} entry - { number, date, description, totalDebit, totalCredit, entries: [{ account, description, debit, credit }] }
 * @returns {Blob} PDF blob
 */
export function buildJournalEntryPdf(entry, options = {}) {
    const { title = 'Journal Entry', locale = 'en' } = options;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 18;

    // Title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(title, 14, y);
    y += 10;

    // Meta line
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const dateStr = entry.date ? new Date(entry.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB') : '—';
    doc.text(`Number: ${entry.number || '—'}`, 14, y);
    doc.text(`Date: ${dateStr}`, 80, y);
    y += 2;
    if (entry.description) {
        doc.setFontSize(9);
        doc.text(`Description: ${String(entry.description).slice(0, 80)}${String(entry.description).length > 80 ? '...' : ''}`, 14, y);
        y += 8;
    } else {
        y += 6;
    }

    // Table header
    const colW = [50, 50, 22, 22];
    const startX = 14;
    const headY = y;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.rect(startX, headY - 5, pageW - 28, 8);
    doc.text('Account', startX + 2, headY);
    doc.text('Description', startX + colW[0] + 2, headY);
    doc.text('Debit', startX + colW[0] + colW[1] + 2, headY);
    doc.text('Credit', startX + colW[0] + colW[1] + colW[2] + 2, headY);
    y = headY + 6;

    doc.setFont(undefined, 'normal');
    const rows = Array.isArray(entry.entries) ? entry.entries : [];
    rows.forEach((row, i) => {
        if (y > 270) {
            doc.addPage();
            y = 18;
        }
        const acc = String(row.account || '').slice(0, 18);
        const desc = String(row.description || '').slice(0, 18);
        const debit = Number(row.debit) || 0;
        const credit = Number(row.credit) || 0;
        doc.rect(startX, y - 4, pageW - 28, 6);
        doc.text(acc, startX + 2, y);
        doc.text(desc, startX + colW[0] + 2, y);
        doc.text(debit.toFixed(2), startX + colW[0] + colW[1] + 2, y);
        doc.text(credit.toFixed(2), startX + colW[0] + colW[1] + colW[2] + 2, y);
        y += 6;
    });

    // Totals
    y += 2;
    doc.setFont(undefined, 'bold');
    doc.rect(startX, y - 4, pageW - 28, 6);
    const totalDebit = Number(entry.totalDebit) || 0;
    const totalCredit = Number(entry.totalCredit) || 0;
    doc.text('Total', startX + 2, y);
    doc.text(totalDebit.toFixed(2), startX + colW[0] + colW[1] + 2, y);
    doc.text(totalCredit.toFixed(2), startX + colW[0] + colW[1] + colW[2] + 2, y);
    y += 12;

    if (entry.attachment) {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text('Attachment: Yes', 14, y);
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
