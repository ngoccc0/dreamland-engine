#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')

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

function main() {
  const files = walk(SRC)
  const changed = []
  for (const f of files) {
    let txt = fs.readFileSync(f,'utf8')
    if (txt.includes('TranslationKey') && !/from\s+['"]@\/lib\/i18n['"]/.test(txt)) {
      // add import type at top
      const line = `import type { TranslationKey } from "@/lib/i18n"\n`
      // avoid adding if another import type already brings it from somewhere else
      if (!txt.includes('import type { TranslationKey }')) {
        // insert after initial import block
        const imports = txt.match(/^(?:\s*import[\s\S]*?;\s*)+/)
        if (imports) {
          const pos = imports[0].length
          txt = txt.slice(0,pos) + line + txt.slice(pos)
        } else {
          txt = line + txt
        }
        fs.writeFileSync(f, txt, 'utf8')
        changed.push(path.relative(ROOT, f))
      }
    }
  }
  console.log('Added TranslationKey imports to', changed.length, 'files')
  for (const c of changed) console.log('  ', c)
}

main()
