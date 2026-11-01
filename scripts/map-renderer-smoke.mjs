// Accepts a Playwright page from the existing browser harness; no second server or browser dependency.
export async function runMapRendererSmoke(page, outputDir, url = 'http://127.0.0.1:4100/') {
  const output = name => `${outputDir}\\${name}`;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  await page.locator('#intro-skip').click();
  await page.locator('#start-year').selectOption('1200');
  await page.getByRole('button', { name: /Herrschaft beginnen/ }).click();
  const canvas = page.locator('#kingdom-map canvas');
  await page.waitForFunction(() => document.querySelector('#kingdom-map canvas')?.dataset.localMapLoaded === 'true');
  if (await page.locator('#report-toggle').getAttribute('aria-expanded') === 'true') {
    await page.locator('#report-toggle').click();
  }
  const read = async name => canvas.evaluate((el, name) => ({
    name, width: el.clientWidth, height: el.clientHeight,
    zoom: Number(el.dataset.mapZoom), metresPerCssPixel: Number(el.dataset.metresPerPixel),
    worldWidth: Number(el.dataset.visibleWidthMetres), worldHeight: Number(el.dataset.visibleHeightMetres),
    stage: el.dataset.mapStage, centre: el.dataset.cameraCentre,
    reference8mCssPixels: 8 / Number(el.dataset.metresPerPixel),
    scaleBarMetres: Number(el.dataset.scaleBarMetres),
    scaleBarCssPixels: Number(el.dataset.scaleBarCssPixels),
    metricView: el.dataset.metricView, roofVisible: el.dataset.nearRoofVisible,
  }), name);
  const rows = [];
  const capture = async name => {
    const row = await read(name);
    assert(Math.abs(row.worldWidth - row.width * row.metresPerCssPixel) < row.worldWidth * 0.00001,
      'Visible width does not follow the CSS scale');
    assert(Math.abs(row.scaleBarMetres / row.scaleBarCssPixels - row.metresPerCssPixel)
      < row.metresPerCssPixel * 0.00001, 'Scale bar does not match its drawn length');
    rows.push(row);
    await page.screenshot({ path: output(`${name}.png`) });
  };
  const zoomToWidth = async target => {
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 180; i++) {
      const before = await read('zoom');
      if (target === 3 ? before.worldWidth <= 3.000001
        : Math.abs(before.worldWidth - target) / target < 0.12) break;
      await page.mouse.wheel(0, before.worldWidth > target ? -120 : 120);
      await page.waitForTimeout(18);
    }
    await page.locator('[data-map-control=center]').click();
  };
  await zoomToWidth(4_000_000);
  await page.waitForFunction(() => document.querySelector('#kingdom-map canvas')?.dataset.europeLoaded === 'true');
  await capture('europa');
  await zoomToWidth(450_000);
  await capture('region');
  await zoomToWidth(20_000);
  await capture('siedlung');
  await zoomToWidth(20);
  await capture('haus-aussen');
  await zoomToWidth(13);
  await capture('behausung');
  const house = rows.at(-1);
  assert(house.metricView === 'true' && house.stage === 'Behausung', 'Actual metric dwelling view missing');
  await zoomToWidth(3);
  // Explicitly pan to the table; zoom must not silently teleport from the house centre to furniture.
  const deskScale = (await read('desk-pan')).metresPerCssPixel;
  let remaining = 2.6 / deskScale;
  const box = await canvas.boundingBox();
  while (remaining > 0.01) {
    const delta = Math.min(remaining, box.height / 4);
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - delta, { steps: 6 });
    await page.mouse.up();
    remaining -= delta;
  }
  await capture('schreibtisch');
  assert(rows.at(-1).roofVisible === 'false', 'Roof must reveal the modeled interior');
  assert(rows.at(-1).stage === 'Schreibtisch', 'Desk threshold not actually reachable');
  const before = await read('before-perspective');
  await page.locator('[data-fp-control]').click();
  const fp = page.locator('.fp-canvas[data-renderer=three]');
  await fp.waitFor();
  await page.waitForTimeout(250);
  await page.screenshot({ path: output('ich-innenraum.png') });
  const firstPosition = await fp.getAttribute('data-position');
  await page.keyboard.down('w');
  await page.waitForTimeout(500);
  await page.keyboard.up('w');
  assert(await fp.getAttribute('data-position') !== firstPosition, 'Real WASD input did not move the camera');
  const fpBox = await fp.boundingBox();
  await page.mouse.move(fpBox.x + fpBox.width / 2, fpBox.y + fpBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(fpBox.x + fpBox.width / 2 + 90, fpBox.y + fpBox.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  assert(Number(await fp.getAttribute('data-pitch')) !== -25, 'Vertical mouse-look missing');
  await page.keyboard.press('Escape');
  const after = await read('after-perspective');
  assert(before.centre === after.centre && before.metresPerCssPixel === after.metresPerCssPixel,
    'First-person entry/exit changed the map camera');
  assert(await page.locator('[data-fp-control]').evaluate(el => el === document.activeElement),
    'Escape did not return focus');
  assert(await page.locator('[data-fp-control]').getAttribute('aria-pressed') === 'false', 'Eye state stale');
  await page.locator('[data-fp-control]').click();
  await page.locator('.fp-exit-btn').click();
  assert(await page.locator('[data-fp-control]').evaluate(el => el === document.activeElement),
    'Exit button did not return focus');
  await page.locator('nav [data-view=economy]').click();
  const panel = await read('panel-open');
  assert(panel.width === after.width && panel.height === after.height && panel.centre === after.centre
    && panel.metresPerCssPixel === after.metresPerCssPixel, 'Side sheet resized or moved the map');
  assert(!await page.locator('#section-dialog').evaluate(el => el.matches(':modal')), 'Desktop sheet is modal');
  const mapBox = await canvas.boundingBox();
  await page.mouse.click(mapBox.x + 120, mapBox.y + mapBox.height / 2);
  await page.keyboard.press('ArrowRight');
  assert((await read('panel-pan')).centre !== panel.centre, 'Map input blocked beside desktop sheet');
  await page.screenshot({ path: output('seitenblatt.png') });
  await page.locator('#section-dialog-close').click();
  const resizeBefore = await read('resize-before');
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.waitForTimeout(250);
  const resizeAfter = await read('resize-after');
  assert(resizeAfter.centre === resizeBefore.centre
    && resizeAfter.metresPerCssPixel === resizeBefore.metresPerCssPixel, 'Resize changed centre or scale');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  await zoomToWidth(20_000);
  const pinchState = async () => canvas.evaluate(el => ({
    width: el.clientWidth, height: el.clientHeight,
    m: Number(el.dataset.scaleBarMetres) / Number(el.dataset.scaleBarCssPixels),
    centre: el.dataset.cameraCentre.split(',').map(Number),
  }));
  const pinchBefore = await pinchState(), touchBox = await canvas.boundingBox();
  const tx = Math.floor(touchBox.x + touchBox.width / 2);
  const ty = Math.floor(touchBox.y + touchBox.height / 2);
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart', touchPoints: [{ id: 1, x: tx - 30, y: ty }, { id: 2, x: tx + 30, y: ty }],
    });
    for (let i = 1; i <= 6; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
        { id: 1, x: tx - 30 - i * 5, y: ty }, { id: 2, x: tx + 30 + i * 5, y: ty },
      ] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await cdp.detach();
  }
  const pinchAfter = await pinchState();
  const point = state => [
    state.centre[0] * (20_000 / 960) + (tx - touchBox.x - state.width / 2) * state.m,
    state.centre[1] * (20_000 / 960) + (ty - touchBox.y - state.height / 2) * state.m,
  ];
  const a = point(pinchBefore), b = point(pinchAfter);
  const pinchErrorMetres = Math.hypot(a[0] - b[0], a[1] - b[1]);
  assert(pinchAfter.m < pinchBefore.m && pinchErrorMetres < 0.003, 'Native pinch lost its midpoint');
  await page.locator('#view-select').selectOption('economy');
  assert(await page.locator('#section-dialog').evaluate(el => el.matches(':modal')), 'Phone dialog not modal');
  await page.keyboard.press('Escape');
  await page.locator('[data-fp-control]').click();
  await page.locator('.fp-exit-btn').click();
  assert(errors.length === 0, errors.join('\n'));
  const result = { rows, resizeBefore, resizeAfter, pinchErrorMetres, errors,
    input: 'real Playwright wheel, drag, keyboard and Chromium native touch' };
  return result;
}
