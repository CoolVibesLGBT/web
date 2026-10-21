import assert from 'node:assert/strict';
import fs from 'node:fs';
import {browser,root,setup,selectProfileTab} from './fixture.mjs';
const results=[];
function merge(base, value) {const result={...base};for(const [key,item] of Object.entries(value))result[key]=item&&typeof item==='object'&&!Array.isArray(item)?merge(base?.[key]||{},item):item;return result;}
async function stickerReady(scope,title) {
 assert.equal(typeof title,'string');assert(title);
 const state=scope.locator('.cv-animated-empty').filter({has:scope.page().getByRole('heading',{name:title,exact:true})});
 await state.waitFor();const canvas=state.locator('canvas');await canvas.scrollIntoViewIfNeeded();
 await scope.page().waitForFunction(src=>[...document.querySelectorAll('canvas[data-animation]')].some(e=>e.dataset.animation===src&&e.dataset.ready==='true'),await canvas.getAttribute('data-animation'));
 assert.equal(await canvas.getAttribute('data-failed'),null);
 return state;
}
try {
 for(const item of [{width:320,language:'tr',theme:'light'},{width:390,language:'en',theme:'dark'},{width:820,language:'ar',theme:'dark',large:true},{width:1440,language:'tr',theme:'light'}]) {
  const {context,page,user,errors}=await setup(item,{premium:true});
  const tr=merge(JSON.parse(fs.readFileSync(`${root}/src/locales/en/common.json`)),JSON.parse(fs.readFileSync(`${root}/src/locales/${item.language}/common.json`)));
  let populated=false, slowAuth=false;
  await page.route('http://localhost:4001/**',async route=>{
   const request=route.request(),action=new URL(request.url()).searchParams.get('action')??(request.postData()||'').match(/name="action"\r\n\r\n([^\r]+)/)?.[1];
   if(action==='auth.user_info'&&slowAuth){await new Promise(resolve=>setTimeout(resolve,800));return route.fulfill({json:{success:true,data:{user}}});}
   if(action==='user.fetch_engagements')return route.fulfill({json:{success:true,data:{engagements:populated?Array.from({length:28},(_,i)=>({id:String(i),kind:'follower',engager:{id:String(3000+i),username:`follower${i}`,displayname:`Follower ${i}`},engagee:user})):[],cursor:null}}});
   if(action==='broadcast.fetch')return route.fulfill({json:{success:true,data:{items:[],cursor:null}}});
   if(['user.profile_photos.fetch','user.private_photos.fetch'].includes(action))return route.fulfill({json:{success:true,data:{photos:[],count:0,access:{status:'owner'}}}});
   if(action==='user.private_photos.access.requests')return route.fulfill({json:{success:true,data:{requests:[]}}});
   if(action==='chat.fetch_chats')return route.fulfill({json:{success:true,data:{chats:[]}}});
   return route.fallback();
  });
  await page.reload();
  for(const [tab,key] of [['posts','no_posts_yet'],['replies','no_replies_yet'],['media','no_media_yet'],['likes','no_likes_yet']]) {
   await selectProfileTab(page,tr.profile[tab+'_tab']);
   await stickerReady(page.locator('body'),tr.profile[key]);
  }
  await selectProfileTab(page,tr.social.friends);await stickerReady(page.locator('body'),tr.social.no_friends);
  await selectProfileTab(page,tr.social.photos);await stickerReady(page.locator('body'),tr.social.no_photos);

  for(const [route,label] of [['followers',tr.discovery.empty_people],['followings',tr.discovery.empty_people],['like_received',tr.discovery.empty_people]]) {
   await page.goto(`http://localhost:5173/${user.username}/${route}`);
   const header=page.locator('.cv-engagement-context');await header.getByText('@'+user.username,{exact:true}).waitFor();
   assert.equal(await header.getByRole('heading',{level:1}).count(),1);
   await stickerReady(page.locator('body'),label);
   await header.getByRole('button',{name:tr.app.back,exact:true}).click();
   await page.waitForURL('**/'+user.username);
   await page.locator('.cv-profile-name h1').waitFor();
  }
  populated=true;await page.goto(`http://localhost:5173/${user.username}/followers`);
  await page.getByText('Follower 27',{exact:true}).waitFor();
  const header=page.locator('.cv-engagement-context'),before=await header.boundingBox();
  await page.locator('.cv-engagement-page').evaluate(e=>e.scrollTop=600);
  const after=await header.boundingBox();assert(Math.abs(before.y-after.y)<1,'Profile card and navigation remain sticky');
  assert(await header.isVisible());
  await header.getByRole('button',{name:tr.app.back,exact:true}).click();await page.waitForURL('**/'+user.username);

  slowAuth=true;await page.goto('http://localhost:5173/settings');
  const loader=page.locator('.cv-route-loading');await loader.waitFor();assert.equal(await loader.evaluate(e=>getComputedStyle(e).position),'relative');assert.equal(await page.locator('dialog[open]').count(),0);assert.equal(await page.locator('.cv-pride-hero-bg').count(),0,'No automatic splash/loading modal');await page.waitForFunction(()=>document.querySelectorAll('.cv-route-loading').length===0);slowAuth=false;

  const settings=page.locator('.cv-settings-top');await settings.getByRole('heading',{name:tr.app.nav.settings,exact:true}).waitFor();
  const search=settings.locator('input');await search.fill('zzzz-no-setting-zzzz');
  await stickerReady(page.locator('body'),tr.search.no_results);
  assert.equal(await search.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
  await settings.getByRole('button',{name:tr.app.close,exact:true}).click();assert.equal(await search.inputValue(),'');
  await page.locator('.cv-settings-account').waitFor();
  const initial=await settings.boundingBox();await page.locator('.cv-settings-page').evaluate(e=>e.scrollTop=500);const scrolled=await settings.boundingBox();assert(Math.abs(initial.y-scrolled.y)<1);
  await page.goto('http://localhost:5173/live');await stickerReady(page.locator('body'),tr.live.empty);
  await page.goto('http://localhost:5173/?tab=flows');await stickerReady(page.locator('body'),tr.post_feed.empty);
  await page.goto('http://localhost:5173/notifications');await stickerReady(page.locator('body'),tr.notifications.no_notifications);
  assert.deepEqual(errors,[]);
  results.push({...item,status:'passed',checks:['four profile activity tabs use original animated empty component','friends and private photos empty states','followers/following/likes loaded empty states retain identity and Back','profile card/header stay visible on populated list scroll','settings title/back/search and empty search; sticky top; delayed session uses inline progress without automatic splash or modal','Live, Cool and notifications share animated empty component']});console.log(item.width,item.language,'empty states and headers passed');await context.close();
 }
 fs.writeFileSync(root+'/docs/empty-state-checks.json',JSON.stringify({date:new Date().toISOString().slice(0,10),method:'DOM/original TGS rendering with intercepted APIs; no screenshots or real account writes',results},null,2)+'\n');
}finally{await browser.close();}
