const fs = require('fs');
const path = require('path');

function findFiles(dir, filter) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(findFiles(filePath, filter));
        } else if (filter(filePath)) {
            results.push(filePath);
        }
    });
    return results;
}

const reportsDir = 'c:/Users/khedr/Documents/Dafater-accounting/frontend/src/Pages/Reports';
const files = findFiles(reportsDir, f => f.endsWith('.jsx'));

let updatedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Skip if already has PrintHeader
    if (content.includes('PrintHeader')) return;

    // Look for the main wrapper div common to all reports
    const wrapperTarget = '<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">';
    const wrapperIndex = content.indexOf(wrapperTarget);

    if (wrapperIndex === -1) {
        console.log(`Wrapper not found in ${path.basename(file)}`);
        return;
    }

    // Attempt to extract a title
    let titleStr = "''";
    const h1Match = content.match(/<h1[^>]*>(\{.*?\})<\/h1>/);
    const h1ObjMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
    // Find first t('reports...') occurrence that looks like a title
    const tTitleMatch = content.match(/\{t\('reports\.(?:[^']+_title|[^']+report)'\)(?:\s*\|\|\s*'[^']*')?\}/);

    if (h1Match) {
        titleStr = h1Match[1];
        titleStr = titleStr.substring(1, titleStr.length - 1);
    } else if (tTitleMatch) {
        titleStr = tTitleMatch[0].substring(1, tTitleMatch[0].length - 1);
    } else if (h1ObjMatch) {
        titleStr = `"${h1ObjMatch[1].trim()}"`;
    }

    const hasIsRTL = content.includes('isRTL');

    // Add import statement safely
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex === -1) return; // Skip if no imports
    const endOfLastImport = content.indexOf('\n', lastImportIndex);

    content = content.slice(0, endOfLastImport) + "\nimport PrintHeader from '../../../components/common/PrintHeader';" + content.slice(endOfLastImport);

    // Re-find wrapperTarget index as content length changed
    const newWrapperIndex = content.indexOf(wrapperTarget);

    const headerCode = `\n                    <div className="hidden print:block mb-6">\n                        <PrintHeader title={${titleStr}} isRTL={${hasIsRTL ? 'isRTL' : 'false'}} />\n                    </div>`;

    // Inject right after the wrapper div opens
    content = content.slice(0, newWrapperIndex + wrapperTarget.length) + headerCode + content.slice(newWrapperIndex + wrapperTarget.length);

    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log(`Updated ${path.basename(file)}`);
});

console.log('Total files updated:', updatedCount);
