const { readdirSync, readFileSync, statSync } = require('fs');
const { join, extname } = require('path');
const dir = process.cwd();
const files = [];
function walk(p) {
  for (const name of readdirSync(p)) {
    const fp = join(p, name);
    const st = statSync(fp);
    if (st.isDirectory()) {
      walk(fp);
    } else if (['.ts', '.tsx', '.js'].includes(extname(fp))) {
      files.push(fp);
    }
  }
}
walk(dir);
const deps = new Set();
const re = /(?:import\s+[^'"\n]*?from\s+|import\s+)(['"])([^'"\n]+)\1|require\(\s*(['"])([^'"\n]+)\3\s*\)/g;
for (const f of files) {
  const txt = readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(txt))) {
    const mod = m[2] || m[4];
    if (!mod) continue;
    if (mod.startsWith('.') || mod.startsWith('src/') || mod.startsWith('./') || mod.startsWith('../')) continue;
    deps.add(mod);
  }
}
console.log(Array.from(deps).sort().join('\n'));