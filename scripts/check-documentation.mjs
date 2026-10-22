import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = name => fs.readFileSync(path.join(root, name), 'utf8')
const json = name => JSON.parse(read(name))
const exists = name => fs.existsSync(path.join(root, name))
const registry = read('src/seo/seoConfig.ts').split('export const DEFAULT_OG_LOCALE')[0]
const locales = [...registry.matchAll(/lang: '([^']+)'/g)].map(m => m[1])
assert.equal(new Set(locales).size, 23)
const files = ['README.md', 'SUMMARY.md', ...fs.readdirSync(path.join(root, 'docs/guide')).filter(n => n.endsWith('.md')).map(n => `docs/guide/${n}`), ...locales.filter(l => l !== 'en').map(l => `docs/readme/README.${l}.md`)]
for (const file of files) {
  const text = read(file)
  const targets = [...text.matchAll(/\]\(([^)]+)\)/g), ...text.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1])
  for (const target of targets) {
    if (/^(https?:|mailto:|#)/.test(target)) continue
    const local = decodeURI(target.split('#')[0].split('?')[0])
    assert(fs.existsSync(path.resolve(root, path.dirname(file), local)), `${file}: missing ${target}`)
  }
}
const summary = read('SUMMARY.md')
const pages = [...summary.matchAll(/\]\(([^)]+\.md)\)/g)].map(m => m[1])
assert.equal(new Set(pages).size, pages.length, 'SUMMARY repeats a page')
assert.equal(pages.length, 30, 'English + 22 overviews + 7 guides')
for (const locale of locales) {
  assert(exists(`docs/assets/heroes/${locale}.jpg`), `Missing ${locale} hero export`)
  const doc = locale === 'en' ? 'README.md' : `docs/readme/README.${locale}.md`
  assert(read(doc).includes(`assets/heroes/${locale}.jpg`), `${doc} uses incorrect hero`)
  assert(summary.includes(`](${doc})`), `${doc} missing from GitBook`)
}
const flatten = (value, prefix = '') => Object.fromEntries(Object.entries(value).flatMap(([key, item]) => typeof item === 'object' && item !== null ? Object.entries(flatten(item, prefix + key + '.')) : [[prefix + key, item]]))
const tokens = value => [...String(value).matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1]).sort()
for (const ns of ['common', 'landing', 'legal', 'auth']) {
  const en = flatten(json(`src/locales/en/${ns}.json`))
  for (const locale of ['ne', 'km']) {
    const translated = flatten(json(`src/locales/${locale}/${ns}.json`))
    assert.deepEqual(Object.keys(translated).sort(), Object.keys(en).sort(), `${locale}/${ns} key mismatch`)
    for (const [key, value] of Object.entries(en)) {
      assert(String(translated[key]).trim(), `${locale}/${ns}/${key} is empty`)
      assert.deepEqual(tokens(translated[key]), tokens(value), `${locale}/${ns}/${key} interpolation mismatch`)
    }
  }
}
const captures = json('docs/assets/screenshots/capture-manifest.json').captures
assert.equal(captures.length, 16)
for (const row of captures) assert(exists(`docs/assets/screenshots/${row.file}`))
assert(read('.gitbook.yaml').includes('summary: SUMMARY.md'))
console.log(`Documentation passed: ${pages.length} GitBook pages, ${locales.length} locale heroes, ${captures.length} screenshots, Nepali/Khmer namespace and interpolation parity.`)
