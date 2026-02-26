import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Bold, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import PlaceholderModal from './PlaceholderModal.jsx';

/* ─────────────────────── Custom Color Picker ─────────────────────── */
const ColorPicker = ({ color = '#000000', onChange, onClose }) => {
    const [hue, setHue] = useState(0);
    const [sat, setSat] = useState(100);
    const [val, setVal] = useState(0);
    const [rgbInput, setRgbInput] = useState({ r: 0, g: 0, b: 0 });
    const satBoxRef = useRef(null);
    const hueBarRef = useRef(null);

    // Parse initial color
    useEffect(() => {
        const c = color || '#000000';
        const r = parseInt(c.slice(1, 3), 16) || 0;
        const g = parseInt(c.slice(3, 5), 16) || 0;
        const b = parseInt(c.slice(5, 7), 16) || 0;
        setRgbInput({ r, g, b });
        const [h, s, v] = rgbToHsv(r, g, b);
        setHue(h); setSat(s); setVal(v);
    }, []);

    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = max === 0 ? 0 : (max - min) / max, v = max;
        if (max !== min) {
            const d = max - min;
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h /= 6;
        }
        return [h * 360, s * 100, v * 100];
    }

    function hsvToRgb(h, s, v) {
        h /= 360; s /= 100; v /= 100;
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break; case 5: r = v; g = p; b = q; break;
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    const rgbToHex = (r, g, b) => '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');

    const applyHsv = useCallback((h, s, v) => {
        const [r, g, b] = hsvToRgb(h, s, v);
        setRgbInput({ r, g, b });
        onChange(rgbToHex(r, g, b));
    }, [onChange]);

    const handleSatBoxMove = useCallback((e) => {
        const rect = satBoxRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const s = x * 100, v = (1 - y) * 100;
        setSat(s); setVal(v);
        applyHsv(hue, s, v);
    }, [hue, applyHsv]);

    const handleHueMove = useCallback((e) => {
        const rect = hueBarRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const h = x * 360;
        setHue(h);
        applyHsv(h, sat, val);
    }, [sat, val, applyHsv]);

    const startDrag = (handler) => (e) => {
        handler(e);
        const move = (me) => handler(me);
        const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };

    const handleRgbChange = (field, v) => {
        const n = Math.max(0, Math.min(255, parseInt(v) || 0));
        const next = { ...rgbInput, [field]: n };
        setRgbInput(next);
        const [h, s, vv] = rgbToHsv(next.r, next.g, next.b);
        setHue(h); setSat(s); setVal(vv);
        onChange(rgbToHex(next.r, next.g, next.b));
    };

    const presets = ['#000000', '#ff0000', '#990066', '#6600cc', '#0000ff', '#0066ff', '#009999', '#00cc00', '#99cc00', '#ffcc00', '#ff6600'];

    const [hr, hg, hb] = hsvToRgb(hue, 100, 100);
    const hueColor = rgbToHex(hr, hg, hb);

    return (
        <div className="absolute z-50 bg-white border border-gray-300 shadow-xl rounded-lg p-3" style={{ width: '240px' }} onClick={e => e.stopPropagation()}>
            {/* Saturation/Value box */}
            <div ref={satBoxRef} className="w-full h-[140px] rounded cursor-crosshair relative mb-2"
                style={{ background: `linear-gradient(to right, #fff, ${hueColor})` }}
                onMouseDown={startDrag(handleSatBoxMove)}>
                <div className="absolute inset-0 rounded" style={{ background: 'linear-gradient(to bottom, transparent, #000)' }} />
                <div className="absolute w-3 h-3 border-2 border-white rounded-full shadow-md pointer-events-none" style={{ left: `${sat}%`, top: `${100 - val}%`, transform: 'translate(-50%,-50%)' }} />
            </div>
            {/* Hue bar */}
            <div ref={hueBarRef} className="w-full h-3 rounded cursor-pointer relative mb-2"
                style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
                onMouseDown={startDrag(handleHueMove)}>
                <div className="absolute w-3 h-3 border-2 border-white rounded-full shadow-md pointer-events-none" style={{ left: `${hue / 360 * 100}%`, top: '50%', transform: 'translate(-50%,-50%)' }} />
            </div>
            {/* Presets */}
            <div className="flex items-center gap-1 mb-2">
                <div className="w-6 h-6 rounded-full border border-gray-300" style={{ background: `conic-gradient(red,yellow,lime,cyan,blue,magenta,red)` }} />
                {presets.map(c => (
                    <button key={c} type="button" className="w-4 h-4 rounded-sm border border-gray-200" style={{ background: c }}
                        onClick={() => { const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16); setRgbInput({ r, g, b }); const [h, s, v] = rgbToHsv(r, g, b); setHue(h); setSat(s); setVal(v); onChange(c); }} />
                ))}
            </div>
            {/* RGB inputs */}
            <div className="flex gap-2 text-center">
                {['r', 'g', 'b'].map(f => (
                    <div key={f} className="flex-1">
                        <input type="number" min={0} max={255} value={rgbInput[f]} onChange={e => handleRgbChange(f, e.target.value)}
                            className="w-full border border-gray-300 rounded text-xs text-center py-1 outline-none" />
                        <span className="text-[10px] text-gray-400 uppercase">{f}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ─────────────────────── TextBlock ─────────────────────── */
const TextBlock = ({ row, onChange, onDelete, dir = 'rtl', canDelete = true }) => {
    const [showColor, setShowColor] = useState(false);
    const [showPlaceholder, setShowPlaceholder] = useState(false);
    const colorRef = useRef(null);

    const fmt = row.format || {};
    const setFmt = (field, value) => onChange({ ...row, format: { ...fmt, [field]: value } });

    // Close color picker on outside click
    useEffect(() => {
        if (!showColor) return;
        const handler = (e) => { if (colorRef.current && !colorRef.current.contains(e.target)) setShowColor(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showColor]);

    return (
        <div className="mb-3">
            {/* Toolbar */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-t px-2 py-1.5 flex-wrap">
                {/* Font size */}
                <div className="flex items-center border border-gray-300 rounded bg-white h-7 w-14">
                    <input type="number" min={6} max={72} value={fmt.fontSize || 12}
                        onChange={e => setFmt('fontSize', +e.target.value || 12)}
                        className="w-full text-center text-xs border-none outline-none bg-transparent" />
                </div>
                {/* Color */}
                <div className="relative" ref={colorRef}>
                    <button type="button" onClick={() => setShowColor(!showColor)}
                        className="w-7 h-7 border border-gray-300 rounded cursor-pointer"
                        style={{ background: fmt.color || '#000000' }} />
                    {showColor && <ColorPicker color={fmt.color || '#000000'} onChange={c => setFmt('color', c)} onClose={() => setShowColor(false)} />}
                </div>
                <div className="w-px h-5 bg-gray-300 mx-0.5" />
                {/* Alignment */}
                {[
                    { align: 'right', icon: <AlignRight size={14} /> },
                    { align: 'center', icon: <AlignCenter size={14} /> },
                    { align: 'left', icon: <AlignLeft size={14} /> },
                ].map(({ align, icon }) => (
                    <button key={align} type="button" onClick={() => setFmt('align', align)}
                        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${fmt.align === align ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200 text-gray-600'}`}>
                        {icon}
                    </button>
                ))}
                <div className="w-px h-5 bg-gray-300 mx-0.5" />
                {/* Bold */}
                <button type="button" onClick={() => setFmt('bold', !fmt.bold)}
                    className={`w-7 h-7 flex items-center justify-center rounded font-bold text-sm transition-colors ${fmt.bold ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200 text-gray-600'}`}>
                    <Bold size={14} />
                </button>
                {/* Placeholder */}
                <button type="button" onClick={() => setShowPlaceholder(true)}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600 text-xs font-mono">
                    {'{{}}'}
                </button>
                {/* Delete row */}
                {canDelete && (
                    <button type="button" onClick={onDelete}
                        className="ml-auto w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50">
                        <X size={14} />
                    </button>
                )}
            </div>
            {/* Textarea */}
            <textarea
                dir={dir}
                value={row.text || ''}
                onChange={e => onChange({ ...row, text: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 border-t-0 rounded-b px-3 py-2 text-sm resize-y outline-none focus:border-indigo-300"
                style={{
                    fontSize: `${fmt.fontSize || 12}px`,
                    color: fmt.color || '#000',
                    textAlign: fmt.align || (dir === 'rtl' ? 'right' : 'left'),
                    fontWeight: fmt.bold ? 'bold' : 'normal',
                }}
                placeholder="اكتب هنا..."
            />
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
        <div>
            {title && <p className="text-sm font-semibold text-gray-800 mb-2">{title}</p>}
            {rows.map((row, idx) => (
                <React.Fragment key={idx}>
                    <TextBlock row={row} dir={dir}
                        onChange={r => update(idx, r)}
                        onDelete={() => remove(idx)}
                        canDelete={rows.length > 1}
                    />
                    {/* Add block between rows */}
                    <div className="flex justify-center -mt-1 mb-2">
                        <button type="button" onClick={() => addAfter(idx)}
                            className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 text-gray-400 hover:text-indigo-500 hover:border-indigo-400 bg-white text-xs transition-colors">
                            <Plus size={12} />
                        </button>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
};

export default TextBlock;
