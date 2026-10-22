import assert from 'node:assert/strict'
import fs from 'node:fs'
import { browser, root, setup } from './fixture.mjs'
try {
 for (const item of [{width:320,language:'tr',theme:'light'},{width:390,language:'en',theme:'dark'},{width:820,language:'ar',theme:'light',large:true},{width:1440,language:'en',theme:'light'}]) {
  const {page,context,user,errors}=await setup(item)
  const requests=[]
  await page.route('http://localhost:4001/**',async route=>{
   const request=route.request(), url=new URL(request.url())
   if(url.pathname.startsWith('/static/uploads/')) {
    const authorization=request.headers().authorization
    requests.push({path:url.pathname,authorization})
    return authorization==='Bearer profile-redesign-fixture'
     ? route.fulfill({contentType:'image/png',body:fs.readFileSync(root+'/public/images/brand/dott-v3/icon-128.png')})
     : route.fulfill({status:404})
   }
   if(request.postData()?.includes('chat.fetch_messages')) return route.fulfill({json:{success:true,data:{messages:[...['Hi','A longer message that wraps across lines without colliding with its timestamp.','سطر عربي\nSecond line'].map((content,index)=>({id:'text-'+index,author_id:user.id,content,created_at:new Date().toISOString()})),{id:'protected-photo',author_id:user.id,created_at:new Date().toISOString(),attachments:[{id:'attachment',file:{name:'private.png',mime_type:'image/png',url:'http://localhost:4001/static/uploads/private-original.png',variants:{image:{original:{url:'http://localhost:4001/static/uploads/private-original.png'},medium:{url:'http://localhost:4001/static/uploads/private-medium.webp'}}}}}]}]}}})
   return route.fallback()
  })
  await page.goto('http://localhost:5173/messages')
  await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click()
  const textBubble=page.locator('[data-message-id="text-0"] .cv-chat-bubble')
  await textBubble.waitFor()
  const textGeometry=await textBubble.evaluate(bubble=>{
   const spacer=bubble.querySelector('.cv-message-time-space').getBoundingClientRect()
   const time=bubble.querySelector('.cv-chat-time').getBoundingClientRect()
   const rect=bubble.getBoundingClientRect()
   return {spacer:spacer.width,time:time.width,left:rect.left,right:rect.right,radius:getComputedStyle(bubble).borderStartEndRadius}
  })
  assert(textGeometry.spacer>=textGeometry.time+7)
  assert(textGeometry.left>=0&&textGeometry.right<=item.width)
  assert.equal(textGeometry.radius,'15px')
  const thumbnail=page.locator('.cv-chat-media-thumb img')
  await thumbnail.waitFor()
  await thumbnail.evaluate(image=>image.decode())
  assert((await thumbnail.getAttribute('src')).startsWith('blob:'))
  const geometry=await thumbnail.evaluate(image=>{
   const bubble=image.closest('.cv-chat-bubble'),grid=image.closest('.cv-chat-media-grid'),time=bubble.querySelector('.cv-chat-time')
   const b=bubble.getBoundingClientRect(),g=grid.getBoundingClientRect(),t=time.getBoundingClientRect()
   return {width:b.width,gridWidth:g.width,left:b.left,right:b.right,bottom:b.bottom,timeBottom:t.bottom,padding:getComputedStyle(bubble).padding,border:getComputedStyle(bubble).borderWidth,radius:getComputedStyle(bubble).borderBottomLeftRadius}
  })
  assert(geometry.width>200&&geometry.width<=420)
  assert(Math.abs(geometry.width-geometry.gridWidth)<1)
  assert(geometry.left>=0&&geometry.right<=item.width)
  assert.equal(geometry.padding,'0px')
  assert.equal(geometry.border,'0px')
  assert.equal(geometry.radius,'15px')
  assert(geometry.timeBottom<=geometry.bottom)
  for(let i=0;i<2;i++) {
   await thumbnail.click()
   const viewer=page.locator('dialog.cv-chat-media-viewer[open]')
   await viewer.locator('img').waitFor()
   await viewer.locator('img').evaluate(image=>image.decode())
   await page.keyboard.press('Escape')
   await viewer.waitFor({state:'hidden'})
   await thumbnail.evaluate(image=>image.decode())
  }
  assert(requests.some(r=>r.path.endsWith('private-original.png')))
  assert(requests.some(r=>r.path.endsWith('private-medium.webp')))
  assert(requests.every(r=>r.authorization==='Bearer profile-redesign-fixture'))
  assert.deepEqual(errors,[])
  await context.close()
 }
 console.log('Protected chat photo: authenticated thumbnail and original, repeat open/close passed at four widths/locales; intercepted API fixture.')
} finally {await browser.close()}
