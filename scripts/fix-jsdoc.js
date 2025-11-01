#!/usr/bin/env node
// Simple script to normalize certain non-standard JSDoc block tags into plain text
// and reduce TypeDoc unknown-tag warnings. It edits files in-place under `src/` and `lib/`.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET_DIRS = ['src', 'lib'];
const exts = ['.ts', '.tsx', '.js', '.jsx'];

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

function processFile(file) {
  if (!exts.includes(path.extname(file))) return;
  const rel = path.relative(ROOT, file);
  if (!TARGET_DIRS.some(d => rel.startsWith(d + path.sep))) return;
  let s = fs.readFileSync(file, 'utf8');

  const orig = s;

  // Replace lines like " * @description ..." -> " * ..."
  s = s.replace(/(^\s*\*\s*)@description\s+/gim, '$1');
  s = s.replace(/(^\s*\*\s*)@fileOverview\s+/gim, '$1');

  // Replace '@implements {X}' with 'Implements X.' on same line
  s = s.replace(/@implements\s*\{([^}]+)\}/g, function(_, p1) {
    return 'Implements ' + p1 + '.';
  });

  // Some comments use '@descriptio' broken by line breaks; normalize occurrences
  s = s.replace(/@descriptio\n/gim, '');

  // Remove any remaining unknown block tags commonly used here but not recognized by TypeDoc
  const unknownTags = ['@fileOverview', '@description'];
  for (const t of unknownTags) {
    s = s.replace(new RegExp('(^\\s*\\*\\s*)' + t + '\\b', 'gim'), '$1');
  }

  if (s !== orig) {
    fs.writeFileSync(file, s, 'utf8');
    console.log('Updated', rel);
  }
}

for (const d of TARGET_DIRS) {
  const dir = path.join(ROOT, d);
  if (!fs.existsSync(dir)) continue;
  walk(dir, processFile);
}

console.log('JSDoc normalization complete.');
