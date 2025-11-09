// Replace catch (_e) or catch (_err) etc with catch { } (no binding).
// Conservative: operates only on catch clauses with an underscore-prefixed name.
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}', { nodir: true });
for (const fp of files) {
  let txt = fs.readFileSync(fp, 'utf8');
  const orig = txt;
  // Replace patterns like catch (_e) or catch (_err: any)
  txt = txt.replace(/catch\s*\(\s*_[A-Za-z0-9_]*(?:\s*:\s*[A-Za-z0-9_<>\[\]{}\s|,]+)?\s*\)/g, 'catch');
  if (txt !== orig) {
    fs.writeFileSync(fp, txt, 'utf8');
    console.log('Patched', fp);
  }
}
console.log('Done');
