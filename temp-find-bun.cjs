const { readdirSync, readFileSync, statSync } = require('fs');
const { join, extname } = require('path');
const dir = process.cwd();
const files=[];
function walk(p){for(const n of readdirSync(p)){const fp=join(p,n);const st=statSync(fp);if(st.isDirectory()) walk(fp); else if(['.ts','.tsx','.js'].includes(extname(fp))) files.push(fp);} }
walk(dir);
for(const fp of files){const txt=readFileSync(fp,'utf8'); if(txt.includes('bun:bundle')||txt.includes('bun:ffi')) console.log(fp); }