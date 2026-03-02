import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * ZATCA TLV encoder — produces Base64 string for Saudi e-invoicing QR codes.
 * Tags: 1=Seller Name, 2=VAT Number, 3=Timestamp, 4=Total (incl. VAT), 5=VAT Amount
 */
const buildZatcaTlv = ({ sellerName = '', vatNumber = '', timestamp = '', totalWithVat = '', vatAmount = '' }) => {
    const encoder = new TextEncoder();
    const fields = [
        { tag: 1, value: sellerName },
        { tag: 2, value: vatNumber },
        { tag: 3, value: timestamp },
        { tag: 4, value: totalWithVat },
        { tag: 5, value: vatAmount },
    ];
    const buffers = fields.map(({ tag, value }) => {
        const valBytes = encoder.encode(value);
        const tlv = new Uint8Array(2 + valBytes.length);
        tlv[0] = tag;
        tlv[1] = valBytes.length;
        tlv.set(valBytes, 2);
        return tlv;
    });
    const totalLen = buffers.reduce((s, b) => s + b.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    buffers.forEach(b => { result.set(b, offset); offset += b.length; });
    return btoa(String.fromCharCode(...result));
};

/** QR code component — renders a real scannable ZATCA QR code */
const ZatcaQRCode = ({ company = {}, totals = {}, size = 56 }) => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const tlvBase64 = buildZatcaTlv({
            sellerName: company.name || 'Company',
            vatNumber: company.tax_number || '300000000000003',
            timestamp: new Date().toISOString(),
            totalWithVat: totals.total || '0.00',
            vatAmount: totals.vat || '0.00',
        });
        if (canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, tlvBase64, {
                width: size,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' },
                errorCorrectionLevel: 'M',
            }).catch(err => console.error('QR Error:', err));
        }
    }, [company.name, company.tax_number, totals.total, totals.vat, size]);
    return <canvas ref={canvasRef} width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} />;
};

/**
 * Placeholder resolution engine.
 * Takes a text like "TEST {{company.name}} hello" and resolves to "TEST دفاتر hello"
 */
export const resolvePlaceholders = (text = '', context = {}) => {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmed = key.trim();
        const parts = trimmed.split('.');
        let val = context;
        for (const p of parts) {
            val = val?.[p];
            if (val === undefined || val === null) return match; // keep placeholder if unresolved
        }
        return val;
    });
};

/** Render a row with its formatting */
const StyledRow = ({ row, defaultFontSize = 12, isRtl = true, context = {} }) => {
    const fmt = row.format || {};
    const text = resolvePlaceholders(row.text || '', context);
    if (!text) return null;
    return (
        <p style={{
            fontSize: `${fmt.fontSize || defaultFontSize}px`,
            color: fmt.color || '#000',
            textAlign: fmt.align || (isRtl ? 'right' : 'left'),
            fontWeight: fmt.bold ? 'bold' : 'normal',
            marginBottom: '2px',
            lineHeight: 1.5,
        }}>
            {text}
        </p>
    );
};

/**
 * InvoicePreview — fully rendered invoice matching the reference.
 * Resolves all {{placeholders}} using context data (company, branch, partner, invoice).
 */
const InvoicePreview = ({ template = {}, direction = 'rtl', context = {} }) => {
    const page = template.page || {};
    const logo = template.logo || {};
    const header = template.header || {};
    const partner = template.partner || {};
    const table = template.table || {};
    const footer = template.footer || {};
    const isRtl = direction === 'rtl';
    const margins = page.margins || { top: 40, right: 40, bottom: 40, left: 40 };

    const enabledCols = (table.columns || []).filter(c => c.enabled !== false);
    const enabledFooterRows = (table.footerRows || []).filter(r => r.enabled !== false);

    // Sample data for preview — respect deductTaxFromAmounts
    const deductTax = table.deductTaxFromAmounts === true;
    const basePrice = 20.00;
    const qty = 10;
    const rawSubtotal = basePrice * qty; // 200
    const vatRate = 0.15;
    let computedSubtotal, computedVat, computedTotal;
    if (deductTax) {
        // Price is tax-inclusive: subtotal = price / 1.15, vat = subtotal * 0.15
        computedSubtotal = rawSubtotal / (1 + vatRate);
        computedVat = computedSubtotal * vatRate;
        computedTotal = rawSubtotal;
    } else {
        computedSubtotal = rawSubtotal;
        computedVat = rawSubtotal * vatRate;
        computedTotal = rawSubtotal + computedVat;
    }
    const sampleProducts = [
        { lineNumber: 'قلم رصاص', description: 'قلم رصاص خشبي أسود مع ممحاة', quantity: `${qty} قطع`, price: basePrice.toFixed(2), taxRate: '15%', subtotal: computedSubtotal.toFixed(2), taxAmount: computedVat.toFixed(2), total: computedTotal.toFixed(2), discount: '0.00', code: 'PEN-01' },
    ];
    const sampleTotals = { subtotal: computedSubtotal.toFixed(2), discount: '0.00', vat: computedVat.toFixed(2), total: computedTotal.toFixed(2), paid: computedTotal.toFixed(2), remaining: '0.00' };

    const getPageDimensions = () => {
        const pSize = page.pageSize?.toLowerCase() || 'a4';
        switch (pSize) {
            case '80mm': return { width: '302px', minHeight: '500px', fontSizeMod: 0.75 }; // thermal receipt
            case 'a5': return { width: '559px', minHeight: '794px', fontSizeMod: 0.9 };
            case 'letter': return { width: '816px', minHeight: '1056px', fontSizeMod: 1 };
            case 'a4':
            default: return { width: '794px', minHeight: '1123px', fontSizeMod: 1 };
        }
    };
    const { width: pageWidth, minHeight: pageMinHeight, fontSizeMod } = getPageDimensions();
    const baseFontSize = (page.fontSize || 12) * fontSizeMod;

    return (
        <div className="w-full h-full overflow-auto bg-gray-100 rounded-md p-4 flex justify-center">
            <div
                dir={direction}
                style={{
                    backgroundColor: '#ffffff',
                    display: 'flex', flexDirection: 'column',
                    width: pageWidth,
                    minHeight: pageMinHeight,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #d1d5db',
                    padding: `${margins.top * 1.5}px ${margins.right * 1.5}px ${margins.bottom * 1.5}px ${margins.left * 1.5}px`,
                    fontSize: `${baseFontSize}px`,
                    margin: '0 auto',

                    fontFamily: 'Tahoma, Arial, sans-serif',
                    color: '#333333',
                    margin: '0 auto',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #d1d5db'
                }}
            >
                {/* ── Header and Partner Wrapper ── */}
                <div style={{ borderBottom: header.showBottomBorder ? '1px solid #333' : 'none', paddingBottom: header.showBottomBorder ? '8px' : 0, marginBottom: '16px' }}>
                    <div className="flex items-start justify-between mb-2" style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        {(header.order || 'Logo, Company Info, Invoice Info').split(',').map(s => s.trim().toLowerCase()).map((item, idx) => {
                            if (item === 'company info' || item === 'company') {
                                if (page.pageSize === '80mm') return null;
                                return (
                                    <div key="company" className="flex flex-col" style={{ alignItems: isRtl ? 'flex-end' : 'flex-start', textAlign: isRtl ? 'right' : 'left', flex: 1 }}>
                                        {(header.rows || []).map((row, i) => (
                                            <StyledRow key={`h${i}`} row={{ ...row, format: { ...row.format, align: isRtl ? 'right' : 'left' } }} defaultFontSize={page.fontSize || 12} isRtl={isRtl} context={context} />
                                        ))}
                                    </div>
                                );
                            } else if (item === 'invoice info' || item === 'invoice') {
                                const titleObj = header.titles?.saleInvoice || { text: 'فاتورة ضريبية مبسطة\nSIMPLIFIED TAX INVOICE', format: { fontSize: 14, bold: true } };
                                return (
                                    <div key="invoice" className="flex flex-col gap-1" style={{ alignItems: page.pageSize === '80mm' ? 'center' : 'center', textAlign: page.pageSize === '80mm' ? 'center' : 'center', flex: 1, padding: '0 16px' }}>
                                        <StyledRow row={{ ...titleObj, format: { ...titleObj.format, align: page.pageSize === '80mm' ? 'center' : 'center' } }} defaultFontSize={14} isRtl={isRtl} context={context} />
                                        <div className="flex flex-col gap-0.5 w-full items-center">
                                            {(header.invoiceInfoRows || []).map((row, i) => (
                                                <StyledRow key={`ii${i}`} row={{ ...row, format: { ...row.format, align: page.pageSize === '80mm' ? 'center' : 'center' } }} defaultFontSize={10} isRtl={isRtl} context={context} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            } else if (item === 'logo') {
                                return (
                                    <div key="logo" style={{
                                        display: 'flex', alignItems: 'center', justifyContent: isRtl ? 'flex-end' : 'flex-start', minWidth: '70px', flex: 1,
                                        marginTop: logo.margins?.top ? `${logo.margins.top}px` : 0,
                                        marginRight: logo.margins?.right ? `${logo.margins.right}px` : 0,
                                        marginBottom: logo.margins?.bottom ? `${logo.margins.bottom}px` : 0,
                                        marginLeft: logo.margins?.left ? `${logo.margins.left}px` : 0
                                    }}>
                                        {logo.url ? (
                                            <img src={logo.url} alt="Logo" style={{ width: `${logo.size || 70}px`, maxHeight: '80px', objectFit: 'contain' }} />
                                        ) : (
                                            <div style={{ border: '2px dashed #d1d5db', borderRadius: '4px', padding: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '55px' }}>
                                                <span style={{ fontSize: '9px', color: '#9ca3af', lineHeight: '1.25', display: 'block' }}>ضــع<br />شعارك<br />هنــا</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>

                    {/* Partner info */}
                    <div style={{ textAlign: page.pageSize === '80mm' ? 'center' : (isRtl ? 'right' : 'left'), display: 'flex', flexDirection: 'column', alignItems: page.pageSize === '80mm' ? 'center' : 'stretch' }}>
                        {(partner.clientRows || []).map((row, i) => (
                            <StyledRow key={`p${i}`} row={{ ...row, format: { ...row.format, align: page.pageSize === '80mm' ? 'center' : row.format.align } }} defaultFontSize={11} isRtl={isRtl} context={context} />
                        ))}
                        {page.pageSize === '80mm' && (partner.supplierRows || []).map((row, i) => (
                            <StyledRow key={`ps${i}`} row={{ ...row, format: { ...row.format, align: 'center' } }} defaultFontSize={11} isRtl={isRtl} context={context} />
                        ))}
                        {(!partner.clientRows || partner.clientRows.length === 0) && (
                            <>
                                <p style={{ fontSize: '11px', color: '#111827', margin: 0 }}>عبدالعزيز بن ناصر الشهري</p>
                                <p style={{ fontSize: '11px', color: '#111827', margin: 0 }}>{`{{partner.tax_number}}`}</p>
                                <p style={{ fontSize: '11px', color: '#111827', margin: 0 }}>طريق الملك فهد الرياض</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Table */}
                {enabledCols.length > 0 && (
                    <table style={{ width: '100%', marginBottom: '16px', fontSize: '12px', borderCollapse: 'collapse', border: page.pageSize !== '80mm' && table.showTableLines !== false ? '1px solid #ddd' : 'none' }}>
                        <thead>
                            <tr style={{ backgroundColor: page.pageSize === '80mm' ? 'transparent' : '#f3f4f6', borderBottom: page.pageSize === '80mm' ? '1px dashed #ccc' : 'none' }}>
                                {enabledCols.map(col => (
                                    <th key={col.key} className={`${page.pageSize === '80mm' ? 'p-1' : 'p-2'} font-bold text-center`} style={{
                                        border: page.pageSize !== '80mm' && table.showTableLines !== false ? '1px solid #ddd' : 'none',
                                        fontSize: `${col.labelFormat?.fontSize || 11}px`,
                                        color: col.labelFormat?.color || '#333',
                                        fontWeight: col.labelFormat?.bold ? 'bold' : 'bold',
                                    }}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sampleProducts.map((row, i) => (
                                <tr key={i} className={i % 2 === 0 && page.pageSize !== '80mm' ? 'bg-blue-50/20' : ''}>
                                    {enabledCols.map(col => (
                                        <td key={col.key} className={`${page.pageSize === '80mm' ? 'p-1' : 'p-2'} text-center`} style={{
                                            border: page.pageSize !== '80mm' && table.showTableLines !== false ? '1px solid #ddd' : 'none',
                                            fontSize: `${col.valueFormat?.fontSize || 11}px`,
                                            color: col.valueFormat?.color || '#000',
                                        }}>
                                            {row[col.key] || '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Totals */}
                {enabledFooterRows.length > 0 && (
                    <div className="w-[45%] mt-6" style={{ marginInlineEnd: 'auto', marginInlineStart: 0 }}>
                        {enabledFooterRows.map((row) => {
                            const isTotal = row.key === 'total' || row.key === 'paid';
                            return (
                                <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', borderTop: isTotal ? '2px solid #000' : 'none', borderBottom: row.key === 'total' ? '2px solid #000' : 'none' }}>
                                    <span style={{ fontWeight: isTotal ? 'bold' : 'normal', color: isTotal ? '#000000' : '#374151' }}>{row.label}</span>
                                    <span style={{ fontWeight: isTotal ? 'bold' : '500', color: isTotal ? '#000000' : '#111827' }}>{sampleTotals[row.key] || '0.00'}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Signatures */}
                {page.pageSize !== '80mm' && (
                    <div className="flex justify-around mt-8 mb-4">
                        {(footer.signatures || []).filter(s => s.rows?.[0]?.text).map((sig, i) => (
                            <div key={i} className="text-center text-xs">
                                {sig.rows.map((r, j) => (
                                    <StyledRow key={j} row={r} defaultFontSize={10} isRtl={isRtl} context={context} />
                                ))}
                                <div className="w-24 border-b border-gray-400 mt-1 mx-auto" />
                                <p className="text-gray-400 mt-1">التوقيع</p>
                            </div>
                        ))}
                        {(!footer.signatures || footer.signatures.every(s => !s.rows?.[0]?.text)) && (
                            <div className="text-center text-xs">
                                <div className="w-24 border-b border-gray-400 mb-1" />
                                <span className="text-gray-400">التوقيع</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Notes + QR */}
                <div className={`flex mt-4 pt-3 border-t border-gray-100 ${page.pageSize === '80mm' ? 'flex-col items-center gap-4' : 'items-end justify-between'}`}>
                    <div className="text-xs text-gray-500" style={{ textAlign: page.pageSize === '80mm' ? 'center' : (isRtl ? 'right' : 'left'), width: page.pageSize === '80mm' ? '100%' : 'auto' }}>
                        {(footer.notesRows || []).map((r, i) => (
                            <StyledRow key={i} row={{ ...r, format: { ...r.format, align: page.pageSize === '80mm' ? 'center' : r.format.align } }} defaultFontSize={9} isRtl={isRtl} context={context} />
                        ))}
                        {(!footer.notesRows || footer.notesRows.length === 0) && 'ملاحظات'}
                    </div>
                    <div className="shrink-0 flex justify-center w-full">
                        <ZatcaQRCode company={context.company || {}} totals={sampleTotals} size={56} />
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * GeneralPreview — general template preview with placeholder resolution.
 */
export const GeneralPreview = ({ template = {}, direction = 'rtl', context = {} }) => {
    const page = template.page || {};
    const logo = template.logo || {};
    const header = template.header || {};
    const footer = template.footer || {};
    const isRtl = direction === 'rtl';
    const margins = page.margins || { top: 40, right: 40, bottom: 40, left: 40 };
    const sigs = (footer.signatures || []).filter(s => s.rows?.[0]?.text || s.imageUrl);

    const getPageDimensions = () => {
        const pSize = page.pageSize?.toLowerCase() || 'a4';
        switch (pSize) {
            case '80mm': return { width: '302px', minHeight: '500px', fontSizeMod: 0.75 };
            case 'a5': return { width: '559px', minHeight: '794px', fontSizeMod: 0.9 };
            case 'letter': return { width: '816px', minHeight: '1056px', fontSizeMod: 1 };
            case 'a4':
            default: return { width: '794px', minHeight: '1123px', fontSizeMod: 1 };
        }
    };
    const { width: pageWidth, minHeight: pageMinHeight, fontSizeMod } = getPageDimensions();
    const baseFontSize = (page.fontSize || 12) * fontSizeMod * 1.4;

    return (
        <div className="w-full h-full overflow-auto bg-gray-100 rounded-md p-4 flex justify-center">
            <div
                dir={direction}
                style={{
                    backgroundColor: '#ffffff',
                    display: 'flex', flexDirection: 'column',
                    width: pageWidth,
                    minHeight: pageMinHeight,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #d1d5db',
                    padding: `${margins.top * 1.5}px ${margins.right * 1.5}px ${margins.bottom * 1.5}px ${margins.left * 1.5}px`,
                    fontSize: `${baseFontSize}px`,
                    fontFamily: 'Tahoma, Arial, sans-serif',
                    color: '#333333',
                    margin: '0 auto'
                }}
            >
                {/* Header: company info + logo */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                        {(header.rows || []).map((row, i) => (
                            <StyledRow key={i} row={row} defaultFontSize={page.fontSize || 12} isRtl={isRtl} context={context} />
                        ))}
                    </div>
                    {logo.url ? (
                        <img src={logo.url} alt="" style={{ width: `${logo.size || 70}px`, maxHeight: '60px', objectFit: 'contain' }} />
                    ) : null}
                </div>

                {/* Address rows from branch context */}
                <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px' }}>
                    <p style={{ margin: 0 }}>{context.branch?.address_line_1 || 'dammam'}</p>
                    <p style={{ margin: 0 }}>{context.branch?.city || 'region'}</p>
                </div>

                {/* Page inline header TextBlocks */}
                {(page.headerRows || []).filter(r => r.text).map((r, i) => (
                    <StyledRow key={`ph${i}`} row={r} defaultFontSize={page.fontSize || 12} isRtl={isRtl} context={context} />
                ))}

                {/* Content placeholder */}
                <div style={{ flex: 1, margin: '32px 0', color: '#999999', fontSize: '14px', textAlign: 'center' }}>محتوى اختباري</div>

                {/* Signatures — matching reference layout */}
                {sigs.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 'auto', paddingTop: '16px' }}>
                        {sigs.map((sig, i) => (
                            <div key={i} style={{ textAlign: 'center', fontSize: '12px' }}>
                                {sig.imageUrl && (
                                    <img src={sig.imageUrl} alt="" className="mx-auto mb-1" style={{ maxWidth: `${sig.imageSize || 100}px`, maxHeight: '40px', objectFit: 'contain' }} />
                                )}
                                {(sig.rows || []).map((r, j) => (
                                    <StyledRow key={j} row={r} defaultFontSize={11} isRtl={isRtl} context={context} />
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Page inline footer TextBlocks */}
                {(page.footerRows || []).filter(r => r.text).map((r, i) => (
                    <StyledRow key={`pf${i}`} row={r} defaultFontSize={page.fontSize || 12} isRtl={isRtl} context={context} />
                ))}
            </div>
        </div>
    );
};

/**
 * LabelPreview — product label preview.
 */
export const LabelPreview = ({ width = 40, height = 22, direction = 'rtl', rows = [], fontSize = 10, margins = {}, context = {} }) => {
    const MM_PX = 3.78;
    const isRtl = direction === 'rtl';
    return (
        <div className="flex flex-col items-center">
            <div dir={direction} style={{ backgroundColor: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #d1d5db', width: `${width * MM_PX}px`, height: `${height * MM_PX}px`, padding: `${(margins.top || 2) * MM_PX * 0.5}px ${(margins.right || 3) * MM_PX * 0.5}px`, overflow: 'hidden' }}>
                {rows.map((row, i) => (
                    <StyledRow key={i} row={row} defaultFontSize={fontSize} isRtl={isRtl} context={context} />
                ))}
            </div>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '8px' }}>{width} × {height} ملم</p>
        </div>
    );
};


export default InvoicePreview;
