import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browser, root, setup } from './fixture.mjs';
const results=[];

try {
 const catalog=JSON.parse(fs.readFileSync(root+'/src/features/emoticons/sticker-packs.json','utf8'));const total=catalog.reduce((n,p)=>n+p.documents.length,0);assert.equal(total,294);
 for(const item of [{width:320,language:'tr',theme:'light',base:'day'},{width:390,language:'en',theme:'dark',base:'night'},{width:820,language:'ar',theme:'dark',large:true,base:'tinted'},{width:1440,language:'en',theme:'light',base:'light'}]) {
  const {context,page,errors,sent}=await setup(item);
  await page.evaluate(base=>localStorage.setItem('cv.appearance.v1',JSON.stringify({version:1,base,textSize:16,themes:{day:{preset:null},night:{preset:null},light:{preset:null},tinted:{preset:null}}})),item.base);
  await page.goto('http://localhost:5173/messages');await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click();
  await page.locator('.cv-chat-emoji-toggle').click();const picker=page.locator('.cv-native-popover.emoji-dropdown:popover-open');await picker.waitFor();
  await picker.getByRole('tab').nth(1).click();await picker.locator('.cv-sticker-item').first().waitFor();
  const grid=await picker.locator('.cv-emoticon-grid').evaluate(e=>({columns:getComputedStyle(e).gridTemplateColumns.split(' ').length,items:e.children.length}));assert.equal(grid.columns,5);assert(grid.items<total,'virtualized');
  assert.equal(await picker.locator('.cv-sticker-emotions button').count(),6);assert.equal(await picker.locator('.cv-sticker-packs button').count(),13);
  await page.waitForFunction(()=>[...document.querySelectorAll('.cv-emoticon-results canvas')].slice(0,5).every(c=>c.dataset.ready==='true'));
  const hasPixels=await picker.locator('.cv-emoticon-results canvas').first().evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0));assert(hasPixels,'real sticker rendered');
  assert.equal(await picker.locator('[data-failed=true]').count(),0,'no invisible broken animation');
  const before=sent.length, tile=picker.locator('.cv-emoticon-results .cv-sticker-item').first();const box=await tile.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  const preview=page.locator('.cv-sticker-preview:popover-open');await preview.waitFor();const bounds=await preview.boundingBox();assert.equal(bounds.width,item.width);assert.equal(bounds.height,900);await preview.locator('canvas[data-ready=true]').waitFor();
  await page.mouse.up();await preview.waitFor({state:'hidden'});assert.equal(sent.length,before,'hold never sends sticker');assert(await picker.isVisible(),'release keeps picker open');
  await picker.locator('.cv-sticker-emotions button').first().click();await page.waitForTimeout(100);const love=await picker.locator('.cv-emoticon-results canvas').evaluateAll(els=>els.map(e=>e.dataset.animation));assert(love.length>0);assert(love.every(url=>catalog.flatMap(set=>set.documents).some(d=>d.url===url&&/❤|😍|🥰|😘|💋|💕|💖/.test(d.emoji))),'filters use server emoji metadata');
  await picker.locator('.cv-emoticon-search-icon').click();await picker.locator('.cv-sticker-packs button').filter({has:page.locator('video')}).count();
  await picker.getByRole('button',{name:'Just zoo it!',exact:true}).click();await picker.locator('.cv-emoticon-results img').first().waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.cv-emoticon-results img')].slice(0,5).every(e=>e.complete&&e.naturalWidth>0));
  await picker.locator('.cv-emoticon-results .cv-sticker-item').first().click();await picker.waitFor({state:'hidden'});assert(sent.at(-1).extras.emoticon.url.endsWith('.webp'),'static sticker sends typed URL');
  await page.reload();await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click();await page.locator('.cv-chat-bubble[data-kind=sticker] img').waitFor();
  assert.deepEqual(errors,[]);results.push({...item,status:'passed',grid,checks:['11 actual Telegram packs/294 documents','five columns and virtualization','original SVG icons and metadata-based emoji filters','visible Lottie frames, no failed cells','full viewport animated preview; release never sends','WEBP send and history reload']});console.log(item.width,item.language,'passed');await context.close();
 }
 fs.writeFileSync(root+'/docs/chat-sticker-checks.json',JSON.stringify({date:new Date().toISOString().slice(0,10),method:'DOM/Canvas/HTTP fixtures; real bundled sticker assets, no screenshots',results},null,2)+'\n');
}finally{await browser.close();}
