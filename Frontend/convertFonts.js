import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontsDir = path.join(__dirname, 'src', 'assets', 'fonts');
const outputDir = path.join(__dirname, 'src', 'assets', 'fonts');

const regularFont = fs.readFileSync(path.join(fontsDir, 'Cairo-Regular.ttf'));
const boldFont = fs.readFileSync(path.join(fontsDir, 'Cairo-Bold.ttf'));

const regularBase64 = regularFont.toString('base64');
const boldBase64 = boldFont.toString('base64');

const jsContent = `
export const CairoRegularBase64 = "${regularBase64}";
export const CairoBoldBase64 = "${boldBase64}";
`;

fs.writeFileSync(path.join(outputDir, 'CairoFonts.js'), jsContent);
console.log('Fonts converted to base64 successfully.');
