import assert from 'node:assert/strict';
import { browser, setup } from './fixture.mjs';
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
  for (const count of [2,1]) {
   if(count===1){post.attachments=post.attachments.slice(0,1);post.content={};await page.reload();await feed.waitFor();}
   const photos=feed.locator('.cv-post-photo');
   await photos.first().locator('img').evaluate(img=>img.decode());
   await photos.first().locator('canvas').waitFor();
   assert.equal(await photos.count(),count);
   for(const photo of await photos.all()) {
    await photo.locator('canvas').waitFor();
    assert.equal(await photo.getAttribute('data-concealed'),'true');
    assert.match(await photo.locator('img').evaluate(el=>getComputedStyle(el).filter),/blur\(/);
    assert.equal(await photo.locator('canvas').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
   }
   await photos.first().locator('img').click();
   assert.equal(await page.locator('.cv-post-gallery').count(),0,'first click only reveals');
   assert.equal(await photos.first().getAttribute('data-concealed'),null);
   assert.equal(await photos.first().locator('canvas').count(),0);
   if(count===2)assert.equal(await photos.nth(1).getAttribute('data-concealed'),'true','other photo remains concealed');
   await photos.first().locator('img').click();
   const gallery=page.locator('.cv-post-gallery');
   await gallery.waitFor();
   await page.keyboard.press('Escape');
   await gallery.waitFor({state:'hidden'});
  }
  const emptyRoot={type:'root',version:1,children:[],direction:null,format:'',indent:0};
  post.content={[item.language]:JSON.stringify({root:{...emptyRoot,children:[{type:'paragraph',version:1,direction:null,format:'',indent:0,children:[{type:'image',version:1,src:'/stickers/cat_18.png',altText:'Fixture sticker',width:160,height:160,maxWidth:500,showCaption:false,caption:{editorState:{root:emptyRoot}}}]}]}})};
  await page.reload();await feed.waitFor();
  const sticker=feed.locator('.cv-post-inline-media');
  await sticker.locator('canvas').waitFor();
  assert.equal(await sticker.getAttribute('data-concealed'),'true');
  assert.match(await sticker.locator('img').evaluate(el=>getComputedStyle(el).filter),/blur\(/);
  const priorUrl=page.url();
  await sticker.click();
  assert.equal(await sticker.getAttribute('data-concealed'),null);
  assert.equal(await sticker.locator('canvas').count(),0);
  assert.equal(page.url(),priorUrl,'revealing sticker must not navigate');
  assert.equal(await page.locator('.cv-post-gallery').count(),0);
  await page.evaluate(()=>localStorage.setItem('appSettings',JSON.stringify({blurPhotos:false})));
  await page.reload();await feed.waitFor();
  await feed.locator('.cv-post-photo img').evaluate(img=>img.decode());
  assert.equal(await feed.locator('.cv-post-photo canvas').count(),0);
  assert.equal(await feed.locator('.cv-post-photo img').evaluate(el=>getComputedStyle(el).filter),'none');
  await sticker.locator('img').waitFor();
  assert.equal(await sticker.locator('canvas').count(),0);
  assert.equal(await sticker.locator('img').evaluate(el=>getComputedStyle(el).filter),'none');
  assert.equal(await feed.getByText('Loading...', {exact:true}).count(),0);
  assert.deepEqual(errors,[]);
  console.log(item.width,item.language,'post blur and gallery passed');
  await context.close();
 }
} finally {await browser.close();}
