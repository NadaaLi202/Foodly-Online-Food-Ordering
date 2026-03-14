import { Buffer } from 'buffer';
if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
}

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Document, Page, Text, View, StyleSheet, Font, Image, PDFViewer } from '@react-pdf/renderer';

// We downloaded a fresh, standard Arabic TTF font (Tajawal) directly from Google Fonts into the public folder.
// This rules out the possibility that the original 'Cairo' files were corrupted, WOFF renamed to TTF, or Variable fonts.
const TajawalRegularUrl = `${window.location.origin}/fonts/Tajawal-Regular.ttf`;
const TajawalBoldUrl = `${window.location.origin}/fonts/Tajawal-Bold.ttf`;

Font.register({
    family: 'Cairo', // Keeping the internal name 'Cairo' so all your templates don't break
    fonts: [
        { src: TajawalRegularUrl, fontWeight: 'normal' },
        { src: TajawalBoldUrl, fontWeight: 'bold' }
    ]
});

// ZATCA TLV encoding
const buildZatcaTlv = ({ sellerName = '', vatNumber = '', timestamp = '', totalWithVat = '', vatAmount = '' }) => {
    const encoder = new TextEncoder();
    const fields = [
        { tag: 1, value: String(sellerName) },
        { tag: 2, value: String(vatNumber) },
        { tag: 3, value: String(timestamp) },
        { tag: 4, value: String(totalWithVat) },
        { tag: 5, value: String(vatAmount) },
    ];
    let buffers = [];
    let totalLen = 0;

    for (const { tag, value } of fields) {
        const valBytes = encoder.encode(value);
        const tlv = new Uint8Array(2 + valBytes.length);
        tlv[0] = tag;
        tlv[1] = valBytes.length;
        tlv.set(valBytes, 2);
        buffers.push(tlv);
        totalLen += tlv.length;
    }

    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const b of buffers) {
        result.set(b, offset);
        offset += b.length;
    }

    // btoa fallback for Node/Browser environments
    if (typeof btoa !== 'undefined') {
        let binary = '';
        const bytes = new Uint8Array(result);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    return '';
};

// Generates QR Code Data URL asynchronously
const useQRCodeDataUrl = (company, totals) => {
    const [qrUrl, setQrUrl] = useState('');
    useEffect(() => {
        const tlvBase64 = buildZatcaTlv({
            sellerName: company?.name || 'Company',
            vatNumber: company?.tax_number || '300000000000003',
            timestamp: new Date().toISOString(),
            totalWithVat: totals?.total || '0.00',
            vatAmount: totals?.vat || '0.00',
        });

        QRCode.toDataURL(tlvBase64, {
            errorCorrectionLevel: 'M',
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' }
        }).then(url => setQrUrl(url)).catch(console.error);
    }, [JSON.stringify(company), JSON.stringify(totals)]);
    return qrUrl;
};

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

const filterTitleRows = (rows = []) => {
    return rows.filter(r => {
        if (!r || !r.text) return false;
        const text = r.text.toLowerCase();
        return !text.includes('simplified tax invoice') &&
            !text.includes('فاتورة ضريبية مبسطة') &&
            !text.includes('tax invoice');
    });
};

/* ═════════════════════════════════════════════════════════════════
   Global Styles for PDF Elements
   ═════════════════════════════════════════════════════════════ */
const s = StyleSheet.create({
    page: { fontFamily: 'Cairo', display: 'flex', flexDirection: 'column' },
    row: { display: 'flex', flexDirection: 'row' },
    col: { display: 'flex', flexDirection: 'column' },
    textRight: { textAlign: 'right' },
    textCenter: { textAlign: 'center' },
    textLeft: { textAlign: 'left' },
    bold: { fontWeight: 'bold' },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: '#333' },
    dashedBottom: { borderBottomWidth: 1, borderBottomColor: '#ccc', borderBottomStyle: 'dashed' },
    dashedTop: { borderTopWidth: 1, borderTopColor: '#ccc', borderTopStyle: 'dashed' },
    table: { width: '100%', marginBottom: 16 },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderColor: '#ddd' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd' },
    tableCell: { padding: 4, textAlign: 'center', justifyContent: 'center' },
    tableThermalHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ccc', borderBottomStyle: 'dashed' },
    tableThermalRow: { flexDirection: 'row' },
});

const PdfTextRow = ({ row, defaultSize, isRtl, context }) => {
    const text = resolvePlaceholders(row?.text || '', context);
    if (!text) return null;
    const fmt = row?.format || {};
    const fontSize = fmt.fontSize || defaultSize;
    let align = fmt.align || (isRtl ? 'right' : 'left');

    return (
        <Text style={{
            fontSize: fontSize,
            color: fmt.color || '#000',
            textAlign: align,
            fontWeight: fmt.bold ? 'bold' : 'normal',
            marginBottom: 2
        }}>
            {text}
        </Text>
    );
};

const LogoImage = ({ logo, style }) => {
    if (logo && logo.url && typeof logo.url === 'string' && logo.url.trim() !== '') {
        return <Image src={logo.url} style={{ width: logo.size || 70, height: 50, objectFit: 'contain', ...style }} />;
    }
    return (
        <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed', padding: 4, width: 70, height: 50, justifyContent: 'center', alignItems: 'center', ...style }}>
            <Text style={{ fontSize: 8, color: '#9ca3af', textAlign: 'center' }}>شعار</Text>
        </View>
    );
};

/* ═════════════════════════════════════════════════════════════════
   Design 1: Arabic-Only Layout
   ═════════════════════════════════════════════════════════════ */
const Design1Layout = ({ template, context, sampleProducts, sampleTotals, isRtl, qrUrl }) => {
    const { page = {}, logo = {}, header = {}, partner = {}, table = {}, footer = {} } = template;
    const titleObj = header.titles?.saleInvoice || { text: 'فاتورة ضريبية', format: { fontSize: 14, bold: true } };
    const enabledCols = (table.columns || []).filter(c => c.enabled !== false);
    const enabledFooter = (table.footerRows || []).filter(r => r.enabled !== false);

    return (
        <View style={s.col}>
            {/* Header */}
            <View style={[s.row, { justifyContent: 'space-between', marginBottom: 16, paddingBottom: 8, ...(header.showBottomBorder ? s.borderBottom : {}) }]}>
                <View style={{ width: 70 }}>
                    {qrUrl && typeof qrUrl === 'string' && qrUrl.startsWith('data:') && <Image src={qrUrl} style={{ width: 70, height: 70 }} />}
                </View>
                <View style={[s.col, { flex: 1, paddingHorizontal: 16 }]}>
                    <PdfTextRow row={{ ...titleObj, format: { ...titleObj.format, align: 'center' } }} defaultSize={16} isRtl={isRtl} context={context} />
                    {filterTitleRows(header.invoiceInfoRows).map((r, i) => (
                        <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'center' } }} defaultSize={11} isRtl={isRtl} context={context} />
                    ))}
                </View>
                <View style={{ width: 70, alignItems: 'flex-end' }}>
                    <LogoImage logo={logo} />
                </View>
            </View>

            {/* From/To */}
            <View style={[s.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
                <View style={[s.col, { flex: 1 }]}>
                    <Text style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'right' }}>إلى :</Text>
                    {(partner.clientRows || []).map((r, i) => (
                        <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'right' } }} defaultSize={11} isRtl={true} context={context} />
                    ))}
                </View>
                <View style={{ width: 24 }} />
                <View style={[s.col, { flex: 1 }]}>
                    <Text style={{ fontSize: 11, color: '#666', marginBottom: 4, textAlign: 'right' }}>من :</Text>
                    {(header.rows || []).map((r, i) => (
                        <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'right' } }} defaultSize={page.fontSize || 12} isRtl={true} context={context} />
                    ))}
                </View>
            </View>

            {/* Table */}
            {enabledCols.length > 0 && (
                <View style={s.table}>
                    <View style={s.tableHeaderRow}>
                        {enabledCols.map(col => (
                            <View key={col.key} style={[s.tableCell, { flex: 1 }]}>
                                <Text style={{ fontSize: col.labelFormat?.fontSize || 11, fontWeight: 'bold' }}>{col.label}</Text>
                            </View>
                        ))}
                    </View>
                    {sampleProducts.map((row, i) => (
                        <View key={i} style={s.tableRow}>
                            {enabledCols.map(col => (
                                <View key={col.key} style={[s.tableCell, { flex: 1 }]}>
                                    <Text style={{ fontSize: col.valueFormat?.fontSize || 11 }}>{row[col.key] || '-'}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            )}

            {/* Totals */}
            {enabledFooter.length > 0 && (
                <View style={[s.col, { width: '45%' }]}>
                    {enabledFooter.map(r => {
                        const isTotal = r.key === 'total' || r.key === 'paid';
                        return (
                            <View key={r.key} style={[s.row, { justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: isTotal ? 1 : 0, borderBottomWidth: r.key === 'total' ? 1 : 0, borderColor: '#000' }]}>
                                <Text style={{ fontSize: 12, fontWeight: isTotal ? 'bold' : 'normal' }}>{r.label}</Text>
                                <Text style={{ fontSize: 12, fontWeight: isTotal ? 'bold' : 'normal' }}>{sampleTotals[r.key] || '0.00'}</Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Signature & Notes */}
            <View style={[s.row, { justifyContent: 'space-between', marginTop: 32, alignItems: 'flex-end' }]}>
                <View style={s.col}>
                    {footer.signatures?.filter(s => s.rows?.[0]?.text).length > 0 ? (
                        footer.signatures.filter(s => s.rows?.[0]?.text).map((sig, i) => (
                            <View key={i} style={s.col}>
                                {sig.rows.map((r, j) => <PdfTextRow key={j} row={r} defaultSize={10} isRtl={isRtl} context={context} />)}
                                <View style={{ width: 120, borderBottomWidth: 1, borderColor: '#999', marginTop: 4 }} />
                            </View>
                        ))
                    ) : (
                        <View style={s.col}>
                            <View style={{ width: 120, borderBottomWidth: 1, borderColor: '#999', marginBottom: 4 }} />
                            <Text style={{ fontSize: 12, color: '#999' }}>التوقيع</Text>
                        </View>
                    )}
                </View>
                <View style={[s.col, { alignItems: 'flex-end' }]}>
                    {(footer.notesRows || []).map((r, i) => (
                        <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'right' } }} defaultSize={12} isRtl={isRtl} context={context} />
                    ))}
                    {(!footer.notesRows || footer.notesRows.length === 0) && (
                        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>ملاحظات</Text>
                    )}
                </View>
            </View>
        </View>
    );
};

/* ═════════════════════════════════════════════════════════════════
   Design 2: Bilingual Layout
   ═════════════════════════════════════════════════════════════ */
const Design2Layout = ({ template, context, sampleProducts, sampleTotals, isRtl, qrUrl }) => {
    const { page = {}, logo = {}, header = {}, partner = {}, table = {}, footer = {} } = template;
    const titleObj = header.titles?.saleInvoice || { text: 'فاتورة ضريبية\nTAX INVOICE', format: { fontSize: 14, bold: true } };
    const enabledCols = (table.columns || []).filter(c => c.enabled !== false);
    const enabledFooter = (table.footerRows || []).filter(r => r.enabled !== false);

    return (
        <View style={s.col}>
            {/* Header */}
            <View style={[s.row, { justifyContent: 'space-between', marginBottom: 8 }]}>
                <View style={[s.col, { flex: 1 }]}>
                    {(header.rows || []).map((r, i) => <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'left' } }} defaultSize={page.fontSize || 12} isRtl={false} context={context} />)}
                </View>
                <View style={{ width: 70, alignItems: 'center' }}>
                    <LogoImage logo={logo} />
                </View>
                <View style={[s.col, { flex: 1 }]}>
                    {(header.rows || []).map((r, i) => <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'right' } }} defaultSize={page.fontSize || 12} isRtl={true} context={context} />)}
                </View>
            </View>

            {/* Title */}
            <View style={[s.col, { alignItems: 'center', marginBottom: 12, paddingBottom: 8, ...(header.showBottomBorder ? s.borderBottom : {}) }]}>
                <PdfTextRow row={{ ...titleObj, format: { ...titleObj.format, align: 'center' } }} defaultSize={16} isRtl={isRtl} context={context} />
            </View>

            {/* Info */}
            <View style={[s.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
                <View style={[s.col, { flex: 1 }]}>
                    {(partner.clientRows || []).map((r, i) => <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'left' } }} defaultSize={11} isRtl={false} context={context} />)}
                </View>
                <View style={[s.col, { flex: 1 }]}>
                    {filterTitleRows(header.invoiceInfoRows).map((r, i) => <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'right' } }} defaultSize={11} isRtl={true} context={context} />)}
                </View>
            </View>

            {/* Table */}
            {enabledCols.length > 0 && (
                <View style={s.table}>
                    <View style={s.tableHeaderRow}>
                        {enabledCols.map(col => (
                            <View key={col.key} style={[s.tableCell, { flex: 1 }]}>
                                <Text style={{ fontSize: col.labelFormat?.fontSize || 11, fontWeight: 'bold' }}>{col.label}</Text>
                            </View>
                        ))}
                    </View>
                    {sampleProducts.map((row, i) => (
                        <View key={i} style={s.tableRow}>
                            {enabledCols.map(col => (
                                <View key={col.key} style={[s.tableCell, { flex: 1 }]}>
                                    <Text style={{ fontSize: col.valueFormat?.fontSize || 11 }}>{row[col.key] || '-'}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            )}

            {/* Totals */}
            {enabledFooter.length > 0 && (
                <View style={[s.col, { width: '45%' }]}>
                    {enabledFooter.map(r => {
                        const isTotal = r.key === 'total' || r.key === 'paid';
                        return (
                            <View key={r.key} style={[s.row, { justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: isTotal ? 1 : 0, borderBottomWidth: r.key === 'total' ? 1 : 0, borderColor: '#000' }]}>
                                <Text style={{ fontSize: 12 }}>{r.label}</Text>
                                <Text style={{ fontSize: 12, fontWeight: isTotal ? 'bold' : 'normal' }}>{sampleTotals[r.key] || '0.00'}</Text>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Sign and Notes */}
            <View style={[s.row, { justifyContent: 'space-between', marginTop: 32, alignItems: 'flex-end' }]}>
                <View style={s.col}>
                    {footer.signatures?.filter(s => s.rows?.[0]?.text).length > 0 ? (
                        footer.signatures.filter(s => s.rows?.[0]?.text).map((sig, i) => (
                            <View key={i} style={s.col}>
                                {sig.rows.map((r, j) => <PdfTextRow key={j} row={r} defaultSize={10} isRtl={isRtl} context={context} />)}
                                <View style={{ width: 120, borderBottomWidth: 1, borderColor: '#999', marginTop: 4 }} />
                            </View>
                        ))
                    ) : (
                        <View style={s.col}>
                            <View style={{ width: 120, borderBottomWidth: 1, borderColor: '#999', marginBottom: 4 }} />
                            <Text style={{ fontSize: 12, color: '#999' }}>Signature - التوقيع</Text>
                        </View>
                    )}
                </View>
                <View style={[s.col, { alignItems: 'flex-end', gap: 4 }]}>
                    {(footer.notesRows || []).map((r, i) => <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'right' } }} defaultSize={12} isRtl={isRtl} context={context} />)}
                    {(!footer.notesRows || footer.notesRows.length === 0) && <Text style={{ fontSize: 12, color: '#999' }}>Notes - ملاحظات</Text>}
                    {qrUrl && typeof qrUrl === 'string' && qrUrl.startsWith('data:') && <Image src={qrUrl} style={{ width: 56, height: 56, marginTop: 4 }} />}
                </View>
            </View>

            {/* Bank Bar */}
            <View style={{ marginTop: 'auto', paddingTop: 24 }}>
                <View style={{ backgroundColor: '#f3f4f6', padding: 8, borderTopWidth: 1, borderColor: '#ddd' }}>
                    <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
                        مصرف الراجحي     رقم الحساب : 00000000000000     رقم الايبان : SA0000000000000000000
                    </Text>
                </View>
            </View>
        </View>
    );
};

/* ═════════════════════════════════════════════════════════════════
   Thermal Layout
   ═════════════════════════════════════════════════════════════ */
const ThermalLayout = ({ template, context, sampleProducts, sampleTotals, isRtl, qrUrl }) => {
    const { page = {}, logo = {}, header = {}, partner = {}, table = {}, footer = {} } = template;
    const titleObj = header.titles?.saleInvoice || { text: 'فاتورة ضريبية', format: { fontSize: 14, bold: true } };
    const enabledCols = (table.columns || []).filter(c => c.enabled !== false);
    const enabledFooter = (table.footerRows || []).filter(r => r.enabled !== false);

    return (
        <View style={[s.col, { alignItems: 'center' }]}>
            <View style={{ marginBottom: 8, alignItems: 'center' }}>
                <LogoImage logo={logo} style={{ width: 90, height: 70 }} />
            </View>

            {(header.rows || []).map((r, i) => <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'center' } }} defaultSize={10} isRtl={isRtl} context={context} />)}

            <View style={{ marginVertical: 8 }}>
                <PdfTextRow row={{ ...titleObj, format: { ...titleObj.format, align: 'center' } }} defaultSize={12} isRtl={isRtl} context={context} />
            </View>

            {filterTitleRows(header.invoiceInfoRows).map((r, i) => <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'center' } }} defaultSize={9} isRtl={isRtl} context={context} />)}

            <View style={{ marginVertical: 8, width: '100%' }}>
                {(partner.clientRows || []).map((r, i) => <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'center' } }} defaultSize={9} isRtl={isRtl} context={context} />)}
            </View>

            <View style={[s.dashedBottom, { width: '100%', marginBottom: 4 }]} />

            {enabledCols.length > 0 && (
                <View style={[s.table, { marginBottom: 8 }]}>
                    <View style={s.tableThermalHeaderRow}>
                        {enabledCols.map(col => (
                            <View key={col.key} style={[s.tableCell, { flex: 1, padding: 2 }]}>
                                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{col.label}</Text>
                            </View>
                        ))}
                    </View>
                    {sampleProducts.map((row, i) => (
                        <View key={i} style={s.tableThermalRow}>
                            {enabledCols.map(col => (
                                <View key={col.key} style={[s.tableCell, { flex: 1, padding: 2 }]}>
                                    <Text style={{ fontSize: 9 }}>{row[col.key] || '-'}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            )}

            <View style={[s.dashedTop, { width: '100%', marginTop: 4 }]} />

            {enabledFooter.length > 0 && (
                <View style={[s.col, { width: '90%' }]}>
                    {enabledFooter.map(r => {
                        const isTotal = r.key === 'total' || r.key === 'paid';
                        return (
                            <View key={r.key} style={[s.row, { justifyContent: 'space-between', paddingVertical: 2, borderTopWidth: isTotal ? 1 : 0, borderColor: '#ccc', borderTopStyle: 'dashed' }]}>
                                <Text style={{ fontSize: 9 }}>{r.label}</Text>
                                <Text style={{ fontSize: 9, fontWeight: isTotal ? 'bold' : 'normal' }}>{sampleTotals[r.key] || '0.00'}</Text>
                            </View>
                        );
                    })}
                </View>
            )}

            <View style={[s.col, { marginVertical: 8, width: '100%', alignItems: 'center' }]}>
                {(footer.notesRows || []).map((r, i) => <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'center' } }} defaultSize={9} isRtl={isRtl} context={context} />)}
                {(!footer.notesRows || footer.notesRows.length === 0) && <Text style={{ fontSize: 10, fontWeight: 'bold' }}>ملاحظات</Text>}
            </View>

            {qrUrl && typeof qrUrl === 'string' && qrUrl.startsWith('data:') && <Image src={qrUrl} style={{ width: 80, height: 80 }} />}
        </View>
    );
};

/* ═════════════════════════════════════════════════════════════════
   InvoicePreview
   ═════════════════════════════════════════════════════════════ */
const InvoicePreview = ({ template = {}, direction = 'rtl', context = {} }) => {
    const page = template.page || {};
    const table = template.table || {};
    const isRtl = direction === 'rtl';
    const margins = page.margins || { top: 40, right: 40, bottom: 40, left: 40 };
    const designId = template.designId || 'design-1';

    const pSize = page?.pageSize ? String(page.pageSize).toLowerCase() : 'a4';
    const isThermal = pSize === '80mm';
    const pageSizeArr = isThermal ? [226, 800] : (pSize === 'a5' ? 'A5' : (pSize === 'letter' ? 'LETTER' : 'A4'));

    const deductTax = table.deductTaxFromAmounts === true;
    const basePrice = 5000.00;
    const qty = 1;
    const rawSubtotal = basePrice * qty;
    const vatRate = 0.15;
    let computedSubtotal = deductTax ? rawSubtotal / (1 + vatRate) : rawSubtotal;
    let computedVat = deductTax ? computedSubtotal * vatRate : rawSubtotal * vatRate;
    let computedTotal = deductTax ? rawSubtotal : rawSubtotal + computedVat;

    // Use dynamic items/totals from context if available, otherwise use fallback dummy data
    const sampleProducts = context?.items?.length > 0 ? context.items : [
        { lineNumber: '1', description: 'شاشة كمبيوتر حديثة', quantity: `${qty}`, price: basePrice.toFixed(2), taxRate: '15%', subtotal: computedSubtotal.toFixed(2), taxAmount: computedVat.toFixed(2), total: computedTotal.toFixed(2), discount: '0.00', code: 'SCR-01' },
        { lineNumber: '2', description: 'لوحة مفاتيح لاسلكية', quantity: '2', price: '150.00', taxRate: '15%', subtotal: '300.00', taxAmount: '45.00', total: '345.00', discount: '0.00', code: 'KB-02' }
    ];
    
    const sampleTotals = context?.totals || { subtotal: computedSubtotal.toFixed(2), discount: '0.00', vat: computedVat.toFixed(2), total: computedTotal.toFixed(2), paid: computedTotal.toFixed(2), remaining: '0.00' };

    const qrUrl = useQRCodeDataUrl(context.company, sampleTotals);
    const layoutProps = { template, context, sampleProducts, sampleTotals, isRtl, qrUrl };

    return (
        <div className="w-full h-full rounded-md border border-gray-300 overflow-hidden">
            <PDFViewer width="100%" height="100%" showToolbar={true}>
                <Document>
                    <Page size={pageSizeArr} style={[s.page, { padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px` }]}>
                        {isThermal ? <ThermalLayout {...layoutProps} /> : designId === 'design-2' ? <Design2Layout {...layoutProps} /> : <Design1Layout {...layoutProps} />}
                    </Page>
                </Document>
            </PDFViewer>
        </div>
    );
};

export const GeneralPreview = ({ template = {}, direction = 'rtl', context = {} }) => {
    return (
        <div className="w-full h-full rounded-md border border-gray-300 flex items-center justify-center bg-gray-100">
            <span className="text-gray-500">General Preview rendering uses standard HTML currently. Not fully migrated to PDFViewer yet.</span>
        </div>
    );
};

export const LabelPreview = ({ width = 40, height = 22, direction = 'rtl', rows = [], fontSize = 10, margins = {}, context = {} }) => {
    return (
        <div className="w-full h-full rounded-md border border-gray-300 flex items-center justify-center bg-gray-100">
            <span className="text-gray-500">Label Preview rendering uses standard HTML currently. Not fully migrated to PDFViewer yet.</span>
        </div>
    );
};

export default InvoicePreview;
