import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative, dirname, resolve } from 'path';

function walkDir(dir, callback) {
  try {
    const files = readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.name.startsWith('.')) continue;
      if (['node_modules', 'dist', '.git'].includes(file.name)) continue;
      
      const fullPath = join(dir, file.name);
      if (file.isDirectory()) {
        walkDir(fullPath, callback);
      } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
        callback(fullPath);
      }
    }
  } catch (e) {
    // ignore permission errors
  }
}

function calculateCorrectPath(filePath, importPath) {
  const fileDir = dirname(filePath);
  const srcRoot = resolve('.');
  
  // If import starts with ./ or ../, it's already relative - just clean it
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    return importPath;
  }
  
  // If it's an absolute path like ./services or services, need to make it relative
  // Calculate how many levels deep the file is
  const relativeDir = relative(srcRoot, fileDir);
  const depth = relativeDir ? relativeDir.split('\\').length : 0;
  const prefixPath = depth > 0 ? '../'.repeat(depth) : './';
  
  return prefixPath + importPath;
}

function fixImportsInFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const original = content;
    const srcRoot = resolve('.');
    
    // Find all imports
    const importRegex = /from\s+(['"`])([^'"]*?)(['"`])/g;
    
    content = content.replace(importRegex, (match, quote1, importPath, quote2) => {
      // Skip external imports (no ./ or ../ and no src/)
      if (!importPath.startsWith('./') && !importPath.startsWith('../') && !importPath.startsWith('src/')) {
        return match;
      }
      
      // Remove src/ prefix
      let cleanPath = importPath.replace(/^src\//, '');
      
      // If already relative, clean extensions and return
      if (cleanPath.startsWith('./') || cleanPath.startsWith('../')) {
        cleanPath = cleanPath.replace(/\.js$/, '').replace(/\.tsx?$/, '');
        return `from ${quote1}${cleanPath}${quote2}`;
      }
      
      // Make absolute-looking paths relative
      const fileDir = dirname(filePath);
      const relativeDir = relative(srcRoot, fileDir);
      const depth = relativeDir ? relativeDir.split('\\').length : 0;
      const prefixPath = depth > 0 ? '../'.repeat(depth) : './';
      
      cleanPath = cleanPath.replace(/\.js$/, '').replace(/\.tsx?$/, '');
      return `from ${quote1}${prefixPath}${cleanPath}${quote2}`;
    });
    
    if (content !== original) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`Fixed: ${filePath}`);
    }
  } catch (e) {
    console.error(`Error fixing ${filePath}: ${e.message}`);
  }
}

console.log('Fixing all imports with correct relative paths...');
walkDir('.', fixImportsInFile);
console.log('Done!');
