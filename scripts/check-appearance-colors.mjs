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
const { CHAT_THEMES, PRESETS, readAppearance, resolveTheme, telegramWallpaperColors } = load('model');
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

// Curated stops are checked against the actual Swift source, not our resolver.
const reference = fs.readFileSync('/Users/ersanyakit/Downloads/Telegram-iOS-master/submodules/SettingsUI/Sources/Themes/ThemeColorPresets.swift', 'utf8');
const names = {day:'dayClassic',light:'day',night:'night'};
let count = 0;
for (const [base, name] of Object.entries(names)) {
 const section = reference.split(`var ${name}ColorPresets:`)[1].split('\n]')[0];
 for (const line of section.split('\n').filter(line => !line.trim().startsWith('//'))) {
  const match = line.match(/index: (\d+).*accentColor: (0x[\da-f]+), bubbleColors: \[([^\]]+)/i);
  if (!match) continue;
  const id = Number(match[1]);
  const stops = match[3].split(',').map(value => '#' + (Number(value.trim()) & 0xffffff).toString(16).padStart(6,'0'));
  const value = resolveTheme(base, {preset:id});
  assert.deepEqual(Array.from(value.sourceMessageColors), stops, `${base}/${id}: Swift stops in source order`);
  count++;
 }
}
for (const base of ['day','light','night','tinted']) {
 for (const preset of PRESETS[base]) {
  const value = resolveTheme(base,{preset:preset.id});
  const edited = resolveTheme(base,{preset:preset.id,messages:{accent:value.sourceAccent,colors:['#123456','#abcdef']}});
  assert.equal(edited.accent,value.accent,'bubble editing must not change accent');
  assert.equal(edited.surface,value.surface,'bubble editing must not change surface');
  assert.equal(edited.outgoingBackground,'linear-gradient(to bottom, #123456, #abcdef)');
 }
}
assert.deepEqual(Array.from(resolveTheme('night',{preset:10}).sourceMessageColors),['#a256bf','#9047ff','#0771ff']);
assert.deepEqual(Array.from(resolveTheme('light',{preset:10}).sourceMessageColors),['#61c4f9','#0088ff']);
assert.equal(resolveTheme('day').outgoing,'#e1ffc7');
const old=readAppearance(JSON.stringify({version:1,themes:{night:{preset:12,messages:{accent:'#29b327',colors:['#ff00ff','#ffbbee'],followWallpaper:true}}}}),null);
assert.equal(old.themes.night.messages,undefined,'remove incorrect automatic wallpaper override');
const triple = {accent:'#3e88f7', colors:['#a256bf','#9047ff','#0771ff']};
assert.equal(readAppearance(JSON.stringify({version:1,themes:{night:{messages:triple}}}),null).themes.night.messages.colors.length,3);
console.log(`iOS reference checks passed: ${count} curated palettes, regular blue defaults, accent isolation and preference migration`);
