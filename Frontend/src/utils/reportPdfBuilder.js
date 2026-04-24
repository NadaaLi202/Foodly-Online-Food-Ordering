import { buildReportHtml, fetchCompanyProfile, generatePDF } from './generatepdf';

const downloadBlob = (blob, filename) => {
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

export async function downloadTablePdf({
    title,
    headers,
    rows,
    filename,
    subtitle = '',
    landscape = true,
    footer = true,
}) {
    try {
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
        const blob = await generatePDF(html, filename, { landscape });
        downloadBlob(blob, filename);
    } catch (error) {
        console.error('PDF download error:', error);
        if (typeof window !== 'undefined') {
            window.alert('An error occurred while downloading the file. Please try again.');
        }
    }
}
