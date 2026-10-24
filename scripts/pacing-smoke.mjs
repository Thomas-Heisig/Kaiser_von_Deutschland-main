import {chromium} from '../.browser-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('.temp',{recursive:true});
const browser=await chromium.launch({headless:true}),errors=[];
try {
  for(const width of [375,1280]) {
    const page=await browser.newPage({viewport:{width,height:850},reducedMotion:'reduce'});
    page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{let seed=724;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
    await page.goto(process.env.KAISER_TEST_URL??'http://127.0.0.1:4173/');await page.locator('#intro-skip').click();
    await page.locator('#campaign-select').selectOption('frei');
    for(let i=0;i<6&&!await page.locator('[name=events]').isVisible();i++)await page.getByRole('button',{name:'Weitere Einstellungen',exact:true}).click();
    await page.locator('[name=events]').uncheck();
    for(let i=0;i<6&&!await page.locator('#tutorial-toggle').isVisible();i++)await page.getByRole('button',{name:'Weitere Einstellungen',exact:true}).click();
    await page.locator('#tutorial-toggle').uncheck();await page.getByRole('button',{name:/Herrschaft beginnen/}).click();
    await page.waitForFunction(()=>document.querySelector('#kingdom-map canvas')?.dataset.settlementTerrain==='ganderkesee');
    await page.locator('[data-map-level=dorf]').click();
    assert.ok(Number(await page.locator('#kingdom-map canvas').getAttribute('data-settlement-river-segments'))>100);
    await page.screenshot({path:`.temp/pacing-map-${width}.png`});
    const open=async view=>{if(await page.locator('#view-select').isVisible())await page.locator('#view-select').selectOption(view);else await page.locator(`nav [data-view=${view}]`).click();};
    const close=async()=>page.locator('#section-dialog-close').click();
    await open('world');assert.ok(!(await page.locator('#section-dialog-body').innerText()).includes('Noch nicht erkundet'));await close();
    if(await page.locator('[data-report-tab=tutorial]').isVisible())await page.locator('[data-report-tab=tutorial]').click();
    await page.locator('#hide-journey-guide').click();assert.equal(await page.locator('[data-report-card=tutorial]').isVisible(),false);
    await open('build');await page.locator('[data-build=farms]').click();
    assert.match(await page.locator('[data-project-queue]').innerText(),/noch 3 von 3/);
    await close();await page.locator('[data-action=month]').click();await open('build');
    assert.match(await page.locator('[data-project-queue]').innerText(),/noch 2 von 3/);await close();
    await open('history');await page.locator('#history-year').fill('800');await page.locator('#history-year-form button').first().click();
    assert.match(await page.locator('#section-dialog-body').innerText(),/Lesbare Schrift/);
    await page.locator('[data-history-step="100"]').click();assert.equal(await page.locator('#history-year').inputValue(),'900');
    await page.locator('[data-history-current]').click();assert.equal(await page.locator('#history-year').inputValue(),'1200');await close();
    await open('overview');await page.screenshot({path:'.temp/pacing-overview-'+width+'.png'});await page.locator('[data-time-travel="12"]').click();
    await page.locator('#notice').filter({hasText:'12 Monate berechnet'}).waitFor();
    assert.match(await page.locator('[data-project-queue]').innerText(),/Keine Vorhaben/);await close();
    await open('economy');assert.ok(await page.locator('[data-food-security]').count());await close();
    await page.locator('[data-action=save]').click();await page.locator('#notice').filter({hasText:'Herrschaft gespeichert.'}).waitFor();
    await page.reload();await page.locator('#intro-skip').click();await page.locator('#continue').click();
    await page.locator('#kingdom-map canvas').waitFor();assert.equal(await page.locator('[data-report-card=tutorial]').isVisible(),false);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false);
    await page.screenshot({path:`.temp/pacing-report-${width}.png`});
    await page.close();
  }
  assert.deepEqual(errors,[]);console.log('Real settlement terrain, rival details, timed construction, year simulation, reading journeys and hidden guide persisted at 375/1280px.');
}finally{await browser.close();}
