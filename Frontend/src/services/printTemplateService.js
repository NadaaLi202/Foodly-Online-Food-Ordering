const STORAGE_KEY = 'dafater.printTemplatePreference';

let requestHandler = null;

export const PRINT_TEMPLATE_OPTIONS = [
    { value: 'tax', labelKey: 'sales_settings.template_arabic_tax', fallbackLabel: 'قالب فاتورة ضريبية عربي' },
    { value: 'normal', labelKey: 'sales_settings.template_arabic_normal', fallbackLabel: 'قالب فاتورة عادية عربي' },
    { value: 'thermal', labelKey: 'sales_settings.template_arabic_thermal', fallbackLabel: 'قالب فاتورة طابعة حرارية عربي' },
    { value: 'invoice-qa', labelKey: 'sales_settings.template_invoice_qa', fallbackLabel: 'أداة اختيار الفواتير' },
];

export const DEFAULT_PRINT_TEMPLATE = 'tax';

export const normalizePrintTemplate = (value) => {
    const next = String(value || '').trim().toLowerCase();
    return PRINT_TEMPLATE_OPTIONS.some(opt => opt.value === next) ? next : DEFAULT_PRINT_TEMPLATE;
};

export const getSavedPrintTemplate = () => {
    if (typeof window === 'undefined') {
        return DEFAULT_PRINT_TEMPLATE;
    }

    try {
        return normalizePrintTemplate(window.localStorage.getItem(STORAGE_KEY));
    } catch {
        return DEFAULT_PRINT_TEMPLATE;
    }
};

export const setSavedPrintTemplate = (value) => {
    if (typeof window === 'undefined') {
        return normalizePrintTemplate(value);
    }

    const normalized = normalizePrintTemplate(value);
    try {
        window.localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
        // Ignore storage failures and continue with the in-memory selection.
    }
    return normalized;
};

export const setPrintTemplateRequestHandler = (handler) => {
    requestHandler = handler;
};

export const requestPrintTemplateSelection = async (meta = {}) => {
    if (typeof requestHandler === 'function') {
        return requestHandler(meta);
    }
    return getSavedPrintTemplate();
};

