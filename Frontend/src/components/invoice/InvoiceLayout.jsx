import React from 'react';
import { Building2, MapPin, Phone, Mail } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/currencyFormatter';

/**
 * Reusable invoice layout: company header, client card, items table, summary box, QR bottom-right.
 * Used for view/print and matches the invoice design (sales / purchase / return / quote).
 */
const InvoiceLayout = ({
    invoice,
    type = 'sales',
    title,
    companyName = 'Dafater',
    companyLogoUrl,
    dir = 'ltr'
}) => {
    const { t, i18n } = useTranslation();
    const isRTL = dir === 'rtl' || i18n.language === 'ar';
    const currency = invoice?.currency || 'EGP';
    const contact = invoice?.contactSnapshot || invoice?.contact;
    const contactName = contact?.name || invoice?.contact?.name || t('sales.common.unknown_client');
    const contactEmail = contact?.email || invoice?.contact?.email || 'N/A';
    const contactPhone = contact?.phone || invoice?.contact?.phone || 'N/A';
    const contactAddress = contact?.address
        ? (contact.address.address1 || contact.address.city || '')
        : (invoice?.contact?.address?.address1 || invoice?.contact?.address?.city || 'N/A');

    const qrValue = JSON.stringify({
        invoiceNumber: invoice?.transactionNumber,
        total: invoice?.totalAmount,
        company: companyName,
        date: invoice?.issueDate
    });

    return (
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-10 max-w-4xl mx-auto print:shadow-none print:border-none print:rounded-none" dir={dir}>
            {/* Company Logo + Name & Invoice Header */}
            <div className={`flex justify-between items-start mb-12 border-b border-gray-50 pb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                    <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {companyLogoUrl ? (
                            <img src={companyLogoUrl} alt={companyName} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl">
                                {companyName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                            {companyName}<span className="text-indigo-600">.App</span>
                        </h1>
                    </div>
                    <div className={`text-xs text-gray-500 space-y-1 font-medium ${isRTL ? 'text-right' : ''}`}>
                        <p>—</p>
                    </div>
                </div>
                <div className={isRTL ? 'text-left' : 'text-right'}>
                    <h2 className="text-4xl font-black text-indigo-600/10 uppercase tracking-widest mb-2">{title}</h2>
                    <p className="text-lg font-bold text-gray-800">#{invoice?.transactionNumber}</p>
                    <div className="mt-4 space-y-1">
                        <p className="text-xs font-bold text-gray-500">
                            <span className="text-gray-400 uppercase tracking-widest mr-2">{t('sales.invoices.issue_date')}:</span>
                            {invoice?.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '—'}
                        </p>
                        <p className="text-xs font-bold text-gray-500">
                            <span className="text-gray-400 uppercase tracking-widest mr-2">{t('sales.invoices.due_date')}:</span>
                            {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Client / Supplier Card */}
            <div className={`flex justify-between gap-12 mb-12 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex-1">
                    <h3 className={`text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2 ${isRTL ? 'text-right' : ''}`}>
                        {t('sales.common.bill_to')}
                    </h3>
                    <div className="space-y-3">
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                <Building2 size={14} />
                            </div>
                            <div className={isRTL ? 'text-right' : ''}>
                                <p className="text-sm font-black text-gray-800">{contactName}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    {invoice?.contact?._id?.toString().slice(-6) || '---'}
                                </p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse pl-0 pr-2' : 'pl-2'}`}>
                            <MapPin size={14} className="text-gray-300 shrink-0" />
                            <p className="text-xs text-gray-600 font-medium">{contactAddress}</p>
                        </div>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse pl-0 pr-2' : 'pl-2'}`}>
                            <Phone size={14} className="text-gray-300 shrink-0" />
                            <p className="text-xs text-gray-600 font-medium">{contactPhone}</p>
                        </div>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse pl-0 pr-2' : 'pl-2'}`}>
                            <Mail size={14} className="text-gray-300 shrink-0" />
                            <p className="text-xs text-gray-600 font-medium">{contactEmail}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="bg-gray-50">
                        <th className={`py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isRTL ? 'text-right rounded-r-lg' : 'text-left rounded-l-lg'}`}>
                            {t('sales.invoices.product')}
                        </th>
                        <th className="py-4 px-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                        <th className="py-4 px-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('sales.invoices.price')}</th>
                        <th className="py-4 px-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Disc.</th>
                        <th className={`py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isRTL ? 'text-left rounded-l-lg' : 'text-right rounded-r-lg'}`}>Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {(invoice?.items || []).map((item, index) => {
                        const total = (item.unitPrice ?? 0) * (item.quantity ?? 0);
                        const discount = item.discountPercent ? (total * item.discountPercent / 100) : (item.discountAmount || 0);
                        const final = (item.total != null ? item.total : total - discount) + (item.taxAmount || 0);
                        return (
                            <tr key={index}>
                                <td className="py-4 px-4">
                                    <p className={`text-sm font-bold text-gray-800 ${isRTL ? 'text-right' : ''}`}>
                                        {item.productName || item.product?.name || '—'}
                                    </p>
                                </td>
                                <td className="py-4 px-4 text-center text-sm font-medium text-gray-600">{item.quantity}</td>
                                <td className="py-4 px-4 text-center text-sm font-medium text-gray-600">{(item.unitPrice ?? 0).toLocaleString()}</td>
                                <td className="py-4 px-4 text-center text-xs font-bold text-red-400">
                                    {discount > 0 ? `-${discount.toLocaleString()}` : '—'}
                                </td>
                                <td className={`py-4 px-4 text-sm font-black text-gray-800 ${isRTL ? 'text-left' : 'text-right'}`}>
                                    {formatCurrency(item.total != null ? item.total : final, currency)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Summary Box (Right Side) + QR Bottom Right */}
            <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between items-end gap-8 mb-8 flex-wrap`}>
                <div className={`w-64 space-y-3 ${isRTL ? 'text-right' : ''}`}>
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                        <span>Subtotal</span>
                        <span>{formatCurrency(invoice?.subtotal ?? 0, currency)}</span>
                    </div>
                    {(invoice?.totalDiscount > 0 || invoice?.generalDiscount > 0) && (
                        <div className="flex justify-between text-xs font-bold text-red-500">
                            <span>Discount</span>
                            <span>-{formatCurrency(invoice?.totalDiscount ?? invoice?.generalDiscount ?? 0, currency)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                        <span>Tax</span>
                        <span>{formatCurrency(invoice?.totalTax ?? 0, currency)}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-sm font-black text-gray-800 uppercase tracking-widest">Total</span>
                        <span className="text-2xl font-black text-indigo-600">{formatCurrency(invoice?.totalAmount ?? 0, currency)}</span>
                    </div>
                </div>
                <div className="shrink-0 print:block">
                    <QRCodeCanvas value={qrValue} size={100} level="M" includeMargin />
                    <p className="text-[10px] text-gray-400 font-medium mt-1 text-center">QR</p>
                </div>
            </div>

            {/* Notes */}
            {invoice?.notes && (
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 italic leading-relaxed">{invoice.notes}</p>
                </div>
            )}

            {/* Footer */}
            <div className="text-center pt-8 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em]">Thank you for your business</p>
            </div>
        </div>
    );
};

export default InvoiceLayout;
