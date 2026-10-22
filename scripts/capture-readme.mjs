// Explicit documentation-only capture. Fictional local fixtures; no live account writes.
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { browser, root, setup } from './telegram-ui/fixture.mjs'

const out = path.join(root, 'docs/assets/screenshots')
fs.mkdirSync(out, { recursive: true })
const evidence = []
const stamp = '2026-10-22T12:00:00.000Z'
async function capture(page, file, label) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].filter(i => i.complete && i.naturalWidth).map(i => i.decode().catch(() => {})))
  })
  await page.screenshot({ path: path.join(out, file), animations: 'disabled', type: 'png' })
  evidence.push({ file, label, path: new URL(page.url()).pathname, viewport: page.viewportSize(), mode: 'isolated fictional fixtures; external network blocked' })
}
try {
  const fixture = await setup({ width: 1440, language: 'en', theme: 'light' })
  const { page, context, user } = fixture
  Object.assign(user, { username: 'alex_demo', displayname: 'Alex Rivera · Demo', bio: { en: 'Fictional demo profile. Coffee, photography and community walks.' }, location: { display: 'Demo City' }, website: '', email: 'alex@example.invalid', cover: {file:{url:'http://localhost:5173/images/landing/hero-en.avif'}}, avatar: {file:{url:'http://localhost:5173/images/brand/dott-v3/icon-128.png'}} })
  const peer = { ...user, id: '22222222-2222-4222-8222-222222222222', public_id: '9007199254742000', username: 'deniz_demo', displayname: 'Deniz Kaya · Demo' }
  const post = { id:'11111111-1111-4111-8111-111111111111',public_id:'2113015734824079360',author_id:peer.id,author:peer,content:{en:'A little color, a little courage, a new connection. What is your favorite place to meet friends?\n\nFictional demo post for the CoolVibes documentation.'},post_kind:'post',created_at:stamp,updated_at:stamp,deleted_at:null,children:[],attachments:[{id:'demo-photo',processing_status:'ready',file:{url:'http://localhost:5173/images/brand/dott-v3/og-1200x630.jpg',mime_type:'image/jpeg',name:'community.jpg'}}],engagements:{counts:{like_received_count:12,comment_count:3,view_count:48},engagement_details:[]}}
  post.attachments.push({ ...post.attachments[0], id: 'demo-photo-2', file: { ...post.attachments[0].file, url: 'http://localhost:5173/images/landing/hero-en.avif', name: 'community-walk.avif', mime_type: 'image/avif' } })
  post.content.en = JSON.stringify({ root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children: [{ type: 'paragraph', version: 1, direction: null, format: '', indent: 0, children: [{ type: 'text', version: 1, text: post.content.en, detail: 0, format: 0, mode: 'normal', style: '' }] }] } })
  await page.route('http://localhost:4001/**',async route=>{
    const body=route.request().postData()||''
    const action=new URL(route.request().url()).searchParams.get('action')??body.match(/name="action"\r\n\r\n([^\r]+)/)?.[1]
    const ok=data=>route.fulfill({json:{success:true,data}})
    if(action==='post.timeline')return ok({posts:[post],cursor:null})
    if(action==='post.fetch')return ok(post)
    if(action==='chat.fetch_chats')return ok({chats:[{id:'11111111-1111-4111-8111-111111111111',type:'private',participants:[{user_id:user.id,user},{user_id:peer.id,user:peer}],last_message:{id:'demo-1',content:{en:'Shall we plan a community photo walk?'},created_at:stamp}}]})
    if(action==='chat.fetch_messages')return ok({messages:[{id:'demo-1',author_id:peer.id,content:'Hi Alex! Shall we plan a community photo walk?',created_at:stamp},{id:'demo-2',author_id:user.id,content:'Absolutely. Coffee by the waterfront first?',created_at:stamp},{id:'demo-3',author_id:peer.id,content:'Sounds lovely! This conversation uses fictional demo data.',created_at:stamp}]})
    return route.fallback()
  })
  await page.evaluate(() => localStorage.setItem('appSettings', JSON.stringify({ blurPhotos: false })))
  await page.goto('http://localhost:5173/?tab=flows')
  await page.locator('.cv-feed-post .cv-post').first().waitFor()
  await page.getByText('A little color, a little courage, a new connection.', { exact: false }).first().waitFor()
  await page.locator('.cv-feed-post img').evaluateAll(async imgs => { await Promise.all(imgs.map(i => i.decode().catch(() => {}))) })
  await capture(page,'feed-en.png','English feed with fictional profiles and a local sample post')
  await page.goto('http://localhost:5173/messages')
  await page.locator('.cv-chat-row-main').filter({hasText:'Deniz Kaya'}).click()
  await page.getByText('Sounds lovely! This conversation uses fictional demo data.',{exact:true}).waitFor()
  await capture(page,'messages-en.png','English messages with fictional conversation')
  await page.goto('http://localhost:5173/settings/appearance')
  await page.locator('.cv-appearance-preview').waitFor()
  await capture(page,'appearance-en.png','Appearance themes and chat preview')
  await page.setViewportSize({width:390,height:844})
  await page.goto('http://localhost:5173/profile')
  await page.locator('.cv-profile-name h1').waitFor()
  await capture(page,'profile-mobile-en.png','Mobile fictional Alex Rivera profile')
  await context.close()
  for (const language of ['en','zh','ja','ar','tr','hi','ne','km','id']) {
    const f=await setup({width:1440,language,theme:'light'})
    await f.page.route('http://localhost:4001/**', async route => {
      const body = route.request().postData() || '';
      if (body.includes('auth.user_info') || route.request().url().includes('auth.user_info')) return route.fulfill({ status: 401, json: { success: false } });
      return route.fallback();
    });
    await f.page.addInitScript(() => localStorage.removeItem('authToken'))
    await f.page.evaluate(()=>{localStorage.removeItem('authToken')})
    await f.page.goto('http://localhost:5173/landing')
    const hero=f.page.locator('.cv-landing-hero-image')
    await hero.waitFor()
    await hero.evaluate(i=>i.decode())
    const expected=language==='tr'?'istanbul-hero':`hero-${language}`
    assert((await hero.getAttribute('src')).includes(expected))
    await capture(f.page,`landing-${language}.png`,`${language} landing with locale-specific hero artwork`)
    if(language==='en'){
      await f.page.goto('http://localhost:5173/brandkit')
      await f.page.locator('.cv-brandkit-hero img').waitFor()
      await capture(f.page,'brandkit-en.png','Selected dott-v3 brandkit')
    }
    if(language==='ne'||language==='km'){
      await f.page.locator('.cv-public-login').click()
      await f.page.locator('dialog[open]').waitFor()
      await capture(f.page,`auth-${language}.png`,`${language} login/register choices`)
    }
    await f.context.close()
  }
  fs.writeFileSync(path.join(out,'capture-manifest.json'),JSON.stringify({authorization:'User explicitly requested README screenshots, overriding the earlier no-screenshot instruction for this documentation task.',backend:'Playwright route fixtures only. No database records or real accounts created.',captures:evidence},null,2)+'\n')
  console.log(`Saved ${evidence.length} documentation screenshots.`)
} finally { await browser.close() }
