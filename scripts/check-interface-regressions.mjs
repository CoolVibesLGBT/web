import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { ESLint } from 'eslint'

const engine = new ESLint()
for (const [code, expected] of [
  ['export default function Screen() { return <Brand /> }', 1],
  ['export default function Screen() { return <Missing.Icon /> }', 1],
  ['import Brand from "@/features/landing/Brand"; export default function Screen() { return <Brand /> }', 0],
  ['const Parts = { Icon: () => null }; export default function Screen() { return <Parts.Icon /> }', 0],
  ['export default function Screen() { return <svg><path /></svg> }', 0],
]) {
  const [result] = await engine.lintText(code, { filePath: 'src/interface-regression.tsx' })
  assert.equal(result.messages.filter(message => message.ruleId === 'interface/jsx-no-undef').length, expected)
}
const source = fs.readFileSync('src/components/ui/tabLayout.ts', 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const exports = {}
vm.runInNewContext(compiled, { exports })
const fit = (...args) => Array.from(exports.fitTabs(...args))
assert.deepEqual(fit([80, 80, 80], 300, 80, 0), [0, 1, 2])
assert.deepEqual(fit([100, 100, 100, 100, 100], 320, 80, 4), [0, 4])
assert.deepEqual(fit([200, 200, 200, 200], 320, 80, 3), [3])
assert.deepEqual(fit([80, 80], 0, 80, 1), [1])
assert.deepEqual(fit([], 320, 80, 0), [])
for (let width = 240; width <= 1440; width += 20) {
  const widths = Array.from({ length: 12 }, (_, index) => 65 + index * 13)
  for (let active = 0; active < widths.length; active++) {
    const visible = fit(widths, width, 80, active)
    assert(visible.includes(active), 'The active view must never move into overflow')
    assert.equal(new Set(visible).size, visible.length)
    if (widths[active] + 84 <= width && visible.length < widths.length) assert(visible.reduce((sum, index) => sum + widths[index], 0) + 84 <= width)
  }
}
console.log('JSX binding regression and adaptive tab layout checks passed')
