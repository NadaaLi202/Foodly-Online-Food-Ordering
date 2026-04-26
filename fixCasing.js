const fs = require('fs');
const path = require('path');

const srcDir = path.resolve('Frontend/src');

function getActualPath(currentDir, targetPath) {
    if (!targetPath.startsWith('.')) return targetPath;
    
    let parts = targetPath.split('/');
    let current = currentDir;
    let actualParts = [];
    
    for (let part of parts) {
        if (part === '.') {
            actualParts.push('.');
            continue;
        }
        if (part === '..') {
            actualParts.push('..');
            current = path.dirname(current);
            continue;
        }
        
        try {
            const items = fs.readdirSync(current);
            const match = items.find(i => i.toLowerCase() === part.toLowerCase() || i.toLowerCase() === part.toLowerCase() + '.js' || i.toLowerCase() === part.toLowerCase() + '.jsx' || i.toLowerCase() === part.toLowerCase() + '.ts' || i.toLowerCase() === part.toLowerCase() + '.tsx' || i.toLowerCase() === part.toLowerCase() + '.css');
            if (match) {
                // If the target path didn't have an extension, don't add the extension to the part
                let actualPart = match;
                if (!part.includes('.')) {
                    if (match.includes('.')) {
                        actualPart = match.substring(0, match.lastIndexOf('.'));
                    }
                }
                actualParts.push(actualPart);
                current = path.join(current, match);
            } else {
                // File not found at all, just return original
                return targetPath;
            }
        } catch (e) {
            return targetPath;
        }
    }
    return actualParts.join('/');
}

function processDirectory(dir) {
    let filesChanged = 0;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            filesChanged += processDirectory(fullPath);
        } else if (item.name.endsWith('.js') || item.name.endsWith('.jsx') || item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            
            // Regex for import and export from statements
            const regex = /(import\s+.*?(?:from\s+)?['"])(.*?)(['"])|(export\s+.*?(?:from\s+)?['"])(.*?)(['"])|(require\(['"])(.*?)(['"]\))/g;
            
            content = content.replace(regex, (match, p1, p2, p3, p4, p5, p6, p7, p8, p9) => {
                const prefix = p1 || p4 || p7;
                const importPath = p2 || p5 || p8;
                const suffix = p3 || p6 || p9;
                
                if (importPath.startsWith('.')) {
                    const correctedPath = getActualPath(dir, importPath);
                    if (correctedPath !== importPath) {
                        changed = true;
                        console.log('Fixing in ' + path.relative(srcDir, fullPath) + ': ' + importPath + ' -> ' + correctedPath);
                        return prefix + correctedPath + suffix;
                    }
                }
                return match;
            });
            
            // Also handle dynamic imports
            const dynamicRegex = /(import\(['"])(.*?)(['"]\))/g;
            content = content.replace(dynamicRegex, (match, p1, p2, p3) => {
                const importPath = p2;
                if (importPath.startsWith('.')) {
                    const correctedPath = getActualPath(dir, importPath);
                    if (correctedPath !== importPath) {
                        changed = true;
                        console.log('Fixing dynamic in ' + path.relative(srcDir, fullPath) + ': ' + importPath + ' -> ' + correctedPath);
                        return p1 + correctedPath + p3;
                    }
                }
                return match;
            });
            
            if (changed) {
                fs.writeFileSync(fullPath, content);
                filesChanged++;
            }
        }
    }
    return filesChanged;
}

console.log('Starting scan...');
const changed = processDirectory(srcDir);
console.log('Done! Files modified: ' + changed);
