import { buildReportHtml, generatePDF, fetchCompanyProfile } from './generatePDF';

const formatNumber = (value) => Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const buildJournalRows = (entry) => {
    const rows = Array.isArray(entry?.entries) ? entry.entries : [];
    return rows.map((row) => {
        const accountLabel = row.account?.name
            ? (row.account.code ? `${row.account.code} - ${row.account.name}` : row.account.name)
            : (row.account || '');
        return [
            accountLabel || '\u2014',
            row.description || '\u2014',
            formatNumber(row.debit),
            formatNumber(row.credit),
        ];
    });
};

const buildJournalHtml = async (entry, options = {}) => {
    const company = await fetchCompanyProfile();
    const title = options.title || '\u0642\u064a\u062f \u064a\u0648\u0645\u064a';
    const dateStr = entry?.date ? new Date(entry.date).toLocaleDateString(options.locale === 'ar' ? 'ar-EG' : 'en-GB') : '\u2014';
    const rows = buildJournalRows(entry);
    const totalRow = [
        options.locale === 'ar' ? '\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0639\u0627\u0645' : 'Total Sum',
        '',
        formatNumber(entry?.totalDebit),
        formatNumber(entry?.totalCredit),
    ];
    const html = buildReportHtml({
        title,
        company,
        headers: [
            options.locale === 'ar' ? '\u0627\u0644\u062d\u0633\u0627\u0628' : 'Account',
            options.locale === 'ar' ? '\u0627\u0644\u0648\u0635\u0641' : 'Description',
            options.locale === 'ar' ? '\u0645\u062f\u064a\u0646' : 'Debit',
            options.locale === 'ar' ? '\u062f\u0627\u0626\u0646' : 'Credit',
        ],
        rows: [
            [options.locale === 'ar' ? '\u0631\u0642\u0645 \u0627\u0644\u0642\u064a\u062f' : 'Entry Number', entry?.number || '\u2014', '', ''],
            [options.locale === 'ar' ? '\u0627\u0644\u062a\u0627\u0631\u064a\u062e' : 'Date', dateStr, '', ''],
            ...(entry?.description ? [[options.locale === 'ar' ? '\u0627\u0644\u0628\u064a\u0627\u0646' : 'Description', entry.description, '', '']] : []),
            ...rows,
        ],
        footer: false,
        landscape: false,
        subtitle: '',
    });
    return { html, totalRow };
};

export async function buildJournalEntryPdf(entry, options = {}) {
    const { html } = await buildJournalHtml(entry, options);
    return generatePDF(html, `journal-entry-${entry?.number || entry?._id || 'entry'}.pdf`, { landscape: false });
}

export async function downloadJournalEntryPdf(entry, filename, options = {}) {
    const blob = await buildJournalEntryPdf(entry, options);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `journal-entry-${entry?.number || entry?._id || 'entry'}.pdf`;
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

export async function openJournalEntryPdfInNewTab(entry, options = {}) {
    const blob = await buildJournalEntryPdf(entry, options);
    const url = window.URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) {
        w.onload = () => setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } else {
        window.URL.revokeObjectURL(url);
        throw new Error('Popup blocked. Please allow popups to open PDF.');
    }
}
