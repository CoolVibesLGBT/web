import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)).replace(/\/$/,'');
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || (process.platform==='darwin'?'chrome':undefined)});
async function setup(item,{external=false,authenticated=true,privacy='public',premium=false}={}){
 const context=await browser.newContext({viewport:{width:item.width,height:900},colorScheme:item.theme,reducedMotion:'reduce'});
 await context.route('**/*',route=>{const url=new URL(route.request().url());return url.origin==='http://localhost:5173'?route.continue():route.abort();});
 const page=await context.newPage();
 page.setDefaultTimeout(15000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Lexical Error:'))errors.push(m.text());});
 await page.addInitScript(({language,authenticated,large})=>{
  localStorage.setItem('lang',language);
  if(authenticated)localStorage.setItem('authToken','profile-redesign-fixture');
  if(large){document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.fontSize='25.5px';});}
 },{language:item.language,authenticated,large:!!item.large});
 const name=item.long?(item.language==='ar'?'اسم طويل جداً للتحقق من محاذاة الملف الشخصي وعرض النص بالكامل':'VeryLongProfileNameWithoutAnySpacesToCheckWrappingAndAlignment'):'Profile Check';
 const user={id:'9007199254740993',public_id:'9007199254740993',username:item.long?'profilewithalongusernameforlayoutverification':'profilecheck',displayname:name,email:'profile@example.invalid',bio:{[item.language]:'Profile biography for layout verification.'},privacy_level:privacy,created_at:'2025-01-01T00:00:00Z',default_language:item.language,languages:[item.language],is_premium:premium,location:{display:'İstanbul, Türkiye'},website:'https://example.invalid/profilewithaverylongaddressforlayoutverification',engagements:{counts:{follower_count:1205,following_count:78,like_given_count:9,view_received_count:10}},avatar:{file:{url:'http://localhost:5173/icons/icon_512x512@2x.png'}},...(item.cover?{cover:{file:{url:'http://localhost:5173/images/auth/login-bear.avif'}}}:{})};
 const viewer=external?{...user,id:'999999999',public_id:'999999999',username:'viewer',privacy_level:'public'}:user;
 const calls=[];
 const photo={public_id:'9007199254740999',processing_status:'ready',file:{url:'http://localhost:4001/static/uploads/social-fixture.webp',mime_type:'image/png'}};
 const social={friend:null,grant:false,access:'none',failGrant:false,public:[{...photo,public_id:'9007199254740998'}],private:[photo],mutations:[],imageAuth:[],requests:[{request_id:'9007199254741000',viewer_id:'12345',status:'pending',viewer:{public_id:'12345',username:'requester',displayname:'Access Requester'}}]};
 const fixtureMessages=[{id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',author_id:'22222222-2222-4222-8222-222222222222',content:null,attachments:[{id:'900',file:{url:'http://localhost:5173/icons/icon_512x512@2x.png',mime_type:'image/png',name:'photo.png'}}],created_at:new Date().toISOString()},{id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',author_id:user.id,content:null,emoticon:{kind:'sticker',id:'505b5ae14b0e1be1',url:'/animations/telegram/stickers/505b5ae14b0e1be1.tgs',emoji:'👋'},created_at:new Date().toISOString()},{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',author_id:'22222222-2222-4222-8222-222222222222',content:'Incoming original',created_at:new Date().toISOString()},{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',author_id:user.id,content:'Outgoing original',created_at:new Date().toISOString()}];
 let pinned=null;
 const groupState={chat:null,created:[],fail:false,clear:[]}; const sent=[]; const targetMessages=[]; const forwardState={fail:false,requests:[]};
 await page.route('http://localhost:4002/**',route=>route.abort());
 await page.routeWebSocket('**/socket.io/**',socket=>socket.close());
 await page.route('http://localhost:4001/**',async route=>{
  const req=route.request();const body=req.postData()||'';
  const action=new URL(req.url()).searchParams.get('action')??body.match(/name="action"\r\n\r\n([^\r]+)/)?.[1];
  calls.push(action);
  const field=name=>body.match(new RegExp('name="'+name+'"\\r\\n\\r\\n([^\\r]*)'))?.[1]??'';
  if(new URL(req.url()).pathname==='/static/uploads/social-fixture.webp'){social.imageAuth.push(req.headers().authorization);await route.fulfill({body:fs.readFileSync(root+'/public/icons/icon_512x512@2x.png'),contentType:'image/png'});return;}
  if(action==='user.friend.status'){await route.fulfill({json:{success:true,data:{friendship:social.friend}}});return;}
  if(action==='user.friend.request'){social.friend={request_id:'9007199254741999',requester_id:viewer.id,recipient_id:user.id,status:'pending',user};social.mutations.push({action,id:field('user_id')});await route.fulfill({json:{success:true,data:{friendship:social.friend}}});return;}
  if(['user.friend.respond','user.friend.cancel','user.friend.remove'].includes(action)){social.mutations.push({action,id:field('request_id'),decision:field('decision')});social.friend={...social.friend,status:action==='user.friend.respond'?field('decision'):action==='user.friend.cancel'?'cancelled':'removed'};await route.fulfill({json:{success:true,data:{friendship:social.friend}}});return;}
  if(['user.friend.fetch','user.friend.requests'].includes(action)){const scope=field('scope');const data=social.friend&&((scope==='friends'&&social.friend.status==='accepted')||((scope==='incoming'||scope==='outgoing')&&social.friend.status==='pending'))?[social.friend]:[];await route.fulfill({json:{success:true,data:{friendships:data,cursor:null}}});return;}
  if(action==='user.private_photos.access.status'){await route.fulfill({json:{success:true,data:{access:{status:social.grant?'approved':'none'}}}});return;}
  if(['user.private_photos.access.grant','user.private_photos.access.revoke'].includes(action)){
    if(social.failGrant){social.failGrant=false;await route.fulfill({status:500,json:{success:false,error:'fixture'}});return;}
    social.mutations.push({action,id:field('viewer_id')});social.grant=action.endsWith('grant');const row=social.requests.find(row=>row.viewer_id===field('viewer_id'));if(row)row.status=social.grant?'approved':'denied';await route.fulfill({json:{success:true,data:{access:{status:social.grant?'approved':'denied'}}}});return;
  }
  if(action==='user.private_photos.fetch'){const allowed=!external||social.access==='approved';await route.fulfill({json:{success:true,data:{count:social.private.length,access:{status:external?social.access:'owner'},photos:allowed?social.private:[]}}});return;}
  if(action==='user.profile_photos.fetch'){await route.fulfill({json:{success:true,data:{count:social.public.length,photos:social.public}}});return;}
  if(action==='user.private_photos.access.request'){social.access='pending';social.mutations.push({action,id:field('owner_id')});await route.fulfill({json:{success:true,data:{access:{status:'pending'}}}});return;}
  if(action==='user.private_photos.access.requests'){await route.fulfill({json:{success:true,data:{requests:social.requests}}});return;}
  if(action==='user.private_photos.access.respond'){const row=social.requests.find(row=>row.request_id===field('request_id'));row.status=field('decision');social.mutations.push({action,id:field('request_id'),decision:field('decision')});await route.fulfill({json:{success:true,data:{access:{status:row.status}}}});return;}
  if(action==='user.photos.move'){const id=field('photo_id'),target=field('destination')==='private_photo'?'private':'public',source=target==='private'?'public':'private';const index=social[source].findIndex(photo=>photo.public_id===id);if(index>=0)social[target].push(...social[source].splice(index,1));social.mutations.push({action,id,destination:field('destination')});await route.fulfill({json:{success:true,data:{}}});return;}
  if(action==='user.private_photos.upload'){assert(body.includes('name="photos[]"'),'multipart photo file');const item={...photo,public_id:'9007199254740997'};social.private.push(item);social.mutations.push({action});await route.fulfill({json:{success:true,data:{photos:[item]}}});return;}
  if(action==='user.private_photos.delete'){social.private=social.private.filter(photo=>photo.public_id!==field('photo_id'));social.mutations.push({action,id:field('photo_id')});await route.fulfill({json:{success:true,data:{}}});return;}

  if(action==='chat.fetch_chats'){
    await route.fulfill({json:{success:true,data:{chats:[...(groupState.chat?[groupState.chat]:[]),{id:'33333333-3333-4333-8333-333333333333',type:'group',title:{en:'Forward Destination'},participants:[{user_id:user.id,user},{user_id:'22222222-2222-4222-8222-222222222222',user:{id:'22222222-2222-4222-8222-222222222222',username:'themefriend',displayname:'Theme Friend'}}],last_message:targetMessages.at(-1)}, {id:'11111111-1111-4111-8111-111111111111',type:'private',pinned_msg_id:pinned,participants:[{user_id:user.id,user},{user_id:'22222222-2222-4222-8222-222222222222',user:{id:'22222222-2222-4222-8222-222222222222',username:'themefriend',displayname:'Theme Friend'}}],last_message:{id:'message-in',content:{en:'Incoming fixture message'},created_at:new Date().toISOString()}}]}}});return;
  }
  if(['chat.edit_message','chat.pin_message','chat.unpin_message','chat.delete_message_for_user','chat.delete_message_for_all'].includes(action)) {
    const field=name=>body.match(new RegExp('name="'+name+'"\\r\\n\\r\\n([^\\r]*)'))?.[1]??'';
    const id=field('message_id');
    if(action==='chat.edit_message'){const item=fixtureMessages.find(m=>m.id===id);item.content=field('content');await route.fulfill({json:{success:true,data:{message:item}}});return;}
    if(action==='chat.pin_message')pinned=id;
    if(action==='chat.unpin_message')pinned=null;
    if(action.startsWith('chat.delete_message')){const index=fixtureMessages.findIndex(m=>m.id===id);if(index>=0)fixtureMessages.splice(index,1);}
    await route.fulfill({json:{success:true,data:{}}});return;
  }
  if(action==='chat.fetch_messages') {await route.fulfill({json:{success:true,data:{messages:body.includes('33333333-3333-4333-8333-333333333333')?targetMessages:fixtureMessages}}});return;}
  if(action==='search.user.lookup'){await route.fulfill({json:{success:true,data:{users:[{id:'9007199254740995',username:'newmember',displayname:'New Member'}]}}});return;}
  if(action==='chat.create'){
    const field=name=>body.match(new RegExp('name="'+name+'"\\r\\n\\r\\n([^\\r]*)'))?.[1]??'';
    const ids=[...body.matchAll(/name="participant_ids\[\]"\r\n\r\n([^\r]+)/g)].map(m=>m[1]);
    groupState.created.push({ids,title:field('title'),description:field('description'),type:field('type'),hasAvatar:body.includes('filename="group-avatar.jpg"'),visibility:field('visibility'),publicUsername:field('public_username')});
    if(groupState.fail){groupState.fail=false;await route.fulfill({status:500,json:{success:false,error:'fixture'}});return;}
    groupState.chat={id:'44444444-4444-4444-8444-444444444444',type:'group',creator_id:user.id,title:{en:field('title')},participants:[{user_id:user.id,user},...ids.map(id=>({user_id:id,user:{id,username:id==='9007199254740995'?'newmember':'themefriend',displayname:id==='9007199254740995'?'New Member':'Theme Friend'}}))]};
    await route.fulfill({json:{success:true,data:{chat:groupState.chat}}});return;
  }
  if(action==='chat.clear_chat_history_for_user'||action==='chat.clear_chat_history_for_all'){groupState.clear.push(action);fixtureMessages.splice(0);await route.fulfill({json:{success:true,data:{}}});return;}
  if(action==='chat.forward_messages') {
    const field=name=>body.match(new RegExp('name="'+name+'"\\r\\n\\r\\n([^\\r]*)'))?.[1]??'';
    const ids=[...body.matchAll(/name="message_ids\[\]"\r\n\r\n([^\r]+)/g)].map(m=>m[1]);
    forwardState.requests.push({source:field('source_chat_id'),target:field('chat_id'),ids});
    if(forwardState.fail){forwardState.fail=false;await route.fulfill({status:500,json:{success:false,error:'fixture failure'}});return;}
    const messages=ids.map(id=>({...fixtureMessages.find(m=>m.id===id),id:'forwarded-'+id,author_id:user.id,contentable_id:field('chat_id'),forwarded_from:{name:'Original Sender',date:new Date().toISOString()}}));
    if(field('content').trim())messages.unshift({id:'caption-'+forwardState.requests.length,author_id:user.id,content:field('content'),created_at:new Date().toISOString()});
    const destination=field('chat_id')==='33333333-3333-4333-8333-333333333333'?targetMessages:fixtureMessages;destination.push(...messages);
    await route.fulfill({json:{success:true,data:{messages}}});return;
  }
  if(action==='chat.send_message') {
    const field=name=>body.match(new RegExp('name="'+name+'"\\r\\n\\r\\n([^\\r]*)'))?.[1]??'';
    const extras=JSON.parse(field('extras')||'{}');
    const message={id:'sent-'+sent.length,author_id:user.id,content:field('content'),parent:fixtureMessages.find(m=>m.id===field('reply_to')),emoticon:extras.emoticon,created_at:new Date().toISOString()};
    sent.push({extras,reply:field('reply_to'),content:field('content')});fixtureMessages.push(message);
    await route.fulfill({json:{success:true,data:{message}}});return;
  }
  const data=action==='auth.user_info'?{user:viewer}:action==='user.fetch_profile'?{user}:action==='system.initial_sync'?{preferences:{attributes:[],interests:[],fantasies:[]},languages:{en:{code:'en',name:'English'},tr:{code:'tr',name:'Türkçe'},ar:{code:'ar',name:'العربية'}},countries:{},event_kinds:[],report_kinds:[],checkin_tag_types:[],status:'online'}:action==='user.follow.toggle'?{is_following:true,user}:{posts:[],medias:[],users:[],notifications:[]};
  await route.fulfill({json:{success:true,data}});
 });
 await page.goto('http://localhost:5173'+(external?'/'+user.username:'/profile'));
 await page.locator('.cv-profile-name h1').waitFor();
 await page.waitForTimeout(120);
 return {context,page,user,errors,calls,sent,forwardState,groupState,social,viewer};
}


export { browser, root, setup };

export async function selectProfileTab(page, label) {
 const tabs=page.locator('.cv-profile-tabs');await tabs.waitFor();
 const tab=tabs.getByRole('tab',{name:label,exact:true});
 if(await tab.count())await tab.click();
 else {await tabs.locator('button.cv-adaptive-more').click();await page.locator('dialog[open]').last().getByRole('button',{name:label,exact:true}).click();}
}

// A variable-height virtual list converges after newly mounted rows are measured.
export async function settleScrollBottom(page, scroller, target) {
 for(let attempt=0;attempt<30;attempt++) {
  await scroller.evaluate(e=>e.scrollTop=e.scrollHeight);
  await page.waitForTimeout(100);
  if(await target.isVisible()) {
   const ready=await target.evaluate(e=>{let p=e.parentElement;while(p&&getComputedStyle(p).overflowY!=='auto')p=p.parentElement;const r=e.getBoundingClientRect(),s=p?.getBoundingClientRect();return !s||(r.top>=s.top&&r.bottom<=s.bottom);});
   if(ready){await page.waitForTimeout(200);if(await target.isVisible())return;}
  }
 }
 throw new Error('Virtual list did not reveal its last row after measurement');
}
