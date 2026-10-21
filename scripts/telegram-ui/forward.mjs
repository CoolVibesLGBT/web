import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browser, root, setup } from './fixture.mjs';
const results=[];
try {
 for(const item of [{width:320,language:'tr',theme:'light'},{width:390,language:'en',theme:'dark'},{width:820,language:'ar',theme:'dark',large:true},{width:1440,language:'en',theme:'light'}]) {
  const {context,page,errors,calls,forwardState}=await setup(item);
  await page.goto('http://localhost:5173/messages');
  await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click();
  const media=page.locator('[data-message-id="cccccccc-cccc-4ccc-8ccc-cccccccccccc"] .cv-chat-bubble');await media.waitFor();
  await media.click({button:'right'});await page.locator('.cv-message-actions [data-action="forward"]').click();
  const dialog=page.locator('dialog.cv-forward-picker[open]');await dialog.waitFor();
  const dimensions=await dialog.boundingBox();assert(dimensions.x>=-1&&dimensions.x+dimensions.width<=item.width+1,'dialog fits viewport');
  const ui=await dialog.evaluate(el=>({width:el.getBoundingClientRect().width,radius:getComputedStyle(el).borderRadius,headerHeight:el.querySelector('.cv-sheet-header').getBoundingClientRect().height,bodyPadding:getComputedStyle(el.querySelector('.cv-sheet-body')).padding,topPeers:el.querySelectorAll('.cv-forward-top-peer').length}));
  const properties=await dialog.evaluate(el=>{
    const style=getComputedStyle(el),root=getComputedStyle(document.documentElement),header=el.querySelector('.cv-sheet-header'),title=header.querySelector('h2'),card=el.querySelector('.cv-forward-destinations'),peer=el.querySelector('.cv-forward-top-peer'),avatar=peer.querySelector('.cv-forward-peer-avatar'),label=peer.lastElementChild;
    const normalize=color=>{const node=document.createElement('span');node.style.color=color;el.append(node);const resolved=getComputedStyle(node).color;node.remove();return resolved;};
    const tile=peer.getBoundingClientRect(),a=avatar.getBoundingClientRect(),l=label.getBoundingClientRect();
    return {scale:parseFloat(root.fontSize)/17,background:style.backgroundColor,expectedBackground:normalize(root.getPropertyValue('--cv-page-bg')),shadow:style.boxShadow,border:style.borderWidth,radius:parseFloat(style.borderRadius),headerHeight:header.getBoundingClientRect().height,titleFont:parseFloat(getComputedStyle(title).fontSize),titleWeight:getComputedStyle(title).fontWeight,iconSize:header.querySelector('.cv-forward-select-toggle svg').getBoundingClientRect().width,cardBackground:getComputedStyle(card).backgroundColor,expectedCard:normalize(root.getPropertyValue('--cv-card-bg-solid')),cardRadius:parseFloat(getComputedStyle(card).borderRadius),cardShadow:getComputedStyle(card).boxShadow,tile:{width:tile.width,height:tile.height,avatarTop:a.y-tile.y,avatarWidth:a.width,labelBottom:tile.y+tile.height-(l.y+l.height),font:parseFloat(getComputedStyle(label.parentElement).fontSize)}};
  });
  for(const [value,expected] of [[properties.radius,40],[properties.headerHeight,56],[properties.titleFont,20],[properties.iconSize,24],[properties.cardRadius,24],[properties.tile.width,78],[properties.tile.height,98],[properties.tile.avatarTop,12],[properties.tile.avatarWidth,54],[properties.tile.labelBottom,12],[properties.tile.font,12]])assert(Math.abs(value-expected*properties.scale)<.15,`source geometry ${value} vs ${expected*properties.scale}`);
  assert.equal(properties.background,properties.expectedBackground);assert.equal(properties.shadow,'none');assert.equal(properties.border,'0px');assert.equal(properties.titleWeight,'500');assert.equal(properties.cardBackground,properties.expectedCard);
  await dialog.locator('.cv-forward-recipient .cv-chat-row').first().hover();await page.waitForTimeout(220);
  const hover=await dialog.locator('.cv-forward-recipient .cv-chat-row').first().evaluate(el=>{const style=getComputedStyle(el),color=getComputedStyle(document.documentElement).getPropertyValue('--cv-telegram-row-hover'),node=document.createElement('span');node.style.color=color;el.append(node);const expected=getComputedStyle(node).color;node.remove();return {background:style.backgroundColor,expected};});assert.equal(hover.background,hover.expected);
  const inset=await dialog.locator('.cv-forward-top-peers').evaluate(e=>parseFloat(getComputedStyle(e).paddingTop));assert(Math.abs(inset-8*properties.scale)<.15,'recent peers inset from main card');
  assert.equal(ui.bodyPadding,'0px');assert.equal(ui.topPeers,2);assert.equal(ui.width,Math.min(420,item.width-(item.width<=480?16:24)));
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(forwardState.requests.length,0);
  await media.click({button:'right'});await page.locator('.cv-message-actions [data-action="forward"]').click();await dialog.waitFor();
  await dialog.locator('.cv-forward-search').fill('Destination');await dialog.locator('.cv-chat-row-main').first().waitFor();assert.equal(await dialog.locator('.cv-chat-row-main').count(),1,'destination search');
  assert.equal(await dialog.locator('.cv-forward-top-peer').count(),0,'recent peers collapse on search');
  await dialog.locator('.cv-chat-row-main').click();await dialog.waitFor({state:'hidden'});
  await page.locator('.cv-chat-compose-helper[data-forwarding="true"]').waitFor();assert.equal(forwardState.requests.length,0,'single recipient opens a composer preview without sending');
  if(item.width===390)forwardState.fail=true;
  await page.locator('.cv-chat-send').click();
  if(item.width===390){await page.locator('.cv-chat-action-error').waitFor();assert(await page.locator('.cv-chat-compose-helper[data-forwarding="true"]').isVisible());await page.locator('.cv-chat-send').click();}
  await page.locator('[data-message-id="forwarded-cccccccc-cccc-4ccc-8ccc-cccccccccccc"] .cv-chat-forwarded').waitFor();
  assert.deepEqual(forwardState.requests.at(-1),{source:'11111111-1111-4111-8111-111111111111',target:'33333333-3333-4333-8333-333333333333',ids:['cccccccc-cccc-4ccc-8ccc-cccccccccccc']});
  assert(await page.locator('[data-message-id="forwarded-cccccccc-cccc-4ccc-8ccc-cccccccccccc"] img').count()>0,'media retained');
  await page.reload();await page.locator('.cv-chat-row-main').filter({hasText:'Forward Destination'}).click();await page.locator('.cv-chat-forwarded').first().waitFor();
  if(item.width<1024) await page.locator('.cv-chat-topbar button:has(svg.lucide-arrow-left)').click();
  await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click();
  await page.locator('[data-message-id="dddddddd-dddd-4ddd-8ddd-dddddddddddd"] .cv-chat-bubble').click({button:'right'});await page.waitForTimeout(400);
  await page.locator('.cv-message-actions [data-action="select"]').click();await page.locator('.cv-chat-messages [data-virtuoso-scroller]').evaluate(el=>{el.scrollTop=el.scrollHeight;});await page.locator('[data-message-id="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]').click();
  await page.locator('.cv-chat-selection-bar button').nth(2).click();await dialog.waitFor();await dialog.locator('.cv-forward-select-toggle').click();
  await dialog.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click();await dialog.locator('.cv-chat-row-main').filter({hasText:'Forward Destination'}).click();
  assert.equal(await dialog.locator('.cv-forward-chip').count(),2);await dialog.locator('.cv-forward-comment textarea').fill('Forwarding comment');
  const before=forwardState.requests.length;forwardState.fail=true;await dialog.locator('.cv-forward-send').click();
  await dialog.getByRole('alert').waitFor();assert.equal(await dialog.locator('.cv-forward-chip').count(),1,'successful recipients removed after partial failure');
  await dialog.locator('.cv-forward-send').click();await dialog.waitFor({state:'hidden'});
  const batch=forwardState.requests.slice(before);assert.equal(batch.length,3);assert.equal(batch.filter(r=>r.target==='33333333-3333-4333-8333-333333333333').length,1,'successful destination not duplicated on retry');assert(batch.every(r=>r.ids.length===2));
  await page.locator('[data-message-id="forwarded-dddddddd-dddd-4ddd-8ddd-dddddddddddd"] .cv-chat-forwarded').waitFor();
  assert(await page.getByText('Forwarding comment',{exact:true}).count()>0);assert(!calls.includes('chat.send_message'),'forwarding and optional comment use atomic server command');assert.deepEqual(errors,[]);
  results.push({...item,status:'passed',ui,properties,hover,requests:forwardState.requests.length,checks:['source popup 420px/80%, 40px radius, 56px header','recent peers and search','Escape cancels','single target composer preview before sending','media attribution and history reload','multi target chips, text + sticker batch and comment','partial failure retries only failed targets']});
  console.log(item.width,item.language,'passed');await context.close();
 }
 fs.writeFileSync(root+'/docs/chat-forward-checks.json',JSON.stringify({date:new Date().toISOString().slice(0,10),method:'Playwright DOM only; HTTP fixtures, sockets blocked; separate isolated PostgreSQL integration test',results},null,2)+'\n');
 
} finally { await browser.close(); }
