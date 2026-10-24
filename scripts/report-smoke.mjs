import { chromium } from '../.browser-tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';

const browser = await chromium.launch({headless:true});
const base = process.env.SMOKE_URL || 'http://127.0.0.1:4173/';
const errors = [];
async function bounds(page, selector) {
  const invalid = await page.locator(selector).evaluateAll(elements => elements.filter(el => {
    const r=el.getBoundingClientRect();
    return r.width && r.height && (r.left < -1 || r.top < -1 || r.right > innerWidth+1 || r.bottom > innerHeight+1);
  }).map(el=>({id:el.id,text:el.textContent,rect:el.getBoundingClientRect().toJSON()})));
  assert.deepEqual(invalid,[],`Offscreen controls at ${JSON.stringify(page.viewportSize())}`);
}
try {
  for (const [width,height] of [[1280,740],[375,667],[844,480],[320,568],[320,740],[375,812]]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    page.setDefaultTimeout(15000);
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base);
    await page.locator('#intro-skip').click();
    await page.getByRole('button',{name:/Herrschaft beginnen/}).click();
    await page.locator('#kingdom-map canvas').waitFor();
    const auto=page.locator('.realm-report [data-council-auto]');
    assert.equal(await auto.isChecked(),false);
    await bounds(page,'.realm-report,.realm-report button,.realm-report input,.realm-report a');
    const tabs=page.locator('.report-tabs');
    if(await tabs.isVisible()) await page.locator('[data-report-tab=tutorial][type=button]').click();
    assert.match(await page.locator('#report-tutorial-title').textContent(),/Tutorial 1\/5/);
    await page.locator('#report-tutorial-go').click();
    await page.locator('#section-dialog[open]').waitFor();
    await page.locator('#section-dialog-close').click();
    if(await tabs.isVisible()) await page.locator('[data-report-tab=history][type=button]').click();
    assert.match(await page.locator('#report-history-text').textContent(),/Universität Paris/);
    assert.match(await page.locator('#report-history-source').getAttribute('href'),/sorbonne.fr/);
    await bounds(page,'.realm-report button,.realm-report input,.realm-report a');
    await page.screenshot({path:`.temp/report-${width}.png`});
    if(width===1280) {
      for(let i=0;i<6 && !await page.locator('.council-modal[open]').count();i++) {
        await page.locator('[data-action=month]').click();
      }
      const modal=page.locator('.council-modal[open]');
      await modal.waitFor();
      await modal.locator('[data-council-auto]').check();
      await modal.waitFor({state:'detached'});
      assert.equal(await auto.isChecked(),true);
      assert.match(await page.locator('#report-news').textContent(),/Automatisch entschieden/);
      await auto.uncheck();
      assert.equal(await auto.isChecked(),false);
      await auto.check();
      await page.locator('[data-action=save]').click();
      await page.locator('#notice').filter({hasText:'Herrschaft gespeichert.'}).waitFor();
      await page.reload();
      if(await page.locator('#intro-skip').isVisible()) await page.locator('#intro-skip').click();
      await page.locator('#continue').click();
      await page.locator('#kingdom-map canvas').waitFor();
      assert.equal(await page.locator('.realm-report [data-council-auto]').isChecked(),true);
      await page.locator('[data-action=month]').click();
      assert.equal(await page.locator('.council-modal[open]').count(),0);
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false);
    await page.close();
  }
  assert.deepEqual(errors,[]);
  console.log('Visible report, tutorial navigation, sourced annual history, event auto-resolution and saved preference passed.');
} finally { await browser.close(); }
