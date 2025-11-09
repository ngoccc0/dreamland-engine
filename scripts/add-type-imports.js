#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')

const patterns = [
  { name: 'VariantProps', module: 'class-variance-authority' },
  { name: 'FieldValues', module: 'react-hook-form' },
  { name: 'FieldPath', module: 'react-hook-form' },
  { name: 'ControllerProps', module: 'react-hook-form' },
  { name: 'FirebaseOptions', module: 'firebase/app' },
  { name: 'FirebaseApp', module: 'firebase/app' },
  { name: 'Auth', module: 'firebase/auth' },
  { name: 'Firestore', module: 'firebase/firestore' },
  { name: 'TranslationKey', module: '../../i18n' },
]

function walk(dir) {
  const res = []
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === 'public') continue
      res.push(...walk(full))
    } else if (['.ts','.tsx','.js','.jsx'].includes(path.extname(name))) res.push(full)
  }
  return res
}

function ensureImport(file, module, typeName) {
  let txt = fs.readFileSync(file,'utf8')
  // already has the name
  if (new RegExp("\\b"+typeName+"\\b").test(txt) && (new RegExp("from ['\"]"+module+"['\"]").test(txt))) {
    // maybe already imported; check for import type
      if (new RegExp("import\\s+type\\s+\\{[^}]*\\b"+typeName+"\\b[^}]*\\}\\s+from\\s+['\"]"+module+"['\"]").test(txt)) {
        return false
      }
  }

  // find existing import from module
  const importRegex = new RegExp("import\\s+([^;]+)\\s+from\\s+['\"]"+module+"['\"];?")
  const m = importRegex.exec(txt)
  if (m) {
    // add a new `import type { X } from 'module'` line to avoid mixing
    const insertAt = txt.indexOf('\n', m.index + m[0].length) + 1 || 0
    const line = `import type { ${typeName} } from '${module}'\n`
    txt = txt.slice(0, insertAt) + line + txt.slice(insertAt)
    fs.writeFileSync(file, txt, 'utf8')
    return true
  } else {
    // no existing import — add at top after other imports
    const firstImport = txt.search(/import\s.+from\s+['\"]/)
    const line = `import type { ${typeName} } from '${module}'\n`
    if (firstImport === -1) {
      txt = line + txt
    } else {
      // insert after last leading import block
      const imports = txt.match(/^(?:\s*import[\s\S]*?;\s*)+/)
      if (imports) {
        const pos = imports[0].length
        txt = txt.slice(0,pos) + line + txt.slice(pos)
      } else {
        txt = line + txt
      }
    }
    fs.writeFileSync(file, txt, 'utf8')
    return true
  }
}

function main() {
  const files = walk(SRC)
  const changed = []
  for (const f of files) {
    let content = fs.readFileSync(f,'utf8')
    for (const p of patterns) {
      if (new RegExp("\\b"+p.name+"\\b").test(content)) {
        try {
          const ok = ensureImport(f, p.module, p.name)
          if (ok) changed.push(path.relative(ROOT, f) + ` (+${p.name})`)
        } catch (e) {
          console.error('failed to modify', f, e.message)
        }
      }
    }
  }
  console.log('Added imports to', changed.length, 'files')
  for (const c of changed) console.log('  ', c)
}

main()
