import assert from 'node:assert/strict';
import fs from 'node:fs';
import {browser,root,setup,settleScrollBottom} from './fixture.mjs';
const results=[];
const getHover=page=>page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--cv-list-hover').trim());
async function hoverEquals(page,row) {
 await row.hover();await page.waitForTimeout(180);
 const colors=await row.evaluate(e=>{const span=document.createElement('span');span.style.color='var(--cv-list-hover)';e.append(span);const expected=getComputedStyle(span).color;span.remove();return {actual:getComputedStyle(e).backgroundColor,expected};});
 assert.equal(colors.actual,colors.expected,'all list rows use the selected accent hover');return colors;
}
try {
 for(const item of [{width:320,language:'tr',theme:'light',mode:'day'},{width:390,language:'en',theme:'dark',mode:'night'},{width:820,language:'ar',theme:'dark',mode:'tinted',large:true},{width:1440,language:'en',theme:'light',mode:'light'}]) {
  const {context,page,user,errors}=await setup(item);user.engagements.counts.referral_count=150;user.engagements.counts.referral_amount=750;
  user.engagements.engagement_details=Array.from({length:150},(_,i)=>({id:'referral-'+i,kind:'referral',created_at:'2026-10-20T10:00:00Z',details:{amount:5},engager:{id:String(10000+i),public_id:String(10000+i),username:'referral'+i}}));
  await page.goto('http://localhost:5173/settings/appearance');await page.locator('input[value="'+item.mode+'"]').check();
  const card=page.locator('.theme-container');await card.nth(6).click();const first=await getHover(page);await card.nth(8).click();const second=await getHover(page);assert.notEqual(first,second,'hover follows selected color theme');
  await page.goto('http://localhost:5173/settings');const settingsCard=await page.locator('.skyline-page-scroll .cv-grouped-list:visible').first().evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,radius:s.borderRadius,border:s.borderWidth,shadow:s.boxShadow};});await hoverEquals(page,page.locator('.skyline-page-scroll button.cv-list-row:visible').first());
  await page.goto('http://localhost:5173/referrals');await page.locator('.cv-referrals .cv-grouped-list').last().waitFor();
  const referralCard=await page.locator('.cv-referrals .cv-grouped-list').first().evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,radius:s.borderRadius,border:s.borderWidth,shadow:s.boxShadow};});assert.deepEqual(referralCard,settingsCard,'referral card matches Settings');
  const rootBounds=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(rootBounds.scroll<=rootBounds.width,'no document overflow');
  await hoverEquals(page,page.locator('.cv-referrals button.cv-list-row').first());
  await page.locator('.cv-referrals-history').scrollIntoViewIfNeeded();await page.locator('.cv-referrals-history .cv-list-row').first().waitFor();assert((await page.locator('.cv-referrals-history .cv-list-row').count())<150,'history is virtualized');
  await settleScrollBottom(page,page.locator('.cv-referrals'),page.getByText('referral149',{exact:true}));await hoverEquals(page,page.locator('.cv-referrals-history .cv-list-row').filter({has:page.getByText('referral149',{exact:true})}));
  assert.equal(await page.locator('.cv-referrals').getByText(/referrals\.(invite|step|reward|share)/).count(),0,'translated labels');
  await page.goto('http://localhost:5173/messages');await hoverEquals(page,page.locator('.cv-chat-row').filter({hasText:'Forward Destination'}));
  await page.locator('.cv-chat-sidebar-header button:has(svg.cv-telegram-icon)').click();await page.locator('.cv-group-peers .cv-list-row').first().waitFor();const groupHover=await hoverEquals(page,page.locator('.cv-group-peers .cv-list-row').first());
  assert.deepEqual(errors,[]);results.push({...item,status:'passed',first,second,settingsCard,referralCard,groupHover,checks:['theme change updates one shared hover token','Settings, referrals, chat and group rows match','referral cards match Settings border/radius/shadow/surface','150 referrals virtualized; no overflow; translated labels']});console.log(item.width,item.language,'list themes passed');await context.close();
 }
 fs.writeFileSync(root+'/docs/theme-list-checks.json',JSON.stringify({date:new Date().toISOString().slice(0,10),method:'DOM/CSS/HTTP fixtures; no screenshots',results},null,2)+'\n');
}finally{await browser.close();}
