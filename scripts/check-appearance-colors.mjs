import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const directory = path.resolve('src/features/appearance');
const cache = new Map();
function load(name) {
  const file = path.resolve(directory, name.endsWith('.json') || name.endsWith('.ts') ? name : `${name}.ts`);
  if (cache.has(file)) return cache.get(file);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const exports = {};
  cache.set(file, exports);
  vm.runInNewContext(code, { exports, require: load, Uint8ClampedArray });
  return exports;
}
const { CHAT_THEMES, resolveTheme, telegramWallpaperColors } = load('model');
const { gradientPixels } = load('gradient');
// Telegram's optional color slots use 0 as "no additional stop", not black.
assert.deepEqual(Array.from(telegramWallpaperColors([0xffffff, 0])), [0xffffff]);
assert.deepEqual(Array.from(telegramWallpaperColors([0, 0xff0000, 0])), [0, 0xff0000]);
let previews = 0;
for (const base of ['day', 'light', 'night', 'tinted']) {
  const patterns = new Set();
  for (const theme of [{ id: '' }, ...CHAT_THEMES]) {
    const value = resolveTheme(base, { preset: null, theme: theme.id });
    const pixels = gradientPixels(value.wallpaper.colors);
    let chroma = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      chroma = Math.max(chroma, Math.max(...pixels.slice(i, i + 3)) - Math.min(...pixels.slice(i, i + 3)));
    }
    assert(chroma > 15, `${base}/${theme.id}: illustrated theme must not render in grayscale`);
    assert(value.wallpaper.pattern, `${base}/${theme.id}: original SVG pattern is present`);
    patterns.add(value.wallpaper.source ?? '/images/chat/telegram-pattern.svg');
    if (theme.id) assert(fs.existsSync(path.resolve('public', value.wallpaper.source.slice(1))), 'original SVG exists');
    previews++;
  }
  assert.equal(patterns.size, 9, `${base}: all nine original patterns remain distinct`);
}
const chick = CHAT_THEMES[0];
assert.deepEqual(Array.from(resolveTheme('light', { preset: null, theme: chick.id }).wallpaper.colors), ['#87bda5', '#b9dd83', '#d5d88c', '#a5c885']);
// A user explicitly choosing a monochrome wallpaper must keep that choice.
const custom = { kind: 'gradient', colors: ['#ffffff', '#000000'], rotation: 45, pattern: false, intensity: 0, blur: false };
assert.equal(resolveTheme('light', { preset: null, theme: chick.id, wallpaper: custom }).wallpaper, custom);
console.log(`Appearance color regression passed: ${previews} colored previews, original SVGs, zero sentinels and explicit custom wallpapers`);
