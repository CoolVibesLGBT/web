import assert from 'node:assert/strict'
import { browser, root, setup } from './fixture.mjs'
try {
 const {page,context,user,errors}=await setup({width:390,language:'tr',theme:'light'})
 let release, calls=0
 await page.route('http://localhost:4001/**', async route=>{
  const body=route.request().postData()||''
  if(!body.includes('chat.send_message')) return route.fallback()
  calls++
  assert(body.includes('name="images[]"; filename="icon-128.png"'))
  await new Promise(resolve=>{release=resolve})
  if(calls===1) return route.fulfill({status:500,json:{success:false}})
  return route.fulfill({json:{success:true,data:{message:{id:'uploaded-photo',author_id:user.id,attachments:[{id:'photo',file:{url:'http://localhost:5173/images/brand/dott-v3/icon-128.png',mime_type:'image/png'}}],created_at:new Date().toISOString()}}}})
 })
 await page.goto('http://localhost:5173/messages')
 await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click()
 await page.locator('input[type="file"][accept="image/*"]').first().setInputFiles(root+'/public/images/brand/dott-v3/icon-128.png')
 const modal=page.locator('dialog.cv-media-send-dialog[open]')
 await modal.locator('textarea').fill('Upload regression')
 await modal.locator('.cv-media-send-submit').click()
 await modal.locator('[role="status"]').waitFor()
 assert(await modal.locator('.cv-media-send-submit').isDisabled())
 await page.keyboard.press('Escape')
 assert(await modal.isVisible())
 while(!release) await page.waitForTimeout(20)
 release()
 await modal.locator('[role="alert"]').waitFor()
 assert.equal(await modal.locator('.cv-media-send-item').count(),1)
 assert.equal(await modal.locator('textarea').inputValue(),'Upload regression')
 release=null
 await modal.locator('.cv-media-send-submit').click()
 while(!release) await page.waitForTimeout(20)
 release()
 await modal.waitFor({state:'hidden'})
 assert.equal(calls,2)
 assert.deepEqual(errors,[])
 await context.close()
 console.log('Media upload: pending, Escape, failure retention, retry and success passed (API fixture).')
} finally { await browser.close() }
