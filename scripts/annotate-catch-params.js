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
  const re = /catch\s*\(\s*(e|err|error)\s*\)\s*\{/g
  for (const f of files) {
    let txt = fs.readFileSync(f,'utf8')
    let newTxt = txt.replace(re, (m, p1) => `catch (${p1}: any) {`)
    if (newTxt !== txt) {
      fs.writeFileSync(f, newTxt, 'utf8')
      changed.push(path.relative(ROOT, f))
    }
  }
  console.log('Annotated catch params in', changed.length, 'files')
  for (const c of changed) console.log('  ', c)
}

main()
