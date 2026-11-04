import { chromium } from '../.browser-tools/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const failures = [];
const newPage = browser.newPage.bind(browser);
browser.newPage = async options => { const page = await newPage(options); page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(30000); return page; };
async function openView(page, view) {
 if (await page.locator('#view-select').isVisible()) await page.locator('#view-select').selectOption(view);
 else await page.locator('nav [data-view="'+view+'"]').click();
}

try {
  for (const width of [1280, 820, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width === 820 ? 1180 : 740 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
    await page.locator('#intro-video').waitFor({ timeout: 15000 });
    await page.locator('#intro-skip').click();
    await page.getByRole('heading', { name: /Kaiser von/i }).waitFor({ timeout: 15000 });
    await page.locator('#start-year').waitFor();
    await page.locator('#opening-music').waitFor();
    await page.getByText(/Ancient Veil/).first().waitFor();
    if (await page.locator('.welcome [data-jukebox-select]').count()) failures.push('Jukebox must not appear in start menu');
    if (await page.locator('.welcome #settings-open').count() !== 1) failures.push('start screen settings missing');
    await page.locator('.welcome #settings-open').click();
    await page.locator('#settings-dialog[open]').waitFor();
    if (await page.locator('[data-settings-tab]').count() !== 5) failures.push('five settings tabs missing on start');
    await page.locator('#settings-tab-offline').click();
    if (await page.locator('#settings-panel-offline [data-install-game]').count() !== 1) failures.push('install button not in settings');
    await page.locator('#settings-tab-display').click();
    if (await page.locator('#setting-motion').count() !== 1) failures.push('animation setting missing');
    await page.locator('#settings-done').click();
    await page.locator('#campaign-select').selectOption('frei');
    await page.locator('#start-year').selectOption('1820');
    await page.locator('#start-era-summary').getByText('1820 · Industriezeitalter').waitFor();
    await page.getByRole('button', { name: /Herrschaft beginnen/i }).click();
    await page.locator('#kingdom-map').waitFor({ timeout: 30000 });
    await page.waitForFunction(() => document.querySelector('#kingdom-map canvas')?.dataset.mapStage);
    if (!(await page.locator('#kingdom-map canvas').isVisible()))
      failures.push('Game must begin with the central map visible');
    await page.screenshot({ path: 'smoke-desk-'+width+'.png' });
    if (!(await page.locator('#date').textContent())?.includes('1820')) failures.push('selected start year did not enter the simulation');
    if (await page.locator('.kingdom-app').getAttribute('data-era') !== 'industrial') failures.push('industrial epoch style not applied');
    await page.locator('#game-music-settings').waitFor();
    await page.locator('#game-music-settings > summary').click();
    await page.locator('[data-jukebox-select]').waitFor();
    await page.locator('.playlist-covers > summary').click();
    if (await page.locator('#playlist-mode').count() !== 1) failures.push('playlist modes missing');
    await page.locator('#playlist-mode').selectOption('shuffle');
    await page.locator('#playlist-repeat').selectOption('one');
    await page.locator('.cover-card').first().waitFor();
    if (await page.locator('.cover-card').count() !== 23) failures.push('expected all 23 official album covers');
    await page.locator('[data-jukebox-download]').waitFor({state:'attached'});
    if (await page.locator('#opening-play, [data-music-volume], [data-audio-toggle]').count())
      failures.push('redundant audio controls are still shown');
    if (await page.locator('#civic-open, .header-actions [data-install-game], #motion-toggle').count()) failures.push('header contains settings-only controls');
    await page.locator('#game-music-settings > summary').click();
    await openView(page, 'civic');
    await page.getByRole('heading', { name: /Aufträge an Bürger/i }).waitFor();
    if (await page.locator('[data-civic-assign]').count() < 5) failures.push('civic missions inaccessible');
    if (await page.locator('#section-dialog[open]').count()) await page.locator('#section-dialog-close').click();
    await page.locator('#settings-open').click();
    if (await page.locator('#advisor-backend').inputValue() !== 'off')
      failures.push('AI should default to disabled');
    await page.locator('#settings-tab-advisor').click();
    await page.locator('#advisor-backend').selectOption('webgpu');
    if (await page.locator('#advisor-start').count() !== 1) failures.push('WebGPU model start button missing');
    if (await page.locator('#advisor-progress').count() !== 1) failures.push('WebGPU load progress missing');
    if (await page.locator('#advisor-infer').isEnabled()) failures.push('Inference enabled before model loaded');
    await page.locator('#advisor-backend').selectOption('mini');
    if (await page.locator('#advisor-backend').inputValue() !== 'mini')
      failures.push('embedded mini model cannot be enabled');
    await page.locator('#settings-tab-film').click();
    if (await page.locator('#film-intro option').count() < 5)
      failures.push('five videos not available in film selector');
    await page.locator('#settings-tab-offline').click();
    if (!(await page.locator('a[href="/downloads/kaiser-von-deutschland-offline.zip"]').count()))
      failures.push('LAN-HTTP complete game ZIP link missing');
    await page.locator('#settings-tab-advisor').click();
    await page.locator('#advisor-backend').selectOption('off');
    await page.locator('#settings-done').click();
    const geometry = await page.evaluate(() => {
      const container = document.querySelector('.kingdom-app')?.getBoundingClientRect();
      return { width: container?.width ?? 0, height: container?.height ?? 0,
        viewportWidth: window.innerWidth, viewportHeight: window.innerHeight };
    });
    if (geometry.width < geometry.viewportWidth - 5 || geometry.height < geometry.viewportHeight - 5)
      failures.push('viewport ' + width + ': app not fullscreen ' + JSON.stringify(geometry));
    await page.locator('#epoch-info-toggle').click();
    await page.locator('#epoch-description').getByText(/Industrialisierung/).waitFor();
    await page.locator('[data-close-dialog="epoch-dialog"]').click();
    await page.locator('#legal-open').click();
    await page.locator('#legal-dialog').getByText(/Thomas Heisig/).first().waitFor();
    await page.locator('[data-close-dialog="legal-dialog"]').click();
    const mapLayer = await page.evaluate(() => {
      const layout=document.querySelector('.game-layout')?.getBoundingClientRect();
      const map=document.querySelector('.map-card')?.getBoundingClientRect();
      const host=document.querySelector('#kingdom-map')?.getBoundingClientRect();
      const resources=document.querySelector('.resource-bar')?.getBoundingClientRect();
      return {
        relativeWidth:layout && map ? Math.abs(layout.width-map.width) : Infinity,
        relativeHeight:layout && map ? Math.abs(layout.height-map.height) : Infinity,
        mapHostHeight:host?.height ?? 0,
        // The persistent vital-sign row deliberately takes 40–44 px from the map.
        statusBudget:Math.max(0,(resources?.height??0)-(innerWidth<=600?42:46)),
        duplicatedBuildings:document.querySelectorAll('#settlement-districts').length,
        overlaidControls:document.querySelectorAll('.map-controls [data-map-control]').length
      };
    });
    if(mapLayer.statusBudget>48 || mapLayer.mapHostHeight<300-mapLayer.statusBudget)
      failures.push('map must have a dedicated large viewport '+JSON.stringify(mapLayer));
    if(mapLayer.duplicatedBuildings||mapLayer.overlaidControls!==4)
      failures.push('map has duplicate district list or missing camera controls '+JSON.stringify(mapLayer));
    const canvas = page.locator('#kingdom-map canvas');
    const widthBeforeZoom = Number(await canvas.getAttribute('data-visible-width-metres'));
    await page.locator('.map-controls [data-map-control=in]').click();
    const widthAfterZoom = Number(await canvas.getAttribute('data-visible-width-metres'));
    if (!(widthAfterZoom < widthBeforeZoom)) failures.push('Zoom-in control did not reduce visible world width');
    await page.locator('.map-controls [data-map-control=out]').click();
    await page.locator('.map-controls [data-map-control=center]').click();
    await page.locator('#kingdom-map').screenshot({ path: `smoke-map-${width}.png` });
    if (await page.locator('#objectives .objective').count() !== 0) failures.push('sandbox should have zero mandatory goals');
    if (await page.locator('#section-dialog[open]').count()) await page.locator('#section-dialog-close').click();
    await openView(page, 'help');
    await page.locator('#section-dialog[open]').waitFor();
    await page.getByRole('heading', { name: 'Deine ersten Schritte' }).waitFor();
    if (await page.locator('#section-dialog[open]').count()) await page.locator('#section-dialog-close').click();
    await openView(page, 'diplomacy');
    await page.getByRole('heading', { name: /diplomatische hof/i }).waitFor();
    if (await page.locator('#section-dialog[open]').count()) await page.locator('#section-dialog-close').click();
    await openView(page, 'culture');
    await page.getByRole('heading', { name: /Feste im Jahreskreis/i }).waitFor();
    if (await page.locator('#section-dialog[open]').count()) await page.locator('#section-dialog-close').click();
    await openView(page, 'research');
    await page.getByRole('heading', { name: /Forschung im Reich/i }).waitFor();
    if (await page.locator('#section-dialog[open]').count()) await page.locator('#section-dialog-close').click();
    await openView(page, 'history');
    await page.getByRole('heading', { name: /Kunst, Kultur und Leben/i }).waitFor();
    await page.locator('#history-topic').selectOption('archive');
    if (await page.locator('[data-history-event="university-bologna"]').count() !== 1)
      failures.push('Bologna is missing from the historical archive');
    if (await page.locator('#section-dialog[open]').count()) await page.locator('#section-dialog-close').click();
    await openView(page, 'war');
    await page.getByRole('heading', { name: /Nachbarn/i }).waitFor();
    await page.screenshot({ path: `smoke-${width}.png`, fullPage: true });
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, document.documentElement.scrollHeight - document.documentElement.clientHeight));
    if (overflow > 2) failures.push(`viewport ${width}: horizontal overflow ${overflow}px`);
    if (errors.length) failures.push(`viewport ${width}: ${errors.join('; ')}`);
    await page.close();
  }

  // A finished save must expose working result actions, including after reload.
  for (const resultAction of ['menu', 'continue']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      const { GameEngine } = await import('/src/core/GameEngine.ts');
      const engine = new GameEngine({ startingYear: 1200, randomEvents: false, enableWiki: false });
      const ruler = engine.addPlayer({ name: 'Ergebnisprüfung', kingdomName: 'Testreich', gender: 'other' });
      try {
        await engine.startGame();
        engine.pauseGame();
        for (let month = 0; month < 3; month++) {
          ruler.kingdom.resources.gold = 0;
          ruler.kingdom.resources.food = 20000;
          ruler.kingdom.happiness = 60;
          await engine.advanceMonth();
        }
        if (!engine.isPlayerDefeated(ruler.id)) throw new Error('Expected a completed defeat scenario');
        await engine.saveGame('autosave');
      } finally { engine.dispose(); }
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#intro-skip').click();
    await page.locator('#continue').click();
    await page.locator('.campaign-result-dialog[open]').waitFor();
    await page.locator(`[data-result-${resultAction}]`).click();
    if (resultAction === 'menu') {
      await page.locator('#intro-skip').click();
      await page.getByRole('button', { name: /Herrschaft beginnen/i }).click();
      await page.locator('#kingdom-map canvas').waitFor();
      await page.locator('.map-controls [data-map-control=center]').click();
      await page.waitForFunction(() => document.querySelector('#kingdom-map canvas')?.dataset.cameraCentre);
    } else {
      await page.locator('.campaign-result-dialog').waitFor({ state: 'detached' });
      await page.getByText('Du spielst im Sandbox-Modus weiter', { exact: false }).waitFor();
      if (await page.locator('#objectives .objective').count()) failures.push('Sandbox still has mandatory objectives');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('#intro-skip').click();
      await page.locator('#continue').click();
      await page.locator('#kingdom-map canvas').waitFor();
      if (await page.locator('.campaign-result-dialog[open]').count()) failures.push('Sandbox reload repeated the defeat result');
    }
    if (errors.length) failures.push(`Result ${resultAction}: ${errors.join('; ')}`);
    await page.close();
  }

  // Mobile map regression: assert the central canvas and reachable camera controls.
  {
    const page = await browser.newPage({ viewport:{width:375,height:812}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4173/', {waitUntil:'domcontentloaded'});
    await page.locator('#intro-skip').click();
    await page.getByRole('button',{name:/Herrschaft beginnen/i}).click();
    const canvas=page.locator('#kingdom-map canvas');
    await canvas.waitFor({timeout:30000});
    await page.waitForFunction(() => document.querySelector('#kingdom-map canvas')?.dataset.mapStage);
    const metrics=await page.evaluate(() => {
      const canvas=document.querySelector('#kingdom-map canvas');
      const rect=canvas?.getBoundingClientRect();
      return {width:rect?.width??0,height:rect?.height??0,
        statusBudget:Math.max(0,(document.querySelector('.resource-bar')?.getBoundingClientRect().height??0)-42),
        stage:canvas?.dataset.mapStage,
        controls:document.querySelectorAll('.map-controls [data-map-control]').length};
    });
    if(metrics.width<300 || metrics.statusBudget>48 || metrics.height<300 || metrics.controls!==4)
      failures.push('Mobile map or camera controls are not reachable: '+JSON.stringify(metrics));
    const widthBefore = Number(await canvas.getAttribute('data-visible-width-metres'));
    await page.locator('.map-controls [data-map-control=out]').click();
    if (!(Number(await canvas.getAttribute('data-visible-width-metres')) > widthBefore))
      failures.push('Mobile zoom-out control did not increase visible world width');
    if(errors.length) failures.push('Mobile map runtime errors: '+errors.join('; '));
    await page.screenshot({path:'smoke-mobile-map-375.png',fullPage:true});
    await page.close();
  }
  // Ensure all three epoch PNG files are actually present and valid in the built site.
  {
    const page = await browser.newPage();
    for (const name of ['fantasy', 'urban', 'textures']) {
      const response = await page.request.get('http://127.0.0.1:4173/assets/kenney/retro-' + name + '-atlas.png');
      if (response.status() !== 200 || !(response.headers()['content-type'] || '').includes('image/png')) {
        failures.push('Missing Kenney epoch PNG: ' + name);
      } else {
        const bytes = await response.body();
        if (bytes.length < 100 || bytes.subarray(0,8).toString('hex') !== '89504e470d0a1a0a')
          failures.push('Invalid Kenney epoch PNG: ' + name);
      }
    }
    await page.close();
  }
  // Isolated renderer prototype must load independently of the game engine.
  {
    const page = await browser.newPage({ viewport:{width:820,height:740} });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response=await page.goto('http://127.0.0.1:4173/workshop-prototype.html', {waitUntil:'domcontentloaded'});
    if(response?.status()!==200) failures.push('workshop prototype HTML missing in production build');
    await page.locator('#scene canvas').waitFor({timeout:30000});
    // Pixi may load textures asynchronously after canvas insertion.
    await page.waitForFunction(() => {
      const el = document.querySelector('#measure');
      return el?.getAttribute('data-house-status') !== null;
    }, { timeout: 15000 });
    await page.waitForFunction(() => (document.querySelector('#measure')?.textContent || '').includes('P95:'), { timeout: 12000 });
    const atlas = await page.locator('#measure').getAttribute('data-asset-status');
    if (atlas !== 'loaded') failures.push('Kenney Retro atlas failed to load: '+atlas);
    if (await page.locator('#measure').getAttribute('data-house-status') !== 'rendered') failures.push('Real GLB house PNG did not load: '+await page.locator('#measure').evaluate(el => JSON.stringify(el.dataset)));
    const asset = await page.request.get('http://127.0.0.1:4173/assets/kenney/retro-workshop-atlas.png');
    if (asset.status() !== 200 || !(asset.headers()['content-type'] || '').includes('image/png'))
      failures.push('Kenney Retro PNG missing or invalid content type');
    const house = await page.request.get('http://127.0.0.1:4173/assets/kenney/retro-house-1200.png');
    if (house.status() !== 200 || !(house.headers()['content-type'] || '').includes('image/png')) failures.push('GLB house PNG missing');
    const result=await page.locator('#measure').innerText();
    if(!result.includes('P95:')||!result.includes('Frames:'))
      failures.push('prototype frame-time measurement not available: '+result);
    if(errors.length) failures.push('workshop prototype: '+errors.join('; '));
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
    await page.locator('#intro-skip').click();
    if (campaign === 'wissenschaft') await page.locator('#start-year').selectOption('1500');
    await page.locator('#campaign-select').selectOption(campaign);
    await page.getByRole('button', { name: /Herrschaft beginnen/i }).click();
    await page.locator('#kingdom-map canvas').waitFor({ timeout: 30000 });
    await page.locator('#briefing-open').click();
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
    await page.locator('#intro-skip').click();
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
    await page.locator('#intro-skip').click();
    await page.locator('#continue').click();
    await page.locator('#kingdom-map canvas').waitFor({ timeout: 30000 });
    if (await page.locator('#section-dialog[open]').count()) await page.locator('#section-dialog-close').click();
    await openView(page, 'economy');
    const route = page.locator('.build-card').filter({ has: page.getByRole('heading', { name: 'Hanserouten' }) });
    await route.getByRole('button', { name: 'Route aktivieren' }).click();
    await route.getByRole('button', { name: 'Route beenden' }).waitFor();
    if (errors.length) failures.push('Hansa UI: ' + errors.join('; '));
    await page.screenshot({ path: 'smoke-hanse-route.png', fullPage: true });
    await page.close();
  }

} catch (error) {
  for (const context of browser.contexts()) for (const page of context.pages()) {
    await page.screenshot({path:'smoke-failure.png'});
    console.error(await page.locator('dialog[open]').innerText().catch(()=>'No open dialog'));
  }
  throw error;
} finally {
  await browser.close();
}
if (failures.length) throw new Error(failures.join('\n'));
console.log('Desktop and 320x740 mobile UI smoke tests passed.');
