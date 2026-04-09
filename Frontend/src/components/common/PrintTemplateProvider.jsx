import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { setPrintTemplateRequestHandler, getSavedPrintTemplate, setSavedPrintTemplate, PRINT_TEMPLATE_OPTIONS, normalizePrintTemplate, requestPrintTemplateSelection } from '../../services/printTemplateService';

const getPreviewTone = (value) => {
    switch (value) {
        case 'thermal':
            return {
                frame: 'bg-white border-gray-300',
                accent: 'bg-gray-900',
                header: 'bg-gray-100',
                line: 'bg-gray-200',
                badge: 'bg-gray-900',
            };
        case 'normal':
            return {
                frame: 'bg-white border-slate-200',
                accent: 'bg-indigo-600',
                header: 'bg-indigo-50',
                line: 'bg-slate-200',
                badge: 'bg-indigo-600',
            };
        case 'tax':
        default:
            return {
                frame: 'bg-white border-indigo-200',
                accent: 'bg-indigo-600',
                header: 'bg-indigo-50',
                line: 'bg-indigo-100',
                badge: 'bg-indigo-600',
            };
    }
};

const ModalPreview = ({ template }) => {
    const tones = getPreviewTone(template);

    return (
        <div className={`h-full rounded-lg border ${tones.frame} overflow-hidden shadow-inner`}>
            <div className={`${tones.header} border-b border-gray-200 px-4 py-3 flex items-center justify-between`}>
                <div className={`h-2 rounded-full ${tones.accent}`} style={{ width: template === 'thermal' ? '48px' : '72px' }} />
                <div className={`h-2 rounded-full ${tones.line}`} style={{ width: '28px' }} />
            </div>
            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                        <div className={`h-3 rounded ${tones.line}`} style={{ width: '58%' }} />
                        <div className={`h-2 rounded ${tones.line}`} style={{ width: '36%' }} />
                        <div className={`h-2 rounded ${tones.line}`} style={{ width: '42%' }} />
                    </div>
                    <div className={`h-10 w-10 rounded ${tones.badge} opacity-90`} />
                </div>
                <div className="rounded-md border border-gray-200 overflow-hidden">
                    <div className={`${tones.header} grid grid-cols-4 gap-2 px-3 py-2`}>
                        <span className="h-2 rounded bg-white/80" />
                        <span className="h-2 rounded bg-white/80" />
                        <span className="h-2 rounded bg-white/80" />
                        <span className="h-2 rounded bg-white/80" />
                    </div>
                    <div className="space-y-2 px-3 py-3 bg-white">
                        <div className="grid grid-cols-4 gap-2">
                            <span className={`h-2 rounded ${tones.line}`} />
                            <span className={`h-2 rounded ${tones.line}`} />
                            <span className={`h-2 rounded ${tones.line}`} />
                            <span className={`h-2 rounded ${tones.line}`} />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <span className={`h-2 rounded ${tones.line}`} />
                            <span className={`h-2 rounded ${tones.line}`} />
                            <span className={`h-2 rounded ${tones.line}`} />
                            <span className={`h-2 rounded ${tones.line}`} />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <span className={`h-2 rounded ${tones.line}`} />
                            <span className={`h-2 rounded ${tones.line}`} />
                            <span className={`h-2 rounded ${tones.line}`} />
                            <span className={`h-2 rounded ${tones.line}`} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                    <div className={`h-2 rounded ${tones.line}`} style={{ width: '38%' }} />
                    <div className={`h-7 rounded-md ${tones.badge} opacity-85`} style={{ width: template === 'thermal' ? '92px' : '120px' }} />
                </div>
            </div>
        </div>
    );
};

const PrintTemplateProvider = ({ children }) => {
    const { t, i18n } = useTranslation();
    const defaultTemplate = getSavedPrintTemplate();
    const [isReady, setIsReady] = useState(false);
    const [request, setRequest] = useState(null);
    const requestRef = useRef(null);
    const originalPrintRef = useRef(null);
    const selectedTemplateRef = useRef(defaultTemplate);

    const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);

    useEffect(() => {
        selectedTemplateRef.current = selectedTemplate;
    }, [selectedTemplate]);

    useEffect(() => {
        setPrintTemplateRequestHandler((meta = {}) => {
            if (requestRef.current?.promise) {
                return requestRef.current.promise;
            }

            let resolveFn;
            let rejectFn;
            const promise = new Promise((resolve, reject) => {
                resolveFn = resolve;
                rejectFn = reject;
            });

            const initial = normalizePrintTemplate(meta.template || getSavedPrintTemplate());
            requestRef.current = { meta, resolve: resolveFn, reject: rejectFn, promise };
            setSelectedTemplate(initial);
            setRequest({ meta, template: initial });
            return promise;
        });

        setIsReady(true);
        return () => {
            setPrintTemplateRequestHandler(null);
            requestRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        originalPrintRef.current = window.print.bind(window);
        window.print = async (...args) => {
            try {
                const resolved = await requestPrintTemplateSelection({ actionType: 'print', source: 'window.print' });
                setSavedPrintTemplate(selectedTemplateRef.current || resolved || getSavedPrintTemplate());
                document.documentElement.dataset.printTemplate = resolved;
                return originalPrintRef.current(...args);
            } catch {
                return undefined;
            }
        };

        return () => {
            if (originalPrintRef.current) {
                window.print = originalPrintRef.current;
            }
            delete document.documentElement.dataset.printTemplate;
        };
    }, []);

    const closeRequest = () => {
        const current = requestRef.current;
        if (current?.reject) {
            const abortError = new DOMException('Print template selection cancelled', 'AbortError');
            current.reject(abortError);
        }
        requestRef.current = null;
        setRequest(null);
    };

    const handleCancel = () => {
        closeRequest();
    };

    const handleConfirm = () => {
        const current = requestRef.current;
        if (!current?.resolve) return;

        const normalized = setSavedPrintTemplate(selectedTemplate);
        document.documentElement.dataset.printTemplate = normalized;
        current.resolve(normalized);
        requestRef.current = null;
        setRequest(null);
    };

    const optionLabel = (opt) => t(opt.labelKey, opt.fallbackLabel);

    const previewTemplate = selectedTemplate || getSavedPrintTemplate();
    const isRTL = i18n.language === 'ar';

    return (
        <>
            {children}
            {isReady && request && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="w-full max-w-[920px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-gray-800">{t('اختر قالب المستند', 'اختر قالب المستند')}</h2>
                        </div>

                        <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
                            <div className="min-h-[360px] bg-gray-50 p-4 md:p-5">
                                <ModalPreview template={previewTemplate} />
                            </div>

                            <div className="border-t border-gray-100 bg-white p-4 md:border-t-0 md:border-s md:p-5">
                                <div className="space-y-3">
                                    {PRINT_TEMPLATE_OPTIONS.map((opt) => {
                                        const checked = selectedTemplate === opt.value;
                                        return (
                                            <label
                                                key={opt.value}
                                                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${checked ? 'border-indigo-300 bg-indigo-50/70' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="print-template"
                                                        value={opt.value}
                                                        checked={checked}
                                                        onChange={() => setSelectedTemplate(opt.value)}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm font-semibold text-gray-800">{optionLabel(opt)}</span>
                                                </span>
                                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    {opt.value}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800 border border-blue-100">
                                    {t('print_template.remember_default', 'سيتم حفظ هذا الاختيار كخيار افتراضي للطباعة القادمة.')}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                {t('Cancel', 'إلغاء')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                {t('sales.common.confirm', 'موافق')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default PrintTemplateProvider;
