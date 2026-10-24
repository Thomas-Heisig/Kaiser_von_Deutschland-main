import {chromium} from '../.browser-tools/node_modules/playwright/index.mjs';
import {mkdir} from 'node:fs/promises';
await mkdir('.temp',{recursive:true});
const browser=await chromium.launch({headless:true});
const failures=[];
try {
  for(const [year,width,height] of [[-1999,1280,800],[1200,375,740],[2000,1024,768]]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce',hasTouch:width<500});
    page.on('pageerror',e=>failures.push(e.message));
    page.setDefaultTimeout(15000);
    await page.goto('http://127.0.0.1:4173/');await page.locator('#intro-skip').click();
    await page.locator('#start-year').selectOption(String(year));
    if(!(await page.locator('#start-campaign-summary').innerText()).includes('Ganderkesee'))throw Error('Start place missing');
    await page.getByRole('button',{name:/Herrschaft beginnen/}).click();
    await page.locator('#kingdom-map canvas').waitFor();
    await page.locator('.atlas-navigation [data-map-level=zentraleuropa]').click();
    await page.waitForFunction(()=>document.querySelector('#kingdom-map canvas')?.dataset.localMapLoaded==='true');
    if(Number(await page.locator('#kingdom-map canvas').getAttribute('data-local-river-segments'))<100)throw Error('Real watercourses missing');
    await page.screenshot({path:`.temp/ganderkesee-${year}-${width}.png`});
    await page.locator('#local-map-info').click();
    await page.locator('[data-local-history=home]').waitFor();
    if(await page.locator('[data-local-history=church]').count() !== (year>=1052?1:0))throw Error('Wrong church period');
    if(await page.locator('[data-local-history=organ]').count() !== (year>=1699?1:0))throw Error('Wrong organ period');
    const body=page.locator('#section-dialog-body');
    if(await body.evaluate(el=>getComputedStyle(el).overflowY)!=='auto')throw Error('Popup cannot scroll');
    await body.hover();await page.mouse.wheel(0,900);
    await page.waitForFunction(()=>document.querySelector('#section-dialog-body').scrollTop>0);
    if(width<500) {
      await body.evaluate(el=>el.scrollTop=0);
      const box=await body.boundingBox(),cdp=await page.context().newCDPSession(page);
      const x=box.x+box.width/2,y=box.y+box.height*.8;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let n=1;n<=8;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-n*25}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForFunction(()=>document.querySelector('#section-dialog-body').scrollTop>0);
      await cdp.detach();
    }
    await page.locator('#section-dialog-close').click();
    const audio=await page.locator('#game-music-settings').evaluate(el=>!!el.closest('header'));
    if(!audio)throw Error('Audio not in header');
    const open=async(view)=>{
      if(await page.locator('#view-select').isVisible())await page.locator('#view-select').selectOption(view);
      else await page.locator(`nav [data-view=${view}]`).click();
    };
    await open('economy');
    await page.locator('#tax-rate').fill('17');
    await page.locator('#tax-rate').dispatchEvent('change');
    if(await page.locator('#tax-rate').inputValue()!=='17')throw Error('Direct tax rate lost');
    if(await page.locator('[data-stock]').count()!==5)throw Error('Stocks missing');
    await page.locator('#trade-resource').selectOption('wood');await page.locator('#trade-amount').fill('1');
    await page.locator('#trade-form button[value=sell]').click();
    if(await page.locator('#trade-resource').inputValue()!=='wood'||await page.locator('#trade-amount').inputValue()!=='1')throw Error('Trade selection reset');
    await page.screenshot({path:`.temp/economy-${year}-${width}.png`});
    await page.locator('#section-dialog-close').click();
    await page.locator('[data-action=month]').click();
    await open('economy');await page.locator('.treasury-report').waitFor();
    await page.locator('#section-dialog-close').click();
    await open('research');
    if(await page.locator('.research-effects li').count()<2)throw Error('Research benefits missing');
    await page.locator('#section-dialog-close').click();
    await open('military');await page.locator('[data-garrison=training]').click();
    await page.locator('#section-dialog-close').click();
    await open('court');await page.locator('[data-administration-preset=watch]').click();
    if(await page.locator('[data-administration-domain]:checked').count()!==6)throw Error('Spectator domains not enabled');
    await page.locator('[data-administration-policy]').selectOption('normal');
    await page.locator('[data-administration-domain=research]').uncheck();
    if(await page.locator('[data-administration-domain]:checked').count()!==5)throw Error('Chosen focus not retained');
    await page.screenshot({path:`.temp/administration-${year}-${width}.png`});
    await page.locator('#section-dialog-close').click();
    await open('modernization');
    if(year<1760&&await page.locator('[data-project=manufacturing]').count())throw Error('Future modernization shown');
    await page.locator('#section-dialog-close').click();
    await open('culture');await page.locator('[data-festival=social-meal]').waitFor();
    if(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1))throw Error('Page scrolls');
    await page.close();
  }
}finally{await browser.close();}
if(failures.length)throw Error(failures.join('\n'));
console.log('Ganderkesee map, dated landmarks, scrollable dialogs, tax slider, persistent trade and treasury report passed.');
