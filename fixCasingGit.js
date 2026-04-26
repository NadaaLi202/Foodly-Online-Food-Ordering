const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.resolve('Frontend/src');
let gitPaths = [];
try {
    // get all tracked files from git
    const output = execSync('git ls-files Frontend/src', { encoding: 'utf8' });
    gitPaths = output.split('\n').filter(Boolean).map(p => path.resolve(p));
} catch (e) {
    console.error('Failed to get git files', e);
    process.exit(1);
}

// build a dictionary mapping lowercase absolute path to actual correctly-cased absolute path
const exactPathMap = new Map();
for (const gp of gitPaths) {
    exactPathMap.set(gp.toLowerCase(), gp);
    
    // Also add versions without extensions for easier lookup
    const ext = path.extname(gp);
    if (ext) {
        const withoutExt = gp.substring(0, gp.length - ext.length);
        exactPathMap.set(withoutExt.toLowerCase(), withoutExt);
    }
}

function getActualPath(currentDir, targetPath) {
    if (!targetPath.startsWith('.')) return targetPath;
    
    // Resolve the absolute path
    const resolvedPath = path.resolve(currentDir, targetPath);
    const resolvedLower = resolvedPath.toLowerCase();
    
    // Check if we have an exact match in our git map
    if (exactPathMap.has(resolvedLower)) {
        const actualAbsPath = exactPathMap.get(resolvedLower);
        // We know the actual correctly cased absolute path now.
        // What we need to return is the relative path from currentDir to actualAbsPath
        // BUT keeping the "./" or "../" prefix style the user used.
        
        let newRel = path.relative(currentDir, actualAbsPath).replace(/\\/g, '/');
        if (!newRel.startsWith('.')) {
            newRel = './' + newRel;
        }
        return newRel;
    }
    
    // Not found in git map, wait, maybe it points to a directory (index.js/index.jsx)
    const indexJs = resolvedLower + '\\index.js';
    const indexJsx = resolvedLower + '\\index.jsx';
    const indexTs = resolvedLower + '\\index.ts';
    const indexTsx = resolvedLower + '\\index.tsx';
    
    let indexLower = null;
    if (exactPathMap.has(indexJs)) indexLower = indexJs;
    else if (exactPathMap.has(indexJsx)) indexLower = indexJsx;
    else if (exactPathMap.has(indexTs)) indexLower = indexTs;
    else if (exactPathMap.has(indexTsx)) indexLower = indexTsx;
    
    if (indexLower) {
        const actualAbsPath = exactPathMap.get(indexLower);
        // It points to a dir/index.js. The folder name casing is what we want.
        const actualDir = path.dirname(actualAbsPath);
        let newRel = path.relative(currentDir, actualDir).replace(/\\/g, '/');
        if (!newRel.startsWith('.')) {
            newRel = './' + newRel;
        }
        return newRel;
    }

    return targetPath;
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
                        // console.log('Fixing in ' + path.relative(srcDir, fullPath) + ': ' + importPath + ' -> ' + correctedPath);
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
                        // console.log('Fixing dynamic in ' + path.relative(srcDir, fullPath) + ': ' + importPath + ' -> ' + correctedPath);
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

console.log('Starting git-based scan...');
const changed = processDirectory(srcDir);
console.log('Done! Files modified: ' + changed);
