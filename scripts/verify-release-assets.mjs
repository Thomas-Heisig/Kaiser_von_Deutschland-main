import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
const base=process.env.GITHUB_PAGES==='true'?'/Kaiser_von_Deutschland-main/':'/';
const dist=join(process.cwd(),'dist');
const load=async name=>readFile(join(dist,name));
const fail=[];
async function requireFile(name){try{const f=await load(name);if(!f.length)throw Error('empty');return f;}catch(e){fail.push(name+': '+String(e));return Buffer.alloc(0)}}
const index=(await requireFile('index.html')).toString('utf8');
if(!index.includes(base+'assets/'))fail.push('compiled script/style asset base wrong: '+base);
const manifest=JSON.parse((await requireFile('manifest.webmanifest')).toString('utf8'));
for(const entry of manifest.icons??[]){if(entry.type==='image/png'){const image=await requireFile(entry.src);if(image.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')fail.push('invalid PNG '+entry.src)}}
const files=JSON.parse((await requireFile('offline-assets.json')).toString('utf8')).files;
for(const filename of files){
 const data=await requireFile(filename);
 if(filename.endsWith('.mp3')&&data.length){
   const valid=data.subarray(0,3).toString()==='ID3'||(data[0]===255&&(data[1]&224)===224);
   if(!valid)fail.push('invalid MP3 '+filename);
 }
 if(filename.endsWith('.mp4')&&data.length){
   const valid=data.length>100000&&data.subarray(4,8).toString()==='ftyp';
   if(!valid)fail.push('invalid MP4 '+filename);
 }
}
if(files.filter(x=>x.endsWith('.mp3')).length!==15)fail.push('not 15 music tracks');
if(files.filter(x=>x.endsWith('.mp4')).length!==5)fail.push('not 5 videos');
const catalog=JSON.parse((await requireFile('video-catalog.json')).toString('utf8'));
if(catalog.videos.length!==5)fail.push('video catalog count mismatch');
if(catalog.videos.some(v=>!v.url.startsWith(base+'video/')))fail.push('catalog base mismatch');
const zip=await requireFile('downloads/kaiser-von-deutschland-offline.zip');
if(zip.subarray(0,4).toString('hex')!=='504b0304')fail.push('offline ZIP header invalid');
if(fail.length){console.error(fail.join('\n'));process.exitCode=1}else console.log('Asset release gate passed ('+base+', '+files.length+' media assets).');
