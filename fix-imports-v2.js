import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

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
    
    // Fix imports from ./services that should be ../services  (in subdirectories like migrations)
    content = content.replace(
      /from\s+(['"`])\.\/services\/([^'"]*?)(['"`])/g,
      'from $1../services/$2$3'
    );
    
    // Fix imports from src/ paths - remove .js extension and convert to relative
    content = content.replace(
      /from\s+(['"`])src\/([^'"]*?)(['"`])/g,
      'from $1../$2$3'  // Assuming we're in a subdirectory, use ../
    );
    
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

console.log('Fixing imports in all TypeScript files...');
walkDir('.', fixImportsInFile);
console.log('Done!');
