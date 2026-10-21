import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const catalog = JSON.parse(readFileSync(new URL('../src/features/illustrations/icon-catalog.json', import.meta.url), 'utf8'))
const keys = new Set()
for (const icon of catalog) {
  assert.ok(!keys.has(icon.key), `Duplicate icon: ${icon.key}`)
  keys.add(icon.key)
  const file = readFileSync(new URL(`../public/images/icons/dott/${icon.key}.avif`, import.meta.url))
  assert.equal(file.toString('ascii', 4, 8), 'ftyp', `${icon.key}: invalid image container`)
  assert.ok(file.toString('ascii', 8, 40).includes('avif'), `${icon.key}: image is not AVIF`)
  const spatialExtent = file.indexOf('ispe')
  assert.ok(spatialExtent > 0, `${icon.key}: missing image dimensions`)
  assert.equal(file.readUInt32BE(spatialExtent + 8), 256, `${icon.key}: width must be 256`)
  assert.equal(file.readUInt32BE(spatialExtent + 12), 256, `${icon.key}: height must be 256`)
  if (icon.sourceId) assert.ok(icon.aliases.includes(icon.sourceId), `${icon.key}: missing seeder identity`)
}
console.log(`${catalog.length} unique 256×256 AVIF illustrations and seeder mappings verified`)
