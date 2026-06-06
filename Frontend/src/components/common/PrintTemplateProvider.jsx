import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import api, { BASE_URL } from '../../services/api';
import { formatCurrency } from '../../utils/currencyFormatter';
import { useAuth } from '../../context/AuthContext';
import { generateZatcaQR } from '../../utils/zatca';
import {
    setPrintTemplateRequestHandler,
    getSavedPrintTemplate,
    setSavedPrintTemplate,
    PRINT_TEMPLATE_OPTIONS,
    normalizePrintTemplate,
    requestPrintTemplateSelection
} from '../../services/printTemplateService';
import InvoiceTaxBilingual from '../invoice/invoicetaxbilingual';

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value, isRTL) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US');
};

const resolveTransactionFromResponse = (payload) =>
    payload?.data?.transaction || payload?.transaction || payload?.data || payload || null;

const getCompanyLogoUrl = (logoPath) => {
    if (!logoPath || typeof logoPath !== 'string') return '';
    return logoPath.startsWith('http') ? logoPath : `${BASE_URL}${logoPath}`;
};

const resolveEntityAddress = (entity) => {
    if (!entity || typeof entity !== 'object') return '—';
    const address = entity.address;
    if (typeof address === 'string' && address.trim()) return address;
    if (address && typeof address === 'object') {
        const parts = [address.address1, address.city, address.state, address.country].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
    }
    return (
        entity.location ||
        entity.city ||
        entity.address1 ||
        (typeof entity.address === 'string' ? entity.address : null) ||
        '—'
    );
};

const SAMPLE_DATA = {
    transactionNumber: 'DOC-0000-X',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    currency: 'SAR',
    contact: {
        name: 'عميل / Customer',
        phone: '—',
        address: { city: '—' }
    },
    items: [],
    subtotal: 0,
    totalTax: 0,
    totalAmount: 0,
};

const resolveCompanyInfo = ({ companySettings, user, requestMeta }) => {
    const fromMeta = requestMeta?.companyInfo || {};
    const rawAddress =
        fromMeta.address ||
        companySettings?.address ||
        companySettings?.location ||
        companySettings?.city ||
        user?.address ||
        '—';

    let address = '—';
    if (typeof rawAddress === 'string') {
        address = rawAddress;
    } else if (rawAddress && typeof rawAddress === 'object') {
        const parts = [rawAddress.address1, rawAddress.city, rawAddress.state, rawAddress.country].filter(Boolean);
        address = parts.length > 0 ? parts.join(', ') : '—';
    }

    return {
        name:
            fromMeta.company_name ||
            fromMeta.name ||
            companySettings?.company_name ||
            user?.name ||
            '—',
        logoPath: fromMeta.logo_path || companySettings?.logo_path || user?.logo_path || '',
        taxNumber:
            fromMeta.tax_number ||
            fromMeta.taxNumber ||
            companySettings?.tax_number ||
            user?.taxNumber ||
            '—',
        commercialRegister:
            fromMeta.commercial_register ||
            fromMeta.commercialRegister ||
            companySettings?.commercial_register ||
            user?.commercialRegister ||
            '—',
        address,
        currency: companySettings?.currency || 'SAR',
    };
};

const buildLines = (invoice) => {
    const source = Array.isArray(invoice?.items) ? invoice.items : [];
    return source.map((item) => {
        const qty = toNumber(item?.quantity);
        const unitPrice = toNumber(item?.unitPrice ?? item?.price);
        const base = qty * unitPrice;
        const discount = toNumber(item?.discountAmount) + (base * toNumber(item?.discountPercent) / 100);
        const taxable = Math.max(0, base - discount);
        const taxAmount = item?.taxAmount != null ? toNumber(item.taxAmount) : (taxable * toNumber(item?.taxRate ?? item?.taxPercent) / 100);
        const total = item?.total != null ? toNumber(item.total) : taxable + taxAmount;
        return {
            name: item?.productName || item?.product?.name || '—',
            description: item?.description || '',
            qty,
            unitPrice,
            taxAmount,
            total,
        };
    });
};

const ModalPreview = ({ template, invoice, company, loading, isRTL, t, isQuotation, isPurchaseRequest }) => {
    if (loading) {
        return (
            <div className="h-full min-h-[360px] flex items-center justify-center bg-white rounded-lg border border-gray-200">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            </div>
        );
    }

    const activeInvoice = invoice || SAMPLE_DATA;

    const currency = activeInvoice?.currency || company?.currency || 'SAR';
    const logoUrl = getCompanyLogoUrl(company?.logoPath);
    const contact = activeInvoice?.contactSnapshot || activeInvoice?.contact || {};
    const lines = buildLines(activeInvoice);
    const subtotalFromLines = lines.reduce((sum, line) => sum + (line.total - line.taxAmount), 0);
    const taxFromLines = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const subtotal = activeInvoice?.subtotal != null ? toNumber(activeInvoice.subtotal) : subtotalFromLines;
    const taxAmount = activeInvoice?.totalTax != null ? toNumber(activeInvoice.totalTax) : taxFromLines;
    const grandTotal = activeInvoice?.totalAmount != null ? toNumber(activeInvoice.totalAmount) : subtotal + taxAmount;
    const qrValue = generateZatcaQR(
        company?.name,
        company?.taxNumber,
        activeInvoice?.issueDate ? new Date(activeInvoice.issueDate).toISOString() : new Date().toISOString(),
        grandTotal.toFixed(2),
        taxAmount.toFixed(2)
    );

    if (template === 'thermal') {
        return (
            <div className="h-full max-h-[68vh] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mx-auto w-[304px] bg-white border border-gray-300 shadow-sm p-3 text-[11px] leading-5" dir="rtl">
                    <div className="text-center border-b border-dashed border-gray-300 pb-2">
                        {logoUrl ? <img src={logoUrl} alt={company?.name || 'Company'} className="h-10 mx-auto mb-1 object-contain" /> : null}
                        <p className="font-bold text-[12px]">{company?.name}</p>
                        <p>
                            {isQuotation ? t('sales.quotations.quotation_number', 'رقم عرض السعر') :
                                isPurchaseRequest ? t('purchases.requests.request_number', 'رقم طلب الشراء') :
                                    t('sales.invoices.invoice_number', 'رقم الفاتورة')}: {activeInvoice?.transactionNumber || '—'}
                        </p>
                        <p>{t('sales.invoices.issue_date', 'تاريخ الفاتورة')}: {formatDate(activeInvoice?.issueDate, isRTL)}</p>
                        <p className="font-semibold mt-1">
                            {isQuotation ? t('sales.quotations.title', 'عرض سعر') :
                                isPurchaseRequest ? t('purchases.requests.title', 'طلب شراء') :
                                    t('sales_settings.template_arabic_thermal', 'فاتورة طابعة حرارية')}
                        </p>
                    </div>

                    <div className="py-2 border-b border-dashed border-gray-300">
                        <p><span className="font-semibold">{t('sales.common.seller', 'البائع')}:</span> {company?.name}</p>
                        <p><span className="font-semibold">{t('sales.common.tax_number', 'الرقم الضريبي')}:</span> {company?.taxNumber || '—'}</p>
                        <p><span className="font-semibold">{t('sales.common.buyer', 'المشتري')}:</span> {contact?.name || '—'}</p>
                        <p><span className="font-semibold">{t('sales.common.tax_number', 'الرقم الضريبي')}:</span> {contact?.taxNumber || contact?.tax_number || '—'}</p>
                    </div>

                    <div className="py-2 space-y-1 border-b border-dashed border-gray-300">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-1 text-[10px] font-semibold text-gray-500">
                            <span>{t('sales.common.description', 'الوصف')}</span>
                            <span>{t('sales.common.qty', 'ك')}</span>
                            <span>{t('sales.common.tax', 'ض')}</span>
                            <span>{t('sales.common.total', 'إج')}</span>
                        </div>
                        {lines.map((line, idx) => (
                            <div key={`thermal-item-${idx}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-1">
                                <div>
                                    <p className="font-medium">{line.name}</p>
                                    {line.description && <p className="text-[9px] text-gray-500 leading-tight">{line.description}</p>}
                                </div>
                                <p className="font-medium whitespace-nowrap">{line.qty}</p>
                                <p className="font-medium whitespace-nowrap">{formatCurrency(line.taxAmount, currency)}</p>
                                <p className="font-semibold whitespace-nowrap">{formatCurrency(line.total, currency)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="py-2 space-y-1">
                        <div className="flex justify-between"><span>{t('sales.common.subtotal', 'الإجمالي قبل الضريبة')}</span><span>{formatCurrency(subtotal, currency)}</span></div>
                        <div className="flex justify-between"><span>{t('sales.common.tax', 'الضريبة')}</span><span>{formatCurrency(taxAmount, currency)}</span></div>
                        <div className="flex justify-between font-bold border-t border-gray-300 pt-1"><span>{t('sales.common.total', 'الإجمالي')}</span><span>{formatCurrency(grandTotal, currency)}</span></div>
                    </div>

                    <div className="pt-2 border-t border-dashed border-gray-300 flex justify-center">
                        <QRCodeCanvas value={qrValue} size={90} level="M" includeMargin />
                    </div>
                </div>
            </div>
        );
    }

    if (template === 'tax-bilingual') {
        return (
            <div className="h-full max-h-[68vh] overflow-auto rounded-lg border border-gray-200 bg-white p-4">
                <InvoiceTaxBilingual
                    invoice={activeInvoice}
                    company={company}
                    isRTL={isRTL}
                    t={t}
                    isPreview={true}
                    isQuotation={isQuotation}
                    isPurchaseRequest={isPurchaseRequest}
                />
            </div>
        );
    }

    if (template === 'invoice-qa') {
        let qaData = null;
        try {
            const saved = localStorage.getItem('invoice_qa_template_data');
            if (saved) qaData = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load QA data', e);
        }

        const qForm = qaData?.form || {};
        const qBg = qaData?.backgroundPreview || '';

        // Override info with QA data if available
        const dispSellerName = qForm.sellerName || company?.name || '—';
        const dispSellerCR = qForm.sellerCR || company?.commercialRegister || '—';
        const dispSellerTaxID = qForm.sellerTaxID || company?.taxNumber || '—';
        const dispSellerAddress = qForm.sellerAddress || company?.address || '—';
        const dispStamp = qForm.sellerStamp || logoUrl;

        const dispBuyerName = qForm.buyerName || contact?.name || '—';
        const dispBuyerCR = qForm.buyerCR || contact?.commercialRegNumber || contact?.commercialRegister || '—';
        const dispBuyerTaxID = qForm.buyerTaxID || contact?.taxNumber || '—';
        const dispBuyerAddress = qForm.buyerAddress || resolveEntityAddress(contact);

        const finalQR = generateZatcaQR(
            dispSellerName,
            dispSellerTaxID,
            activeInvoice?.issueDate ? new Date(activeInvoice.issueDate).toISOString() : new Date().toISOString(),
            grandTotal.toFixed(2),
            taxAmount.toFixed(2)
        );

        return (
            <div className="h-full max-h-[68vh] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4" dir="rtl">
                <div
                    className="mx-auto bg-white border border-gray-300 shadow-sm p-4 text-xs min-h-[520px] flex flex-col gap-3 relative"
                    style={{
                        marginTop: '2cm',
                        backgroundImage: qBg ? `url(${qBg})` : 'none',
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    {/* Adjusted Header: Logo | Text | QR */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3 z-10">
                        <div className="w-[70px] flex items-center justify-center">
                            {/* Top stamp removed as requested */}
                        </div>
                        <div className="text-center flex-1">
                            <p className="font-bold text-sm">
                                {isQuotation ? t('sales.quotations.title', 'عرض سعر') :
                                    isPurchaseRequest ? t('purchases.requests.title', 'طلب شراء') :
                                        ''}
                            </p>
                            <p className="text-gray-500">
                                {isQuotation ? 'رقم عرض السعر' :
                                    isPurchaseRequest ? 'رقم طلب الشراء' :
                                        'رقم الفاتورة'}: {activeInvoice?.transactionNumber || '—'}
                            </p>
                            <p className="text-gray-500">التاريخ: {formatDate(activeInvoice?.issueDate, isRTL)}</p>
                        </div>
                        <div className="w-[70px] flex items-center justify-center">
                            <QRCodeCanvas value={finalQR} size={60} level="M" includeMargin />
                        </div>
                    </div>

                    {/* Seller & Buyer */}
                    <div className="grid grid-cols-2 gap-3 z-10">
                        <div className="border border-gray-200 rounded p-2 bg-white/80 backdrop-blur-[1px]">
                            <p className="font-bold mb-1 text-gray-700">بيانات البائع</p>
                            <p>{dispSellerName}</p>
                            <p className="text-gray-500 text-[10px]">السجل التجاري: {dispSellerCR}</p>
                            <p className="text-gray-500 text-[10px]">الرقم الضريبي: {dispSellerTaxID}</p>
                            <p className="text-gray-500 text-[10px]">العنوان: {dispSellerAddress}</p>
                        </div>
                        <div className="border border-gray-200 rounded p-2 bg-white/80 backdrop-blur-[1px]">
                            <p className="font-bold mb-1 text-gray-700">بيانات المشتري</p>
                            <p>{dispBuyerName}</p>
                            <p className="text-gray-500 text-[10px]">السجل التجاري: {dispBuyerCR}</p>
                            <p className="text-gray-500 text-[10px]">الرقم الضريبي: {dispBuyerTaxID}</p>
                            <p className="text-gray-500 text-[10px]">العنوان: {dispBuyerAddress}</p>
                        </div>
                    </div>

                    {/* Items table */}
                    <div className="z-10 overflow-hidden rounded border border-gray-200">
                        <table className="w-full border-collapse bg-white/80 backdrop-blur-[1px]">
                            <thead className="bg-gray-50/90">
                                <tr>
                                    <th className="p-2 border border-gray-200 text-right">{t('sales.common.description', 'الوصف')}</th>
                                    <th className="p-2 border border-gray-200 text-center">{t('sales.common.qty', 'الكمية')}</th>
                                    <th className="p-2 border border-gray-200 text-center">{t('sales.invoices.price', 'السعر')}</th>
                                    <th className="p-2 border border-gray-200 text-center">{t('sales.common.total', 'الإجمالي')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.length > 0 ? (
                                    lines.map((line, idx) => (
                                        <tr key={`qa-${idx}`} className="border-b border-gray-100">
                                            <td className="p-2 text-right">
                                                <p className="font-bold">{line.name}</p>
                                                {line.description && <p className="text-[9px] text-gray-500">{line.description}</p>}
                                            </td>
                                            <td className="p-2 text-center">{line.qty}</td>
                                            <td className="p-2 text-center">{formatCurrency(line.unitPrice, currency)}</td>
                                            <td className="p-2 text-center font-semibold">{formatCurrency(line.total, currency)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="border-b border-gray-100">
                                        <td className="p-2 text-right font-bold">{qForm.itemDescription || '—'}</td>
                                        <td className="p-2 text-center">{qForm.quantity || 0}</td>
                                        <td className="p-2 text-center">{formatCurrency(qForm.unitPrice || 0, currency)}</td>
                                        <td className="p-2 text-center font-semibold">{formatCurrency((qForm.quantity || 0) * (qForm.unitPrice || 0), currency)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals — directly below table */}
                    {/* Totals & QR Section */}
                    <div className="flex justify-between items-end z-10 px-2" style={{ marginTop: '1rem' }}>
                        {/* QR Code on the left side of the totals box */}
                        <div className="bg-white p-1">
                            <QRCodeCanvas value={finalQR} size={75} level="M" includeMargin={false} />
                        </div>

                        <div className="w-full max-w-[240px] border border-gray-200 rounded p-2 space-y-1 bg-white/90 backdrop-blur-[1px]">
                            <div className="flex justify-between"><span>الإجمالي قبل الضريبة</span><span>{formatCurrency(subtotal, currency)}</span></div>
                            <div className="flex justify-between"><span>الضريبة (15%)</span><span>{formatCurrency(taxAmount, currency)}</span></div>
                            <div className="flex justify-between font-bold border-t border-gray-300 pt-1"><span>الإجمالي شامل الضريبة</span><span>{formatCurrency(grandTotal, currency)}</span></div>
                        </div>
                    </div>

                    {/* Signature Section — 2-column layout, moved up */}
                    <div className="grid grid-cols-2 gap-6 pt-6 z-10" style={{ marginTop: '1.5rem' }}>
                        {/* Seller signature — right column */}
                        <div className="text-center">
                            <p className="text-[10px] font-bold mb-1">الختم</p>
                            <div className="min-h-[60px] flex items-center justify-center relative">
                                {dispStamp && <img src={dispStamp} alt="Seal" className="max-h-16 opacity-80 object-contain" />}
                            </div>
                            <div className="border-t border-gray-400 mx-4 mt-2" />
                            <p className="text-gray-500 text-[10px] mt-1">توقيع البائع</p>
                        </div>
                        {/* Buyer signature — left column */}
                        <div className="text-center">
                            <p className="text-[10px] font-bold mb-1">التوقيع</p>
                            <div className="min-h-[60px] flex items-center justify-center font-bold text-xs">
                                {qForm.signatureText}
                            </div>
                            <div className="border-t border-gray-400 mx-4 mt-2" />
                            <p className="text-gray-500 text-[10px] mt-1">توقيع المشتري</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full max-h-[68vh] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4" dir="rtl">
            <div className={`mx-auto bg-white border shadow-sm p-5 ${template === 'tax' ? 'border-indigo-200' : 'border-slate-200'} min-h-[520px]`}>
                <div className="flex items-start justify-between border-b border-gray-200 pb-3 mb-4 gap-4">
                    <div className="text-left min-w-[180px]">
                        <p className="font-bold text-sm">
                            {isQuotation
                                ? t('sales.quotations.title', 'عرض سعر')
                                : isPurchaseRequest
                                    ? t('purchases.requests.title', 'طلب شراء')
                                    : (template === 'tax'
                                        ? t('sales_settings.template_arabic_tax', 'فاتورة ضريبية')
                                        : t('sales_settings.template_arabic_normal', 'فاتورة عادية'))}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            {isQuotation ? t('sales.quotations.quotation_number', 'رقم عرض السعر') :
                                isPurchaseRequest ? t('purchases.requests.request_number', 'رقم طلب الشراء') :
                                    t('sales.invoices.invoice_number', 'رقم الفاتورة')}: {activeInvoice?.transactionNumber || '—'}
                        </p>
                        <p className="text-xs text-gray-600">{t('sales.invoices.issue_date', 'تاريخ الفاتورة')}: {formatDate(activeInvoice?.issueDate, isRTL)}</p>
                    </div>

                    <div className="text-right">
                        {logoUrl ? <img src={logoUrl} alt={company?.name || 'Company'} className="h-14 w-auto object-contain ms-auto mb-1" /> : null}
                        <p className="font-bold text-sm">{company?.name}</p>
                        <p className="text-xs text-gray-600">{t('sales.common.tax_number', 'الرقم الضريبي')}: {company?.taxNumber}</p>
                        <p className="text-xs text-gray-600">{t('sales.common.commercial_register', 'السجل التجاري')}: {company?.commercialRegister}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                    <div className="rounded-lg border border-gray-200 p-3 bg-white space-y-1">
                        <p className="font-semibold mb-1" style={{ fontSize: '13px' }}>{t('sales.common.seller', 'بيانات الشركة')}</p>
                        <p className="font-bold">{company?.name || '—'}</p>
                        <p><span>{t('sales.common.commercial_register', 'السجل التجاري')}:</span> {company?.commercialRegister || '—'}</p>
                        <p><span>{t('sales.common.tax_number', 'الرقم الضريبي')}:</span> {company?.taxNumber || '—'}</p>
                        <p><span>{t('sales.common.address', 'العنوان')}:</span> {company?.address}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3 bg-white space-y-1">
                        <p className="font-semibold mb-1" style={{ fontSize: '13px' }}>{t('sales.common.buyer', 'بيانات العميل')}</p>
                        <p className="font-bold">{contact?.name || '—'}</p>
                        <p><span>{t('sales.common.address', 'العنوان')}:</span> {resolveEntityAddress(contact)}</p>
                        <p><span>{t('sales.common.tax_number', 'الرقم الضريبي')}:</span> {contact?.taxNumber || contact?.tax_number || '—'}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-200">
                        <thead className={template === 'tax' ? 'bg-indigo-50' : 'bg-gray-50'}>
                            <tr>
                                <th className="p-2 border-b border-gray-200 text-right">{t('sales.common.description', 'الوصف')}</th>
                                <th className="p-2 border-b border-gray-200 text-center">{t('sales.common.qty', 'الكمية')}</th>
                                <th className="p-2 border-b border-gray-200 text-center">{t('sales.invoices.price', 'السعر')}</th>
                                <th className="p-2 border-b border-gray-200 text-center">{t('sales.common.tax', 'الضريبة')}</th>
                                <th className="p-2 border-b border-gray-200 text-center">{t('sales.common.total', 'الإجمالي')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, idx) => (
                                <tr key={`${line.description}-${idx}`} className="border-b border-gray-100">
                                    <td className="p-2 text-right">{line.description}</td>
                                    <td className="p-2 text-center">{line.qty.toLocaleString('ar-SA')}</td>
                                    <td className="p-2 text-center">{formatCurrency(line.unitPrice, currency)}</td>
                                    <td className="p-2 text-center">{formatCurrency(line.taxAmount, currency)}</td>
                                    <td className="p-2 text-center font-semibold">{formatCurrency(line.total, currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-between gap-4 items-end">
                    <div className="shrink-0">
                        <QRCodeCanvas value={qrValue} size={90} level="M" includeMargin />
                    </div>
                    <div className="w-full max-w-[260px] text-xs space-y-1">
                        <div className="flex justify-between"><span>{t('sales.common.subtotal', 'الإجمالي قبل الضريبة')}</span><span>{formatCurrency(subtotal, currency)}</span></div>
                        <div className="flex justify-between"><span>{t('sales.common.tax', 'الضريبة')}</span><span>{formatCurrency(taxAmount, currency)}</span></div>
                        <div className={`flex justify-between pt-1 border-t font-bold ${template === 'tax' ? 'text-indigo-700 border-indigo-200' : 'text-gray-900 border-gray-200'}`}>
                            <span>{t('sales.common.total', 'الإجمالي')}</span>
                            <span>{formatCurrency(grandTotal, currency)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PrintTemplateProvider = ({ children }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { companySettings, user } = useAuth();
    const defaultTemplate = getSavedPrintTemplate();
    const [isReady, setIsReady] = useState(false);
    const [request, setRequest] = useState(null);
    const [previewInvoice, setPreviewInvoice] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const requestRef = useRef(null);
    const originalPrintRef = useRef(null);
    const selectedTemplateRef = useRef(defaultTemplate);

    const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
    const [saveAsDefault, setSaveAsDefault] = useState(false);
    const [currentDefault, setCurrentDefault] = useState(() => localStorage.getItem('defaultInvoiceTemplate'));

    useEffect(() => {
        selectedTemplateRef.current = selectedTemplate;
    }, [selectedTemplate]);

    useEffect(() => {
        setPrintTemplateRequestHandler((meta = {}) => {
            const isReportPage = window.location.pathname.includes('/reports');
            const savedDefault = localStorage.getItem('defaultInvoiceTemplate');
            const forceModal = meta.forceModal === true;

            if (savedDefault && !isReportPage && !forceModal) {
                return normalizePrintTemplate(savedDefault);
            }

            if (requestRef.current?.promise) {
                return requestRef.current.promise;
            }

            let resolveFn;
            let rejectFn;
            const promise = new Promise((resolve, reject) => {
                resolveFn = resolve;
                rejectFn = reject;
            });

            const initial = normalizePrintTemplate(meta.template || getSavedPrintTemplate());
            requestRef.current = { meta, resolve: resolveFn, reject: rejectFn, promise };
            setSelectedTemplate(initial);
            setSaveAsDefault(false); // Reset checkbox on each new modal open
            setCurrentDefault(localStorage.getItem('defaultInvoiceTemplate')); // Re-read current default
            setRequest({ meta, template: initial });
            return promise;
        });

        setIsReady(true);
        return () => {
            setPrintTemplateRequestHandler(null);
            requestRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        originalPrintRef.current = window.print.bind(window);
        let shiftHeld = false;
        const onKeyDown = (e) => { if (e.key === 'Shift') shiftHeld = true; };
        const onKeyUp = (e) => { if (e.key === 'Shift') shiftHeld = false; };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        window.print = async (...args) => {
            if (window.location.pathname.includes('/templates/invoice-qa') || window.location.pathname.includes('/reports')) {
                return originalPrintRef.current(...args);
            }

            try {
                const resolved = await requestPrintTemplateSelection({ actionType: 'print', source: 'window.print', forceModal: shiftHeld });
                const finalTemplate = selectedTemplateRef.current || resolved || getSavedPrintTemplate();
                setSavedPrintTemplate(finalTemplate);
                document.documentElement.dataset.printTemplate = finalTemplate;
                return originalPrintRef.current(...args);
            } catch {
                return undefined;
            }
        };

        // Expose helper: clears default then forces modal open for any print button
        window.openPrintTemplateModal = () => {
            localStorage.removeItem('defaultInvoiceTemplate');
            requestPrintTemplateSelection({ actionType: 'manual', source: 'openPrintTemplateModal', forceModal: true });
        };

        // Expose original print for specialized direct calls
        window._originalPrint = originalPrintRef.current;

        return () => {
            if (originalPrintRef.current) {
                window.print = originalPrintRef.current;
            }
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            delete window.openPrintTemplateModal;
            delete document.documentElement.dataset.printTemplate;
        };
    }, []);

    useEffect(() => {
        if (!request) {
            setPreviewInvoice(null);
            setPreviewLoading(false);
            return;
        }

        let cancelled = false;
        const meta = request.meta || {};
        const instant = meta.previewInvoice || meta.invoice || null;
        if (instant) {
            setPreviewInvoice(instant);
            setPreviewLoading(false);
            return;
        }

        const transactionId = meta.transactionId;
        if (!transactionId) {
            setPreviewInvoice(null);
            setPreviewLoading(false);
            return;
        }

        setPreviewLoading(true);
        api.get(`/transactions/${transactionId}`)
            .then((res) => {
                if (cancelled) return;
                setPreviewInvoice(resolveTransactionFromResponse(res.data));
            })
            .catch(() => {
                if (!cancelled) setPreviewInvoice(null);
            })
            .finally(() => {
                if (!cancelled) setPreviewLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [request]);

    const closeRequest = () => {
        const current = requestRef.current;
        if (current?.reject) {
            const abortError = new DOMException('Print template selection cancelled', 'AbortError');
            current.reject(abortError);
        }
        requestRef.current = null;
        setRequest(null);
    };

    const handleCancel = () => {
        closeRequest();
    };

    const handleConfirm = () => {
        const current = requestRef.current;
        if (!current?.resolve) return;

        if (selectedTemplate === 'invoice-qa') {
            const invoiceId = request?.meta?.transactionId || previewInvoice?._id;
            if (invoiceId) {
                navigate(`/dashboard/templates/invoice-qa?invoiceId=${invoiceId}`);
                closeRequest();
                return;
            }
        }

        if (saveAsDefault) {
            console.log('Saved default template:', selectedTemplate);
            localStorage.setItem('defaultInvoiceTemplate', selectedTemplate);
            setCurrentDefault(selectedTemplate);
        }

        const normalized = setSavedPrintTemplate(selectedTemplate);
        document.documentElement.dataset.printTemplate = normalized;
        current.resolve(normalized);
        requestRef.current = null;
        setRequest(null);
    };

    const handleClearDefault = () => {
        localStorage.removeItem('defaultInvoiceTemplate');
        setCurrentDefault(null);
    };

    const isQuotation = previewInvoice?.type === 'quotation' || window.location.pathname.includes('/quotations');
    const isPurchaseRequest = window.location.pathname.includes('/purchases/requests');
    const optionLabel = (opt) => t(opt.labelKey, opt.fallbackLabel);
    const previewTemplate = selectedTemplate || getSavedPrintTemplate();
    const isRTL = i18n.language === 'ar';
    const previewCompany = useMemo(
        () => resolveCompanyInfo({ companySettings, user, requestMeta: request?.meta }),
        [companySettings, user, request]
    );

    return (
        <>
            {children}
            {isReady && request && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="w-full max-w-[920px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                        <div className="border-b border-gray-100 px-5 py-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <h2 className="text-lg font-bold text-gray-800">{t('اختر قالب المستند', 'اختر قالب المستند')}</h2>
                                {currentDefault && (
                                    <div className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs">
                                        <span className="font-semibold text-indigo-700">
                                            {t('القالب الافتراضي الحالي', 'القالب الافتراضي الحالي')}: <strong>{currentDefault}</strong>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleClearDefault}
                                            className="font-bold text-red-500 hover:text-red-700 underline"
                                        >
                                            {t('إزالة القالب الافتراضي', 'إزالة القالب الافتراضي')}
                                        </button>
                                    </div>
                                )}
                                {!currentDefault && (
                                    <span className="text-xs text-gray-400 italic">{t('لا يوجد قالب افتراضي محفوظ', 'لا يوجد قالب افتراضي محفوظ')}</span>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
                            <div className="min-h-[360px] bg-gray-50 p-4 md:p-5">
                                <ModalPreview
                                    template={previewTemplate}
                                    invoice={previewInvoice}
                                    company={previewCompany}
                                    loading={previewLoading}
                                    isRTL={isRTL}
                                    t={t}
                                    isQuotation={isQuotation}
                                    isPurchaseRequest={isPurchaseRequest}
                                />
                            </div>

                            <div className="border-t border-gray-100 bg-white p-4 md:border-t-0 md:border-s md:p-5">
                                <div className="space-y-3">
                                    {PRINT_TEMPLATE_OPTIONS.map((opt) => {
                                        const checked = selectedTemplate === opt.value;
                                        return (
                                            <label
                                                key={opt.value}
                                                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${checked ? 'border-indigo-300 bg-indigo-50/70' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="print-template"
                                                        value={opt.value}
                                                        checked={checked}
                                                        onChange={() => setSelectedTemplate(opt.value)}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm font-semibold text-gray-800">{optionLabel(opt)}</span>
                                                </span>
                                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    {opt.value}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 space-y-3">
                                    <label className="flex items-center gap-3 px-1 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={saveAsDefault}
                                            onChange={(e) => setSaveAsDefault(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                            {t('حفظ كقالب افتراضي للطباعة القادمة', 'حفظ كقالب افتراضي للطباعة القادمة')}
                                        </span>
                                    </label>

                                    {currentDefault && (
                                        <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-indigo-700">
                                                    {t('سيُحفظ القالب المختار كافتراضي عند التأكيد', 'سيُحفظ القالب المختار كافتراضي عند التأكيد')}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {!currentDefault && (
                                        <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800 border border-blue-100">
                                            {t('print_template.remember_default', 'سيتم حفظ هذا الاختيار كخيار افتراضي للطباعة القادمة.')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                {t('Cancel', 'إلغاء')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                {t('sales.common.confirm', 'موافق')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default PrintTemplateProvider;
