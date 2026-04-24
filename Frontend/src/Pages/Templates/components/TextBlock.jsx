import React, { useState } from 'react';
import PlaceholderModal from './placeholdermodal.jsx';

/* ─────────────────────── TextBlock ─────────────────────── */
const TextBlock = ({ row, onChange, onDelete, dir = 'rtl', canDelete = true }) => {
    const [showPlaceholder, setShowPlaceholder] = useState(false);

    const fmt = row.format || {};
    const setFmt = (field, value) => onChange({ ...row, format: { ...fmt, [field]: value } });

    const getBtnClass = (active) =>
        `w-10 h-8 inline-flex items-center justify-center text-sm font-semibold shadow-sm ring-1 ring-inset transition-colors ${active
            ? 'bg-indigo-50 ring-indigo-600 text-indigo-600'
            : 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'
        }`;

    return (
        <div className="mb-2">
            <div dir="ltr" className="flex flex-wrap">
                {/* Font Size Dropdown */}
                <div className="relative w-16">
                    <select
                        value={fmt.fontSize || 12}
                        onChange={e => setFmt('fontSize', +e.target.value || 12)}
                        className="bg-white text-sm relative w-full cursor-default border border-gray-300 py-2 ps-3 pe-8 text-start shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none h-8"
                    >
                        {[10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-gray-400">
                            <path fillRule="evenodd" d="M10.53 3.47a.75.75 0 0 0-1.06 0L6.22 6.72a.75.75 0 0 0 1.06 1.06L10 5.06l2.72 2.72a.75.75 0 1 0 1.06-1.06l-3.25-3.25Zm-4.31 9.81 3.25 3.25a.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 1 0-1.06-1.06L10 14.94l-2.72-2.72a.75.75 0 0 0-1.06 1.06Z" clipRule="evenodd"></path>
                        </svg>
                    </span>
                </div>

                {/* Text Color Box */}
                <button type="button" className={getBtnClass(false)}>
                    <label className="size-full flex items-center justify-center cursor-pointer">
                        <input
                            type="color"
                            className="absolute opacity-0 size-[1px]"
                            value={fmt.color || '#000000'}
                            onChange={e => setFmt('color', e.target.value)}
                        />
                        <div className="size-3/5 rounded-sm border border-gray-200" style={{ backgroundColor: fmt.color || '#000000' }}></div>
                    </label>
                </button>

                {/* Align Right */}
                <button type="button" onClick={() => setFmt('align', 'right')} className={getBtnClass(fmt.align === 'right')}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-5"><path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd"></path></svg>
                </button>

                {/* Align Center */}
                <button type="button" onClick={() => setFmt('align', 'center')} className={getBtnClass(fmt.align === 'center')}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-5"><path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd"></path></svg>
                </button>

                {/* Align Left */}
                <button type="button" onClick={() => setFmt('align', 'left')} className={getBtnClass(fmt.align === 'left')}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-5"><path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm7 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd"></path></svg>
                </button>

                {/* Bold */}
                <button type="button" onClick={() => setFmt('bold', !fmt.bold)} className={getBtnClass(fmt.bold)}>
                    B
                </button>

                {/* Background Box Icon (Tool 1) */}
                <button type="button" className={getBtnClass(false)}>
                    <label className="size-full flex items-center justify-center cursor-pointer">
                        <input
                            type="color"
                            className="absolute opacity-0 size-[1px]"
                            value={fmt.bgColor || '#ffffff'}
                            onChange={e => setFmt('bgColor', e.target.value)}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path>
                        </svg>
                    </label>
                </button>

                {/* Placeholder Dropdown button */}
                <button type="button" onClick={() => setShowPlaceholder(true)} className={getBtnClass(showPlaceholder)}>
                    {'{{-}}'}
                </button>

                {/* IF Button */}
                <button type="button" className={`${getBtnClass(false)} !font-normal`}>
                    IF
                </button>

                {/* Delete button */}
                <div className="ms-auto flex items-center">
                    {canDelete && (
                        <button type="button" onClick={onDelete} className="hover:opacity-80 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-5 text-red-500">
                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd"></path>
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-[1px]">
                <textarea
                    dir={dir}
                    value={row.text || ''}
                    onChange={e => onChange({ ...row, text: e.target.value })}
                    rows={2}
                    className="bg-white block w-full border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm resize-y"
                    style={{
                        fontSize: `${fmt.fontSize || 12}px`,
                        color: fmt.color || '#000',
                        textAlign: fmt.align || (dir === 'rtl' ? 'right' : 'left'),
                        fontWeight: fmt.bold ? 'bold' : 'normal',
                        backgroundColor: (fmt.bgColor && fmt.bgColor !== '#ffffff') ? fmt.bgColor : 'transparent'
                    }}
                    placeholder={dir === 'rtl' ? 'اكتب هنا...' : 'Write here...'}
                />
            </div>

            {showPlaceholder && <PlaceholderModal onClose={() => setShowPlaceholder(false)} />}
        </div>
    );
};

/* ─────────────────────── TextBlockList ─────────────────────── */
export const TextBlockList = ({ rows = [], setRows, dir = 'rtl', title = '' }) => {
    const update = (idx, row) => { const next = [...rows]; next[idx] = row; setRows(next); };
    const remove = (idx) => { if (rows.length <= 1) return; setRows(rows.filter((_, i) => i !== idx)); };
    const addAfter = (idx) => { const next = [...rows]; next.splice(idx + 1, 0, { text: '', format: { ...rows[idx]?.format } }); setRows(next); };

    return (
        <div className="grid gap-y-1">
            {title && <p className="text-sm font-semibold text-gray-800 mb-2">{title}</p>}
            {rows.map((row, idx) => (
                <div key={idx}>
                    <TextBlock row={row} dir={dir} onChange={r => update(idx, r)} onDelete={() => remove(idx)} canDelete={rows.length > 1} />

                    {/* Add block button */}
                    <div className="-mt-2.5 flex justify-center relative z-10 mb-4">
                        <button type="button" onClick={() => addAfter(idx)} className="bg-white rounded-full hover:opacity-80 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-5 text-gray-500 hover:text-indigo-500">
                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" clipRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TextBlock;

