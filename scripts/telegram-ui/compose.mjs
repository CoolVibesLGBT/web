import assert from 'node:assert/strict';
import fs from 'node:fs';
import {browser,root,setup} from './fixture.mjs';
const results=[];
try {
 for(const item of [{width:320,language:'tr',theme:'light'},{width:390,language:'en',theme:'dark'},{width:820,language:'ar',theme:'dark',large:true},{width:1440,language:'en',theme:'light'}]) {
  const {context,page,errors,sent}=await setup(item);
  if(item.width===390)await page.emulateMedia({reducedMotion:'no-preference'});
  const strings=JSON.parse(fs.readFileSync(root+'/src/locales/'+item.language+'/common.json'));
  let choosers=0,failSticker=item.width===390;page.on('filechooser',()=>choosers++);
  await page.route('http://localhost:4001/**',async route=>{
   const request=route.request(),body=request.postData()||'',action=new URL(request.url()).searchParams.get('action')??body.match(/name="action"\r\n\r\n([^\r]+)/)?.[1];
   if(action==='chat.send_message'&&body.includes('.tgs')&&failSticker){failSticker=false;await route.fulfill({status:503,json:{success:false,error:'fixture send failure'}});return;}
   return route.fallback();
  });
  await page.goto('http://localhost:5173/messages');await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click();
  await page.locator('.cv-chat-attach').click();const menu=page.locator('.cv-attachment-menu:popover-open');await menu.waitFor();
  assert.equal(await menu.locator('select').count(),0,'expiry has no browser select');
  const geometry=await menu.evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,border:s.borderWidth,radius:s.borderRadius,shadow:s.boxShadow};});
  assert(geometry.left>=0&&geometry.right<=item.width,'menu fits');assert.equal(geometry.border,'0px');
  await menu.locator('.cv-attachment-expiry').click();await menu.getByRole('menuitemradio').last().waitFor();assert.equal(await menu.getByRole('menuitemradio').count(),6);
  await menu.getByRole('menuitemradio').nth(2).click();await menu.locator('.cv-attachment-expiry small').waitFor();assert.equal(await menu.locator('.cv-attachment-expiry small').innerText(),strings.messages.expiry_1_minute||JSON.parse(fs.readFileSync(root+'/src/locales/en/common.json')).messages.expiry_1_minute);
  await menu.locator('.cv-attachment-expiry').click();await page.keyboard.press('Escape');assert(await menu.isVisible(),'submenu Escape returns without closing attachment menu');
  await menu.locator('.cv-attachment-expiry').click();await menu.getByRole('menuitemradio').first().click();
  const chooser=page.waitForEvent('filechooser');await menu.getByRole('switch').click();await(await chooser).setFiles([]);await menu.waitFor({state:'hidden'});assert.equal(choosers,1,'explicit one-time photo choice only');
  await page.locator('.cv-chat-compose-field textarea').fill('Text after cancelling photo');await page.locator('.cv-chat-send').click();
  await page.getByText('Text after cancelling photo',{exact:true}).waitFor();assert.equal(choosers,1,'send never opens a file chooser');assert.equal(sent.at(-1).content,'Text after cancelling photo');
  await page.locator('.cv-chat-messages [data-virtuoso-scroller]').evaluate(e=>e.scrollTop=0);
  await page.locator('.cv-chat-emoji-toggle').click();let picker=page.locator('.emoji-dropdown:popover-open');await picker.getByRole('tab').nth(1).click();
  const animated=picker.locator('.cv-emoticon-results .cv-sticker-item').filter({has:page.locator('canvas')}).first();await animated.waitFor();await animated.click();await picker.waitFor({state:'hidden'});
  if(item.width===390){await page.locator('.cv-chat-action-error').waitFor();await page.locator('.cv-chat-action-error').getByRole('button',{name:strings.emoticons.retry,exact:true}).click();await page.locator('.cv-chat-action-error').waitFor({state:'hidden'});}
  await page.locator('.cv-chat-bubble[data-kind=sticker] canvas[data-animation*="/packs/"]').last().waitFor();
  assert(sent.at(-1).extras.emoticon.url.endsWith('.tgs'),'animated sticker sent');assert.equal(choosers,1,'sticker does not request a file');
  const target=await page.locator('.cv-chat-bubble[data-kind=sticker] canvas[data-animation*="/packs/"]').last().boundingBox();assert(target.y>=0&&target.y<900,'own sticker scrolls into view');
  await page.locator('.cv-chat-emoji-toggle').click();picker=page.locator('.emoji-dropdown:popover-open');await picker.getByRole('tab').nth(1).click();
  const packs=JSON.parse(fs.readFileSync(root+'/src/features/emoticons/sticker-packs.json'));const videoSet=packs.find(p=>p.documents.some(d=>d.url.endsWith('.webm')));
  await picker.getByRole('button',{name:videoSet.title,exact:true}).click();await picker.locator('.cv-emoticon-results .cv-sticker-item').filter({has:page.locator('video')}).first().click();
  await picker.waitFor({state:'hidden'});assert(sent.at(-1).extras.emoticon.url.endsWith('.webm'),'video sticker sent');
  await page.reload();await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click();await page.locator('.cv-chat-bubble[data-kind=sticker] video').last().waitFor();assert.equal(choosers,1);
  assert.deepEqual(errors,[]);results.push({...item,status:'passed',geometry,checks:['themed expiry submenu; no native select','six choices; keyboard/Escape returns to parent','cancel one-time photo then send text without chooser','animated TGS send; visible at bottom; failed send explicit retry','WEBM send and history reload; no file chooser for stickers']});console.log(item.width,item.language,'compose passed');await context.close();
 }
 fs.writeFileSync(root+'/docs/chat-compose-checks.json',JSON.stringify({date:new Date().toISOString().slice(0,10),method:'DOM/HTTP fixtures; real bundled animations; no screenshots',results},null,2)+'\n');
}finally{await browser.close();}
