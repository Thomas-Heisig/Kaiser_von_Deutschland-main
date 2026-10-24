import {chromium} from '../.browser-tools/node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import os from 'node:os';

const browser=await chromium.launch({headless:true});
const results=[];
try {
  for(const population of [1000,5000,20000]) {
    const page=await browser.newPage();
    const metrics=await page.context().newCDPSession(page);
    await metrics.send('Performance.enable');
    await page.goto('http://127.0.0.1:4173/');
    const result=await page.evaluate(async population=>{
      const {GameEngine}=await import('/src/core/GameEngine.ts');
      const {encodeSave,decodeSave}=await import('/src/core/SaveCodec.ts');
      const originalRandom=Math.random;let seed=20261024;
      Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const engine=new GameEngine({startingYear:1200,randomEvents:false,enableWiki:false,campaignId:'frei'});
      try {
        const player=engine.addPlayer({name:'Benchmark',kingdomName:'Messreich',gender:'other'});
        await engine.startGame();engine.pauseGame();
        const citizens=engine.getCitizenSystem();
        const region=citizens.getAliveCitizens()[0].regionId;
        const start=performance.now();
        for(let i=citizens.getPopulation();i<population;i++)citizens.createCitizen({firstName:'Person',lastName:String(i),
          age:20+i%35,birthYear:1180-i%35,birthMonth:1+i%12,profession:'farmer',regionId:region,gender:i%2?'female':'male'});
        const generationMs=performance.now()-start;
        player.kingdom.resources.gold=1000000;player.kingdom.resources.food=1000000;
        const monthMs=[];
        for(let i=0;i<12;i++){const start=performance.now();await engine.advanceMonth();monthMs.push(performance.now()-start);}
        const saveStart=performance.now();await engine.saveGame('population-benchmark');const saveMs=performance.now()-saveStart;
        const loadStart=performance.now();await engine.loadGame('population-benchmark');const loadMs=performance.now()-loadStart;
        const snapshot=engine.getCitizenSystem().getAllCitizens();
        const plainBytes=new TextEncoder().encode(JSON.stringify(snapshot)).length;
        const packed=await encodeSave(snapshot);const restored=await decodeSave(packed);
        if(restored.length!==snapshot.length)throw new Error('Population round-trip mismatch');
        const sorted=[...monthMs].sort((a,b)=>a-b);
        return {population,afterYear:engine.getCitizenSystem().getPopulation(),generationMs,monthMs,
          monthP50:sorted[5],monthP95:sorted[11],yearBoundaryMs:monthMs[11],saveMs,loadMs,
          citizenJsonBytes:plainBytes,storedCitizenEnvelopeBytes:new TextEncoder().encode(JSON.stringify(packed)).length,
          compressedCitizenBytes:packed?.encoding === 'gzip-base64-v2' ? atob(packed.payload).length : packed?.encoding ? packed.payload.length : plainBytes};
      } finally {Math.random=originalRandom;engine.dispose();}
    },population);
    const heap=(await metrics.send('Performance.getMetrics')).metrics;
    result.heapUsedBytesAtEnd=heap.find(m=>m.name==='JSHeapUsedSize')?.value;
    result.heapTotalBytesAtEnd=heap.find(m=>m.name==='JSHeapTotalSize')?.value;
    results.push(result);console.log(JSON.stringify(result));await page.close();
  }
} finally {await browser.close();}
await mkdir('.temp',{recursive:true});
await writeFile('.temp/population-benchmark.json',JSON.stringify({date:new Date().toISOString(),
  commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()?'modified':'clean',
  platform:os.platform(),cpu:os.cpus()[0].model,browser:'Chromium 141 / Playwright 1.56.1',
  scope:'Full GameEngine, 12 months incl. year boundary, IndexedDB save/load; headless desktop, not a mobile device or GPU benchmark',results},null,2));
