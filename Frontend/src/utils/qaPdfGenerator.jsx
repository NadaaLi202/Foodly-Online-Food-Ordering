import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import { generateZatcaQR } from './zatca';
import { formatCurrency } from './currencyFormatter';
import { BASE_URL } from '../services/api';

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('ar-SA');
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

export const generateQAPdfBlob = async (invoice) => {
    let qaData = null;
    try {
        const saved = localStorage.getItem('invoice_qa_template_data');
        if (saved) qaData = JSON.parse(saved);
    } catch (e) {
        console.error('Failed to load QA data', e);
    }

    if (!qaData) {
        throw new Error('يرجى إعداد قالب اختبار الجودة (INVOICE-QA) أولاً من قسم القوالب.');
    }

    const qForm = qaData.form || {};
    const qBg = qaData.backgroundPreview || '';

    const company = invoice?.companySnapshot || {};
    const contact = invoice?.contactSnapshot || invoice?.contact || {};
    const currency = invoice?.currency || company?.currency || 'SAR';
    
    const lines = buildLines(invoice);
    const subtotalFromLines = lines.reduce((sum, line) => sum + (line.total - line.taxAmount), 0);
    const taxFromLines = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const subtotal = invoice?.subtotal != null ? toNumber(invoice.subtotal) : subtotalFromLines;
    const taxAmount = invoice?.totalTax != null ? toNumber(invoice.totalTax) : taxFromLines;
    const grandTotal = invoice?.totalAmount != null ? toNumber(invoice.totalAmount) : subtotal + taxAmount;

    let logoUrl = '';
    if (company?.logoPath) {
        logoUrl = company.logoPath.startsWith('http') ? company.logoPath : `${BASE_URL}${company.logoPath}`;
    }

    const dispSellerName = (invoice ? company?.name : (qForm.sellerName || company?.name)) || '—';
    const sellerCR = company?.commercialRegister || company?.commercial_register || company?.commercialReg || '';
    const dispSellerCR = (invoice ? sellerCR : (qForm.sellerCR || sellerCR)) || '—';
    const dispSellerTaxID = (invoice ? (company?.taxNumber || company?.tax_number) : (qForm.sellerTaxID || company?.taxNumber || company?.tax_number)) || '—';
    const sellerAddr = company?.address || company?.location || company?.city || '';
    const dispSellerAddress = (invoice ? sellerAddr : (qForm.sellerAddress || sellerAddr)) || '—';
    const dispStamp = qForm.sellerStamp || logoUrl;

    const activeContactSnapshot = invoice?.contactSnapshot || {};
    const activeContactObj = invoice?.contact || {};
    const activeBuyerName = activeContactSnapshot.name || activeContactObj.name || contact.name;
    const activeBuyerCR = activeContactSnapshot.commercialRegister || activeContactSnapshot.commercialRegNumber || activeContactSnapshot.commercial_register || activeContactSnapshot.commercialReg || activeContactObj.commercialRegister || activeContactObj.commercialRegNumber || activeContactObj.commercial_register || activeContactObj.commercialReg || contact.commercialRegister || contact.commercialRegNumber || contact.commercial_register || contact.commercialReg || '';
    const activeBuyerTaxID = activeContactSnapshot.taxNumber || activeContactSnapshot.tax_number || activeContactObj.taxNumber || activeContactObj.tax_number || contact.taxNumber || contact.tax_number || '';
    const activeBuyerAddress = resolveEntityAddress(activeContactSnapshot.address || activeContactObj.address || contact);

    const dispBuyerName = (invoice ? activeBuyerName : (qForm.buyerName || activeBuyerName)) || '—';
    const dispBuyerCR = (invoice ? activeBuyerCR : (qForm.buyerCR || activeBuyerCR)) || '—';
    const dispBuyerTaxID = (invoice ? activeBuyerTaxID : (qForm.buyerTaxID || activeBuyerTaxID)) || '—';
    const dispBuyerAddress = (invoice ? activeBuyerAddress : (qForm.buyerAddress || activeBuyerAddress)) || '—';

    const finalQR = generateZatcaQR(
        dispSellerName,
        dispSellerTaxID,
        invoice?.issueDate ? new Date(invoice.issueDate).toISOString() : new Date().toISOString(),
        grandTotal.toFixed(2),
        taxAmount.toFixed(2)
    );

    const isQuotation = invoice?.type === 'quotation';
    const isPurchaseRequest = invoice?.type === 'purchase_request';

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.dir = 'rtl';
    document.body.appendChild(container);

    const root = createRoot(container);
    
    await new Promise(resolve => {
        root.render(
            <div className="invoice-qa-offscreen" style={{ width: '800px', backgroundColor: 'white' }}>
                <div
                    style={{
                        padding: '1rem',
                        minHeight: '1000px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        backgroundImage: qBg ? `url(${qBg})` : 'none',
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        fontFamily: 'sans-serif',
                        paddingTop: '2.5cm',
                        paddingLeft: '1.5cm',
                        paddingRight: '1.5cm',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', zIndex: 10 }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '0.875rem', margin: 0 }}>
                                {isQuotation ? 'عرض سعر' :
                                    isPurchaseRequest ? 'طلب شراء' :
                                        'فاتورة'}
                            </p>
                            <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '0.25rem 0' }}>
                                {isQuotation ? 'رقم عرض السعر' :
                                    isPurchaseRequest ? 'رقم طلب الشراء' :
                                        'رقم الفاتورة'}: {invoice?.transactionNumber || '—'}
                            </p>
                            <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: 0 }}>التاريخ: {formatDate(invoice?.issueDate)}</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', zIndex: 10, marginTop: '0.5rem' }}>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#374151', margin: 0 }}>بيانات البائع</p>
                            <p style={{ margin: '0.1rem 0' }}>{dispSellerName}</p>
                            <p style={{ color: '#6b7280', fontSize: '0.65rem', margin: '0.1rem 0' }}>السجل التجاري: {dispSellerCR}</p>
                            <p style={{ color: '#6b7280', fontSize: '0.65rem', margin: '0.1rem 0' }}>الرقم الضريبي: {dispSellerTaxID}</p>
                            <p style={{ color: '#6b7280', fontSize: '0.65rem', margin: '0.1rem 0' }}>العنوان: {dispSellerAddress}</p>
                        </div>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#374151', margin: 0 }}>بيانات المشتري</p>
                            <p style={{ margin: '0.1rem 0' }}>{dispBuyerName}</p>
                            <p style={{ color: '#6b7280', fontSize: '0.65rem', margin: '0.1rem 0' }}>السجل التجاري: {dispBuyerCR}</p>
                            <p style={{ color: '#6b7280', fontSize: '0.65rem', margin: '0.1rem 0' }}>الرقم الضريبي: {dispBuyerTaxID}</p>
                            <p style={{ color: '#6b7280', fontSize: '0.65rem', margin: '0.1rem 0' }}>العنوان: {dispBuyerAddress}</p>
                        </div>
                    </div>

                    <div style={{ zIndex: 10, overflow: 'hidden', borderRadius: '0.25rem', border: '1px solid #e5e7eb', marginTop: '0.5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem' }}>
                            <thead style={{ backgroundColor: 'rgba(249, 250, 251, 0.9)' }}>
                                <tr>
                                    <th style={{ padding: '0.5rem', border: '1px solid #e5e7eb', textAlign: 'right' }}>الوصف</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #e5e7eb', textAlign: 'center' }}>الكمية</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #e5e7eb', textAlign: 'center' }}>السعر</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #e5e7eb', textAlign: 'center' }}>الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.length > 0 ? (
                                    lines.map((line, idx) => (
                                        <tr key={`qa-${idx}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                <p style={{ fontWeight: 'bold', margin: 0 }}>{line.name}</p>
                                                {line.description && <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0.1rem 0' }}>{line.description}</p>}
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{line.qty}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{formatCurrency(line.unitPrice, currency)}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'semibold' }}>{formatCurrency(line.total, currency)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{qForm.itemDescription || '—'}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{qForm.quantity || 0}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{formatCurrency(qForm.unitPrice || 0, currency)}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 'semibold' }}>{formatCurrency((qForm.quantity || 0) * (qForm.unitPrice || 0), currency)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10, marginTop: '1rem', fontSize: '0.75rem' }}>
                        <div style={{ backgroundColor: 'white', padding: '0.25rem' }}>
                            <QRCodeCanvas value={finalQR} size={85} level="M" includeMargin={false} />
                        </div>
                        <div style={{ width: '100%', maxWidth: '240px', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.9)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>الإجمالي قبل الضريبة</span><span>{formatCurrency(subtotal, currency)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>الضريبة (15%)</span><span>{formatCurrency(taxAmount, currency)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #d1d5db', paddingTop: '0.25rem', marginTop: '0.1rem' }}><span>الإجمالي شامل الضريبة</span><span>{formatCurrency(grandTotal, currency)}</span></div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingTop: '1.5rem', zIndex: 10 }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '0.25rem', margin: 0 }}>الختم</p>
                            <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                {dispStamp && <img src={dispStamp} alt="Seal" style={{ maxHeight: '4rem', opacity: 0.8, objectFit: 'contain' }} />}
                            </div>
                            <div style={{ borderTop: '1px solid #9ca3af', margin: '0.5rem 1rem 0' }} />
                            <p style={{ color: '#6b7280', fontSize: '0.65rem', margin: '0.25rem 0 0 0' }}>توقيع البائع</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '0.25rem', margin: 0 }}>التوقيع</p>
                            <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                {qForm.signatureText}
                            </div>
                            <div style={{ borderTop: '1px solid #9ca3af', margin: '0.5rem 1rem 0' }} />
                            <p style={{ color: '#6b7280', fontSize: '0.65rem', margin: '0.25rem 0 0 0' }}>توقيع المشتري</p>
                        </div>
                    </div>
                </div>
            </div>
        );
        setTimeout(resolve, 800);
    });

    try {
        const element = container.querySelector('.invoice-qa-offscreen');
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        let imgWidth = pdfWidth;
        let imgHeight = pdfWidth / ratio;
        if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = pdfHeight * ratio;
        }
        const xOffset = (pdfWidth - imgWidth) / 2;
        pdf.addImage(imgData, 'JPEG', xOffset, 0, imgWidth, imgHeight);
        
        const blob = pdf.output('blob');
        return blob;
    } finally {
        root.unmount();
        container.remove();
    }
};
