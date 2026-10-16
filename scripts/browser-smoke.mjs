import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const width of [1280, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 740 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /Kaiser von/i }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: /Herrschaft beginnen/i }).click();
    await page.getByRole('heading', { name: /Land & Leute/i }).waitFor({ timeout: 30000 });
    await page.locator('nav [data-view="help"]').click();
    await page.getByRole('heading', { name: 'Deine ersten Schritte' }).waitFor();
    await page.locator('nav [data-view="diplomacy"]').click();
    await page.getByRole('heading', { name: /diplomatische hof/i }).waitFor();
    await page.locator('nav [data-view="culture"]').click();
    await page.getByRole('heading', { name: /Feste im Jahreskreis/i }).waitFor();
    await page.screenshot({ path: `smoke-${width}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 2) failures.push(`viewport ${width}: horizontal overflow ${overflow}px`);
    if (errors.length) failures.push(`viewport ${width}: ${errors.join('; ')}`);
    await page.close();
  }
} finally {
  await browser.close();
}
if (failures.length) throw new Error(failures.join('\n'));
console.log('Desktop and 320x740 mobile UI smoke tests passed.');
