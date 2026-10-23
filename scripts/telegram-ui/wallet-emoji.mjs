import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browser, root, setup } from './fixture.mjs';
try {
 for (const item of [{width:320,language:'tr',theme:'light'},{width:390,language:'en',theme:'dark'},{width:820,language:'ar',theme:'dark',large:true},{width:1440,language:'tr',theme:'light'}]) {
  const {context,page,errors}=await setup(item);
  const locale=JSON.parse(fs.readFileSync(`${root}/src/locales/${item.language}/common.json`));
  await page.goto('http://localhost:5173/wallet');
  const actions=page.locator('.cv-wallet-actions'); await actions.waitFor();
  await actions.getByRole('button',{name:locale.wallet.deposit,exact:true}).click();
  const sheet=page.locator('dialog.cv-wallet-dialog[open]');await sheet.waitFor();
  assert.equal(await sheet.evaluate(el=>el.matches(':modal')),true);
  assert.equal(await sheet.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await page.keyboard.press('Escape');await sheet.waitFor({state:'hidden'});
  await actions.getByRole('button',{name:locale.wallet.withdraw,exact:true}).click();
  await sheet.waitFor();
  await sheet.getByText(locale.wallet.unavailable,{exact:true}).waitFor();
  assert.equal(await sheet.getByRole('button',{name:locale.wallet.confirm_withdraw,exact:true}).isDisabled(),true);
  assert.equal(await sheet.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await page.keyboard.press('Escape');
  await page.goto('http://localhost:5173/?tab=flows');
  const editor=page.locator('.lexical-editor[contenteditable="true"]').first();
  await editor.waitFor();await editor.fill('Before After');
  await editor.press('Home');await editor.press('ArrowRight');
  // Set a deterministic caret independently of platform Home-key behavior.
  await editor.evaluate(el=>{const text=el.querySelector('[data-lexical-text]')?.firstChild; const range=document.createRange();range.setStart(text,7);range.collapse(true);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);});
  await page.getByRole('button',{name:locale.post?.toolbar_emoji || 'Emoji',exact:true}).first().click();
  const picker=page.locator('.cv-emoticon-inline');await picker.waitFor();
  const emoji=picker.locator('.cv-emoji-art').first();await emoji.waitFor();
  const value=await emoji.textContent();await emoji.click();
  await picker.waitFor({state:'hidden'});
  await page.waitForFunction(value=>document.querySelector('.lexical-editor')?.textContent===`Before ${value}After`,value);
  assert.ok(await editor.locator('.cv-emoji-art').count());
  assert.equal((await editor.textContent()).includes('undefined'),false);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({width:item.width,language:item.language,wallet:true,sharedEmoji:true}));
  await context.close();
 }
} finally {await browser.close();}
