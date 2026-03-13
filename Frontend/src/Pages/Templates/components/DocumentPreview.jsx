import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * ZATCA TLV encoder — produces Base64 string for Saudi e-invoicing QR codes.
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

/** QR code component */
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
                width: size, margin: 1,
                color: { dark: '#000000', light: '#ffffff' },
                errorCorrectionLevel: 'M',
            }).catch(err => console.error('QR Error:', err));
        }
    }, [company.name, company.tax_number, totals.total, totals.vat, size]);
    return <canvas ref={canvasRef} width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} />;
};

/**
 * Placeholder resolution engine.
 */
export const resolvePlaceholders = (text = '', context = {}) => {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmed = key.trim();
        const parts = trimmed.split('.');
        let val = context;
        for (const p of parts) {
            if (val && Object.prototype.hasOwnProperty.call(val, p)) {
                val = val[p];
            } else {
                return match;
            }
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
            margin: 0,
        }}>
            {text}
        </p>
    );
};

/* ─────────────────────────────────────────────────────────────────
   Logo Placeholder
   ───────────────────────────────────────────────────────────── */
const LogoPlaceholder = ({ logo = {}, style = {} }) => {
    if (logo.url) {
        return <img src={logo.url} alt="Logo" style={{ width: `${logo.size || 70}px`, maxHeight: '80px', objectFit: 'contain', ...style }} />;
    }
    return (
        <div style={{ border: '2px dashed #d1d5db', borderRadius: '4px', padding: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '55px', ...style }}>
            <span style={{ fontSize: '9px', color: '#9ca3af', lineHeight: '1.25', display: 'block' }}>ضــع<br />شعارك<br />هنــا</span>
        </div>
    );
};

/* ═════════════════════════════════════════════════════════════════
   Helper to filter out legacy duplicate titles from saved invoiceInfoRows
   ═════════════════════════════════════════════════════════════ */
const filterTitleRows = (rows = []) => {
    return rows.filter(r => {
        if (!r || !r.text) return false;
        const text = r.text.toLowerCase();
        return !text.includes('simplified tax invoice') && 
               !text.includes('فاتورة ضريبية مبسطة') && 
               !text.includes('tax invoice'); // Exclude literal translation if present
    });
};

/* ═════════════════════════════════════════════════════════════════
   Design 1: Arabic-Only Layout
   QR top-left, Title center, Logo top-right
   من (company) right,  إلى (client) left
   Arabic table, totals, signature, notes
   ═════════════════════════════════════════════════════════════ */
const Design1Layout = ({ template, context, isRtl, sampleProducts, sampleTotals, enabledCols, enabledFooterRows }) => {
    const page = template.page || {};
    const logo = template.logo || {};
    const header = template.header || {};
    const partner = template.partner || {};
    const table = template.table || {};
    const footer = template.footer || {};

    const titleObj = (header.titles && header.titles.saleInvoice) || { text: 'فاتورة ضريبية', format: { fontSize: 14, bold: true } };

    return (
        <>
            {/* ── Header: QR | Title+Info | Logo ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', borderBottom: header.showBottomBorder ? '1px solid #333' : 'none', paddingBottom: header.showBottomBorder ? '8px' : 0 }}>
                <div style={{ flexShrink: 0 }}>
                    <ZatcaQRCode company={context.company || {}} totals={sampleTotals} size={70} />
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '0 16px' }}>
                    <StyledRow row={{ ...titleObj, format: { ...titleObj.format, align: 'center' } }} defaultFontSize={16} isRtl={isRtl} context={context} />
                    {filterTitleRows(header.invoiceInfoRows).map((row, i) => (
                        <StyledRow key={`ii${i}`} row={{ ...row, format: { ...row.format, align: 'center' } }} defaultFontSize={11} isRtl={isRtl} context={context} />
                    ))}
                </div>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <LogoPlaceholder logo={logo} />
                </div>
            </div>

            {/* ── From / To ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '24px' }}>
                <div style={{ flex: 1, textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 'bold', margin: 0 }}>من :</p>
                    {(header.rows || []).map((row, i) => (
                        <StyledRow key={`h${i}`} row={{ ...row, format: { ...row.format, align: 'right' } }} defaultFontSize={page.fontSize || 12} isRtl={true} context={context} />
                    ))}
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 'bold', margin: 0 }}>إلى :</p>
                    {(partner.clientRows || []).map((row, i) => (
                        <StyledRow key={`p${i}`} row={{ ...row, format: { ...row.format, align: 'right' } }} defaultFontSize={11} isRtl={true} context={context} />
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            {enabledCols.length > 0 && (
                <table style={{ width: '100%', marginBottom: '16px', fontSize: '12px', borderCollapse: 'collapse', border: table.showTableLines !== false ? '1px solid #ddd' : 'none' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            {enabledCols.map(col => (
                                <th key={col.key} style={{ padding: '8px', fontWeight: 'bold', textAlign: 'center', border: table.showTableLines !== false ? '1px solid #ddd' : 'none', fontSize: `${(col.labelFormat?.fontSize) || 11}px` }}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sampleProducts.map((row, i) => (
                            <tr key={i}>
                                {enabledCols.map(col => (
                                    <td key={col.key} style={{ padding: '8px', textAlign: 'center', border: table.showTableLines !== false ? '1px solid #ddd' : 'none', fontSize: `${(col.valueFormat?.fontSize) || 11}px` }}>
                                        {row[col.key] || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* ── Totals ── */}
            {enabledFooterRows.length > 0 && (
                <div style={{ width: '45%' }}>
                    {enabledFooterRows.map((row) => {
                        const isTotal = row.key === 'total' || row.key === 'paid';
                        return (
                            <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', borderTop: isTotal ? '2px solid #000' : 'none', borderBottom: row.key === 'total' ? '2px solid #000' : 'none' }}>
                                <span style={{ fontWeight: isTotal ? 'bold' : 'normal', color: isTotal ? '#000' : '#374151' }}>{row.label}</span>
                                <span style={{ fontWeight: isTotal ? 'bold' : '500', color: isTotal ? '#000' : '#111827' }}>{sampleTotals[row.key] || '0.00'}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Signature + Notes ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', alignItems: 'flex-end' }}>
                <div>
                    {(footer.signatures || []).filter(s => s.rows?.[0]?.text).length > 0
                        ? (footer.signatures || []).filter(s => s.rows?.[0]?.text).map((sig, i) => (
                            <div key={i} style={{ fontSize: '12px' }}>
                                {sig.rows.map((r, j) => <StyledRow key={j} row={r} defaultFontSize={10} isRtl={isRtl} context={context} />)}
                                <div style={{ width: '120px', borderBottom: '1px solid #999', marginTop: '4px' }} />
                            </div>
                        ))
                        : (
                            <div>
                                <div style={{ width: '120px', borderBottom: '1px solid #999', marginBottom: '4px' }} />
                                <span style={{ color: '#999', fontSize: '12px' }}>التوقيع</span>
                            </div>
                        )
                    }
                </div>
                <div style={{ textAlign: 'right' }}>
                    {(footer.notesRows || []).map((r, i) => (
                        <StyledRow key={i} row={{ ...r, format: { ...r.format, align: 'right' } }} defaultFontSize={12} isRtl={isRtl} context={context} />
                    ))}
                    {(!footer.notesRows || footer.notesRows.length === 0) && (
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', margin: 0 }}>ملاحظات</p>
                    )}
                </div>
            </div>
        </>
    );
};


/* ═════════════════════════════════════════════════════════════════
   Design 2: Bilingual Layout
   Company AR right, Logo center, Company EN left
   Title bilingual centered, invoice info + client, bilingual table
   Signature left, Notes+QR right, bank bar bottom
   ═════════════════════════════════════════════════════════════ */
const Design2Layout = ({ template, context, isRtl, sampleProducts, sampleTotals, enabledCols, enabledFooterRows }) => {
    const page = template.page || {};
    const logo = template.logo || {};
    const header = template.header || {};
    const partner = template.partner || {};
    const table = template.table || {};
    const footer = template.footer || {};

    const titleObj = (header.titles && header.titles.saleInvoice) || { text: 'فاتورة ضريبية\nTAX INVOICE', format: { fontSize: 14, bold: true } };

    return (
        <>
            {/* ── Header: Company AR | Logo | Company EN ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ flex: 1, textAlign: 'right' }}>
                    {(header.rows || []).map((row, i) => (
                        <StyledRow key={`h${i}`} row={{ ...row, format: { ...row.format, align: 'right' } }} defaultFontSize={page.fontSize || 12} isRtl={true} context={context} />
                    ))}
                </div>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
                    <LogoPlaceholder logo={logo} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                    {(header.rows || []).map((row, i) => (
                        <StyledRow key={`he${i}`} row={{ ...row, format: { ...row.format, align: 'left' } }} defaultFontSize={page.fontSize || 12} isRtl={false} context={context} />
                    ))}
                </div>
            </div>

            {/* ── Title ── */}
            <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: header.showBottomBorder ? '1px solid #333' : 'none', paddingBottom: header.showBottomBorder ? '8px' : 0 }}>
                <StyledRow row={{ ...titleObj, format: { ...titleObj.format, align: 'center' } }} defaultFontSize={16} isRtl={isRtl} context={context} />
            </div>

            {/* ── Invoice Info | Client Info ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '24px' }}>
                <div style={{ flex: 1 }}>
                    {filterTitleRows(header.invoiceInfoRows).map((row, i) => (
                        <StyledRow key={`ii${i}`} row={row} defaultFontSize={11} isRtl={isRtl} context={context} />
                    ))}
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                    {(partner.clientRows || []).map((row, i) => (
                        <StyledRow key={`p${i}`} row={{ ...row, format: { ...row.format, align: 'right' } }} defaultFontSize={11} isRtl={true} context={context} />
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            {enabledCols.length > 0 && (
                <table style={{ width: '100%', marginBottom: '16px', fontSize: '12px', borderCollapse: 'collapse', border: table.showTableLines !== false ? '1px solid #ddd' : 'none' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            {enabledCols.map(col => (
                                <th key={col.key} style={{ padding: '8px', fontWeight: 'bold', textAlign: 'center', border: table.showTableLines !== false ? '1px solid #ddd' : 'none', fontSize: `${(col.labelFormat?.fontSize) || 11}px` }}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sampleProducts.map((row, i) => (
                            <tr key={i}>
                                {enabledCols.map(col => (
                                    <td key={col.key} style={{ padding: '8px', textAlign: 'center', border: table.showTableLines !== false ? '1px solid #ddd' : 'none', fontSize: `${(col.valueFormat?.fontSize) || 11}px` }}>
                                        {row[col.key] || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* ── Totals ── */}
            {enabledFooterRows.length > 0 && (
                <div style={{ width: '45%' }}>
                    {enabledFooterRows.map((row) => {
                        const isTotal = row.key === 'total' || row.key === 'paid';
                        return (
                            <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', borderTop: isTotal ? '2px solid #000' : 'none', borderBottom: row.key === 'total' ? '2px solid #000' : 'none' }}>
                                <span style={{ fontWeight: isTotal ? 'bold' : 'normal', color: isTotal ? '#000' : '#374151' }}>{row.label}</span>
                                <span style={{ fontWeight: isTotal ? 'bold' : '500', color: isTotal ? '#000' : '#111827' }}>{sampleTotals[row.key] || '0.00'}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Signature left | Notes+QR right ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', alignItems: 'flex-end' }}>
                <div>
                    {(footer.signatures || []).filter(s => s.rows?.[0]?.text).length > 0
                        ? (footer.signatures || []).filter(s => s.rows?.[0]?.text).map((sig, i) => (
                            <div key={i} style={{ fontSize: '12px' }}>
                                {sig.rows.map((r, j) => <StyledRow key={j} row={r} defaultFontSize={10} isRtl={isRtl} context={context} />)}
                                <div style={{ width: '120px', borderBottom: '1px solid #999', marginTop: '4px' }} />
                            </div>
                        ))
                        : (
                            <div>
                                <div style={{ width: '120px', borderBottom: '1px solid #999', marginBottom: '4px' }} />
                                <span style={{ color: '#999', fontSize: '12px' }}>Signature - التوقيع</span>
                            </div>
                        )
                    }
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {(footer.notesRows || []).map((r, i) => (
                        <StyledRow key={i} row={{ ...r, format: { ...r.format, align: 'right' } }} defaultFontSize={12} isRtl={isRtl} context={context} />
                    ))}
                    {(!footer.notesRows || footer.notesRows.length === 0) && (
                        <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Notes - ملاحظات</p>
                    )}
                    <ZatcaQRCode company={context.company || {}} totals={sampleTotals} size={56} />
                </div>
            </div>

            {/* ── Bank info bar ── */}
            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                <div style={{ backgroundColor: '#f3f4f6', padding: '8px 16px', textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #ddd' }}>
                    مصرف الراجحي &nbsp;&nbsp;&nbsp;&nbsp; رقم الحساب : 00000000000000 &nbsp;&nbsp;&nbsp;&nbsp; رقم الايبان : SA0000000000000000000
                </div>
            </div>
        </>
    );
};


/* ═════════════════════════════════════════════════════════════════
   Thermal Layout (receipt style — everything centered)
   ═════════════════════════════════════════════════════════════ */
const ThermalLayout = ({ template, context, isRtl, sampleProducts, sampleTotals, enabledCols, enabledFooterRows }) => {
    const page = template.page || {};
    const logo = template.logo || {};
    const header = template.header || {};
    const partner = template.partner || {};
    const table = template.table || {};
    const footer = template.footer || {};

    const titleObj = (header.titles && header.titles.saleInvoice) || { text: 'فاتورة ضريبية', format: { fontSize: 14, bold: true } };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Logo */}
            <div style={{ marginBottom: '8px' }}>
                <LogoPlaceholder logo={logo} style={{ margin: '0 auto', width: logo.url ? `${logo.size || 90}px` : '90px', height: logo.url ? undefined : '70px' }} />
            </div>

            {/* Company info */}
            {(header.rows || []).map((row, i) => (
                <StyledRow key={`h${i}`} row={{ ...row, format: { ...row.format, align: 'center' } }} defaultFontSize={page.fontSize || 12} isRtl={isRtl} context={context} />
            ))}

            {/* Title */}
            <div style={{ margin: '8px 0' }}>
                <StyledRow row={{ ...titleObj, format: { ...titleObj.format, align: 'center' } }} defaultFontSize={14} isRtl={isRtl} context={context} />
            </div>

            {/* Invoice number + date (only non-title rows from invoiceInfoRows) */}
            {filterTitleRows(header.invoiceInfoRows).map((row, i) => (
                <StyledRow key={`ii${i}`} row={{ ...row, format: { ...row.format, align: 'center' } }} defaultFontSize={11} isRtl={isRtl} context={context} />
            ))}

            {/* Client info */}
            <div style={{ margin: '8px 0', width: '100%' }}>
                {(partner.clientRows || []).map((row, i) => (
                    <StyledRow key={`p${i}`} row={{ ...row, format: { ...row.format, align: 'center' } }} defaultFontSize={10} isRtl={isRtl} context={context} />
                ))}
                {(partner.supplierRows || []).map((row, i) => (
                    <StyledRow key={`ps${i}`} row={{ ...row, format: { ...row.format, align: 'center' } }} defaultFontSize={10} isRtl={isRtl} context={context} />
                ))}
            </div>

            {/* Separator */}
            <div style={{ width: '100%', borderTop: '1px solid #ccc', margin: '4px 0' }} />

            {/* Table */}
            {enabledCols.length > 0 && (
                <table style={{ width: '100%', marginBottom: '8px', fontSize: '10px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px dashed #ccc' }}>
                            {enabledCols.map(col => (
                                <th key={col.key} style={{ padding: '4px', fontWeight: 'bold', textAlign: 'center', fontSize: '10px' }}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sampleProducts.map((row, i) => (
                            <tr key={i}>
                                {enabledCols.map(col => (
                                    <td key={col.key} style={{ padding: '4px', textAlign: 'center', fontSize: '10px' }}>
                                        {row[col.key] || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Totals */}
            <div style={{ width: '100%', borderTop: '1px dashed #ccc', marginTop: '4px' }} />
            {enabledFooterRows.length > 0 && (
                <div style={{ width: '80%', margin: '0 auto' }}>
                    {enabledFooterRows.map((row) => {
                        const isTotal = row.key === 'total' || row.key === 'paid';
                        return (
                            <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '11px', borderTop: isTotal ? '1px dashed #ccc' : 'none' }}>
                                <span style={{ fontWeight: isTotal ? 'bold' : 'normal', color: '#333' }}>{row.label}</span>
                                <span style={{ fontWeight: isTotal ? 'bold' : '500', color: '#111' }}>{sampleTotals[row.key] || '0.00'}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Notes */}
            <div style={{ margin: '12px 0', width: '100%' }}>
                {(footer.notesRows || []).map((r, i) => (
                    <StyledRow key={i} row={{ ...r, format: { ...r.format, align: 'center' } }} defaultFontSize={10} isRtl={isRtl} context={context} />
                ))}
                {(!footer.notesRows || footer.notesRows.length === 0) && (
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', margin: 0 }}>ملاحظات</p>
                )}
            </div>

            {/* QR */}
            <ZatcaQRCode company={context.company || {}} totals={sampleTotals} size={80} />
        </div>
    );
};


/* ═════════════════════════════════════════════════════════════════
   InvoicePreview — DIRECT HTML rendering (no html2canvas/jsPDF)
   Renders live, selectable, editable-looking text on a white page.
   ═════════════════════════════════════════════════════════════ */
const InvoicePreview = ({ template = {}, direction = 'rtl', context = {} }) => {
    const page = template.page || {};
    const table = template.table || {};
    const isRtl = direction === 'rtl';
    const margins = page.margins || { top: 40, right: 40, bottom: 40, left: 40 };
    const designId = template.designId || 'design-1';

    const enabledCols = (table.columns || []).filter(c => c.enabled !== false);
    const enabledFooterRows = (table.footerRows || []).filter(r => r.enabled !== false);

    const deductTax = table.deductTaxFromAmounts === true;
    const basePrice = 5000.00;
    const qty = 1;
    const rawSubtotal = basePrice * qty;
    const vatRate = 0.15;
    let computedSubtotal, computedVat, computedTotal;
    if (deductTax) {
        computedSubtotal = rawSubtotal / (1 + vatRate);
        computedVat = computedSubtotal * vatRate;
        computedTotal = rawSubtotal;
    } else {
        computedSubtotal = rawSubtotal;
        computedVat = rawSubtotal * vatRate;
        computedTotal = rawSubtotal + computedVat;
    }
    const sampleProducts = [
        { lineNumber: 'شاشة كمبيوتر حديثة', description: 'شاشة كمبيوتر حديثة', quantity: `${qty}`, price: basePrice.toFixed(2), taxRate: '15%', subtotal: computedSubtotal.toFixed(2), taxAmount: computedVat.toFixed(2), total: computedTotal.toFixed(2), discount: '0.00', code: 'SCR-01' },
    ];
    const sampleTotals = { subtotal: computedSubtotal.toFixed(2), discount: '0.00', vat: computedVat.toFixed(2), total: computedTotal.toFixed(2), paid: computedTotal.toFixed(2), remaining: '0.00' };

    const getPageDimensions = () => {
        const pSize = page?.pageSize ? String(page.pageSize).toLowerCase() : 'a4';
        switch (pSize) {
            case '80mm': return { width: '302px', minHeight: '500px', fontSizeMod: 0.75 };
            case 'a5': return { width: '559px', minHeight: '794px', fontSizeMod: 0.9 };
            case 'letter': return { width: '816px', minHeight: '1056px', fontSizeMod: 1 };
            case 'a4':
            default: return { width: '794px', minHeight: '1123px', fontSizeMod: 1 };
        }
    };
    const { width: pageWidth, minHeight: pageMinHeight, fontSizeMod } = getPageDimensions();
    const baseFontSize = (page.fontSize || 12) * fontSizeMod;
    const isThermal = String(page.pageSize).toLowerCase() === '80mm';

    const layoutProps = { template, context, isRtl, baseFontSize, sampleProducts, sampleTotals, enabledCols, enabledFooterRows };

    return (
        <div className="w-full h-full overflow-auto bg-gray-200 flex flex-col items-center rounded-md border border-gray-300" style={{ padding: '24px' }}>
            {/* Direct HTML page rendering */}
            <div
                dir={direction}
                style={{
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    width: pageWidth,
                    minHeight: pageMinHeight,
                    padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
                    fontSize: `${baseFontSize}px`,
                    fontFamily: 'Tahoma, Arial, sans-serif',
                    color: '#333333',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    borderRadius: '2px',
                    flexShrink: 0,
                }}
            >
                {isThermal ? (
                    <ThermalLayout {...layoutProps} />
                ) : designId === 'design-2' ? (
                    <Design2Layout {...layoutProps} />
                ) : (
                    <Design1Layout {...layoutProps} />
                )}
            </div>
        </div>
    );
};


/* ═════════════════════════════════════════════════════════════════
   GeneralPreview — general template preview (unchanged logic)
   ═════════════════════════════════════════════════════════════ */
export const GeneralPreview = ({ template = {}, direction = 'rtl', context = {} }) => {
    const page = template.page || {};
    const logo = template.logo || {};
    const header = template.header || {};
    const footer = template.footer || {};
    const isRtl = direction === 'rtl';
    const margins = page.margins || { top: 40, right: 40, bottom: 40, left: 40 };
    const sigs = (footer.signatures || []).filter((s) => s?.rows?.[0]?.text || s?.imageUrl);

    const getPageDimensions = () => {
        const pSize = page?.pageSize ? String(page.pageSize).toLowerCase() : 'a4';
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
        <div className="w-full h-full overflow-auto bg-gray-200 flex flex-col items-center rounded-md border border-gray-300" style={{ padding: '24px' }}>
            <div
                dir={direction}
                style={{
                    backgroundColor: '#ffffff',
                    display: 'flex', flexDirection: 'column',
                    width: pageWidth, minHeight: pageMinHeight,
                    padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
                    fontSize: `${baseFontSize}px`,
                    fontFamily: 'Tahoma, Arial, sans-serif',
                    color: '#333333',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    borderRadius: '2px',
                    flexShrink: 0,
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                        {(header.rows || []).map((row, i) => (
                            <StyledRow key={i} row={row} defaultFontSize={page.fontSize || 12} isRtl={isRtl} context={context} />
                        ))}
                    </div>
                    {logo.url && <img src={logo.url} alt="" style={{ width: `${logo.size || 70}px`, maxHeight: '60px', objectFit: 'contain' }} />}
                </div>

                {/* Address */}
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                    <p style={{ margin: 0 }}>{context.branch?.address_line_1 || 'dammam'}</p>
                    <p style={{ margin: 0 }}>{context.branch?.city || 'region'}</p>
                </div>

                {(page.headerRows || []).filter(r => r.text).map((r, i) => (
                    <StyledRow key={`ph${i}`} row={r} defaultFontSize={page.fontSize || 12} isRtl={isRtl} context={context} />
                ))}

                <div style={{ flex: 1, margin: '32px 0', color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>محتوى اختباري</div>

                {sigs.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 'auto', paddingTop: '16px' }}>
                        {sigs.map((sig, i) => (
                            <div key={i} style={{ textAlign: 'center', fontSize: '12px' }}>
                                {sig.imageUrl && <img src={sig.imageUrl} alt="" style={{ display: 'block', margin: '0 auto 4px', maxWidth: `${sig.imageSize || 100}px`, maxHeight: '40px', objectFit: 'contain' }} />}
                                {(sig.rows || []).map((r, j) => <StyledRow key={j} row={r} defaultFontSize={11} isRtl={isRtl} context={context} />)}
                            </div>
                        ))}
                    </div>
                )}

                {(page.footerRows || []).filter(r => r.text).map((r, i) => (
                    <StyledRow key={`pf${i}`} row={r} defaultFontSize={page.fontSize || 12} isRtl={isRtl} context={context} />
                ))}
            </div>
        </div>
    );
};


/* ═════════════════════════════════════════════════════════════════
   LabelPreview
   ═════════════════════════════════════════════════════════════ */
export const LabelPreview = ({ width = 40, height = 22, direction = 'rtl', rows = [], fontSize = 10, margins = {}, context = {} }) => {
    const MM_PX = 3.78;
    const isRtl = direction === 'rtl';
    return (
        <div className="flex flex-col items-center">
            <div dir={direction} style={{ backgroundColor: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #d1d5db', width: `${width * MM_PX}px`, height: `${height * MM_PX}px`, padding: `${(margins.top || 2) * MM_PX * 0.5}px ${(margins.right || 3) * MM_PX * 0.5}px`, overflow: 'hidden' }}>
                {rows.map((row, i) => <StyledRow key={i} row={row} defaultFontSize={fontSize} isRtl={isRtl} context={context} />)}
            </div>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '8px' }}>{width} × {height} ملم</p>
        </div>
    );
};

export default InvoicePreview;
