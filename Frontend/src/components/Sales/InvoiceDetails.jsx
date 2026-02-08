import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Share2, Download, Edit3, Trash2, Paperclip, FileText, Send, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../../services/api';

const InvoiceDetails = ({ invoice, onClose, onEdit, onDelete, onSave, loading, i18n, viewTitleKey, filenamePrefix }) => {
    const { t } = useTranslation();
    const viewTitle = viewTitleKey ? t(viewTitleKey) : t('sales.invoices.view_invoice');
    const fPrefix = filenamePrefix || 'Invoice';
    const [activeTab, setActiveTab] = useState('details');
    const [note, setNote] = useState('');
    const [attachment, setAttachment] = useState(null);
    const invoiceRef = useRef(null);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        // We might not strictly need this if we don't display product details that aren't in the invoice object,
        // but keeping it for consistency if it was there for some lookup.
        const fetchProducts = async () => {
            try {
                const response = await api.get('/products');
                setProducts(response.data.products || []);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };
        fetchProducts();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        const element = invoiceRef.current;
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    // Inject a style block to override oklch variables to safe hex values
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        :root {
                            --color-indigo-600: #4f46e5 !important;
                            --color-indigo-700: #4338ca !important;
                            --color-gray-800: #1f2937 !important;
                            --color-gray-900: #111827 !important;
                        }
                        * {
                            color-scheme: light !important;
                        }
                    `;
                    clonedDoc.head.appendChild(style);

                    // Manually replace any oklch color strings in computed styles
                    const allElements = clonedDoc.querySelectorAll('*');
                    allElements.forEach(el => {
                        // Force background colors if they use oklch
                        const bg = window.getComputedStyle(el).backgroundColor;
                        if (bg.includes('oklch')) {
                            el.style.backgroundColor = '#ffffff';
                        }
                        const co = window.getComputedStyle(el).color;
                        if (co.includes('oklch')) {
                            el.style.color = '#1f2937';
                        }
                    });
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${fPrefix}-${invoice.transactionNumber || 'draft'}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert(t('sales.common.error_message'));
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${fPrefix} ${invoice.transactionNumber}`,
                    text: `${fPrefix} details for ${invoice.contact?.name || 'Client'}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback
            alert('Share not supported on this browser');
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

    const contactName = invoice.contact?.name || t('sales.common.unknown_client');
    const contactEmail = invoice.contact?.email || 'N/A';
    const contactPhone = invoice.contact?.phone || 'N/A';
    const contactAddress = typeof invoice.contact?.address === 'object'
        ? (invoice.contact?.address?.address1 || invoice.contact?.address?.city || 'N/A')
        : (invoice.contact?.address || 'N/A');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:w-full print:max-w-none print:max-h-none" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                {/* Header - Not printed */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 font-sans print:hidden">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-black text-gray-800">{viewTitle}</h2>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(invoice.status)}`}>
                            {getStatusText(invoice.status)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
                            <button onClick={handlePrint} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all" title={t('sales.common.print')}>
                                <Printer size={18} />
                            </button>
                            <button onClick={handleDownloadPDF} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all" title={t('sales.common.download')}>
                                <Download size={18} />
                            </button>
                            <button onClick={handleShare} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all" title={t('sales.common.share')}>
                                <Share2 size={18} />
                            </button>
                        </div>
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        <button onClick={() => onEdit(invoice)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Edit3 size={16} />
                            <span className="hidden sm:inline">{t('sales.common.edit')}</span>
                        </button>
                        <button onClick={() => onDelete(invoice._id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">{t('sales.common.delete')}</span>
                        </button>
                        <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-gray-50/50 print:bg-white">
                    {/* Main Invoice View (Printable) */}
                    <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
                        <div ref={invoiceRef} className="bg-white shadow-sm border border-gray-100 rounded-2xl p-10 max-w-4xl mx-auto print:shadow-none print:border-none print:rounded-none">
                            {/* Invoice Header */}
                            <div className="flex justify-between items-start mb-12 border-b border-gray-50 pb-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl">D</div>
                                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dafater<span className="text-indigo-600">.App</span></h1>
                                    </div>
                                    <div className="text-xs text-gray-500 space-y-1 font-medium">
                                        <p>123 Business Street</p>
                                        <p>Cairo, Egypt</p>
                                        <p>contact@dafater.app</p>
                                    </div>
                                </div>
                                <div className={`text-${i18n.language === 'ar' ? 'left' : 'right'}`}>
                                    <h2 className="text-4xl font-black text-indigo-600/10 uppercase tracking-widest mb-2">{fPrefix}</h2>
                                    <p className="text-lg font-bold text-gray-800">#{invoice.transactionNumber}</p>
                                    <div className="mt-4 space-y-1">
                                        <p className="text-xs font-bold text-gray-500">
                                            <span className="text-gray-400 uppercase tracking-widest mr-2">{t('sales.invoices.issue_date')}:</span>
                                            {new Date(invoice.issueDate).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs font-bold text-gray-500">
                                            <span className="text-gray-400 uppercase tracking-widest mr-2">{t('sales.invoices.due_date')}:</span>
                                            {new Date(invoice.dueDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bill To / Ship To */}
                            <div className="flex justify-between gap-12 mb-12">
                                <div className="flex-1">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">{t('sales.common.bill_to')}</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <Building2 size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-800">{contactName}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Client ID: {invoice.contact?._id?.substring(0, 6) || '---'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pl-2">
                                            <MapPin size={14} className="text-gray-300" />
                                            <p className="text-xs text-gray-600 font-medium">{contactAddress}</p>
                                        </div>
                                        <div className="flex items-center gap-3 pl-2">
                                            <Phone size={14} className="text-gray-300" />
                                            <p className="text-xs text-gray-600 font-medium">{contactPhone}</p>
                                        </div>
                                        <div className="flex items-center gap-3 pl-2">
                                            <Mail size={14} className="text-gray-300" />
                                            <p className="text-xs text-gray-600 font-medium">{contactEmail}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full mb-8">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className={`py-4 px-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-l-lg`}>Description</th>
                                        <th className="py-4 px-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                                        <th className="py-4 px-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                                        <th className="py-4 px-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Disc.</th>
                                        <th className={`py-4 px-4 text-${i18n.language === 'ar' ? 'left' : 'right'} text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-r-lg`}>Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(invoice.items || []).map((item, index) => {
                                        const total = item.unitPrice * item.quantity; // Adjust logic if needed for discounts
                                        // But wait, the backend probably gives us calculated totals? 
                                        // Or we calculate. Let's calculate for display consistency.
                                        const discount = item.discountPercent ? (total * item.discountPercent / 100) : (item.discountAmount || 0);
                                        const final = total - discount;
                                        return (
                                            <tr key={index}>
                                                <td className="py-4 px-4">
                                                    <p className="text-sm font-bold text-gray-800">{item.productName || item.product?.name}</p>
                                                </td>
                                                <td className="py-4 px-4 text-center text-sm font-medium text-gray-600">{item.quantity}</td>
                                                <td className="py-4 px-4 text-center text-sm font-medium text-gray-600">{item.unitPrice?.toLocaleString()}</td>
                                                <td className="py-4 px-4 text-center text-xs font-bold text-red-400">
                                                    {discount > 0 ? `-${discount.toLocaleString()}` : '-'}
                                                </td>
                                                <td className={`py-4 px-4 text-${i18n.language === 'ar' ? 'left' : 'right'} text-sm font-black text-gray-800`}>
                                                    {final.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div className="flex justify-end mb-12">
                                <div className="w-64 space-y-3">
                                    <div className="flex justify-between text-xs font-medium text-gray-500">
                                        <span>Subtotal</span>
                                        <span>{(invoice.totalAmount + (invoice.generalDiscount || 0)).toLocaleString()}</span> {/* Just an estimate if fields missing */}
                                    </div>
                                    {/* Backend usually provides these totals, but if not we can recalculate. 
                                        However, assuming invoice object has `totalAmount`. */}
                                    {(invoice.generalDiscount > 0 || invoice.generalDiscountPercent > 0) && (
                                        <div className="flex justify-between text-xs font-bold text-red-500">
                                            <span>Discount</span>
                                            <span>-{invoice.generalDiscount?.toLocaleString() || '0'}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xs font-medium text-gray-500">
                                        <span>Tax</span>
                                        <span>{(invoice.totalTax || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-sm font-black text-gray-800 uppercase tracking-widest">Total</span>
                                        <span className="text-2xl font-black text-indigo-600">{invoice.totalAmount?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {invoice.notes && (
                                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notes</h4>
                                    <p className="text-sm text-gray-600 italic leading-relaxed">{invoice.notes}</p>
                                </div>
                            )}

                            {/* Footer Clean */}
                            <div className="text-center pt-8 border-t border-gray-50">
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em]">Thank you for your business</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar (Details & History) - Hidden on print */}
                    <div className="w-full md:w-80 bg-white border-l border-gray-100 p-6 flex flex-col gap-6 print:hidden h-full overflow-y-auto">

                        {/* Attachments Section */}
                        <div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Paperclip size={14} />
                                <span>Attachments</span>
                            </h3>
                            <div className="space-y-3">
                                {(invoice.attachments || []).map((file, i) => (
                                    <a href={file.url} target="_blank" rel="noreferrer" key={i} className="block p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 group-hover:text-indigo-500 shadow-sm">
                                                <FileText size={16} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-gray-700 truncate group-hover:text-indigo-700">{file.fileName}</p>
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
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetails;
