import React from 'react';
import { Download, Printer, Share2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ICON_SIZE = 18;

const buttonBase =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] min-h-[40px] disabled:opacity-60 disabled:pointer-events-none';

const styles = {
    download: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:shadow border border-indigo-100',
    print: 'bg-red-50 text-red-700 hover:bg-red-100 hover:shadow border border-red-100',
    share: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow border border-emerald-100',
};

/**
 * Reusable Document actions: Download (PDF), Print (PDF), Share.
 * Accepts handler props for use across Invoice Details, List, etc.
 */
const DocumentActions = ({
    onDownload,
    onPrint,
    onShare,
    downloadLoading = false,
    printLoading = false,
    className = '',
    isRTL = false,
    labelDownload,
    labelPrint,
    labelShare,
}) => {
    const { t } = useTranslation();
    const downloadLabel = labelDownload ?? t('sales.invoices.download');
    const printLabel = labelPrint ?? t('sales.invoices.print_pdf');
    const shareLabel = labelShare ?? t('sales.invoices.share');

    return (
        <div
            className={`flex flex-wrap items-center gap-3 ${isRTL ? 'flex-row-reverse justify-end' : 'flex-row justify-end'} ${className}`}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            <button
                type="button"
                onClick={onDownload}
                disabled={downloadLoading}
                className={`${buttonBase} ${styles.download}`}
                title={downloadLabel}
            >
                {downloadLoading ? (
                    <Loader2 size={ICON_SIZE} className="animate-spin shrink-0" />
                ) : (
                    <Download size={ICON_SIZE} className="shrink-0" />
                )}
                <span>{downloadLabel}</span>
            </button>
            <button
                type="button"
                onClick={onPrint}
                disabled={printLoading}
                className={`${buttonBase} ${styles.print}`}
                title={printLabel}
            >
                {printLoading ? (
                    <Loader2 size={ICON_SIZE} className="animate-spin shrink-0" />
                ) : (
                    <Printer size={ICON_SIZE} className="shrink-0" />
                )}
                <span>{printLabel}</span>
            </button>
            <button
                type="button"
                onClick={onShare}
                className={`${buttonBase} ${styles.share}`}
                title={shareLabel}
            >
                <Share2 size={ICON_SIZE} className="shrink-0" />
                <span>{shareLabel}</span>
            </button>
        </div>
    );
};

export default DocumentActions;
