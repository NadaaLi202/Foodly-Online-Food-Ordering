import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { formatCurrency } from '../../utils/currencyFormatter';
import { generateZatcaQR } from '../../utils/zatca';

const InvoiceTaxBilingual = ({ invoice, company, isRTL, t, isPreview = false, isQuotation, isPurchaseRequest }) => {
    const isActuallyQuotation = isQuotation || invoice?.type === 'quotation';
    const isActuallyRequest = isPurchaseRequest || invoice?.type === 'purchase_request';
    const currency = invoice?.currency || company?.currency || 'SAR';
    const logoUrl = company?.logoPath ? (company.logoPath.startsWith('http') ? company.logoPath : `http://localhost:3000${company.logoPath}`) : '';
    const activeContactSnapshot = invoice?.contactSnapshot || {};
    const activeContactObj = invoice?.contact || {};
    const contactName = activeContactSnapshot.name || activeContactObj.name || '—';
    const contactTax = activeContactSnapshot.taxNumber || activeContactSnapshot.tax_number || activeContactObj.taxNumber || activeContactObj.tax_number || '—';
    const contactCR = activeContactSnapshot.commercialRegister || activeContactSnapshot.commercialRegNumber || activeContactSnapshot.commercial_register || activeContactSnapshot.commercialReg || activeContactObj.commercialRegister || activeContactObj.commercialRegNumber || activeContactObj.commercial_register || activeContactObj.commercialReg || '—';
    const contact = activeContactSnapshot.name ? activeContactSnapshot : activeContactObj;

    const toNumber = (v) => {
        const n = Number(v);
        return isFinite(n) ? n : 0;
    };

    const lines = (invoice?.items || []).map(item => {
        const qty = toNumber(item.quantity);
        const price = toNumber(item.unitPrice || item.price);
        const tax = toNumber(item.taxAmount);
        const total = item.total != null ? toNumber(item.total) : (qty * price) + tax;
        return {
            name: item.productName || item.product?.name || '—',
            description: item.description || '',
            qty,
            price,
            tax,
            total
        };
    });

    const subtotal = toNumber(invoice?.subtotal);
    const taxAmount = toNumber(invoice?.totalTax);
    const grandTotal = toNumber(invoice?.totalAmount);

    const qrValue = generateZatcaQR(
        company?.name,
        company?.taxNumber,
        invoice?.issueDate ? new Date(invoice.issueDate).toISOString() : new Date().toISOString(),
        grandTotal.toFixed(2),
        taxAmount.toFixed(2)
    );

    const formatAddress = (addr) => {
        if (!addr) return '—';
        if (typeof addr === 'string') return addr;
        const parts = [addr.address1, addr.city, addr.state, addr.country].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : '—';
    };

    const contactAddress = formatAddress(contact?.address);
    const companyAddress = formatAddress(company?.address);

    return (
        <div
            className={`w-full p-6 font-sans ${isPreview ? 'text-[11px]' : 'text-[12px]'}`}
            style={{ direction: 'rtl', color: '#000', border: '1px solid #000', backgroundColor: '#ffffff' }}
        >
            {/* HEADER SECTION: Logo (Right) | Title Info (Center) | Spacer (Left) */}
            <div className="flex justify-between items-center mb-6 border-b border-black pb-4">
                <div className="w-1/3 flex justify-start">
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt={company?.name}
                            className="max-h-[80px] object-contain"
                        />
                    )}
                </div>
                <div className="w-1/3 text-center space-y-1">
                    <h1 className="text-xl font-bold" style={{ fontSize: '18px' }}>
                        {isActuallyQuotation ? t('sales.quotations.title', 'عرض سعر') :
                            isActuallyRequest ? t('purchases.requests.title', 'طلب شراء') :
                                'فاتورة ضريبية'}
                    </h1>
                    <p><span className="font-bold">{isActuallyRequest ? 'رقم طلب الشراء' : 'رقم'}:</span> {invoice?.transactionNumber || '—'}</p>
                    <p><span className="font-bold">التاريخ:</span> {invoice?.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-GB') : '—'}</p>
                </div>
                <div className="w-1/3"></div>
            </div>

            {/* INFO SECTION: Company (Right) | Client (Left) */}
            <div className="grid grid-cols-2 mb-6 border-x border-t border-black">
                {/* COMPANY INFO (Right in RTL) */}
                <div className="p-2 border-l border-b border-black space-y-1">
                    <p className="font-bold" style={{ fontSize: '14px' }}>بيانات الشركة</p>
                    <p className="font-bold">{company?.name || '—'}</p>
                    <p><span className="font-bold">السجل التجاري:</span> {company?.commercialRegister || company?.commercial_register || company?.commercialReg || '—'}</p>
                    <p><span className="font-bold">الرقم الضريبي:</span> {company?.taxNumber || company?.tax_number || '—'}</p>
                    <p><span className="font-bold">العنوان:</span> {companyAddress}</p>
                </div>
                {/* CLIENT INFO (Left in RTL) */}
                <div className="p-2 border-b border-black space-y-1">
                    <p className="font-bold" style={{ fontSize: '14px' }}>بيانات العميل</p>
                    <p className="font-bold">{contactName}</p>
                    <p><span className="font-bold">العنوان:</span> {contactAddress}</p>
                    <p><span className="font-bold">الرقم الضريبي:</span> {contactTax}</p>
                    <p><span className="font-bold">السجل التجاري:</span> {contactCR}</p>
                </div>
            </div>

            {/* TABLE SECTION */}
            <table className="w-full border-collapse border border-black mb-6">
                <thead className="bg-[#f0f0f0]">
                    <tr className="font-bold" style={{ fontSize: '14px' }}>
                        <th className="border border-black p-2 text-right">الوصف</th>
                        <th className="border border-black p-2 text-center w-20">الكمية</th>
                        <th className="border border-black p-2 text-center w-32">السعر</th>
                        <th className="border border-black p-2 text-center w-32">الضريبة</th>
                        <th className="border border-black p-2 text-center w-40">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    {lines.map((line, idx) => (
                        <tr key={idx}>
                            <td className="border border-black p-2 text-right">
                                <p className="font-bold">{line.name}</p>
                                {line.description && <p className="text-[10px] mt-1 text-gray-600">{line.description}</p>}
                            </td>
                            <td className="border border-black p-2 text-center">{line.qty}</td>
                            <td className="border border-black p-2 text-center">{formatCurrency(line.price, currency)}</td>
                            <td className="border border-black p-2 text-center">{formatCurrency(line.tax, currency)}</td>
                            <td className="border border-black p-2 text-center">{formatCurrency(line.total, currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* TOTALS SECTION (Left Side) */}
            <div className="flex justify-end mb-6">
                <div className="w-1/2 border border-black bg-white">
                    <div className="flex justify-between p-2 border-b border-black">
                        <span className="font-bold">الإجمالي قبل الضريبة</span>
                        <span>{formatCurrency(subtotal, currency)}</span>
                    </div>
                    <div className="flex justify-between p-2 border-b border-black">
                        <span className="font-bold">قيمة الضريبة 15%</span>
                        <span>{formatCurrency(taxAmount, currency)}</span>
                    </div>
                    <div className="flex justify-between p-2 font-bold bg-[#f0f0f0]" style={{ fontSize: '14px' }}>
                        <span>الإجمالي النهائي</span>
                        <span>{formatCurrency(grandTotal, currency)}</span>
                    </div>
                </div>
            </div>

            {/* QR CODE (Left Side) */}
            <div className="flex justify-end">
                <div className="border border-black p-1 bg-white">
                    <QRCodeCanvas value={qrValue} size={100} level="M" />
                </div>
            </div>
        </div>
    );
};

export default InvoiceTaxBilingual;
