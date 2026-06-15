import React from 'react';
import { Building2, MapPin, Phone, Mail } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/currencyFormatter';
import { generateZatcaQR } from '../../utils/zatca';
import PrintHeader from '../common/PrintHeader';

/**
 * Reusable invoice layout: company header, client card, items table, summary box, QR bottom-right.
 * Used for view/print and matches the invoice design (sales / purchase / return / quote).
 */
const InvoiceLayout = ({
    invoice,
    type = 'sales',
    title,
    companyName: propCompanyName,
    companyLogoUrl: propCompanyLogoUrl,
    dir = 'ltr'
}) => {
    const { t, i18n } = useTranslation();
    const isRTL = dir === 'rtl' || i18n.language === 'ar';
    const currency = invoice?.currency || 'EGP';

    // Priority: Invoice Snapshot > Props > Default
    const compSnapshot = invoice?.companySnapshot || {};
    const companyDisplayName = compSnapshot.name || propCompanyName || 'Dafater';
    const companyDisplayLogo = compSnapshot.logo || propCompanyLogoUrl;

    const activeContactSnapshot = invoice?.contactSnapshot || {};
    const activeContactObj = invoice?.contact || {};
    const contactName = activeContactSnapshot.name || activeContactObj.name || t('sales.common.unknown_client');
    const contactEmail = activeContactSnapshot.email || activeContactObj.email || 'N/A';
    const contactPhone = activeContactSnapshot.phone || activeContactObj.phone || 'N/A';
    const contactTaxNumber = activeContactSnapshot.taxNumber || activeContactSnapshot.tax_number || activeContactObj.taxNumber || activeContactObj.tax_number || '';
    const contactCR = activeContactSnapshot.commercialRegister || activeContactSnapshot.commercialRegNumber || activeContactSnapshot.commercial_register || activeContactSnapshot.commercialReg || activeContactObj.commercialRegister || activeContactObj.commercialRegNumber || activeContactObj.commercial_register || activeContactObj.commercialReg || '';

    const addressObj = activeContactSnapshot.address || activeContactObj.address;
    const contactAddress = addressObj
        ? (addressObj.address1 || addressObj.city || (typeof addressObj === 'string' ? addressObj : ''))
        : 'N/A';

    const qrValue = generateZatcaQR(
        companyDisplayName,
        compSnapshot.taxNumber || compSnapshot.tax_number || '',
        invoice?.issueDate ? new Date(invoice.issueDate).toISOString() : new Date().toISOString(),
        (invoice?.totalAmount || 0).toFixed(2),
        (invoice?.totalTax || 0).toFixed(2)
    );
    const fmt2 = (v) => Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-10 max-w-4xl mx-auto print:shadow-none print:border-none print:rounded-none" dir={dir}>
            {/* Company Logo + Name & Invoice Header */}
            <PrintHeader
                title={title}
                isRTL={isRTL}
                companyInfo={compSnapshot}
                rightContent={
                    <div className="mt-4 space-y-1">
                        <p className="text-lg font-bold text-gray-800 text-start">#{invoice?.transactionNumber}</p>
                        <p className="text-xs font-bold text-gray-500 text-start">
                            <span className="text-gray-400 uppercase tracking-widest mr-2">{t('sales.invoices.issue_date')}:</span>
                            {invoice?.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '—'}
                        </p>
                        <p className="text-xs font-bold text-gray-500 text-start">
                            <span className="text-gray-400 uppercase tracking-widest mr-2">{t('sales.invoices.due_date')}:</span>
                            {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
                        </p>
                    </div>
                }
            />

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
                                <div className="flex flex-col gap-1 items-start mt-1 mb-1">
                                    {contactTaxNumber && (
                                        <p className="text-[10px] text-indigo-500 font-black tracking-wider bg-indigo-50 px-1 py-0.5 rounded-sm inline-block">
                                            VAT: {contactTaxNumber}
                                        </p>
                                    )}
                                    {contactCR && (
                                        <p className="text-[10px] text-indigo-500 font-black tracking-wider bg-indigo-50 px-1 py-0.5 rounded-sm inline-block">
                                            CR: {contactCR}
                                        </p>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                                    ID: {invoice?.contact?._id?.toString().slice(-6) || '---'}
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
                        <th className={`py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('sales.common.description', 'Description')}
                        </th>
                        <th className="py-4 px-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {t('sales.common.qty')}
                        </th>
                        <th className="py-4 px-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {t('sales.invoices.price')}
                        </th>
                        <th className="py-4 px-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {t('sales.common.disc')}
                        </th>
                        <th className={`py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isRTL ? 'text-left rounded-l-lg' : 'text-right rounded-r-lg'}`}>
                            {t('sales.common.total')}
                        </th>
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
                                <td className="py-4 px-4">
                                    <p className={`text-xs text-gray-500 whitespace-pre-wrap ${isRTL ? 'text-right' : 'text-left'}`}>
                                        {item.description || '—'}
                                    </p>
                                </td>
                                <td className="py-4 px-4 text-center text-sm font-medium text-gray-600">{fmt2(item.quantity)}</td>
                                <td className="py-4 px-4 text-center text-sm font-medium text-gray-600">{fmt2(item.unitPrice)}</td>
                                <td className="py-4 px-4 text-center text-xs font-bold text-red-400">
                                    {discount > 0 ? `-${fmt2(discount)}` : '—'}
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
