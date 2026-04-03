import reshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/**
 * Processes Arabic text for jsPDF.
 * 1. Reshapes characters (converts to the correct glyph form based on position).
 * 2. Applies Bidi algorithm to reorder for RTL.
 * 
 * @param {string} text - The input text (Arabic or mixed).
 * @returns {string} - The processed text ready for jsPDF.
 */
export function processArabic(text) {
    if (!text || typeof text !== 'string') return text || "";

    // Only process if it contains Arabic characters
    if (!/[\u0600-\u06FF]/.test(text)) {
        return text;
    }

    try {
        // Step 1: Reshape using arabic-reshaper
        // This connects the letters into their presentation forms (Initial, Medial, Final, Isolated)
        const reshaped = reshaper.convertArabic(text);
        const bidiData = bidi.getEmbeddingLevels(reshaped);
        const reordered = bidi.getReorderedString(reshaped, bidiData);

        return reordered;
    } catch (error) {
        console.error('Error processing Arabic text:', error);
        // Fallback to simple reverse if shaping fails
        return text.split('').reverse().join('');
    }
}
