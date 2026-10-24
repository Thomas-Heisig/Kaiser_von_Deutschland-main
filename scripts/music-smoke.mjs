import {chromium} from '../.browser-tools/node_modules/playwright/index.mjs';
import {readFile, mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const catalog=JSON.parse(await readFile('src/data/json/music-catalog.json','utf8'));
const browser=await chromium.launch({headless:true});
await mkdir('.temp',{recursive:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:850},reducedMotion:'reduce'});
  page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    window.testAudio=[];
    window.Audio=new Proxy(window.Audio,{construct(target,args){const audio=Reflect.construct(target,args);window.testAudio.push(audio);return audio;}});
  });
  const base=process.env.KAISER_TEST_URL??'http://127.0.0.1:4173/';
  await page.goto(base);await page.locator('#intro-skip').click();
  await page.waitForFunction(()=>window.testAudio.some(a=>a.src.includes('schleier-der-vorzeit.mp3')&&!a.paused));
  assert.match(await page.locator('#opening-music').innerText(),/Ancient Veil/);
  await page.locator('#campaign-select').selectOption('frei');
  await page.locator('#start-year').selectOption('-1999');
  for(let i=0;i<6&&!await page.locator('[name=events]').isVisible();i++)await page.getByRole('button',{name:'Weitere Einstellungen',exact:true}).click();
  await page.locator('[name=events]').uncheck();
  for(let i=0;i<6&&!await page.locator('#tutorial-toggle').isVisible();i++)await page.getByRole('button',{name:'Weitere Einstellungen',exact:true}).click();
  await page.locator('#tutorial-toggle').uncheck();
  await page.getByRole('button',{name:/Herrschaft beginnen/}).click();
  await page.locator('#kingdom-map canvas').waitFor();
  const originals=catalog.tracks.slice(15);
  // A real media element decodes each recording, advances its clock, then triggers the next era track.
  for(const track of originals){
    await page.waitForFunction(filename=>window.testAudio.some(a=>a.src.endsWith('/'+filename)&&!a.paused&&a.currentTime>0.05),track.filename);
    const duration=await page.evaluate(filename=>window.testAudio.find(a=>a.src.endsWith('/'+filename)&&!a.paused).duration,track.filename);
    assert.ok(Math.abs(duration-track.durationSeconds)<1);
    assert.equal(await page.locator('[data-jukebox-title]').textContent(),track.title);
    assert.ok((await page.locator('[data-jukebox-cover]').getAttribute('src')).endsWith(track.cover));
    await page.locator('[data-action=month]').click();
    assert.equal(await page.evaluate(filename=>window.testAudio.some(a=>a.src.endsWith('/'+filename)&&!a.paused),track.filename),true);
    await page.evaluate(filename=>window.testAudio.find(a=>a.src.endsWith('/'+filename)&&!a.paused).dispatchEvent(new Event('ended')),track.filename);
  }
  await page.waitForFunction(()=>window.testAudio.some(a=>a.src.endsWith('/schleier-der-vorzeit.mp3')&&!a.paused));
  await page.locator('#game-music-settings > summary').click();
  assert.equal(await page.locator('[data-jukebox-select] option').count(),20);
  await page.locator('.playlist-covers > summary').click();
  for(let i=0;i<5;i++) await page.locator('[data-cover-page="1"]').click();
  await page.locator('[data-cover-id=schleier-der-vorzeit] img').waitFor();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.cover-card:not([hidden]) img')).every(img=>img.complete&&img.naturalWidth>0));
  await page.screenshot({path:'.temp/music-prehistory.png'});
  for(const track of originals){
    const response=await page.request.get(new URL(track.cover.replace(/^\//,''),base).href);
    assert.equal(response.status(),200);assert.equal((await response.body()).subarray(8,12).toString(),'WEBP');
  }
  assert.deepEqual(errors,[]);
  console.log('Five prehistoric recordings decode/play, rotate without monthly restart, and display matching covers; Ancient Veil starts the menu.');
} finally {await browser.close();}
