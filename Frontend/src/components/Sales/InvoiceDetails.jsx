import React, { useState } from 'react';
import { X, Printer, Share2, Download, FileText, Package, CreditCard, ChevronDown, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InvoiceDetails = ({ invoice, onClose, onEdit, onDelete, i18n }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('invoice');

    if (!invoice) return null;

    const balance = (invoice.total || 0) - (invoice.paidAmount || 0);

    const calculateItemTotal = (item) => {
        let itemTotal = item.quantity * item.price;
        if (item.discountType === '%') {
            itemTotal *= (1 - item.discount / 100);
        } else {
            itemTotal -= item.discount;
        }
        if (item.tax > 0) {
            itemTotal *= (1 + item.tax / 100);
        }
        return itemTotal;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col font-sans" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 text-[10px] font-black rounded-full shadow-sm ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                            invoice.status === 'unpaid' ? 'bg-red-100 text-red-700' :
                                invoice.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-600'
                            }`}>
                            {t(`sales.common.${invoice.status || 'unpaid'}`)}
                        </span>
                        <h2 className="text-lg font-black text-gray-800 tracking-tight">{t('sales.invoices.view_invoice')}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (window.confirm(t('sales.common.confirm_delete'))) {
                                    onDelete(invoice._id);
                                }
                            }}
                            className="p-2 text-gray-300 hover:text-red-500 border-2 border-transparent hover:border-red-50 transition-all rounded-lg"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button className="p-2 text-gray-300 hover:text-indigo-600 border-2 border-transparent hover:border-indigo-50 transition-all rounded-lg">
                            <Share2 size={20} />
                        </button>
                        <button className="p-2 text-gray-300 hover:text-indigo-600 border-2 border-transparent hover:border-indigo-50 transition-all rounded-lg">
                            <Printer size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-300 hover:text-gray-600 border-2 border-transparent hover:border-gray-50 transition-all rounded-lg ml-2">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white border-b border-gray-100 px-6">
                    <div className="flex gap-10">
                        {[
                            { id: 'invoice', label: t('sidebar.invoices'), icon: <FileText size={16} /> },
                            { id: 'payments', label: t('sidebar.payments'), icon: <CreditCard size={16} /> },
                            { id: 'inventory', label: t('sidebar.inventory'), icon: <Package size={16} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 px-1 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-300 hover:text-gray-500'
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {activeTab === 'invoice' && (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-indigo-50/20 border border-indigo-50 rounded-2xl p-5 transition-all hover:shadow-md hover:shadow-indigo-50/50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.common.client')}</p>
                                    <p className="text-sm font-black text-indigo-600 truncate">{invoice.clientName || 'N/A'}</p>
                                </div>
                                <div className="bg-indigo-50/20 border border-indigo-50 rounded-2xl p-5 transition-all hover:shadow-md hover:shadow-indigo-50/50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.common.status')}</p>
                                    <p className={`text-sm font-black ${invoice.status === 'paid' ? 'text-green-600' :
                                        invoice.status === 'unpaid' ? 'text-red-500' :
                                            'text-amber-500'
                                        }`}>{t(`sales.common.${invoice.status || 'unpaid'}`)}</p>
                                </div>
                                <div className="bg-indigo-50/20 border border-indigo-50 rounded-2xl p-5 transition-all hover:shadow-md hover:shadow-indigo-50/50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.common.warehouse')}</p>
                                    <p className="text-sm font-black text-gray-700">{invoice.warehouse || t('sales.common.main_warehouse')}</p>
                                </div>
                                <div className="bg-indigo-50/20 border border-indigo-50 rounded-2xl p-5 transition-all hover:shadow-md hover:shadow-indigo-50/50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.invoices.paid_amount')}</p>
                                    <p className="text-sm font-black text-indigo-600 tracking-tight">{invoice.paidAmount?.toLocaleString() || '0'} {t('sales.common.currency')}</p>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 rounded-2xl p-6 border border-gray-50">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.invoices.invoice_number')}</p>
                                    <p className="text-sm font-bold text-gray-700">{invoice.invoiceNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.invoices.issue_date')}</p>
                                    <p className="text-sm font-bold text-gray-700">{new Date(invoice.issueDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('sales.invoices.due_date')}</p>
                                    <p className="text-sm font-bold text-gray-700">{new Date(invoice.dueDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50/50 border-b border-gray-50">
                                        <tr>
                                            <th className={`px-4 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.product')}</th>
                                            <th className={`px-4 py-4 text-${i18n.language === 'ar' ? 'right' : 'left'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.description')}</th>
                                            <th className="px-4 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('sales.common.quantity')}</th>
                                            <th className="px-4 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('sales.common.price')}</th>
                                            <th className="px-4 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('sales.common.discount')}</th>
                                            <th className="px-4 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('sales.common.tax')}</th>
                                            <th className={`px-4 py-4 text-${i18n.language === 'ar' ? 'left' : 'right'} text-[10px] font-black text-gray-400 uppercase tracking-widest`}>{t('sales.common.total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {invoice.items?.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-4 py-5 font-bold text-gray-700">{item.productName}</td>
                                                <td className="px-4 py-5 text-gray-400 font-medium">{item.description || '-'}</td>
                                                <td className="px-4 py-5 text-center font-bold text-gray-500">{item.quantity}</td>
                                                <td className="px-4 py-5 text-center font-bold text-gray-500">{item.price?.toLocaleString()}</td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className="text-[10px] font-black bg-red-50 text-red-400 px-1.5 py-0.5 rounded">
                                                        {item.discount > 0 ? `${item.discount}${item.discountType === '%' ? '%' : ''}` : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-5 text-center font-bold text-gray-400">
                                                    {item.tax > 0 ? `${item.tax}%` : '-'}
                                                </td>
                                                <td className={`px-4 py-5 text-${i18n.language === 'ar' ? 'left' : 'right'} font-black text-gray-800`}>
                                                    {calculateItemTotal(item).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals and Notes */}
                            <div className="flex flex-col md:flex-row gap-10">
                                <div className="flex-1 space-y-6">
                                    <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{t('sales.common.notes')}</p>
                                        <p className="text-sm text-gray-600 leading-relaxed font-bold italic">
                                            {invoice.notes || t('sales.common.none')}
                                        </p>
                                    </div>
                                    <div className="bg-indigo-50/30 border-2 border-dashed border-indigo-100/50 rounded-2xl p-8 text-center group cursor-pointer hover:bg-indigo-50/50 transition-all">
                                        <div className="mx-auto w-12 h-12 bg-white rounded-2xl shadow-sm shadow-indigo-100 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                            <Download size={24} />
                                        </div>
                                        <p className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest">{t('sales.common.attachments')}</p>
                                        <p className="text-[10px] font-black text-indigo-300 mt-1 uppercase">{(invoice.attachments?.length || 0) > 0 ? `${invoice.attachments.length} ${t('sales.common.files')}` : t('sales.common.none')}</p>
                                    </div>
                                </div>
                                <div className="w-full md:w-80 space-y-4">
                                    <div className="flex justify-between items-center text-gray-400 text-xs font-bold italic px-2">
                                        <span>{t('sales.common.subtotal')}</span>
                                        <span>{invoice.subtotal?.toLocaleString()} {t('sales.common.currency')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-400 text-xs font-bold italic px-2">
                                        <span>{t('sales.common.tax')}</span>
                                        <span>{invoice.tax?.toLocaleString()} {t('sales.common.currency')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-red-300 text-xs font-bold italic px-2">
                                        <span>{t('sales.common.discount')}</span>
                                        <span>-{invoice.discount?.toLocaleString() || '0'} {t('sales.common.currency')}</span>
                                    </div>
                                    <div className="pt-6 mt-6 border-t-2 border-dashed border-indigo-50 flex justify-between items-center px-2">
                                        <span className="text-sm font-black text-gray-800 uppercase tracking-widest">{t('sales.common.total')}</span>
                                        <span className="text-3xl font-black text-indigo-600 tracking-tighter">{invoice.total?.toLocaleString()} {t('sales.common.currency')}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'payments' && (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto text-gray-300 mb-4">
                                <CreditCard size={32} />
                            </div>
                            <p className="text-gray-400 font-bold">{t('sales.common.no_payments')}</p>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto text-gray-300 mb-4">
                                <Package size={32} />
                            </div>
                            <p className="text-gray-400 font-bold">{t('stocked.operations.no_operations')}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border-2 border-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                        {t('sales.common.cancel')}
                    </button>
                    <button
                        onClick={() => onEdit(invoice)}
                        className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        {t('sales.common.edit')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetails;
