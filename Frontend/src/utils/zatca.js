/**
 * Generates ZATCA TLV Base64 string for QR code (Phase 1)
 * @param {string} sellerName - Tag 1
 * @param {string} vatNumber - Tag 2
 * @param {string} timestamp - Tag 3 (ISO 8601)
 * @param {string|number} totalAmount - Tag 4 (Total with VAT)
 * @param {string|number} vatAmount - Tag 5 (VAT total)
 */
export const generateZatcaQR = (sellerName, vatNumber, timestamp, totalAmount, vatAmount) => {
    // Ensure all values are strings
    const tags = [
        String(sellerName || ''),
        String(vatNumber || ''),
        String(timestamp || ''),
        String(totalAmount || '0.00'),
        String(vatAmount || '0.00')
    ];

    let tlvBuffer = [];
    const encoder = new TextEncoder();

    tags.forEach((value, index) => {
        const tag = index + 1;
        const valueBytes = encoder.encode(value);
        
        tlvBuffer.push(tag);
        tlvBuffer.push(valueBytes.length);
        tlvBuffer.push(...valueBytes);
    });

    const uint8Array = new Uint8Array(tlvBuffer);
    
    // Convert to binary string
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }

    // Return Base64 encoded string
    return btoa(binary);
};
