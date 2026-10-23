import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {browser, setup} from './fixture.mjs';
try {
 for (const item of [{width:320,language:'tr',theme:'light'},{width:390,language:'en',theme:'dark'},{width:820,language:'ar',theme:'dark',large:true},{width:1440,language:'en',theme:'light'}]) {
  const {page,context,errors}=await setup(item);
  await page.goto('http://localhost:5173/settings');
  const first=page.locator('.cv-settings-page .cv-grouped-list').first();
  await first.scrollIntoViewIfNeeded();
  const row=first.locator(':scope > .cv-list-row').first();
  const bounds=await first.boundingBox();
  const x=bounds.x+bounds.width/2,y=bounds.y+2;
  assert(await row.evaluate((el,{x,y})=>el.contains(document.elementFromPoint(x,y)),{x,y}),'top edge belongs to first row');
  await page.mouse.move(x,y);
  const hover=await row.evaluate(el=>{const probe=document.createElement('span');probe.style.background='var(--cv-list-hover)';el.append(probe);const expected=getComputedStyle(probe).backgroundColor;probe.remove();return {actual:getComputedStyle(el).backgroundColor,expected}});
  await expect(row).toHaveCSS('background-color',hover.expected);
  await page.mouse.click(x,y);
  await page.waitForURL('**/settings/appearance');
  await page.goto('http://localhost:5173/settings');
  const toggle=page.locator('.cv-settings-page button.cv-list-row[role="switch"]').first();
  await toggle.scrollIntoViewIfNeeded();
  const before=await toggle.getAttribute('aria-checked');
  await toggle.click({position:{x:12,y:3}});
  assert.notEqual(await toggle.getAttribute('aria-checked'),before,'whole row toggles');
  await toggle.focus();
  await page.keyboard.press('Space');
  assert.equal(await toggle.getAttribute('aria-checked'),before,'keyboard toggles once');
  const active=page.locator('.cv-settings-page .cv-switch[data-checked="true"]').first();
  assert(await active.count(),'fixture has enabled switch');
  const colors=await active.evaluate(el=>{const probe=document.createElement('span');probe.style.background='var(--color-brand)';el.append(probe);const expected=getComputedStyle(probe).backgroundColor;probe.remove();return {actual:getComputedStyle(el).backgroundColor,expected}});
  await expect(active).toHaveCSS('background-color',colors.expected);
  assert.deepEqual(errors,[]);
  await context.close();
 }
 console.log('Settings list edge hit targets, hover, row toggles, keyboard and accent-colored switches passed at four widths/locales.');
} finally {await browser.close()}
