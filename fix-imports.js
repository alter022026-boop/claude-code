import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

function walkDir(dir, callback) {
  const files = readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.name.startsWith('.')) continue;
    if (['node_modules', 'dist'].includes(file.name)) continue;
    
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      callback(fullPath);
    }
  }
}

function fixImportsInFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Fix imports from ./local paths and src/ paths - remove .js extension
  const regex = /from\s+(['"`])((?:\.\/|\.\.\/|src\/)[^'"]*?)\.js(['"`])/g;
  if (regex.test(content)) {
    content = content.replace(regex, 'from $1$2$3');
    modified = true;
  }
  
  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed: ${filePath}`);
  }
}

console.log('Fixing imports in TypeScript files...');
walkDir('.', fixImportsInFile);
console.log('Done!');
