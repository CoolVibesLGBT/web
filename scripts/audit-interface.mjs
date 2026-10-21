import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const sources = ['src/screens', 'src/features/auth', 'src/features/profile', 'src/features/post', 'src/components/ui']
const files = []
function scan(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) scan(target)
    else if (target.endsWith('.tsx')) files.push(target)
  }
}
sources.forEach(scan)
const screens = files.sort().map(file => {
  const source = fs.readFileSync(file, 'utf8')
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const states = [], fields = [], headings = [], dialogs = []
  let virtualized = false
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer) && node.initializer.expression.getText(ast).endsWith('useState')) {
      states.push({ name: node.name.getText(ast), type: node.initializer.typeArguments?.map(type => type.getText(ast)).join(', ') || null, initial: node.initializer.arguments[0]?.getText(ast) || null })
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast)
      if (['input','select','textarea','FormField'].includes(tag)) fields.push({ tag, line: ast.getLineAndCharacterOfPosition(node.pos).line + 1 })
      if (/^h[1-3]$/.test(tag) || tag === 'NavigationBar') headings.push(ast.getLineAndCharacterOfPosition(node.pos).line + 1)
      if (/Modal|Sheet|Dialog|Wizard/.test(tag)) dialogs.push(tag)
      if (/Virtuoso/.test(tag)) virtualized = true
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return { file, states, fields, headings, dialogs: [...new Set(dialogs)], virtualized, visualVerification: 'pending' }
})
const catalog = JSON.parse(fs.readFileSync('src/features/illustrations/icon-catalog.json', 'utf8'))
const missingIcons = catalog.filter(item => !fs.existsSync(`public/images/icons/dott/${item.key}.avif`)).map(item => item.key)
const assets = { illustratedIcons: catalog.length, missingIcons, authAssets: fs.readdirSync('public/images/auth'), systemIcons: 'Existing lucide-react vector icons; brand illustrations remain in navigation and domain content.', font: 'System font stack; no proprietary font downloads.' }
fs.writeFileSync('docs/interface-inventory.json', JSON.stringify({ generatedBy: 'yarn node scripts/audit-interface.mjs', sources: screens, assets }, null, 2) + '\n')
console.log(JSON.stringify({ sources: screens.length, screens: screens.filter(item => item.file.startsWith('src/screens/')).length, fields: screens.reduce((sum, item) => sum + item.fields.length, 0), assets },null,2))
