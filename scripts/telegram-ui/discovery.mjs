import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browser, root, setup } from './fixture.mjs';

const results = [];
const cases = [{width:320,language:'tr',theme:'light'}, {width:390,language:'en',theme:'dark'}, {width:820,language:'ar',theme:'dark',large:true}, {width:1440,language:'tr',theme:'light'}];
const actionOf = request => new URL(request.url()).searchParams.get('action') ?? (request.postData() || '').match(/name="action"\r\n\r\n([^\r]+)/)?.[1];

async function cardsFit(page, view) {
 const cards = page.locator(`.cv-person-card[data-view="${view}"]`);
 await cards.first().waitFor();
 for (const card of await cards.all()) {
  await card.scrollIntoViewIfNeeded();
  const data = await card.evaluate(element => {
   const rect = element.getBoundingClientRect();
   return {overflow: element.scrollWidth > element.clientWidth + 1, width:rect.width, buttons:[...element.querySelectorAll('.cv-person-actions > button')].map(button => {const b=button.getBoundingClientRect();return {w:b.width,h:b.height,inside:b.left>=rect.left&&b.right<=rect.right}})};
  });
  assert(!data.overflow, JSON.stringify({view,...data}));
  assert.equal(data.buttons.length, view === 'list' ? 4 : 3);
  for (const button of data.buttons) assert(button.w>=44 && button.h>=44 && button.inside, 'Visible 44px targets stay inside each card');
 }
 assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No document overflow');
 return cards;
}

try {
 for (const item of cases) {
  const {context,page,user,errors} = await setup(item);
  const tr = JSON.parse(fs.readFileSync(`${root}/src/locales/${item.language}/common.json`));
  const people = Array.from({length:8}, (_,index) => ({...user,id:String(20000+index),public_id:String(20000+index),username:`member${index}`,displayname:index===0?'LongProfileNameWithoutSpacesForWrapping':`Member ${index}`,date_of_birth:'1990-01-01',location:{display:'İstanbul, Türkiye — long location for wrapping'},isOnline:true,avatar:{file:{url:`http://localhost:5173/${index===0?'missing-person-fixture.png':'icons/icon_512x512@2x.png'}`}}}));
  const mutations = [];
  let trendsCalls=0, vibeCalls=0, vibeMode='empty';
  await page.route('http://localhost:4001/**', async route => {
   const action = actionOf(route.request());
   if (action === 'user.fetch.nearby.users') return route.fulfill({json:{success:true,data:{users:people,cursor:null}}});
   if (['user.like.toggle','user.dislike.toggle','user.block.toggle'].includes(action)) {mutations.push(action);return route.fulfill({json:{success:true,data:{}}});}
   if (action === 'search.global') return route.fulfill({json:{success:true,data:{query:'hello',users:people,events:[],places:[],posts:[]}}});
   if (action === 'search.trends') {trendsCalls++;if(trendsCalls>1)await new Promise(resolve=>setTimeout(resolve,300));return route.fulfill({json:{success:true,data:{trends:[{tag:'hello',count:100}],last_update:new Date().toISOString()}}});}
   if (action === 'post.vibes') {
    vibeCalls++;
    if(vibeMode==='error')return route.fulfill({status:503,json:{message:'Fixture unavailable'}});
    const posts=vibeMode==='empty'?[]:[{public_id:'vibe-fixture',author:user,attachments:[{file:{url:`http://localhost:5173/${vibeMode==='broken'?'broken-vibe-fixture.png':'icons/icon_512x512@2x.png'}`,mime_type:'image/png',name:'Fixture photo'}}]}];
    return route.fulfill({json:{success:true,data:{posts,cursor:null}}});
   }
   if(action?.startsWith('match.fetch.'))return route.fulfill({json:{success:true,data:{users:[],cursor:null}}});
   return route.fallback();
  });

  await page.goto('http://localhost:5173/nearby');
  for(const view of ['grid','list','card']) {
   await page.waitForFunction(()=>document.querySelector('[role=tablist]'));
   await page.evaluate(viewMode=>window.dispatchEvent(new CustomEvent('cv:nearby-set-view-mode',{detail:{viewMode}})),view);
   const cards=await cardsFit(page,view==='grid'?'compact':view);
   if(view==='list')assert.equal(await cards.first().getByRole('button',{name:tr.app.nav.more,exact:true}).count(),0,'List shows all four direct actions');
   else {
    await cards.first().getByRole('button',{name:tr.app.nav.more,exact:true}).click();
    const menu=page.locator('dialog[open]');
    assert(await menu.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Long profile name wraps inside the action sheet');
    await menu.getByRole('button',{name:tr.discovery.dislike,exact:true}).click();
    assert(mutations.includes('user.dislike.toggle'));
    assert.equal(new URL(page.url()).pathname,'/nearby','Card action does not open profile');
   }
  }

  await page.goto('http://localhost:5173/search?q=hello');
  await cardsFit(page,'compact');
  const search=page.locator('.cv-global-search input');
  await search.focus();
  assert.deepEqual(await search.evaluate(e=>({outline:getComputedStyle(e).outlineStyle,shadow:getComputedStyle(e).boxShadow})),{outline:'none',shadow:'none'});
  assert.equal(await page.locator('.cv-right-sidebar input').count(),0,'Removed sidebar search');
  if(item.width>=1280) {
   const refresh=page.locator('.cv-trends-refresh');
   await page.waitForFunction(()=>!document.querySelector('.cv-trends-refresh').disabled);
   const before=await refresh.boundingBox();
   await refresh.click();
   await page.waitForFunction(()=>document.querySelector('.cv-trends-refresh').disabled);
   const during=await refresh.boundingBox();
   await page.waitForFunction(()=>!document.querySelector('.cv-trends-refresh').disabled);
   const after=await refresh.boundingBox();
   for(const box of [during,after])for(const key of ['x','y','width','height'])assert(Math.abs(before[key]-box[key])<.5,`Refresh ${key} stays fixed`);
  }

  await page.goto('http://localhost:5173/match');
  for(const [tab,kind] of [['match_now','discover'],['matches','matches'],['liked','liked'],['passed','passed']]) {
   await page.evaluate(tab=>window.dispatchEvent(new CustomEvent('cv:match-set-tab',{detail:{tab}})),tab);
   const empty=page.locator(`.cv-animated-empty[data-kind="${kind}"]`);
   await empty.waitFor();
   const canvas=empty.locator('canvas');
   await canvas.scrollIntoViewIfNeeded();
   await page.waitForFunction(kind=>document.querySelector(`.cv-animated-empty[data-kind="${kind}"] canvas`)?.dataset.ready==='true',kind);
   assert(await empty.locator('h3').innerText());
   assert.equal(await canvas.getAttribute('data-failed'),null);
  }

  await page.goto('http://localhost:5173/?tab=vibes');
  await page.getByRole('heading',{name:tr.discovery.empty_vibes,exact:true}).waitFor();
  const completed=vibeCalls;
  await page.waitForTimeout(500);
  assert.equal(vibeCalls,completed,'An empty Vibes result never refetches itself');
  assert.equal(await page.getByRole('status').count(),0);
  vibeMode='error';await page.reload();
  await page.getByRole('heading',{name:tr.discovery.vibes_error,exact:true}).waitFor();
  vibeMode='broken';await page.getByRole('button',{name:tr.emoticons.retry,exact:true}).click();
  await page.getByRole('heading',{name:tr.discovery.media_error,exact:true}).waitFor();
  await page.waitForFunction(()=>!document.querySelector('[role=status]'));
  vibeMode='loaded';await page.getByRole('button',{name:tr.emoticons.retry,exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('[role=status]')&&!document.querySelector('h2')?.textContent.includes('could not'));
  assert.equal(await page.getByRole('heading',{name:tr.discovery.media_error,exact:true}).count(),0);
  assert.deepEqual(errors,[]);
  results.push({...item,status:'passed',checks:['grid/list/card target geometry and wrapping','list exposes all four actions; compact/card secondary menu','search input has no focus ring; no sidebar search','fixed refresh geometry during request at desktop','four Match empty states decode original TGS stickers','empty Vibes does not loop; API and media failures recover; valid image loads'],vibeCalls});
  console.log(item.width,item.language,'discovery passed');
  await context.close();
 }
 fs.writeFileSync(root+'/docs/discovery-checks.json',JSON.stringify({date:new Date().toISOString().slice(0,10),method:'Browser DOM, original TGS canvas and intercepted API/media checks; no screenshots or real mutations',results},null,2)+'\n');
} finally {await browser.close();}
