import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const sources = ['src/screens', 'src/features/auth', 'src/features/profile', 'src/features/post', 'src/features/appearance', 'src/features/chat', 'src/features/emoticons', 'src/components/ui']
const previous = new Map(JSON.parse(fs.readFileSync('docs/interface-inventory.json', 'utf8')).sources.map(item => [item.file, item]))
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
  return { file, states, fields, headings, dialogs: [...new Set(dialogs)], virtualized, visualVerification: 'pending', ...(previous.get(file)?.runtimeVerification ? { runtimeVerification: previous.get(file).runtimeVerification } : {}) }
})
const catalog = JSON.parse(fs.readFileSync('src/features/illustrations/icon-catalog.json', 'utf8'))
const missingIcons = catalog.filter(item => !fs.existsSync(`public/images/icons/dott/${item.key}.avif`)).map(item => item.key)
const assets = { illustratedIcons: catalog.length, missingIcons, authAssets: fs.readdirSync('public/images/auth'), systemIcons: 'Original tweb tgico SVG paths in chat/emoticons; lucide-react remains on other routes. Brand illustrations remain in domain content.', font: 'Original tweb Roboto WOFF2 with Apache license; system fallback for uncovered scripts.', visualReference: 'docs/telegram-ui-reference.md', popupTokens: 'src/styles/telegram-panels.css', profileLockLottie: 'public/animations/telegram/assets/UtyanPasscode.json', stickerPacks: JSON.parse(fs.readFileSync('src/features/emoticons/sticker-packs.json', 'utf8')).map(pack => ({ title: pack.title, documents: pack.documents.length })) }
fs.writeFileSync('docs/interface-inventory.json', JSON.stringify({ generatedBy: 'yarn node scripts/audit-interface.mjs', sources: screens, assets }, null, 2) + '\n')
console.log(JSON.stringify({ sources: screens.length, screens: screens.filter(item => item.file.startsWith('src/screens/')).length, fields: screens.reduce((sum, item) => sum + item.fields.length, 0), assets },null,2))
