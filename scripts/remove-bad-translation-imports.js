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
    const bad = "import type { TranslationKey } from '../../i18n'"
    if (txt.indexOf(bad) !== -1) {
      txt = txt.split('\n').filter(l => l.trim() !== bad).join('\n')
      fs.writeFileSync(f, txt, 'utf8')
      changed.push(path.relative(ROOT, f))
    }
  }
  console.log('Removed bad imports from', changed.length, 'files')
  for (const c of changed) console.log('  ', c)
}

main()
