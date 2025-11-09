const fs = require('fs');
const path = require('path');

const templatesPath = path.resolve(__dirname, '../src/lib/game/data/narrative-templates.ts');
const content = fs.readFileSync(templatesPath, 'utf8');

// also try to read narrative templates from JSON sample (newer format)
const sampleJsonPath = path.resolve(__dirname, '../src/lib/narrative/data/templates.sample.json');
let sampleJson = null;
if (fs.existsSync(sampleJsonPath)) {
  try { sampleJson = JSON.parse(fs.readFileSync(sampleJsonPath, 'utf8')); } catch(e) { sampleJson = null; }
}

// Find all {{placeholders}} in templates and record their line numbers
const placeholderRegex = /{{\s*([^}]+?)\s*}}/g;
const placeholders = new Map(); // placeholder -> [{line, col}, ...]
content.split('\n').forEach((lineText, idx) => {
  let match;
  while ((match = placeholderRegex.exec(lineText)) !== null) {
    const ph = match[1].trim();
    const list = placeholders.get(ph) || [];
    list.push({ line: idx + 1, col: match.index + 1 });
    placeholders.set(ph, list);
  }
});

// Collect keys that exist in adjectives/features/smells/sounds/sky sections per biome
// We'll do a rough heuristic: gather all keys that are object property names in the file
const propertyRegex = /(?:adjectives|features|smells|sounds|sky)\s*:\s*\{([\s\S]*?)\}\s*,/g;
let propMatch;
const presentKeys = new Set();
while ((propMatch = propertyRegex.exec(content)) !== null) {
  const block = propMatch[1];
  // find property names inside block
  const keyRegex = /["']?([a-zA-Z0-9_\-]+)["']?\s*:\s*(?:\[|\{)/g;
  let km;
  while ((km = keyRegex.exec(block)) !== null) {
    presentKeys.add(km[1]);
  }
}

// Also collect top-level adjectives keys like "adjectives: { "jungle_terrain_desc": [...] }"
const topLevelKeyRegex = /(["']?)([a-zA-Z0-9_\-]+)\1\s*:\s*\[/g; // crude
let tkm;
while ((tkm = topLevelKeyRegex.exec(content)) !== null) {
  presentKeys.add(tkm[2]);
}

// Now check which placeholders are missing
// Helper: simple levenshtein distance for fuzzy suggestions
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

const missing = [];
for (const [ph, locs] of placeholders) {
  // ignore known dynamic placeholders handled elsewhere
  if (ph.startsWith('light_level') || ph.startsWith('temp_') || ph.startsWith('moisture_') || ph.includes('player_') || ph.includes('enemy') || ph.includes('item') || ph.includes('sensory')) continue;
  if (!presentKeys.has(ph)) {
    // compute suggestions
    const suggestions = Array.from(presentKeys)
      .map(k => ({ key: k, dist: levenshtein(ph, k) }))
      .sort((a,b) => a.dist - b.dist)
      .slice(0,3)
      .map(x => x.key);
    missing.push({ placeholder: ph, locations: locs, suggestions });
  }
}

console.log('Total distinct placeholders found:', placeholders.size);
console.log('Total present keys (heuristic):', presentKeys.size);
// Next: validate lexicon JSON coverage per-locale and translation key usage
const lexiconEnPath = path.resolve(__dirname, '../src/lib/narrative/data/lexicon.en.json');
const lexiconViPath = path.resolve(__dirname, '../src/lib/narrative/data/lexicon.vi.json');
let lexEn = null, lexVi = null;
if (fs.existsSync(lexiconEnPath)) lexEn = JSON.parse(fs.readFileSync(lexiconEnPath, 'utf8'));
if (fs.existsSync(lexiconViPath)) lexVi = JSON.parse(fs.readFileSync(lexiconViPath, 'utf8'));

const lexEnKeys = lexEn ? new Set(Object.keys(lexEn)) : new Set();
const lexViKeys = lexVi ? new Set(Object.keys(lexVi)) : new Set();

const placeholderLexMissing = [];
for (const ph of placeholders.keys()) {
  if (ph.startsWith('light_level') || ph.startsWith('temp_') || ph.startsWith('moisture_') || ph.includes('player_') || ph.includes('enemy') || ph.includes('item') || ph.includes('sensory')) continue;
  const missEn = !lexEnKeys.has(ph);
  const missVi = !lexViKeys.has(ph);
  if (missEn || missVi) placeholderLexMissing.push({ placeholder: ph, missEn, missVi });
}

// Collect translation keys used in code (literal usages of t('...') or t("...") )
const srcFiles = fs.readdirSync(path.resolve(__dirname, '../src')).flatMap(function walk(dir) {
  const p = path.resolve(__dirname, '..', dir);
  // simple gather of top-level src files only for speed (we'll glob lib files)
  return [];
});
// Instead of globbing, read all .ts/.tsx under src and grep for t('...') usages
const walkDir = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat && stat.isDirectory()) results = results.concat(walkDir(fp));
    else if (/\.tsx?$/.test(file)) results.push(fp);
  });
  return results;
};
const allSrcFiles = walkDir(path.resolve(__dirname, '../src'));
const tKeyRegex = /t\(\s*['"]([a-zA-Z0-9_\.\-\{\}]+?)['"]\s*(?:,|\))/g;
const usedKeys = new Set();
for (const f of allSrcFiles) {
  const txt = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = tKeyRegex.exec(txt)) !== null) {
    usedKeys.add(m[1]);
  }
}

// Filter out accidental/invalid keys that are only punctuation (false positives)
for (const k of Array.from(usedKeys)) {
  if (!/[a-zA-Z0-9_\-\.\{\}]/.test(k) || /^\W+$/.test(k)) {
    usedKeys.delete(k);
  }
}

// Aggregate locale keys from files in src/lib/locales by parsing en: { ... } and vi: { ... }
const localeDir = path.resolve(__dirname, '../src/lib/locales');
const localeFiles = fs.readdirSync(localeDir).filter(f => f.endsWith('.ts'));
const localeEnKeys = new Set();
const localeViKeys = new Set();
for (const lf of localeFiles) {
  const txt = fs.readFileSync(path.join(localeDir, lf), 'utf8');
  const enIdx = txt.indexOf('en:');
  const viIdx = txt.indexOf('vi:');
  const extractBlockKeys = (startIdx) => {
    if (startIdx === -1) return [];
    let i = startIdx;
    // find first '{'
    while (i < txt.length && txt[i] !== '{') i++;
    if (i >= txt.length) return [];
    let brace = 0; let j = i;
    for (; j < txt.length; j++) {
      if (txt[j] === '{') brace++;
      else if (txt[j] === '}') {
        brace--;
        if (brace === 0) break;
      }
    }
    const block = txt.slice(i+1, j);
    const keyRegex = /['"]?([a-zA-Z0-9_\-]+)['"]?\s*\:/g;
    const keys = [];
    let km;
    while ((km = keyRegex.exec(block)) !== null) keys.push(km[1]);
    return keys;
  };
  extractBlockKeys(enIdx).forEach(k => localeEnKeys.add(k));
  extractBlockKeys(viIdx).forEach(k => localeViKeys.add(k));
}

const missingTranslationKeys = [];
for (const k of usedKeys) {
  if (!localeEnKeys.has(k) || !localeViKeys.has(k)) {
    missingTranslationKeys.push({ key: k, en: localeEnKeys.has(k), vi: localeViKeys.has(k) });
  }
}

// Report results
let hadError = false;
if (missing.length === 0 && placeholderLexMissing.length === 0 && missingTranslationKeys.length === 0) {
  console.log('No missing placeholders or translation keys detected by heuristic.');
  process.exitCode = 0;
} else {
  if (missing.length > 0) {
    console.log('\nMissing placeholders (heuristic):');
    missing.forEach(m => {
      console.log(`\n - ${m.placeholder}`);
      m.locations.forEach(loc => console.log(`    at ${templatesPath}:${loc.line}:${loc.col}`));
      if (m.suggestions && m.suggestions.length > 0) console.log(`    suggestions: ${m.suggestions.join(', ')}`);
    });
    hadError = true;
  }
  if (placeholderLexMissing.length > 0) {
    console.log('\nPlaceholders missing in lexicon per-locale:');
    placeholderLexMissing.forEach(p => console.log(` - ${p.placeholder} | en:${p.missEn ? 'MISSING':'ok'} vi:${p.missVi ? 'MISSING':'ok'}`));
    hadError = true;
  }
  if (missingTranslationKeys.length > 0) {
    console.log('\nTranslation keys used in code missing in locale files:');
    missingTranslationKeys.forEach(m => console.log(` - ${m.key} | en:${m.en ? 'ok':'MISSING'} vi:${m.vi ? 'ok':'MISSING'}`));
    hadError = true;
  }
  if (hadError) {
    console.log('\nHint: run this script as part of CI to catch broken templates and missing localization entries.');
    process.exitCode = 1;
  }
}
