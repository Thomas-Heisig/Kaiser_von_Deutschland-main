import { chromium } from '../.browser-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('.temp',{recursive:true});
const browser = await chromium.launch({headless:true});
const failures = [];
async function view(page, name) {
  if (await page.locator('#view-select').isVisible()) await page.locator('#view-select').selectOption(name);
  else await page.locator(`nav [data-view=${name}]`).click();
  await page.locator('#section-dialog[open]').waitFor();
}
// Page the actual management panel; never force a click through clipped content.
async function reach(page, selector) {
  const target=page.locator(selector).first();
  for(let attempt=0;attempt<100;attempt++) {
    if(await target.evaluate(el=>{
      const a=el.getBoundingClientRect(),b=document.querySelector('#section-dialog-body').getBoundingClientRect();
      return a.top>=b.top && a.bottom<=b.bottom;
    })) return target;
    const direction=await target.evaluate(el=>el.getBoundingClientRect().top<document.querySelector('#section-dialog-body').getBoundingClientRect().top?'prev':'next');
    await page.locator('#panel-'+direction).click();
  }
  throw new Error('Unreachable control: '+selector);
}
try {
  for(const width of [320,768,1024]) {
    const page=await browser.newPage({viewport:{width,height:800},hasTouch:width<1024,reducedMotion:'reduce'});
    page.setDefaultTimeout(15000);
    page.on('pageerror',e=>failures.push(e.message));
    await page.goto('http://127.0.0.1:4173/');
    await page.evaluate(async()=>{
      const {GameEngine}=await import('/src/core/GameEngine.ts');
      const engine=new GameEngine({startingYear:1200,campaignId:'frei',enableWiki:false,randomEvents:false});
      try {
        const player=engine.addPlayer({name:'Weltprüfung',kingdomName:'Reisereich',gender:'other'});
        await engine.startGame();engine.pauseGame();
        player.kingdom.resources.gold=20000;player.kingdom.resources.food=20000;
        engine.getRivalRelations(player.id).find(r=>r.kingdomId==='ostmark').relationshipValue=40;
        // Explicit stress fixture through the production snapshot loader: 20 rivals.
        const snapshot=engine.warfare.serialize();
        for(let i=3;i<20;i++)snapshot.rivals.push({...snapshot.rivals[0],id:'test-'+i,name:'Testnachbar '+i});
        engine.warfare.load(snapshot);
        await engine.saveGame('autosave');
      } finally {engine.dispose();}
    });
    await page.reload();await page.locator('#intro-skip').click();await page.locator('#continue').click();
    const canvas=page.locator('#kingdom-map canvas');await canvas.waitFor();
    await page.locator('#map-scope').selectOption('world');
    await page.waitForFunction(()=>document.querySelector('#kingdom-map canvas')?.dataset.neighborTerritories==='20');
    await canvas.focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('Home');
    await page.screenshot({path:`.temp/strategy-world-${width}.png`});
    await view(page,'world');
    assert.equal(await page.locator('[data-world-travel]').count(),21);
    await (await reach(page,'[data-world-focus="rival:ostmark"]')).click();
    assert.equal(await canvas.getAttribute('data-focused-region'),'rival:ostmark');
    await page.screenshot({path:`.temp/strategy-focused-${width}.png`});
    await view(page,'world');
    await (await reach(page,'[data-world-travel="rival:ostmark"]')).click();
    assert.match(await page.locator('#section-dialog-body').textContent(),/Reise nach .*Ostmark/);
    await page.locator('#section-dialog-close').click();
    await page.locator('[data-action=save]').click();
    await page.locator('#notice').filter({hasText:'Herrschaft gespeichert.'}).waitFor();
    await page.reload();await page.locator('#intro-skip').click();await page.locator('#continue').click();
    await page.locator('#kingdom-map canvas').waitFor();
    await page.locator('[data-action=month]').click();
    await view(page,'world');
    assert.match(await page.locator('#section-dialog-body').textContent(),/Aufenthalt:\s*Grafschaft Ostmark/);
    await (await reach(page,'[data-world-diplomacy=ostmark]')).click();
    await (await reach(page,'[data-agreement=trade][data-rival=ostmark]')).click();
    assert.match(await page.locator('#section-dialog-body').textContent(),/Vertragserträge: 80 Gold/);
    await (await reach(page,'[data-agreement=alliance][data-rival=ostmark]')).click();
    assert.equal(await page.locator('[data-break-treaty]').count(),2);
    await page.screenshot({path:`.temp/strategy-treaties-${width}.png`});
    await (await reach(page,'[data-break-treaty]')).click();
    assert.equal(await page.locator('[data-break-treaty]').count(),0);
    assert.equal(await page.locator('[data-agreement=trade][data-rival=ostmark]').isDisabled(),true);
    assert.match(await page.locator('#section-dialog-body').textContent(),/Vertragserträge: 0 Gold/);
    await page.locator('#section-dialog-close').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false);
    await page.close();
  }
  assert.deepEqual(failures,[]);
  console.log('20 world regions, keyboard map navigation, travel/save/load, trade, alliance and treaty breach passed at 320/768/1024px.');
} catch(error) {
  for(const context of browser.contexts())for(const page of context.pages())await page.screenshot({path:'.temp/strategy-failure.png'});
  throw error;
} finally {await browser.close();}
