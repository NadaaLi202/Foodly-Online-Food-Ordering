
import { processArabic } from './src/utils/arabic.js';

const text = "مرحبا بالعالم هذا اختبار";
const reordered = processArabic(text);

console.log("Original: ", text);
console.log("Processed (Visual): ", reordered);

