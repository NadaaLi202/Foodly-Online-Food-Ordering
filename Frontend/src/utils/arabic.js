import reshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/**
 * Reshape Arabic letters and reorder RTL text for PDF rendering.
 * Used by the shared PDF helper before handing text to jsPDF.
 */
export function processArabic(text) {
    if (!text || typeof text !== 'string') return text || '';
    if (!/[\u0600-\u06FF]/.test(text)) return text;

    try {
        const reshaped = reshaper.convertArabic(text);
        const bidiData = bidi.getEmbeddingLevels(text);
        return bidi.getReorderedString(reshaped, bidiData);
    } catch (error) {
        console.error('Error processing Arabic text:', error);
        return text;
    }
}
