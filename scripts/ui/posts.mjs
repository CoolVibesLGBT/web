import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browser, root, setup } from './fixture.mjs';
const results=[];
try {
 for(const item of [{width:320,language:'tr',theme:'light'},{width:390,language:'en',theme:'dark'},{width:820,language:'ar',theme:'dark',large:true},{width:1440,language:'tr',theme:'light'}]) {
  const {context,page,user,errors}=await setup(item);
  const image='http://localhost:5173/icons/icon_512x512@2x.png';
  const post={id:'11111111-1111-4111-8111-111111111111',public_id:'2113015734824079360',author_id:'22222222-2222-4222-8222-222222222222',author:{...user,id:'22222222-2222-4222-8222-222222222222',username:'ersan',displayname:'LongAuthorNameForLayout'},content:{[item.language]:'Parity post content'},post_kind:'post',created_at:new Date().toISOString(),updated_at:new Date().toISOString(),deleted_at:null,children:[],attachments:[1,2].map(index=>({id:String(index),file_id:String(index),processing_status:'ready',file:{id:String(index),url:image,mime_type:'image/png',name:`photo${index}.png`}})),poll:[{id:'poll-1',question:{[item.language]:'Parity poll question'},duration:'24h',kind:'single',max_selectable:1,created_at:new Date().toISOString(),choices:[{id:'choice1',label:{[item.language]:'Parity option one'},vote_count:0},{id:'choice2',label:{[item.language]:'Parity option two'},vote_count:0}]}],engagements:{counts:{like_received_count:1,dislike_received_count:0,banana_count:0,bookmark_count:0,comment_count:0,view_count:2},engagement_details:[{id:'initial-like',engager_id:user.id,kind:'like_received'}]}};
  const calls=[];
  let failNext=false;
  await page.route('http://localhost:4001/**',async route=>{
   const req=route.request(),body=req.postData()||'',action=new URL(req.url()).searchParams.get('action')??body.match(/name="action"\r\n\r\n([^\r]+)/)?.[1];
   if(action==='post.timeline')return route.fulfill({json:{success:true,data:{posts:[post],cursor:null}}});
   if(action==='post.fetch')return route.fulfill({json:{success:true,data:post}});
   if(['post.like','post.dislike','post.banana','post.bookmark'].includes(action)) {
    calls.push(action);
    if(failNext){failNext=false;return route.fulfill({status:503,json:{message:'Fixture unavailable'}});}
    const kind={'post.like':'like_received','post.dislike':'dislike_received','post.banana':'banana','post.bookmark':'bookmark'}[action];
    const prior=post.engagements.engagement_details.findIndex(e=>e.kind===kind);
    if(prior>=0)post.engagements.engagement_details.splice(prior,1);else post.engagements.engagement_details.push({id:action,engager_id:user.id,kind});
    const key={'post.like':'like_received_count','post.dislike':'dislike_received_count','post.banana':'banana_count','post.bookmark':'bookmark_count'}[action];
    post.engagements.counts[key]=prior>=0?0:1;
    return route.fulfill({json:{success:true,data:{}}});
   }
   return route.fallback();
  });
  await page.goto('http://localhost:5173/?tab=flows');
  const feed=page.locator('.cv-feed-post .cv-post').first();await feed.waitFor();
  await feed.getByText('Parity poll question',{exact:true}).waitFor();
  assert.equal(await feed.getByText('Parity option one',{exact:true}).count(),1);
  const outer=feed.locator('..');
  assert.deepEqual(await outer.evaluate(e=>({radius:getComputedStyle(e).borderRadius,border:getComputedStyle(e).borderTopWidth})),{radius:'0px',border:'0px'});
  async function controlsFit(card) {
   const bar=card.locator('.cv-post-actions');await bar.scrollIntoViewIfNeeded();
   const boxes=await bar.evaluate(e=>{const p=e.getBoundingClientRect();return [...e.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return {w:r.width,h:r.height,inside:r.left>=p.left&&r.right<=p.right}})});
   assert.equal(boxes.length,6);
   for(const box of boxes)assert(box.w>=44&&box.h>=44&&box.inside,JSON.stringify(box));
   assert(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Post content does not overflow');
   for(const label of ['Like post','Dislike post','Banana','Comment','Tip','Bookmark'])assert.equal(await card.getByRole('button',{name:label,exact:true}).count(),1);
  }
  await controlsFit(feed);
  const firstPhoto=feed.getByAltText('Post attachment 1',{exact:true});
  const firstTile=feed.locator('.cv-post-photo').first();
  assert.equal(await firstTile.getAttribute('data-concealed'),'true','Default photo privacy remains enabled');
  await firstPhoto.click();
  await page.waitForFunction(()=>!document.querySelector('.cv-feed-post .cv-post-photo')?.hasAttribute('data-concealed'));
  assert.equal(await page.locator('.cv-post-gallery').count(),0,'First click reveals the photo without opening the gallery');
  await firstPhoto.click();const gallery=page.locator('.cv-post-gallery');await gallery.waitFor();assert.equal(await gallery.locator('xpath=ancestor::*[contains(@class,"cv-feed-post")]').count(),0,'Gallery escapes card containment');const galleryBox=await gallery.boundingBox();assert.equal(galleryBox.width,item.width);assert.equal(galleryBox.height,900);await gallery.getByRole('button',{name:JSON.parse(fs.readFileSync(`${root}/src/locales/${item.language}/common.json`)).app.close,exact:true}).click();await gallery.waitFor({state:'hidden'});

  const like=feed.getByRole('button',{name:'Like post',exact:true});
  assert.equal(await like.getAttribute('aria-pressed'),'true','Initial saved engagement is visible');
  await like.click();await page.waitForFunction(()=>document.querySelector('.cv-feed-post [aria-label="Like post"]')?.getAttribute('aria-pressed')==='false');
  await page.waitForFunction(()=>!document.querySelector('.cv-feed-post [aria-label="Like post"]').disabled);
  failNext=true;await like.click();await page.waitForFunction(()=>!document.querySelector('.cv-feed-post [aria-label="Like post"]').disabled);assert.equal(await like.getAttribute('aria-pressed'),'false','API failure rolls back');
  const bookmark=feed.getByRole('button',{name:'Bookmark',exact:true});await bookmark.click();await page.waitForFunction(()=>!document.querySelector('.cv-feed-post [aria-label="Bookmark"]').disabled);assert.equal(await bookmark.getAttribute('aria-pressed'),'true');
  for(const [label,action] of [['Dislike post','post.dislike'],['Banana','post.banana']]) {const button=feed.getByRole('button',{name:label,exact:true});await button.click();await page.waitForFunction(label=>!document.querySelector('.cv-feed-post [aria-label="'+label+'"]').disabled,label);assert(calls.includes(action));assert.equal(await button.getAttribute('aria-pressed'),'true');}
  assert(calls.includes('post.like')&&calls.includes('post.bookmark'),'Actions reach actual API service');
  await feed.getByRole('button',{name:'Comment',exact:true}).click();await page.locator('.cv-modal-glass-panel').waitFor();assert.equal(new URL(page.url()).pathname,'/','Reply does not navigate the card');
  await page.goto('http://localhost:5173/ersan/status/2113015734824079360');
  const detail=page.locator('.cv-post').first();await detail.waitFor();await detail.getByText('Parity poll question',{exact:true}).waitFor();await controlsFit(detail);
  const gutters=await page.locator('.cv-post-detail-content').evaluate(e=>({left:getComputedStyle(e).paddingLeft,right:getComputedStyle(e).paddingRight,width:e.getBoundingClientRect().width,parent:e.parentElement.getBoundingClientRect().width}));assert.equal(gutters.left,'0px');assert.equal(gutters.right,'0px');assert.equal(gutters.width,gutters.parent);assert.equal(await detail.getByRole('button',{name:'Bookmark',exact:true}).getAttribute('aria-pressed'),'true','Feed and detail share saved actions');
  await detail.getByRole('button',{name:'Like post',exact:true}).focus();assert.deepEqual(await detail.getByRole('button',{name:'Like post',exact:true}).evaluate(e=>({outline:getComputedStyle(e).outlineStyle,shadow:getComputedStyle(e).boxShadow})),{outline:'none',shadow:'none'});
  assert.deepEqual(errors,[]);results.push({...item,status:'passed',checks:['Cool and detail use same renderer, poll/options and multi-attachment data','six responsive actions; four toggle APIs and failure rollback; gallery escapes containment and closes at viewport size','saved initial engagement and bookmark persist to detail; failure rolls back','reply opens without card navigation','no card border/radius or focus ring; detail uses column width with zero outer gutters'],calls});console.log(item.width,item.language,'post parity passed');await context.close();
 }
 fs.writeFileSync(root+'/docs/post-parity-checks.json',JSON.stringify({date:new Date().toISOString().slice(0,10),method:'DOM and intercepted post APIs; no screenshots, live posts or account mutations',results},null,2)+'\n');
}finally{await browser.close();}
