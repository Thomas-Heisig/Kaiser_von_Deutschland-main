import { chromium } from '../.browser-tools/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { runMapRendererSmoke } from './map-renderer-smoke.mjs';
const url=process.env.KAISER_TEST_URL ?? 'http://127.0.0.1:4182/';
const output='output/village-acceptance';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
try {
  for (const [year,width,height,fallback] of [[1200,1440,900,false],[1200,390,844,false],[-1999,1280,800,false],[2000,1280,800,false],[1200,1280,800,true]]) {
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[],requests=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(request.url().includes('/pixijs-assets-2026-11-01/'))requests.push(request.url());});
    if(fallback)await page.route('**/pixijs-assets-2026-11-01/**',route=>route.abort());
    await page.goto(url);await page.locator('#intro-skip').click();
    await page.locator('#start-year').selectOption(String(year));
    await page.getByRole('button',{name:/Herrschaft beginnen/}).click();
    const canvas=page.locator('#kingdom-map canvas');
    await page.waitForFunction(()=>document.querySelector('#kingdom-map canvas')?.dataset.buildingFramesLoaded==='24');
    await page.waitForFunction(()=>document.querySelector('#kingdom-map canvas')?.dataset.localMapLoaded==='true');
    if(await page.locator('#report-toggle').getAttribute('aria-expanded')==='true')await page.locator('#report-toggle').click();
    const data=await canvas.evaluate(el=>({...el.dataset}));
    assert(Number(data.visibleWidthMetres)<=521,'Initial view is not a walkable village');
    assert(Number(data.villageBuildingCount)===16,'Districts missing');
    assert(Number(data.villageMaxWalkingMetres)<=500,'Walking distances exceed 500 m');
    assert(requests.length>=6,'Packaged spritesheets were not requested');
    assert(year<500 ? Number(data.renderedDistricts)===0 : Number(data.renderedDistricts)>0,'Incorrect epoch assets');
    assert(Math.abs(Number(data.dwellingWidthCssPixels)*Number(data.metresPerPixel)-6)<.001,'House is not 6 m wide');
    await page.screenshot({path:`${output}/village-${year}-${width}${fallback?'-fallback':''}.png`});
    if(year===1200 && width===1440) {
      await page.getByRole('button',{name:/Einstellungen/,exact:false}).first().click();
      await page.locator('#setting-motion').check();await page.locator('#settings-close').click();
    }
    await page.locator('[data-fp-control]').click();
    await page.locator('.fp-canvas[data-renderer=three]').waitFor();
    await page.screenshot({path:`${output}/interior-${year}-${width}${fallback?'-fallback':''}.png`});
    if(year===1200 && width===1440) {
      const fp=page.locator('.fp-canvas'), box=await fp.boundingBox();
      for(let i=0;i<8;i++) {
        const state=JSON.parse(await fp.getAttribute('data-position'));
        const delta=((0-state.yaw+540)%360)-180;
        if(Math.abs(delta)<.3)break;
        const dx=Math.max(-200,Math.min(200,delta/.22));
        await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
        await page.mouse.down();await page.mouse.move(box.x+box.width/2+dx,box.y+box.height/2,{steps:4});await page.mouse.up();
      }
      await page.keyboard.down('w');
      await page.waitForFunction(()=>JSON.parse(document.querySelector('.fp-canvas').dataset.position).z>13,{},{timeout:20000});
      await page.keyboard.up('w');
      await page.screenshot({path:`${output}/village-on-foot.png`});
      assert(JSON.parse(await fp.getAttribute('data-position')).z>12,'Walking still stops at the old yard boundary');
    }
    await page.keyboard.press('Escape');
    assert(errors.length===0,errors.join('\n'));
    await writeFile(`${output}/metrics-${year}-${width}${fallback?'-fallback':''}.json`,JSON.stringify({data,requests,errors},null,2));
    await page.close();
  }
  const page=await browser.newPage();
  const result=await runMapRendererSmoke(page,output,url);
  await writeFile(`${output}/camera-acceptance.json`,JSON.stringify(result,null,2));
  console.log('PASS: desktop/mobile, three epochs, packaged-atlas fallback, scale/zoom/pinch, Three.js and camera restore');
}finally{await browser.close();}
