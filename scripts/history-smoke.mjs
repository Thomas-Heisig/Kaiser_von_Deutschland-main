import { chromium } from '../.browser-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('.temp', {recursive:true});
const browser = await chromium.launch({headless:true});
const errors = [];
const base = process.env.SMOKE_URL || 'http://127.0.0.1:4173/';
async function openHistory(page) {
  if (await page.locator('#view-select').isVisible()) await page.locator('#view-select').selectOption('history');
  else await page.locator('nav [data-view=history]').click();
  await page.locator('#section-dialog[open]').waitFor();
}
async function reach(page, selector) {
  const target = page.locator(selector).first();
  for (let attempt=0;attempt<60;attempt++) {
    const position = await target.evaluate(el => {
      const a=el.getBoundingClientRect(),b=document.querySelector('#section-dialog-body').getBoundingClientRect();
      return a.top < b.top ? 'prev' : a.bottom > b.bottom ? 'next' : 'visible';
    });
    if (position === 'visible') return target;
    await page.locator('#panel-'+position).click();
  }
  throw new Error('Unreachable historical control: '+selector);
}
async function topic(page, value) { await (await reach(page, '#history-topic')).selectOption(value); }
try {
  const cases = [-1999,-1499,-1199,-799,-752,-489,-43,0,1,1200,1300,1400,1500,1600,1750,1820,1890,1945,1970,2000].map(year => ({year,month:1,width:1024,height:768}));
  cases.push({year:1970,month:11,width:320,height:568}, {year:1945,month:4,width:768,height:800}, {year:-43,month:2,width:320,height:568});
  for (const fixture of cases) {
    const page = await browser.newPage({viewport:{width:fixture.width,height:fixture.height},reducedMotion:'reduce'});
    page.setDefaultTimeout(15000);
    page.on('pageerror', error=>errors.push(error.message));
    await page.goto(base);
    await page.evaluate(async ({year,month}) => {
      const {GameEngine} = await import('/src/core/GameEngine.ts');
      const engine = new GameEngine({startingYear:year,campaignId:'frei',randomEvents:false,enableWiki:false});
      try {
        const player = engine.addPlayer({name:'Zeitprüfung',kingdomName:'Kulturreich',gender:'other'});
        await engine.startGame(); engine.pauseGame();
        player.kingdom.resources.gold=1000000; player.kingdom.resources.food=1000000;
        for (let m=1;m<month;m++) await engine.advanceMonth();
        await engine.saveGame('autosave');
      } finally {engine.dispose();}
    },fixture);
    await page.reload(); await page.locator('#intro-skip').click(); await page.locator('#continue').click();
    await page.locator('#kingdom-map canvas').waitFor();
    await openHistory(page);
    assert.deepEqual(await page.locator('[data-knowledge-topic]').evaluateAll(els=>[...new Set(els.map(el=>el.dataset.knowledgeTopic))].sort()), ['architecture','art','culture','everyday']);
    await topic(page,'architecture');
    assert.ok(await page.locator('[data-knowledge-topic=architecture]').count()>0);
    assert.equal(await page.locator('[data-knowledge-topic=art]').count(),0);
    const source = await reach(page,'[data-knowledge] a');
    assert.match(await source.getAttribute('href'),/^https:\/\//);
    await page.screenshot({path:`.temp/history-${fixture.year}-${fixture.width}.png`});
    // All content remains paginated; no horizontal or document scrolling is introduced.
    assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1 || document.documentElement.scrollWidth>innerWidth+1),false);
    await topic(page,'events');
    if ([1945,1970,2000].includes(fixture.year)) assert.equal(await page.locator('[data-history-event]').count(),0);
    await topic(page,'exhibitions');
    const sponsor = await reach(page,'[data-sponsor-exhibition]:not([disabled])');
    const sponsoredId = await sponsor.getAttribute('data-sponsor-exhibition');
    await sponsor.click();
    assert.equal(await page.locator(`[data-sponsor-exhibition="${sponsoredId}"]`).isDisabled(),true);
    await page.locator('#section-dialog-close').click();
    if (fixture.month>1) {
      await page.locator('[data-action=month]').click();
      const id=fixture.year===1970 ? 'warsaw-treaty' : fixture.year===-43 ? 'caesar-assassination' : 'war-end-europe';
      assert.match(await page.locator('#report-history-context').textContent(),/Belegtes Ereignis/);
      await openHistory(page); await topic(page,'events');
      assert.equal(await page.locator(`[data-history-event="${id}"]`).count(),1);
      if (fixture.year===-43) assert.match(await page.locator(`[data-history-event="${id}"]`).textContent(),/15\.3\.44 v\. Chr\./);
      await topic(page,'all');
      if (fixture.year===1945) {
        assert.equal(await page.locator('[data-knowledge^=ns-control]').count(),0);
        assert.equal(await page.locator('[data-knowledge^=postwar-]').count(),4);
      }
      await page.locator('#section-dialog-close').click();
      await page.locator('[data-action=save]').click();
      await page.locator('#notice').filter({hasText:'Herrschaft gespeichert.'}).waitFor();
      await page.reload(); await page.locator('#intro-skip').click(); await page.locator('#continue').click();
      await page.locator('#kingdom-map canvas').waitFor();
      assert.match(await page.locator('#report-history-context').textContent(),/Belegtes Ereignis/);
    }
    await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log('20 historical starts: four cultural topics, sources, pagination and paid exhibitions; 44 BCE/1945/1970 monthly transitions and save/load at 320/768/1024px passed.');
} catch(error) {
  for (const context of browser.contexts()) for (const page of context.pages()) await page.screenshot({path:'.temp/history-failure.png'});
  throw error;
} finally {await browser.close();}
