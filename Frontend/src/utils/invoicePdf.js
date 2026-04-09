import { requestPrintTemplateSelection } from '../services/printTemplateService';

/**
 * Invoice PDF fetch and save utilities.
 * Handles blob response and JSON error body when responseType is 'blob'.
 */

/**
 * Fetch PDF blob from GET /transactions/:id/download.
 * 404 = no transaction for this id in current company scope, or soft-deleted.
 * @param {Function} api - axios instance (e.g. from services/api)
 * @param {string} transactionId
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export async function fetchPdfBlob(api, transactionId) {
    const templateStyle = await requestPrintTemplateSelection({
        actionType: 'pdf',
        source: 'fetchPdfBlob',
        transactionId,
    });

    const response = await api.get(`/transactions/${transactionId}/download`, {
        responseType: 'blob',
        params: { templateStyle },
        validateStatus: () => true
    });

    const blob = response.data;
    if (!(blob instanceof Blob)) {
        throw new Error('Invalid response: expected PDF blob');
    }
    const contentType = (response.headers['content-type'] || '').toLowerCase();
    const isJson = contentType.includes('application/json');

    if (response.status < 200 || response.status >= 300 || isJson) {
        const serverMessage = isJson ? (await parseJsonFromBlob(blob)) : null;
        const message = serverMessage || (response.status === 404
            ? 'Document not found. It may have been deleted or you may not have access.'
            : `Request failed (${response.status})`);
        throw new Error(message);
    }

    const isPdf = contentType.includes('application/pdf');
    if (!isPdf) {
        throw new Error('Invalid response: server did not return a PDF');
    }
    if (blob.size === 0) {
        throw new Error('PDF is empty. Please try again.');
    }

    const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
    let filename = `invoice-${String(transactionId).replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    const disposition = response.headers['content-disposition'];
    if (disposition && typeof disposition === 'string' && disposition.includes('filename=')) {
        const match = disposition.match(/filename[*]?=(?:UTF-8'')?"?([^";\n]+)"?/i);
        if (match) filename = sanitizeFilename(match[1].trim().replace(/^["']|["']$/g, ''));
    }
    return { blob: pdfBlob, filename };
}

function sanitizeFilename(name) {
    const base = name.replace(/^["']|["']$/g, '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
    return base || 'invoice.pdf';
}

async function parseJsonFromBlob(blob) {
    try {
        const text = await blob.text();
        const json = JSON.parse(text);
        return json.message || json.error || 'Download failed';
    } catch (_) {
        return 'Download failed';
    }
}

/**
 * Parse error from axios error when responseType was 'blob' (server may have returned JSON).
 * Also handles plain Error thrown by fetchPdfBlob.
 * @param {*} err - axios error or Error
 * @returns {Promise<string>} error message
 */
export async function getErrorMessage(err) {
    if (!err) return 'Request failed';
    if (err instanceof Error && !err.response) return err.message;
    const data = err.response?.data;
    const fallback = err.response?.statusText || err.message || 'Request failed';
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (data instanceof Blob) {
        const ct = err.response?.headers?.['content-type'] || '';
        if (ct.toLowerCase().includes('application/json')) {
            try {
                const text = await data.text();
                const json = JSON.parse(text);
                return json.message || json.error || fallback;
            } catch (_) {
                return fallback;
            }
        }
        return fallback;
    }
    return data.message || data.error || fallback;
}

/**
 * Trigger download of a blob with the given filename. No navigation.
 * Revoke delay is intentional so the browser has time to start the download (avoids broken/empty files).
 */
export function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'invoice.pdf';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        try {
            window.URL.revokeObjectURL(url);
        } catch (_) {}
        a.remove();
    }, 1500);
}

/**
 * Open blob as PDF in new tab (for print preview).
 */
export function openBlobInNewTab(blob) {
    const url = window.URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) w.onload = () => setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    else {
        window.URL.revokeObjectURL(url);
        throw new Error('Popup blocked. Please allow popups to open PDF.');
    }
}

