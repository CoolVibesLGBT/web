import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = new URL('../src/locales/', import.meta.url)
const read = (locale, namespace) => JSON.parse(readFileSync(new URL(`${locale}/${namespace}.json`, root), 'utf8'))
function leaves(value, prefix = '') {
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).flatMap(([key, child]) => Object.entries(leaves(child, `${prefix}.${key}`))))
  return { [prefix]: value }
}
const variables = value => [...value.matchAll(/{{\s*(\w+)\s*}}/g)].map(match => match[1]).sort()
const locales = readdirSync(fileURLToPath(root), { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name)
for (const namespace of ['landing', 'legal', 'auth']) {
  const reference = leaves(read('en', namespace))
  for (const locale of locales) {
    const translations = leaves(read(locale, namespace))
    assert.deepEqual(Object.keys(translations).sort(), Object.keys(reference).sort(), `${locale}/${namespace}: missing or extra keys`)
    for (const [key, value] of Object.entries(translations)) {
      assert.ok(typeof value === 'string' && value.trim(), `${locale}/${namespace}${key}: empty translation`)
      assert.deepEqual(variables(value), variables(reference[key]), `${locale}/${namespace}${key}: broken interpolation`)
    }
  }
  console.log(`${namespace}: ${Object.keys(reference).length} strings complete in ${locales.length} languages`)
}
