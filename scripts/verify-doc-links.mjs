import { access, readFile } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute, sep } from 'node:path';

const files=['README.md','TODO.md','CHANGELOG.md','docs/INDEX.md','docs/00-meta/status.md','docs/00-meta/roadmap.md','docs/00-meta/backlog-from-readme.md'];
const root=process.cwd();const misses=[];
for(const file of files){
 const raw=await readFile(file,'utf8');
 // The quoted old README is a literal historic snapshot with links relative to its old root.
 const active=file.endsWith('backlog-from-readme.md')?raw.split('## Vollständige damalige Feature- und Ideensammlung')[0]:raw;
 const source=active.replace(/\x60{3}[\s\S]*?\x60{3}/g,'');
 const links=source.matchAll(/(?<!!)\[[^\]]+\]\(([^)#]+)(?:#[^)]*)?\)/g);
 for(const match of links){
  const url=match[1].trim();
  if(/^(https?:|mailto:|#)/i.test(url))continue;
  const dest=resolve(root,dirname(file),decodeURIComponent(url));
  const local=relative(root,dest);
  if(local==='..'||local.startsWith('..'+sep)||isAbsolute(local)){misses.push(file+': path escapes repository: '+url);continue;}
  try{await access(dest);}catch{misses.push(file+' → '+url);}
 }
}
if(misses.length){console.error('Broken documentation links:\n'+misses.join('\n'));process.exitCode=1;}
else console.log('Active documentation link gate passed: '+files.length+' primary documents.');
