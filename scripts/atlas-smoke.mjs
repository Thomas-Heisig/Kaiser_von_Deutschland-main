import { chromium } from '../.browser-tools/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const failures = [];
async function inViewport(page, selector) {
  const outside = await page.locator(selector).evaluateAll(elements => elements.filter(el => {
    const r = el.getBoundingClientRect();
    return !r.width || !r.height || r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1;
  }).map(el => el.id || el.textContent));
  if (outside.length) failures.push(`${page.viewportSize().width}: clipped ${selector}: ${outside.join(', ')}`);
}
try {
  for (const [width, height, year, era] of [[1280,740,1200,'medieval'],[375,667,2000,'digital'],[844,480,1945,'modern'],[320,568,1820,'industrial'],[375,667,-1999,'bronze'],[1024,768,0,'ancient']]) {
    const page = await browser.newPage({viewport:{width,height}, reducedMotion:'reduce'});
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => failures.push(error.message));
    await page.goto('http://127.0.0.1:4173/');
    await page.locator('#intro-skip').click();
    await page.locator('#start-year').selectOption(String(year));
    if (await page.locator('html').getAttribute('data-era') !== era) failures.push(`Menu theme ${year}`);
    if (width === 320) {
      await page.getByRole('button',{name:'Weitere Einstellungen'}).click();
      await page.locator('#player-count').selectOption('4');
    }
    for (let i = 0; i < 8; i++) {
      await inViewport(page, '#new-game button[type=submit], .menu-pagination button, #continue');
      if (await page.getByRole('button',{name:'Weitere Einstellungen'}).isEnabled()) await page.getByRole('button',{name:'Weitere Einstellungen'}).click();
    }
    await page.screenshot({path:`smoke-menu-${year}.png`});
    await page.getByRole('button',{name:/Herrschaft beginnen/}).click();
    await page.locator('#kingdom-map canvas').waitFor();
    await page.waitForFunction(() => document.querySelector('#kingdom-map canvas')?.dataset.buildingFramesLoaded === '24');
    if (year < 500 && await page.locator('#kingdom-map canvas').getAttribute('data-rendered-districts') !== '0') failures.push('Medieval GLB models leaked into antiquity');
    if (width === 1280) {
      await page.locator('#map-style').selectOption('isometric');
      await page.waitForFunction(() => document.querySelector('#kingdom-map canvas')?.dataset.renderedDistricts === '16');
    }
    if (year<=0 && !(await page.locator('#date').textContent()).includes(`${1-year} v. Chr.`)) failures.push('Civil BCE date missing');
    if (await page.locator('.map-card').getAttribute('data-level') !== 'schreibtisch') failures.push('Desk not first');
    await inViewport(page, '.header-actions button, .atlas-navigation button, #zoom-slider, #legal-open');
    if (width === 320) {
      await inViewport(page, '#end-turn, #turn-status');
      await page.locator('#end-turn').click();
      if (!(await page.locator('#turn-status').textContent()).includes('2/4')) failures.push('Hotseat turn did not advance');
      await page.locator('#take-turn').click();
      if (await page.locator('#section-dialog[open]').count()) await page.locator('#section-dialog-close').click();
    } else {
      await page.locator('[data-action=month]').click();
      if (!(await page.locator('#date').textContent()).includes('Februar')) failures.push('Month action failed');
    }
    if (await page.locator('html').getAttribute('data-era') !== era) failures.push(`Game theme ${year}`);
    await page.screenshot({path:`smoke-atlas-${year}.png`});
    for (let i = 0; i < 2; i++) {
      if (await page.locator('#view-select').isVisible()) await page.locator('#view-select').selectOption('build');
      else await page.locator('nav [data-view=build]').click();
      await page.locator('#section-dialog[open]').waitFor();
      await inViewport(page, '#section-dialog-close, #panel-prev, #panel-next');
      if (await page.locator('#panel-next').isEnabled()) {
        await page.locator('#panel-next').click();
        if (await page.locator('#section-dialog-body').evaluate(el=>el.scrollTop) <= 0) failures.push('Management pagination failed');
      }
      await page.locator('#section-dialog-close').click();
      await page.waitForFunction(()=>document.querySelector('#view-select')?.value === '');
    }
    await page.locator('#briefing-open').click();
    await inViewport(page, '[data-close-dialog=briefing-dialog], #briefing-dialog [data-page-step]');
    if (!(await page.locator('#tutorial-card').count())) failures.push('Tutorial missing');
    await page.locator('[data-close-dialog=briefing-dialog]').click();
    await page.locator('#settings-open').click();
    for (const tab of ['display','audio','film','advisor','offline']) {
      await page.locator('#settings-tab-'+tab).click();
      await inViewport(page, '#settings-close, #settings-done, [data-settings-page]');
    }
    await page.locator('#settings-done').click();
    const scroll = await page.evaluate(()=>({x:document.documentElement.scrollWidth-innerWidth,y:document.documentElement.scrollHeight-innerHeight}));
    if (scroll.x > 1 || scroll.y > 1) failures.push('Document overflow: '+JSON.stringify(scroll));
    await page.close();
  }
} catch(error) {
  for(const context of browser.contexts()) for(const page of context.pages()) await page.screenshot({path:'smoke-atlas-failure.png'});
  throw error;
} finally { await browser.close(); }
if (failures.length) throw new Error(failures.join('\n'));
console.log('Atlas epochs, menu pages, repeated navigation and compact viewports passed.');
