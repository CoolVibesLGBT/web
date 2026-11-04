import fs from 'node:fs'
import assert from 'node:assert/strict'
import { browser, root, setup } from './fixture.mjs'
const results = []
try {
 for (const item of [{width:320,language:'tr',theme:'light'}, {width:390,language:'en',theme:'dark'}, {width:820,language:'ar',theme:'light',large:true}, {width:1440,language:'en',theme:'light'}]) {
  const {page,context,user,errors} = await setup(item)
  await page.emulateMedia({reducedMotion:'no-preference'})
  const preview = await page.evaluate(async () => {
   const {createViewOncePreview} = await import('/src/features/chat/viewOncePreview.ts')
   const blob = await (await fetch('/images/brand/dott-v3/icon-128.png')).blob()
   return createViewOncePreview(new File([blob],'photo.png',{type:'image/png'}))
  })
  assert(preview.startsWith('data:image/jpeg;base64,'))
  const photo = fs.readFileSync(root+'/public/images/brand/dott-v3/icon-128.png').toString('base64')
  const outgoing='11111111-1111-4111-8111-111111111111', incoming='22222222-2222-4222-8222-222222222222'
  let requests = [], sentPreview, denyOnce = item.width === 390
  const messages = [outgoing,incoming].map((id,i)=>({id,author_id:i?incoming:user.id,content:null,view_once:true,view_once_preview:preview,created_at:new Date().toISOString()}))
  await page.route('http://localhost:4001/**',async route=>{
   const body=route.request().postData()||''
   const action=new URL(route.request().url()).searchParams.get('action')??body.match(/name="action"\r\n\r\n([^\r]+)/)?.[1]
   if(action==='chat.fetch_messages') return route.fulfill({json:{success:true,data:{messages}}})
   if(action==='chat.message.open') {
    const id=body.match(/name="message_id"\r\n\r\n([^\r]+)/)?.[1]
    requests.push(id)
    if(denyOnce && id===outgoing) { denyOnce=false; return route.fulfill({status:403,json:{success:false}}) }
    return route.fulfill(item.width===320&&id===incoming?{status:410,json:{success:false}}:{json:{success:true,data:{message:messages.find(m=>m.id===id),media:{mime_type:'image/png',data_base64:photo}}}})
   }
   if(action==='chat.send_message') {
    const extras=body.match(/name="extras"\r\n\r\n([^\r]+)/)?.[1]
    sentPreview=JSON.parse(extras||'{}').view_once_preview
    return route.fulfill({json:{success:true,data:{id:'33333333-3333-4333-8333-333333333333'}}})
   }
   return route.fallback()
  })
  await page.goto('http://localhost:5173/messages')
  await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click()
  const mine=page.locator(`[data-view-once-message="${outgoing}"]`)
  await mine.waitFor()
  for (let attempt=0;attempt<5;attempt++) { try { await mine.scrollIntoViewIfNeeded(); break } catch(error) { if(attempt===4) throw error; await page.waitForTimeout(150) } }
  await mine.locator('canvas[data-renderer="webgl"][data-motion="running"]').waitFor()
  const metrics=await mine.evaluate(async element=>{
   const image=element.querySelector('img');await image.decode()
   const box=element.getBoundingClientRect()
   return {width:box.width,left:box.left,right:box.right,blur:getComputedStyle(image).filter,previewWidth:image.naturalWidth,previewHeight:image.naturalHeight,textVisible:getComputedStyle(element.querySelector('.cv-view-once-copy')).clipPath,border:getComputedStyle(element).borderWidth}
  })
  assert(metrics.previewWidth<=12&&metrics.previewHeight<=12)
  assert(metrics.blur.includes('blur('));assert.equal(metrics.border,'0px')
  assert(metrics.left>=0&&metrics.right<=item.width+1)
  assert.equal(await mine.locator('img:not([src^="data:image/jpeg;base64,"])').count(),0)
  await page.emulateMedia({reducedMotion:'reduce'})
  await mine.locator('canvas[data-motion="paused"]').waitFor()
  await page.emulateMedia({reducedMotion:'no-preference'})
  await mine.locator('canvas[data-motion="running"]').waitFor()
  if(item.width===390) {
   await mine.click();await page.locator(`[data-view-once-message="${outgoing}"][data-view-once-state="retry"]`).waitFor()
   assert.equal(await mine.evaluate(el=>el.tagName),'BUTTON')
  }
  await mine.focus();await page.keyboard.press('Enter')
  await page.locator(`[data-view-once-message="${outgoing}"][data-view-once-state="revealed"] img`).waitFor()
  assert.equal(await page.locator('[role="dialog"][aria-modal="true"]').count(),0,'first click reveals inline, no modal')
  for(let i=0;i<2;i++) {
   await mine.click()
   const viewer=page.locator('[role="dialog"][aria-modal="true"]')
   await viewer.locator('img').waitFor()
   assert.equal(await viewer.evaluate(el=>el.matches(':modal')),true)
   const viewerStyle=await viewer.evaluate(el=>({border:getComputedStyle(el).borderWidth,shadow:getComputedStyle(el.querySelector('img')).boxShadow}))
   assert.equal(viewerStyle.border,'0px');assert.equal(viewerStyle.shadow,'none')
   await page.keyboard.press('Tab')
   assert.equal(await viewer.evaluate(el=>el.contains(document.activeElement)),true)
   await page.keyboard.press('Escape');await viewer.waitFor({state:'hidden'})
   assert.equal(await mine.getAttribute('data-view-once-state'),'revealed')
  }
  const other=page.locator(`[data-view-once-message="${incoming}"]`)
  await other.click()
  if(item.width!==320) {
   await page.locator(`[data-view-once-message="${incoming}"][data-view-once-state="revealed"] img`).waitFor()
   assert.equal(await page.locator('[role="dialog"][aria-modal="true"]').count(),0,'recipient first click stays inline')
   await other.click()
   const viewer=page.locator('[role="dialog"][aria-modal="true"]');await viewer.locator('img').waitFor();await page.keyboard.press('Escape')
   assert.equal(await other.getAttribute('data-view-once-state'),'revealed')
   // Opening another message ends this temporary inline view, without another recipient request.
   await mine.click()
   await page.locator(`[data-view-once-message="${outgoing}"][data-view-once-state="revealed"]`).waitFor()
  }
  await page.locator(`[data-view-once-message="${incoming}"][data-view-once-state="${item.width===320?'error':'viewed'}"]`).waitFor()
  assert.equal(await other.locator('canvas').count(),0)
  assert.equal(await other.evaluate(el=>el.tagName),'DIV')
  assert.equal(requests.filter(id=>id===incoming).length,1)
  assert.equal(requests.filter(id=>id===outgoing).length,item.width===320?1:item.width===390?3:2)
  const photoInput = page.locator('input[type="file"][accept="image/*"]').first()
  await photoInput.setInputFiles([root+'/public/images/brand/dott-v3/icon-128.png', root+'/public/images/brand/dott-v3/icon-192.png'])
  const composer = page.locator('dialog.cv-media-send-dialog[open]')
  await composer.waitFor()
  assert.equal(await composer.locator('.cv-media-send-item').count(),2)
  assert.equal(await composer.locator('.cv-media-send-toggle').count(),0)
  await composer.locator('.cv-media-send-remove').last().click()
  await composer.locator('.cv-media-send-menu-toggle').click()
  await composer.locator('.cv-media-send-toggle').click()
  await composer.locator('.cv-view-once-dust[data-renderer="webgl"]').waitFor()
  const dialogBox = await composer.boundingBox()
  assert(dialogBox.x>=0&&dialogBox.x+dialogBox.width<=item.width+1)
  const submitBox = await composer.locator('.cv-media-send-submit').boundingBox()
  assert(submitBox.height>=44&&submitBox.y+submitBox.height<=900)
  const captionGeometry=await composer.evaluate(el=>{
   const field=el.querySelector('textarea'),send=el.querySelector('.cv-media-send-submit'),surface=el.querySelector('.cv-media-send-controls')
   const a=field.getBoundingClientRect(),b=send.getBoundingClientRect()
   return {fieldWidth:a.width,surfaceWidth:surface.getBoundingClientRect().width,bodyWidth:el.querySelector('.cv-sheet-body').clientWidth,border:getComputedStyle(field).borderWidth,shadow:getComputedStyle(surface).boxShadow,sameRow:b.top<a.bottom&&b.bottom>a.top,contained:surface.contains(send)}
  })
  assert(captionGeometry.fieldWidth>100, 'caption must remain wide enough to type')
  assert(Math.abs(captionGeometry.surfaceWidth-(captionGeometry.bodyWidth-32*(item.large?1.5:1)))<3, 'caption fills the same width as the media')
  assert.equal(captionGeometry.border,'0px');assert(captionGeometry.sameRow&&captionGeometry.contained)
  await composer.locator('textarea').fill('Photo caption')
  await page.keyboard.press('Escape')
  await composer.waitFor({state:'hidden'})
  assert.equal(await page.locator('.cv-chat-compose-field textarea').inputValue(),'Photo caption')
  await page.locator('.cv-chat-compose-field textarea').fill('')
  if(item.width===1440) {
   await page.locator('.cv-chat-attach').click()
   const chooser=page.waitForEvent('filechooser')
   await page.locator('.cv-attachment-menu:popover-open').getByRole('switch').click()
   await(await chooser).setFiles(root+'/public/images/brand/dott-v3/icon-128.png')
   await page.locator('.cv-media-send-submit').click()
   const sent=page.locator('[data-view-once-message="33333333-3333-4333-8333-333333333333"]')
   await sent.waitFor();assert(sentPreview?.startsWith('data:image/jpeg;base64,'))
   await sent.locator('img.cv-view-once-preview').waitFor()
  }
  assert.deepEqual(errors,[])
  results.push({...item,metrics,status:'passed',checks:['original particle shader initializes','tiny photo preview + blur','reduced motion pause/resume','first click reveals inline; second opens modal; repeated modal does not repeat API consumption','recipient consumed/error hides media','native 44px+ target and horizontal containment','photo composer album/removal, once preview, caption and Escape']})
  await context.close()
 }
 fs.writeFileSync(root+'/docs/view-once-spoiler-checks.json',JSON.stringify({date:'2026-10-23',method:'DOM/canvas/API fixtures; no screenshots; live service and real devices unverified',results},null,2)+'\n')
 console.log('View-once spoiler: four responsive/locale fixtures passed.')
} finally {await browser.close()}
