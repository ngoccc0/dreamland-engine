/**
 * Heuristic converter: changes `import { A, B } from 'x'` to
 * `import type { A, B } from 'x'` when A and B appear to be used
 * only in type positions in the same file.
 *
 * This is best-effort and conservative: it checks for common
 * runtime usage patterns and skips conversion if any usage looks
 * like a value usage. Run `npm run typecheck` after to validate.
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

function isTypeOnlyUsage(name, fileText, importLineIndex) {
  // Find all occurrences of the identifier in the file (excluding the import line)
  const re = new RegExp("\\b" + name + "\\b", 'g');
  let match;
  while ((match = re.exec(fileText)) !== null) {
    const idx = match.index;
    const lineStart = fileText.lastIndexOf('\n', idx) + 1;
    const lineEndIdx = fileText.indexOf('\n', idx);
    const lineEnd = lineEndIdx === -1 ? fileText.length : lineEndIdx;
    // Skip the import line itself
    if (idx >= fileText.indexOf('\n') && idx <= fileText.indexOf('\n') + 2000) {
      // do nothing special
    }
    // Extract a context window around the occurrence
    const ctxStart = Math.max(0, idx - 40);
    const ctxEnd = Math.min(fileText.length, idx + name.length + 40);
    const ctx = fileText.slice(ctxStart, ctxEnd);

    // Common patterns that indicate type usage
    const typePatterns = [
      /:\s*${name}\b/.source.replace('${name}', name),
      /<\s*${name}\b/.source.replace('${name}', name),
      new RegExp('extends\\s+' + name + '\\b'),
      new RegExp('implements\\s+' + name + '\\b'),
      new RegExp('as\\s+' + name + '\\b'),
      new RegExp('typeof\\s+' + name + '\\b'),
      new RegExp('Record<\\s*' + name + '\\b'),
      new RegExp(name + '\\s*\\['), // name[ ... unlikely for type, but keep
      new RegExp(name + '\\s*\\|'),
      new RegExp('\\b' + name + '\\s*,')
    ];

    // Common patterns that indicate value/runtime usage
    const valuePatterns = [
      new RegExp(name + '\\s*\\('), // function call
      new RegExp(name + '\\s*\\.'), // property access
      new RegExp('new\\s+' + name + '\\b'),
      new RegExp(name + '\\s*=') ,
      new RegExp('\\b' + name + '\\s*\\+'),
      new RegExp('\\b' + name + '\\s*-'),
      new RegExp('\\b' + name + '\\s*\\*'),
      new RegExp('\\bconsole\\.' + name + '\\b'),
    ];

    // If any value pattern matches the context, treat as value usage
    for (const vp of valuePatterns) {
      if (vp.test(ctx)) return false;
    }

    // If any type pattern matches the context, consider it type usage and continue
    let matchedType = false;
    for (const tpRaw of typePatterns) {
      const tp = typeof tpRaw === 'string' ? new RegExp(tpRaw) : tpRaw;
      if (tp.test(ctx)) { matchedType = true; break; }
    }

    if (!matchedType) {
      // If it's neither clearly type nor value according to heuristics, be conservative: treat as value usage
      return false;
    }
  }
  // No value-like usages found
  return true;
}

function processFile(filePath) {
  const orig = fs.readFileSync(filePath, 'utf8');
  let text = orig;
  let changed = false;

  // Find import { A, B } from 'x' that are NOT already `import type`
  const importRe = /(^|\n)import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?/g;
  const matches = [];
  let m;
  while ((m = importRe.exec(text)) !== null) {
    const full = m[0];
    const namesRaw = m[2];
    const modulePath = m[3];
    const startIdx = m.index + (m[1] ? 1 : 0);
    // Check if the import already has 'import type' before it
    const before = text.slice(Math.max(0, startIdx - 12), startIdx + 6);
    if (/import\s+type/.test(before)) continue;

    const names = namesRaw.split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
    // Heuristic: skip if any default-like or namespace import involved (we only matched named imports)

    // For each name, determine if it's type-only
    const typeOnlyNames = [];
    for (const name of names) {
      const usedOnlyAsType = isTypeOnlyUsage(name, text, startIdx);
      if (usedOnlyAsType) typeOnlyNames.push(name);
    }

    if (typeOnlyNames.length === names.length && names.length > 0) {
      // Convert the import to `import type { ... } from 'x';`
      const importLine = full;
      const newLine = importLine.replace('import', 'import type');
      text = text.slice(0, startIdx) + newLine + text.slice(startIdx + importLine.length);
      changed = true;
      console.log(`Converted imports to type-only in ${filePath} from module ${modulePath}: ${names.join(', ')}`);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, text, 'utf8');
  }
}

function run() {
  const files = glob.sync('src/**/*.{ts,tsx}', { nodir: true });
  console.log(`Scanning ${files.length} files...`);
  for (const f of files) {
    try {
      processFile(f);
    } catch (err) {
      console.error(`Error processing ${f}:`, err);
    }
  }
  console.log('Done.');
}

run();
