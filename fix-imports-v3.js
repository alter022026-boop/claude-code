import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';

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

function fixImportsInFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const original = content;
    
    // Determine the directory of the file
    const fileDir = dirname(filePath);
    const srcDir = '.';  // Assuming we're running from src directory
    
    // Fix imports from ../services that should be ./services (for files in src root)
    // This is a simple approach: if file is in src root, use ./, else use ../
    if (fileDir === srcDir) {
      // File is in src root, change ../ to ./
      content = content.replace(
        /from\s+(['"`])\.\.\/([^'"]*?)(['"`])/g,
        'from $1./$2$3'
      );
    }
    
    // Fix remaining .js extensions in relative/local imports
    content = content.replace(
      /from\s+(['"`])((?:\.\/|\.\.\/)[^'"]*?)\.js(['"`])/g,
      'from $1$2$3'
    );
    
    if (content !== original) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`Fixed: ${filePath}`);
    }
  } catch (e) {
    console.error(`Error fixing ${filePath}: ${e.message}`);
  }
}

console.log('Fixing imports in TypeScript files at src root...');
walkDir('.', fixImportsInFile);
console.log('Done!');
