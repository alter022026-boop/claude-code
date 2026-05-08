import { readFileSync, writeFileSync } from 'fs';

const mainContent = readFileSync('./main.tsx', 'utf-8');

// Replace all src/ imports with relative paths
const fixedContent = mainContent.replace(
  /from\s+(['"`])src\/([^'"]*?)(['"`])/g,
  'from $1./$2$3'
);

writeFileSync('./main.tsx', fixedContent, 'utf-8');
console.log('Fixed main.tsx imports');
