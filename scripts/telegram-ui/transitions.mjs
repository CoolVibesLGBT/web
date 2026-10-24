import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browser, root, setup } from './fixture.mjs';

const results = [];
const cases = [
  { width: 320, language: 'tr', theme: 'light' },
  { width: 390, language: 'en', theme: 'dark' },
  { width: 820, language: 'ar', theme: 'dark', large: true },
  { width: 1440, language: 'en', theme: 'light' },
];

try {
  for (const item of cases) {
    const { context, page, errors } = await setup(item);
    const copy = JSON.parse(fs.readFileSync(`${root}/src/locales/${item.language}/common.json`));
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 41, longitude: 29 });
    await page.route('https://tiles.openfreemap.org/styles/liberty', route => route.fulfill({ json: {
      version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eeeeee' } }],
    } }));
    const places = [
      { public_id: 'transition-cafe', hashtags: [{ tag: 'cafe' }], extras: { place: { name: 'Transition Cafe', description: 'Coffee', latitude: 41, longitude: 29 } } },
      { public_id: 'transition-bar', hashtags: [{ tag: 'bar' }], extras: { place: { name: 'Transition Bar', description: 'Music', latitude: 41.01, longitude: 29.01 } } },
    ];
    await page.route('http://localhost:4001/**', async route => {
      const request = route.request();
      const body = request.postData() || '';
      const action = new URL(request.url()).searchParams.get('action') ?? body.match(/name="action"\r\n\r\n([^\r]+)/)?.[1];
      if (action !== 'place.fetch') return route.fallback();
      const publicId = body.match(/name="public_id"\r\n\r\n([^\r]+)/)?.[1];
      const data = publicId
        ? { places: places.filter(place => place.public_id === publicId) }
        : { places, cursor: null };
      return route.fulfill({ json: { success: true, data } });
    });

    await page.goto('http://localhost:5173/messages');
    const rows = page.locator('.cv-chat-row');
    await rows.filter({ hasText: 'Forward Destination' }).waitFor();
    const search = page.locator('.cv-chat-search-area input');
    await search.fill('Forward');
    await page.waitForFunction(() => document.querySelectorAll('.cv-chat-row').length === 1);
    assert.match(await rows.innerText(), /Forward Destination/);
    await search.fill('missing-transition-fixture');
    await page.waitForFunction(() => document.querySelectorAll('.cv-chat-row').length === 0);
    await search.fill('');
    await page.waitForFunction(() => document.querySelectorAll('.cv-chat-row').length === 2);

    const tabs = page.locator('.cv-chat-search-area [role="tablist"]');
    await tabs.getByRole('tab', { selected: true }).press('End');
    await tabs.getByRole('tab', { selected: true, name: copy.messages.unencrypted, exact: true }).waitFor();
    await tabs.getByRole('tab', { selected: true }).press('Home');
    await tabs.getByRole('tab', { selected: true, name: copy.messages.all, exact: true }).waitFor();
    assert.equal(await tabs.getByRole('tab', { selected: true }).evaluate(el => document.activeElement === el), true);
    await page.waitForFunction(() => document.querySelector('.cv-chat-search-area [role="tablist"]')?.getAttribute('aria-busy') === 'false');

    await page.goto('http://localhost:5173/places');
    await page.getByText('Transition Cafe', { exact: true }).waitFor();
    await page.getByText('Transition Bar', { exact: true }).waitFor();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cv:places-search-query', { detail: { query: 'Cafe' } })));
    await page.getByText('Transition Bar', { exact: true }).waitFor({ state: 'hidden' });
    await page.getByText('Transition Cafe', { exact: true }).waitFor();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cv:places-search-query', { detail: { query: '' } })));
    await page.getByText('Transition Bar', { exact: true }).waitFor();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cv:places-set-category', { detail: { category: 'bar' } })));
    await page.getByText('Transition Cafe', { exact: true }).waitFor({ state: 'hidden' });
    await page.getByText('Transition Bar', { exact: true }).waitFor();

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cv:places-set-view-mode', { detail: { viewMode: 'map' } })));
    await page.locator('.gm-game-object').waitFor();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cv:places-set-category', { detail: { category: 'all' } })));
    await page.waitForFunction(() => document.querySelectorAll('.gm-game-object').length === 2);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cv:places-search-query', { detail: { query: 'Cafe' } })));
    await page.waitForFunction(() => document.querySelectorAll('.gm-game-object').length === 1);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cv:places-set-view-mode', { detail: { viewMode: 'grid' } })));
    await page.getByRole('tab', { selected: true, name: copy.nearby.view_grid, exact: true }).waitFor();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.gm-map-root').parentElement.parentElement).pointerEvents === 'none');
    assert.equal(await page.locator('.gm-map-root').count(), 1, 'Places keeps its map mounted while showing the grid');
    await page.getByText('Transition Cafe', { exact: true }).waitFor();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cv:places-set-view-mode', { detail: { viewMode: 'map' } })));
    await page.locator('.gm-game-object').click();
    await page.waitForURL('**/places/transition-cafe');
    await page.getByRole('heading', { name: 'Transition Cafe', exact: true }).waitFor();

    await page.goto('http://localhost:5173/checkin');
    const checkInTabs = page.getByRole('tablist', { name: copy.app.nav.checkin, exact: true });
    await checkInTabs.getByRole('tab', { selected: true, name: copy.nearby.view_list, exact: true }).waitFor();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cv:checkin-set-view-mode', { detail: { viewMode: 'map' } })));
    await checkInTabs.getByRole('tab', { selected: true, name: copy.nearby.view_map, exact: true }).waitFor();
    await page.locator('.gm-map-root').waitFor();
    await page.locator('.gm-player-wrap').waitFor();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cv:checkin-set-view-mode', { detail: { viewMode: 'list' } })));
    await page.locator('.gm-map-root').waitFor({ state: 'hidden' });
    await checkInTabs.getByRole('tab', { selected: true, name: copy.nearby.view_list, exact: true }).waitFor();

    await page.goto('http://localhost:5173/places/missing-transition-fixture');
    await page.getByText(copy.places.details_not_found, { exact: true }).waitFor();
    assert.equal(await page.locator('.skyline-page-scroll .animate-spin').count(), 0, 'Place errors leave the loading state');
    await page.goto('http://localhost:5173/places/transition-cafe');
    await page.getByRole('heading', { name: 'Transition Cafe', exact: true }).waitFor();

    assert.deepEqual(errors, []);
    results.push({ ...item, status: 'passed', checks: ['chat search, no-match and clear', 'transition tabs preserve keyboard selection and focus including overflow and RTL', 'Places search, clear and category filter', 'Places deferred markers add/remove under filters and map/grid switching', 'Check-in map and player mount; header event returns to list', 'place detail success and missing-place error settle loading'] });
    console.log(item.width, item.language, 'transitions passed');
    await context.close();
  }
  fs.writeFileSync(`${root}/docs/transition-checks.json`, JSON.stringify({ date: new Date().toISOString().slice(0, 10), method: 'Browser DOM and intercepted APIs; no screenshots, live mutations or performance benchmark', results }, null, 2) + '\n');
} finally {
  await browser.close();
}
