import React, { useState, useRef, useEffect } from 'react';
import { X, Printer, Share2, Download, FileText, Package, CreditCard, Trash2, Plus, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const API_BASE = 'http://localhost:4000/api/v1';

const InvoiceDetails = ({ invoice, onClose, onEdit, onDelete, onSave, loading, i18n, viewTitleKey, filenamePrefix }) => {
    const { t } = useTranslation();
    const viewTitle = viewTitleKey ? t(viewTitleKey) : t('sales.invoices.view_invoice');
    const docPrefix = filenamePrefix || 'Invoice';
    const [activeTab, setActiveTab] = useState('invoice');
    const [attachmentTab, setAttachmentTab] = useState('attachments');
    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [newAttachmentFiles, setNewAttachmentFiles] = useState([]);
    const fileInputRef = useRef(null);
    const invoiceRef = useRef();

    useEffect(() => {
        if (!invoice) return;
        setItems((invoice.items || []).map(item => ({
            product: item.product?._id || item.product,
            productName: item.productName || item.product?.name || '',
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice ?? 0,
            discountPercent: item.discountPercent ?? 0,
            discountAmount: item.discountAmount ?? 0,
            taxPercent: item.taxPercent ?? 0,
            total: item.total ?? 0,
            subtotal: item.subtotal ?? 0
        })));
        setNotes(invoice.notes || '');
        setNewAttachmentFiles([]);
    }, [invoice]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API_BASE}/products`);
                const data = await res.json();
                setProducts(data.products || []);
            } catch (e) { console.error(e); }
        };
        fetchProducts();
    }, []);

    if (!invoice) return null;

    const clientDisplay = invoice.contact?.name
        ? `${invoice.contact.name} #${invoice.contact.code || invoice.contact._id?.slice(-6) || ''}`
        : (invoice.contactSnapshot?.name || invoice.clientName || '');
    const responsibleName = invoice.createdBy?.name || invoice.userName || '—';
    const journalEntryNumber = invoice.journalEntryNumber || invoice.transactionNumber || '—';

    const calculateItemTotal = (item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        const sub = qty * price;
        const disc = item.discountPercent ? sub * (item.discountPercent / 100) : (item.discountAmount || 0);
        const afterDisc = sub - disc;
        const tax = afterDisc * ((item.taxPercent || 0) / 100);
        return afterDisc + tax;
    };

    const updateItem = (index, field, value) => {
        const next = items.map((it, i) => {
            if (i !== index) return it;
            const updated = { ...it, [field]: value };
            if (field === 'product' && value) {
                const prod = products.find(p => p._id === value);
                if (prod) {
                    updated.productName = prod.name;
                    updated.unitPrice = prod.sellingPrice ?? prod.price ?? 0;
                }
            }
            updated.total = calculateItemTotal(updated);
            return updated;
        });
        setItems(next);
    };

    const addItem = () => {
        setItems([...items, {
            product: '',
            productName: '',
            quantity: 1,
            unitPrice: 0,
            discountPercent: 0,
            discountAmount: 0,
            taxPercent: 0,
            total: 0,
            subtotal: 0
        }]);
    };

    const removeItem = (index) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
    const totalDiscount = items.reduce((sum, it) => {
        const sub = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
        return sum + (it.discountPercent ? sub * (it.discountPercent / 100) : (it.discountAmount || 0));
    }, 0);
    const afterDisc = subtotal - totalDiscount;
    const totalTax = items.reduce((sum, it) => {
        const tot = calculateItemTotal(it);
        const sub = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
        const disc = it.discountPercent ? sub * (it.discountPercent / 100) : (it.discountAmount || 0);
        return sum + (tot - (sub - disc));
    }, 0);
    const generalDisc = Number(invoice.generalDiscountPercent || invoice.generalDiscount || 0);
    const generalDiscAmount = generalDisc <= 100 ? (afterDisc * generalDisc / 100) : generalDisc;
    const total = afterDisc + totalTax - generalDiscAmount;

    const handlePrint = () => {
        const content = invoiceRef.current;
        if (!content) {
            alert(t('sales.common.error_message') || 'Content not ready to print');
            return;
        }
        try {
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert(t('sales.invoices.pdf_popup_blocked') || 'Please allow popups to print');
                return;
            }
            const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
            printWindow.document.write(`
                <!DOCTYPE html>
                <html dir="${dir}" lang="${i18n.language || 'en'}">
                <head>
                    <meta charset="utf-8">
                    <title>Invoice ${(invoice.transactionNumber || invoice.invoiceNumber || 'Invoice').replace(/[<>"]/g, '')}</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; direction: ${dir}; padding: 24px; color: #1f2937; }
                        @media print { .no-print { display: none !important; } body { padding: 0; } }
                    </style>
                </head>
                <body>${content.innerHTML}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.onafterprint = () => printWindow.close();
            }, 350);
        } catch (err) {
            console.error('Print error:', err);
            alert(t('sales.common.error_message') || 'Failed to print');
        }
    };

    const getSafeFilename = () => {
        const base = (invoice.transactionNumber || invoice.invoiceNumber || docPrefix).replace(/[^a-zA-Z0-9-_]/g, '_');
        return `${docPrefix}_${base}.pdf`;
    };

    const triggerPdfDownload = (pdf, filename) => {
        try {
            pdf.save(filename);
        } catch (saveErr) {
            try {
                const blob = pdf.output('blob');
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.rel = 'noopener';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (blobErr) {
                console.error('PDF save and blob fallback failed:', saveErr, blobErr);
                throw new Error('Download failed. Please allow downloads for this site.');
            }
        }
    };

    const getInvoicePdfHtml = () => {
        const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        const issueDateStr = invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') : '—';
        const dueDateStr = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') : '—';
        const rows = items.map((item) => {
            const total = calculateItemTotal(item);
            return `<tr>
                <td style="padding:8px;border:1px solid #e5e7eb;">${(item.productName || '—').replace(/</g, '&lt;')}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;">—</td>
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${Number(item.quantity) || 0}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${Number(item.unitPrice) || 0}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${item.discountPercent || 0}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${item.taxPercent || 0}</td>
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:${dir === 'rtl' ? 'left' : 'right'};font-weight:700;">${total.toLocaleString()}</td>
            </tr>`;
        }).join('');
        return `
<!DOCTYPE html>
<html dir="${dir}" lang="${i18n.language || 'en'}">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; color: #1f2937; background: #fff; }
        .header { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .field label { display: block; font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; margin-bottom: 4px; }
        .field p { margin: 0; font-size: 14px; font-weight: 700; color: #1f2937; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { padding: 12px; text-align: ${dir === 'rtl' ? 'right' : 'left'}; background: #f9fafb; border: 1px solid #e5e7eb; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #6b7280; }
        .totals { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-top: 24px; }
        .totals div { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; font-weight: 700; color: #4b5563; }
        .totals .grand { font-size: 20px; font-weight: 800; color: #4f46e5; padding-top: 8px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div id="invoice-pdf-root">
        <div class="header">
            <div class="field"><label>${t('sales.invoices.user_label')}</label><p>${responsibleName}</p></div>
            <div class="field"><label>${t('sales.invoices.journal_entry_number')}</label><p>${journalEntryNumber}</p></div>
            <div class="field"><label>${t('sales.invoices.issue_date')}</label><p>${issueDateStr}</p></div>
            <div class="field"><label>${t('sales.invoices.due_date')}</label><p>${dueDateStr}</p></div>
            <div class="field"><label>${t('sales.invoices.number_label')}</label><p>${invoice.transactionNumber || invoice.invoiceNumber || '—'}</p></div>
            <div class="field"><label>${t('sales.invoices.client_required')}</label><p>${clientDisplay || '—'}</p></div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>${t('sales.common.product')}</th>
                    <th>${t('sales.common.description')}</th>
                    <th style="text-align:center;width:80px;">${t('sales.common.quantity')}</th>
                    <th style="text-align:center;width:96px;">${t('sales.common.price')}</th>
                    <th style="text-align:center;width:96px;">${t('sales.common.discount')}</th>
                    <th style="text-align:center;width:80px;">${t('sales.invoices.tax_label')}</th>
                    <th style="text-align:${dir === 'rtl' ? 'left' : 'right'};width:112px;">${t('sales.common.total')}</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="totals">
            <div><span>${t('sales.common.subtotal')}</span><span>${subtotal.toLocaleString()} ${t('sales.common.currency')}</span></div>
            <div><span>${t('sales.invoices.vat_14')}</span><span>${totalTax.toLocaleString()} ${t('sales.common.currency')}</span></div>
            <div class="grand"><span>${t('sales.common.total')}</span><span>${total.toLocaleString()} ${t('sales.common.currency')}</span></div>
        </div>
    </div>
</body>
</html>`;
    };

    const handleExportPDF = async () => {
        const filename = getSafeFilename();
        try {
            const html = getInvoicePdfHtml();
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;height:1200px;border:0;visibility:hidden;';
            document.body.appendChild(iframe);
            const doc = iframe.contentWindow?.document;
            if (!doc) {
                document.body.removeChild(iframe);
                alert(t('sales.invoices.pdf_capture_failed') || 'Could not capture the invoice. Try again or use Print instead.');
                return;
            }
            doc.open();
            doc.write(html);
            doc.close();
            await new Promise((resolve) => {
                if (iframe.contentWindow?.document.readyState === 'complete') {
                    resolve();
                } else {
                    iframe.onload = () => resolve();
                    setTimeout(resolve, 300);
                }
            });
            const target = doc.getElementById('invoice-pdf-root') || doc.body;
            let canvas;
            try {
                canvas = await html2canvas(target, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: false,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: 800,
                    windowHeight: target.scrollHeight || 1200,
                    width: 800,
                    height: Math.max(target.scrollHeight || 1200, 400)
                });
            } catch (captureErr) {
                console.error('html2canvas error:', captureErr);
                document.body.removeChild(iframe);
                alert(t('sales.invoices.pdf_capture_failed') || 'Could not capture the invoice. Try again or use Print instead.');
                return;
            }
            document.body.removeChild(iframe);
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                alert(t('sales.invoices.pdf_empty') || 'Could not capture invoice content. Try again.');
                return;
            }
            let imgData;
            try {
                imgData = canvas.toDataURL('image/png', 1.0);
            } catch (dataUrlErr) {
                console.error('toDataURL error:', dataUrlErr);
                alert(t('sales.invoices.pdf_tainted') || 'Export failed (image restriction). Try without external images.');
                return;
            }
            if (!imgData || imgData.length < 100) {
                alert(t('sales.common.error_message') || 'Failed to generate PDF image');
                return;
            }
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            let imgProps;
            try {
                imgProps = pdf.getImageProperties(imgData);
            } catch (propErr) {
                console.error('getImageProperties error:', propErr);
                alert(t('sales.common.error_message') || 'Invalid image data. Try again.');
                return;
            }
            const imgWidthMm = pageW;
            const imgHeightMm = (imgProps.height * pageW) / imgProps.width;
            try {
                if (imgHeightMm <= pageH) {
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
                } else {
                    const totalPages = Math.ceil(imgHeightMm / pageH);
                    const sliceHeightPx = Math.floor(canvas.height / totalPages);
                    for (let p = 0; p < totalPages; p++) {
                        if (p > 0) pdf.addPage();
                        const srcY = Math.min(p * sliceHeightPx, canvas.height - 1);
                        const srcH = p === totalPages - 1 ? canvas.height - srcY : sliceHeightPx;
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = canvas.width;
                        tempCanvas.height = srcH;
                        const ctx = tempCanvas.getContext('2d');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
                        const pageData = tempCanvas.toDataURL('image/png', 1.0);
                        pdf.addImage(pageData, 'PNG', 0, 0, imgWidthMm, pageH);
                    }
                }
            } catch (addImageErr) {
                console.error('addImage error:', addImageErr);
                alert(t('sales.common.error_message') || 'Failed to create PDF. Try again.');
                return;
            }
            triggerPdfDownload(pdf, filename);
        } catch (error) {
            console.error('PDF export error:', error);
            const msg = error?.message || t('sales.common.error_message') || 'Failed to save PDF. Try again.';
            alert(msg);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `${t('sidebar.invoices')} ${invoice.transactionNumber || invoice.invoiceNumber}`,
            text: `${t('sales.common.client')}: ${invoice.contact?.name || invoice.clientName}`,
            url: window.location.href
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.error(err); }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert(t('sales.common.link_copied') || 'Link copied!');
            } catch (err) { console.error(err); }
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        setNewAttachmentFiles(prev => [...prev, ...files]);
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files || []);
        setNewAttachmentFiles(prev => [...prev, ...files]);
    };

    const handleDragOver = (e) => e.preventDefault();

    const removeNewFile = (index) => {
        setNewAttachmentFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveClick = async () => {
        const formData = new FormData();
        formData.append('transactionNumber', invoice.transactionNumber || invoice.invoiceNumber || '');
        formData.append('contact', invoice.contact?._id || invoice.contact || '');
        formData.append('issueDate', invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '');
        formData.append('dueDate', invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '');
        formData.append('paymentMethod', invoice.paymentMethod || 'cash');
        formData.append('paidAmount', String(invoice.paidAmount ?? 0));
        formData.append('notes', notes);
        formData.append('warehouse', invoice.warehouse || 'main');
        formData.append('generalDiscountPercent', String(invoice.generalDiscountPercent ?? invoice.generalDiscount ?? 0));

        const mappedItems = items.map(it => ({
            product: it.product || undefined,
            productName: it.productName || '',
            quantity: Number(it.quantity) || 0,
            unitPrice: Number(it.unitPrice) || 0,
            discountPercent: Number(it.discountPercent) || 0,
            discountAmount: Number(it.discountAmount) || 0,
            taxPercent: Number(it.taxPercent) || 0
        }));
        formData.append('items', JSON.stringify(mappedItems));

        newAttachmentFiles.forEach(f => formData.append('attachments', f));

        if (onSave) await onSave(formData, { stayOnDetails: true });
    };

    const handleDeleteClick = () => {
        if (window.confirm(t('sales.common.confirm_delete'))) onDelete(invoice._id);
    };

    const paymentStatusLabel = invoice.status === 'paid' ? t('sales.common.paid') : invoice.status === 'partially_paid' ? t('sales.common.partial') : t('sales.common.unpaid');
    const isPaid = invoice.status === 'paid';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col font-sans" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                    <h2 className="text-lg font-black text-gray-800 tracking-tight">{viewTitle}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDeleteClick} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors" title={t('sales.common.delete')}>
                            <Trash2 size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white border-b border-gray-100 px-6 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex gap-8">
                        {[
                            { id: 'invoice', label: t('sales.invoices.invoice_tab'), icon: <FileText size={16} /> },
                            { id: 'payments', label: t('sales.invoices.payments_tab'), icon: <CreditCard size={16} /> },
                            { id: 'inventory', label: t('sales.invoices.inventory_movements_tab'), icon: <Package size={16} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 px-1 text-xs font-black uppercase tracking-widest border-b-2 -mb-px ${activeTab === tab.id ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1.5 text-[10px] font-black rounded-full ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {t('sales.invoices.payment_status')}: {paymentStatusLabel}
                        </span>
                        <span className="px-3 py-1.5 text-[10px] font-black rounded-full bg-green-100 text-green-700">
                            {t('sales.invoices.inventory_movement_status')}: {t('sales.common.delivered')}
                        </span>
                        <button onClick={handleExportPDF} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg" title="PDF"><Download size={18} /></button>
                        <button onClick={handlePrint} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg" title="Print"><Printer size={18} /></button>
                        <button onClick={handleShare} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg" title="Share"><Share2 size={18} /></button>
                        <span className="px-3 py-1.5 text-[10px] font-black rounded-full bg-green-100 text-green-700">
                            {t('sales.common.status')}: {t('sales.invoices.status_issued')}
                        </span>
                        <span className="text-[10px] font-black text-gray-500">{t('sales.invoices.responsible')}: {responsibleName}</span>
                    </div>
                </div>

                <div ref={invoiceRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                    {activeTab === 'invoice' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.invoices.user_label')}</label>
                                    <p className="text-sm font-bold text-gray-800">{responsibleName}</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.invoices.journal_entry_number')}</label>
                                    <p className="text-sm font-bold text-gray-800">{journalEntryNumber}</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.invoices.issue_date')}</label>
                                    <p className="text-sm font-bold text-gray-800">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') : '—'}</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.invoices.due_date')}</label>
                                    <p className="text-sm font-bold text-gray-800">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') : '—'}</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.invoices.number_label')}</label>
                                    <p className="text-sm font-bold text-gray-800">{invoice.transactionNumber || invoice.invoiceNumber || '—'}</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('sales.invoices.client_required')}</label>
                                    <p className="text-sm font-bold text-gray-800">{clientDisplay || '—'}</p>
                                </div>
                            </div>

                            {/* Editable items table */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <table className="w-full text-sm border-collapse">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className={`px-4 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-500 uppercase`}>{t('sales.common.product')}</th>
                                            <th className={`px-4 py-3 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-500 uppercase`}>{t('sales.common.description')}</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-black text-gray-500 uppercase w-20">{t('sales.common.quantity')}</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-black text-gray-500 uppercase w-24">{t('sales.common.price')}</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-black text-gray-500 uppercase w-24">{t('sales.common.discount')}</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-black text-gray-500 uppercase w-20">{t('sales.invoices.tax_label')}</th>
                                            <th className={`px-4 py-3 text-${i18n.language === 'ar' ? 'left' : 'right'} text-[10px] font-black text-gray-500 uppercase w-28`}>{t('sales.common.total')}</th>
                                            <th className="px-4 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={item.product || ''}
                                                        onChange={(e) => updateItem(idx, 'product', e.target.value)}
                                                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm font-bold text-gray-800 bg-white"
                                                    >
                                                        <option value="">{t('sales.common.select')}</option>
                                                        {products.map(p => (
                                                            <option key={p._id} value={p._id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2 text-gray-500">—</td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm font-bold text-center"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                                                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm font-bold text-center"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.discountPercent || ''}
                                                        onChange={(e) => updateItem(idx, 'discountPercent', e.target.value)}
                                                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm font-bold text-center"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.taxPercent || ''}
                                                        onChange={(e) => updateItem(idx, 'taxPercent', e.target.value)}
                                                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm font-bold text-center"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className={`px-4 py-2 text-${i18n.language === 'ar' ? 'left' : 'right'} font-black text-gray-800`}>
                                                    {calculateItemTotal(item).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button type="button" onClick={() => removeItem(idx)} disabled={items.length <= 1} className="text-gray-400 hover:text-red-500 disabled:opacity-30">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="bg-indigo-50 border-t border-indigo-100 py-3 flex justify-center">
                                    <button type="button" onClick={addItem} className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest hover:text-indigo-700">
                                        <Plus size={18} />
                                        {t('sales.invoices.add')}
                                    </button>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-2">
                                <div className="flex justify-between text-sm font-bold text-gray-600">
                                    <span>{t('sales.common.subtotal')}</span>
                                    <span>{subtotal.toLocaleString()} {t('sales.common.currency')}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-gray-600">
                                    <span>{t('sales.invoices.vat_14')}</span>
                                    <span>{totalTax.toLocaleString()} {t('sales.common.currency')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold text-gray-800 pt-2 border-t border-gray-200">
                                    <span>{t('sales.common.total')}</span>
                                    <span className="text-xl font-black text-indigo-600">{total.toLocaleString()} {t('sales.common.currency')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-bold text-gray-600 pt-1">
                                    <span>{t('sales.invoices.invoice_level_discount')}</span>
                                    <span>{invoice.generalDiscountPercent ?? invoice.generalDiscount ?? 0} %</span>
                                </div>
                            </div>

                            {/* Attachments | Information */}
                            <div>
                                <div className="flex gap-6 border-b border-gray-200 mb-4">
                                    <button
                                        onClick={() => setAttachmentTab('attachments')}
                                        className={`pb-3 px-1 text-xs font-black uppercase tracking-widest border-b-2 -mb-px ${attachmentTab === 'attachments' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent'}`}
                                    >
                                        {t('sales.common.attachments')}
                                    </button>
                                    <button
                                        onClick={() => setAttachmentTab('information')}
                                        className={`pb-3 px-1 text-xs font-black uppercase tracking-widest border-b-2 -mb-px ${attachmentTab === 'information' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent'}`}
                                    >
                                        {t('sales.invoices.information_tab')}
                                    </button>
                                </div>
                                {attachmentTab === 'attachments' && (
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center w-full py-10 px-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                                    >
                                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
                                        <Upload size={28} className="text-gray-400 mb-2" />
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('sales.invoices.drag_drop_attachments')}</p>
                                        {(invoice.attachments?.length > 0 || newAttachmentFiles.length > 0) && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {(invoice.attachments || []).map((f, i) => (
                                                    <span key={`e-${i}`} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600">{f.fileName}</span>
                                                ))}
                                                {newAttachmentFiles.map((f, i) => (
                                                    <span key={`n-${i}`} className="px-2 py-1 bg-indigo-50 border border-indigo-200 rounded text-xs font-bold text-indigo-700 flex items-center gap-1">
                                                        {f.name}
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); removeNewFile(i); }} className="text-red-500 hover:text-red-700">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {attachmentTab === 'information' && (
                                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full min-h-[100px] text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder={t('sales.common.notes')}
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'payments' && (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <CreditCard size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm font-bold text-gray-400">{t('sales.common.no_payments')}</p>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Package size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm font-bold text-gray-400">{t('sales.invoices.inventory_movements_tab')}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 border-2 border-gray-200 text-gray-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors">
                        {t('sales.common.cancel')}
                    </button>
                    <button onClick={handleSaveClick} disabled={loading} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
                        {loading ? t('sales.common.saving') : t('sales.invoices.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetails;
