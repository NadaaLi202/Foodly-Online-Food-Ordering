
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processArabic } from './src/utils/arabic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testArabicPdf() {
    const doc = new PDFDocument({ size: 'A4', rtl: true });
    const outputPath = path.join(__dirname, 'test-arabic.pdf');
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Use Arial since it's verified as a real font file
    const fontPath = path.join(__dirname, 'src/assets/fonts/Arial-Regular.ttf');
    doc.registerFont('ArabicFont', fontPath);
    doc.font('ArabicFont');

    doc.fontSize(25).text(processArabic('مرحبا بالعالم هذا اختبار'), { align: 'right' });
    doc.fontSize(15).text(processArabic('هذا اختبار للغة العربية في ملف PDF'), { align: 'right' });
    doc.fontSize(15).text(processArabic('Invoices & Payments - فاتورة ومستندات'), { align: 'right' });

    doc.end();

    stream.on('finish', () => {
        console.log('Test PDF created at:', outputPath);
    });
}

testArabicPdf().catch(console.error);
