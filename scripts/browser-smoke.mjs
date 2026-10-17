import { chromium } from '../.browser-tools/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const width of [1280, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 740 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /Kaiser von/i }).waitFor({ timeout: 15000 });
    await page.locator('#start-year').waitFor();
    if (await page.locator('.welcome [data-jukebox-select]').count()) failures.push('Jukebox must not appear in start menu');
    await page.locator('#campaign-select').selectOption('frei');
    await page.locator('#start-year').selectOption('1820');
    await page.locator('#start-era-summary').getByText('1820 · Industriezeitalter').waitFor();
    await page.getByRole('button', { name: /Herrschaft beginnen/i }).click();
    await page.getByRole('heading', { name: /Land & Leute/i }).waitFor({ timeout: 30000 });
    await page.locator('#game-music-settings').waitFor();
    await page.locator('#game-music-settings summary').click();
    await page.locator('[data-jukebox-select]').waitFor();
    await page.locator('[data-jukebox-import]').setInputFiles({
      name: 'Kaiserliches leitmotiv 1200.mp3', mimeType:'audio/mpeg', buffer:Buffer.alloc(4096,0x41)
    });
    await page.locator('[data-jukebox-select] option').filter({hasText:'Kaiserliches Leitmotiv'}).first().waitFor({state:'attached'});
    await page.locator('#map-style').selectOption('isometric');
    if (await page.locator('#kingdom-map').getAttribute('data-projection') !== 'isometric') failures.push('map switch failed');
    if (await page.locator('#objectives .objective').count() !== 0) failures.push('sandbox should have zero mandatory goals');
    const districtButtons = page.locator('#settlement-districts button');
    if (await districtButtons.count() !== 16)
      failures.push(`viewport ${width}: expected 16 settlement districts`);
    await page.locator('#settlement-filter').selectOption('versorgung');
    if (await districtButtons.count() !== 4)
      failures.push(`viewport ${width}: expected 4 supply districts`);
    await page.locator('#settlement-filter').selectOption('alle');
    await page.locator('[data-district="ports"]').click();
    await page.locator('#settlement-details').getByText('Hafen').waitFor();
    await page.locator('nav [data-view="help"]').click();
    await page.getByRole('heading', { name: 'Deine ersten Schritte' }).waitFor();
    await page.locator('nav [data-view="diplomacy"]').click();
    await page.getByRole('heading', { name: /diplomatische hof/i }).waitFor();
    await page.locator('nav [data-view="culture"]').click();
    await page.getByRole('heading', { name: /Feste im Jahreskreis/i }).waitFor();
    await page.locator('nav [data-view="research"]').click();
    await page.getByRole('heading', { name: /Forschung im Reich/i }).waitFor();
    await page.locator('nav [data-view="history"]').click();
    await page.getByRole('heading', { name: /Erfindungen, Kunst und Kultur/i }).waitFor();
    await page.getByRole('heading', { name: /Universität Bologna/i }).first().waitFor();
    await page.locator('nav [data-view="war"]').click();
    await page.getByRole('heading', { name: /Feldzüge & Nachbarn/i }).waitFor();
    await page.screenshot({ path: `smoke-${width}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 2) failures.push(`viewport ${width}: horizontal overflow ${overflow}px`);
    if (errors.length) failures.push(`viewport ${width}: ${errors.join('; ')}`);
    await page.close();
  }

  // Verify all four scenario selectors launch and show the correct opening story.
  const campaignNames = {
    aufbau: 'Das hungernde Lehen',
    hanse: 'Die ersten Segel',
    wissenschaft: 'Die Saat des Wissens',
    grenzland: 'Schutz für die Mark',
    kultur: 'Die Glocken der Stadt',
    kaiserkrone: 'Ein starker Herrschaftssitz'
  };
  for (const [campaign, chapter] of Object.entries(campaignNames)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 740 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
    await page.locator('#campaign-select').selectOption(campaign);
    await page.getByRole('button', { name: /Herrschaft beginnen/i }).click();
    await page.getByRole('heading', { name: /Land & Leute/i }).waitFor({ timeout: 30000 });
    await page.locator('#campaign-title').filter({ hasText: chapter }).waitFor();
    const objectives = await page.locator('#objectives .objective').count();
    if (objectives !== 6) failures.push(`campaign ${campaign} shows ${objectives} objectives instead of 6`);
    if (errors.length) failures.push(`campaign ${campaign}: ${errors.join('; ')}`);
    await page.close();
  }
  // Real Chromium UI activation: prepare a legitimate researched save using public APIs,
  // reload into the playable campaign, then click the real economy activation button.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 740 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      const { GameEngine } = await import('/src/core/GameEngine.ts');
      const engine = new GameEngine({ startingYear: 1200, randomEvents: false, enableWiki: false });
      const ruler = engine.addPlayer({ name: 'Hanse-Test', kingdomName: 'Hansestadt', gender: 'other' });
      await engine.startGame();
      engine.pauseGame();
      ruler.kingdom.infrastructure.schools = 2;
      for (let month = 0; month < 6; month++) await engine.advanceMonth();
      ruler.kingdom.resources.gold = 50000;
      engine.startResearch(ruler.id, 'sailing');
      await engine.advanceMonth();
      await engine.advanceMonth();
      if (!engine.getTechnologyProgress(ruler.id).researched.includes('sailing'))
        throw new Error('Hochseesegeln konnte nicht erforscht werden');
      ruler.kingdom.infrastructure.ports = 1;
      ruler.kingdom.resources.gold = 15030;
      await engine.saveGame('autosave');
      engine.dispose();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#continue').click();
    await page.getByRole('heading', { name: /Land & Leute/i }).waitFor({ timeout: 30000 });
    await page.locator('nav [data-view="economy"]').click();
    const route = page.locator('.build-card').filter({ has: page.getByRole('heading', { name: 'Hanserouten' }) });
    await route.getByRole('button', { name: 'Route aktivieren' }).click();
    await route.getByRole('button', { name: 'Route beenden' }).waitFor();
    if (errors.length) failures.push('Hansa UI: ' + errors.join('; '));
    await page.screenshot({ path: 'smoke-hanse-route.png', fullPage: true });
    await page.close();
  }

} finally {
  await browser.close();
}
if (failures.length) throw new Error(failures.join('\n'));
console.log('Desktop and 320x740 mobile UI smoke tests passed.');
