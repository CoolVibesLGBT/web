import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browser, root, setup } from './fixture.mjs';
try {
 for(const item of [{width:320,language:'tr',theme:'light'},{width:390,language:'en',theme:'dark'},{width:820,language:'ar',theme:'dark',large:true},{width:1440,language:'tr',theme:'light'}]) {
  const {context,page,user,errors}=await setup(item);
  user.balance=10;
  let sent=0;
  let reject=true;
  const image='http://localhost:5173/icons/icon_512x512@2x.png';
  const post={id:'11111111-1111-4111-8111-111111111111',public_id:'2113015734824079360',author_id:'22222222-2222-4222-8222-222222222222',author:{...user,id:'22222222-2222-4222-8222-222222222222',username:'ersan',displayname:'LongAuthorNameForLayout'},content:{[item.language]:'Parity post content'},post_kind:'post',created_at:new Date().toISOString(),updated_at:new Date().toISOString(),deleted_at:null,children:[],attachments:[1,2].map(index=>({id:String(index),file_id:String(index),processing_status:'ready',file:{id:String(index),url:image,mime_type:'image/png',name:`photo${index}.png`}})),poll:[{id:'poll-1',question:{[item.language]:'Parity poll question'},duration:'24h',kind:'single',max_selectable:1,created_at:new Date().toISOString(),choices:[{id:'choice1',label:{[item.language]:'Parity option one'},vote_count:0},{id:'choice2',label:{[item.language]:'Parity option two'},vote_count:0}]}],engagements:{counts:{like_received_count:1,dislike_received_count:0,banana_count:0,bookmark_count:0,comment_count:0,view_count:2},engagement_details:[{id:'initial-like',engager_id:user.id,kind:'like_received'}]}};
  const calls=[];
  let failNext=false;
  await page.route('http://localhost:4001/**',async route=>{
   const req=route.request(),body=req.postData()||'',action=new URL(req.url()).searchParams.get('action')??body.match(/name="action"\r\n\r\n([^\r]+)/)?.[1];
   if(action==='post.tip'){sent++;await new Promise(resolve=>setTimeout(resolve,250));if(reject)return route.fulfill({status:503,json:{message:'Fixture tip failure'}});return route.fulfill({json:{success:true,data:{balance:9}}});}
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
  const locale=JSON.parse(fs.readFileSync(`${root}/src/locales/${item.language}/common.json`));
  const trigger=feed.getByRole('button',{name:'Tip',exact:true});
  const dialog=page.locator('dialog.cv-tip-dialog');
  const close=dialog.locator('.cv-sheet-header button');
  await trigger.click();await dialog.waitFor({state:'visible'});
  assert.equal(await dialog.evaluate(el=>el.matches(':modal')),true);
  const cards=dialog.locator('.cv-tip-amount-grid > button');
  assert.equal(await cards.count(),24);
  assert.equal(await dialog.locator('.cv-tip-gift-art canvas').count(),24);
  assert.equal(await dialog.locator('.cv-tip-amount-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),3);
  await cards.first().click();
  assert.equal(await cards.first().getAttribute('aria-pressed'),'true');
  await cards.first().locator('.cv-tip-gift-check').waitFor();
  await cards.first().locator('canvas[data-ready="true"]').waitFor();
  const firstClose=await close.boundingBox();
  await close.hover();
  const hoverClose=await close.boundingBox();
  assert.deepEqual(hoverClose,firstClose,'close button does not move on hover');
  assert(firstClose.width>=44&&firstClose.height>=44);
  const bounds=await dialog.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=item.width+.5);
  assert(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'no horizontal overflow');
  await close.click();await dialog.waitFor({state:'hidden'});
  assert(await trigger.evaluate(el=>document.activeElement===el),'focus returns to trigger');
  await trigger.click();
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  await trigger.click();
  await dialog.getByRole('button',{name:locale.wallet.custom_amount,exact:true}).click();
  assert.deepEqual(await close.boundingBox(),firstClose,'close button stays fixed after content scroll');
  const custom=dialog.getByRole('textbox');
  await custom.fill('50');
  const send=dialog.locator('.cv-sheet-actions button');
  assert.equal(await send.innerText(),locale.wallet.deposit);
  assert.equal(await dialog.locator('.cv-sheet-body').getByRole('button',{name:locale.wallet.deposit,exact:true}).count(),0,'deposit belongs to footer');
  assert.equal(sent,0,'insufficient balance never submits');
  await dialog.getByText(locale.tips.insufficient,{exact:true}).waitFor();
  await custom.fill('1,00');
  assert.equal(await custom.inputValue(),'1.00');
  await send.click();
  await dialog.getByRole('alert').waitFor();
  assert.equal(sent,1);
  assert.equal(await dialog.getByRole('status').count(),0,'failure must not display success');
  reject=false;
  await send.click();
  await dialog.getByRole('status').waitFor();
  assert.equal(sent,2);
  assert.equal(await dialog.locator('h2').innerText(),locale.tips.sent);
  await close.click();await dialog.waitFor({state:'hidden'});
  await trigger.click();
  await dialog.getByRole('button',{name:locale.wallet.custom_amount,exact:true}).click();
  await custom.fill('50');
  await dialog.locator('.cv-sheet-actions').getByRole('button',{name:locale.wallet.deposit,exact:true}).click();
  await page.waitForURL('**/wallet');
  assert.equal(sent,2,'deposit navigates without sending a tip');
  assert.deepEqual(errors,[]);
  console.log(item.width,item.language,'tip modal, close stability, error and success fixtures passed');
  await context.close();
 }
} finally {await browser.close();}
