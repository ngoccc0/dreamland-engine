#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const EXT = ['.ts', '.tsx', '.js', '.jsx']

function walk(dir) {
  const res = []
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === 'public') continue
      res.push(...walk(full))
    } else if (EXT.includes(path.extname(name))) {
      res.push(full)
    }
  }
  return res
}

function chooseName(blockText) {
  const counts = { e: 0, error: 0, err: 0 }
  for (const k of Object.keys(counts)) {
    const re = new RegExp('\\b' + k + '\\b','g')
    const m = blockText.match(re)
    counts[k] = m ? m.length : 0
  }
  // prefer most frequent, default to 'error'
  let best = 'error'
  let bestCount = 0
  for (const k of Object.keys(counts)) {
    if (counts[k] > bestCount) { best = k; bestCount = counts[k] }
  }
  return best
}

function processFile(file) {
  let txt = fs.readFileSync(file,'utf8')
  let changed = false
  const catchRegex = /catch\s*(?:\(([^)]*)\))?\s*\{/g
  let m
  const edits = []
  while ((m = catchRegex.exec(txt)) !== null) {
    const start = m.index
    const param = m[1] // maybe undefined
    // find block end by scanning braces
    let i = catchRegex.lastIndex - 1 // position of '{'
    let depth = 0
    for (; i < txt.length; i++) {
      const ch = txt[i]
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          break
        }
      }
    }
    if (i >= txt.length) break
    const block = txt.slice(catchRegex.lastIndex, i) // inside braces
    // check if block references any error-like identifier
    if (/\b(error|e|err)\b/.test(block)) {
      const chosen = chooseName(block)
      // if param missing or is underscore-only, replace
      const fullMatch = m[0]
  const newSig = `catch (${chosen}: any) {`
      // compute absolute positions for replacement
      const sigStart = m.index
      const sigEnd = catchRegex.lastIndex // position after '{'
      // replace only the signature portion
      edits.push({ start: sigStart, end: sigEnd, replacement: newSig })
    }
  }
  if (edits.length) {
    // apply edits in reverse order
    edits.sort((a,b)=>b.start-a.start)
    for (const e of edits) {
      txt = txt.slice(0,e.start) + e.replacement + txt.slice(e.end)
    }
    fs.writeFileSync(file, txt, 'utf8')
    changed = true
  }
  return changed
}

function main() {
  const files = walk(path.join(ROOT, 'src'))
  let changedFiles = []
  for (const f of files) {
    try {
      const ok = processFile(f)
      if (ok) changedFiles.push(path.relative(ROOT, f))
    } catch (err) {
      console.error('failed', f, err.message)
    }
  }
  console.log('Modified files:', changedFiles.length)
  for (const f of changedFiles) console.log('  ', f)
  if (changedFiles.length === 0) process.exit(0)
}

main()
