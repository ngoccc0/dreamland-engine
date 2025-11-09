// Replace common unused catch/err parameter names with underscore-prefixed versions.
// This script is conservative: it only changes catch clauses and doesn't touch function parameters.
const fs = require('fs');
const glob = require('glob');

function processFile(fp) {
  let text = fs.readFileSync(fp, 'utf8');
  const original = text;
  // Patterns: catch (e), catch (err), catch (error), catch (innerErr), catch (inner_error)
  text = text.replace(/catch\s*\(\s*e\s*\)/g, 'catch (_e)');
  text = text.replace(/catch\s*\(\s*err\s*\)/g, 'catch (_err)');
  text = text.replace(/catch\s*\(\s*error\s*\)/g, 'catch (_error)');
  text = text.replace(/catch\s*\(\s*innerErr\s*\)/g, 'catch (_innerErr)');
  text = text.replace(/catch\s*\(\s*inner_error\s*\)/g, 'catch (_inner_error)');

  if (text !== original) {
    fs.writeFileSync(fp, text, 'utf8');
    console.log('Updated', fp);
  }
}

const files = glob.sync('src/**/*.{ts,tsx}', { nodir: true });
for (const f of files) {
  try { processFile(f); } catch (e) { console.error('err', f, e); }
}
console.log('Done');
