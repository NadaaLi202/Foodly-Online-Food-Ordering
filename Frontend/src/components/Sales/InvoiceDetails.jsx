import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, Paperclip, FileText, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import logError from '../../utils/logError';
import DocumentActions from '../common/DocumentActions';
import InvoiceLayout from '../invoice/InvoiceLayout';
import InvoicePaymentsTab from './InvoicePaymentsTab';
import { fetchPdfBlob, downloadBlob, openBlobInNewTab, getErrorMessage } from '../../utils/invoicePdf';

const InvoiceDetails = ({ invoice, onClose, onEdit, onDelete, onSave, onRefreshInvoice, loading, i18n, viewTitleKey, filenamePrefix, paymentsModule = 'sales', canEdit = true, canDelete = true }) => {
    const { t } = useTranslation();
    const viewTitle = viewTitleKey ? t(viewTitleKey) : t('sales.invoices.view_invoice');
    const fPrefix = filenamePrefix || 'Invoice';
    const [viewTab, setViewTab] = useState('invoice');
    const [note, setNote] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [printLoading, setPrintLoading] = useState(false);
    const isRTL = i18n.language === 'ar';

    useEffect(() => {
        // We might not strictly need this if we don't display product details that aren't in the invoice object,
        // but keeping it for consistency if it was there for some lookup.
        const fetchProducts = async () => {
            try {
                await api.get('/products');
            } catch (error) {
                logError('Error fetching products:', error);
            }
        };
        fetchProducts();
    }, []);

    const handleDownload = async () => {
        const id = invoice?._id;
        if (!id) {
            toast.error(t('sales.invoices.pdf_capture_failed'));
            return;
        }
        setDownloadLoading(true);
        try {
            const { blob, filename } = await fetchPdfBlob(api, String(id));
            downloadBlob(blob, filename);
            toast.success(t('sales.invoices.download') + ' — OK');
        } catch (err) {
            const message = await getErrorMessage(err);
            toast.error(message);
        } finally {
            setDownloadLoading(false);
        }
    };

    const handlePrint = async () => {
        const id = invoice?._id;
        if (!id) {
            toast.error(t('sales.invoices.pdf_capture_failed'));
            return;
        }
        setPrintLoading(true);
        try {
            const { blob } = await fetchPdfBlob(api, String(id));
            openBlobInNewTab(blob);
            toast.success(t('sales.invoices.print_pdf') + ' — OK');
        } catch (err) {
            const message = await getErrorMessage(err);
            toast.error(message);
        } finally {
            setPrintLoading(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        const title = `${fPrefix} ${invoice?.transactionNumber || ''}`;
        const text = `${fPrefix} — ${invoice?.contact?.name || invoice?.contactSnapshot?.name || 'Client'}`;
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                toast.success(t('sales.invoices.share') + ' — OK');
            } catch (e) {
                if (e.name !== 'AbortError') toast.error(e.message || 'Share failed');
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                toast.success(t('sales.invoices.link_copied'));
            } catch (_) {
                toast.error('Could not copy link');
            }
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!note.trim()) return;

        const formData = new FormData();
        formData.append('notes', note); // Appending to existing notes or how backend handles it?
        // Actually the backend might expect 'notes' field update.
        // If we want to *append* notes, we should probably fetch current notes and append.
        // For now let's assume this updates the notes field.

        if (onSave) {
            // pass just the updates
            const updatedNotes = invoice.notes ? `${invoice.notes}\n${note}` : note;
            // We need to send as FormData if onSave expects it, or just object if onSave handles both.
            // TransactionPage handleSave uses `api` which handles object or FormData.
            // But let's check InvoiceForm, it sends FormData. TransactionPage is generic.
            // Let's send an object with just the field to update if the API supports PATCH with JSON.
            // Our TransactionPage logic:
            // const response = await api({ method, url, data: formData });
            // Axios handles object data as JSON automatically.

            await onSave({ notes: updatedNotes }, { stayOnDetails: true });
            setNote('');
        }
    };

    // Status badges
    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'partial': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'unpaid': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusText = (status) => {
        return t(`sales.common.status_${status || 'unpaid'}`);
    };

    if (!invoice) return null;

    const qrValue = JSON.stringify({
        invoiceNumber: invoice.transactionNumber,
        total: invoice.totalAmount,
        company: 'Dafater',
        date: invoice.issueDate
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:w-full print:max-w-none print:max-h-none" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Header with title and actions */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 print:hidden">
                    <h2 className={`text-lg font-black text-gray-800 ${isRTL ? 'text-right' : 'text-left'}`}>{viewTitle}</h2>
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <button onClick={() => onEdit(invoice)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Edit3 size={16} />
                                <span className="hidden sm:inline">{t('sales.common.edit')}</span>
                            </button>
                        )}
                        {canDelete && (
                            <button onClick={() => onDelete(invoice._id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Trash2 size={16} />
                                <span className="hidden sm:inline">{t('sales.common.delete')}</span>
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs: Invoice | Payments | Stock Movements */}
                <div className="border-b border-gray-200 bg-gray-50/50 print:hidden">
                    <div className={`flex gap-0 px-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <button
                            onClick={() => setViewTab('invoice')}
                            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${viewTab === 'invoice' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('sales.invoices.invoice_tab')}
                        </button>
                        <button
                            onClick={() => setViewTab('payments')}
                            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${viewTab === 'payments' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('sales.invoices.payments_tab')}
                        </button>
                        <button
                            onClick={() => setViewTab('stock')}
                            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${viewTab === 'stock' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('sales.invoices.inventory_movements_tab')}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col md:flex-row bg-gray-50/50 print:bg-white">
                    {/* Main content */}
                    <div className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
                        {viewTab === 'invoice' && (
                            <>
                                {/* Four status cards row */}
                                <div className={`flex flex-wrap gap-4 mb-6 print:hidden ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 min-w-[140px]">
                                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">{t('sales.invoices.payment_status')}</p>
                                        <p className="text-sm font-bold text-red-700">{invoice.status === 'paid' ? t('sales.common.paid') : invoice.status === 'partially_paid' ? t('sales.common.partial') : t('sales.common.unpaid')}</p>
                                    </div>
                                    <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 min-w-[140px]">
                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">{t('sales.invoices.inventory_movement_status')}</p>
                                        <p className="text-sm font-bold text-green-700">{t('sales.common.delivered')}</p>
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{t('sales.invoices.document')}</p>
                                        <DocumentActions
                                            onDownload={handleDownload}
                                            onPrint={handlePrint}
                                            onShare={handleShare}
                                            downloadLoading={downloadLoading}
                                            printLoading={printLoading}
                                            isRTL={isRTL}
                                        />
                                    </div>
                                    <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 min-w-[140px]">
                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">{t('sales.invoices.status_label')}</p>
                                        <p className="text-sm font-bold text-green-700">{t('sales.invoices.status_issued')}</p>
                                    </div>
                                </div>

                                {/* Invoice content: header, client, table, summary, QR */}
                                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                                    <InvoiceLayout
                                        invoice={invoice}
                                        title={viewTitle}
                                        companyName="Dafater"
                                        dir={isRTL ? 'rtl' : 'ltr'}
                                    />
                                </div>

                                {/* Warehouse, Discount, Notes, Attachments */}
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.invoices.warehouse')}</label>
                                        <p className="text-sm text-gray-700">{invoice.warehouse || '—'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.invoices.invoice_level_discount')}</label>
                                        <p className="text-sm text-gray-700">{invoice.generalDiscountPercent ?? invoice.generalDiscount ?? 0}%</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.invoices.notes_label')}</label>
                                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 min-h-[80px]">
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes || '—'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.invoices.attachments_label')}</label>
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                                            <Paperclip size={32} className="mx-auto text-gray-300 mb-2" />
                                            <p className="text-sm text-gray-500">{t('sales.invoices.upload_attachments')}</p>
                                            {(invoice.attachments || []).length > 0 && (
                                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                                    {(invoice.attachments || []).map((file, i) => (
                                                        <a key={i} href={file.fileUrl || file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:border-indigo-300">
                                                            <FileText size={14} /> {file.fileName || file.name}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code - prominent placement */}
                                <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 flex-wrap print:block">
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{t('sales.invoices.qr_code')}</span>
                                    <QRCodeCanvas value={qrValue} size={120} level="M" includeMargin className="shrink-0" />
                                </div>

                                {/* Footer buttons */}
                                <div className={`flex gap-3 mt-6 print:hidden ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <button
                                        type="button"
                                        onClick={() => onSave && onSave({}, { stayOnDetails: true })}
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm"
                                    >
                                        {t('sales.invoices.save')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold text-sm"
                                    >
                                        {t('sales.common.close')}
                                    </button>
                                </div>
                            </>
                        )}
                        {viewTab === 'payments' && (
                            <InvoicePaymentsTab
                                invoice={invoice}
                                paymentsModule={paymentsModule}
                                onRefreshInvoice={onRefreshInvoice}
                            />
                        )}
                        {viewTab === 'stock' && (
                            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
                                <p>{t('sales.invoices.inventory_movements_tab')}</p>
                                <p className="text-sm mt-2">—</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar (Details & History) - Hidden on print and on invoice tab to match screen layout */}
                    {viewTab !== 'invoice' && (
                        <div className="w-full md:w-80 bg-white border-l border-gray-100 p-6 flex flex-col gap-6 print:hidden h-full overflow-y-auto">

                            {/* Attachments Section */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Paperclip size={14} />
                                    <span>Attachments</span>
                                </h3>
                                <div className="space-y-3">
                                    {(invoice.attachments || []).map((file, i) => (
                                        <a href={file.fileUrl || file.url} target="_blank" rel="noreferrer" key={i} className="block p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 group-hover:text-indigo-500 shadow-sm">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-bold text-gray-700 truncate group-hover:text-indigo-700">{file.fileName || file.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">Click to view</p>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                    {(invoice.attachments || []).length === 0 && (
                                        <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">No attachments</p>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions / Notes */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Edit3 size={14} />
                                    <span>Add Note</span>
                                </h3>
                                <form onSubmit={handleAddNote} className="relative">
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-xs font-bold text-gray-700 focus:outline-none transition-all resize-none min-h-[100px]"
                                        placeholder="Type a note here..."
                                    ></textarea>
                                    <button
                                        type="submit"
                                        disabled={!note.trim()}
                                        className="absolute bottom-3 right-3 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md"
                                    >
                                        <Send size={12} />
                                    </button>
                                </form>
                            </div>

                            {/* Timeline / History (Placeholder) */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span>History</span>
                                </h3>
                                <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-green-100 border-2 border-white ring-1 ring-green-500"></div>
                                        <p className="text-xs font-bold text-gray-800">Created</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{new Date(invoice.createdAt || Date.now()).toLocaleString()}</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-indigo-100 border-2 border-white ring-1 ring-indigo-500"></div>
                                        <p className="text-xs font-bold text-gray-800">Last Updated</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{new Date(invoice.updatedAt || Date.now()).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetails;
