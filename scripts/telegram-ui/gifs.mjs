import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browser, root, setup } from './fixture.mjs';

const results = [];
try {
 for (const item of [{width:320,language:'tr',theme:'light'}, {width:390,language:'en',theme:'dark'}, {width:820,language:'ar',theme:'dark',large:true}, {width:1440,language:'en',theme:'light'}]) {
  const {context,page,errors,sent} = await setup(item);
  const calls=[], unavailable={value:true};
  const video=fs.readFileSync(root+'/scripts/telegram-ui/assets/gif-fixture.mp4');
  const documentFor = (query,index) => ({kind:'gif',id:(query?'b':'a').repeat(62)+String(index).padStart(2,'0'),url:'/static/telegram/gifs/'+(query?'b':'a').repeat(62)+String(index).padStart(2,'0')+'.mp4',width:96,height:64});
  await page.route('http://localhost:4001/**',async route=>{
   const request=route.request(),url=new URL(request.url()),body=request.postData()||'';
   if(url.pathname.startsWith('/static/telegram/gifs/')) { await route.fulfill({body:video,contentType:'video/mp4'});return; }
   const action=url.searchParams.get('action')??body.match(/name="action"\r\n\r\n([^\r]+)/)?.[1];
   if(action!=='chat.media.gifs') return route.fallback();
   const field=name=>body.match(new RegExp('name="'+name+'"\\r\\n\\r\\n([^\\r]*)'))?.[1]??'';
   const query=field('query'),offset=field('offset'); calls.push({query,offset});
   if(unavailable.value) { await route.fulfill({status:503,json:{success:false,error:'telegram_media_unavailable'}});return; }
   await route.fulfill({json:{success:true,data:{documents:Array.from({length:20},(_,i)=>documentFor(query,i+(offset?20:0))),nextOffset:offset?'':'next-page'}}});
  });
  await page.goto('http://localhost:5173/messages');
  await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click();
  await page.locator('.cv-chat-emoji-toggle').click();
  const picker=page.locator('.cv-native-popover.emoji-dropdown:popover-open');await picker.waitFor();
  await picker.getByRole('tab').nth(2).click();await picker.getByRole('alert').waitFor();
  assert.equal(await picker.locator('.cv-gif-item').count(),0,'unavailable service has no false results');
  unavailable.value=false;await picker.getByRole('alert').getByRole('button').click();
  await picker.locator('.cv-gif-item video').first().waitFor();
  await page.waitForFunction(()=>document.querySelector('.cv-gif-item video')?.readyState>=2);
  const media=await picker.locator('video').first().evaluate(e=>({src:e.currentSrc,width:e.videoWidth,paused:e.paused,muted:e.muted,loop:e.loop}));
  assert(media.src.startsWith('http://localhost:4001/static/telegram/gifs/'));assert.equal(media.width,96);assert(media.muted&&media.loop);assert(media.paused,'reduced motion respected');
  const search=picker.locator('input[type=search]');await search.fill('cats');
  await page.waitForFunction(()=>[...document.querySelectorAll('.cv-gif-item video')].some(e=>e.src.includes('/'+'b'.repeat(62))));
  assert(calls.some(c=>c.query==='cats'&&c.offset===''),'new search resets pagination');
  await page.waitForTimeout(250); // Allow the virtualizer to measure the decoded first page.
  const scroller=picker.locator('.cv-emoticon-results [data-virtuoso-scroller]');
  const beforeHeight=await scroller.evaluate(e=>e.scrollHeight);await scroller.evaluate(e=>e.scrollTop=e.scrollHeight);
  const beforePage=await scroller.evaluate(e=>e.scrollTop);
  await page.waitForFunction(height=>document.querySelector('.cv-emoticon-results [data-virtuoso-scroller]').scrollHeight>height+100,beforeHeight);
  await page.waitForTimeout(100);
  assert((await scroller.evaluate(e=>e.scrollTop))>=beforePage-2,'appending results preserves scroll position');
  await scroller.evaluate(e=>e.scrollTop=e.scrollHeight);
  await page.waitForFunction(()=>[...document.querySelectorAll('.cv-gif-item video')].some(e=>e.src.includes('bbbbbbbb')&&/[23][0-9]\.mp4$/.test(e.src)));
  assert(calls.some(c=>c.query==='cats'&&c.offset==='next-page'),'cursor loads next page');
  await picker.locator('.cv-emoticon-search > button').last().click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.cv-gif-item video')].some(e=>e.src.includes('/'+'a'.repeat(62))));
  assert.equal(await search.inputValue(),'','clear resets the search');
  assert.equal(calls.filter(c=>!c.query&&!c.offset).length,2,'successful retry reused cached page');
  await picker.locator('.cv-gif-item').first().click();await picker.waitFor({state:'hidden'});
  assert.equal(sent.at(-1).extras.emoticon.kind,'gif');assert(sent.at(-1).extras.emoticon.url.startsWith('/static/telegram/gifs/'));
  await page.reload();await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click();
  await page.locator('.cv-chat-bubble[data-kind=gif] video').waitFor();
  assert.deepEqual(errors,[]);results.push({...item,status:'passed',media,checks:['unavailable service and retry','own API only; relative media URL resolved','MP4 decoded; muted looping; reduced motion pauses','query resets cursor; pagination; clear restores first page','send and history use typed GIF documents'],limits:'HTTP fixtures and a generated test video; no live Telegram account/session'});
  console.log(item.width,item.language,'GIF fixtures passed');await context.close();
 }
 fs.writeFileSync(root+'/docs/chat-gif-checks.json',JSON.stringify({date:new Date().toISOString().slice(0,10),method:'DOM/native video/HTTP fixtures; no screenshots',results},null,2)+'\n');
} finally { await browser.close(); }
