import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';
const target=join(process.cwd(),'public','icons');
await mkdir(target,{recursive:true});
const crcTable=Array.from({length:256},(_,i)=>{let x=i;for(let j=0;j<8;j++)x=x&1?(x>>>1)^0xedb88320:x>>>1;return x>>>0;});
function chunk(type,data){const n=Buffer.from(type);const sz=Buffer.alloc(4);sz.writeUInt32BE(data.length);const bytes=Buffer.concat([n,data]);let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);const tail=Buffer.alloc(4);tail.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([sz,bytes,tail]);}
function png(size){const data=Buffer.alloc(size*(size*4+1));for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*(size*4+1)+1+x*4;const s=size;const normX=x/s,normY=y/s;
const crown= (normY>.28&&normY<.70&&normX>.15&&normX<.85) && (
(normY>.54) || (normY>.44 && Math.abs(normX-.5)<.075) ||
(normY>.48 && (Math.abs(normX-.29)<.065||Math.abs(normX-.71)<.065)) ||
(normY>.42 && (Math.abs(normX-.5)<.035||Math.abs(normX-.29)<.035||Math.abs(normX-.71)<.035)));
data[i]=crown?241:20;data[i+1]=crown?197:34;data[i+2]=crown?80:30;data[i+3]=255;
}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(data)),chunk('IEND',Buffer.alloc(0))]);}
for(const size of [192,512])await writeFile(join(target,'kaiser-'+size+'.png'),png(size));
console.log('PWA icons generated in public/icons/');
