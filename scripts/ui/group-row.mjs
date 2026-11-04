import assert from 'node:assert/strict';
import fs from 'node:fs';
import {browser,root,setup} from './fixture.mjs';
const results=[];
try {
 for(const item of [{width:320,language:'tr',theme:'light'},{width:390,language:'en',theme:'dark'},{width:820,language:'ar',theme:'dark',large:true},{width:1440,language:'en',theme:'light'}]) {
  const {page,context,errors}=await setup(item);await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('http://localhost:5173/messages');await page.locator('.cv-chat-sidebar-header button:has(svg.cv-telegram-icon)').click();const group=page.locator('.cv-group-composer'),row=group.getByRole('switch',{name:'Theme Friend',exact:true});await row.waitFor();
  assert.equal(await row.evaluate(e=>e.tagName),'BUTTON');assert.equal(await row.locator('button,input,[role=switch]').count(),0,'one accessible action; no nested switch/button');const visual=row.locator('.cv-switch-indicator');assert.equal(await visual.getAttribute('aria-hidden'),'true');
  const indicator=await visual.boundingBox();await page.mouse.move(indicator.x+indicator.width/2,indicator.y+indicator.height/2);await page.waitForTimeout(170);
  const hover=await row.evaluate(e=>{const n=document.createElement('span');n.style.color='var(--cv-list-hover)';e.append(n);const expected=getComputedStyle(n).color;n.remove();return {actual:getComputedStyle(e).backgroundColor,expected};});assert.equal(hover.actual,hover.expected,'switch region shares full-row theme hover');
  await page.mouse.down();let layer=row.locator(':scope > .cv-ripple');await layer.waitFor();let bounds=await row.boundingBox(),ripple=await layer.boundingBox();assert(Math.abs(ripple.width-bounds.width)<1&&Math.abs(ripple.height-bounds.height)<1,'ripple covers avatar/text/switch as one card');assert.equal(await visual.locator('.cv-ripple').count(),0);await page.mouse.up();await page.waitForFunction(()=>document.querySelector('.cv-group-peer-row')?.getAttribute('aria-checked')==='true');assert.equal(await group.locator('.cv-group-chips button').count(),1,'indicator click toggles once');await layer.waitFor({state:'hidden'});
  await row.locator('.cv-group-peer-avatar').click();assert.equal(await row.getAttribute('aria-checked'),'false');await page.waitForTimeout(800);
  await row.focus();await page.keyboard.press('Space');assert.equal(await row.getAttribute('aria-checked'),'true');await page.waitForTimeout(800);await page.keyboard.press('Enter');assert.equal(await row.getAttribute('aria-checked'),'false');await page.waitForTimeout(800);
  await page.emulateMedia({reducedMotion:'reduce'});await visual.click({force:true});assert.equal(await row.getAttribute('aria-checked'),'true');assert.equal(await row.locator('.cv-ripple').count(),0,'reduced motion preserves selection without animation');
  assert.deepEqual(errors,[]);results.push({...item,status:'passed',hover,checks:['single native button with switch semantics','one theme hover across avatar/name/switch','pointer ripple fills entire row and stays clipped after selection rerender','indicator/avatar/Space/Enter toggle once','visual indicator is not a second focus target','reduced motion keeps selection functional']});console.log(item.width,item.language,'unified group row passed');await context.close();
 }
 fs.writeFileSync(root+'/docs/group-row-interaction-checks.json',JSON.stringify({date:new Date().toISOString().slice(0,10),method:'DOM/pointer/keyboard fixtures; no screenshots or real group creation',results},null,2)+'\n');
}finally{await browser.close();}
