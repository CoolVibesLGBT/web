import assert from 'node:assert/strict'
import fs from 'node:fs'
import { browser, root, setup } from './fixture.mjs'
try {
 for (const item of [{width:390,language:'tr',theme:'light'},{width:820,language:'ar',theme:'dark',large:true},{width:1440,language:'en',theme:'light'}]) {
  const {page,context,user,errors}=await setup(item)
  let blocked=true
  const pending=[]
  await page.route('http://localhost:4001/**',async route=>{
   const request=route.request()
   if(new URL(request.url()).pathname.startsWith('/static/uploads/scroll-')) {
    if(blocked) await new Promise(resolve=>pending.push(resolve))
    return route.fulfill({contentType:'image/png',body:fs.readFileSync(root+'/public/images/brand/dott-v3/icon-128.png')}).catch(()=>{})
   }
   if(request.postData()?.includes('chat.fetch_messages')) return route.fulfill({json:{success:true,data:{messages:Array.from({length:70},(_,i)=>({id:'scroll-'+i,author_id:user.id,created_at:new Date().toISOString(),attachments:[{id:'media-'+i,file:{url:`http://localhost:4001/static/uploads/scroll-${i}.png`,name:'photo.png',mime_type:'image/png',...(i%2?{width:800,height:1200}:{})}}]}))}}})
   return route.fallback()
  })
  await page.goto('http://localhost:5173/messages')
  await page.locator('.cv-chat-row-main').filter({hasText:'Theme Friend'}).click()
  const scroller=page.locator('[data-virtuoso-scroller="true"]').filter({has:page.locator('.cv-chat-message-row')})
  await page.locator('.cv-chat-media-thumb').first().waitFor()
  await scroller.hover()
  await page.mouse.wheel(0,-700)
  await page.waitForTimeout(300)
  const snapshot=()=>scroller.evaluate(el=>({top:el.scrollTop,rows:[...el.querySelectorAll('[data-message-id]')].map(row=>({id:row.dataset.messageId,height:row.getBoundingClientRect().height,top:row.getBoundingClientRect().top}))}))
  const before=await snapshot()
  assert(before.rows.every(row=>row.height>100),'pending photos reserve height')
  blocked=false;pending.splice(0).forEach(resolve=>resolve())
  await page.waitForTimeout(600)
  const after=await snapshot()
  for(const row of before.rows) {
   const current=after.rows.find(other=>other.id===row.id)
   if(current) assert(Math.abs(current.height-row.height)<1,'photo decode cannot resize a row')
  }
  assert(Math.abs(after.top-before.top)<2,'loading photos cannot move scroll position')
  for(const delta of [-1300,900,-600,1400]) {await page.mouse.wheel(0,delta);await page.waitForTimeout(150)}
  await page.waitForTimeout(300)
  const settled=await snapshot()
  await page.waitForTimeout(350)
  assert(Math.abs((await snapshot()).top-settled.top)<2,'scroll stays settled after fast direction changes')
  assert.deepEqual(errors,[])
  await context.close()
 }
 console.log('Chat media scroll: delayed photos keep row height and scroll position stable; rapid scroll reversals passed at phone/tablet/desktop (API fixtures).')
} finally {await browser.close()}
