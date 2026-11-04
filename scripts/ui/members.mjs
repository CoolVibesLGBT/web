import assert from 'node:assert/strict';
import fs from 'node:fs';
import {browser,root,setup,settleScrollBottom} from './fixture.mjs';
const results=[];
try {
 for(const item of [{width:320,language:'tr',theme:'light'},{width:390,language:'en',theme:'dark'},{width:820,language:'ar',theme:'dark',large:true},{width:1440,language:'en',theme:'light'}]) {
  const {context,page,user,errors,groupState,social}=await setup(item);
  const peer={id:'9007199254740995',username:'newmember',displayname:'New Member'};
  const oldPeer={id:'22222222-2222-4222-8222-222222222222',username:'themefriend',displayname:'Theme Friend'};
  const members=[{user_id:user.id,user},{user_id:oldPeer.id,user:oldPeer}],adds=[],queries=[];let fail=item.width===390;
  social.friend={request_id:'1234567',requester_id:user.id,recipient_id:peer.id,status:'accepted',user:peer};
  groupState.chat={id:'44444444-4444-4444-8444-444444444444',creator_id:user.id,type:'group',title:{en:'Member Test'},participants:members};
  await page.route('http://localhost:4001/**',async route=>{
   const request=route.request(),body=request.postData()||'',action=new URL(request.url()).searchParams.get('action')??body.match(/name="action"\r\n\r\n([^\r]+)/)?.[1];
   const field=name=>body.match(new RegExp('name="'+name+'"\\r\\n\\r\\n([^\\r]*)'))?.[1]??'';
   if(action==='chat.participants.fetch'){await route.fulfill({json:{success:true,data:{participants:members}}});return;}
   if(action==='chat.group.invite'){await route.fulfill({json:{success:true,data:{invite:{token:'A'.repeat(43)}}}});return;}
   if(action==='search.user.lookup'){const query=field('query')||new URL(request.url()).searchParams.get('query')||'';queries.push(query);await route.fulfill({json:{success:true,data:{users:query==='newmember'?[{...peer,public_id:peer.id}]:[]}}});return;}
   if(action==='chat.participant.add') {adds.push(field('participant_id'));if(fail){fail=false;await route.fulfill({status:500,json:{success:false,error:'fixture'}});return;}if(!members.some(m=>m.user_id===peer.id))members.push({user_id:peer.id,user:peer});await route.fulfill({json:{success:true,data:{}}});return;}
   return route.fallback();
  });
  await page.goto('http://localhost:5173/messages');await page.locator('.cv-chat-row-main').filter({hasText:'Member Test'}).click();await page.locator('.cv-chat-peer').click();let info=page.locator('.cv-group-info');await info.waitFor();await info.locator('.cv-group-add').click();
  let composer=page.locator('.cv-group-composer');await composer.waitFor();
  await composer.getByRole('switch',{name:'New Member',exact:true}).waitFor();assert.equal(await composer.getByRole('switch',{name:'Theme Friend',exact:true}).count(),0,'existing members excluded');assert.equal(await composer.locator('.cv-group-peers .cv-list-row').count(),1,'friend without a private chat is available');assert.equal(await composer.locator('.cv-group-corner').count(),0,'no disabled floating action before selection');
  const search=composer.locator('input[type=search]');await search.fill(' @newmember ');await page.waitForTimeout(400);assert(queries.includes('newmember'),'query strips @ and surrounding whitespace');assert.equal(await composer.getByRole('switch',{name:'New Member',exact:true}).count(),1,'lookup and contacts deduplicate by public identity');
  await search.focus();const field=await search.evaluate(e=>{const r=e.getBoundingClientRect(),icon=e.previousElementSibling.getBoundingClientRect(),s=getComputedStyle(e);return {height:r.height,padding:s.padding,border:s.borderWidth,shadow:s.boxShadow,outline:s.outlineStyle,separate:r.left>=icon.right||r.right<=icon.left};});assert.equal(field.border,'0px');assert.equal(field.padding,'0px');assert.equal(field.shadow,'none');assert.equal(field.outline,'none');assert(field.separate,'RTL icon does not overlap text');
  await composer.locator('.cv-search-field button').click();assert.equal(await search.inputValue(),'');
  await composer.locator('.cv-group-peer-toggle').filter({hasText:'New Member'}).click();assert.equal(await composer.getByRole('switch',{name:'New Member',exact:true}).getAttribute('aria-checked'),'true');await composer.locator('.cv-group-corner').click();
  if(item.width===390){await composer.getByRole('alert').waitFor();assert.equal(await composer.getByRole('switch',{name:'New Member',exact:true}).getAttribute('aria-checked'),'true');await composer.locator('.cv-group-corner').click();}
  await composer.waitFor({state:'hidden'});await info.waitFor();await settleScrollBottom(page,info.locator('.cv-group-info-content'),info.getByText('New Member',{exact:true}));assert(adds.length>0);assert(adds.every(id=>id===peer.id),'public identity sent to add-member API');assert.equal(members.length,3);
  await info.locator('.cv-group-info-content').evaluate(e=>e.scrollTop=0);await info.locator('.cv-group-add').click();composer=page.locator('.cv-group-composer');await composer.locator('.cv-animated-empty').waitFor();assert.equal(await composer.locator('.cv-group-peers').count(),0,'empty state has no collapsed white card');
  await composer.locator('input[type=search]').fill('missing');await page.waitForTimeout(400);await composer.locator('.cv-animated-empty h3').waitFor();
  assert.deepEqual(errors,[]);results.push({...item,status:'passed',field,checks:['accepted friend without prior chat available','existing members/self excluded; contact/search dedup by public identity','@ username search; no input ring or icon overlap','full peer body and switch select; add persists; failure retains selection','empty state is separate; no white strip or disabled floating action']});console.log(item.width,item.language,'members passed');await context.close();
 }
 fs.writeFileSync(root+'/docs/group-member-checks.json',JSON.stringify({date:new Date().toISOString().slice(0,10),method:'DOM/HTTP fixtures; no screenshots or real group mutations',results},null,2)+'\n');
}finally{await browser.close();}
