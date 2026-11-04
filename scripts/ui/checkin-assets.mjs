import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const source = fs.readFileSync(`${root}/src/features/checkin/CheckInTagArtwork.tsx`, 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, {
  exports: module.exports, module,
  require(name) {
    if (name === './checkin-artwork.css') return {};
    if (name === '@/helpers/helpers') return { getSafeImageURL: ({ url }) => new URL(url, 'http://localhost:4001').href };
    return require(name);
  },
});
const Artwork = module.exports.default;
const render = tag => renderToStaticMarkup(React.createElement(Artwork, { tag, sizes: '88px' }));
const modern = render({ tag: 'has_place', thumb: '/static/checkin/256/has_place.avif', icon: '/static/checkin/has_place.avif' });
assert(modern.includes('/static/checkin/256/has_place.avif 256w'));
assert(modern.includes('/static/checkin/has_place.avif 512w'));
assert(modern.includes('loading="lazy"') && modern.includes('decoding="async"'));
assert(modern.includes('sizes="88px"') && modern.includes('alt=""'));
const legacy = render({ tag: 'available_now', icon: 'clock' });
assert(legacy.includes('/static/checkin/256/available_now.avif'));
assert(!render({ tag: '../invalid', icon: 'javascript:invalid' }).includes('<img'));

const screenSource = fs.readFileSync(`${root}/src/screens/CheckInScreen.tsx`, 'utf8');
const parsed = ts.createSourceFile('CheckInScreen.tsx', screenSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const hex = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'hexPositions');
assert(hex, 'The circular picker must define positions for the full catalog');
const geometry = vm.runInNewContext(ts.transpileModule(hex.getText(parsed), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + ';hexPositions(84)');
assert.equal(geometry.length, 84);
assert.equal(new Set(geometry.map(({ x, y }) => `${x},${y}`)).size, 84, 'All 84 tag positions must be distinct');
for (let i = 0; i < geometry.length; i++) for (let j = i + 1; j < geometry.length; j++) {
  assert(Math.hypot(geometry[i].x - geometry[j].x, geometry[i].y - geometry[j].y) >= 112, 'Circular tag targets must not overlap');
}

const form = new FormData();form.set('action', 'system.initial_sync');form.set('app_domain', 'coolvibes.gay');
const response = await fetch('http://localhost:4001/api/', { method: 'POST', body: form });
assert(response.ok);
const payload = await response.json();const tags = (payload.data ?? payload).checkin_tag_types;
assert.equal(tags.length, 84);
const failures = [];
await Promise.all(tags.map(async tag => {
  for (const [field, size] of [['thumb', 256], ['icon', 512]]) {
    const expected = `/static/checkin/${size === 256 ? '256/' : ''}${tag.tag}.avif`;
    try {
      assert.equal(tag[field], expected);
      const image = await fetch(new URL(tag[field], 'http://localhost:4001'));
      assert(image.ok && image.headers.get('content-type')?.includes('image/avif'));
      const bytes = Buffer.from(await image.arrayBuffer());
      assert(bytes.subarray(4, 32).includes(Buffer.from('ftyp')));
      assert(bytes.length < (size === 256 ? 32 : 64) * 1024);
    } catch (error) { failures.push(`${tag.tag}.${field}: ${error.message}`); }
  }
}));
assert.deepEqual(failures, []);
const report = { status: 'passed', tag_count: tags.length, asset_count: tags.length * 2, checks: ['84 distinct non-overlapping circular picker positions', 'React artwork serialization and responsive sources', 'legacy icon-name fallback', 'invalid URL/slug fallback', 'real initial-sync Icon/Thumb paths', '168 real AVIF HTTP responses and file-weight limits'], browser: 'not verified: installed Chrome and Chromium abort at startup in this environment' };
fs.writeFileSync(`${root}/docs/checkin-artwork-contract-checks.json`, JSON.stringify(report, null, 2) + '\n');
console.log('84 API tags, 168 live AVIF files and artwork rendering contracts passed.');
