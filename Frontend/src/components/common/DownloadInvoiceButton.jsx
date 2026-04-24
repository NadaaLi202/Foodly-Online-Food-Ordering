import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import api from '../../services/api';
import logError from '../../utils/logerror';
import { useTranslation } from 'react-i18next';
import { fetchPdfBlob, downloadBlob } from '../../utils/invoicepdf';

/**
 * Triggers server-side PDF download for a transaction (invoice/return/quote).
 * Uses GET /transactions/:id/download with blob response. No navigation or state reset.
 */
const DownloadInvoiceButton = ({ transactionId, filenamePrefix = 'invoice', className = '', title }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!transactionId) return;
        setLoading(true);
        try {
            const { blob, filename } = await fetchPdfBlob(api, String(transactionId));
            downloadBlob(blob, filename || `${filenamePrefix}.pdf`);
        } catch (err) {
            logError('Download failed:', err);
            const message = err.response?.data?.message || err.message || t('sales.invoices.pdf_capture_failed');
            if (typeof window !== 'undefined' && window.alert) window.alert(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className={className || 'p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all disabled:opacity-50'}
            title={title || t('sales.common.download')}
        >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        </button>
    );
};

export default DownloadInvoiceButton;
