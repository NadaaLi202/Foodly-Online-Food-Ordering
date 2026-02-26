import React from 'react';

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

    // Sample data for preview
    const sampleProducts = [
        { lineNumber: 'قلم رصاص', description: 'قلم رصاص خشبي أسود مع ممحاة', quantity: '10 قطع', price: '2.00', taxRate: '15%', subtotal: '15.00', taxAmount: '3.00', total: '23.00', discount: '0.00', code: 'PEN-01' },
    ];
    const sampleTotals = { subtotal: '15.00', discount: '0.00', vat: '3.00', total: '23.00', paid: '23.00', remaining: '0.00' };

    return (
        <div
            dir={direction}
            className="bg-white shadow-lg border border-gray-300 mx-auto"
            style={{
                width: '100%',
                maxWidth: '580px',
                minHeight: '820px',
                padding: `${margins.top * 0.6}px ${margins.right * 0.6}px ${margins.bottom * 0.6}px ${margins.left * 0.6}px`,
                fontSize: `${page.fontSize || 12}px`,
                fontFamily: 'Tahoma, Arial, sans-serif',
            }}
        >
            {/* ── Header ── */}
            <div className="flex items-start justify-between mb-3" style={{ borderBottom: header.showBottomBorder ? '2px solid #333' : 'none', paddingBottom: header.showBottomBorder ? '8px' : 0 }}>
                <div style={{ flex: 1 }}>
                    {(header.rows || []).map((row, i) => (
                        <StyledRow key={`h${i}`} row={row} defaultFontSize={page.fontSize || 12} isRtl={isRtl} context={context} />
                    ))}
                </div>
                <div className="flex flex-col items-center" style={{ marginInlineStart: '12px' }}>
                    {logo.url ? (
                        <img src={logo.url} alt="Logo" style={{ width: `${logo.size || 70}px`, maxHeight: '60px', objectFit: 'contain' }} />
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded p-2 text-center flex items-center justify-center" style={{ width: '70px', height: '55px' }}>
                            <span className="text-[9px] text-gray-400 leading-tight block">ضــع<br />شعارك<br />هنــا</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice title + info */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    {(header.invoiceInfoRows || []).map((row, i) => (
                        <StyledRow key={`ii${i}`} row={row} defaultFontSize={11} isRtl={isRtl} context={context} />
                    ))}
                    {(!header.invoiceInfoRows || header.invoiceInfoRows.length === 0) && (
                        <>
                            <p className="text-xs">الرقم &nbsp;&nbsp; INV-25-1-000001</p>
                            <p className="text-xs">التاريخ &nbsp;&nbsp; 2025-09-04</p>
                        </>
                    )}
                </div>
                <p className="font-bold text-base" style={{ textAlign: isRtl ? 'right' : 'left' }}>فاتورة ضريبية مبسطة</p>
            </div>

            {/* Partner info */}
            <div className="mb-4">
                {(partner.clientRows || []).map((row, i) => (
                    <StyledRow key={`p${i}`} row={row} defaultFontSize={11} isRtl={isRtl} context={context} />
                ))}
                {(!partner.clientRows || partner.clientRows.length === 0) && (
                    <>
                        <p className="text-xs text-gray-700">العميل : عبدالعزيز بن ناصر الشهري</p>
                        <p className="text-xs text-gray-700">العنوان : طريق الملك فهد الرياض</p>
                    </>
                )}
            </div>

            {/* Table */}
            {enabledCols.length > 0 && (
                <table className="w-full mb-4 text-xs" style={{ borderCollapse: 'collapse', border: table.showTableLines !== false ? '1px solid #ddd' : 'none' }}>
                    <thead>
                        <tr className="bg-gray-100">
                            {enabledCols.map(col => (
                                <th key={col.key} className="p-2 font-bold text-center" style={{
                                    border: table.showTableLines !== false ? '1px solid #ddd' : 'none',
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
                            <tr key={i} className={i % 2 === 0 ? 'bg-blue-50/20' : ''}>
                                {enabledCols.map(col => (
                                    <td key={col.key} className="p-2 text-center" style={{
                                        border: table.showTableLines !== false ? '1px solid #ddd' : 'none',
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
                <div className="w-3/5 mb-6" style={{ marginInlineStart: 'auto' }}>
                    {enabledFooterRows.map((row) => (
                        <div key={row.key} className="flex justify-between py-1 text-xs border-b border-gray-200">
                            <span className="text-gray-600">{row.label}</span>
                            <span className="font-medium">{sampleTotals[row.key] || '0.00'}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Signatures */}
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

            {/* Notes + QR */}
            <div className="flex items-end justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                    {(footer.notesRows || []).map((r, i) => (
                        <StyledRow key={i} row={r} defaultFontSize={9} isRtl={isRtl} context={context} />
                    ))}
                    {(!footer.notesRows || footer.notesRows.length === 0) && 'ملاحظات'}
                </div>
                <div className="w-14 h-14 border border-gray-300 rounded flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-10 h-10 text-gray-400">
                        <rect x="5" y="5" width="25" height="25" fill="currentColor" /><rect x="35" y="5" width="10" height="10" fill="currentColor" /><rect x="55" y="5" width="10" height="10" fill="currentColor" /><rect x="70" y="5" width="25" height="25" fill="currentColor" />
                        <rect x="5" y="35" width="10" height="10" fill="currentColor" /><rect x="25" y="35" width="10" height="10" fill="currentColor" /><rect x="45" y="35" width="15" height="10" fill="currentColor" /><rect x="65" y="35" width="10" height="10" fill="currentColor" /><rect x="85" y="35" width="10" height="10" fill="currentColor" />
                        <rect x="5" y="50" width="10" height="10" fill="currentColor" /><rect x="25" y="50" width="20" height="10" fill="currentColor" /><rect x="55" y="50" width="10" height="10" fill="currentColor" /><rect x="75" y="50" width="20" height="10" fill="currentColor" />
                        <rect x="5" y="70" width="25" height="25" fill="currentColor" /><rect x="35" y="70" width="10" height="10" fill="currentColor" /><rect x="55" y="65" width="15" height="15" fill="currentColor" /><rect x="75" y="75" width="15" height="10" fill="currentColor" />
                    </svg>
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

    return (
        <div
            dir={direction}
            className="bg-white shadow-lg border border-gray-300 mx-auto flex flex-col"
            style={{
                width: '100%', maxWidth: '580px', minHeight: '820px',
                padding: `${margins.top * 0.6}px ${margins.right * 0.6}px ${margins.bottom * 0.6}px ${margins.left * 0.6}px`,
                fontSize: `${page.fontSize || 12}px`, fontFamily: 'Tahoma, Arial, sans-serif',
            }}
        >
            {/* Header: company info + logo */}
            <div className="flex items-start justify-between mb-2">
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
            <div className="text-xs text-gray-600 mb-1">
                <p>{context.branch?.address_line_1 || 'dammam'}</p>
                <p>{context.branch?.city || 'region'}</p>
            </div>

            {/* Page inline header TextBlocks */}
            {(page.headerRows || []).filter(r => r.text).map((r, i) => (
                <StyledRow key={`ph${i}`} row={r} defaultFontSize={page.fontSize || 12} isRtl={isRtl} context={context} />
            ))}

            {/* Content placeholder */}
            <div className="flex-1 my-8 text-gray-400 text-sm text-center">محتوى اختباري</div>

            {/* Signatures — matching reference layout */}
            {sigs.length > 0 && (
                <div className="flex justify-around mt-auto pt-4">
                    {sigs.map((sig, i) => (
                        <div key={i} className="text-center text-xs">
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
            <div dir={direction} className="bg-white shadow-lg border border-gray-300"
                style={{ width: `${width * MM_PX}px`, height: `${height * MM_PX}px`, padding: `${(margins.top || 2) * MM_PX * 0.5}px ${(margins.right || 3) * MM_PX * 0.5}px`, overflow: 'hidden' }}>
                {rows.map((row, i) => (
                    <StyledRow key={i} row={row} defaultFontSize={fontSize} isRtl={isRtl} context={context} />
                ))}
            </div>
            <p className="text-gray-400 text-xs mt-2">{width} × {height} ملم</p>
        </div>
    );
};

export default InvoicePreview;
