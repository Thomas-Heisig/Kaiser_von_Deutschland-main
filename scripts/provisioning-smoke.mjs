import {chromium} from '../.browser-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('.temp',{recursive:true});
const browser=await chromium.launch({headless:true}),errors=[];
try {
  for(const [width,year] of [[320,-1999],[375,1200],[1024,1200],[768,2000]]) {
    const page=await browser.newPage({viewport:{width,height:800},hasTouch:width<1000,reducedMotion:'reduce'});
    page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.KAISER_TEST_URL??'http://127.0.0.1:4173/');await page.locator('#intro-skip').click();
    await page.locator('#start-year').selectOption(String(year));await page.getByRole('button',{name:/Herrschaft beginnen/}).click();
    await page.locator('#kingdom-map canvas').waitFor();
    const open=async(view)=>{
      if(await page.locator('#view-select').isVisible())await page.locator('#view-select').selectOption(view);
      else await page.locator(`nav [data-view=${view}]`).click();
    };
    assert.match(await page.locator('#hud-happiness').innerText(),/\d+.*%/);
    assert.match(await page.locator('#hud-stability').innerText(),/\d+.*%/);
    assert.match(await page.locator('#hud-reserves').innerText(),/Mo\./);
    assert.equal(await page.locator('.realm-status-strip').evaluate(el=>{
      const r=el.getBoundingClientRect();return r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;
    }),true);
    await page.locator('[data-status-open]').first().click();
    await page.locator('#briefing-dialog[open]').waitFor();
    await page.locator('[data-close-dialog=briefing-dialog]').click();
    await open('character');
    assert.equal(await page.locator('.character-list>li').count(),6);
    const firstPerson=await page.locator('.character-list [data-switch]').first().getAttribute('data-switch');
    await page.locator('[data-character-page="1"]').click();
    assert.notEqual(await page.locator('.character-list [data-switch]').first().getAttribute('data-switch'),firstPerson);
    assert.equal(await page.locator('.character-list>li').count(),6);
    await page.locator('[data-character-page="-1"]').click();
    assert.equal(await page.locator('.character-list [data-switch]').first().getAttribute('data-switch'),firstPerson);
    await page.locator('#section-dialog-close').click();
    if(year===1200) {
      const oldWood=Number((await page.locator('#delta-wood').innerText()).split('/')[0]);
      await open('build');await page.locator('[data-build=workshops]').click();
      assert.ok(Number((await page.locator('#delta-wood').innerText()).split('/')[0])-oldWood>=17);
      await page.locator('#section-dialog-close').click();
    }
    await page.screenshot({path:`.temp/provisioning-status-${year}-${width}.png`});
    await open('world');assert.equal(await page.locator('[data-provision-region]').count(),3);
    const gold=Number((await page.locator('#resource-gold').innerText()).replace(/\D/g,''));
    await page.locator('[data-provision-action=storage][data-provision-target=geest]').click();
    assert.equal(await page.locator('[data-provision-region=geest] [data-provision-storage]').innerText(),'1 / 3');
    assert.equal(Number((await page.locator('#resource-gold').innerText()).replace(/\D/g,'')),gold-400);
    assert.equal(await page.locator('[data-provision-action=storage][data-provision-target=geest]').isDisabled(),true);
    await page.screenshot({path:`.temp/provisioning-${year}-${width}.png`});
    await page.locator('#section-dialog-close').click();await page.locator('[data-action=save]').click();
    await page.locator('#notice').filter({hasText:'Herrschaft gespeichert.'}).waitFor();
    await page.reload();await page.locator('#intro-skip').click();await page.locator('#continue').click();
    await page.locator('#kingdom-map canvas').waitFor();await open('world');
    assert.equal(await page.locator('[data-provision-region=geest] [data-provision-storage]').innerText(),'1 / 3');
    assert.equal(await page.locator('[data-provision-action=storage][data-provision-target=geest]').isDisabled(),true);
    await page.locator('#section-dialog-close').click();await page.locator('[data-action=month]').click();await open('world');
    assert.equal(await page.locator('[data-provision-action=storage][data-provision-target=geest]').isEnabled(),true);
    await page.locator('[data-provision-action=relief][data-provision-target=streams]').click();
    assert.match(await page.locator('#notice').innerText(),/Nothilfe verteilen/);
    assert.match(await page.locator('[data-provision-region=streams]').innerText(),/Nothilfe: noch 3 Monate/);
    await page.locator('#section-dialog-close').click();await open('chronicle');
    assert.match(await page.locator('#section-dialog-body').innerText(),/Nothilfe verteilen/);
    assert.ok(await page.locator('.journal .message-content strong').count()>0);
    await page.screenshot({path:`.temp/provisioning-chronicle-${year}-${width}.png`});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false);
    await page.close();
  }
  assert.deepEqual(errors,[]);
} finally {await browser.close();}
console.log('Visible vital signs, six-person lists, timber expansion, regional actions, cost, cooldown, BCE save/reload and formatted chronicle passed at 320/375/768/1024px.');
