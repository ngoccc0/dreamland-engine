const fs = require('fs');
const glob = require('glob');

const importLineRegex = /(^|\n)import\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"];?/g;

function processFile(fp) {
  let text = fs.readFileSync(fp, 'utf8');
  const orig = text;
  let m;
  // We will iterate matches and rebuild the file gradually
  const edits = [];
  while ((m = importLineRegex.exec(text)) !== null) {
    const full = m[0];
    const namesRaw = m[2];
    const modulePath = m[3];
    const start = m.index + (m[1] ? 1 : 0);
    // Skip if this is already an `import type` (we only want runtime imports)
    const before = text.slice(Math.max(0, start - 20), start + 6);
    if (/import\s+type/.test(before)) continue;

    const names = namesRaw.split(',').map(s => s.trim());
    const usedNames = names.filter(name => {
      // remove aliasing like `A as B` and check both sides
      const parts = name.split(/\s+as\s+/).map(p => p.trim());
      return parts.some(p => {
        // Occurrences: word boundary search excluding the import line
        const re = new RegExp('\\b' + p + '\\b', 'g');
        // search in file excluding the import line substring
        const idx = text.indexOf(full);
        const beforeText = text.slice(0, idx);
        const afterText = text.slice(idx + full.length);
        return re.test(beforeText) || re.test(afterText);
      });
    });

    if (usedNames.length !== names.length) {
      // Need to replace the import line with only usedNames (or remove entire line if none used)
      if (usedNames.length === 0) {
        edits.push({ start, length: full.length, replacement: '' });
        console.log(`Removing unused import from ${fp}: ${modulePath} (${names.join(', ')})`);
      } else {
        const newLine = full.replace(/\{[^}]+\}/, `{ ${usedNames.join(', ')} }`);
        edits.push({ start, length: full.length, replacement: newLine });
        console.log(`Pruning import in ${fp}: ${modulePath} -> ${usedNames.join(', ')}`);
      }
    }
  }

  if (edits.length > 0) {
    // apply edits in reverse order
    edits.sort((a,b) => b.start - a.start);
    for (const e of edits) {
      text = text.slice(0, e.start) + e.replacement + text.slice(e.start + e.length);
    }
    fs.writeFileSync(fp, text, 'utf8');
  }
}

const files = glob.sync('src/**/*.{ts,tsx}', { nodir: true });
console.log('Scanning', files.length, 'files');
for (const f of files) {
  try { processFile(f); } catch (err) { console.error('ERR', f, err); }
}
console.log('Done');
