import React, { useState, useRef, useEffect } from 'react';

/**
 * MarginsPopover — inline popover with 4 spinners around a green rectangle.
 * Matches reference: small dropdown, not fullscreen modal.
 */
const MarginsPopover = ({ margins = {}, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const top = margins.top ?? 40;
    const right = margins.right ?? 40;
    const bottom = margins.bottom ?? 40;
    const left = margins.left ?? 40;

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const update = (key, val) => {
        onChange?.({ ...margins, [key]: Number(val) || 0 });
    };

    const spinnerClass = "w-14 h-8 border border-gray-300 rounded text-center text-sm outline-none focus:border-indigo-400 bg-white";

    return (
        <div className="relative inline-block" ref={ref}>
            {/* Trigger button — matching reference: small icon button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors"
                title="الهوامش"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-600">
                    <rect x="3" y="3" width="18" height="18" rx="1" strokeDasharray="3 2" />
                    <rect x="7" y="7" width="10" height="10" rx="0.5" />
                </svg>
            </button>

            {/* Popover */}
            {open && (
                <div
                    className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 mt-1"
                    style={{ [document.documentElement.dir === 'rtl' ? 'right' : 'left']: 0 }}
                >
                    <div className="flex flex-col items-center gap-1">
                        {/* Top */}
                        <input
                            type="number"
                            value={top}
                            onChange={e => update('top', e.target.value)}
                            className={spinnerClass}
                            min={0}
                        />
                        {/* Middle row: left + green box + right */}
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={left}
                                onChange={e => update('left', e.target.value)}
                                className={spinnerClass}
                                min={0}
                            />
                            <div className="w-10 h-8 bg-emerald-500 rounded" />
                            <input
                                type="number"
                                value={right}
                                onChange={e => update('right', e.target.value)}
                                className={spinnerClass}
                                min={0}
                            />
                        </div>
                        {/* Bottom */}
                        <input
                            type="number"
                            value={bottom}
                            onChange={e => update('bottom', e.target.value)}
                            className={spinnerClass}
                            min={0}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarginsPopover;
