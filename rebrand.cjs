const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const excludeDirs = ['node_modules', '.git', '.gemini', '.next', 'dist', 'build', 'tmp'];
const excludeFiles = ['rebrand.cjs', 'patch.js', 'patch.cjs', 'package-lock.json'];
const includeExtensions = ['.jsx', '.js', '.tsx', '.ts', '.html', '.css', '.json', '.md'];

const replacements = [
    { pattern: /الاستاذ|الأستاذ|الأُستاذ/g, replacement: 'دفتر المحاسب' },
    { pattern: /Alostaz|alostaz|ALOSTAZ|al-ostaz|al_ostaz/g, replacement: 'daftar-almohaseb' },
    { pattern: /app\.alostaz\.io|alostaz\.io/g, replacement: 'app.daftar-almohaseb.com' }
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!excludeDirs.includes(file)) {
                processDirectory(fullPath);
            }
        } else {
            const ext = path.extname(file);
            if (includeExtensions.includes(ext) && !excludeFiles.includes(file)) {
                processFile(fullPath);
            }
        }
    }
}

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let hasChanges = false;

        for (const { pattern, replacement } of replacements) {
            if (pattern.test(content)) {
                content = content.replace(pattern, replacement);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (err) {
        console.error(`Error processing ${filePath}: ${err.message}`);
    }
}

console.log('Starting global rebranding...');
processDirectory(rootDir);
console.log('Global rebranding complete.');
