import { Buffer } from 'buffer';

if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
}

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Document, Page, Text, View, StyleSheet, Font, Image, PDFViewer } from '@react-pdf/renderer';

Font.register({
    family: 'Tajawal',
    fonts: [
        { src: '/fonts/Tajawal-Regular.ttf', fontWeight: 'normal' },
        { src: '/fonts/Tajawal-Bold.ttf', fontWeight: 'bold' },
    ],
});

const buildZatcaTlv = ({ sellerName = '', vatNumber = '', timestamp = '', totalWithVat = '', vatAmount = '' }) => {
    const encoder = new TextEncoder();
    const fields = [
        { tag: 1, value: String(sellerName) },
        { tag: 2, value: String(vatNumber) },
        { tag: 3, value: String(timestamp) },
        { tag: 4, value: String(totalWithVat) },
        { tag: 5, value: String(vatAmount) },
    ];

    const buffers = [];
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

    if (typeof btoa !== 'undefined') {
        let binary = '';
        const bytes = new Uint8Array(result);
        for (let i = 0; i < bytes.byteLength; i += 1) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    return '';
};

const normalizeQrDataUrl = (value = '') => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.startsWith('data:image/')) return raw;
    if (/^[A-Za-z0-9+/=]+$/.test(raw)) return `data:image/png;base64,${raw}`;
    return '';
};

const formatAmount = (value) => Number(value || 0).toFixed(2);

const useQRCodeDataUrl = (company, totals) => {
    const [qrUrl, setQrUrl] = useState('');

    useEffect(() => {
        const tlvBase64 = buildZatcaTlv({
            sellerName: company?.name || '',
            vatNumber: company?.vat || company?.tax_number || '',
            timestamp: new Date().toISOString(),
            totalWithVat: totals?.total || '0.00',
            vatAmount: totals?.vat || '0.00',
        });

        if (!tlvBase64) return;

        QRCode.toDataURL(tlvBase64, {
            errorCorrectionLevel: 'M',
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
        })
            .then((url) => setQrUrl(url))
            .catch(() => setQrUrl(''));
    }, [JSON.stringify(company), JSON.stringify(totals)]);

    return qrUrl;
};

const getAccountInfoText = (account) => {
    if (!account) return '';
    if (typeof account === 'string') return account.trim();

    const name = account.name || account.bank_name || account.bankName || '';
    const accountNumber = account.accountNumber || account.account_number || '';
    const iban = account.iban || account.iBan || '';

    const parts = [];
    if (name) parts.push(`البنك: ${name}`);
    if (accountNumber) parts.push(`رقم الحساب: ${accountNumber}`);
    if (iban) parts.push(`الآيبان: ${iban}`);

    return parts.join(' - ');
};

const getPlaceholderValue = (key = '', context = {}) => {
    const trimmed = String(key || '').trim();
    if (!trimmed) return '';

    if (trimmed === 'branch.state') {
        return context?.branch?.state || context?.branch?.region || context?.company?.city || '';
    }

    if (trimmed === 'company.vat' || trimmed === 'company.tax_number') {
        return context?.company?.vat || context?.company?.tax_number || '';
    }

    if (trimmed === 'company.commercial_register' || trimmed === 'company.register') {
        return context?.company?.commercial_register || context?.company?.register || '';
    }

    if (trimmed === 'invoice.name' || trimmed === 'invoice.number') {
        return context?.invoice?.name || context?.invoice?.number || '';
    }

    if (trimmed === 'invoice.invoice_date' || trimmed === 'invoice.date') {
        return context?.invoice?.invoice_date || context?.invoice?.date || '';
    }

    if (trimmed === 'invoice.partner.name' || trimmed === 'partner.name') {
        return context?.invoice?.partner?.name || context?.partner?.name || '';
    }

    if (trimmed === 'invoice.partner.street' || trimmed === 'partner.address') {
        return context?.invoice?.partner?.street || context?.partner?.address || '';
    }

    if (trimmed === 'invoice.partner.vat' || trimmed === 'partner.tax_number') {
        return context?.invoice?.partner?.vat || context?.partner?.vat || context?.partner?.tax_number || '';
    }

    if (trimmed === 'invoice.company_id.account_ids') {
        const list = context?.invoice?.company_id?.account_ids;
        if (!Array.isArray(list)) return '';
        const text = list.map(getAccountInfoText).filter(Boolean).join(' | ');
        return text;
    }

    const parts = trimmed.split('.');
    let val = context;

    for (const part of parts) {
        if (val && Object.prototype.hasOwnProperty.call(val, part)) {
            val = val[part];
        } else {
            return '';
        }
    }

    if (val == null) return '';
    if (Array.isArray(val)) {
        return val
            .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item || '').trim()))
            .filter(Boolean)
            .join(' | ');
    }
    if (typeof val === 'object') return '';
    return val;
};

const extractPlaceholderKeys = (text = '') =>
    [...String(text).matchAll(/\{\{([^}]+)\}\}/g)]
        .map((m) => String(m[1] || '').trim())
        .filter(Boolean);

const resolvePlaceholders = (text = '', context = {}) =>
    String(text).replace(/\{\{([^}]+)\}\}/g, (_, key) => String(getPlaceholderValue(key, context) ?? ''));

const normalizeItem = (line, idx) => {
    const quantity = Number(line?.quantity || 0);
    const price = Number(line?.price ?? line?.unitPrice ?? 0);
    const taxPercent = Number(line?.taxPercent ?? line?.tax_rate ?? line?.taxRate ?? 15);
    const subtotal = Number(line?.subtotal ?? quantity * price);
    const taxAmount = Number(line?.taxAmount ?? line?.tax_amount ?? (subtotal * taxPercent) / 100);
    const total = Number(line?.total ?? subtotal + taxAmount);

    return {
        lineNumber: String(idx + 1),
        description: String(line?.description || line?.productName || line?.name || line?.product?.name || ''),
        quantity: String(line?.quantity ?? 0),
        price: formatAmount(price),
        taxRate: `${taxPercent}%`,
        subtotal: formatAmount(subtotal),
        taxAmount: formatAmount(taxAmount),
        total: formatAmount(total),
        code: String(line?.code || line?.product?.code || ''),
    };
};

const getColumnFlex = (key) => {
    if (key === 'description') return 2.6;
    if (key === 'lineNumber') return 1;
    return 1.2;
};

const s = StyleSheet.create({
    page: {
        fontFamily: 'Tajawal',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        color: '#000000',
        textAlign: 'right',
    },
    row: { display: 'flex', flexDirection: 'row' },
    rowRtl: { display: 'flex', flexDirection: 'row-reverse' },
    col: { display: 'flex', flexDirection: 'column' },

    headerWrap: {
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
        paddingBottom: 10,
        marginBottom: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        width: '52%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    headerCompanyText: {
        flex: 1,
        marginLeft: 8,
        textAlign: 'right',
    },
    headerRight: {
        width: '46%',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    titleText: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },

    buyerBox: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 4,
        padding: 8,
        marginBottom: 10,
    },
    buyerTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' },

    table: { width: '100%', marginBottom: 10 },
    tableHeaderRow: {
        flexDirection: 'row-reverse',
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#d1d5db',
        minHeight: 28,
        alignItems: 'center',
    },
    tableRow: {
        flexDirection: 'row-reverse',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#d1d5db',
        minHeight: 26,
        alignItems: 'center',
    },
    tableCell: {
        borderLeftWidth: 1,
        borderLeftColor: '#d1d5db',
        paddingHorizontal: 6,
        paddingVertical: 4,
        justifyContent: 'center',
    },
    tableHeadText: { fontSize: 10.5, fontWeight: 'bold', textAlign: 'center' },
    tableBodyText: { fontSize: 10, textAlign: 'center' },
    tableBodyTextDesc: { fontSize: 10, textAlign: 'right' },

    totalsWrap: { alignItems: 'flex-end', marginBottom: 14 },
    totalsBox: { width: '46%', minWidth: 200 },
    totalRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
        paddingVertical: 4,
    },
    totalLabel: { fontSize: 11, textAlign: 'right' },
    totalValue: { fontSize: 11, textAlign: 'left' },
    totalBold: { fontWeight: 'bold' },

    footerRow: {
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    signatureText: { fontSize: 11, textAlign: 'left' },
    bankStrip: {
        marginTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#d1d5db',
        backgroundColor: '#f9fafb',
        padding: 6,
    },
    bankStripText: { fontSize: 9.5, textAlign: 'center' },
});

const PdfTextRow = ({ row, defaultSize, isRtl, context, forceAlign }) => {
    const rawText = row?.text || '';
    if (!rawText) return null;

    const keys = extractPlaceholderKeys(rawText);
    if (keys.length > 0) {
        const hasMissingValue = keys.some((key) => !String(getPlaceholderValue(key, context)).trim());
        if (hasMissingValue) return null;
    }

    const text = resolvePlaceholders(rawText, context);
    if (!String(text).trim()) return null;

    const fmt = row?.format || {};

    return (
        <Text
            style={{
                fontFamily: 'Tajawal',
                fontSize: fmt.fontSize || defaultSize,
                color: fmt.color || '#000',
                textAlign: forceAlign || fmt.align || (isRtl ? 'right' : 'left'),
                fontWeight: fmt.bold ? 'bold' : 'normal',
                marginBottom: 2,
            }}
        >
            {text}
        </Text>
    );
};

const LogoImage = ({ logo, style }) => {
    const logoUrl = logo?.url || logo?.logo || '';
    if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) return null;

    return (
        <Image
            src={logoUrl}
            style={{
                width: logo?.size || 64,
                height: 48,
                objectFit: 'contain',
                ...style,
            }}
        />
    );
};

const Design1Layout = ({ template, context, sampleProducts, sampleTotals, qrUrl }) => {
    const { logo = {}, header = {}, partner = {}, table = {}, footer = {} } = template;

    const titleObj = header.titles?.saleInvoice || { text: 'فاتورة ضريبية مبسطة', format: { fontSize: 18, bold: true } };
    const enabledCols = (table.columns || []).filter((c) => c.enabled !== false);
    const enabledFooter = (table.footerRows || []).filter((r) => r.enabled !== false);

    const bankAccounts = context?.invoice?.company_id?.account_ids;
    const bankInfoText = Array.isArray(bankAccounts)
        ? bankAccounts.map(getAccountInfoText).filter(Boolean).join(' | ')
        : '';

    const logoContext = {
        ...logo,
        url: logo?.url || context?.company?.logo || context?.company?.logo_path || '',
    };

    return (
        <View style={s.col}>
            <View style={s.headerWrap}>
                <View style={s.headerRow}>
                    <View style={s.headerLeft}>
                        <LogoImage logo={logoContext} />
                        <View style={s.headerCompanyText}>
                            {(header.rows || []).map((r, i) => (
                                <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'right' } }} defaultSize={11} isRtl context={context} />
                            ))}
                        </View>
                    </View>

                    <View style={s.headerRight}>
                        <PdfTextRow
                            row={{ ...titleObj, format: { ...titleObj.format, align: 'center', bold: true, fontSize: titleObj?.format?.fontSize || 18 } }}
                            defaultSize={18}
                            isRtl
                            context={context}
                            forceAlign="center"
                        />
                        {(header.invoiceInfoRows || []).map((r, i) => (
                            <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'center' } }} defaultSize={11} isRtl context={context} forceAlign="center" />
                        ))}
                    </View>
                </View>
            </View>

            <View style={s.buyerBox}>
                <Text style={s.buyerTitle}>العميل</Text>
                {(partner.clientRows || []).map((r, i) => (
                    <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'right' } }} defaultSize={11} isRtl context={context} />
                ))}
            </View>

            {enabledCols.length > 0 && (
                <View style={s.table}>
                    <View style={s.tableHeaderRow}>
                        {enabledCols.map((col) => (
                            <View key={col.key} style={[s.tableCell, { flex: getColumnFlex(col.key) }]}>
                                <Text style={s.tableHeadText}>{col.label}</Text>
                            </View>
                        ))}
                    </View>

                    {sampleProducts.map((row, i) => (
                        <View key={i} style={s.tableRow}>
                            {enabledCols.map((col) => (
                                <View key={col.key} style={[s.tableCell, { flex: getColumnFlex(col.key) }]}>
                                    <Text style={col.key === 'description' ? s.tableBodyTextDesc : s.tableBodyText}>{row[col.key] || '-'}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            )}

            {enabledFooter.length > 0 && (
                <View style={s.totalsWrap}>
                    <View style={s.totalsBox}>
                        {enabledFooter.map((r) => {
                            const isFinal = r.key === 'total';
                            return (
                                <View key={r.key} style={s.totalRow}>
                                    <Text style={[s.totalLabel, isFinal ? s.totalBold : null]}>{r.label}</Text>
                                    <Text style={[s.totalValue, isFinal ? s.totalBold : null]}>{sampleTotals[r.key] || '0.00'}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            <View style={s.footerRow}>
                <View style={s.col}>
                    <Text style={s.signatureText}>التوقيع : __________________</Text>
                </View>
                <View style={s.col}>
                    {qrUrl ? <Image src={qrUrl} style={{ width: 70, height: 70 }} /> : null}
                </View>
            </View>

            {(footer.notesRows || []).length > 0 && (
                <View style={{ marginTop: 8 }}>
                    {(footer.notesRows || []).map((r, i) => (
                        <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'center' } }} defaultSize={9} isRtl context={context} forceAlign="center" />
                    ))}
                </View>
            )}

            {bankInfoText ? (
                <View style={s.bankStrip}>
                    <Text style={s.bankStripText}>{bankInfoText}</Text>
                </View>
            ) : null}
        </View>
    );
};

const Design2Layout = (props) => <Design1Layout {...props} />;

const ThermalLayout = ({ template, context, sampleProducts, sampleTotals, qrUrl }) => {
    const { logo = {}, header = {}, partner = {}, table = {} } = template;
    const titleObj = header.titles?.saleInvoice || { text: 'فاتورة ضريبية مبسطة', format: { fontSize: 12, bold: true } };
    const enabledCols = (table.columns || []).filter((c) => c.enabled !== false);
    const enabledFooter = (table.footerRows || []).filter((r) => r.enabled !== false);

    return (
        <View style={[s.col, { alignItems: 'center' }]}>
            <LogoImage logo={logo} style={{ width: 90, height: 60 }} />
            <PdfTextRow row={{ ...titleObj, format: { ...titleObj.format, align: 'center' } }} defaultSize={12} isRtl context={context} forceAlign="center" />

            {(header.invoiceInfoRows || []).map((r, i) => (
                <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'center' } }} defaultSize={9} isRtl context={context} forceAlign="center" />
            ))}

            <View style={{ marginVertical: 6, width: '100%' }}>
                {(partner.clientRows || []).map((r, i) => (
                    <PdfTextRow key={i} row={{ ...r, format: { ...r.format, align: 'center' } }} defaultSize={9} isRtl context={context} forceAlign="center" />
                ))}
            </View>

            {enabledCols.length > 0 && (
                <View style={[s.table, { marginBottom: 8 }]}>
                    <View style={s.tableHeaderRow}>
                        {enabledCols.map((col) => (
                            <View key={col.key} style={[s.tableCell, { flex: getColumnFlex(col.key), paddingVertical: 2 }]}>
                                <Text style={{ fontSize: 8.5, fontWeight: 'bold', textAlign: 'center' }}>{col.label}</Text>
                            </View>
                        ))}
                    </View>
                    {sampleProducts.map((row, i) => (
                        <View key={i} style={s.tableRow}>
                            {enabledCols.map((col) => (
                                <View key={col.key} style={[s.tableCell, { flex: getColumnFlex(col.key), paddingVertical: 2 }]}>
                                    <Text style={{ fontSize: 8.5, textAlign: col.key === 'description' ? 'right' : 'center' }}>{row[col.key] || '-'}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            )}

            {enabledFooter.length > 0 && (
                <View style={{ width: '100%', marginBottom: 8 }}>
                    {enabledFooter.map((r) => (
                        <View key={r.key} style={[s.rowRtl, { justifyContent: 'space-between', paddingVertical: 2 }]}> 
                            <Text style={{ fontSize: 9 }}>{r.label}</Text>
                            <Text style={{ fontSize: 9, fontWeight: r.key === 'total' ? 'bold' : 'normal' }}>{sampleTotals[r.key] || '0.00'}</Text>
                        </View>
                    ))}
                </View>
            )}

            {qrUrl ? <Image src={qrUrl} style={{ width: 70, height: 70 }} /> : null}
        </View>
    );
};

const InvoicePreview = ({ template = {}, direction = 'rtl', context = {} }) => {
    const page = template.page || {};
    const table = template.table || {};
    const margins = page.margins || { top: 40, right: 40, bottom: 40, left: 40 };
    const designId = template.designId || 'design-1';

    const pSize = page?.pageSize ? String(page.pageSize).toLowerCase() : 'a4';
    const isThermal = pSize === '80mm';
    const pageSizeArr = isThermal ? [226, 900] : pSize === 'a5' ? 'A5' : pSize === 'letter' ? 'LETTER' : 'A4';

    const deductTax = table.deductTaxFromAmounts === true;
    const basePrice = 5000;
    const qty = 1;
    const rawSubtotal = basePrice * qty;
    const vatRate = 0.15;

    const computedSubtotal = deductTax ? rawSubtotal / (1 + vatRate) : rawSubtotal;
    const computedVat = deductTax ? computedSubtotal * vatRate : rawSubtotal * vatRate;
    const computedTotal = deductTax ? rawSubtotal : rawSubtotal + computedVat;

    const fallbackItems = [
        { lineNumber: '1', description: 'منتج عام', quantity: '1', price: formatAmount(basePrice), taxRate: '15%', subtotal: formatAmount(computedSubtotal), taxAmount: formatAmount(computedVat), total: formatAmount(computedTotal) },
    ];

    const invoiceLineIds = Array.isArray(context?.invoice?.invoice_line_ids)
        ? context.invoice.invoice_line_ids
        : Array.isArray(context?.items)
            ? context.items
            : [];

    const sampleProducts = invoiceLineIds.length > 0
        ? invoiceLineIds.map((line, idx) => normalizeItem(line, idx))
        : fallbackItems;

    const sampleTotals = context?.totals || {
        subtotal: formatAmount(context?.invoice?.amount_untaxed ?? computedSubtotal),
        vat: formatAmount(context?.invoice?.amount_tax ?? computedVat),
        total: formatAmount(context?.invoice?.amount_total ?? computedTotal),
    };

    const normalizedTotals = {
        subtotal: sampleTotals.subtotal || formatAmount(0),
        vat: sampleTotals.vat || formatAmount(0),
        total: sampleTotals.total || formatAmount(0),
    };

    const providedQr = normalizeQrDataUrl(getPlaceholderValue('invoice.qr_code', context));
    const generatedQr = useQRCodeDataUrl(context?.company || {}, normalizedTotals);
    const qrUrl = providedQr || generatedQr;

    const layoutProps = {
        template,
        context,
        sampleProducts,
        sampleTotals: normalizedTotals,
        qrUrl,
    };

    return (
        <div className="w-full h-full rounded-md border border-gray-300 overflow-hidden" dir={direction === 'rtl' ? 'rtl' : 'ltr'}>
            <PDFViewer width="100%" height="100%" showToolbar>
                <Document>
                    <Page
                        size={pageSizeArr}
                        style={[
                            s.page,
                            {
                                paddingTop: Number(margins.top) || 40,
                                paddingRight: Number(margins.right) || 40,
                                paddingBottom: Number(margins.bottom) || 40,
                                paddingLeft: Number(margins.left) || 40,
                            },
                        ]}
                    >
                        {isThermal
                            ? <ThermalLayout {...layoutProps} />
                            : designId === 'design-2'
                                ? <Design2Layout {...layoutProps} />
                                : <Design1Layout {...layoutProps} />}
                    </Page>
                </Document>
            </PDFViewer>
        </div>
    );
};

export const GeneralPreview = () => (
    <div className="w-full h-full rounded-md border border-gray-300 flex items-center justify-center bg-gray-100">
        <span className="text-gray-500">General Preview rendering uses standard HTML currently. Not fully migrated to PDFViewer yet.</span>
    </div>
);

export const LabelPreview = () => (
    <div className="w-full h-full rounded-md border border-gray-300 flex items-center justify-center bg-gray-100">
        <span className="text-gray-500">Label Preview rendering uses standard HTML currently. Not fully migrated to PDFViewer yet.</span>
    </div>
);

export default InvoicePreview;
