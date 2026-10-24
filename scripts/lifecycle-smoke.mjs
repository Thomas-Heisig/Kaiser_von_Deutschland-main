import {chromium} from '../.browser-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('.temp',{recursive:true});
const browser=await chromium.launch({headless:true}),errors=[];
try {
  for(const [width,year] of [[375,-1999],[1024,1200],[768,2000]]) {
    const page=await browser.newPage({viewport:{width,height:800},hasTouch:width<1000,reducedMotion:'reduce'});
    await page.addInitScript(()=>{
      let seed=724;
      Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    });
    page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.KAISER_TEST_URL??'http://127.0.0.1:4173/');await page.locator('#intro-skip').click();
    await page.locator('#start-year').selectOption(String(year));
    for(let i=0;i<6&&!await page.locator('[name=events]').isVisible();i++)await page.getByRole('button',{name:'Weitere Einstellungen',exact:true}).click();
    await page.locator('[name=events]').uncheck();
    for(let i=0;i<6&&!await page.locator('#tutorial-toggle').isVisible();i++)await page.getByRole('button',{name:'Weitere Einstellungen',exact:true}).click();
    await page.locator('#tutorial-toggle').uncheck();await page.getByRole('button',{name:/Herrschaft beginnen/}).click();
    await page.locator('#kingdom-map canvas').waitFor();
    const open=async view=>{
      if(await page.locator('#view-select').isVisible())await page.locator('#view-select').selectOption(view);
      else await page.locator(`nav [data-view=${view}]`).click();
    };
    const close=async()=>page.locator('#section-dialog-close').click();
    const literacy=()=>page.locator('.skill-list label').filter({hasText:'Bildung'}).locator('progress').getAttribute('value').then(Number);
    await open('civic');
    const worker=await page.locator('[data-civic-citizen=water] option:checked').innerText();
    const workerName=worker.split(' · ')[0];
    await page.locator('[data-civic-assign=water]').click();
    assert.ok((await page.locator('[data-active-civic]').innerText()).includes(workerName));
    await page.locator('[data-administration-domain=civic]').check();
    await close();await open('court');
    assert.ok((await page.locator('.automation-people').innerText()).includes(workerName));
    await page.locator('[data-court-appoint=forschung]').click();
    assert.equal(await page.locator('[data-automation-person]').count(),2);
    await page.locator('[data-administration-preset=watch]').click();
    assert.equal(await page.locator('[data-court-mode=forschung]').inputValue(),'automatisch');
    await page.locator('[data-administration-preset=manual]').click();
    assert.equal(await page.locator('[data-court-mode=forschung]').inputValue(),'beratung');
    await close();await open('character');
    await page.locator('[data-character-plan]').selectOption('study');
    await page.locator('[data-administration-domain=character]').check();
    assert.match(await page.locator('[data-automatic-character]').innerText(),/aktiv/);
    assert.ok(await page.locator('[data-family-overview]').count());
    const before=await literacy();
    await page.locator('[data-char-action=work]').click();await close();
    await page.locator('[data-action=month]').click();await open('character');
    assert.equal(await literacy(),before,'manual action must prevent a second personal action');
    await page.screenshot({path:`.temp/lifecycle-character-${year}-${width}.png`});
    await close();await page.locator('[data-action=month]').click();await open('character');
    assert.equal(await literacy(),Math.min(100,before+6));
    // Assignment holders can die naturally. Compare the saved state, not immortality.
    await close();await open('court');
    const savedPeople=await page.locator('.automation-people').innerText();
    await close();await page.locator('[data-action=save]').click();
    await page.locator('#notice').filter({hasText:'Herrschaft gespeichert.'}).waitFor();
    await page.reload();await page.locator('#intro-skip').click();await page.locator('#continue').click();
    await page.locator('#kingdom-map canvas').waitFor();await open('character');
    assert.equal(await page.locator('[data-character-plan]').inputValue(),'study');
    assert.equal(await page.locator('[data-administration-domain=character]').isChecked(),true);
    await close();await open('court');
    assert.equal(await page.locator('.automation-people').innerText(),savedPeople);
    await page.locator('.automation-people').scrollIntoViewIfNeeded();
    await page.screenshot({path:`.temp/lifecycle-people-${year}-${width}.png`});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false);
    await close();await open('chronicle');assert.match(await page.locator('#section-dialog-body').innerText(),/studiert/);
    await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log('Named assignments, spectator modes, personal automation, manual priority, family UI and saved BCE/modern plans passed at 375/768/1024px.');
} finally {await browser.close();}
