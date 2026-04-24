import { processArabic } from './arabic';
import { jsPDF } from 'jspdf';
import { TajawalRegular, TajawalBold } from './tajawalfonts';

const ARABIC_RANGE = /[\u0600-\u06FF]/;
const PRESENTATION_FORMS = /[\uFB50-\uFDFF\uFE70-\uFEFF]/;

const registerFonts = function registerFonts() {
    try {
        if (this?.__arabicFontsRegistered) {
            return;
        }
        if (typeof this?.addFileToVFS === 'function' && typeof this?.addFont === 'function') {
            this.addFileToVFS('Tajawal-Regular.ttf', TajawalRegular);
            this.addFont('Tajawal-Regular.ttf', 'Tajawal', 'normal');
            this.addFileToVFS('Tajawal-Bold.ttf', TajawalBold);
            this.addFont('Tajawal-Bold.ttf', 'Tajawal', 'bold');
            this.__arabicFontsRegistered = true;
        }
    } catch {
        // Keep PDF generation working even if font registration fails.
    }
};

const normalizePdfText = (value) => {
    if (Array.isArray(value)) {
        return value.map(normalizePdfText);
    }

    if (value == null) {
        return value;
    }

    const text = String(value);
    if (!ARABIC_RANGE.test(text) || PRESENTATION_FORMS.test(text)) {
        return text;
    }

    return processArabic(text);
};

const installArabicPdfSupport = () => {
    if (jsPDF.API.__arabicSupportInstalled) {
        return;
    }

    const originalText = jsPDF.API.text;
    const originalSetFont = jsPDF.API.setFont;
    if (typeof originalText !== 'function') {
        return;
    }

    jsPDF.API.text = function patchedText(text, ...args) {
        try {
            registerFonts.call(this);
            return originalText.call(this, normalizePdfText(text), ...args);
        } catch {
            return originalText.call(this, text, ...args);
        }
    };

    if (typeof originalSetFont === 'function') {
        jsPDF.API.setFont = function patchedSetFont(fontName, fontStyle, fontWeight) {
            const nextFontName = fontName === 'Amiri' ? 'Tajawal' : fontName;
            try {
                registerFonts.call(this);
                return originalSetFont.call(this, nextFontName, fontStyle, fontWeight);
            } catch {
                return originalSetFont.call(this, fontName, fontStyle, fontWeight);
            }
        };
    }

    if (Array.isArray(jsPDF.API.events)) {
        jsPDF.API.events.push(['initialized', function initializeArabicFonts() {
            registerFonts.call(this);
            try {
                if (typeof this.setR2L === 'function') {
                    this.setR2L(true);
                }
                this.setFont('Tajawal', 'normal');
            } catch {
                // Ignore and let the document continue with its default font.
            }
        }]);
    }

    jsPDF.API.__arabicSupportInstalled = true;
};

installArabicPdfSupport();

export const createArabicPdfDoc = (...args) => {
    const doc = new jsPDF(...args);
    registerFonts.call(doc);
    try {
        if (typeof doc.setR2L === 'function') {
            doc.setR2L(true);
        }
        doc.setFont('Tajawal', 'normal');
    } catch {
        // Ignore and let the caller continue with jsPDF defaults if needed.
    }
    return doc;
};

export { normalizePdfText, installArabicPdfSupport, registerFonts };
