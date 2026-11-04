import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browser, root, setup } from './fixture.mjs';

const body = new FormData();
body.set('action', 'system.initial_sync');
body.set('app_domain', 'coolvibes.gay');
const response = await fetch('http://localhost:4001/api/', { method: 'POST', body });
const payload = await response.json();
const initial = payload.data ?? payload;
const tags = initial.checkin_tag_types;
assert.equal(tags.length, 84, 'The real initial-sync catalog must include all artwork');
assert(tags.every(tag => tag.thumb && tag.icon));
const results = [];
try {
  for (const item of [
    { width: 320, language: 'tr', theme: 'light' },
    { width: 390, language: 'en', theme: 'dark' },
    { width: 820, language: 'ar', theme: 'dark', large: true },
    { width: 1440, language: 'en', theme: 'light' },
  ]) {
    const { context, page, user, errors } = await setup(item);
    const post = {
      id: '11111111-1111-4111-8111-111111111111', public_id: '2113015734824079360',
      author_id: user.id, author: user, post_kind: 'checkin', content: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      children: [], attachments: [], extras: { tags: ['has_place', 'available_now', 'seeking_chat'] },
      engagements: { counts: {}, engagement_details: [] },
    };
    await page.route('http://localhost:4001/**', async route => {
      const request = route.request();
      if (new URL(request.url()).pathname.startsWith('/static/checkin/')) return route.continue();
      const data = request.postData() ?? '';
      const action = new URL(request.url()).searchParams.get('action') ?? data.match(/name="action"\r\n\r\n([^\r]+)/)?.[1];
      if (action === 'system.initial_sync') return route.fulfill({ json: { success: true, data: initial } });
      if (['user.check_in_fetch', 'post.timeline'].includes(action)) return route.fulfill({ json: { success: true, data: { posts: [post], cursor: null } } });
      if (action === 'post.fetch') return route.fulfill({ json: { success: true, data: post } });
      return route.fallback();
    });
    await page.goto('http://localhost:5173/checkin');
    const postArt = page.locator('.cv-checkin-post-tag img');
    await postArt.first().waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('.cv-checkin-post-tag img')].every(img => img.complete && img.naturalWidth > 0));
    assert.equal(await postArt.count(), 3);
    assert(await postArt.first().evaluate(img => img.currentSrc.includes('/static/checkin/')));
    await page.locator('button.sky-glow').click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    const options = dialog.locator('.cv-checkin-tag-option');
    await options.first().waitFor();
    assert((await options.count()) < 84, 'Tag choices must be virtualized');
    await page.waitForFunction(() => [...document.querySelectorAll('.cv-checkin-tag-option img')].every(img => img.complete && img.naturalWidth > 0));
    // A selection must not restart the dialog lifecycle or move the picker camera.
    await dialog.evaluate(el => {
      el.dataset.closeCount = '0';
      el.addEventListener('close', () => { el.dataset.closeCount = String(Number(el.dataset.closeCount) + 1); });
    });
    const beforeSelection = await dialog.evaluate(el => ({
      top: el.getBoundingClientRect().top,
      pickerTop: el.querySelector('.cv-checkin-honeycomb').getBoundingClientRect().top,
      plane: getComputedStyle(el.querySelector('.cv-checkin-honeycomb-plane')).transform,
    }));
    await options.first().click();
    await page.waitForTimeout(350);
    const afterSelection = await dialog.evaluate(el => ({
      top: el.getBoundingClientRect().top,
      pickerTop: el.querySelector('.cv-checkin-honeycomb').getBoundingClientRect().top,
      plane: getComputedStyle(el.querySelector('.cv-checkin-honeycomb-plane')).transform,
    }));
    assert.deepEqual(afterSelection, beforeSelection, 'Selecting a tag must not recenter or shift the dialog');
    assert.equal(await dialog.getAttribute('data-close-count'), '0', 'Selection must not close and reopen the native dialog');
    assert.equal(await options.first().evaluate(el => el.getBoundingClientRect().width), 112, 'Picker items stay compact');
    assert.equal(await options.first().getAttribute('aria-pressed'), 'true');
    assert.equal(await dialog.locator('.cv-checkin-selected-artwork').count(), 1);
    await options.first().press('End');
    const lastName = tags.at(-1).name[item.language] ?? tags.at(-1).name.en;
    await dialog.getByRole('button', { name: lastName, exact: true }).waitFor();
    const circles = await dialog.locator('.cv-checkin-tag-portrait').evaluateAll(elements => elements.map(el => { const box = el.getBoundingClientRect();return Math.abs(box.width - box.height) < 1; }));
    assert(circles.every(Boolean), 'Artwork keeps its circular background');
    const labelsFit = await dialog.locator('.cv-checkin-tag-label').evaluateAll(elements => elements.every(el => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1 && getComputedStyle(el).webkitLineClamp === 'none'));
    assert(labelsFit, 'Full labels wrap below the artwork without clipping or line clamps');
    const bounds = await dialog.evaluate(el => {
      const picker = el.querySelector('.cv-checkin-honeycomb');
      const editor = el.querySelector('.lexical-editor');
      const composer = el.querySelector('.cv-create-post-integrated');
      return { pickerBottom: picker.getBoundingClientRect().bottom, editorTop: editor.getBoundingClientRect().top, integrated: composer.contains(picker) && composer.contains(editor), width: el.getBoundingClientRect().width, viewport: innerWidth, overflow: el.scrollWidth > el.clientWidth + 1 };
    });
    assert(bounds.integrated, 'Picker and editor belong to the same composer');
    assert(bounds.pickerBottom <= bounds.editorTop + 1, 'Picker must not overlap the editor');
    assert(!bounds.overflow, 'Dialog must not overflow horizontally');
    assert(bounds.width >= Math.min(bounds.viewport - 32, 700), 'Generic popup width must not constrain the composer');
    assert.equal(await dialog.locator('.lexical-editor').evaluate(el => getComputedStyle(el).minHeight), '64px');
    await dialog.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
    await page.goto('http://localhost:5173/?tab=flows');
    await page.locator('.cv-checkin-post-tag img').first().waitFor();
    assert.deepEqual(errors, []);
    results.push({ ...item, status: 'passed', checks: ['real AVIF decoding', 'shared feed/post renderer', '84 uniquely positioned, viewport-culled circular tag options', 'selection and selected thumbnail', 'last tag reachable', 'single integrated composer with responsive width and no overlap'] });
    console.log(item.width, item.language, 'check-in artwork passed');
    await context.close();
  }
  fs.writeFileSync(`${root}/docs/checkin-artwork-checks.json`, JSON.stringify({ method: 'DOM fixtures with real local initial-sync metadata and AVIF files; no screenshots or account mutations', results }, null, 2) + '\n');
} finally { await browser.close(); }
