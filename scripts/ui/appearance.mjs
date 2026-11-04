import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browser, root, setup } from './fixture.mjs';
const results=[];
try {
 for(const item of [{width:320,language:'tr',theme:'dark',mode:'night'},{width:390,language:'en',theme:'dark',mode:'tinted'},{width:820,language:'ar',theme:'dark',mode:'night',large:true},{width:1440,language:'en',theme:'light',mode:'day'}]){
  const {context,page,errors}=await setup(item);await page.goto('http://localhost:5173/settings/appearance');await page.locator('.theme-container').last().waitFor();await page.locator(`input[value="${item.mode}"]`).check();await page.waitForTimeout(120);
  const cards=await page.locator('.theme-container').evaluateAll(ns=>ns.map(n=>{const wp=n.querySelector('.cv-chat-wallpaper'),canvas=wp.querySelector('canvas'),c=canvas.getContext('2d').getImageData(0,0,50,50).data;let chroma=0;for(let i=0;i<c.length;i+=4)chroma=Math.max(chroma,Math.max(c[i],c[i+1],c[i+2])-Math.min(c[i],c[i+1],c[i+2]));return {chroma,blackMask:wp.classList.contains('cv-chat-wallpaper-night'),canvasOpacity:getComputedStyle(canvas).opacity};}));
  assert.equal(cards.length,9);assert(cards.every(c=>!c.blackMask&&c.canvasOpacity==='1'&&c.chroma>10),'all dark theme cards retain visible original colors');
  const slider=page.locator('#message-text-size');await slider.focus();const before=Number(await slider.inputValue());await slider.press('ArrowUp');assert.equal(Number(await slider.inputValue()),Math.min(before+1,20));
  const field=await slider.evaluate(n=>({outline:getComputedStyle(n).outlineStyle,shadow:getComputedStyle(n).boxShadow,border:getComputedStyle(n).borderWidth,height:n.getBoundingClientRect().height,progress:n.style.getPropertyValue('--range-progress')}));assert.equal(field.outline,'none');assert.equal(field.shadow,'none');assert.equal(field.border,'0px');assert.equal(field.height,44);assert(field.progress.endsWith('%'));
  await page.reload();assert.equal(Number(await slider.inputValue()),Math.min(before+1,20));assert.deepEqual(errors,[]);
  const previous=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--cv-chat-outgoing'));
  await page.locator('.theme-container').last().click();
  await page.waitForFunction(before=>getComputedStyle(document.documentElement).getPropertyValue('--cv-chat-outgoing')!==before,previous);
  await page.goto('http://localhost:5173/messages');await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click();
  await page.locator('[data-message-id="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"] .cv-chat-message-text').waitFor();
  const application=await page.locator('[data-message-id="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"] .cv-chat-bubble').evaluate(el=>{
   const color=name=>{const span=document.createElement('span');if(name==='--cv-chat-outgoing')span.style.background=getComputedStyle(document.documentElement).getPropertyValue('--cv-chat-outgoing-background');else span.style.color=getComputedStyle(document.documentElement).getPropertyValue(name);el.append(span);const result=name==='--cv-chat-outgoing'?getComputedStyle(span).backgroundImage:getComputedStyle(span).color;span.remove();return result;};
   return {background:getComputedStyle(el).backgroundImage,text:getComputedStyle(el.querySelector('.cv-chat-message-text')).color,expectedBackground:color('--cv-chat-outgoing'),expectedText:color('--cv-chat-outgoing-text')};
  });
  assert.equal(application.background,application.expectedBackground,'bubble applies the chosen theme');assert.equal(application.text,application.expectedText,'text applies the chosen theme');assert.deepEqual(errors,[]);
  results.push({...item,status:'passed',cards,slider:field,application});await context.close();
 }
 fs.writeFileSync(root+'/docs/appearance-input-checks.json',JSON.stringify({date:new Date().toISOString().slice(0,10),method:'DOM/Canvas/HTTP fixtures; no screenshots',results},null,2)+'\n');console.log(JSON.stringify({status:'passed',cases:results.length,checks:'nine colored cards without opaque black mask, range track/progress, 44px native range, keyboard change/persistence, no focus ring; RTL/150%'}));
}finally{await browser.close();}
