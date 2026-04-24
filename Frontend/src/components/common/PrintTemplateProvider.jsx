import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import api, { BASE_URL } from '../../services/api';
import { formatCurrency } from '../../utils/currencyformatter';
import { useAuth } from '../../context/authcontext';
import {
    setPrintTemplateRequestHandler,
    getSavedPrintTemplate,
    setSavedPrintTemplate,
    PRINT_TEMPLATE_OPTIONS,
    normalizePrintTemplate,
    requestPrintTemplateSelection
} from '../../services/printtemplateservice';
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
        name: 'عميل افتراضي / Sample Customer',
        phone: '05XXXXXXXX',
        address: { city: 'الرياض / Riyadh' }
    },
    items: [
        { productName: 'منتج تجريبي أ / Sample Item A', quantity: 2, unitPrice: 50, taxPercent: 15 },
        { productName: 'منتج تجريبي ب / Sample Item B', quantity: 1, unitPrice: 100, taxPercent: 15 },
    ],
    subtotal: 200,
    totalTax: 30,
    totalAmount: 230,
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
            description: item?.productName || item?.product?.name || item?.description || '—',
            qty,
            unitPrice,
            taxAmount,
            total,
        };
    });
};

const ModalPreview = ({ template, invoice, company, loading, isRTL, t }) => {
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
    const qrValue = JSON.stringify({
        invoiceNumber: activeInvoice?.transactionNumber || activeInvoice?._id || 'SAMPLE',
        total: grandTotal,
        company: company?.name,
        date: activeInvoice?.issueDate,
    });

    if (template === 'thermal') {
        return (
            <div className="h-full max-h-[68vh] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mx-auto w-[304px] bg-white border border-gray-300 shadow-sm p-3 text-[11px] leading-5" dir="rtl">
                    <div className="text-center border-b border-dashed border-gray-300 pb-2">
                        {logoUrl ? <img src={logoUrl} alt={company?.name || 'Company'} className="h-10 mx-auto mb-1 object-contain" /> : null}
                        <p className="font-bold text-[12px]">{company?.name}</p>
                        <p>{t('sales.invoices.invoice_number', 'رقم الفاتورة')}: {activeInvoice?.transactionNumber || '—'}</p>
                        <p>{t('sales.invoices.issue_date', 'تاريخ الفاتورة')}: {formatDate(activeInvoice?.issueDate, isRTL)}</p>
                        <p className="font-semibold mt-1">{t('sales_settings.template_arabic_thermal', 'قالب فاتورة طابعة حرارية عربي')}</p>
                    </div>

                    <div className="py-2 border-b border-dashed border-gray-300">
                        <p><span className="font-semibold">{t('sales.common.seller', 'البائع')}:</span> {company?.name}</p>
                        <p><span className="font-semibold">{t('sales.common.buyer', 'المشتري')}:</span> {contact?.name || '—'}</p>
                    </div>

                    <div className="py-2 space-y-1 border-b border-dashed border-gray-300">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-1 text-[10px] font-semibold text-gray-500">
                            <span>{t('sales.common.description', 'الوصف')}</span>
                            <span>{t('sales.common.qty', 'ك')}</span>
                            <span>{t('sales.common.tax', 'ض')}</span>
                            <span>{t('sales.common.total', 'إج')}</span>
                        </div>
                        {lines.map((line, idx) => (
                            <div key={`${line.description}-${idx}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-1">
                                <div>
                                    <p className="font-medium">{line.description}</p>
                                    <p className="text-[10px] text-gray-500">{formatCurrency(line.unitPrice, currency)}</p>
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
            <div className="h-full max-h-[68vh] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                <InvoiceTaxBilingual
                    invoice={activeInvoice}
                    company={company}
                    isRTL={isRTL}
                    t={t}
                    isPreview={true}
                />
            </div>
        );
    }

    if (template === 'invoice-qa') {
        return (
            <div className="h-full max-h-[68vh] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4" dir="rtl">
                <div
                    className="mx-auto bg-white border border-gray-300 shadow-sm p-4 text-xs min-h-[520px] flex flex-col gap-3"
                    style={{ marginTop: '2cm' }}
                >
                    {/* Adjusted Header: Logo | Text | QR */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div className="w-[70px] flex items-center justify-center">
                            {logoUrl && <img src={logoUrl} alt="Logo" className="max-h-12 w-auto object-contain" />}
                        </div>
                        <div className="text-center flex-1">
                            <p className="font-bold text-sm">فاتورة ضريبية</p>
                            <p className="text-gray-500">رقم الفاتورة: {activeInvoice?.transactionNumber || '—'}</p>
                            <p className="text-gray-500">التاريخ: {formatDate(activeInvoice?.issueDate, isRTL)}</p>
                        </div>
                        <div className="w-[70px] flex items-center justify-center">
                            <QRCodeCanvas value={qrValue} size={60} level="M" includeMargin />
                        </div>
                    </div>

                    {/* Seller & Buyer */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="border border-gray-200 rounded p-2">
                            <p className="font-bold mb-1 text-gray-700">بيانات البائع</p>
                            <p>{company?.name || '—'}</p>
                            <p className="text-gray-500">السجل التجاري: {company?.commercialRegister || '—'}</p>
                            <p className="text-gray-500">الرقم الضريبي: {company?.taxNumber || '—'}</p>
                            <p className="text-gray-500">العنوان: {company?.address || '—'}</p>
                        </div>
                        <div className="border border-gray-200 rounded p-2">
                            <p className="font-bold mb-1 text-gray-700">بيانات المشتري</p>
                            <p>{contact?.name || '—'}</p>
                            <p className="text-gray-500">السجل التجاري: {contact?.commercialRegNumber || contact?.commercialRegister || '—'}</p>
                            <p className="text-gray-500">الرقم الضريبي: {contact?.taxNumber || '—'}</p>
                            <p className="text-gray-500">العنوان: {resolveEntityAddress(contact)}</p>
                        </div>
                    </div>

                    {/* Items table */}
                    <table className="w-full border border-gray-200 border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-2 border border-gray-200 text-right">{t('sales.common.description', 'الوصف')}</th>
                                <th className="p-2 border border-gray-200 text-center">{t('sales.common.qty', 'الكمية')}</th>
                                <th className="p-2 border border-gray-200 text-center">{t('sales.invoices.price', 'السعر')}</th>
                                <th className="p-2 border border-gray-200 text-center">{t('sales.common.total', 'الإجمالي')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, idx) => (
                                <tr key={`qa-${idx}`} className="border-b border-gray-100">
                                    <td className="p-2 text-right">{line.description}</td>
                                    <td className="p-2 text-center">{line.qty}</td>
                                    <td className="p-2 text-center">{formatCurrency(line.unitPrice, currency)}</td>
                                    <td className="p-2 text-center font-semibold">{formatCurrency(line.total, currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals — directly below table */}
                    <div className="self-end w-full max-w-[240px] border border-gray-200 rounded p-2 space-y-1">
                        <div className="flex justify-between"><span>الإجمالي قبل الضريبة</span><span>{formatCurrency(subtotal, currency)}</span></div>
                        <div className="flex justify-between"><span>الضريبة (15%)</span><span>{formatCurrency(taxAmount, currency)}</span></div>
                        <div className="flex justify-between font-bold border-t border-gray-300 pt-1"><span>الإجمالي شامل الضريبة</span><span>{formatCurrency(grandTotal, currency)}</span></div>
                    </div>

                    {/* Signature */}
                    <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-dashed border-gray-300">
                        <div className="text-center">
                            <p className="text-gray-500 mb-2 italic">ختم البائع</p>
                            <div className="min-h-[60px] flex items-center justify-center">
                                {company?.logoPath && <img src={getCompanyLogoUrl(company.logoPath)} alt="Seal" className="max-h-12 opacity-70" />}
                            </div>
                            <div className="border-t border-gray-300 mx-4" />
                        </div>
                        <div className="text-center">
                            <p className="text-gray-500 mb-6">توقيع المشتري</p>
                            <div className="border-t border-gray-300 mx-4" />
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
                            {template === 'tax'
                                ? t('sales_settings.template_arabic_tax', 'قالب فاتورة ضريبية عربي')
                                : t('sales_settings.template_arabic_normal', 'قالب فاتورة عادية عربي')}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{t('sales.invoices.invoice_number', 'رقم الفاتورة')}: {activeInvoice?.transactionNumber || '—'}</p>
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
                    <div className="rounded-lg border border-gray-200 p-3 bg-white">
                        <p className="font-semibold mb-1">{t('sales.common.seller', 'البائع')}</p>
                        <p>{company?.name}</p>
                        <p>{company?.address}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3 bg-white">
                        <p className="font-semibold mb-1">{t('sales.common.buyer', 'المشتري')}</p>
                        <p>{contact?.name || '—'}</p>
                        <p>{contact?.phone || '—'}</p>
                        <p>{resolveEntityAddress(contact)}</p>
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

    useEffect(() => {
        selectedTemplateRef.current = selectedTemplate;
    }, [selectedTemplate]);

    useEffect(() => {
        setPrintTemplateRequestHandler((meta = {}) => {
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
        window.print = async (...args) => {
            // Bypass template selection modal if we are already in the QA tool
            if (window.location.pathname.includes('/templates/invoice-qa')) {
                return originalPrintRef.current(...args);
            }

            try {
                const resolved = await requestPrintTemplateSelection({ actionType: 'print', source: 'window.print' });
                const finalTemplate = selectedTemplateRef.current || resolved || getSavedPrintTemplate();
                setSavedPrintTemplate(finalTemplate);
                document.documentElement.dataset.printTemplate = finalTemplate;
                return originalPrintRef.current(...args);
            } catch {
                return undefined;
            }
        };

        // Expose original print for specialized direct calls
        window._originalPrint = originalPrintRef.current;

        return () => {
            if (originalPrintRef.current) {
                window.print = originalPrintRef.current;
            }
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

        const normalized = setSavedPrintTemplate(selectedTemplate);
        document.documentElement.dataset.printTemplate = normalized;
        current.resolve(normalized);
        requestRef.current = null;
        setRequest(null);
    };

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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="w-full max-w-[920px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-gray-800">{t('اختر قالب المستند', 'اختر قالب المستند')}</h2>
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

                                <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800 border border-blue-100">
                                    {t('print_template.remember_default', 'سيتم حفظ هذا الاختيار كخيار افتراضي للطباعة القادمة.')}
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
