import assert from 'node:assert/strict'
import { browser, setup } from './fixture.mjs'
try {
 let count=0
 for (const item of [{width:320,language:'tr',theme:'light',mode:'day'},{width:390,language:'en',theme:'dark',mode:'night'},{width:820,language:'ar',theme:'dark',mode:'tinted',large:true},{width:1440,language:'en',theme:'light',mode:'light'}]) {
  const {page,context,errors}=await setup(item)
  await page.goto('http://localhost:5173/settings/appearance')
  await page.locator(`input[value="${item.mode}"]`).check()
  const presets=await page.evaluate(async base=>{const {PRESETS,resolveTheme}=await import('/src/features/appearance/model.ts');return PRESETS[base].map(p=>({id:p.id,accent:p.accent_color,expected:resolveTheme(base,{preset:p.id})}))},item.mode)
  for(let index=0;index<presets.length;index++) {
   const preset=presets[index]
   const button=page.locator(`[data-preset="${preset.id}"]`)
   await button.click()
   assert.equal(await button.getAttribute('aria-pressed'),'true')
   const actual=await page.evaluate(()=>({accent:getComputedStyle(document.documentElement).getPropertyValue('--color-brand').trim(),fill:getComputedStyle(document.documentElement).getPropertyValue('--cv-chat-outgoing-background').trim()}))
   assert.equal(actual.fill,preset.expected.outgoingBackground)
   const displayed=await button.locator('span').evaluate(el=>getComputedStyle(el).backgroundColor)
   const applied=await page.evaluate(()=>{const probe=document.createElement('span');probe.style.color='var(--color-brand)';document.body.append(probe);const color=getComputedStyle(probe).color;probe.remove();return color})
   assert.equal(displayed,applied,'displayed accent must equal applied accent')
   const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('cv.appearance.v1')))
   assert.equal(stored.themes[item.mode].preset,preset.id)
   assert.equal(stored.themes[item.mode].messages,undefined)
   if([10,12].includes(preset.id)) {
    const hue=await page.evaluate(async color=>{const {hexToRgb,rgbToHsv}=await import('/src/features/appearance/telegram-colors.ts');return rgbToHsv(...hexToRgb(color))[0]},preset.expected.outgoing)
    assert(preset.id===10? hue>170&&hue<260:hue>70&&hue<165,`${item.mode}: blue/green bubble stays blue/green`)
   }
   count++
  }
  const reset=page.locator('[data-preset="default"]')
  assert.equal(await page.locator('.cv-appearance-colors button').first().getAttribute('data-preset'),'default')
  await reset.click()
  assert.equal(await reset.getAttribute('aria-pressed'),'true')
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cv.appearance.v1')).themes).then(themes=>themes[item.mode].preset),null)
  // End on regular blue, then verify the actual conversation and persisted selection.
  const blue=presets.findIndex(p=>p.id===10)
  await page.locator('[data-preset="10"]').click()
  await page.reload()
  assert.equal(await page.locator('[data-preset="10"]').getAttribute('aria-pressed'),'true')
  await page.goto('http://localhost:5173/messages')
  await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click()
  const bubble=page.locator('.cv-chat-bubble[data-side="outgoing"][data-has-text="true"]').first()
  await bubble.waitFor()
  const result=await bubble.evaluate((el,fill)=>{const probe=document.createElement('span');probe.style.background=fill;document.body.append(probe);const expected=getComputedStyle(probe).backgroundImage;const expectedColor=getComputedStyle(probe).backgroundColor;probe.remove();return {fill:getComputedStyle(el).backgroundImage,color:getComputedStyle(el).backgroundColor,expected,expectedColor}},presets[blue].expected.outgoingBackground)
  assert.equal(result.fill,result.expected)
  assert.equal(result.color,result.expectedColor)
  assert.deepEqual(errors,[])
  await context.close()
 }
 console.log(`Preset selection: ${count} options applied correctly; blue/green hue, reload and actual chat checked across four bases/locales.`)
} finally {await browser.close()}
