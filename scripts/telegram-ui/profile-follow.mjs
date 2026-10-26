import assert from 'node:assert/strict';
import fs from 'node:fs';
import { expect } from '@playwright/test';
import { browser, root, setup } from './fixture.mjs';

const results=[];
try {
 for(const item of [{width:390,language:'tr',theme:'light'},{width:820,language:'ar',theme:'dark',large:true},{width:1440,language:'en',theme:'dark'}]) {
  const {context,page,user,viewer,followState,errors}=await setup(item,{external:true,following:true});
  const tr=JSON.parse(fs.readFileSync(`${root}/src/locales/${item.language}/common.json`,'utf8'));
  const follow=page.locator('.cv-profile-actions > button').first();
  const count=page.locator('.cv-profile-connection').filter({has:page.getByText(tr.profile.followers,{exact:true})}).locator('strong');
  const settled=async following=>{await expect(follow).toHaveText(following?tr.profile.following:tr.profile.follow);await expect(follow).toBeEnabled();};
  const countValue=async()=>Number((await count.innerText()).replace(/[^0-9]/g,''));
  await settled(true);
  const initialCount=await countValue();
  await page.reload();await settled(true);
  let release;followState.hold=new Promise(resolve=>{release=resolve;});
  await follow.click();await expect(follow).toBeDisabled();
  await follow.evaluate(button=>button.click());
  await expect.poll(()=>followState.requests.length).toBe(1);
  release();followState.hold=null;await settled(false);
  assert.equal(await countValue(),initialCount-1);
  assert.equal(followState.requests[0],user.public_id,'public ID remains lossless');
  await page.reload();await settled(false);
  await follow.click();await settled(true);assert.equal(await countValue(),initialCount);
  followState.fail=true;await follow.click();
  await page.locator('.cv-profile-header [role=alert]').waitFor();await settled(true);
  assert.equal(await countValue(),initialCount,'failure restores the exact count');
  followState.nextStatus=true;await follow.click();await settled(true);
  assert.equal(await countValue(),initialCount,'server status wins over the optimistic toggle');
  await expect(page.locator('.cv-profile-header [role=alert]')).toHaveCount(0);

  user.privacy_level='followers_only';await page.reload();await settled(true);
  const message=page.locator('.cv-profile-actions > button').nth(1);
  await expect(message).toBeEnabled();
  await follow.click();await settled(false);await expect(message).toBeDisabled();
  await follow.click();await settled(true);await expect(message).toBeEnabled();

  // The existing list can use legacy numeric IDs, and followers are not followings.
  user.id=42;delete user.public_id;
  viewer.engagements.engagement_details=[{kind:'following',engagee:{id:'42'}}];
  await page.reload();await settled(true);
  viewer.engagements.engagement_details=[{kind:'follower',engagee:{id:'42'}}];
  await page.reload();await settled(false);
  user.id=user.public_id='9007199254740993';
  delete viewer.engagements.engagement_details;
  const pages=[];
  await page.route('**/api/**',async route=>{
   const body=route.request().postData()||'';
   const action=new URL(route.request().url()).searchParams.get('action')??body.match(/name="action"\r\n\r\n([^\r]+)/)?.[1];
   if(action!=='user.fetch_engagements')return route.fallback();
   const second=body.includes('following-page-2');pages.push(second?2:1);
   await route.fulfill({json:{success:true,data:{engagements:second?[{kind:'following',engagee:{id:user.id,public_id:user.public_id}}]:[],cursor:{next:second?null:'following-page-2'}}}});
  });
  await page.reload();await settled(true);
  assert.deepEqual([...new Set(pages)],[1,2],'missing userinfo details use the existing paginated following list');
  assert.deepEqual(errors,[]);
  results.push({...item,initialFollowing:true,reload:true,toggle:true,pending:true,failureRollback:true,serverStatus:true,privacy:true,legacyIDs:true,followerDirection:true,missingDetailsPagination:true});
  await context.close();
 }
 fs.writeFileSync(`${root}/docs/profile-follow-checks.json`,JSON.stringify({checkedAt:new Date().toISOString(),mode:'isolated API fixtures; existing userinfo engagements contract',results},null,2)+'\n');
 console.log('Profile follow checks passed:',results.length,'viewport/locale cases.');
} finally {await browser.close();}
